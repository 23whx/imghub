import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';

const root = 'public/assets/ocr';
await fs.mkdir(path.join(root, 'ort'), { recursive: true });
const sdk = 'node_modules/@paddleocr/paddleocr-js';
const pkg = JSON.parse(await fs.readFile(path.join(sdk, 'package.json'), 'utf8'));
if (pkg.version !== '0.4.2') throw new Error('OCR transport adapter requires PaddleOCR.js 0.4.2');
const workerName = (await fs.readdir(path.join(sdk, 'dist/assets'))).find(n => /^worker-entry-.*\.js$/.test(n));
const worker = await fs.readFile(path.join(sdk, 'dist/assets', workerName));
if (!worker.includes(Buffer.from('var ss = "1.24.3"'))) throw new Error('Unexpected bundled OCR runtime version');
await fs.writeFile(path.join(root, 'paddleocr-worker.js'), worker);
for (const file of ['ort-wasm-simd-threaded.jsep.wasm', 'ort-wasm-simd-threaded.jsep.mjs']) {
  await fs.copyFile(path.join('node_modules/ocr-onnxruntime/dist', file), path.join(root, 'ort', file));
}
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
if (process.argv.includes('--download')) {
  const models = {};
  for (const [role, name] of [['det', 'PP-OCRv5_mobile_det'], ['rec', 'PP-OCRv5_mobile_rec']]) {
    const source = `https://paddle-model-ecology.bj.bcebos.com/paddlex/official_inference_model/paddle3.0.0/${name}_onnx_infer.tar`;
    const response = await fetch(source, { signal: AbortSignal.timeout(180000) });
    if (!response.ok) throw new Error(`OCR download: ${response.status}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    const file = `${name}.tar`;
    await fs.writeFile(path.join(root, file), bytes);
    models[role] = { name, file, source, bytes: bytes.length, sha256: hash(bytes) };
    console.log(name, bytes.length, models[role].sha256);
  }
  await fs.writeFile(path.join(root, 'manifest.json'), JSON.stringify({ sdk: '0.4.2', runtime: '1.24.3', models }, null, 2) + '\n');
  const license = await fetch('https://raw.githubusercontent.com/PaddlePaddle/PaddleOCR/main/LICENSE').then(r => { if (!r.ok) throw new Error('OCR license unavailable'); return r.text(); });
  await fs.writeFile(path.join(root, 'PaddleOCR-LICENSE.txt'), license);
  const ortLicense = await fetch('https://raw.githubusercontent.com/microsoft/onnxruntime/v1.24.3/LICENSE').then(r => { if (!r.ok) throw new Error('Runtime license unavailable'); return r.text(); });
  await fs.writeFile(path.join(root, 'ONNX-Runtime-LICENSE.txt'), ortLicense);
}
const manifest = JSON.parse(await fs.readFile(path.join(root, 'manifest.json'), 'utf8'));
for (const spec of Object.values(manifest.models)) {
  const bytes = await fs.readFile(path.join(root, spec.file));
  if (bytes.length !== spec.bytes || hash(bytes) !== spec.sha256) throw new Error('OCR model checksum mismatch');
}
await fs.access(path.join(root, 'PaddleOCR-LICENSE.txt'));
console.log('OCR static assets ready.');
