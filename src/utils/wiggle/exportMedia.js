import { compositeToAspect, pickVideoMime } from '../wiggleEngine.js';

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2500);
}

/**
 * Presentation view from purupurumaker recording modes:
 * - original: as rendered
 * - crop: zoom ~1.12 and center-crop (hide edge gaps when mesh moves)
 * - camera-follow: offset by -frameOffset so content stays centered
 */
export function applyPresentationView(sourceCanvas, view = 'original', frameOffset = { x: 0, y: 0 }) {
  const w = sourceCanvas.width;
  const h = sourceCanvas.height;
  if (view === 'original' || !view) {
    const out = document.createElement('canvas');
    out.width = w;
    out.height = h;
    const ctx = out.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(sourceCanvas, 0, 0);
    return out;
  }

  const out = document.createElement('canvas');
  out.width = w;
  out.height = h;
  const ctx = out.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.fillStyle = '#faf5f2';
  ctx.fillRect(0, 0, w, h);

  if (view === 'crop') {
    const zoom = 1.14;
    const dw = w * zoom;
    const dh = h * zoom;
    ctx.drawImage(sourceCanvas, (w - dw) / 2, (h - dh) / 2, dw, dh);
    return out;
  }

  if (view === 'camera-follow') {
    // frameOffset is in mesh units; map roughly to pixels via canvas size / 2 span
    const px = -(frameOffset?.x || 0) * (w * 0.45);
    const py = -(frameOffset?.y || 0) * (h * 0.45);
    ctx.drawImage(sourceCanvas, px, py);
    return out;
  }

  ctx.drawImage(sourceCanvas, 0, 0);
  return out;
}

async function loadGifenc() {
  // Resolved to ESM via vite alias (package "browser" field points at broken CJS).
  const mod = await import('gifenc');
  const api = mod?.GIFEncoder ? mod : mod?.default?.GIFEncoder ? mod.default : mod?.default || mod;
  const GIFEncoder = api.GIFEncoder || mod.GIFEncoder;
  const quantize = api.quantize || mod.quantize;
  const applyPalette = api.applyPalette || mod.applyPalette;
  if (typeof GIFEncoder !== 'function' || typeof quantize !== 'function' || typeof applyPalette !== 'function') {
    throw new Error('gifenc ESM exports missing (GIFEncoder/quantize/applyPalette)');
  }
  return { GIFEncoder, quantize, applyPalette };
}

/**
 * @param {(i:number,n:number)=>HTMLCanvasElement|Promise<HTMLCanvasElement>} renderFrame
 */
export async function exportGif(renderFrame, options = {}) {
  const {
    frameCount = 60,
    delayMs = 50,
    aspect = 'original',
    presentation = 'original',
    onProgress,
    filename = 'wiggle.gif',
    autoDownload = true,
  } = options;
  const { GIFEncoder, quantize, applyPalette } = await loadGifenc();
  const gif = GIFEncoder();
  let palette = null;

  for (let i = 0; i < frameCount; i++) {
    const raw = await renderFrame(i, frameCount);
    // renderFrame may return { canvas, frameOffset } or canvas
    const frameCanvas = raw?.canvas || raw;
    const frameOffset = raw?.frameOffset || { x: 0, y: 0 };
    const presented = applyPresentationView(frameCanvas, presentation, frameOffset);
    const composed = compositeToAspect(presented, aspect);
    // Mild scale-down for GIF palette stability if huge
    let target = composed;
    const maxGifEdge = 720;
    const edge = Math.max(composed.width, composed.height);
    if (edge > maxGifEdge) {
      const s = maxGifEdge / edge;
      target = document.createElement('canvas');
      target.width = Math.round(composed.width * s);
      target.height = Math.round(composed.height * s);
      const tctx = target.getContext('2d');
      tctx.imageSmoothingEnabled = true;
      tctx.imageSmoothingQuality = 'high';
      tctx.drawImage(composed, 0, 0, target.width, target.height);
    }
    const ctx = target.getContext('2d', { willReadFrequently: true });
    const { data, width, height } = ctx.getImageData(0, 0, target.width, target.height);
    // Rebuild palette every ~12 frames so motion stays colorful
    if (!palette || i % 12 === 0) palette = quantize(data, 256);
    const index = applyPalette(data, palette);
    gif.writeFrame(index, width, height, {
      palette,
      delay: delayMs,
      dispose: 1,
    });
    if (onProgress) onProgress((i + 1) / frameCount);
    await new Promise((r) => setTimeout(r, 0));
  }
  gif.finish();
  const blob = new Blob([gif.bytes()], { type: 'image/gif' });
  if (autoDownload) downloadBlob(blob, filename);
  return { blob, filename, mimeType: 'image/gif', ext: 'gif' };
}

function normalizeFrame(raw) {
  if (raw?.canvas) return raw;
  return { canvas: raw, frameOffset: { x: 0, y: 0 } };
}

export async function exportVideo(renderFrame, options = {}) {
  const {
    frameCount = 60,
    fps = 20,
    aspect = 'original',
    presentation = 'original',
    onProgress,
    filename = 'wiggle.webm',
    preferMp4 = false,
    autoDownload = true,
  } = options;

  // Prefer mp4 when requested (Safari/some Chromium); else webm/vp9-friendly pick.
  let mimeType = null;
  if (preferMp4) {
    const candidates = [
      'video/mp4;codecs=avc1.42E01E',
      'video/mp4',
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm',
    ];
    mimeType = candidates.find((m) => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported?.(m)) || null;
  }
  if (!mimeType) mimeType = pickVideoMime();
  if (!mimeType) throw new Error('MediaRecorder unsupported');

  const firstRaw = normalizeFrame(await renderFrame(0, frameCount));
  const first = compositeToAspect(
    applyPresentationView(firstRaw.canvas, presentation, firstRaw.frameOffset),
    aspect
  );
  const recCanvas = document.createElement('canvas');
  recCanvas.width = first.width;
  recCanvas.height = first.height;
  const recCtx = recCanvas.getContext('2d');
  recCtx.drawImage(first, 0, 0);

  const stream = recCanvas.captureStream(fps);
  const chunks = [];
  const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 8_000_000 });
  const done = new Promise((resolve, reject) => {
    recorder.ondataavailable = (e) => {
      if (e.data?.size) chunks.push(e.data);
    };
    recorder.onerror = (e) => reject(e.error || e);
    recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType.split(';')[0] }));
  });

  recorder.start();
  const frameDuration = 1000 / fps;
  for (let i = 0; i < frameCount; i++) {
    const raw = normalizeFrame(await renderFrame(i, frameCount));
    const frame = compositeToAspect(
      applyPresentationView(raw.canvas, presentation, raw.frameOffset),
      aspect
    );
    recCtx.clearRect(0, 0, recCanvas.width, recCanvas.height);
    recCtx.drawImage(frame, 0, 0);
    if (onProgress) onProgress((i + 1) / frameCount);
    await new Promise((r) => setTimeout(r, frameDuration));
  }
  await new Promise((r) => setTimeout(r, frameDuration * 2));
  recorder.stop();
  stream.getTracks().forEach((t) => t.stop());
  const blob = await done;
  const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
  const base = filename.replace(/\.(gif|png|webm|mp4)$/i, '') || 'wiggle';
  const outName = `${base}.${ext}`;
  if (autoDownload) downloadBlob(blob, outName);
  return { blob, ext, mimeType, filename: outName };
}

export { downloadBlob, compositeToAspect, pickVideoMime };
