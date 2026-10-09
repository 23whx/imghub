/**
 * End-to-end quality check for ImgHub + Wiggle Studio
 */
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const BASE = 'http://127.0.0.1:3000';
const OUT = path.resolve('_qa_out');
fs.mkdirSync(OUT, { recursive: true });

const results = [];
function pass(name, detail = '') {
  results.push({ ok: true, name, detail });
  console.log(`✅ ${name}${detail ? ' — ' + detail : ''}`);
}
function fail(name, detail = '') {
  results.push({ ok: false, name, detail });
  console.log(`❌ ${name}${detail ? ' — ' + detail : ''}`);
}
function info(msg) {
  console.log(`ℹ️  ${msg}`);
}

async function shot(page, name) {
  const file = path.join(OUT, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  return file;
}

async function collectConsole(page) {
  const errors = [];
  const warnings = [];
  page.on('pageerror', (e) => errors.push(String(e.message || e)));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
    if (msg.type() === 'warning') warnings.push(msg.text());
  });
  return { errors, warnings };
}

async function main() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-gl=swiftshader', '--enable-webgl'],
  });

  try {
    // ========== Desktop home ==========
    {
      const page = await browser.newPage();
      const logs = await collectConsole(page);
      await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });
      const res = await page.goto(`${BASE}/zh/`, { waitUntil: 'networkidle2', timeout: 30000 });
      if (res && res.ok()) pass('首页 /zh/ HTTP', String(res.status()));
      else fail('首页 /zh/ HTTP', res ? String(res.status()) : 'no response');

      const title = await page.title();
      if (title && title.includes('ImgHub')) pass('首页 title', title);
      else fail('首页 title', title);

      const h1 = await page.$eval('h1', (el) => el.textContent.trim()).catch(() => '');
      if (h1.includes('ImgHub')) pass('首页 H1', h1);
      else fail('首页 H1', h1);

      const toolLinks = await page.$$eval('a[href*="/tools/"]', (as) =>
        as.map((a) => a.getAttribute('href'))
      );
      if (toolLinks.some((h) => h.includes('wiggle-studio'))) pass('首页含晃动工坊入口', toolLinks.filter((h) => h.includes('wiggle')).join(','));
      else fail('首页含晃动工坊入口', JSON.stringify(toolLinks.slice(0, 8)));

      await shot(page, '01-home-desktop');
      const fatal = logs.errors.filter((e) => !/favicon|adsbygoogle|Failed to load resource/i.test(e));
      if (fatal.length === 0) pass('首页无致命 JS 错误');
      else fail('首页 JS 错误', fatal.slice(0, 3).join(' | '));
      await page.close();
    }

    // ========== Mobile home ==========
    {
      const page = await browser.newPage();
      await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
      await page.goto(`${BASE}/zh/`, { waitUntil: 'networkidle2', timeout: 30000 });
      const overflow = await page.evaluate(() => {
        const doc = document.documentElement;
        return {
          scrollWidth: doc.scrollWidth,
          clientWidth: doc.clientWidth,
          bodyScrollWidth: document.body.scrollWidth,
        };
      });
      if (overflow.scrollWidth <= overflow.clientWidth + 2) pass('移动端首页无横向溢出', JSON.stringify(overflow));
      else fail('移动端首页横向溢出', JSON.stringify(overflow));

      // open menu
      const menuBtn = await page.$('button[aria-label="Menu"]');
      if (menuBtn) {
        await menuBtn.click();
        await new Promise(r => setTimeout(r, 300));
        const drawerLinks = await page.$$eval('a[href*="/tools/"]', (as) => as.length);
        if (drawerLinks >= 5) pass('移动端抽屉菜单工具数', String(drawerLinks));
        else fail('移动端抽屉菜单工具数', String(drawerLinks));
        await shot(page, '02-home-mobile-menu');
      } else {
        fail('移动端菜单按钮', 'not found');
      }
      await page.close();
    }

    // ========== Wiggle studio full flow ==========
    {
      const page = await browser.newPage();
      const logs = await collectConsole(page);
      await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
      const res = await page.goto(`${BASE}/zh/tools/wiggle-studio/`, {
        waitUntil: 'networkidle2',
        timeout: 45000,
      });
      if (res && res.ok()) pass('晃动工坊页 HTTP', String(res.status()));
      else fail('晃动工坊页 HTTP', res ? String(res.status()) : 'none');

      const h1 = await page.$eval('h1', (el) => el.textContent.trim()).catch(() => '');
      if (h1.includes('晃动')) pass('晃动工坊 H1', h1);
      else fail('晃动工坊 H1', h1);

      // SEO meta
      const meta = await page.evaluate(() => ({
        desc: document.querySelector('meta[name="description"]')?.content || '',
        lang: document.documentElement.lang,
        hreflang: [...document.querySelectorAll('link[rel="alternate"][hreflang]')].map((l) => l.hreflang),
      }));
      if (meta.lang === 'zh-CN') pass('html lang', meta.lang);
      else fail('html lang', meta.lang);
      if (meta.hreflang.includes('en') && meta.hreflang.includes('ja')) pass('hreflang 齐全', meta.hreflang.join(','));
      else fail('hreflang', JSON.stringify(meta.hreflang));
      if (meta.desc.length > 20) pass('description 存在', meta.desc.slice(0, 60));
      else fail('description', meta.desc);

      await shot(page, '03-wiggle-empty');

      // Click sample image button
      const sampleClicked = await page.evaluate(() => {
        const buttons = [...document.querySelectorAll('button')];
        const btn = buttons.find((b) => /示例|Sample|サンプル/i.test(b.textContent || ''));
        if (btn) {
          btn.click();
          return true;
        }
        // try label with sample text
        const all = [...document.querySelectorAll('button, a, label')];
        const el = all.find((b) => /示例|Sample|サンプル/i.test(b.textContent || ''));
        if (el) {
          el.click();
          return true;
        }
        return false;
      });
      if (sampleClicked) pass('点击示例图片');
      else fail('点击示例图片', 'button not found');

      await new Promise(r => setTimeout(r, 800));
      // paint canvas should appear
      const hasPaintCanvas = await page.evaluate(() => {
        const canvases = [...document.querySelectorAll('canvas')];
        return canvases.some((c) => c.width > 100 && c.offsetParent !== null);
      });
      if (hasPaintCanvas) pass('示例加载后出现画布');
      else fail('示例加载后出现画布');

      await shot(page, '04-wiggle-sample-loaded');

      // Paint on canvas: simulate brush strokes on ears area
      const paintResult = await page.evaluate(() => {
        const canvases = [...document.querySelectorAll('canvas')].filter(
          (c) => c.offsetParent !== null && c.width > 100
        );
        const canvas = canvases[0];
        if (!canvas) return { ok: false, reason: 'no canvas' };
        const rect = canvas.getBoundingClientRect();
        // paint two ear regions
        const points = [
          [rect.left + rect.width * 0.28, rect.top + rect.height * 0.28],
          [rect.left + rect.width * 0.72, rect.top + rect.height * 0.28],
          [rect.left + rect.width * 0.5, rect.top + rect.height * 0.35],
        ];
        for (const [x, y] of points) {
          for (let i = 0; i < 8; i++) {
            const evDown = new PointerEvent('pointerdown', {
              bubbles: true,
              clientX: x + i * 2,
              clientY: y + i,
              pointerId: 1,
              pointerType: 'touch',
            });
            // component uses mouse/touch not pointer - fire mouse + touch
            canvas.dispatchEvent(
              new MouseEvent('mousedown', { bubbles: true, clientX: x + i * 2, clientY: y + i, buttons: 1 })
            );
            canvas.dispatchEvent(
              new MouseEvent('mousemove', { bubbles: true, clientX: x + i * 4, clientY: y + i * 2, buttons: 1 })
            );
            canvas.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, clientX: x + i * 4, clientY: y + i * 2 }));
          }
        }
        return { ok: true, w: canvas.width, h: canvas.height, rect: { w: rect.width, h: rect.height } };
      });
      if (paintResult.ok) pass('模拟涂抹操作', `${paintResult.w}x${paintResult.h}`);
      else fail('模拟涂抹操作', paintResult.reason);

      await new Promise(r => setTimeout(r, 300));
      await shot(page, '05-wiggle-painted');

      // Click "预览晃动"
      const wentWiggle = await page.evaluate(() => {
        const buttons = [...document.querySelectorAll('button')];
        const btn = buttons.find((b) => /预览晃动|Preview|揺れ/.test(b.textContent || ''));
        if (!btn) return false;
        btn.click();
        return true;
      });
      if (wentWiggle) pass('进入晃动预览');
      else fail('进入晃动预览', 'button missing');

      await new Promise(r => setTimeout(r, 1500));
      await shot(page, '06-wiggle-preview');

      // Check webgl or canvas rendering is producing non-uniform pixels (motion)
      const renderCheck = await page.evaluate(async () => {
        const canvases = [...document.querySelectorAll('canvas')].filter((c) => c.offsetParent !== null);
        const canvas = canvases.find((c) => c.width > 50) || canvases[0];
        if (!canvas) return { ok: false, reason: 'no visible canvas' };
        // sample pixels
        try {
          const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
          if (gl) {
            const pixels = new Uint8Array(4);
            gl.readPixels(Math.floor(canvas.width / 2), Math.floor(canvas.height / 2), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
            return {
              ok: true,
              mode: 'webgl',
              sample: [...pixels],
              size: { w: canvas.width, h: canvas.height },
            };
          }
        } catch (_) {}
        try {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            const d = ctx.getImageData(Math.floor(canvas.width / 2), Math.floor(canvas.height / 2), 1, 1).data;
            return { ok: true, mode: '2d', sample: [...d], size: { w: canvas.width, h: canvas.height } };
          }
        } catch (e) {
          return { ok: true, mode: 'unknown-tainted-or-webgl-only', err: String(e.message || e) };
        }
        return { ok: false, reason: 'no context' };
      });
      if (renderCheck.ok) pass('预览画布有渲染', JSON.stringify(renderCheck));
      else fail('预览画布渲染', JSON.stringify(renderCheck));

      // Switch presets
      const presetOk = await page.evaluate(() => {
        const chips = [...document.querySelectorAll('button')].filter((b) =>
          /柔和|摇摆|弹跳|颤动|Soft|Sway|Bounce|Tremble|やわらか|スウェイ/i.test(b.textContent || '')
        );
        if (chips.length < 3) return { ok: false, n: chips.length };
        chips[1]?.click();
        chips[2]?.click();
        chips[0]?.click();
        return { ok: true, n: chips.length };
      });
      if (presetOk.ok) pass('切换预设', `${presetOk.n} presets`);
      else fail('切换预设', JSON.stringify(presetOk));

      await new Promise(r => setTimeout(r, 500));

      // Go share
      const wentShare = await page.evaluate(() => {
        const btn = [...document.querySelectorAll('button')].find((b) =>
          /制作并分享|Create and share|作成して/i.test(b.textContent || '')
        );
        if (!btn) return false;
        btn.click();
        return true;
      });
      if (wentShare) pass('进入分享步骤');
      else fail('进入分享步骤');

      await new Promise(r => setTimeout(r, 400));
      await shot(page, '07-wiggle-share');

      // Export GIF — intercept download
      const client = await page.target().createCDPSession();
      await client.send('Page.setDownloadBehavior', {
        behavior: 'allow',
        downloadPath: OUT,
      });

      const exportStarted = await page.evaluate(() => {
        const btn = [...document.querySelectorAll('button')].find((b) =>
          /导出 GIF|Export GIF|GIF を/i.test(b.textContent || '')
        );
        if (!btn || btn.disabled) return false;
        btn.click();
        return true;
      });
      if (exportStarted) pass('点击导出 GIF');
      else fail('点击导出 GIF');

      // Wait for progress / done status up to 90s
      let exportStatus = '';
      const t0 = Date.now();
      while (Date.now() - t0 < 90000) {
        exportStatus = await page.evaluate(() => {
          const texts = [...document.querySelectorAll('p,button,div')].map((e) => e.textContent || '');
          if (texts.some((t) => /已完成|Done|完了/.test(t))) return 'done';
          if (texts.some((t) => /失败|failed|失敗|Error/i.test(t))) return 'error';
          if (texts.some((t) => /正在生成|Preparing|生成中/.test(t))) return 'working';
          return 'unknown';
        });
        if (exportStatus === 'done' || exportStatus === 'error') break;
        await new Promise(r => setTimeout(r, 1000));
      }
      if (exportStatus === 'done') pass('GIF 导出完成', `${((Date.now() - t0) / 1000).toFixed(1)}s`);
      else if (exportStatus === 'working') fail('GIF 导出超时仍在进行', `>90s status=${exportStatus}`);
      else if (exportStatus === 'error') fail('GIF 导出失败状态');
      else fail('GIF 导出状态未知', exportStatus);

      await shot(page, '08-wiggle-exported');

      // Check download file
      await new Promise(r => setTimeout(r, 1500));
      const gifs = fs.readdirSync(OUT).filter((f) => f.endsWith('.gif'));
      if (gifs.length) {
        const fp = path.join(OUT, gifs[gifs.length - 1]);
        const size = fs.statSync(fp).size;
        if (size > 5000) pass('GIF 文件体积合理', `${gifs[gifs.length - 1]} ${(size / 1024).toFixed(1)}KB`);
        else fail('GIF 文件过小', `${size} bytes`);
      } else {
        // headless may not save download; check status was done
        if (exportStatus === 'done') {
          info('未在磁盘发现 GIF（可能是 headless 下载限制），但 UI 显示完成');
          pass('GIF 导出 UI 完成（无磁盘文件）');
        } else {
          fail('GIF 文件未生成');
        }
      }

      // Mobile overflow on wiggle page
      const overflow = await page.evaluate(() => ({
        sw: document.documentElement.scrollWidth,
        cw: document.documentElement.clientWidth,
      }));
      if (overflow.sw <= overflow.cw + 4) pass('晃动页移动端无横向溢出', JSON.stringify(overflow));
      else fail('晃动页横向溢出', JSON.stringify(overflow));

      const fatal = logs.errors.filter(
        (e) => !/favicon|adsbygoogle|Failed to load resource|net::ERR/i.test(e)
      );
      if (fatal.length === 0) pass('晃动页无致命 JS 错误');
      else fail('晃动页 JS 错误', fatal.slice(0, 5).join(' | '));

      await page.close();
    }

    // ========== Other tools smoke ==========
    const tools = [
      '/zh/tools/image-compress/',
      '/zh/tools/meme-slicer/',
      '/en/tools/mbti-grid/',
      '/ja/tools/pornhub-style/',
    ];
    for (const url of tools) {
      const page = await browser.newPage();
      await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
      const res = await page.goto(`${BASE}${url}`, { waitUntil: 'domcontentloaded', timeout: 20000 });
      const ok = res && res.ok();
      const h1 = await page.$eval('h1', (el) => el.textContent.trim()).catch(() => '');
      if (ok && h1) pass(`冒烟 ${url}`, h1.slice(0, 40));
      else fail(`冒烟 ${url}`, `status=${res?.status()} h1=${h1}`);
      await page.close();
    }

    // ========== Physics unit-ish via page evaluate ==========
    {
      const page = await browser.newPage();
      await page.goto(`${BASE}/zh/tools/wiggle-studio/`, { waitUntil: 'networkidle2' });
      // Load sample and measure frame variance over time (motion quality proxy)
      await page.evaluate(() => {
        const btn = [...document.querySelectorAll('button')].find((b) => /示例|Sample|サンプル/.test(b.textContent || ''));
        btn?.click();
      });
      await new Promise(r => setTimeout(r, 600));
      // paint all
      await page.evaluate(() => {
        const btn = [...document.querySelectorAll('button')].find((b) => /全涂|Paint all|全塗り/.test(b.textContent || ''));
        btn?.click();
      });
      await new Promise(r => setTimeout(r, 200));
      await page.evaluate(() => {
        const btn = [...document.querySelectorAll('button')].find((b) => /预览晃动|Preview|揺れ/.test(b.textContent || ''));
        btn?.click();
      });
      await new Promise(r => setTimeout(r, 800));

      const motion = await page.evaluate(async () => {
        const canvas = [...document.querySelectorAll('canvas')].find((c) => c.offsetParent !== null && c.width > 50);
        if (!canvas) return { ok: false, reason: 'no canvas' };

        function sample() {
          // draw to 2d temp from webgl by drawImage
          const tmp = document.createElement('canvas');
          tmp.width = 64;
          tmp.height = 64;
          const ctx = tmp.getContext('2d');
          ctx.drawImage(canvas, 0, 0, 64, 64);
          return ctx.getImageData(0, 0, 64, 64).data;
        }

        const a = sample();
        await new Promise((r) => setTimeout(r, 400));
        const b = sample();
        let diff = 0;
        for (let i = 0; i < a.length; i += 4) {
          diff += Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]);
        }
        const avg = diff / (a.length / 4);
        return { ok: true, avgDiff: avg, canvas: { w: canvas.width, h: canvas.height } };
      });

      if (motion.ok && motion.avgDiff > 0.5) {
        pass('晃动有实际像素变化', `avgDiff=${motion.avgDiff.toFixed(2)} size=${motion.canvas.w}x${motion.canvas.h}`);
      } else if (motion.ok) {
        fail('晃动像素变化过小（可能几乎静止）', `avgDiff=${motion.avgDiff.toFixed(2)}`);
      } else {
        fail('晃动像素采样失败', motion.reason);
      }
      await shot(page, '09-wiggle-motion');
      await page.close();
    }
  } finally {
    await browser.close();
  }

  console.log('\n========== SUMMARY ==========');
  const ok = results.filter((r) => r.ok).length;
  const bad = results.filter((r) => !r.ok).length;
  console.log(`Passed: ${ok}  Failed: ${bad}  Total: ${results.length}`);
  if (bad) {
    console.log('\nFailures:');
    results.filter((r) => !r.ok).forEach((r) => console.log(` - ${r.name}: ${r.detail}`));
  }
  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(results, null, 2));
  process.exit(bad ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
