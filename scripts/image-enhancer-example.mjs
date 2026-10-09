import fs from 'node:fs/promises';
import sharp from 'sharp';
await fs.mkdir('public/assets/image-enhancer',{recursive:true});
// Make a genuinely low-resolution compressed input from our own gallery photo.
const jpg=await sharp('public/assets/studio/subtitle.webp').resize(192,128).jpeg({quality:48}).toBuffer();
await sharp(jpg).webp({lossless:true}).toFile('public/assets/image-enhancer/example-low.webp');
