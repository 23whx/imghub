import puppeteer from 'puppeteer';
import fs from 'fs';

const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage();
const logs = [];
page.on('console', (m) => logs.push(m.type() + ': ' + m.text()));
page.on('pageerror', (e) => logs.push('PAGEERROR: ' + e.message));
page.on('requestfailed', (r) =>
  logs.push('REQFAIL: ' + r.url() + ' ' + (r.failure()?.errorText || ''))
);
await page.evaluateOnNewDocument(() => localStorage.setItem('cookieConsent', 'accepted'));
await page.setViewport({ width: 1280, height: 800 });
await page.goto('http://127.0.0.1:3000/zh/tools/image-ocr/', { waitUntil: 'networkidle2' });

const dataUrl = await page.evaluate(() => {
  const c = document.createElement('canvas');
  c.width = 400;
  c.height = 120;
  const x = c.getContext('2d');
  x.fillStyle = '#fff';
  x.fillRect(0, 0, 400, 120);
  x.fillStyle = '#000';
  x.font = 'bold 48px Arial';
  x.fillText('HELLO', 50, 80);
  return c.toDataURL('image/png');
});
fs.writeFileSync('_qa_out/ocr-hello2.png', Buffer.from(dataUrl.split(',')[1], 'base64'));

await page.evaluate(() => {
  const s = document.querySelector('select');
  s.value = 'eng';
  s.dispatchEvent(new Event('change', { bubbles: true }));
});
const input = await page.$('input[type="file"]');
await input.uploadFile('_qa_out/ocr-hello2.png');
await new Promise((r) => setTimeout(r, 800));
await page.evaluate(() =>
  [...document.querySelectorAll('button')]
    .find((b) => /开始识别|Recognize/.test(b.textContent || ''))
    ?.click()
);
await new Promise((r) => setTimeout(r, 60000));
const val = await page.evaluate(() => document.querySelector('textarea')?.value || '');
const status = await page.evaluate(() =>
  [...document.querySelectorAll('p')].map((p) => p.textContent).filter(Boolean).slice(0, 10)
);
console.log('RESULT:', JSON.stringify(val));
console.log('STATUS:', status);
console.log('--- LOGS ---');
logs.forEach((l) => console.log(l));
await browser.close();
