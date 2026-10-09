// Run against `npm run dev -- --port 3001` (or set DRAWING_TEST_URL).
import puppeteer from 'puppeteer';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const base = process.env.DRAWING_TEST_URL || 'http://127.0.0.1:3001';
const out = path.resolve('test-results/drawing');
await fs.mkdir(out, { recursive: true });
const chrome = process.env.DRAWING_TEST_CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const browser = await puppeteer.launch({ headless: true, executablePath: chrome });
const errors = [], checks = [];
function pass(name) { checks.push(name); console.log(`PASS ${name}`); }
async function localRequests(page) {
  // Site ads are unrelated to editor correctness and can fail nondeterministically.
  await page.setRequestInterception(true);
  page.on('request', request => /googlesyndication\.com|doubleclick\.net/.test(request.url()) ? request.abort() : request.continue());
}
async function click(page, selector) { await page.locator(selector).click(); }
async function tool(page, name) { await click(page, `.draw-toolbar button[aria-label="${name}"]`); }
async function at(page, x, y) {
  return page.$eval('.draw-overlay', (canvas, x, y) => { const r = canvas.getBoundingClientRect(); return { x: r.left + x / canvas.width * r.width, y: r.top + y / canvas.height * r.height }; }, x, y);
}
async function drag(page, x1, y1, x2, y2) {
  await page.$eval('.draw-overlay', el => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
  const a = await at(page, x1, y1), b = await at(page, x2, y2);
  await page.mouse.move(a.x, a.y); await page.mouse.down(); await page.mouse.move(b.x, b.y, { steps: 12 }); await page.mouse.up();
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}
async function pixel(page, x, y) { return page.$eval('.draw-art', (el, x, y) => Array.from(el.getContext('2d').getImageData(x, y, 1, 1).data), x, y); }
async function waitLayers(page, count) { await page.waitForFunction(count => document.querySelectorAll('.draw-layer-row').length === count, {}, count); }
async function capturedBlob(page, type) {
  await page.waitForFunction(type => window.__downloadBlob?.type === type, {}, type);
  return page.evaluate(async () => {
    const blob = window.__downloadBlob;
    return { type: blob.type, bytes: Array.from(new Uint8Array(await blob.arrayBuffer())), text: blob.type === 'application/json' ? await blob.text() : null };
  });
}

try {
  const page = await browser.newPage();
  await localRequests(page);
  page.on('pageerror', e => { errors.push(e.stack || e.message); console.log('BROWSER ERROR', e.stack || e.message); });
  await page.setViewport({ width: 1440, height: 1050 });
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('cookieConsent', 'accepted');
    const original = URL.createObjectURL;
    URL.createObjectURL = blob => { window.__downloadBlob = blob; return original(blob); };
  });
  await page.goto(`${base}/zh/tools/online-drawing`, { waitUntil: 'networkidle0' });
  await page.waitForSelector('.draw-art');
  await page.evaluate(() => { document.querySelector('.cookie-consent')?.remove(); document.querySelector('astro-dev-toolbar')?.remove(); });
  assert((await page.title()).includes('在线画图'));
  pass('Chinese route hydrates with localized SEO');
  await tool(page, '画笔'); await drag(page, 80, 100, 280, 100); await waitLayers(page, 1);
  assert((await pixel(page, 180, 100))[0] < 200); pass('Brush creates a layer and changes actual pixels');
  await click(page, 'button[aria-label="撤销 (Ctrl+Z)"]'); await waitLayers(page, 0);
  assert.deepEqual(await pixel(page, 180, 100), [255, 255, 255, 255]);
  await click(page, 'button[aria-label="重做 (Ctrl+Shift+Z)"]'); await waitLayers(page, 1);
  assert((await pixel(page, 180, 100))[0] < 200); pass('Undo and redo restore pixels and layers');
  await tool(page, '橡皮擦'); await drag(page, 175, 95, 185, 105);
  assert.deepEqual(await pixel(page, 180, 100), [255, 255, 255, 255]); pass('Eraser removes only active layer pixels');
  await tool(page, '矩形'); await drag(page, 350, 180, 600, 380); await waitLayers(page, 2);
  await tool(page, '椭圆'); await drag(page, 650, 180, 900, 380); await waitLayers(page, 3);
  await tool(page, '直线'); await drag(page, 900, 500, 700, 620); await waitLayers(page, 4);
  assert((await pixel(page, 400, 250))[0] < 200); assert((await pixel(page, 775, 280))[0] < 200); pass('Rectangle, ellipse, and descending line render');
  await tool(page, '文字'); await click(page, 'textarea[aria-label="编辑文字"]');
  await page.keyboard.down('Control'); await page.keyboard.press('KeyA'); await page.keyboard.up('Control'); await page.keyboard.type('Drawing test');
  await page.$eval('.draw-overlay', el => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
  const p = await at(page, 90, 460); await page.mouse.click(p.x, p.y); await waitLayers(page, 5);
  assert.equal(await page.$eval('.draw-layer-row.is-selected .draw-layer-select span', el => el.childNodes[0].textContent), 'Drawing test');
  await click(page, 'textarea[aria-label="编辑文字"]'); await page.keyboard.type('!');
  pass('Text is added as an editable layer');
  await tool(page, '移动 / 缩放'); await click(page, 'button[aria-label="复制图层"]'); await waitLayers(page, 6);
  await click(page, 'button[aria-label="下移图层"]');
  await click(page, 'button[aria-label="上移图层"]');
  await click(page, 'button[aria-label="删除图层"]'); await waitLayers(page, 5); pass('Layer duplication, ordering, and deletion');
  await click(page, '#draw-adjust-tab');
  await page.$eval('input[aria-label="亮度"]', el => { const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; setter.call(el, '150'); el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); });
  await click(page, '#draw-layers-tab');
  await click(page, '.draw-export-actions button[title]');
  const saved = await capturedBlob(page, 'application/json'); assert.equal(saved.type, 'application/json');
  const project = JSON.parse(saved.text); assert.equal(project.layers.length, 5); assert.equal(project.format, 'imghub-drawing');
  const projectFile = path.join(out, 'roundtrip.imghub.json'); await fs.writeFile(projectFile, saved.text);
  const before = await page.$eval('.draw-art', el => el.toDataURL());
  const open = await page.$('input[aria-label="打开图片 / 工程"]'); await open.uploadFile(projectFile);
  await page.waitForFunction(() => document.querySelector('.draw-notice')?.textContent.includes('工程已打开'));
  assert.equal(await page.$eval('.draw-art', el => el.toDataURL()), before); pass('Saved project reopens with identical pixels and layer metadata');
  await tool(page, '裁剪'); await drag(page, 50, 50, 1050, 700);
  await click(page, '.draw-options .draw-primary');
  assert.deepEqual(await page.$eval('.draw-art', el => [el.width, el.height]), [1000, 650]);
  await click(page, 'button[aria-label="撤销 (Ctrl+Z)"]');
  await page.waitForFunction(() => document.querySelector('.draw-art').width === 1200); pass('Crop changes bounds; undo restores original document');
  await click(page, '.draw-export-actions .draw-primary');
  await click(page, 'dialog button[type="submit"]');
  const png = await capturedBlob(page, 'image/png'); assert.equal(png.type, 'image/png');
  const pngMeta = await sharp(Buffer.from(png.bytes)).metadata(); assert.equal(pngMeta.width, 1200); assert.equal(pngMeta.height, 800);
  await fs.writeFile(path.join(out, 'export.png'), Buffer.from(png.bytes)); pass('PNG exports original dimensions without editor overlays');
  for (const format of ['jpeg', 'webp']) {
    await click(page, '.draw-export-actions .draw-primary');
    await page.select('dialog select', format); await click(page, 'dialog button[type="submit"]');
    const result = await capturedBlob(page, `image/${format}`); assert.equal(result.type, `image/${format}`); const metadata = await sharp(Buffer.from(result.bytes)).metadata(); assert.equal(metadata.width, 1200);
    pass(`${format.toUpperCase()} export produces the correct image format`);
  }
  // Test the engine's data integrity and compositing in the actual browser.
  const engineChecks = await page.evaluate(async () => {
    const { DrawingDocument, makeLayer, surface, textSurface } = await import('/src/utils/drawingEngine.js');
    const doc = new DrawingDocument(100, 80, 'transparent'); const c = surface(50, 40); const ctx = c.getContext('2d'); ctx.fillStyle = '#ff0000'; ctx.fillRect(0, 0, 50, 40);
    doc.begin(); doc.add(makeLayer('image', 'Red', c, { x: 10, y: 10 })); doc.commit();
    doc.begin(); doc.stroke(doc.active, { x: 30, y: 30 }, { x: 30, y: 30 }, 10, '#000000', true); doc.commit();
    const erased = doc.exportCanvas().getContext('2d').getImageData(30, 30, 1, 1).data[3] === 0;
    await doc.undo(); const restored = doc.exportCanvas().getContext('2d').getImageData(30, 30, 1, 1).data[0] === 255;
    const jpegWhite = Array.from(doc.exportCanvas('jpeg').getContext('2d').getImageData(0, 0, 1, 1).data).join() === '255,255,255,255';
    doc.begin(); doc.crop({ x: 15, y: 15, width: 50, height: 40 }); doc.commit();
    const cropped = doc.active.x === -5 && doc.width === 50; await doc.undo();
    const uncropped = doc.active.x === 10 && doc.width === 100;
    const saved = doc.serialize(), next = new DrawingDocument(); await next.restore(saved);
    const equal = next.exportCanvas().toDataURL() === doc.exportCanvas().toDataURL();
    let invalid = false; try { await next.restore(JSON.stringify({ format: 'other' })); } catch { invalid = true; }
    const atomic = next.width === 100 && next.layers.length === 1;
    doc.resize(200, 160, true); const scaled = doc.active.x === 20 && doc.active.width === 100;
    const hiddenLayer = doc.active; hiddenLayer.visible = false;
    const hidden = doc.exportCanvas().getContext('2d').getImageData(40, 40, 1, 1).data[3] === 0;
    hiddenLayer.visible = true; hiddenLayer.locked = true; const locked = !doc.hit({ x: 40, y: 40 });
    const text = textSurface('Hello\nworld', 30, 'serif', '#000000'); const textLayer = makeLayer('text', 'Words', text, { text: 'Hello\nworld', fontSize: 30, fontFamily: 'serif', color: '#000000', bold: false }); doc.add(textLayer);
    const another = new DrawingDocument(); await another.restore(doc.serialize()); const editable = another.active.type === 'text' && another.active.text === 'Hello\nworld';
    return { erased, restored, jpegWhite, cropped, uncropped, equal, invalid, atomic, scaled, hidden, locked, editable };
  });
  for (const [name, result] of Object.entries(engineChecks)) assert.equal(result, true, name);
  pass('Engine: transparent erasure, compositing, bounds, transforms, project validation, and editable text');
  // Image imports and invalid files must leave artwork recoverable.
  const fixture = path.join(out, 'fixture.png'); await sharp({ create: { width: 240, height: 160, channels: 4, background: '#39a6b2' } }).png().toFile(fixture);
  await (await page.$('input[aria-label="添加图片"]')).uploadFile(fixture); await waitLayers(page, 6); pass('Local image import adds a layer');
  await tool(page, '移动 / 缩放'); await drag(page, 500, 340, 550, 380);
  assert.equal(await page.$eval('input[aria-label="图层属性 X"]', el => el.value), '530');
  assert.equal(await page.$eval('input[aria-label="图层属性 Y"]', el => el.value), '360');
  await drag(page, 770, 520, 890, 600);
  assert.equal(await page.$eval('input[aria-label="图层属性 宽度"]', el => el.value), '360');
  assert.equal(await page.$eval('input[aria-label="图层属性 高度"]', el => el.value), '240');
  pass('Move and corner resize update layer transforms');
  await page.$eval('input[aria-label="图层属性 旋转"]', el => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, '45'); el.dispatchEvent(new Event('input', { bubbles: true })); });
  await click(page, 'button[aria-label="水平翻转"]');
  await click(page, '.draw-layer-row.is-selected button[title^="锁定图层"]');
  const lockedPixels = await page.$eval('.draw-art', el => el.toDataURL());
  await tool(page, '画笔'); await drag(page, 650, 460, 700, 500);
  assert.equal(await page.$eval('.draw-art', el => el.toDataURL()), lockedPixels);
  await click(page, '.draw-layer-row.is-selected button[title^="解锁图层"]'); pass('Rotation / flip work and locked layers reject brush edits');
  await tool(page, '油漆桶');
  await page.$eval('.draw-options input[type="color"]', el => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, '#bb3344'); el.dispatchEvent(new Event('input', { bubbles: true })); });
  await page.$eval('.draw-overlay', el => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
  const fillAt = await at(page, 710, 480); await page.mouse.click(fillAt.x, fillAt.y);
  await page.waitForFunction(() => document.querySelector('.draw-art').getContext('2d').getImageData(710, 480, 1, 1).data[0] === 187);
  await tool(page, '吸管'); await page.mouse.click(fillAt.x, fillAt.y);
  assert.equal(await page.$eval('.draw-options input[type="color"]', el => el.value), '#bb3344'); pass('Bucket fill and eyedropper operate on transformed layers');
  await page.evaluate(() => document.activeElement?.blur());
  await page.keyboard.down('Control'); await page.keyboard.down('Shift'); await page.keyboard.press('KeyN'); await page.keyboard.up('Shift'); await page.keyboard.up('Control'); await waitLayers(page, 7);
  await page.keyboard.down('Control'); await page.keyboard.press('KeyZ'); await page.keyboard.up('Control'); await waitLayers(page, 6); pass('Keyboard layer creation and undo');
  await page.waitForFunction(() => document.querySelector('.drawing-studio').getAttribute('aria-busy') === 'false');
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await click(page, 'button[aria-label="全屏编辑"]');
  await page.waitForFunction(() => !!document.fullscreenElement);
  assert.equal(await page.$eval('.draw-art', el => el.width), 1200);
  await click(page, 'button[aria-label="退出全屏"]'); await page.waitForFunction(() => !document.fullscreenElement); pass('Fullscreen preserves document resolution');
  const invalid = path.join(out, 'invalid.imghub.json'); await fs.writeFile(invalid, '{"format":"invalid"}');
  await open.uploadFile(invalid); await page.waitForFunction(() => document.querySelector('.draw-notice.is-error'));
  assert.equal(await page.$$eval('.draw-layer-row', rows => rows.length), 6); pass('Invalid project displays an error without losing current work');
  await page.evaluate(() => document.querySelector('.draw-notice button')?.click());
  await page.evaluate(() => { document.activeElement?.blur(); window.scrollTo({ top: 0, behavior: 'instant' }); });
  await page.evaluate(() => document.querySelector('.draw-heading').scrollIntoView({ block: 'start' }));
  await page.screenshot({ path: path.join(out, 'desktop-light.png'), fullPage: true });
  await page.evaluate(() => document.documentElement.classList.add('dark'));
  await page.screenshot({ path: path.join(out, 'desktop-dark.png'), fullPage: true });
  pass('Light and dark workspaces render');
  await click(page, '.draw-file-actions button:first-child'); await click(page, 'dialog button[type="submit"]');
  assert.equal(await page.$eval('#draw-dialog-title', el => el.textContent), '创建新作品？');
  await click(page, '.draw-replace-actions button:last-child'); await waitLayers(page, 6); pass('New artwork protects unsaved work with a save / cancel choice');
  await page.keyboard.press('Escape');
  await page.evaluate(() => document.documentElement.classList.remove('dark'));
  for (const width of [360, 390, 768]) {
    const mobile = await browser.newPage(); mobile.on('pageerror', e => { errors.push(e.stack || e.message); console.log('BROWSER ERROR', e.stack || e.message); });
    await localRequests(mobile);
    await mobile.setViewport({ width, height: 844, isMobile: width < 760, hasTouch: width < 760 });
    await mobile.evaluateOnNewDocument(() => localStorage.setItem('cookieConsent', 'accepted'));
    await mobile.goto(`${base}/zh/tools/online-drawing`, { waitUntil: 'networkidle0' });
    await mobile.waitForSelector('.draw-art');
    await mobile.evaluate(() => document.querySelector('astro-dev-toolbar')?.remove());
    await (await mobile.$('input[aria-label="打开图片 / 工程"]')).uploadFile(projectFile);
    await mobile.waitForFunction(() => document.querySelectorAll('.draw-layer-row').length === 5);
    await mobile.evaluate(() => document.querySelector('.draw-notice button')?.click());
    const overflow = await mobile.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    assert.equal(overflow, false, `overflow at ${width}`);
    await mobile.screenshot({ path: path.join(out, `mobile-${width}.png`), fullPage: true });
    await mobile.close();
    pass(`Responsive layout has no horizontal overflow at ${width}px`);
  }
  for (const locale of ['en', 'ja']) {
    const localized = await browser.newPage(); localized.on('pageerror', e => { errors.push(e.stack || e.message); console.log('BROWSER ERROR', e.stack || e.message); });
    await localRequests(localized);
    const response = await localized.goto(`${base}/${locale}/tools/online-drawing`, { waitUntil: 'networkidle0' });
    assert.equal(response.status(), 200); await localized.waitForSelector('.draw-art'); assert(!(await localized.$eval('.draw-filebar', el => el.textContent)).includes('新建画布')); await localized.close();
    pass(`${locale} tool route and controls are localized`);
  }
  const home = await browser.newPage(); await localRequests(home); await home.goto(`${base}/zh/`, { waitUntil: 'networkidle0' });
  assert(await home.$('a.exhibit-card[href="/zh/tools/online-drawing/"]')); pass('Homepage includes the new tool and original sketch preview');
  assert.deepEqual(errors, []); pass('No browser JavaScript errors');
  await fs.writeFile(path.join(out, 'results.json'), JSON.stringify({ checks, engineChecks, errors }, null, 2));
  console.log(`${checks.length} browser checks passed. Screenshots: ${out}`);
} finally { await browser.close(); }
