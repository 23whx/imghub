import test from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import {
  WiggleSimulator,
  getPreset,
  PRESET_ORDER,
} from "../src/utils/wiggle/physics.js";
import { automaticAcceleration } from "../src/utils/wiggle/autoMotion.js";
import { puddingMask, stamp, coverage } from "../src/utils/wiggle/mask.js";

test("The pudding moves while its plate stays unpainted", () => {
  const m = puddingMask(100, 100);
  assert(m[40 * 100 + 50] > 0.9);
  assert.equal(m[78 * 100 + 50], 0);
  assert.equal(m[40 * 100 + 5], 0);
  assert(m[67 * 100 + 50] < m[40 * 100 + 50]);
});
test("Soft painting, erasing and snapshots preserve meaningful undo data", () => {
  const m = new Float32Array(10000),
    before = m.slice();
  stamp(m, 100, 100, 50, 50, 15, 0.6);
  assert(m[5050] > 0.5);
  assert.equal(m[0], 0);
  assert(coverage(m) > 0);
  assert.equal(coverage(before), 0);
  stamp(m, 100, 100, 50, 50, 15, 1, true);
  assert.equal(m[5050], 0);
});
for (const preset of PRESET_ORDER)
  test(`${preset}: bounded finite motion with fixed vertices after sustained forcing`, () => {
    const sim = new WiggleSimulator(
      100,
      100,
      puddingMask(100, 100),
      100,
      100,
      getPreset(preset),
      { meshRes: 24 },
    );
    let displacement = 0;
    for (let i = 0; i < 480; i++) {
      sim.advance(1 / 60, {
        automaticAcceleration: automaticAcceleration("hop", i / 60, 1200, 100),
        frameDragging: i % 90 < 20,
        frameTarget: { x: 0.15, y: -0.15 },
      });
      const m = sim.mesh;
      for (let j = 0; j < m.weights.length; j++)
        for (let axis = 0; axis < 2; axis++) {
          const k = j * 2 + axis;
          assert(Number.isFinite(m.positions[k]));
          if (m.weights[j] === 0)
            assert.equal(m.positions[k], m.restPositions[k]);
          else
            displacement = Math.max(
              displacement,
              Math.abs(m.positions[k] - m.restPositions[k]),
            );
        }
    }
    assert(displacement > 0.001);
    assert(displacement < 0.25, `excess displacement ${displacement}`);
  });
test("30 fps advances the same physical time as 120 fps", () => {
  const make = () =>
      new WiggleSimulator(
        100,
        100,
        puddingMask(100, 100),
        100,
        100,
        getPreset("purupuru"),
        { meshRes: 12 },
      ),
    a = make(),
    b = make();
  const input = { automaticAcceleration: { x: 0.2, y: 0 } };
  for (let i = 0; i < 120; i++) a.advance(1 / 120, input);
  for (let i = 0; i < 30; i++) b.advance(1 / 30, input);
  assert.equal(a.tick, b.tick);
  for (let i = 0; i < a.mesh.positions.length; i++)
    assert(Math.abs(a.mesh.positions[i] - b.mesh.positions[i]) < 1e-9);
});
for (const id of ["soft", "bounce", "float"])
  test(`${id} example is an infinite looping animation with changing frames`, async () => {
    const path = `public/assets/wiggle/pudding-${id}.webp`,
      m = await sharp(path, { animated: true }).metadata();
    assert(m.pages > 20);
    assert.equal(m.loop, 0);
    const first = await sharp(path, { page: 0 }).raw().toBuffer(),
      middle = await sharp(path, { page: Math.floor(m.pages / 2) })
        .raw()
        .toBuffer();
    assert(!first.equals(middle));
  });
