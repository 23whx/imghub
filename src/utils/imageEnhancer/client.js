// Reuse the site's validated PNG/JPEG/WebP decoder and WebP encoder.
export { readWatermarkImage as readImage, watermarkWebP as encodeWebP } from '../aiWatermark/client.js';
let worker, pending, sequence = 0;
export function cancelEnhancement() {
  worker?.terminate(); worker=null;
  pending?.reject(new DOMException('Cancelled','AbortError')); pending=null;
}
export function enhanceImage(pixels,options,onProgress) {
  if (pending) return Promise.reject(new Error('busy'));
  if (!worker) {
    worker = new Worker(new URL('./worker.js',import.meta.url),{type:'module'});
    worker.onmessage = ({data}) => {
      if (!pending || data.id!==pending.id) return;
      if (data.stage) { pending.onProgress?.(data); return; }
      const task=pending; pending=null; data.error?task.reject(new Error(data.error)):task.resolve(data);
    };
    worker.onerror=()=>{ const task=pending; pending=null; worker?.terminate();worker=null;task?.reject(new Error('processing')); };
  }
  return new Promise((resolve,reject)=>{
    const id=++sequence; pending={id,resolve,reject,onProgress};
    worker.postMessage({id,pixels,options});
  });
}
