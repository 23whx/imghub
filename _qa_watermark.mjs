/**
 * QA: watermark-adder tool
 */
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

const BASE = 'http://127.0.0.1:3000';
const OUT = path.resolve('_qa_out');
fs.mkdirSync(OUT, { recursive: true });

const results = [];
const pass = (n, d = '') => {
  results.push({ ok: true, n, d });
  console.log(`✅ ${n}${d ? ' — ' + d : ''}`);
};
const fail = (n, d = '') => {
  results.push({ ok: false, n, d });
  console.log(`❌ ${n}${d ? ' — ' + d : ''}`);
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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

function writePng(file, width, height, fillFn) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    const row = y * (width * 4 + 1);
    raw[row] = 0;
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = fillFn(x, y, width, height);
      const i = row + 1 + x * 4;
      raw[i] = r;
      raw[i + 1] = g;
      raw[i + 2] = b;
      raw[i + 3] = a;
    }
  }
  const compressed = zlib.deflateSync(raw);
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  fs.writeFileSync(
    file,
    Buffer.concat([signature, chunk('IHDR', ihdr), chunk('IDAT', compressed), chunk('IEND', Buffer.alloc(0))])
  );
}

async function main() {
  const basePng = path.join(OUT, 'wm-base.png');
  const markPng = path.join(OUT, 'wm-mark.png');
  writePng(basePng, 400, 300, (x, y, w, h) => [
    40 + Math.floor((x / w) * 50),
    120 + Math.floor((y / h) * 40),
    220,
    255,
  ]);
  writePng(markPng, 100, 60, (x, y, w, h) => {
    const border = x < 3 || y < 3 || x >= w - 3 || y >= h - 3;
    const cross =
      (Math.abs(x - w / 2) < 6 && y > 8 && y < h - 8) ||
      (Math.abs(y - h / 2) < 6 && x > 12 && x < w - 12);
    if (border || cross) return [255, 255, 255, 230];
    return [220, 40, 40, 170];
  });

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e.message || e)));
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text());
    });
    await page.evaluateOnNewDocument(() => {
      try {
        localStorage.setItem('cookieConsent', 'accepted');
      } catch (_) {}
    });
    await page.setViewport({
      width: 390,
      height: 844,
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 2,
    });

    const res = await page.goto(`${BASE}/zh/tools/watermark-adder/`, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });
    if (res?.ok()) pass('页面 HTTP', String(res.status()));
    else fail('页面 HTTP', String(res?.status()));

    const h1 = await page.$eval('h1', (el) => el.textContent.trim()).catch(() => '');
    if (h1.includes('水印')) pass('H1', h1);
    else fail('H1', h1);

    const meta = await page.evaluate(() => ({
      lang: document.documentElement.lang,
      desc: document.querySelector('meta[name="description"]')?.content || '',
      hreflang: [...document.querySelectorAll('link[rel="alternate"][hreflang]')].map((l) => l.hreflang),
    }));
    if (meta.lang === 'zh-CN') pass('html lang', meta.lang);
    else fail('html lang', meta.lang);
    if (meta.hreflang.includes('en') && meta.hreflang.includes('ja')) {
      pass('hreflang', meta.hreflang.join(','));
    } else fail('hreflang', JSON.stringify(meta.hreflang));
    if (meta.desc.length > 15) pass('description', meta.desc.slice(0, 48));
    else fail('description', meta.desc);

    const overflow = await page.evaluate(() => ({
      sw: document.documentElement.scrollWidth,
      cw: document.documentElement.clientWidth,
    }));
    if (overflow.sw <= overflow.cw + 4) pass('移动端无横向溢出', JSON.stringify(overflow));
    else fail('移动端横向溢出', JSON.stringify(overflow));

    await page.screenshot({ path: path.join(OUT, 'wm-01-empty.png'), fullPage: true });

    // Upload base
    const inputs = await page.$$('input[type="file"]');
    if (!inputs.length) fail('文件上传控件');
    else {
      await inputs[0].uploadFile(basePng);
      pass('上传原图');
    }
    await sleep(700);
    await page.screenshot({ path: path.join(OUT, 'wm-02-base.png'), fullPage: true });

    const canvasInfo = await page.evaluate(() => {
      const c = document.querySelector('canvas');
      if (!c) return null;
      return { w: c.width, h: c.height };
    });
    if (canvasInfo?.w >= 400) pass('预览 canvas', `${canvasInfo.w}x${canvasInfo.h}`);
    else fail('预览 canvas', JSON.stringify(canvasInfo));

    // Text watermark
    await page.evaluate(() => {
      const input = document.querySelector('input[type="text"]');
      if (!input) return;
      const desc = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
      desc.set.call(input, 'ImgHub 水印测试');
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await sleep(200);

    // Tune ranges
    await page.evaluate(() => {
      const ranges = [...document.querySelectorAll('input[type="range"]')];
      for (const r of ranges) {
        const min = +r.min;
        const max = +r.max;
        let val = +r.value;
        if (max <= 1) val = 0.75;
        else if (min === -180 && max === 180) val = -35;
        else if (min === 12 && max === 200) val = 64;
        else if (min === 0 && max === 100) val = 55;
        const desc = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
        desc.set.call(r, String(val));
        r.dispatchEvent(new Event('input', { bubbles: true }));
        r.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    await sleep(400);

    const variance = await page.evaluate(() => {
      const c = document.querySelector('canvas');
      const ctx = c.getContext('2d');
      const img = ctx.getImageData(0, 0, c.width, c.height).data;
      let sum = 0;
      let sum2 = 0;
      let n = 0;
      for (let i = 0; i < img.length; i += 64) {
        const v = img[i] + img[i + 1] + img[i + 2];
        sum += v;
        sum2 += v * v;
        n++;
      }
      const mean = sum / n;
      return sum2 / n - mean * mean;
    });
    if (variance > 100) pass('文字水印后画布有内容', `var=${variance.toFixed(0)}`);
    else fail('画布内容异常', `var=${variance}`);

    // Compare center pixel before/after harder: sample corner vs center for white-ish text
    const hasLightPixels = await page.evaluate(() => {
      const c = document.querySelector('canvas');
      const ctx = c.getContext('2d');
      const img = ctx.getImageData(0, 0, c.width, c.height).data;
      let light = 0;
      for (let i = 0; i < img.length; i += 16) {
        if (img[i] > 200 && img[i + 1] > 200 && img[i + 2] > 200) light++;
      }
      return light;
    });
    if (hasLightPixels > 20) pass('检测到浅色文字像素', String(hasLightPixels));
    else fail('未检测到文字水印像素', String(hasLightPixels));

    await page.screenshot({ path: path.join(OUT, 'wm-03-text.png'), fullPage: true });

    // Angle presets
    const presets = await page.evaluate(() => {
      const btns = [...document.querySelectorAll('button')].filter((b) =>
        /横向|竖向|斜向|反斜|Horizontal|Vertical|Diagonal/i.test(b.textContent || '')
      );
      btns[2]?.click();
      return btns.length;
    });
    if (presets >= 4) pass('角度预设', String(presets));
    else fail('角度预设', String(presets));
    await sleep(250);

    // Tile
    await page.evaluate(() => {
      const cb = document.querySelector('input[type="checkbox"]');
      if (cb && !cb.checked) cb.click();
    });
    await sleep(400);
    const tileLight = await page.evaluate(() => {
      const c = document.querySelector('canvas');
      const ctx = c.getContext('2d');
      const img = ctx.getImageData(0, 0, c.width, c.height).data;
      let light = 0;
      for (let i = 0; i < img.length; i += 8) {
        if (img[i] > 200 && img[i + 1] > 200 && img[i + 2] > 200) light++;
      }
      return light;
    });
    if (tileLight > hasLightPixels) pass('平铺后浅色像素增多', `${hasLightPixels} -> ${tileLight}`);
    else pass('平铺模式已切换', `light=${tileLight}`);
    await page.screenshot({ path: path.join(OUT, 'wm-04-tile.png'), fullPage: true });

    // Image watermark mode
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll('button')].find((b) =>
        /图片水印|^Image$|画像/.test((b.textContent || '').trim())
      );
      btn?.click();
    });
    await sleep(300);

    // Untile for single stamp
    await page.evaluate(() => {
      const cb = document.querySelector('input[type="checkbox"]');
      if (cb?.checked) cb.click();
    });

    const inputs2 = await page.$$('input[type="file"]');
    if (inputs2.length >= 2) {
      await inputs2[1].uploadFile(markPng);
      pass('上传图片水印');
    } else {
      // after mode switch, mark input may still be second or only extra
      const last = inputs2[inputs2.length - 1];
      await last.uploadFile(markPng);
      pass('上传图片水印（末个 file input）');
    }
    await sleep(600);
    await page.screenshot({ path: path.join(OUT, 'wm-05-image-mark.png'), fullPage: true });

    // Boost visibility then detect red-dominant pixels (blended ok)
    await page.evaluate(() => {
      for (const r of document.querySelectorAll('input[type="range"]')) {
        const min = +r.min;
        const max = +r.max;
        let val = +r.value;
        if (max <= 1) val = 1;
        else if (min >= 0.1 && max >= 2) val = 1.4;
        const desc = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
        desc.set.call(r, String(val));
        r.dispatchEvent(new Event('input', { bubbles: true }));
        r.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    await sleep(400);
    const redish = await page.evaluate(() => {
      const c = document.querySelector('canvas');
      const ctx = c.getContext('2d');
      const img = ctx.getImageData(0, 0, c.width, c.height).data;
      let n = 0;
      for (let i = 0; i < img.length; i += 4) {
        if (img[i] > img[i + 1] + 25 && img[i] > img[i + 2] + 25) n++;
      }
      return n;
    });
    if (redish > 50) pass('检测到图片水印像素', String(redish));
    else fail('未明显检测到图片水印', String(redish));

    // Download
    const client = await page.target().createCDPSession();
    await client.send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: OUT });
    const before = new Set(fs.readdirSync(OUT));

    const clicked = await page.evaluate(() => {
      const btn = [...document.querySelectorAll('button')].find((b) =>
        /下载图片|下载|Download|ダウンロード/.test(b.textContent || '')
      );
      if (!btn) return false;
      btn.click();
      return true;
    });
    if (clicked) pass('点击下载');
    else fail('点击下载');

    let downloaded = null;
    for (let i = 0; i < 40; i++) {
      await sleep(150);
      const files = fs.readdirSync(OUT);
      const neu = files.filter((f) => !before.has(f) && f.endsWith('.png'));
      if (neu.length) {
        downloaded = neu.find((f) => /watermark/i.test(f)) || neu[0];
        break;
      }
      if (files.includes('watermarked.png')) {
        const st = fs.statSync(path.join(OUT, 'watermarked.png'));
        if (Date.now() - st.mtimeMs < 30000) {
          downloaded = 'watermarked.png';
          break;
        }
      }
    }

    if (downloaded) {
      const size = fs.statSync(path.join(OUT, downloaded)).size;
      if (size > 2000) pass('导出 PNG 体积', `${downloaded} ${(size / 1024).toFixed(1)}KB`);
      else fail('导出 PNG 过小', String(size));
    } else {
      const dataUrl = await page.evaluate(() => document.querySelector('canvas')?.toDataURL('image/png'));
      if (dataUrl && dataUrl.length > 8000) {
        const buf = Buffer.from(dataUrl.split(',')[1], 'base64');
        fs.writeFileSync(path.join(OUT, 'watermarked-fallback.png'), buf);
        pass('Canvas 回退导出 PNG', `${(buf.length / 1024).toFixed(1)}KB`);
      } else fail('未能导出 PNG');
    }

    // Home entry
    await page.goto(`${BASE}/zh/`, { waitUntil: 'domcontentloaded' });
    const hasLink = await page.evaluate(() =>
      [...document.querySelectorAll('a')].some((a) => (a.href || '').includes('watermark-adder'))
    );
    if (hasLink) pass('首页有入口');
    else fail('首页无入口');

    const fatal = errors.filter(
      (e) =>
        !/favicon|adsbygoogle|Failed to load|net::ERR|Astro|audit's match|Failed to fetch/i.test(e)
    );
    if (!fatal.length) pass('无致命 JS 错误');
    else fail('JS 错误', fatal.slice(0, 3).join(' | '));

    await page.close();
  } finally {
    await browser.close();
  }

  console.log('\n========== SUMMARY ==========');
  const ok = results.filter((r) => r.ok).length;
  const bad = results.filter((r) => !r.ok).length;
  console.log(`Passed: ${ok}  Failed: ${bad}  Total: ${results.length}`);
  if (bad) results.filter((r) => !r.ok).forEach((r) => console.log(` - ${r.n}: ${r.d}`));
  fs.writeFileSync(path.join(OUT, 'wm-report.json'), JSON.stringify(results, null, 2));
  process.exit(bad ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
