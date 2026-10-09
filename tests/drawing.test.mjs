import test from 'node:test';
import assert from 'node:assert/strict';
import { dimensions, localPoint, worldPoint, cropBounds, floodFill } from '../src/utils/drawingEngine.js';

test('Rotated and flipped layers map brush coordinates back to their source', () => {
  for (const rotation of [-135, -90, 0, 37, 90, 180]) {
    for (const flipX of [false, true]) for (const flipY of [false, true]) {
      const layer = { x: 120, y: -25, width: 640, height: 420, rotation, flipX, flipY };
      for (const point of [{ x: 0, y: 0 }, { x: 35, y: 240 }, { x: 640, y: 420 }]) {
        const restored = localPoint(layer, worldPoint(layer, point));
        assert(Math.abs(restored.x - point.x) < 1e-9);
        assert(Math.abs(restored.y - point.y) < 1e-9);
      }
    }
  }
});

test('Crop bounds clamp to the canvas and work in either drag direction', () => {
  assert.deepEqual(cropBounds({ x: 350, y: 280 }, { x: -30, y: 40 }, 300, 200), { x: 0, y: 40, width: 300, height: 160 });
  assert.deepEqual(cropBounds({ x: 12.8, y: 20.2 }, { x: 85.1, y: 80.9 }, 100, 100), { x: 12, y: 20, width: 74, height: 61 });
  assert.equal(cropBounds({ x: 200, y: 200 }, { x: 220, y: 220 }, 100, 100).width, 0);
});

test('Canvas dimensions reject empty, fractional, and oversized documents', () => {
  assert.deepEqual(dimensions('1080', '1440'), { width: 1080, height: 1440 });
  for (const [w, h] of [[0, 100], [100, -1], [1.2, 100], [4097, 2], [Infinity, 5], ['x', 10]]) assert.throws(() => dimensions(w, h), /dimensions/);
});

test('Bucket fill stays inside a connected region and preserves its boundary', () => {
  const width = 9, height = 7, data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const shade = x === 4 ? 0 : x < 4 ? 255 : 230;
    data.set([shade, shade, shade, 255], (y * width + x) * 4);
  }
  assert(floodFill(data, width, height, 1, 3, [220, 170, 40, 255]));
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const expected = x < 4 ? [220, 170, 40, 255] : x === 4 ? [0, 0, 0, 255] : [230, 230, 230, 255];
    assert.deepEqual(Array.from(data.subarray((y * width + x) * 4, (y * width + x) * 4 + 4)), expected);
  }
  assert.equal(floodFill(data, width, height, 1, 3, [220, 170, 40, 255]), false);
  assert.equal(floodFill(data, width, height, -1, 0, [0, 0, 0, 255]), false);
});

test('Bucket fill distinguishes transparent pixels and handles similar colors', () => {
  const data = new Uint8ClampedArray([0, 0, 0, 0, 5, 5, 5, 0, 0, 0, 0, 255]);
  floodFill(data, 3, 1, 0, 0, [80, 120, 160, 255], 8);
  assert.deepEqual(Array.from(data), [80, 120, 160, 255, 80, 120, 160, 255, 0, 0, 0, 255]);
});
