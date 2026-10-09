import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

const OUT = '_qa_out';
const BASE = 'http://127.0.0.1:3000';

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  return ~c;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])) >>> 0, 0);
  return Buffer.concat([len, t, data, crc]);
}
function writePng(file, w, h, fn) {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0;
    for (let x = 0; x < w; x++) {
      const [r, g, b, a] = fn(x, y, w, h);
      const i = y * (w * 4 + 1) + 1 + x * 4;
      raw[i] = r;
      raw[i + 1] = g;
      raw[i + 2] = b;
      raw[i + 3] = a;
    }
  }
  const c = zlib.deflateSync(raw);
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  fs.writeFileSync(file, Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', c), chunk('IEND', Buffer.alloc(0))]));
}

const base = path.join(OUT, 'wm-base.png');
const mark = path.join(OUT, 'wm-mark.png');
writePng(base, 400, 300, () => [40, 120, 220, 255]);
writePng(mark, 100, 60, (x, y, w, h) => {
  const border = x < 3 || y < 3 || x >= w - 3 || y >= h - 3;
  if (border) return [255, 255, 255, 255];
  return [255, 0, 0, 255];
});

const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.evaluateOnNewDocument(() => localStorage.setItem('cookieConsent', 'accepted'));
await page.setViewport({ width: 1280, height: 800 });
await page.goto(`${BASE}/zh/tools/watermark-adder/`, { waitUntil: 'networkidle2' });

const inputs = await page.$$('input[type="file"]');
await inputs[0].uploadFile(base);
await new Promise((r) => setTimeout(r, 500));

await page.evaluate(() => {
  [...document.querySelectorAll('button')]
    .find((b) => /图片水印/.test(b.textContent || ''))
    ?.click();
});
await new Promise((r) => setTimeout(r, 300));

const inputs2 = await page.$$('input[type="file"]');
console.log('file inputs after image mode:', inputs2.length);
await inputs2[inputs2.length - 1].uploadFile(mark);
await new Promise((r) => setTimeout(r, 800));

const stats = await page.evaluate(() => {
  const c = document.querySelector('canvas');
  const ctx = c.getContext('2d');
  const img = ctx.getImageData(0, 0, c.width, c.height).data;
  let red = 0;
  for (let i = 0; i < img.length; i += 4) {
    if (img[i] > img[i + 1] + 30 && img[i] > img[i + 2] + 30) red++;
  }
  const d = ctx.getImageData((c.width / 2) | 0, (c.height / 2) | 0, 1, 1).data;
  return { red, redRatio: red / (img.length / 4), center: [...d], w: c.width, h: c.height };
});
console.log('stats', stats);

// Force opacity 1 scale 1.5
await page.evaluate(() => {
  const ranges = [...document.querySelectorAll('input[type="range"]')];
  for (const r of ranges) {
    const max = +r.max;
    const min = +r.min;
    let val = +r.value;
    if (max <= 1) val = 1;
    else if (min >= 0.1 && max >= 2) val = 1.5; // scale
    const desc = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
    desc.set.call(r, String(val));
    r.dispatchEvent(new Event('input', { bubbles: true }));
    r.dispatchEvent(new Event('change', { bubbles: true }));
  }
});
await new Promise((r) => setTimeout(r, 400));

const stats2 = await page.evaluate(() => {
  const c = document.querySelector('canvas');
  const ctx = c.getContext('2d');
  const img = ctx.getImageData(0, 0, c.width, c.height).data;
  let red = 0;
  for (let i = 0; i < img.length; i += 4) {
    if (img[i] > img[i + 1] + 30 && img[i] > img[i + 2] + 30) red++;
  }
  return { red, redRatio: red / (img.length / 4) };
});
console.log('stats after boost', stats2);

await page.screenshot({ path: path.join(OUT, 'wm-image-recheck.png') });
const dataUrl = await page.evaluate(() => document.querySelector('canvas').toDataURL('image/png'));
fs.writeFileSync(path.join(OUT, 'wm-export-check.png'), Buffer.from(dataUrl.split(',')[1], 'base64'));
console.log('export ok', fs.statSync(path.join(OUT, 'wm-export-check.png')).size);
await browser.close();

if (stats2.red > 50) {
  console.log('PASS image watermark visible');
  process.exit(0);
} else {
  console.log('FAIL image watermark weak/missing');
  process.exit(1);
}
