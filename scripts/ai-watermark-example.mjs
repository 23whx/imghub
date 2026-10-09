import sharp from 'sharp';
import fs from 'node:fs/promises';
import { alphaFromPixels, canonicalGeminiRegion } from '../src/utils/aiWatermark/core.js';

// A reproducible example: our gallery artwork with a synthetic Gemini sparkle.
const { data, info } = await sharp('public/assets/studio/subtitle.webp').ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const template = await sharp('public/assets/ai-watermark/gemini-48.webp').ensureAlpha().raw().toBuffer();
const alpha = alphaFromPixels({ width: 48, height: 48, data: template });
const region = canonicalGeminiRegion(info.width, info.height);
const marked = Buffer.from(data);
for (let y = 0; y < 48; y++) for (let x = 0; x < 48; x++) {
  const a = alpha[y * 48 + x], k = ((region.y + y) * info.width + region.x + x) * 4;
  for (let c = 0; c < 3; c++) marked[k + c] = Math.round(a * 255 + (1 - a) * data[k + c]);
}
await sharp(marked, { raw: { width: info.width, height: info.height, channels: 4 } }).webp({ lossless: true }).toFile('public/assets/ai-watermark/example.webp');
await fs.mkdir('output/ai-watermark', { recursive: true });
await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).webp({ lossless: true }).toFile('output/ai-watermark/clean-example.webp');
console.log(`Prepared ${info.width} × ${info.height} example.`);
