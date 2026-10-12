// Photoshop-style editing: free transform, colors, gradient, merge, zoom and layer order.
// Run against `npm run dev -- --port 3001` (or set DRAWING_TEST_URL).
import puppeteer from 'puppeteer';
import assert from 'node:assert/strict';

const base = process.env.DRAWING_TEST_URL || 'http://127.0.0.1:3001';
const browser = await puppeteer.launch({ headless: true, executablePath: process.env.DRAWING_TEST_CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const errors = [];
const pass = name => console.log(`PASS ${name}`);
const frame = page => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
async function at(page, x, y) {
  return page.$eval('.draw-overlay', (canvas, x, y) => { const r = canvas.getBoundingClientRect(); return { x: r.left + x / canvas.width * r.width, y: r.top + y / canvas.height * r.height }; }, x, y);
}
async function drag(page, x1, y1, x2, y2, shift = false) {
  const a = await at(page, x1, y1), b = await at(page, x2, y2);
  if (shift) await page.keyboard.down('Shift');
  await page.mouse.move(a.x, a.y); await page.mouse.down(); await page.mouse.move(b.x, b.y, { steps: 12 }); await page.mouse.up();
  if (shift) await page.keyboard.up('Shift');
  await frame(page);
}
async function click(page, x, y, modifier) {
  const p = await at(page, x, y);
  if (modifier) await page.keyboard.down(modifier);
  await page.mouse.click(p.x, p.y);
  if (modifier) await page.keyboard.up(modifier);
  await frame(page);
}
const tool = (page, name) => page.locator(`.draw-toolbar button[aria-label="${name}"]`).click();
const field = (page, name) => page.$eval(`input[aria-label="图层属性 ${name}"]`, el => Number(el.value));
const pixel = (page, x, y) => page.$eval('.draw-art', (el, x, y) => Array.from(el.getContext('2d').getImageData(x, y, 1, 1).data), x, y);
const layers = page => page.$$eval('.draw-layer-row', rows => rows.length);
const press = async (page, key, modifier) => { if (modifier) await page.keyboard.down(modifier); await page.keyboard.press(key); if (modifier) await page.keyboard.up(modifier); await frame(page); };
const near = (a, b, tolerance = 1.5) => Math.abs(a - b) <= tolerance;

try {
  const page = await browser.newPage();
  page.on('pageerror', e => { errors.push(e.message); console.log('BROWSER ERROR', e.message); });
  await page.setViewport({ width: 1500, height: 1100 });
  await page.evaluateOnNewDocument(() => localStorage.setItem('cookieConsent', 'accepted'));
  await page.setRequestInterception(true);
  page.on('request', request => /googlesyndication\.com|doubleclick\.net/.test(request.url()) ? request.abort() : request.continue());
  await page.goto(`${base}/zh/tools/online-drawing/`, { waitUntil: 'networkidle0' });
  await page.waitForSelector('.draw-art');
  await page.evaluate(() => { document.querySelector('.cookie-consent')?.remove(); document.querySelector('astro-dev-toolbar')?.remove(); });

  const engine = await page.evaluate(async () => {
    const { DrawingDocument, makeLayer, surface } = await import('/src/utils/drawingEngine.js');
    const solid = (w, h, color) => { const c = surface(w, h), x = c.getContext('2d'); x.fillStyle = color; x.fillRect(0, 0, w, h); return c; };
    const doc = new DrawingDocument(200, 100, 'transparent');
    doc.add(makeLayer('image', 'Red', solid(100, 100, '#ff0000'), { x: -40 }));
    doc.add(makeLayer('image', 'Blue', solid(60, 40, '#0000ff'), { x: 100, y: 30, opacity: .5, rotation: 30 }));
    const before = doc.exportCanvas().toDataURL();
    doc.begin(); doc.mergeDown(); doc.commit();
    const merged = doc.layers.length === 1 && doc.active.type === 'paint' && doc.active.name === 'Red';
    const same = doc.exportCanvas().toDataURL() === before;
    doc.active.x += 40; const kept = doc.exportCanvas().getContext('2d').getImageData(1, 50, 1, 1).data[0] === 255;
    doc.active.x -= 40; await doc.undo(); const undone = doc.layers.length === 2;
    doc.layers[1].locked = true; doc.mergeDown(); const lockedKept = doc.layers.length === 2; doc.layers[1].locked = false;
    doc.selected = doc.layers[0].id; doc.mergeDown(); const bottomKept = doc.layers.length === 2;
    doc.moveTo(doc.layers[0].id, 1); const moved = doc.layers[1].name === 'Red';
    const grad = new DrawingDocument(100, 10, 'transparent'), layer = grad.blank('g');
    grad.gradient(layer, { x: 0, y: 5 }, { x: 100, y: 5 }, '#000000', '#ffffff');
    const g = grad.exportCanvas().getContext('2d'), left = g.getImageData(1, 5, 1, 1).data[0], right = g.getImageData(98, 5, 1, 1).data[0];
    const gradient = left < 10 && right > 245;
    const tinted = new DrawingDocument(10, 10, 'transparent'); tinted.add(makeLayer('image', 'r', solid(10, 10, '#ff0000'), { hue: 120 }));
    const hue = tinted.exportCanvas().getContext('2d').getImageData(5, 5, 1, 1).data[1] > 100;
    const copy = new DrawingDocument(); await copy.restore(tinted.serialize()); const hueSaved = copy.active.hue === 120;
    const legacy = JSON.parse(tinted.serialize()); delete legacy.layers[0].hue; await copy.restore(JSON.stringify(legacy)); const legacyHue = copy.active.hue === 0;
    return { merged, same, kept, undone, lockedKept, bottomKept, moved, gradient, hue, hueSaved, legacyHue };
  });
  for (const [name, ok] of Object.entries(engine)) assert.equal(ok, true, name);
  pass('Engine: merge down bakes pixels outside the canvas, respects locks; reorder, gradient and hue persist');

  // A 400 × 200 layer centred on the 1200 × 800 canvas.
  await page.$eval('.draw-overlay', el => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
  await tool(page, '矩形'); await drag(page, 400, 300, 800, 500); await tool(page, '移动 / 缩放');
  await drag(page, 800, 400, 900, 450);
  assert.deepEqual([await field(page, 'X'), await field(page, 'Y'), await field(page, '宽度'), await field(page, '高度')], [400, 300, 500, 200]);
  pass('Edge handle changes one dimension');
  await drag(page, 400, 300, 300, 250);
  assert.deepEqual([await field(page, 'X'), await field(page, 'Y'), await field(page, '宽度'), await field(page, '高度')], [300, 250, 600, 250]);
  pass('Top-left handle keeps the opposite corner anchored');
  await drag(page, 900, 500, 1020, 700, true);
  assert.deepEqual([await field(page, '宽度'), await field(page, '高度')], [720, 300]);
  pass('Shift keeps proportions on corner handles');
  await page.keyboard.down('Control'); await page.keyboard.press('KeyZ'); await page.keyboard.up('Control');
  await page.waitForFunction(() => document.querySelector('input[aria-label="图层属性 宽度"]').value === '600');
  const scale = await page.$eval('.draw-overlay', el => el.getBoundingClientRect().width / el.width);
  const knobY = 250 - 28 / scale;
  await drag(page, 600, knobY, 600 + 200, 375 + 3, true);
  assert.equal(await field(page, '旋转'), 90);
  pass('Rotation handle rotates around the centre and Shift snaps to 15°');

  await tool(page, '画笔');
  await page.$eval('.draw-options input[type="color"]', el => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, '#123456'); el.dispatchEvent(new Event('input', { bubbles: true })); });
  await page.evaluate(() => document.activeElement?.blur());
  await press(page, 'KeyX');
  assert.equal(await page.$eval('.draw-swatches input[aria-label="前景色"]', el => el.value), '#ffffff');
  assert.equal(await page.$eval('.draw-swatches input[aria-label="背景色"]', el => el.value), '#123456');
  await press(page, 'KeyD');
  assert.equal(await page.$eval('.draw-swatches input[aria-label="前景色"]', el => el.value), '#000000');
  pass('X swaps and D resets foreground / background colors');
  await page.locator('.draw-swatch-swap').click();
  assert.equal(await page.$eval('.draw-swatches input[aria-label="背景色"]', el => el.value), '#000000');
  await press(page, 'KeyX');
  await page.$eval('.draw-overlay', el => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
  const count = await layers(page);
  await click(page, 100, 100, 'Alt');
  assert.equal(await layers(page), count); assert.equal(await page.$eval('.draw-swatches input[aria-label="前景色"]', el => el.value), '#ffffff');
  pass('Alt+click with the brush samples color without painting');
  await press(page, 'KeyD');
  await click(page, 60, 700); await click(page, 260, 700, 'Shift');
  assert((await pixel(page, 160, 700))[0] < 60);
  pass('Shift+click paints a straight line from the previous stroke');
  await page.hover('.draw-overlay');
  assert.equal(await page.$eval('.draw-brush-ring', el => el.style.display), 'block');
  pass('Brush shows a size preview ring');

  await page.keyboard.down('Shift'); await page.keyboard.press('KeyG'); await page.keyboard.up('Shift');
  assert.equal(await page.$eval('.draw-tool-name', el => el.textContent), '油漆桶');
  await page.keyboard.down('Shift'); await page.keyboard.press('KeyG'); await page.keyboard.up('Shift');
  assert.equal(await page.$eval('.draw-tool-name', el => el.textContent), '渐变');
  await page.locator('.draw-layer-actions button[aria-label="新建图层"]').click();
  const before = await layers(page);
  await click(page, 600, 100);
  assert.equal(await layers(page), before);
  await page.waitForFunction(() => document.querySelector('.drawing-studio').getAttribute('aria-busy') === 'false');
  await drag(page, 100, 60, 1100, 60);
  const left = await pixel(page, 110, 30), right = await pixel(page, 1090, 30);
  assert(left[0] < 20 && right[0] > 235, `${left} ${right}`);
  pass('Shift+G switches to gradient; drag paints foreground → background, click alone changes nothing');

  await press(page, 'KeyE', 'Control');
  assert.equal(await layers(page), before - 1);
  assert.equal(await page.$eval('.draw-layer-row.is-selected small', el => el.textContent), '绘画');
  pass('Ctrl+E merges the active layer down');

  const rows = await page.$$eval('.draw-layer-select > span', spans => spans.map(span => span.childNodes[0].textContent));
  await page.evaluate(() => {
    const rows = document.querySelectorAll('.draw-layer-row'), data = new DataTransfer();
    const fire = (el, type) => el.dispatchEvent(new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer: data }));
    fire(rows[0], 'dragstart'); fire(rows.at ? rows.at(-1) : rows[rows.length - 1], 'dragover');
  });
  await frame(page);
  await page.evaluate(() => {
    const rows = document.querySelectorAll('.draw-layer-row'), data = new DataTransfer();
    rows[rows.length - 1].dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: data })); rows[0].dispatchEvent(new DragEvent('dragend', { bubbles: true }));
  });
  await frame(page);
  const reordered = await page.$$eval('.draw-layer-select > span', spans => spans.map(span => span.childNodes[0].textContent));
  assert.deepEqual(reordered, [...rows.slice(1), rows[0]]);
  pass('Dragging a layer row reorders the stack');

  await page.select('select[aria-label="放大"]', '1'); await frame(page);
  await page.$eval('.draw-viewport', el => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
  const target = await at(page, 300, 300);
  await page.mouse.move(target.x, target.y);
  await page.keyboard.down('Control'); await page.mouse.wheel({ deltaY: -100 }); await page.keyboard.up('Control');
  await page.waitForFunction(() => document.querySelector('select[aria-label="放大"]').value !== '1');
  await frame(page);
  const after = await at(page, 300, 300);
  assert(near(after.x, target.x) && near(after.y, target.y), JSON.stringify({ target, after }));
  pass('Ctrl+wheel zoom keeps the pixel under the pointer');
  await page.evaluate(() => document.activeElement?.blur());
  await press(page, 'Digit1', 'Control');
  assert.equal(await page.$eval('select[aria-label="放大"]', el => el.value), '1');
  pass('Ctrl+1 shows actual pixels');

  await page.locator('#draw-adjust-tab').click();
  assert(await page.$('input[aria-label="色相"]'));
  await page.locator('#draw-layers-tab').click();
  assert.equal(await page.$$eval('select[aria-label="混合模式"] option', options => options.length), 16);
  pass('Hue adjustment and 16 Photoshop blend modes are available');
  assert.deepEqual(errors, []); pass('No browser JavaScript errors');
} finally { await browser.close(); }
