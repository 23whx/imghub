import puppeteer from 'puppeteer';
import assert from 'node:assert/strict';
const browser = await puppeteer.launch({ headless: true, executablePath: process.env.DRAWING_TEST_CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const base = process.env.DRAWING_TEST_URL || 'http://127.0.0.1:3001';
async function click(page, label) { await page.locator(`button[aria-label="${label}"]`).click(); }
async function enter(page, selector, value) { await page.$eval(selector, el => el.scrollIntoView({ block: 'center', behavior: 'instant' })); await page.locator(selector).click(); await page.keyboard.down('Control'); await page.keyboard.press('a'); await page.keyboard.up('Control'); await page.keyboard.type(value); await page.keyboard.press('Tab'); }
try {
  const page = await browser.newPage(); await page.setViewport({ width: 1500, height: 1000 });
  await page.evaluateOnNewDocument(() => localStorage.setItem('cookieConsent', 'accepted')); await page.setRequestInterception(true); page.on('request', request => /googlesyndication\.com|doubleclick\.net/.test(request.url()) ? request.abort() : request.continue()); await page.goto(`${base}/zh/tools/online-drawing`, { waitUntil: 'domcontentloaded' }); await page.waitForSelector('.draw-art');
  const engine = await page.evaluate(async () => {
    const { DrawingDocument, makeLayer, surface, worldPoint } = await import('/src/utils/drawingEngine.js');
    const results = [];
    for (const rotation of [0, 37, 90]) for (const flipX of [false, true]) {
      const doc = new DrawingDocument(300, 300), canvas = surface(40, 40); canvas.getContext('2d').fillStyle = '#ff0000'; canvas.getContext('2d').fillRect(0, 0, 40, 40);
      const layer = doc.add(makeLayer('image', 'small', canvas, { x: 100, y: 100, rotation, flipX }));
      const before = doc.exportCanvas().getContext('2d').getImageData(120, 120, 1, 1).data;
      const target = worldPoint(layer, { x: 65, y: 20 }); doc.begin(); doc.stroke(layer, target, target, 12, '#0000ff'); doc.commit();
      const rendered = doc.exportCanvas().getContext('2d'), old = rendered.getImageData(120, 120, 1, 1).data, added = rendered.getImageData(Math.round(target.x), Math.round(target.y), 1, 1).data;
      results.push({ oldStable: before.every((value, i) => value === old[i]), painted: added[2] > 200 && added[0] < 50, expanded: layer.canvas.width > 40 });
      await doc.undo(); results.push({ undone: doc.active.canvas.width === 40 });
    }
    const edge = new DrawingDocument(4096, 1), layer = edge.blank('edge'); edge.stroke(layer, { x: 0, y: 0 }, { x: 0, y: 0 }, 24, '#000000'); results.push({ edge: layer.canvas.width === 4096 && layer.canvas.height === 1 });
    return results;
  });
  assert(engine.every(item => Object.values(item).every(Boolean))); console.log('PASS Brush expands transformed image bounds without moving old pixels; undo restores source; maximum canvas edges remain paintable');
  await click(page, '文字'); await enter(page, 'textarea[aria-label="编辑文字"]', 'One');
  const point = await page.$eval('.draw-overlay', el => { el.scrollIntoView({ block: 'center', behavior: 'instant' }); const r = el.getBoundingClientRect(); return { x: r.left + 100 / el.width * r.width, y: r.top + 100 / el.height * r.height }; });
  await page.mouse.click(point.x, point.y); await page.waitForSelector('.draw-layer-row');
  await enter(page, 'input[aria-label="字号"]', '72');
  await enter(page, 'textarea[aria-label="编辑文字"]', 'Two typed words');
  await page.$eval('button[aria-label="撤销 (Ctrl+Z)"]', el=>el.scrollIntoView({block:'center',behavior:'instant'})); await click(page, '撤销 (Ctrl+Z)'); await page.waitForFunction(() => document.querySelector('textarea[aria-label="编辑文字"]').value === 'One');
  assert.equal(await page.$eval('input[aria-label="字号"]', el => el.value), '72'); console.log('PASS Text typing is one undo operation and restored font controls stay synchronized');
  await page.$eval('button[aria-label="撤销 (Ctrl+Z)"]', el=>el.scrollIntoView({block:'center',behavior:'instant'})); await click(page, '撤销 (Ctrl+Z)'); await page.waitForFunction(() => document.querySelector('input[aria-label="字号"]').value === '56');
  await enter(page, 'textarea[aria-label="编辑文字"]', 'After undo'); assert.equal(await page.$eval('input[aria-label="字号"]', el => el.value), '56'); console.log('PASS Editing after undo keeps restored font attributes');
  await enter(page, 'input[aria-label="图层属性 X"]', '-123'); assert.equal(await page.$eval('input[aria-label="图层属性 X"]', el => el.value), '-123');
  await page.locator('input[aria-label="图层属性 X"]').click(); await page.keyboard.down('Control'); await page.keyboard.press('a'); await page.keyboard.up('Control'); await page.keyboard.type('25'); await page.keyboard.press('Escape'); assert.equal(await page.$eval('input[aria-label="图层属性 X"]', el => el.value), '-123'); console.log('PASS Coordinate fields accept negative drafts and Escape cancels editing');
  await click(page, '移动 / 缩放'); await page.keyboard.press('ArrowRight'); await page.waitForFunction(() => document.querySelector('input[aria-label="图层属性 X"]').value === '-122'); console.log('PASS Arrow keys move unlocked active layers by one pixel');
  await click(page, '删除图层'); await page.waitForFunction(() => !document.querySelector('.draw-layer-row'));
  await page.locator('.draw-file-actions button:first-child').click(); await page.locator('.draw-dialog button[type="submit"]').click(); await page.waitForFunction(() => document.querySelector('.draw-dialog')?.textContent.includes('继续编辑')); console.log('PASS Removing every layer still protects unsaved history before replacement');
} finally { await browser.close(); }
