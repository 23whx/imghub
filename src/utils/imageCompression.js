import { optimizePng } from './pngCompression.js';
export const COMPRESSION_LIMITS = { files: 50, fileBytes: 50 * 1024 * 1024, batchBytes: 200 * 1024 * 1024, sourcePixels: 80 * 1024 * 1024, canvasPixels: 32 * 1024 * 1024, side: 16384, zipBytes: 256 * 1024 * 1024 };
export const IMAGE_MIMES = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
const aborted = signal => { if (signal?.aborted) throw new DOMException('Cancelled', 'AbortError'); };

export function sniffImage(bytes) {
  const text = (offset, size) => String.fromCharCode(...bytes.subarray(offset, offset + size));
  if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return 'jpg';
  if ([137, 80, 78, 71, 13, 10, 26, 10].every((value, i) => bytes[i] === value)) return 'png';
  if (text(0, 4) === 'RIFF' && text(8, 4) === 'WEBP') return 'webp';
  throw new Error('format');
}

export function validateSource(width, height) {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || width > COMPRESSION_LIMITS.side || height > COMPRESSION_LIMITS.side || width * height > COMPRESSION_LIMITS.sourcePixels) throw new Error('dimensions');
}

export function compressionSettings(input) {
  const settings = { format: input.format || 'auto', mode: input.mode || 'quality', quality: Number(input.quality ?? .8), maxEdge: Number(input.maxEdge ?? 0), targetKB: Number(input.targetKB ?? 300), allowResize: input.allowResize !== false };
  if (!['auto', 'jpg', 'png', 'webp'].includes(settings.format) || !['quality', 'target'].includes(settings.mode) || !Number.isFinite(settings.quality) || settings.quality < .1 || settings.quality > 1 || input.maxEdge === '' || !Number.isInteger(settings.maxEdge) || settings.maxEdge < 0 || settings.maxEdge > 8192 || (settings.mode === 'target' && (!Number.isInteger(settings.targetKB) || settings.targetKB < 1 || settings.targetKB > 10240))) throw new Error('settings');
  return settings;
}

export function outputDimensions(width, height, maxEdge = 0) {
  const scale = maxEdge > 0 ? Math.min(1, maxEdge / Math.max(width, height)) : 1;
  const size = { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
  if (size.width > 8192 || size.height > 8192 || size.width * size.height > COMPRESSION_LIMITS.canvasPixels) throw new Error('resize');
  return size;
}

export function hasTransparency(data) { for (let i = 3; i < data.length; i += 4) if (data[i] < 255) return true; return false; }

export function downloadName(name, extension) {
  const base = String(name).replace(/\.[^.]+$/, '').replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').trim().slice(0, 120) || 'image';
  return `${base}-compressed.${extension}`;
}
export function uniqueNames(names) {
  const used = new Set();
  return names.map(name => {
    const split = name.lastIndexOf('.'), base = split < 0 ? name : name.slice(0, split), extension = split < 0 ? '' : name.slice(split);
    let candidate = name, index = 2;
    while (used.has(candidate.toLowerCase())) candidate = `${base} (${index++})${extension}`;
    used.add(candidate.toLowerCase()); return candidate;
  });
}

async function inspectFile(file, signal) {
  if (!file.size || file.size > COMPRESSION_LIMITS.fileBytes) throw new Error('size');
  aborted(signal);
  const header = new Uint8Array(await file.slice(0, 64).arrayBuffer()), format = sniffImage(header);
  if (format === 'jpg') {
    const bytes = new Uint8Array(await file.slice(0, 256 * 1024).arrayBuffer());
    let offset = 2;
    while (offset + 9 <= bytes.length && bytes[offset] === 255) {
      const marker = bytes[offset + 1];
      if (marker === 255) { offset++; continue; }
      if (marker === 218 || marker === 217) break;
      if (marker === 1 || (marker >= 208 && marker <= 215)) { offset += 2; continue; }
      const length = bytes[offset + 2] * 256 + bytes[offset + 3]; if (length < 2) throw new Error('decode');
      if ([192, 193, 194, 195, 197, 198, 199, 201, 202, 203, 205, 206, 207].includes(marker)) { validateSource(bytes[offset + 7] * 256 + bytes[offset + 8], bytes[offset + 5] * 256 + bytes[offset + 6]); break; }
      offset += length + 2;
    }
  } else if (format === 'png') {
    if (header.length < 24) throw new Error('decode');
    const view = new DataView(header.buffer); validateSource(view.getUint32(16), view.getUint32(20));
    // Animation control can follow metadata chunks, so read chunk headers rather than a fixed prefix.
    let offset = 8;
    while (offset + 12 <= file.size) {
      aborted(signal);
      const chunk = new Uint8Array(await file.slice(offset, offset + 8).arrayBuffer());
      const length = new DataView(chunk.buffer).getUint32(0), type = String.fromCharCode(...chunk.subarray(4, 8));
      if (type === 'acTL') throw new Error('animation');
      if (type === 'IDAT' || type === 'IEND') break;
      if (offset + length + 12 > file.size) throw new Error('decode');
      offset += length + 12;
    }
  } else if (format === 'webp' && String.fromCharCode(...header.subarray(12, 16)) === 'VP8X') {
    if (header[20] & 2) throw new Error('animation');
    const uint24 = offset => header[offset] + (header[offset + 1] << 8) + (header[offset + 2] << 16);
    validateSource(uint24(24) + 1, uint24(27) + 1);
  }
  return format;
}

function decodeFile(file, signal) {
  return new Promise((resolve, reject) => {
    aborted(signal);
    const image = new Image(), url = URL.createObjectURL(file);
    const cleanup = () => { clearTimeout(timer); signal?.removeEventListener('abort', cancel); image.onload = image.onerror = null; URL.revokeObjectURL(url); };
    const cancel = () => { cleanup(); image.src = ''; reject(new DOMException('Cancelled', 'AbortError')); };
    const timer = setTimeout(() => { cleanup(); image.src = ''; reject(new Error('decode')); }, 30000);
    image.onload = () => { cleanup(); try { validateSource(image.naturalWidth, image.naturalHeight); resolve(image); } catch (error) { image.src = ''; reject(error); } };
    image.onerror = () => { cleanup(); image.src = ''; reject(new Error('decode')); };
    signal?.addEventListener('abort', cancel, { once: true }); image.src = url;
  });
}

export async function inspectImage(file, signal) {
  const format = await inspectFile(file, signal), image = await decodeFile(file, signal);
  try { return { format, width: image.naturalWidth, height: image.naturalHeight }; }
  finally { image.src = ''; }
}

function encode(canvas, format, quality, signal) {
  aborted(signal);
  return new Promise((resolve, reject) => canvas.toBlob(blob => {
    try { aborted(signal); if (!blob) throw new Error('encode'); if (blob.type !== IMAGE_MIMES[format]) throw new Error('unsupported'); resolve(blob); }
    catch (error) { reject(error); }
  }, IMAGE_MIMES[format], quality));
}

// Search the highest encoder quality fitting the requested size. PNG quality is fixed.
export async function searchQuality(encoder, targetBytes, maxQuality, lossy = true, signal) {
  const high = await encoder(maxQuality); aborted(signal);
  if (high.size <= targetBytes || !lossy) return { blob: high, quality: maxQuality };
  let lowQ = .05, highQ = maxQuality;
  const low = await encoder(lowQ); aborted(signal);
  if (low.size > targetBytes) return { blob: low, quality: lowQ };
  let best = { blob: low, quality: lowQ };
  for (let i = 0; i < 7; i++) {
    const quality = (lowQ + highQ) / 2, blob = await encoder(quality); aborted(signal);
    if (blob.size <= targetBytes) { lowQ = quality; best = { blob, quality }; } else highQ = quality;
  }
  return best;
}

export async function compressImage(file, input, signal) {
  const settings = compressionSettings(input), sourceFormat = await inspectFile(file, signal), image = await decodeFile(file, signal);
  const canvas = document.createElement('canvas');
  try {
    let dimensions;
    try { dimensions = outputDimensions(image.naturalWidth, image.naturalHeight, settings.maxEdge); }
    catch (error) {
      if (settings.mode !== 'target' || !settings.allowResize || error.message !== 'resize') throw error;
      const safeEdge = Math.min(8192, Math.floor(Math.max(image.naturalWidth, image.naturalHeight) * Math.sqrt(COMPRESSION_LIMITS.canvasPixels / (image.naturalWidth * image.naturalHeight))));
      dimensions = outputDimensions(image.naturalWidth, image.naturalHeight, settings.maxEdge > 0 ? Math.min(settings.maxEdge, safeEdge) : safeEdge);
    }
    const targetBytes = Math.floor(settings.targetKB * 1024), original = new Blob([file], { type: IMAGE_MIMES[sourceFormat] });
    const originalEligible = (settings.format === 'auto' || settings.format === sourceFormat) && dimensions.width === image.naturalWidth && dimensions.height === image.naturalHeight;
    if (settings.mode === 'target' && originalEligible && original.size <= targetBytes) return { blob: original, ...dimensions, format: sourceFormat, keptOriginal: true, targetReached: true };
    const losslessPng = originalEligible && sourceFormat === 'png' ? await optimizePng(file, signal) : null;
    let best;
    for (let attempt = 0; attempt < 8; attempt++) {
      aborted(signal); canvas.width = dimensions.width; canvas.height = dimensions.height;
      const context = canvas.getContext('2d'); if (!context) throw new Error('encode');
      context.imageSmoothingEnabled = true; context.imageSmoothingQuality = 'high';
      if (settings.format === 'jpg') { context.fillStyle = '#ffffff'; context.fillRect(0, 0, canvas.width, canvas.height); }
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const alpha = settings.format === 'auto' && hasTransparency(context.getImageData(0, 0, canvas.width, canvas.height).data);
      const formats = settings.format === 'auto' ? [...new Set([sourceFormat, 'webp', ...(alpha ? [] : ['jpg'])])] : [settings.format];
      const candidates = [];
      for (const format of formats) {
        try {
          const result = format === 'png' && attempt === 0 && losslessPng ? { blob: losslessPng, quality: 1 } : settings.mode === 'target'
            ? await searchQuality(q => encode(canvas, format, q, signal), targetBytes, .95, format !== 'png', signal)
            : { blob: await encode(canvas, format, settings.quality, signal), quality: settings.quality };
          candidates.push({ ...result, format, ...dimensions, keptOriginal: false });
        } catch (error) { if (error.message !== 'unsupported' || settings.format !== 'auto') throw error; }
      }
      if (attempt === 0 && originalEligible) candidates.push({ blob: original, format: sourceFormat, ...dimensions, keptOriginal: true, quality: 1 });
      if (!candidates.length) throw new Error('encode');
      const fitting = candidates.filter(item => item.blob.size <= targetBytes);
      // At a size target, prefer the highest quality; at a quality target, prefer fewer bytes.
      const candidate = settings.mode === 'target' && fitting.length
        ? fitting.sort((a, b) => (b.format === 'png' ? 1 : b.quality) - (a.format === 'png' ? 1 : a.quality) || a.blob.size - b.blob.size)[0]
        : candidates.sort((a, b) => a.blob.size - b.blob.size || Number(b.keptOriginal) - Number(a.keptOriginal))[0];
      if (!best || candidate.blob.size < best.blob.size || fitting.length) best = candidate;
      if (settings.mode !== 'target' || fitting.length || !settings.allowResize || Math.max(dimensions.width, dimensions.height) <= 16) break;
      const scale = Math.max(.35, Math.min(.85, Math.sqrt(targetBytes / candidate.blob.size) * .9));
      dimensions = { width: Math.max(1, Math.round(dimensions.width * scale)), height: Math.max(1, Math.round(dimensions.height * scale)) };
    }
    aborted(signal); return { ...best, targetReached: settings.mode !== 'target' || best.blob.size <= targetBytes };
  } finally { image.src = ''; canvas.width = canvas.height = 0; }
}
