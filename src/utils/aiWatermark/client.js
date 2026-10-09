let worker;
let pending;
let sequence = 0;
let workerType;

export function cancelWatermarkJob() {
  worker?.terminate(); worker = null;
  pending?.reject(new DOMException('Cancelled', 'AbortError')); pending = null;
}

export function processWatermark(mode, pixels, mask, onProgress, options) {
  if (pending) return Promise.reject(new Error('busy'));
  const type = mode === 'invisible' ? 'latent' : 'repair';
  if (worker && workerType !== type) { worker.terminate(); worker = null; }
  if (!worker) {
    worker = type === 'latent' ? new Worker(new URL('./latentWorker.js', import.meta.url), { type: 'module' }) : new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });
    workerType = type;
    worker.onmessage = ({ data }) => {
      if (!pending || pending.id !== data.id) return;
      if (data.stage) { pending.onProgress?.(data); return; }
      const task = pending; pending = null;
      if (data.error) task.reject(new Error(data.error)); else task.resolve(data);
    };
    worker.onerror = () => { const task = pending; pending = null; worker?.terminate(); worker = null; task?.reject(new Error('worker')); };
  }
  return new Promise((resolve, reject) => {
    const id = ++sequence;
    pending = { id, resolve, reject, onProgress };
    // Structured clone preserves the original image and mask for comparison / undo.
    worker.postMessage({ id, mode, pixels, mask, options });
  });
}

export async function readWatermarkImage(file) {
  if (!file || !/\.(png|jpe?g|webp)$/i.test(file.name) || file.size > 25 * 1024 * 1024) throw new Error('file');
  const header = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const png = header.length >= 8 && [137, 80, 78, 71, 13, 10, 26, 10].every((byte, i) => header[i] === byte);
  const jpeg = header[0] === 255 && header[1] === 216 && header[2] === 255;
  const webp = header.length === 12 && [82, 73, 70, 70].every((byte, i) => header[i] === byte) && [87, 69, 66, 80].every((byte, i) => header[i + 8] === byte);
  if (!png && !jpeg && !webp) throw new Error('file');
  const bitmap = await createImageBitmap(file);
  try {
    if (bitmap.width > 8192 || bitmap.height > 8192 || bitmap.width * bitmap.height > 12_000_000) throw new Error('dimensions');
    const canvas = document.createElement('canvas'); canvas.width = bitmap.width; canvas.height = bitmap.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true }); ctx.drawImage(bitmap, 0, 0);
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  } finally { bitmap.close(); }
}

export async function watermarkWebP(pixels) {
  const canvas = document.createElement('canvas'); canvas.width = pixels.width; canvas.height = pixels.height;
  canvas.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(pixels.data), pixels.width, pixels.height), 0, 0);
  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/webp', 1));
  if (!blob || blob.type !== 'image/webp') throw new Error('webp');
  return blob;
}
