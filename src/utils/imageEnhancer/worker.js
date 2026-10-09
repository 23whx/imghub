import { outputSize, tilePlan, tileInput, compositeTile } from './core.js';

const base = '/assets/image-enhancer/';
let ort, session, activeBackend, model;

async function runtime(backend, progress) {
  if (!ort) {
    ort = await import('onnxruntime-web/webgpu');
    ort.env.wasm.wasmPaths = `${self.location.origin}/assets/ai-watermark/ort/`;
    ort.env.wasm.numThreads = 1; ort.env.wasm.proxy = false;
    ort.env.webgpu.powerPreference = 'high-performance';
  }
  if (session && activeBackend === backend) return session;
  if (session) { await session.release(); session = null; }
  if (!model) {
    const manifestResponse = await fetch(base + 'manifest.json');
    if (!manifestResponse.ok) throw new Error('assets');
    const spec = (await manifestResponse.json()).model;
    if (spec.file !== 'realesrgan-general-x4.onnx' || !Number.isInteger(spec.bytes) || spec.bytes < 1 || spec.bytes > 6_000_000) throw new Error('model');
    const response = await fetch(base + spec.file);
    if (!response.ok) throw new Error('assets');
    const reader = response.body.getReader(), bytes = new Uint8Array(spec.bytes); let offset = 0;
    while (true) {
      const {done, value} = await reader.read(); if (done) break;
      if (offset + value.length > bytes.length) throw new Error('model');
      bytes.set(value, offset); offset += value.length; progress('model', Math.round(offset / spec.bytes * 100));
    }
    const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(x=>x.toString(16).padStart(2,'0')).join('');
    if (offset !== spec.bytes || hash !== spec.sha256) throw new Error('model');
    model = bytes;
  }
  progress('initialize');
  session = await ort.InferenceSession.create(model, {executionProviders:[backend],graphOptimizationLevel:'all'});
  activeBackend = backend; return session;
}

async function enhance(pixels, options, backend, progress) {
  const engine = await runtime(backend, progress), dimensions = outputSize(pixels.width, pixels.height, options.scale);
  const result = {...dimensions, data:new Uint8ClampedArray(dimensions.width * dimensions.height * 4)};
  const tiles = tilePlan(pixels.width, pixels.height);
  for (let i = 0; i < tiles.length; i++) {
    const tile = tiles[i], input = new ort.Tensor('float32',tileInput(pixels,tile),[1,3,tile.height,tile.width]); let outputs;
    try {
      outputs = await engine.run({input});
      compositeTile(result, outputs[engine.outputNames[0]].data, pixels, tile, options.scale, options.strength);
      progress('tiles', Math.round((i+1)/tiles.length*100));
    } finally { input.dispose(); if (outputs) for (const output of Object.values(outputs)) output.dispose(); }
  }
  return result;
}

self.onmessage = async ({data:{id,pixels,options}}) => {
  const progress = (stage,percent=0)=>self.postMessage({id,stage,percent});
  const started = performance.now();
  try {
    outputSize(pixels.width,pixels.height,options.scale);
    if (!['auto','webgpu','wasm'].includes(options.backend) || !Number.isFinite(options.strength) || options.strength<0 || options.strength>1) throw new Error('settings');
    progress('device');
    let adapter;
    if (options.backend !== 'wasm') {
      try { adapter = await navigator.gpu?.requestAdapter({powerPreference:'high-performance'}); }
      catch { if (options.backend === 'webgpu') throw new Error('gpu'); }
    }
    if (options.backend === 'webgpu' && !adapter) throw new Error('gpu');
    const software = Boolean(adapter?.isFallbackAdapter || adapter?.info?.isFallbackAdapter);
    let backend = options.backend === 'wasm' || !adapter || (options.backend === 'auto' && software) ? 'wasm' : 'webgpu', result;
    try { result = await enhance(pixels,options,backend,progress); }
    catch (error) {
      if (options.backend !== 'auto' || backend !== 'webgpu' || ['assets','model'].includes(error.message)) throw error;
      progress('fallback'); backend = 'wasm'; result = await enhance(pixels,options,backend,progress);
    }
    self.postMessage({id,result,backend: backend==='webgpu'&&software ? 'software' : backend,seconds:(performance.now()-started)/1000},[result.data.buffer]);
  } catch (error) {
    self.postMessage({id,error:['inputSize','outputSize','settings','assets','model','gpu'].includes(error.message)?error.message:'processing'});
  }
};
