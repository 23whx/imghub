import { alphaFromPixels, canonicalGeminiRegion, detectGemini, reverseGemini, maskBounds, inpaintCrop, buildMiganInput, miganOutputPixels, compositePatch } from './core.js';

let sessionPromise;
const templates = new Map();
const base = '/assets/ai-watermark/';

function canvasPixels(pixels) {
  const canvas = new OffscreenCanvas(pixels.width, pixels.height);
  canvas.getContext('2d', { willReadFrequently: true }).putImageData(new ImageData(pixels.data, pixels.width, pixels.height), 0, 0);
  return canvas;
}

async function template(size) {
  if (!templates.has(size)) {
    const response = await fetch(`${base}gemini-${size}.webp`);
    if (!response.ok) throw new Error('assets');
    const bitmap = await createImageBitmap(await response.blob());
    const canvas = new OffscreenCanvas(size, size);
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(bitmap, 0, 0); bitmap.close();
    templates.set(size, alphaFromPixels(ctx.getImageData(0, 0, size, size)));
  }
  return templates.get(size);
}

async function loadSession(progress) {
  if (!sessionPromise) sessionPromise = (async () => {
    const ort = await import('onnxruntime-web/wasm');
    ort.env.wasm.wasmPaths = `${self.location.origin}${base}ort/`;
    // Run inside our worker, single-threaded: no global COOP/COEP headers that
    // would break unrelated CDN images / JSONP tools on this static website.
    ort.env.wasm.numThreads = 1;
    ort.env.wasm.proxy = false;
    progress('model', 0);
    const response = await fetch(`${base}migan.onnx`);
    if (!response.ok) throw new Error('assets');
    const total = 29541096;
    const reader = response.body.getReader();
    const chunks = [];
    let loaded = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      loaded += value.length;
      if (loaded > total) throw new Error('model');
      chunks.push(value); progress('model', Math.round(loaded / total * 100));
    }
    const bytes = new Uint8Array(loaded);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
    if ([...hash].map(x => x.toString(16).padStart(2, '0')).join('') !== 'bb7189b2523b8485d9dd6baa2e7e8bccce4493760daa33ffcd432f667945bf62') throw new Error('model');
    progress('initialize', 100);
    return { ort, session: await ort.InferenceSession.create(bytes, { executionProviders: ['wasm'], graphOptimizationLevel: 'all' }) };
  })().catch(error => { sessionPromise = null; throw error; });
  return sessionPromise;
}

async function inpaint(pixels, mask, progress) {
  const bounds = maskBounds(mask, pixels.width, pixels.height);
  if (!bounds) throw new Error('emptyMask');
  if (bounds.count > pixels.width * pixels.height * 0.25) throw new Error('maskLarge');
  const crop = inpaintCrop(bounds, pixels.width, pixels.height);
  // A long mask must fit wholly in the crop, including very wide panoramas.
  if (crop.x > bounds.x || crop.y > bounds.y || crop.x + crop.size < bounds.x + bounds.w || crop.y + crop.size < bounds.y + bounds.h) throw new Error('maskLarge');
  const source = canvasPixels(pixels);
  const inputCanvas = new OffscreenCanvas(512, 512);
  const ctx = inputCanvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(source, crop.x, crop.y, crop.size, crop.size, 0, 0, 512, 512);
  const inferImage = ctx.getImageData(0, 0, 512, 512);
  const inferMask = new Uint8Array(512 * 512);
  for (let y = 0; y < 512; y++) for (let x = 0; x < 512; x++) {
    const sx = Math.min(pixels.width - 1, crop.x + Math.floor(x * crop.size / 512));
    const sy = Math.min(pixels.height - 1, crop.y + Math.floor(y * crop.size / 512));
    inferMask[y * 512 + x] = mask[sy * pixels.width + sx];
  }
  const { ort, session } = await loadSession(progress);
  progress('inference', 100);
  const tensor = new ort.Tensor('float32', buildMiganInput(inferImage, inferMask), [1, 4, 512, 512]);
  let outputs;
  try {
    outputs = await session.run({ [session.inputNames[0]]: tensor });
    const result = miganOutputPixels(outputs[session.outputNames[0]].data);
    const patchCanvas = new OffscreenCanvas(crop.size, crop.size);
    const patchCtx = patchCanvas.getContext('2d', { willReadFrequently: true });
    patchCtx.drawImage(canvasPixels(result), 0, 0, crop.size, crop.size);
    const patch = patchCtx.getImageData(0, 0, crop.size, crop.size);
    return compositePatch(pixels, patch, mask, crop.x, crop.y);
  } finally { tensor.dispose(); if (outputs) for (const value of Object.values(outputs)) value.dispose(); }
}

self.onmessage = async ({ data: { id, mode, pixels, mask } }) => {
  const progress = (stage, percent = 0) => self.postMessage({ id, stage, percent });
  try {
    let result = pixels, detection = null;
    if (mode === 'gemini') {
      progress('detect');
      const size = canonicalGeminiRegion(pixels.width, pixels.height).w;
      const alpha = await template(size);
      detection = detectGemini(pixels, alpha, size);
      if (detection) result = reverseGemini(pixels, alpha, detection);
    } else if (mode === 'inpaint') result = await inpaint(pixels, mask, progress);
    self.postMessage({ id, result, detection }, [result.data.buffer]);
  } catch (error) {
    const allowed = ['assets', 'model', 'emptyMask', 'maskLarge'];
    self.postMessage({ id, error: allowed.includes(error.message) ? error.message : 'processing' });
  }
};
