import { validateDimensions, planTiles, mergeLines } from './core.js';

export async function readOCRImage(file) {
  if (!file || file.size > 25 * 1024 * 1024 || !/\.(png|jpe?g|webp)$/i.test(file.name)) throw new Error('file');
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const png = [137,80,78,71,13,10,26,10].every((b,i)=>bytes[i]===b);
  const jpg = bytes[0]===255 && bytes[1]===216 && bytes[2]===255;
  const webp = [82,73,70,70].every((b,i)=>bytes[i]===b) && [87,69,66,80].every((b,i)=>bytes[i+8]===b);
  if (!png && !jpg && !webp) throw new Error('file');
  const bitmap = await createImageBitmap(file);
  try {
    validateDimensions(bitmap.width, bitmap.height);
    const canvas = document.createElement('canvas'); canvas.width = bitmap.width; canvas.height = bitmap.height;
    const ctx = canvas.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.drawImage(bitmap,0,0);
    return canvas;
  } finally { bitmap.close(); }
}

// This adapter uses the untouched, self-hosted official SDK worker and its pinned
// 0.4.2 transport contract. Avoid bundling a second OpenCV/ORT on the main thread.
export class OCRClient {
  constructor() { this.worker = null; this.pending = new Map(); this.sequence = 0; this.backend = null; this.controller = null; this.models = null; }
  stopWorker() {
    this.worker?.terminate(); this.worker = null; this.backend = null;
    for (const p of this.pending.values()) { clearTimeout(p.timer); p.reject(new DOMException('Cancelled','AbortError')); }
    this.pending.clear();
  }
  cancel() { this.controller?.abort(); this.stopWorker(); }
  request(type, payload, transfer = []) {
    const worker = this.worker, requestId = ++this.sequence;
    return new Promise((resolve,reject)=> {
      const timer = setTimeout(()=>{this.pending.delete(requestId); reject(new Error('timeout')); this.cancel();},120000);
      this.pending.set(requestId,{resolve,reject,timer});
      try { worker.postMessage({kind:'worker-transport-request',requestId,type,payload},transfer); }
      catch (error) { clearTimeout(timer); this.pending.delete(requestId); reject(error); }
    });
  }
  async loadModels(signal, progress) {
    if (this.models) return this.models;
    const response = await fetch('/assets/ocr/manifest.json', {signal});
    if (!response.ok) throw new Error('assets');
    const manifest = await response.json(), models = {};
    if (manifest.sdk !== '0.4.2' || manifest.runtime !== '1.24.3') throw new Error('assets');
    let loaded = 0;
    const total = Object.values(manifest.models).reduce((n,m)=>n+m.bytes,0);
    for (const role of ['det','rec']) {
      const spec = manifest.models[role];
      if (!/^PP-OCRv5_mobile_(det|rec)\.tar$/.test(spec.file) || !Number.isInteger(spec.bytes) || spec.bytes < 1 || spec.bytes > 30_000_000) throw new Error('assets');
      const r = await fetch('/assets/ocr/'+spec.file, {signal}); if (!r.ok) throw new Error('assets');
      const reader = r.body.getReader(), bytes = new Uint8Array(spec.bytes); let offset = 0;
      while (true) {
        const {done,value} = await reader.read(); if (done) break;
        if (offset+value.length > bytes.length) throw new Error('assets');
        bytes.set(value,offset); offset += value.length; loaded += value.length; progress({stage:'model',percent:Math.round(loaded/total*100)});
      }
      const digest = [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(b=>b.toString(16).padStart(2,'0')).join('');
      if (offset !== spec.bytes || digest !== spec.sha256) throw new Error('assets');
      models[role] = {...spec,bytes};
    }
    signal.throwIfAborted(); this.models = models; return models;
  }
  async initialize(backend, signal, progress) {
    if (this.worker && this.backend === backend) return;
    this.stopWorker();
    const models = await this.loadModels(signal,progress); signal.throwIfAborted();
    progress({stage:'initialize'});
    const urls = Object.fromEntries(Object.entries(models).map(([role,m])=>[role,URL.createObjectURL(new Blob([m.bytes]))]));
    const worker = new Worker('/assets/ocr/paddleocr-worker.js',{type:'module'});
    this.worker = worker;
    worker.onmessage = ({data})=> {
      if (this.worker !== worker) return;
      if (data.kind !== 'worker-transport-response') return;
      const task = this.pending.get(data.requestId); if (!task) return;
      this.pending.delete(data.requestId); clearTimeout(task.timer);
      if (data.status==='success') task.resolve(data.payload); else task.reject(new Error(data.error?.message || 'processing'));
    };
    worker.onerror = ()=> {
      if (this.worker !== worker) return;
      for (const p of this.pending.values()) { clearTimeout(p.timer); p.reject(new Error('worker')); }
      this.pending.clear(); this.stopWorker();
    };
    try {
      await this.request('init',{options:{
        ortOptions:{backend,wasmPaths:new URL('/assets/ocr/ort/',location.origin).href,numThreads:1,proxy:false},
        pipelineConfig:{pipelineName:'OCR',raw:{},warnings:[],unsupportedFeatures:[],
          modelSelection:{textDetectionModelName:models.det.name,textRecognitionModelName:models.rec.name},
          assets:{det:{url:urls.det},rec:{url:urls.rec}},pipelineBatchSize:1,textDetectionBatchSize:1,textRecognitionBatchSize:1,
          runtimeDefaults:{text_det_limit_side_len:1536,text_det_limit_type:'max',text_det_max_side_limit:2048,text_det_thresh:0.3,text_det_box_thresh:0.5,text_det_unclip_ratio:1.6,text_rec_score_thresh:0.35}
        }
      }});
      signal.throwIfAborted(); this.backend = backend;
    } finally { Object.values(urls).forEach(URL.revokeObjectURL); }
  }
  async recognize(canvas, {backend='auto',smallText=true}={}, progress=()=>{}) {
    if (this.controller && !this.controller.signal.aborted) throw new Error('busy');
    const controller = new AbortController(); this.controller = controller; const {signal}=controller;
    const start = performance.now();
    try {
      validateDimensions(canvas.width,canvas.height);
      let adapter;
      if (backend!=='wasm') { try {adapter=await navigator.gpu?.requestAdapter();} catch {} }
      if (backend==='webgpu'&&!adapter) throw new Error('gpu');
      const software = adapter?.isFallbackAdapter || adapter?.info?.isFallbackAdapter;
      let selected = backend==='wasm' || !adapter || backend==='auto'&&software ? 'wasm':'webgpu';
      const run = async () => {
        await this.initialize(selected,signal,progress);
        const tiles = planTiles(canvas.width,canvas.height), items=[]; let runtime;
        for (let i=0;i<tiles.length;i++) {
          signal.throwIfAborted(); const tile=tiles[i];
          progress({stage:'recognize',current:i+1,total:tiles.length});
          const scale = smallText && Math.max(tile.width,tile.height)<1100 ? Math.min(2,1100/Math.max(tile.width,tile.height)):1;
          const crop = document.createElement('canvas'); crop.width=Math.round(tile.width*scale); crop.height=Math.round(tile.height*scale);
          crop.getContext('2d').drawImage(canvas,tile.x,tile.y,tile.width,tile.height,0,0,crop.width,crop.height);
          const bitmap = await createImageBitmap(crop);
          if (signal.aborted) { bitmap.close(); signal.throwIfAborted(); }
          const [result] = await this.request('predict',{sources:[{kind:'imageBitmap',imageBitmap:bitmap}],params:{}},[bitmap]);
          runtime=result.runtime;
          items.push(...result.items.map(item=>({...item,poly:item.poly.map(([x,y])=>[x*tile.width/crop.width+tile.x,y*tile.height/crop.height+tile.y])})));
        }
        return {items:mergeLines(items),runtime,seconds:(performance.now()-start)/1000,tiles:tiles.length};
      };
      try { return await run(); }
      catch (error) {
        if (signal.aborted || backend!=='auto' || selected!=='webgpu' || error.message==='assets') throw error;
        progress({stage:'fallback'}); this.stopWorker(); selected='wasm'; return await run();
      }
    } finally { if(this.controller===controller)this.controller = null; }
  }
}
