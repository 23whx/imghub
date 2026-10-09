export const INPUT_PIXELS = 4_000_000, OUTPUT_PIXELS = 16_000_000;

export function outputSize(width, height, scale = 2) {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || width > 4096 || height > 4096 || width * height > INPUT_PIXELS) throw new Error('inputSize');
  if (![1, 2, 4].includes(scale)) throw new Error('settings');
  const w = width * scale, h = height * scale;
  if (w > 8192 || h > 8192 || w * h > OUTPUT_PIXELS) throw new Error('outputSize');
  return { width: w, height: h };
}

// Each core gets the model's full 34px convolution context on all sides.
// A 36px halo prevents visible internal seams, then only the core is retained.
export function tilePlan(width, height, size = 128, padding = 36) {
  const tiles = [];
  for (let y = 0; y < height; y += size) for (let x = 0; x < width; x += size) {
    const w = Math.min(size, width - x), h = Math.min(size, height - y);
    const left = Math.max(0, x - padding), top = Math.max(0, y - padding);
    tiles.push({ x, y, w, h, left, top, width: Math.min(width, x + w + padding) - left, height: Math.min(height, y + h + padding) - top });
  }
  return tiles;
}

export function tileInput(pixels, tile) {
  const count = tile.width * tile.height, input = new Float32Array(count * 3);
  for (let y = 0; y < tile.height; y++) for (let x = 0; x < tile.width; x++) {
    const src = ((tile.top + y) * pixels.width + tile.left + x) * 4, i = y * tile.width + x, alpha = pixels.data[src + 3] / 255;
    for (let c = 0; c < 3; c++) input[c * count + i] = pixels.data[src + c] / 255 * alpha + 1 - alpha;
  }
  return input;
}

// Premultiplied interpolation keeps transparent borders from gaining dark rims.
export function sampleOriginal(pixels, x, y, scale) {
  const sx = Math.max(0, Math.min(pixels.width - 1, (x + .5) / scale - .5)), sy = Math.max(0, Math.min(pixels.height - 1, (y + .5) / scale - .5));
  const x0 = Math.floor(sx), y0 = Math.floor(sy), fx = sx - x0, fy = sy - y0;
  const rgba = [0, 0, 0, 0];
  for (const [dx, dy, weight] of [[0, 0, (1-fx)*(1-fy)], [1, 0, fx*(1-fy)], [0, 1, (1-fx)*fy], [1, 1, fx*fy]]) {
    const at = (Math.min(pixels.height-1, y0+dy)*pixels.width + Math.min(pixels.width-1, x0+dx))*4, alpha = pixels.data[at+3]/255;
    rgba[3] += alpha * weight;
    for (let c = 0; c < 3; c++) rgba[c] += pixels.data[at+c] * alpha * weight;
  }
  for (let c = 0; c < 3; c++) rgba[c] = rgba[3] ? rgba[c]/rgba[3] : 0;
  rgba[3] *= 255;
  return rgba;
}

export function compositeTile(target, data, pixels, tile, scale, strength) {
  if (!Number.isFinite(strength) || strength < 0 || strength > 1) throw new Error('settings');
  const width = tile.width * 4, height = tile.height * 4, count = width * height;
  if (data.length !== count * 3) throw new Error('processing');
  const step = 4 / scale;
  for (let y = 0; y < tile.h * scale; y++) for (let x = 0; x < tile.w * scale; x++) {
    const gx = tile.x * scale + x, gy = tile.y * scale + y, at = (gy * target.width + gx) * 4;
    const original = sampleOriginal(pixels, gx, gy, scale), alpha = original[3] / 255;
    target.data[at+3] = original[3];
    for (let c = 0; c < 3; c++) {
      let value = 0;
      for (let dy = 0; dy < step; dy++) for (let dx = 0; dx < step; dx++) value += data[c * count + ((tile.y-tile.top)*4+y*step+dy)*width+(tile.x-tile.left)*4+x*step+dx];
      const unmatted = alpha ? (value / (step*step) * 255 - 255*(1-alpha))/alpha : 0;
      target.data[at+c] = original[c] * (1-strength) + unmatted * strength;
    }
  }
}
