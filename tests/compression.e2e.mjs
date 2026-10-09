import puppeteer from 'puppeteer';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import JSZip from 'jszip';

const base = process.env.COMPRESSION_TEST_URL || 'http://127.0.0.1:3001', out = path.resolve('test-results/compression');
await fs.mkdir(out, { recursive: true });
const photoPath = path.join(out, 'photo.png'), alphaPath = path.join(out, 'alpha.png'), corruptPath = path.join(out, 'broken.png'), orientedPath = path.join(out, 'oriented.jpg');
const photo = await sharp('public/assets/studio/gallery-hero-alps.webp').resize(1200, 800, { fit: 'fill' }).removeAlpha().png({ compressionLevel: 0 }).toBuffer(); await fs.writeFile(photoPath, photo);
const pixels = Buffer.alloc(220 * 180 * 4);
for (let y = 40; y < 140; y++) for (let x = 40; x < 180; x++) { const index = (y * 220 + x) * 4; pixels[index] = 220; pixels[index + 1] = 75; pixels[index + 2] = 20; pixels[index + 3] = x < 110 ? 128 : 255; }
await sharp(pixels, { raw: { width: 220, height: 180, channels: 4 } }).png({ compressionLevel: 0 }).toFile(alphaPath);
await fs.writeFile(corruptPath, Buffer.from('not actually a PNG'));
await sharp(photo).jpeg({ quality: 95 }).withMetadata({ orientation: 6 }).toFile(orientedPath);
const browser = await puppeteer.launch({ headless: true, executablePath: process.env.COMPRESSION_TEST_CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const checks = [], errors = [], metrics = {};
function pass(name) { checks.push(name); console.log('PASS', name); }
async function setup(page) {
  await page.setRequestInterception(true); page.on('request', request => /googlesyndication\.com|doubleclick\.net/.test(request.url()) ? request.abort() : request.continue());
  page.on('pageerror', error => errors.push(error.message));
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('cookieConsent', 'accepted'); window.__urls = new Map(); window.__revoked = [];
    const create = URL.createObjectURL, revoke = URL.revokeObjectURL;
    URL.createObjectURL = blob => { const url = create(blob); window.__urls.set(url, blob); return url; };
    URL.revokeObjectURL = url => { window.__revoked.push(url); window.__urls.delete(url); revoke(url); };
    HTMLAnchorElement.prototype.click = function () { if (this.download) window.__download = { blob: window.__urls.get(this.href), name: this.download }; };
  });
}
async function click(page, selector) { await page.$eval(selector, el => el.scrollIntoView({ block: 'center', behavior: 'instant' })); await page.locator(selector).click(); }
async function idle(page) { await page.waitForFunction(() => document.querySelector('.image-compress')?.getAttribute('aria-busy') === 'false', { timeout: 60000 }); }
async function upload(page, ...files) { await (await page.$('#images-upload')).uploadFile(...files); await idle(page); }
async function fill(page, label, value) { await page.$eval(`[aria-label="${label}"]`, (el, value) => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, String(value)); el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); }, value); }
async function compress(page) { await click(page, '.compress-primary'); await idle(page); }
async function captured(page, selector) {
  await page.evaluate(() => { window.__download = null; }); await click(page, selector);
  await page.waitForFunction(() => window.__download?.blob, { timeout: 60000 });
  return page.evaluate(async () => ({ name: window.__download.name, type: window.__download.blob.type, bytes: [...new Uint8Array(await window.__download.blob.arrayBuffer())] }));
}
const firstDownload = '.compress-item:first-child .compress-output button:last-child';
try {
  const page = await browser.newPage(); await setup(page); await page.setViewport({ width: 1440, height: 1000 });
  await page.goto(`${base}/zh/tools/image-compress/`, { waitUntil: 'domcontentloaded' }); await page.waitForSelector('#images-upload:not([disabled])');
  await upload(page, photoPath, corruptPath, alphaPath); assert.equal(await page.$$eval('.compress-item', els => els.length), 2);
  assert((await page.$eval('.compress-alert', el => el.textContent)).includes('broken.png')); pass('Mixed valid and corrupt uploads finish; errors do not block valid files');
  await upload(page, photoPath); assert.equal(await page.$$eval('.compress-item', els => els.length), 3); pass('Reselecting the same file works without overwriting earlier images');
  await compress(page); let exported = await captured(page, firstDownload), bytes = Buffer.from(exported.bytes), metadata = await sharp(bytes).metadata();
  assert.equal(metadata.width, 1200); assert.equal(metadata.height, 800); assert(bytes.length < photo.length * .3);
  const reference = await sharp(photo).removeAlpha().raw().toBuffer(), output = await sharp(bytes).removeAlpha().raw().toBuffer();
  let error = 0; for (let i = 0; i < reference.length; i++) error += (reference[i] - output[i]) ** 2;
  const psnr = 10 * Math.log10(255 * 255 / (error / reference.length)); assert(psnr > 30);
  metrics.default = { originalBytes: photo.length, outputBytes: bytes.length, savedPercent: Number(((1 - bytes.length / photo.length) * 100).toFixed(2)), psnr: Number(psnr.toFixed(2)), format: metadata.format };
  await fs.writeFile(path.join(out, `default.${metadata.format}`), bytes); console.log('DEFAULT QUALITY', JSON.stringify(metrics.default)); pass('Smart compression substantially reduces a photographic PNG while preserving dimensions and pixel fidelity');
  const displayedSize = bytes.length < 1024 ? `${bytes.length} B` : `${(bytes.length / 1024).toFixed(1)} KB`;
  assert.equal(await page.$eval('.compress-item:first-child .compress-output strong', el => el.textContent), displayedSize); pass('Displayed size matches actual encoded Blob bytes');
  const alpha = await captured(page, '.compress-item:nth-child(2) .compress-output button:last-child'), alphaRaw = await sharp(Buffer.from(alpha.bytes)).ensureAlpha().raw().toBuffer();
  assert.equal(alphaRaw[3], 0); assert(Math.abs(alphaRaw[(80 * 220 + 80) * 4 + 3] - 128) <= 1); assert.notEqual(alpha.type, 'image/jpeg'); pass('Smart compression preserves transparent and partially transparent pixels');
  await click(page, '.compress-item:first-child .compress-output button:first-child'); await page.waitForSelector('dialog[open]'); assert.equal(await page.$$('dialog img').then(els => els.length), 2); await page.keyboard.press('Escape'); await page.waitForFunction(() => !document.querySelector('dialog')); pass('Before and after comparison supports Escape and displays both images');
  await page.select('select[aria-label="输出格式"]', 'jpg'); await fill(page, '最大边长', 600);
  assert.equal(await page.$('.compress-output'), null); assert((await page.$eval('.compress-item', el => el.textContent)).includes('设置已改变')); pass('Changing settings disables stale downloads until recompression');
  await compress(page); exported = await captured(page, firstDownload); metadata = await sharp(Buffer.from(exported.bytes)).metadata(); assert.equal(metadata.format, 'jpeg'); assert.equal(metadata.width, 600); assert.equal(metadata.height, 400); assert(exported.name.endsWith('.jpg')); pass('Explicit JPG and proportional dimension limits produce correct download headers and filenames');
  const white = await captured(page, '.compress-item:nth-child(2) .compress-output button:last-child'); const whiteRaw = await sharp(Buffer.from(white.bytes)).ensureAlpha().raw().toBuffer(); assert(whiteRaw.slice(0, 3).every(value => value > 250)); assert.equal(whiteRaw[3], 255); pass('Explicit JPG composites transparency onto white');
  const zipData = await captured(page, '.compress-summary button'); await idle(page); const zip = await JSZip.loadAsync(Buffer.from(zipData.bytes)), names = Object.keys(zip.files); assert.equal(names.length, 3); assert(names.includes('photo-compressed (2).jpg')); for (const name of names) assert.equal((await sharp(await zip.file(name).async('nodebuffer')).metadata()).format, 'jpeg'); pass('ZIP retains duplicate filenames as distinct valid images');
  await page.select('select[aria-label="输出格式"]', 'png'); await fill(page, '最大边长', 0); assert.equal(await page.$eval('input[aria-label="画质"]', el => el.disabled), true); await compress(page);
  const png = await captured(page, '.compress-item:nth-child(2) .compress-output button:last-child'); assert.equal(png.type, 'image/png'); const pngRaw = await sharp(Buffer.from(png.bytes)).ensureAlpha().raw().toBuffer(); assert.deepEqual(pngRaw, pixels); assert(png.bytes.length < (await fs.stat(alphaPath)).size / 4); pass('PNG output reduces bytes losslessly with exact transparency and does not offer a misleading quality slider');
  await page.select('select[aria-label="输出格式"]', 'webp'); await page.select('select[aria-label="压缩方式"]', 'target'); await fill(page, '每张目标大小（KB）', 1); await click(page, '.compress-checkbox input'); await compress(page);
  assert(await page.$('.compress-item:first-child .compress-target-miss')); pass('Unachievable size without resizing is reported accurately');
  await click(page, '.compress-checkbox input'); await compress(page); const tiny = await captured(page, firstDownload); assert(tiny.bytes.length <= 1024); const tinyMeta = await sharp(Buffer.from(tiny.bytes)).metadata(); assert(tinyMeta.width < 1200); pass('Size-target mode reaches the requested byte limit by reducing dimensions when allowed');
  await fill(page, '每张目标大小（KB）', 0); assert.equal(await page.$eval('.compress-primary', el => el.disabled), true); await fill(page, '每张目标大小（KB）', 20); pass('Invalid settings prevent processing instead of silently ignoring limits');
  await page.evaluate(() => { window.__toBlob = HTMLCanvasElement.prototype.toBlob; HTMLCanvasElement.prototype.toBlob = function (...args) { setTimeout(() => window.__toBlob.apply(this, args), 200); }; });
  await click(page, '.compress-primary'); await page.waitForSelector('.compress-cancel'); await click(page, '.compress-cancel'); await idle(page); assert.equal(await page.$$eval('.compress-item[data-status="processing"]', els => els.length), 0); assert((await page.$eval('.compress-notice', el => el.textContent)).includes('已取消')); await page.evaluate(() => { HTMLCanvasElement.prototype.toBlob = window.__toBlob; }); pass('Cancellation stops the batch and leaves a usable file list');
  const direct = await page.evaluate(async ({ photo, oriented }) => {
    const { compressImage, inspectImage } = await import('/src/utils/imageCompression.js');
    const file = new File([new Uint8Array(photo)], 'photo.png', {type:'image/png'});
    const low = await compressImage(file, {format:'jpg', quality:.3}), high = await compressImage(file, {format:'jpg', quality:.95});
    const exif = await compressImage(new File([new Uint8Array(oriented)], 'oriented.jpg'), {format:'jpg', quality:.8});
    const old = HTMLCanvasElement.prototype.toBlob;
    HTMLCanvasElement.prototype.toBlob = function (callback, mime, quality) { return old.call(this, callback, mime === 'image/webp' ? 'image/png' : mime, quality); };
    let unsupported = false; try { await compressImage(file,{format:'webp'}); } catch (e) { unsupported=e.message==='unsupported'; } finally { HTMLCanvasElement.prototype.toBlob=old; }
    const image = await inspectImage(new File([new Uint8Array(photo)], 'mislabeled.jpg'));
    const kept = await compressImage(new File([low.blob], 'already-compressed.jpg'), {format:'jpg',quality:1});
    const fits = await compressImage(file, {mode:'target',targetKB:10240});
    return {lowSize:low.blob.size,highSize:high.blob.size,low:[...new Uint8Array(await low.blob.arrayBuffer())],high:[...new Uint8Array(await high.blob.arrayBuffer())],exifWidth:exif.width,exifHeight:exif.height,unsupported,detected:image.format,kept:kept.keptOriginal,keptBytes:[...new Uint8Array(await kept.blob.arrayBuffer())],fits:fits.keptOriginal,fitsBytes:[...new Uint8Array(await fits.blob.arrayBuffer())]};
  }, {photo:[...photo],oriented:[...await fs.readFile(orientedPath)]});
  assert(direct.lowSize < direct.highSize); assert.equal(direct.exifWidth,800); assert.equal(direct.exifHeight,1200); assert(direct.unsupported); assert.equal(direct.detected,'png');
  async function mse(data) { const buffer=await sharp(Buffer.from(data)).removeAlpha().raw().toBuffer(); let sum=0; for(let i=0;i<buffer.length;i++) sum+=(buffer[i]-reference[i])**2; return sum/buffer.length; }
  assert(await mse(direct.high) < await mse(direct.low)); pass('Higher quality improves measured pixel fidelity; EXIF orientation, signature detection, and unsupported codecs are handled');
  assert(direct.kept && direct.fits); assert.deepEqual(direct.keptBytes,direct.low); assert.deepEqual(Buffer.from(direct.fitsBytes),photo); pass('Already smaller images and originals fitting the target are preserved byte for byte');
  await page.select('select[aria-label="输出格式"]','auto'); await page.select('select[aria-label="压缩方式"]','quality'); await compress(page);
  await page.evaluate(()=>{ document.activeElement?.blur(); window.scrollTo({top:0,behavior:'instant'}); });
  await page.screenshot({path:path.join(out,'desktop.png'),fullPage:true}); await page.evaluate(()=>document.documentElement.classList.add('dark')); await page.screenshot({path:path.join(out,'dark.png'),fullPage:true});
  for (const width of [768,390,360]) { await page.setViewport({width,height:950}); assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)); } pass('Light, dark, mobile, and tablet layouts preserve readable controls without page overflow');
  await page.screenshot({path:path.join(out,'mobile.png'),fullPage:true});
  const previewURLs = await page.$$eval('.compress-thumbnail', els=>els.map(el=>el.src)); await click(page,'button[aria-label="清空列表"]'); assert.equal(await page.$('.compress-item'),null); assert(await page.evaluate(urls=>urls.every(url=>window.__revoked.includes(url)),previewURLs)); pass('Clear removes entries and releases original preview URLs');
  await page.evaluate(bytes=>{ const transfer=new DataTransfer(); transfer.items.add(new File([new Uint8Array(bytes)],'dropped.png',{type:'image/png'})); document.querySelector('.compress-drop').dispatchEvent(new DragEvent('drop',{bubbles:true,cancelable:true,dataTransfer:transfer})); },[...await fs.readFile(alphaPath)]); await idle(page); assert.equal(await page.$$eval('.compress-item',els=>els.length),1); pass('Drag and drop imports valid image files');
  for (const [locale,label] of [['en','Compress images'],['ja','圧縮する']]) { const localized=await browser.newPage(); await setup(localized); await localized.goto(`${base}/${locale}/tools/image-compress/`,{waitUntil:'domcontentloaded'}); await localized.waitForSelector('#images-upload:not([disabled])'); await upload(localized,alphaPath); assert((await localized.$eval('.compress-primary',el=>el.textContent)).includes(label)); } pass('English and Japanese routes render localized controls');
  assert.deepEqual(errors,[]); pass('No browser JavaScript errors');
  await fs.writeFile(path.join(out,'report.json'),JSON.stringify({checks,metrics,errors},null,2)); console.log(`Verified ${checks.length} checks.`);
} finally { await browser.close(); }
