// Browser-local raster layers. Display transforms never alter source pixels.
export const MAX_SIDE = 4096;
export const MAX_PIXELS = 32 * 1024 * 1024;
export const MAX_LAYERS = 40;
const TYPES = ['paint', 'image', 'text', 'rect', 'ellipse', 'line'];
// Photoshop menu order: normal, darken group, lighten group, contrast, inversion, component.
export const BLENDS = ['source-over', 'darken', 'multiply', 'color-burn', 'lighten', 'screen', 'color-dodge', 'overlay', 'soft-light', 'hard-light', 'difference', 'exclusion', 'hue', 'saturation', 'color', 'luminosity'];
const number = (v, fallback, min, max) => Number.isFinite(Number(v)) ? Math.min(max, Math.max(min, Number(v))) : fallback;

export function dimensions(width, height) {
  const w = Number(width), h = Number(height);
  if (!Number.isInteger(w) || !Number.isInteger(h) || w < 1 || h < 1 || w > MAX_SIDE || h > MAX_SIDE) throw new Error('dimensions');
  return { width: w, height: h };
}

export function surface(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width)); canvas.height = Math.max(1, Math.round(height));
  return canvas;
}

export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('image'));
    image.src = src;
  });
}

export function localPoint(layer, point) {
  const a = -layer.rotation * Math.PI / 180;
  const dx = point.x - layer.x - layer.width / 2, dy = point.y - layer.y - layer.height / 2;
  return {
    x: (dx * Math.cos(a) - dy * Math.sin(a)) * (layer.flipX ? -1 : 1) + layer.width / 2,
    y: (dx * Math.sin(a) + dy * Math.cos(a)) * (layer.flipY ? -1 : 1) + layer.height / 2,
  };
}

export function worldPoint(layer, point) {
  const a = layer.rotation * Math.PI / 180;
  const dx = (point.x - layer.width / 2) * (layer.flipX ? -1 : 1), dy = (point.y - layer.height / 2) * (layer.flipY ? -1 : 1);
  return { x: layer.x + layer.width / 2 + dx * Math.cos(a) - dy * Math.sin(a), y: layer.y + layer.height / 2 + dx * Math.sin(a) + dy * Math.cos(a) };
}

export function cropBounds(start, end, width, height) {
  const x = Math.max(0, Math.floor(Math.min(start.x, end.x))), y = Math.max(0, Math.floor(Math.min(start.y, end.y)));
  const right = Math.min(width, Math.ceil(Math.max(start.x, end.x))), bottom = Math.min(height, Math.ceil(Math.max(start.y, end.y)));
  return { x, y, width: Math.max(0, right - x), height: Math.max(0, bottom - y) };
}

export function floodFill(data, width, height, x, y, color, tolerance = 24) {
  x = Math.floor(x); y = Math.floor(y);
  if (x < 0 || y < 0 || x >= width || y >= height) return false;
  const index = (y * width + x) * 4, target = Array.from(data.subarray(index, index + 4));
  if (target.every((v, i) => v === color[i])) return false;
  const seen = new Uint8Array(width * height), stack = [y * width + x];
  const matches = p => !seen[p] && target.every((v, i) => Math.abs(data[p * 4 + i] - v) <= tolerance);
  while (stack.length) {
    const p = stack.pop();
    if (!matches(p)) continue;
    const row = Math.floor(p / width);
    let left = p % width;
    while (left > 0 && matches(row * width + left - 1)) left--;
    let above = false, below = false;
    for (let col = left; col < width && matches(row * width + col); col++) {
      const at = row * width + col; seen[at] = 1;
      data.set(color, at * 4);
      if (row > 0) {
        const match = matches(at - width);
        if (match && !above) stack.push(at - width);
        above = match;
      }
      if (row < height - 1) {
        const match = matches(at + width);
        if (match && !below) stack.push(at + width);
        below = match;
      }
    }
  }
  return true;
}

export function drawLayer(context, layer) {
  context.save(); context.globalAlpha = layer.opacity; context.globalCompositeOperation = layer.blend;
  context.filter = `brightness(${layer.brightness}%) contrast(${layer.contrast}%) saturate(${layer.saturation}%) hue-rotate(${layer.hue || 0}deg) blur(${layer.blur}px)`;
  context.translate(layer.x + layer.width / 2, layer.y + layer.height / 2);
  context.rotate(layer.rotation * Math.PI / 180); context.scale(layer.flipX ? -1 : 1, layer.flipY ? -1 : 1);
  context.drawImage(layer.canvas, -layer.width / 2, -layer.height / 2, layer.width, layer.height); context.restore();
}

export function makeLayer(type, name, canvas, extra = {}) {
  return {
    id: crypto.randomUUID(), type, name, canvas, x: 0, y: 0,
    width: canvas.width, height: canvas.height, rotation: 0,
    flipX: false, flipY: false, opacity: 1, visible: true, locked: false,
    blend: 'source-over', brightness: 100, contrast: 100, saturation: 100, hue: 0, blur: 0,
    ...extra,
  };
}

export function textSurface(text, fontSize, fontFamily, color, bold = false) {
  const canvas = surface(1, 1), context = canvas.getContext('2d');
  const font = `${bold ? '700' : '400'} ${fontSize}px ${fontFamily}`;
  context.font = font;
  const lines = text.split('\n'), padding = Math.ceil(fontSize * .3);
  canvas.width = Math.min(MAX_SIDE, Math.max(1, Math.ceil(Math.max(...lines.map(line => context.measureText(line).width)) + padding * 2)));
  canvas.height = Math.min(MAX_SIDE, Math.max(1, Math.ceil(lines.length * fontSize * 1.35 + padding * 2)));
  context.font = font; context.textBaseline = 'top'; context.fillStyle = color;
  lines.forEach((line, i) => context.fillText(line, padding, padding + i * fontSize * 1.35));
  return canvas;
}

export function shapeSurface(type, width, height, color, stroke, strokeWidth, filled) {
  const canvas = surface(width, height), c = canvas.getContext('2d');
  const inset = Math.min(strokeWidth / 2, width / 2, height / 2);
  c.fillStyle = color; c.strokeStyle = stroke; c.lineWidth = strokeWidth;
  c.beginPath();
  if (type === 'ellipse') c.ellipse(width / 2, height / 2, Math.max(.1, width / 2 - inset), Math.max(.1, height / 2 - inset), 0, 0, Math.PI * 2);
  else if (type === 'line') { c.moveTo(inset, inset); c.lineTo(width - inset, height - inset); c.lineCap = 'round'; }
  else c.rect(inset, inset, Math.max(0, width - inset * 2), Math.max(0, height - inset * 2));
  if (filled && type !== 'line') c.fill();
  if (strokeWidth > 0 || type === 'line') c.stroke();
  return canvas;
}

export class DrawingDocument {
  constructor(width = 1200, height = 800, background = '#ffffff') {
    Object.assign(this, dimensions(width, height));
    this.background = background; this.name = 'Untitled'; this.layers = []; this.selected = null;
    this.past = []; this.future = []; this.pending = null;
  }
  get active() { return this.layers.find(layer => layer.id === this.selected); }
  checkBudget(canvas, replacing = null) {
    const pixels = this.layers.filter(layer => layer !== replacing).reduce((sum, layer) => sum + layer.canvas.width * layer.canvas.height, 0);
    if (pixels + canvas.width * canvas.height > MAX_PIXELS || (!replacing && this.layers.length >= MAX_LAYERS)) throw new Error('capacity');
  }
  add(layer) { this.checkBudget(layer.canvas); this.layers.push(layer); this.selected = layer.id; return layer; }
  blank(name) { return this.add(makeLayer('paint', name, surface(this.width, this.height))); }
  begin() { if (!this.pending) this.pending = this.serialize(); }
  commit() {
    if (!this.pending) return;
    const before = this.pending; this.pending = null;
    if (before === this.serialize()) return;
    this.past.push(before); this.future = [];
    // Keep a bounded history even when imported photos are large.
    while (this.past.length > 30 || (this.past.length > 1 && this.past.reduce((sum, s) => sum + s.length * 2, 0) > 64 * 1024 * 1024)) this.past.shift();
  }
  serialize() {
    return JSON.stringify({ format: 'imghub-drawing', version: 1, width: this.width, height: this.height, background: this.background, name: this.name, selected: this.selected,
      layers: this.layers.map(({ canvas, ...layer }) => ({ ...layer, source: canvas.toDataURL('image/png') })) });
  }
  async restore(serialized) {
    const project = JSON.parse(serialized);
    if (project.format !== 'imghub-drawing' || project.version !== 1 || !Array.isArray(project.layers) || project.layers.length > MAX_LAYERS) throw new Error('project');
    const size = dimensions(project.width, project.height);
    let pixels = 0;
    const layers = [];
    for (const raw of project.layers) {
      if (!TYPES.includes(raw.type) || typeof raw.source !== 'string' || !raw.source.startsWith('data:image/png;base64,') || raw.source.length > 40 * 1024 * 1024) throw new Error('project');
      const image = await loadImage(raw.source);
      dimensions(image.naturalWidth, image.naturalHeight);
      pixels += image.naturalWidth * image.naturalHeight;
      if (pixels > MAX_PIXELS) throw new Error('capacity');
      const canvas = surface(image.naturalWidth, image.naturalHeight); canvas.getContext('2d').drawImage(image, 0, 0);
      const layer = makeLayer(raw.type, String(raw.name || 'Layer').slice(0, 100), canvas, {
        id: typeof raw.id === 'string' && !layers.some(l => l.id === raw.id) ? raw.id : crypto.randomUUID(),
        x: number(raw.x, 0, -MAX_SIDE * 4, MAX_SIDE * 4), y: number(raw.y, 0, -MAX_SIDE * 4, MAX_SIDE * 4),
        width: number(raw.width, canvas.width, 1, MAX_SIDE * 4), height: number(raw.height, canvas.height, 1, MAX_SIDE * 4),
        rotation: number(raw.rotation, 0, -360, 360), flipX: !!raw.flipX, flipY: !!raw.flipY,
        opacity: number(raw.opacity, 1, 0, 1), visible: raw.visible !== false, locked: !!raw.locked,
        blend: BLENDS.includes(raw.blend) ? raw.blend : 'source-over', brightness: number(raw.brightness, 100, 0, 200),
        contrast: number(raw.contrast, 100, 0, 200), saturation: number(raw.saturation, 100, 0, 200), hue: number(raw.hue, 0, -180, 180), blur: number(raw.blur, 0, 0, 20),
      });
      if (raw.type === 'text') Object.assign(layer, { text: String(raw.text || '').slice(0, 5000), fontSize: number(raw.fontSize, 48, 8, 300), fontFamily: ['sans-serif', 'serif', 'monospace'].includes(raw.fontFamily) ? raw.fontFamily : 'sans-serif', color: /^#[0-9a-f]{6}$/i.test(raw.color) ? raw.color : '#000000', bold: !!raw.bold });
      layers.push(layer);
    }
    Object.assign(this, size, { layers, background: /^#[0-9a-f]{6}$/i.test(project.background) ? project.background : 'transparent', name: String(project.name || 'Untitled').slice(0, 100), selected: layers.find(l => l.id === project.selected)?.id || layers.at(-1)?.id || null, pending: null });
  }
  async undo() {
    this.commit(); if (!this.past.length) return;
    const target = this.past.at(-1), current = this.serialize();
    await this.restore(target); this.past.pop(); this.future.push(current);
  }
  async redo() {
    if (!this.future.length) return;
    const target = this.future.at(-1), current = this.serialize();
    await this.restore(target); this.future.pop(); this.past.push(current);
  }
  render(context) {
    context.save(); context.clearRect(0, 0, this.width, this.height);
    if (this.background !== 'transparent') { context.fillStyle = this.background; context.fillRect(0, 0, this.width, this.height); }
    context.beginPath(); context.rect(0, 0, this.width, this.height); context.clip();
    for (const layer of this.layers) if (layer.visible) drawLayer(context, layer);
    context.restore();
  }
  hit(point) {
    return [...this.layers].reverse().find(layer => {
      if (!layer.visible || layer.locked || layer.opacity === 0) return false;
      const p = localPoint(layer, point);
      if (p.x < 0 || p.y < 0 || p.x >= layer.width || p.y >= layer.height) return false;
      const alpha = layer.canvas.getContext('2d').getImageData(Math.min(layer.canvas.width - 1, Math.floor(p.x / layer.width * layer.canvas.width)), Math.min(layer.canvas.height - 1, Math.floor(p.y / layer.height * layer.canvas.height)), 1, 1).data[3];
      return alpha > 8;
    });
  }
  stroke(layer, from, to, size, color, erase = false) {
    if (!erase) this.expandStroke(layer, from, to, size);
    const a = localPoint(layer, from), b = localPoint(layer, to), c = layer.canvas.getContext('2d');
    c.save(); c.scale(layer.canvas.width / layer.width, layer.canvas.height / layer.height);
    c.globalCompositeOperation = erase ? 'destination-out' : 'source-over'; c.strokeStyle = color; c.fillStyle = color; c.lineWidth = size; c.lineCap = 'round'; c.lineJoin = 'round';
    c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke();
    // A click is a dot; several browsers skip zero-length strokes.
    if (a.x === b.x && a.y === b.y) { c.beginPath(); c.arc(a.x, a.y, size / 2, 0, Math.PI * 2); c.fill(); }
    c.restore(); layer.type = 'paint';
  }
  expandStroke(layer, from, to, size) {
    const sx = layer.width / layer.canvas.width, sy = layer.height / layer.canvas.height;
    const points = [localPoint(layer, from), localPoint(layer, to)];
    const visible = [{ x: 0, y: 0 }, { x: this.width, y: 0 }, { x: this.width, y: this.height }, { x: 0, y: this.height }].map(p => localPoint(layer, p));
    const left = Math.min(0, Math.max(Math.floor(Math.min(...visible.map(p => p.x)) / sx), Math.floor((Math.min(...points.map(p => p.x)) - size / 2) / sx)));
    const top = Math.min(0, Math.max(Math.floor(Math.min(...visible.map(p => p.y)) / sy), Math.floor((Math.min(...points.map(p => p.y)) - size / 2) / sy)));
    const right = Math.max(layer.canvas.width, Math.min(Math.ceil(Math.max(...visible.map(p => p.x)) / sx), Math.ceil((Math.max(...points.map(p => p.x)) + size / 2) / sx)));
    const bottom = Math.max(layer.canvas.height, Math.min(Math.ceil(Math.max(...visible.map(p => p.y)) / sy), Math.ceil((Math.max(...points.map(p => p.y)) + size / 2) / sy)));
    if (left === 0 && top === 0 && right === layer.canvas.width && bottom === layer.canvas.height) return;
    if (right - left > MAX_SIDE || bottom - top > MAX_SIDE) throw new Error('capacity');
    const canvas = surface(right - left, bottom - top); this.checkBudget(canvas, layer);
    canvas.getContext('2d').drawImage(layer.canvas, -left, -top);
    // Map the new center through the original transform so old pixels stay stationary.
    const center = worldPoint(layer, { x: (left + canvas.width / 2) * sx, y: (top + canvas.height / 2) * sy });
    Object.assign(layer, { canvas, width: canvas.width * sx, height: canvas.height * sy, x: center.x - canvas.width * sx / 2, y: center.y - canvas.height * sy / 2 });
  }
  fill(layer, point, hex, tolerance) {
    const p = localPoint(layer, point), c = layer.canvas.getContext('2d'), image = c.getImageData(0, 0, layer.canvas.width, layer.canvas.height);
    const rgba = [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16), 255];
    if (floodFill(image.data, image.width, image.height, p.x / layer.width * image.width, p.y / layer.height * image.height, rgba, tolerance)) { c.putImageData(image, 0, 0); layer.type = 'paint'; }
  }
  crop(bounds) {
    if (bounds.width < 1 || bounds.height < 1) return;
    this.width = bounds.width; this.height = bounds.height;
    this.layers.forEach(layer => { layer.x -= bounds.x; layer.y -= bounds.y; });
  }
  resize(width, height, scaleLayers) {
    const size = dimensions(width, height), sx = width / this.width, sy = height / this.height;
    if (scaleLayers) this.layers.forEach(layer => { layer.x *= sx; layer.y *= sy; layer.width *= sx; layer.height *= sy; });
    Object.assign(this, size);
  }
  duplicate(name) {
    if (!this.active) return;
    const copy = surface(this.active.canvas.width, this.active.canvas.height);
    copy.getContext('2d').drawImage(this.active.canvas, 0, 0);
    this.add({ ...this.active, id: crypto.randomUUID(), canvas: copy, name, x: this.active.x + 20, y: this.active.y + 20 });
  }
  gradient(layer, from, to, start, end) {
    // Fills the whole layer, as Photoshop does without a selection.
    const a = localPoint(layer, from), b = localPoint(layer, to), sx = layer.canvas.width / layer.width, sy = layer.canvas.height / layer.height;
    const c = layer.canvas.getContext('2d'), g = c.createLinearGradient(a.x * sx, a.y * sy, b.x * sx, b.y * sy);
    g.addColorStop(0, start); g.addColorStop(1, end);
    c.save(); c.fillStyle = g; c.fillRect(0, 0, layer.canvas.width, layer.canvas.height); c.restore(); layer.type = 'paint';
  }
  mergeDown() {
    const index = this.layers.findIndex(layer => layer.id === this.selected), upper = this.layers[index], lower = this.layers[index - 1];
    if (!lower || [upper, lower].some(layer => layer.locked || !layer.visible)) return;
    // Bake both layers into one paint layer covering their combined bounds, so nothing outside the canvas is lost.
    const corners = [upper, lower].flatMap(layer => [{ x: 0, y: 0 }, { x: layer.width, y: 0 }, { x: layer.width, y: layer.height }, { x: 0, y: layer.height }].map(p => worldPoint(layer, p)));
    const left = Math.floor(Math.min(...corners.map(p => p.x))), top = Math.floor(Math.min(...corners.map(p => p.y)));
    const width = Math.ceil(Math.max(...corners.map(p => p.x))) - left, height = Math.ceil(Math.max(...corners.map(p => p.y))) - top;
    if (width > MAX_SIDE || height > MAX_SIDE) throw new Error('capacity');
    const others = this.layers.filter(layer => layer !== upper && layer !== lower).reduce((sum, layer) => sum + layer.canvas.width * layer.canvas.height, 0);
    if (others + width * height > MAX_PIXELS) throw new Error('capacity');
    const canvas = surface(width, height), c = canvas.getContext('2d'); c.translate(-left, -top);
    drawLayer(c, lower); drawLayer(c, upper);
    const merged = makeLayer('paint', lower.name, canvas, { id: lower.id, x: left, y: top });
    this.layers.splice(index - 1, 2, merged); this.selected = merged.id;
  }
  moveTo(id, target) {
    const index = this.layers.findIndex(layer => layer.id === id);
    if (index < 0 || target < 0 || target >= this.layers.length || index === target) return;
    const [layer] = this.layers.splice(index, 1); this.layers.splice(target, 0, layer);
  }
  remove() { this.layers = this.layers.filter(layer => layer.id !== this.selected); this.selected = this.layers.at(-1)?.id || null; }
  reorder(direction) {
    const index = this.layers.findIndex(layer => layer.id === this.selected), target = index + direction;
    if (index < 0 || target < 0 || target >= this.layers.length) return;
    [this.layers[index], this.layers[target]] = [this.layers[target], this.layers[index]];
  }
  exportCanvas(format = 'png') {
    const canvas = surface(this.width, this.height), c = canvas.getContext('2d'); this.render(c);
    if (format === 'jpeg') {
      c.save(); c.globalCompositeOperation = 'destination-over'; c.fillStyle = '#ffffff'; c.fillRect(0, 0, canvas.width, canvas.height); c.restore();
    }
    return canvas;
  }
}
