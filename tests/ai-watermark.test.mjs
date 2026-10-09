import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { alphaFromPixels, canonicalGeminiRegion, detectGemini, reverseGemini, maskBounds, inpaintCrop, buildMiganInput, miganOutputPixels, compositePatch } from '../src/utils/aiWatermark/core.js';

const pixels = (w, h, color = [40, 60, 80, 255]) => ({ width: w, height: h, data: Uint8ClampedArray.from({ length: w * h * 4 }, (_, i) => color[i % 4]) });
const template = async size => {
  const data = await sharp(`public/assets/ai-watermark/gemini-${size}.webp`).ensureAlpha().raw().toBuffer();
  return alphaFromPixels({ width: size, height: size, data });
};
const watermark = (image, alpha, region) => {
  const out = { ...image, data: new Uint8ClampedArray(image.data) };
  for (let y = 0; y < region.h; y++) for (let x = 0; x < region.w; x++) {
    const a = alpha[y * region.w + x], k = ((region.y + y) * image.width + region.x + x) * 4;
    for (let c = 0; c < 3; c++) out.data[k + c] = a * 255 + (1 - a) * image.data[k + c];
  }
  return out;
};

test('canonical 48/96 sizing and detection for original and shifted sparkles', async () => {
  assert.deepEqual(canonicalGeminiRegion(1024, 1024), { x: 944, y: 944, w: 48, h: 48 });
  assert.deepEqual(canonicalGeminiRegion(2048, 2048), { x: 1888, y: 1888, w: 96, h: 96 });
  for (const [width, height, dx, dy] of [[240, 160, 0, 0], [240, 160, 7, -9], [1200, 1100, -4, 6]]) {
    const region = canonicalGeminiRegion(width, height); region.x += dx; region.y += dy;
    const alpha = await template(region.w);
    const detected = detectGemini(watermark(pixels(width, height), alpha, region), alpha, region.w);
    assert.ok(detected && detected.score > .99);
    assert.equal(detected.x, region.x); assert.equal(detected.y, region.y);
  }
});
test('clean images and tiny images are not blindly modified', async () => {
  const alpha = await template(48);
  assert.equal(detectGemini(pixels(240, 160), alpha, 48), null);
  assert.equal(detectGemini(pixels(30, 30), alpha, 48), null);
  const { data, info } = await sharp('public/assets/studio/subtitle.webp').ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  assert.equal(detectGemini({ width: info.width, height: info.height, data }, alpha, 48), null);
});
test('reverse blend restores recoverable pixels and preserves alpha and outside pixels', async () => {
  const original = pixels(240, 160, [40, 60, 80, 120]), alpha = await template(48);
  const region = canonicalGeminiRegion(original.width, original.height);
  const out = reverseGemini(watermark(original, alpha, region), alpha, region);
  for (let y = 0; y < original.height; y++) for (let x = 0; x < original.width; x++) {
    const k = (y * original.width + x) * 4;
    assert.equal(out.data[k + 3], 120);
    const inside = x >= region.x && x < region.x + region.w && y >= region.y && y < region.y + region.h;
    const a = inside ? alpha[(y - region.y) * region.w + x - region.x] : 0;
    for (let c = 0; c < 3; c++) {
      if (!inside || a < .002) assert.equal(out.data[k + c], original.data[k + c]);
      else if (a < .8) assert.ok(Math.abs(out.data[k + c] - original.data[k + c]) <= 3);
    }
  }
});
test('gallery example is actually detected at the correct position', async () => {
  const { data, info } = await sharp('public/assets/ai-watermark/example.webp').ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const detection = detectGemini({ width: info.width, height: info.height, data }, await template(48), 48);
  assert.ok(detection); assert.equal(detection.x, 820); assert.equal(detection.y, 520);
});
test('MI-GAN input uses keep mask, centered channels and zeroed hidden pixels', () => {
  const image = pixels(2, 1); image.data.set([255, 128, 0, 255], 4);
  const result = buildMiganInput(image, Uint8Array.of(0, 255));
  assert.equal(result.length, 8);
  assert.equal(result[0], .5); assert.equal(result[1], -.5);
  assert.ok(Math.abs(result[2] - (40 * 2 / 255 - 1)) < 1e-6);
  for (const i of [3, 5, 7]) assert.equal(Math.abs(result[i]), 0);
  const out = miganOutputPixels(Float32Array.of(-1, 0, 1), 1, 1);
  assert.deepEqual([...out.data], [0, 128, 255, 255]);
});
test('mask bounds, edge crops and compositing keep edits inside selection', () => {
  const mask = new Uint8Array(900 * 600);
  assert.equal(maskBounds(mask, 900, 600), null);
  for (let y = 520; y < 568; y++) for (let x = 820; x < 868; x++) mask[y * 900 + x] = 255;
  const bounds = maskBounds(mask, 900, 600);
  assert.deepEqual(bounds, { x: 820, y: 520, w: 48, h: 48, count: 2304 });
  assert.deepEqual(inpaintCrop(bounds, 900, 600), { x: 388, y: 88, size: 512 });
  const original = pixels(3, 2, [10, 20, 30, 99]), patch = pixels(2, 2, [100, 120, 140, 255]);
  const out = compositePatch(original, patch, Uint8Array.of(0, 255, 0, 0, 0, 255), 1, 0);
  assert.deepEqual([...out.data.slice(4, 8)], [100, 120, 140, 99]);
  assert.deepEqual([...out.data.slice(0, 4)], [10, 20, 30, 99]);
  assert.deepEqual([...out.data.slice(8, 12)], [10, 20, 30, 99]);
});
