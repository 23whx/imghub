import fs from "node:fs";
import sharp from "sharp";
import gifenc from "gifenc";
import { WiggleSimulator, getPreset } from "../src/utils/wiggle/physics.js";
import { automaticAcceleration } from "../src/utils/wiggle/autoMotion.js";
import { puddingMask } from "../src/utils/wiggle/mask.js";
const { GIFEncoder, quantize, applyPalette } = gifenc;
const size = 384;
const pixels = await sharp("public/assets/wiggle/pudding.webp")
  .resize(size, size)
  .ensureAlpha()
  .raw()
  .toBuffer();
function render(data) {
  const out = new Uint8Array(size * size * 4);
  for (let p = 0; p < out.length; p += 4) {
    out[p] = 250;
    out[p + 1] = 242;
    out[p + 2] = 237;
    out[p + 3] = 255;
  }
  const { positions, uvs, indices } = data;
  const screen = (i) => [
    (positions[i * 2] * 0.925 + 0.5) * size,
    (positions[i * 2 + 1] * 0.925 + 0.5) * size,
  ];
  for (let t = 0; t < indices.length; t += 3) {
    const ids = [indices[t], indices[t + 1], indices[t + 2]],
      [a, b, c] = ids.map(screen);
    const denom = (b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1]);
    if (Math.abs(denom) < 1e-10) continue;
    const left = Math.max(0, Math.floor(Math.min(a[0], b[0], c[0]))),
      right = Math.min(size - 1, Math.ceil(Math.max(a[0], b[0], c[0])));
    const top = Math.max(0, Math.floor(Math.min(a[1], b[1], c[1]))),
      bottom = Math.min(size - 1, Math.ceil(Math.max(a[1], b[1], c[1])));
    for (let y = top; y <= bottom; y++)
      for (let x = left; x <= right; x++) {
        const w0 =
          ((b[1] - c[1]) * (x + 0.5 - c[0]) +
            (c[0] - b[0]) * (y + 0.5 - c[1])) /
          denom;
        const w1 =
            ((c[1] - a[1]) * (x + 0.5 - c[0]) +
              (a[0] - c[0]) * (y + 0.5 - c[1])) /
            denom,
          w2 = 1 - w0 - w1;
        if (w0 < -0.00001 || w1 < -0.00001 || w2 < -0.00001) continue;
        const u =
            w0 * uvs[ids[0] * 2] + w1 * uvs[ids[1] * 2] + w2 * uvs[ids[2] * 2],
          v =
            w0 * uvs[ids[0] * 2 + 1] +
            w1 * uvs[ids[1] * 2 + 1] +
            w2 * uvs[ids[2] * 2 + 1];
        const sx = Math.max(0, Math.min(size - 1, u * size - 0.5)),
          sy = Math.max(0, Math.min(size - 1, v * size - 0.5)),
          ix = Math.floor(sx),
          iy = Math.floor(sy),
          fx = sx - ix,
          fy = sy - iy;
        const p00 = (iy * size + ix) * 4,
          p10 = (iy * size + Math.min(size - 1, ix + 1)) * 4,
          p01 = (Math.min(size - 1, iy + 1) * size + ix) * 4,
          p11 =
            (Math.min(size - 1, iy + 1) * size + Math.min(size - 1, ix + 1)) *
            4;
        const rgba = [0, 1, 2, 3].map(
          (k) =>
            (pixels[p00 + k] * (1 - fx) + pixels[p10 + k] * fx) * (1 - fy) +
            (pixels[p01 + k] * (1 - fx) + pixels[p11 + k] * fx) * fy,
        );
        const alpha = rgba[3] / 255,
          p = (y * size + x) * 4;
        for (let k = 0; k < 3; k++)
          out[p + k] = Math.round(
            rgba[k] * alpha + [250, 242, 237][k] * (1 - alpha),
          );
      }
  }
  return out;
}
for (const demo of [
  { id: "soft", preset: "purupuru", mode: "sway", strength: 45, period: 1400 },
  { id: "bounce", preset: "sloshing", mode: "hop", strength: 32, period: 1200 },
  {
    id: "float",
    preset: "floating",
    mode: "orbit",
    strength: 28,
    period: 1800,
  },
]) {
  const sim = new WiggleSimulator(
    size,
    size,
    puddingMask(size, size),
    size,
    size,
    getPreset(demo.preset),
    { meshRes: 48 },
  );
  let time = 0;
  const drive = (dt) => {
    time += dt;
    sim.advance(dt, {
      automaticAcceleration: automaticAcceleration(
        demo.mode,
        time,
        demo.period,
        demo.strength,
      ),
    });
  };
  for (let i = 0; i < Math.round((demo.period / 1000) * 6 * 120); i++)
    drive(1 / 120);
  const gif = GIFEncoder(),
    count = Math.round((demo.period / 1000) * 24),
    dt = demo.period / 1000 / count;
  let palette;
  for (let i = 0; i < count; i++) {
    drive(dt);
    const frame = render(sim.getRenderData());
    palette ||= quantize(frame, 256);
    gif.writeFrame(applyPalette(frame, palette), size, size, {
      palette,
      delay: Math.round(dt * 1000),
      repeat: 0,
      dispose: 1,
    });
  }
  gif.finish();
  const bytes = gif.bytes();
  fs.writeFileSync(`public/assets/wiggle/pudding-${demo.id}.gif`, bytes);
  await sharp(bytes, { animated: true })
    .webp({ quality: 80, effort: 4 })
    .toFile(`public/assets/wiggle/pudding-${demo.id}.webp`);
  console.log(demo.id, count, "frames", bytes.length, "bytes");
}
