const crcTable = new Uint32Array(256);
for (let i = 0; i < 256; i++) { let value = i; for (let bit = 0; bit < 8; bit++) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1; crcTable[i] = value; }
export function crc32(data, initial = 0) {
  let crc = initial ^ 0xffffffff;
  for (const byte of data) crc = crcTable[(crc ^ byte) & 255] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

// Recompress PNG's filtered data without decoding pixels through Canvas.
// This preserves palettes, color profiles, 16-bit samples and exact partial-alpha colors.
export async function optimizePng(file, signal) {
  const original = new Blob([file], { type: 'image/png' });
  if (typeof CompressionStream === 'undefined' || typeof DecompressionStream === 'undefined') return original;
  const check = () => { if (signal?.aborted) throw new DOMException('Cancelled', 'AbortError'); };
  check();
  const bytes = new Uint8Array(await file.arrayBuffer()), view = new DataView(bytes.buffer), chunks = [], idats = [];
  let offset = 8;
  while (offset + 12 <= bytes.length) {
    check(); const length = view.getUint32(offset), end = offset + length + 12;
    if (end > bytes.length) return original;
    const type = String.fromCharCode(...bytes.subarray(offset + 4, offset + 8));
    chunks.push({ offset, end, type });
    if (type === 'IDAT') idats.push(file.slice(offset + 8, end - 4));
    if (type === 'IEND') break;
    offset = end;
  }
  if (!idats.length || chunks.at(-1)?.type !== 'IEND') return original;
  let rawBytes = 0, reader;
  const cancel = () => { reader?.cancel().catch(() => {}); };
  try {
    const stream = new Blob(idats).stream().pipeThrough(new DecompressionStream('deflate')).pipeThrough(new TransformStream({ transform(chunk, controller) {
      check(); rawBytes += chunk.byteLength;
      if (rawBytes > 256 * 1024 * 1024) throw new Error('capacity');
      controller.enqueue(chunk);
    } })).pipeThrough(new CompressionStream('deflate'));
    reader = stream.getReader(); signal?.addEventListener('abort', cancel, { once: true });
    const blocks = []; let outputBytes = 0;
    for (;;) {
      check(); const { value, done } = await reader.read(); if (done) break;
      outputBytes += value.byteLength;
      if (outputBytes > file.size) { await reader.cancel(); return original; }
      blocks.push(value);
    }
    check(); const compressed = new Blob(blocks), data = new Uint8Array(await compressed.arrayBuffer());
    const header = new Uint8Array(8), footer = new Uint8Array(4); new DataView(header.buffer).setUint32(0, data.length); header.set([73, 68, 65, 84], 4);
    new DataView(footer.buffer).setUint32(0, crc32(data, crc32(header.subarray(4))));
    const parts = [file.slice(0, 8)]; let added = false;
    for (const chunk of chunks) {
      if (chunk.type === 'IDAT') { if (!added) { parts.push(header, compressed, footer); added = true; } }
      else parts.push(file.slice(chunk.offset, chunk.end));
    }
    const result = new Blob(parts, { type: 'image/png' }); return result.size < original.size ? result : original;
  } catch (error) { check(); return original; }
  finally { signal?.removeEventListener('abort', cancel); reader?.releaseLock(); }
}
