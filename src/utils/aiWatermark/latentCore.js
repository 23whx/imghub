// Experimental reconstruction utilities. These are NOT a SynthID detector.
export function reconstructionSize(width, height, maxEdge = 512) {
  if (![256, 512, 768, 1024].includes(maxEdge)) throw new Error('settings');
  const scale = Math.min(1, maxEdge / Math.max(width, height));
  const contentWidth = Math.max(1, Math.round(width * scale)), contentHeight = Math.max(1, Math.round(height * scale));
  return { width: Math.ceil(contentWidth / 8) * 8, height: Math.ceil(contentHeight / 8) * 8, contentWidth, contentHeight };
}

export function vaeInput(pixels) {
  const count = pixels.width * pixels.height, data = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) for (let c = 0; c < 3; c++) data[c * count + i] = pixels.data[i * 4 + c] / 255;
  return data;
}

export function seededGaussian(seed) {
  let state = seed >>> 0 || 1, spare;
  const uniform = () => { state ^= state << 13; state ^= state >>> 17; state ^= state << 5; return ((state >>> 0) + .5) / 4294967296; };
  return () => {
    if (spare !== undefined) { const value = spare; spare = undefined; return value; }
    const r = Math.sqrt(-2 * Math.log(uniform())), angle = 2 * Math.PI * uniform();
    spare = r * Math.sin(angle); return r * Math.cos(angle);
  };
}

export function perturbLatents(input, strength, seed = 42) {
  if (!Number.isFinite(strength) || strength < 0 || strength > .25 || !Number.isInteger(seed) || seed < 1 || seed > 2147483647) throw new Error('settings');
  const noise = seededGaussian(seed), result = new Float32Array(input.length);
  for (let i = 0; i < result.length; i++) result[i] = input[i] + noise() * strength;
  return result;
}

export function vaeOutput(data, width, height) {
  const count = width * height, rgba = new Uint8ClampedArray(count * 4);
  if (data.length !== count * 3) throw new Error('processing');
  for (let i = 0; i < count; i++) { for (let c = 0; c < 3; c++) rgba[i * 4 + c] = Math.round(Math.max(0, Math.min(1, data[c * count + i])) * 255); rgba[i * 4 + 3] = 255; }
  return { width, height, data: rgba };
}

export function restoreAlpha(original, whiteMatteResult) {
  // ImageData dimensions are prototype getters, so spreading it drops them.
  const result = { width: original.width, height: original.height, data: new Uint8ClampedArray(original.data) };
  for (let i = 0; i < original.data.length; i += 4) {
    const alpha = original.data[i + 3] / 255;
    if (!alpha) continue;
    for (let c = 0; c < 3; c++) result.data[i + c] = (whiteMatteResult.data[i + c] - 255 * (1 - alpha)) / alpha;
  }
  return result;
}

export function pixelQuality(original, result) {
  let squared = 0, count = 0;
  for (let i = 0; i < original.data.length; i += 4) if (original.data[i + 3]) {
    for (let c = 0; c < 3; c++) { const delta = original.data[i + c] - result.data[i + c]; squared += delta * delta; count++; }
  }
  return squared && count ? 10 * Math.log10(255 * 255 / (squared / count)) : null;
}
