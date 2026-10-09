import test from 'node:test';
import assert from 'node:assert/strict';
import { sniffImage, compressionSettings, outputDimensions, hasTransparency, downloadName, uniqueNames, searchQuality, validateSource } from '../src/utils/imageCompression.js';
import { getCompressionCopy } from '../src/i18n/compression.js';
import { crc32, optimizePng } from '../src/utils/pngCompression.js';
import { deflateSync, inflateSync } from 'node:zlib';

test('File signatures determine the real image format', () => {
  assert.equal(sniffImage(new Uint8Array([255,216,255,224])), 'jpg');
  assert.equal(sniffImage(new Uint8Array([137,80,78,71,13,10,26,10])), 'png');
  assert.equal(sniffImage(new TextEncoder().encode('RIFFxxxxWEBP')), 'webp');
  assert.throws(() => sniffImage(new TextEncoder().encode('not an image')), /format/);
});
test('PNG chunk CRC supports incremental type and data calculation', () => {
  const data = new TextEncoder().encode('123456789'); assert.equal(crc32(data), 0xcbf43926);
  assert.equal(crc32(data.subarray(4), crc32(data.subarray(0,4))), crc32(data));
});
test('PNG optimization preserves 16-bit filtered samples and ancillary chunks with valid CRCs', async () => {
  const chunk = (type, data) => {
    const bytes = Buffer.alloc(data.length + 12); bytes.writeUInt32BE(data.length); bytes.write(type, 4); data.copy(bytes, 8); bytes.writeUInt32BE(crc32(bytes.subarray(4, -4)), bytes.length - 4); return bytes;
  };
  const header = Buffer.alloc(13); header.writeUInt32BE(32); header.writeUInt32BE(16, 4); header[8] = 16; header[9] = 6;
  const raw = Buffer.alloc((32 * 8 + 1) * 16, 93); for (let y = 0; y < 16; y++) raw[y * 257] = 0;
  const compressed = deflateSync(raw, {level:0}), metadata = chunk('tEXt', Buffer.from('Author\0ImgHub'));
  const source = new Blob([new Uint8Array([137,80,78,71,13,10,26,10]), chunk('IHDR', header), metadata, chunk('IDAT', compressed.subarray(0,100)), chunk('IDAT', compressed.subarray(100)), chunk('IEND', Buffer.alloc(0))]);
  const result = await optimizePng(source), bytes = Buffer.from(await result.arrayBuffer()), idats = [];
  assert(result.size < source.size / 4); assert(bytes.includes(metadata)); assert(bytes.includes(chunk('IHDR', header)));
  for (let offset = 8; offset < bytes.length;) {
    const length = bytes.readUInt32BE(offset), end = offset + length + 12;
    assert.equal(bytes.readUInt32BE(end - 4), crc32(bytes.subarray(offset + 4, end - 4)));
    if (bytes.toString('ascii', offset + 4, offset + 8) === 'IDAT') idats.push(bytes.subarray(offset + 8, end - 4));
    offset = end;
  }
  assert.deepEqual(inflateSync(Buffer.concat(idats)), raw);
  const controller = new AbortController(); controller.abort(); await assert.rejects(optimizePng(source, controller.signal), {name:'AbortError'});
  const corrupt = new Blob([new Uint8Array(20)]); assert.deepEqual(await (await optimizePng(corrupt)).arrayBuffer(), await corrupt.arrayBuffer());
});
test('Proportional resizing keeps dimensions without enlarging and bounds canvas allocation', () => {
  assert.deepEqual(outputDimensions(4000, 3000, 1920), {width:1920,height:1440});
  assert.deepEqual(outputDimensions(100, 80, 1920), {width:100,height:80});
  assert.deepEqual(outputDimensions(100, 80), {width:100,height:80});
  assert.throws(() => outputDimensions(12000, 9000), /resize/);
  for (const [width,height] of [[0, 10],[-1,10],[16385,100],[10000,10000],[NaN,1]]) assert.throws(()=>validateSource(width,height), /dimensions/);
});
test('Settings reject empty, fractional and out-of-range values', () => {
  assert.equal(compressionSettings({}).quality, .8);
  for (const settings of [{format:'gif'}, {quality:0}, {maxEdge:''}, {maxEdge:1.2}, {mode:'target',targetKB:0}, {mode:'target',targetKB:1.2}]) assert.throws(()=>compressionSettings(settings), /settings/);
});
test('Transparency detection includes partially transparent pixels', () => {
  assert.equal(hasTransparency(new Uint8ClampedArray([1,2,3,255,0,0,0,255])), false);
  assert.equal(hasTransparency(new Uint8ClampedArray([1,2,3,254])), true);
});
test('Batch names preserve all duplicate filenames and sanitize paths', () => {
  assert.equal(downloadName('A/B?.jpeg', 'webp'), 'A_B_-compressed.webp');
  assert.deepEqual(uniqueNames(['photo.jpg','PHOTO.jpg','photo (2).jpg','photo.jpg']), ['photo.jpg','PHOTO (2).jpg','photo (2) (2).jpg','photo (3).jpg']);
});
test('Target search chooses the highest feasible quality instead of always choosing low quality', async () => {
  let calls = 0;
  const result = await searchQuality(async quality => { calls++; return {size: Math.round(100 + quality * 1000)}; }, 600, .95);
  assert(result.blob.size <= 600); assert(result.quality > .49 && result.quality <= .501); assert(calls <= 9);
  assert.equal((await searchQuality(async () => ({size:100}), 200, .95)).quality, .95);
  assert.equal((await searchQuality(async () => ({size:1000}), 200, .95)).quality, .05);
});
test('PNG search does not loop through an ineffective quality control; aborts stop work', async () => {
  let calls = 0; const result = await searchQuality(async () => { calls++; return {size:2000}; }, 100, .95, false);
  assert.equal(calls, 1); assert.equal(result.blob.size, 2000);
  const controller = new AbortController(); controller.abort(); await assert.rejects(searchQuality(async () => ({size:10}), 100, .95, true, controller.signal), {name:'AbortError'});
});
test('Compression controls and error strings are complete in all locales', () => {
  const english = getCompressionCopy('en');
  for (const lang of ['zh','ja']) { const translated = getCompressionCopy(lang); assert.deepEqual(Object.keys(translated).sort(),Object.keys(english).sort()); assert.deepEqual(Object.keys(translated.errors).sort(),Object.keys(english.errors).sort()); }
});
