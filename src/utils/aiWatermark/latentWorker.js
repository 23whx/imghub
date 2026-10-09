import { reconstructionSize, vaeInput, perturbLatents, vaeOutput, restoreAlpha, pixelQuality } from './latentCore.js';

const base = '/assets/ai-watermark/';
let sessions, ort, selectedBackend, modelBytes;

async function fetchModels(progress) {
  if (modelBytes) return modelBytes;
  const response = await fetch(`${base}taesd-manifest.json`);
  if (!response.ok) throw new Error('assets');
  const manifest = await response.json(), models = {};
  const total = manifest.models.encoder.bytes + manifest.models.decoder.bytes;
  let loaded = 0;
  for (const name of ['encoder', 'decoder']) {
    const spec = manifest.models[name];
    if (spec.file !== `taesd-${name}.onnx` || !Number.isInteger(spec.bytes) || spec.bytes > 6_000_000) throw new Error('model');
    const response = await fetch(`${base}${spec.file}`);
    if (!response.ok) throw new Error('assets');
    const reader = response.body.getReader(), bytes = new Uint8Array(spec.bytes);
    let offset = 0;
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      if (offset + value.length > bytes.length) throw new Error('model');
      bytes.set(value, offset); offset += value.length; loaded += value.length;
      progress('vaeModel', Math.round(loaded / total * 100));
    }
    const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(x => x.toString(16).padStart(2, '0')).join('');
    if (offset !== spec.bytes || hash !== spec.sha256) throw new Error('model');
    models[name] = bytes;
  }
  modelBytes = models; return models;
}

async function runtime(backend, progress) {
  if (!ort) {
    ort = await import('onnxruntime-web/webgpu');
    ort.env.wasm.wasmPaths = `${self.location.origin}${base}ort/`;
    ort.env.wasm.numThreads = 1; ort.env.wasm.proxy = false;
    ort.env.webgpu.powerPreference = 'high-performance';
  }
  if (sessions && selectedBackend === backend) return sessions;
  if (sessions) { for (const session of Object.values(sessions)) await session.release(); sessions = null; }
  const models = await fetchModels(progress);
  progress('vaeInitialize');
  const created = {};
  try {
    for (const name of ['encoder', 'decoder']) created[name] = await ort.InferenceSession.create(models[name], { executionProviders: [backend], graphOptimizationLevel: 'all' });
    sessions = created; selectedBackend = backend; return sessions;
  } catch (error) { for (const session of Object.values(created)) await session.release(); throw error; }
}

function canvasOf(pixels) {
  const canvas = new OffscreenCanvas(pixels.width, pixels.height);
  canvas.getContext('2d').putImageData(new ImageData(pixels.data, pixels.width, pixels.height), 0, 0);
  return canvas;
}

async function reconstruct(pixels, options, backend, progress) {
  const sessions = await runtime(backend, progress);
  // Explicit bounded working resolution prevents a full-resolution photo from
  // allocating unbounded activation buffers. Export retains original dimensions.
  const dimensions = reconstructionSize(pixels.width, pixels.height, options.maxEdge);
  const canvas = new OffscreenCanvas(dimensions.width, dimensions.height), ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(canvasOf(pixels), 0, 0, dimensions.contentWidth, dimensions.contentHeight);
  // Extend edge pixels into tensor padding instead of introducing a white edge.
  if (canvas.width > dimensions.contentWidth) ctx.drawImage(canvas, dimensions.contentWidth - 1, 0, 1, dimensions.contentHeight, dimensions.contentWidth, 0, canvas.width - dimensions.contentWidth, dimensions.contentHeight);
  if (canvas.height > dimensions.contentHeight) ctx.drawImage(canvas, 0, dimensions.contentHeight - 1, canvas.width, 1, 0, dimensions.contentHeight, canvas.width, canvas.height - dimensions.contentHeight);
  const input = new ort.Tensor('float32', vaeInput(ctx.getImageData(0, 0, canvas.width, canvas.height)), [1, 3, canvas.height, canvas.width]);
  let encoded, perturbed, decoded;
  try {
    progress('vaeEncode');
    encoded = await sessions.encoder.run({ input });
    const latent = encoded[sessions.encoder.outputNames[0]];
    perturbed = new ort.Tensor('float32', perturbLatents(latent.data, options.strength, options.seed), latent.dims);
    progress('vaeDecode');
    decoded = await sessions.decoder.run({ input: perturbed });
    const output = decoded[sessions.decoder.outputNames[0]];
    const patch = vaeOutput(output.data, canvas.width, canvas.height);
    const full = new OffscreenCanvas(pixels.width, pixels.height), fullCtx = full.getContext('2d', { willReadFrequently: true });
    fullCtx.drawImage(canvasOf(patch), 0, 0, dimensions.contentWidth, dimensions.contentHeight, 0, 0, pixels.width, pixels.height);
    const result = restoreAlpha(pixels, fullCtx.getImageData(0, 0, pixels.width, pixels.height));
    return { result, dimensions, psnr: pixelQuality(pixels, result) };
  } finally {
    input.dispose(); perturbed?.dispose();
    if (encoded) for (const tensor of Object.values(encoded)) tensor.dispose();
    if (decoded) for (const tensor of Object.values(decoded)) tensor.dispose();
  }
}

self.onmessage = async ({ data: { id, pixels, options } }) => {
  const progress = (stage, percent = 0) => self.postMessage({ id, stage, percent });
  const started = performance.now();
  try {
    if (!['auto', 'webgpu', 'wasm'].includes(options.backend)) throw new Error('settings');
    // Validate controls before model downloads or GPU allocation.
    reconstructionSize(pixels.width, pixels.height, options.maxEdge);
    perturbLatents(new Float32Array(0), options.strength, options.seed);
    progress('gpuCheck');
    let adapter;
    if (options.backend !== 'wasm') {
      try { adapter = await navigator.gpu?.requestAdapter({ powerPreference: 'high-performance' }); }
      catch { if (options.backend === 'webgpu') throw new Error('gpuUnavailable'); }
    }
    if (options.backend === 'webgpu' && !adapter) throw new Error('gpuUnavailable');
    const software = Boolean(adapter?.isFallbackAdapter || adapter?.info?.isFallbackAdapter);
    let backend = options.backend === 'wasm' || !adapter || (options.backend === 'auto' && software) ? 'wasm' : 'webgpu';
    let data;
    try { data = await reconstruct(pixels, options, backend, progress); }
    catch (error) {
      if (options.backend !== 'auto' || backend !== 'webgpu' || ['assets', 'model', 'settings'].includes(error.message)) throw error;
      progress('gpuFallback'); backend = 'wasm';
      data = await reconstruct(pixels, options, backend, progress);
    }
    self.postMessage({ id, ...data, backend: backend === 'webgpu' && software ? 'webgpu-software' : backend, seconds: (performance.now() - started) / 1000 }, [data.result.data.buffer]);
  } catch (error) {
    const allowed = ['assets', 'model', 'settings', 'gpuUnavailable'];
    self.postMessage({ id, error: allowed.includes(error.message) ? error.message : 'reconstruction' });
  }
};
