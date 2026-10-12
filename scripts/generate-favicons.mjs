// Render every favicon size from public/favicon.svg. Rerun after editing the SVG.
import fs from 'node:fs/promises';
import sharp from 'sharp';

const svg = await fs.readFile('public/favicon.svg', 'utf8');
// Home-screen icons get a full square: iOS and Android apply their own rounded mask.
const square = svg.replace('rx="112" fill="#14120f"', 'fill="#14120f"');
const png = (source, size) => sharp(Buffer.from(source), { density: 384 }).resize(size, size).png().toBuffer();

for (const [file, size] of [['favicon-16x16.png', 16], ['favicon-32x32.png', 32], ['favicon-512x512.png', 512]]) {
  await fs.writeFile(`public/${file}`, await png(svg, size));
}
for (const [file, size] of [['apple-touch-icon.png', 180], ['android-chrome-192x192.png', 192], ['android-chrome-512x512.png', 512]]) {
  await fs.writeFile(`public/${file}`, await png(square, size));
}

// favicon.ico holding 16, 32 and 48 px PNG images.
const images = await Promise.all([16, 32, 48].map(size => png(svg, size)));
const header = Buffer.alloc(6 + 16 * images.length);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(images.length, 4);
let offset = header.length;
images.forEach((image, i) => {
  const size = [16, 32, 48][i], entry = 6 + 16 * i;
  header.writeUInt8(size, entry);
  header.writeUInt8(size, entry + 1);
  header.writeUInt16LE(1, entry + 4);
  header.writeUInt16LE(32, entry + 6);
  header.writeUInt32LE(image.length, entry + 8);
  header.writeUInt32LE(offset, entry + 12);
  offset += image.length;
});
await fs.writeFile('public/favicon.ico', Buffer.concat([header, ...images]));
console.log('favicons written');
