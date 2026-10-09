import test from 'node:test';
import assert from 'node:assert/strict';
import { reconstructionSize, vaeInput, vaeOutput, perturbLatents, restoreAlpha, pixelQuality } from '../src/utils/aiWatermark/latentCore.js';

test('working tensors align to 8px while content aspect ratio is preserved', () => {
  assert.deepEqual(reconstructionSize(900, 600, 512), { width: 512, height: 344, contentWidth: 512, contentHeight: 341 });
  assert.deepEqual(reconstructionSize(1, 1, 256), { width: 8, height: 8, contentWidth: 1, contentHeight: 1 });
  assert.equal(reconstructionSize(900, 600, 1024).contentWidth, 900);
  assert.throws(() => reconstructionSize(900, 600, 8192), /settings/);
});
test('TAESD uses RGB CHW normalized to [0,1], not MI-GAN normalization', () => {
  const input = { width: 2, height: 1, data: Uint8ClampedArray.of(0, 128, 255, 255, 255, 0, 128, 255) };
  const tensor = vaeInput(input);
  assert.deepEqual([...tensor.slice(0, 2)], [0, 1]);
  assert.ok(Math.abs(tensor[2] - 128 / 255) < 1e-6);
  assert.deepEqual([...vaeOutput(tensor, 2, 1).data], [...input.data]);
});
test('latent noise is repeatable, finite and parameter changes do not accumulate', () => {
  const input = Float32Array.from({ length: 1000 }, (_, i) => Math.sin(i));
  assert.deepEqual(perturbLatents(input, .05, 42), perturbLatents(input, .05, 42));
  assert.notDeepEqual(perturbLatents(input, .05, 42), perturbLatents(input, .05, 43));
  assert.deepEqual(perturbLatents(input, 0, 42), input);
  const altered = perturbLatents(input, .25, 42);
  assert.ok(altered.every(Number.isFinite)); assert.notDeepEqual(altered, input);
  assert.throws(() => perturbLatents(input, .05, 0), /settings/);
  assert.throws(() => perturbLatents(input, .26, 42), /settings/);
});
test('reconstruction retains alpha and pixel metrics are independent of watermark detection', () => {
  const original = { width: 2, height: 1, data: Uint8ClampedArray.of(25, 30, 40, 0, 100, 120, 140, 255) };
  const reconstruction = { ...original, data: Uint8ClampedArray.of(255, 255, 255, 255, 110, 130, 150, 255) };
  const result = restoreAlpha(original, reconstruction);
  assert.deepEqual([...result.data], [25, 30, 40, 0, 110, 130, 150, 255]);
  assert.equal(pixelQuality(original, original), null);
  assert.ok(Math.abs(pixelQuality(original, result) - 28.1308) < .001);
});

test('ImageData prototype dimensions survive reconstruction', () => {
  const original = Object.create({ get width() { return 1; }, get height() { return 1; } });
  original.data = Uint8ClampedArray.of(100, 120, 140, 255);
  const result = restoreAlpha(original, { data: Uint8ClampedArray.of(110, 130, 150, 255) });
  assert.equal(result.width, 1); assert.equal(result.height, 1);
});
