// Gemini template matching / reverse alpha blending, informed by
// tbxark-arc/remove-ai-watermarks and wiltodelta/remove-ai-watermarks.
// MI-GAN tensor layout follows Picsart's official preprocessing and WatermarkOut.

export function canonicalGeminiRegion(width, height) {
  const large = width > 1024 && height > 1024;
  const size = large ? 96 : 48, margin = large ? 64 : 32;
  return { x: width - margin - size, y: height - margin - size, w: size, h: size };
}

export function alphaFromPixels(pixels) {
  const alpha = new Float32Array(pixels.width * pixels.height);
  for (let i = 0; i < alpha.length; i++) alpha[i] = Math.max(...pixels.data.subarray(i * 4, i * 4 + 3)) / 255;
  return alpha;
}

export function detectGemini(pixels, alpha, size) {
  const expected = canonicalGeminiRegion(pixels.width, pixels.height);
  if (expected.w !== size || pixels.width < size + 32 || pixels.height < size + 32) return null;
  const count = size * size;
  let mean = 0, templateVariance = 0;
  for (const v of alpha) mean += v / count;
  const centered = Float32Array.from(alpha, v => v - mean);
  for (const v of centered) templateVariance += v * v;
  if (templateVariance < 0.00001) return null;
  let best = { score: -1, ...expected };
  for (let y = Math.max(0, expected.y - 16); y <= Math.min(pixels.height - size, expected.y + 16); y++) {
    for (let x = Math.max(0, expected.x - 16); x <= Math.min(pixels.width - size, expected.x + 16); x++) {
      let sum = 0, sumSq = 0, cross = 0;
      for (let j = 0; j < size; j++) for (let i = 0; i < size; i++) {
        const k = ((y + j) * pixels.width + x + i) * 4;
        const value = (pixels.data[k] * 0.299 + pixels.data[k + 1] * 0.587 + pixels.data[k + 2] * 0.114) / 255;
        sum += value; sumSq += value * value; cross += value * centered[j * size + i];
      }
      const denominator = Math.sqrt(Math.max(0, sumSq - sum * sum / count) * templateVariance);
      const score = denominator > 1e-6 ? cross / denominator : 0;
      if (score > best.score) best = { x, y, w: size, h: size, score };
    }
  }
  // Conservative matching; leave unmatched images untouched instead of forcing a patch.
  return best.score >= 0.55 ? best : null;
}

export function reverseGemini(pixels, alpha, region) {
  const out = { width: pixels.width, height: pixels.height, data: new Uint8ClampedArray(pixels.data) };
  for (let y = 0; y < region.h; y++) for (let x = 0; x < region.w; x++) {
    const px = region.x + x, py = region.y + y;
    if (px < 0 || py < 0 || px >= pixels.width || py >= pixels.height) continue;
    const a = Math.min(0.99, alpha[y * region.w + x]);
    if (a < 0.002) continue;
    const k = (py * pixels.width + px) * 4;
    for (let c = 0; c < 3; c++) out.data[k + c] = Math.max(0, Math.min(255, (pixels.data[k + c] - a * 255) / (1 - a)));
  }
  return out;
}

export function maskBounds(mask, width, height) {
  let minX = width, minY = height, maxX = -1, maxY = -1, count = 0;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) if (mask[y * width + x] > 64) {
    minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y); count++;
  }
  return count ? { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1, count } : null;
}

export function inpaintCrop(bounds, width, height) {
  const size = Math.min(Math.max(512, Math.max(bounds.w, bounds.h) * 3), width, height);
  return { x: Math.max(0, Math.min(width - size, Math.round(bounds.x + bounds.w / 2 - size / 2))), y: Math.max(0, Math.min(height - size, Math.round(bounds.y + bounds.h / 2 - size / 2))), size };
}

export function buildMiganInput(pixels, mask) {
  const count = pixels.width * pixels.height;
  const result = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) {
    const keep = mask[i] > 64 ? 0 : 1;
    result[i] = keep - 0.5;
    for (let c = 0; c < 3; c++) result[(c + 1) * count + i] = (pixels.data[i * 4 + c] * 2 / 255 - 1) * keep;
  }
  return result;
}

export function miganOutputPixels(tensor, width = 512, height = 512) {
  const count = width * height;
  const data = new Uint8ClampedArray(count * 4);
  for (let i = 0; i < count; i++) {
    for (let c = 0; c < 3; c++) data[i * 4 + c] = Math.max(0, Math.min(255, (tensor[c * count + i] * 0.5 + 0.5) * 255));
    data[i * 4 + 3] = 255;
  }
  return { width, height, data };
}

export function compositePatch(original, patch, mask, offsetX, offsetY) {
  const out = { width: original.width, height: original.height, data: new Uint8ClampedArray(original.data) };
  for (let y = 0; y < patch.height; y++) for (let x = 0; x < patch.width; x++) {
    const ox = x + offsetX, oy = y + offsetY;
    if (ox < 0 || oy < 0 || ox >= original.width || oy >= original.height || mask[oy * original.width + ox] <= 64) continue;
    const k = (oy * original.width + ox) * 4, p = (y * patch.width + x) * 4;
    // Preserve the original alpha and every pixel outside the selected region.
    for (let c = 0; c < 3; c++) out.data[k + c] = patch.data[p + c];
  }
  return out;
}
