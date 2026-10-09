import { compositeToAspect, pickVideoMime } from './wiggleEngine.js';

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

async function loadGifenc() {
  const mod = await import('gifenc');
  const api = mod?.GIFEncoder ? mod : mod?.default?.GIFEncoder ? mod.default : mod?.default || mod;
  return {
    GIFEncoder: api.GIFEncoder || mod.GIFEncoder,
    quantize: api.quantize || mod.quantize,
    applyPalette: api.applyPalette || mod.applyPalette,
  };
}

/**
 * Render animation frames into GIF.
 * @param {(frameIndex:number, total:number) => HTMLCanvasElement} renderFrame
 * @param {object} options
 */
export async function exportGif(renderFrame, options = {}) {
  const {
    frameCount = 24,
    delayMs = 40,
    aspect = 'original',
    onProgress,
    filename = 'wiggle.gif',
  } = options;

  const { GIFEncoder, quantize, applyPalette } = await loadGifenc();
  const gif = GIFEncoder();
  let palette = null;

  for (let i = 0; i < frameCount; i++) {
    const frameCanvas = renderFrame(i, frameCount);
    const composed = compositeToAspect(frameCanvas, aspect);
    const ctx = composed.getContext('2d', { willReadFrequently: true });
    const { data, width, height } = ctx.getImageData(0, 0, composed.width, composed.height);

    if (!palette) {
      palette = quantize(data, 256);
    }
    const index = applyPalette(data, palette);
    gif.writeFrame(index, width, height, {
      palette,
      delay: delayMs,
      dispose: 1,
    });

    if (onProgress) onProgress((i + 1) / frameCount);
    // Yield to UI
    await new Promise((r) => setTimeout(r, 0));
  }

  gif.finish();
  const bytes = gif.bytes();
  const blob = new Blob([bytes], { type: 'image/gif' });
  downloadBlob(blob, filename);
  return blob;
}

/**
 * Export WebM / MP4 via MediaRecorder while replaying frames on a canvas.
 */
export async function exportVideo(renderFrame, options = {}) {
  const {
    frameCount = 30,
    fps = 20,
    aspect = 'original',
    preferredExt = 'webm',
    onProgress,
    filename,
  } = options;

  const mimeType = pickVideoMime();
  if (!mimeType) {
    throw new Error('MediaRecorder not supported in this browser');
  }

  // Build first frame to size the recording canvas
  const first = compositeToAspect(renderFrame(0, frameCount), aspect);
  const recCanvas = document.createElement('canvas');
  recCanvas.width = first.width;
  recCanvas.height = first.height;
  const recCtx = recCanvas.getContext('2d');
  recCtx.drawImage(first, 0, 0);

  const stream = recCanvas.captureStream(fps);
  const chunks = [];
  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: 4_000_000,
  });

  const done = new Promise((resolve, reject) => {
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size) chunks.push(e.data);
    };
    recorder.onerror = (e) => reject(e.error || e);
    recorder.onstop = () => {
      const type = mimeType.split(';')[0];
      resolve(new Blob(chunks, { type }));
    };
  });

  recorder.start();

  const frameDuration = 1000 / fps;
  for (let i = 0; i < frameCount; i++) {
    const frame = compositeToAspect(renderFrame(i, frameCount), aspect);
    recCtx.clearRect(0, 0, recCanvas.width, recCanvas.height);
    recCtx.drawImage(frame, 0, 0);
    if (onProgress) onProgress((i + 1) / frameCount);
    await new Promise((r) => setTimeout(r, frameDuration));
  }

  // Small tail so last frame is captured
  await new Promise((r) => setTimeout(r, frameDuration * 2));
  recorder.stop();
  stream.getTracks().forEach((t) => t.stop());

  const blob = await done;
  // Most browsers only encode WebM; use real container extension
  const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
  const base =
    (filename || 'wiggle').replace(/\.(gif|png|webm|mp4)$/i, '') || 'wiggle';
  const name = `${base}.${ext}`;
  downloadBlob(blob, name);
  return { blob, mimeType, ext };
}
