import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import sharp from 'sharp';

const root = path.resolve('public/assets/ai-watermark');
await fs.mkdir(root, { recursive: true });
await fs.mkdir(path.join(root, 'ort'), { recursive: true });
for (const name of ['ort-wasm-simd-threaded.wasm', 'ort-wasm-simd-threaded.mjs', 'ort-wasm-simd-threaded.jsep.wasm', 'ort-wasm-simd-threaded.jsep.mjs']) {
  const bytes = await fs.readFile(path.join('node_modules/onnxruntime-web/dist', name));
  const target = path.join(root, 'ort', name);
  const previous = await fs.readFile(target).catch(() => null);
  if (!previous?.equals(bytes)) await fs.writeFile(target, bytes);
}
if (process.argv.includes('--download-model')) {
  const source = 'https://huggingface.co/lxfater/inpaint-web/resolve/main/migan.onnx';
  const response = await fetch(source, { signal: AbortSignal.timeout(120000) });
  if (!response.ok) throw new Error(`Model download failed: ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  const hash = createHash('sha256').update(bytes).digest('hex');
  if (hash !== 'bb7189b2523b8485d9dd6baa2e7e8bccce4493760daa33ffcd432f667945bf62') throw new Error('Unexpected model checksum');
  await fs.writeFile(path.join(root, 'migan.onnx'), bytes);
  console.log('MI-GAN model verified:', bytes.length, hash);
  const license = await fetch('https://raw.githubusercontent.com/Picsart-AI-Research/MI-GAN/main/LICENSE').then(r => { if (!r.ok) throw new Error('License unavailable'); return r.text(); });
  await fs.writeFile(path.join(root, 'MI-GAN-LICENSE.txt'), license);
}
if (process.argv.includes('--prepare-templates')) {
  for (const size of [48, 96]) {
    const source = `output/ai-watermark/references/tbxark-remove-ai-watermarks/public/gemini_bg_${size}.png`;
    await sharp(source).webp({ lossless: true }).toFile(path.join(root, `gemini-${size}.webp`));
  }
  await fs.copyFile('output/ai-watermark/references/free-ai-watermark-remover/LICENSE', path.join(root, 'WatermarkOut-LICENSE.txt'));
}
if (process.argv.includes('--download-model') || process.argv.includes('--prepare-templates')) {
  const license = await fetch('https://raw.githubusercontent.com/microsoft/onnxruntime/v1.20.1/LICENSE').then(r => { if (!r.ok) throw new Error('Runtime license unavailable'); return r.text(); });
  await fs.writeFile(path.join(root, 'ONNX-Runtime-LICENSE.txt'), license);
}
const model = await fs.readFile(path.join(root, 'migan.onnx'));
if (createHash('sha256').update(model).digest('hex') !== 'bb7189b2523b8485d9dd6baa2e7e8bccce4493760daa33ffcd432f667945bf62') throw new Error('Unexpected model checksum; run with --download-model to restore it.');
for (const name of ['gemini-48.webp', 'gemini-96.webp', 'example.webp']) await fs.access(path.join(root, name));
const manifest = JSON.parse(await fs.readFile(path.join(root, 'taesd-manifest.json'), 'utf8'));
for (const spec of Object.values(manifest.models)) {
  const bytes = await fs.readFile(path.join(root, spec.file));
  if (bytes.length !== spec.bytes || createHash('sha256').update(bytes).digest('hex') !== spec.sha256) throw new Error('Unexpected reconstruction model checksum');
}
console.log('AI watermark static assets ready.');
