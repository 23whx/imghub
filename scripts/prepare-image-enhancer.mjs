import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
const root='public/assets/image-enhancer/';
const manifest=JSON.parse(await fs.readFile(root+'manifest.json','utf8'));
const data=await fs.readFile(root+manifest.model.file);
if(data.length!==manifest.model.bytes||createHash('sha256').update(data).digest('hex')!==manifest.model.sha256)throw new Error('Unexpected Real-ESRGAN model checksum');
for(const file of ['Real-ESRGAN-LICENSE.txt','example-low.webp','example-enhanced.webp'])await fs.access(root+file);
for(const name of ['ort-wasm-simd-threaded.jsep.wasm','ort-wasm-simd-threaded.jsep.mjs'])await fs.access('public/assets/ai-watermark/ort/'+name);
console.log('Image enhancer static assets verified.');
