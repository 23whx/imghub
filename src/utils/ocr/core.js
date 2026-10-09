export function validateDimensions(width, height) {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || Math.max(width, height) > 16000 || width * height > 12_000_000) throw new Error('dimensions');
}

// Overlapping source-resolution tiles keep small text on long screenshots legible.
export function planTiles(width, height) {
  validateDimensions(width, height);
  const xs = positions(width, 2048), ys = positions(height, 1536);
  return ys.flatMap(y => xs.map(x => ({ x, y, width: Math.min(2048, width - x), height: Math.min(1536, height - y) })));
}
function positions(size, edge) {
  if (size <= edge) return [0];
  const result = [0];
  while (result.at(-1) + edge < size) result.push(Math.min(result.at(-1) + edge - 192, size - edge));
  return result;
}
export function bounds(poly) {
  const xs = poly.map(p => p[0]), ys = poly.map(p => p[1]);
  return { x: Math.min(...xs), y: Math.min(...ys), right: Math.max(...xs), bottom: Math.max(...ys) };
}
export function mergeLines(items) {
  const kept = [];
  for (const item of [...items].sort((a, b) => b.score - a.score)) {
    if (!item.text?.trim() || !Number.isFinite(item.score) || !Array.isArray(item.poly) || item.poly.length !== 4 || item.poly.some(p => p.length !== 2 || p.some(n => !Number.isFinite(n)))) continue;
    const box = bounds(item.poly), area = (box.right - box.x) * (box.bottom - box.y);
    if (area <= 0) continue;
    const duplicate = kept.some(other => {
      const b = bounds(other.poly);
      const intersection = Math.max(0, Math.min(box.right, b.right) - Math.max(box.x, b.x)) * Math.max(0, Math.min(box.bottom, b.bottom) - Math.max(box.y, b.y));
      return intersection / Math.min(area, (b.right - b.x) * (b.bottom - b.y)) > 0.65;
    });
    if (!duplicate) kept.push({ ...item, text: item.text.trim(), score: Math.max(0, Math.min(1, item.score)) });
  }
  // Group by baseline before ordering left-to-right; a simple y/x sort interleaves tilted lines.
  const rows = [];
  for (const item of kept.sort((a,b) => bounds(a.poly).y - bounds(b.poly).y)) {
    const b = bounds(item.poly), center = (b.y + b.bottom) / 2, h = b.bottom - b.y;
    const row = rows.find(r => Math.abs(r.center - center) < Math.min(r.height, h) * 0.45);
    if (row) row.items.push(item); else rows.push({ center, height: h, items: [item] });
  }
  return rows.sort((a,b)=>a.center-b.center).flatMap(r=>r.items.sort((a,b)=>bounds(a.poly).x-bounds(b.poly).x));
}
export function textFromLines(items, layout = 'lines') {
  const lines = items.map(x => x.text.trim()).filter(Boolean);
  if (layout === 'lines') return lines.join('\n');
  return lines.reduce((text, line) => text + (!text || /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]$/u.test(text) && /^[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u.test(line) ? '' : ' ') + line, '');
}
