import { useEffect, useRef, useState } from 'react';
import { MousePointer2, Paintbrush, Eraser, Square, Circle, Minus, Type, PaintBucket, Pipette, Crop, Hand, Plus, ImagePlus, FolderOpen, Download, Save, Undo2, Redo2, Eye, EyeOff, Lock, Unlock, Copy, Trash2, ChevronUp, ChevronDown, Maximize2, Minimize2, FlipHorizontal2, FlipVertical2, ZoomIn, ZoomOut, Scan, Keyboard, HelpCircle, X, Layers, SlidersHorizontal, ArrowUpRight, FilePlus2, Blend, Merge, ArrowLeftRight } from 'lucide-react';
import { DrawingDocument, makeLayer, surface, loadImage, textSurface, shapeSurface, localPoint, worldPoint, cropBounds, BLENDS, MAX_SIDE } from '../../utils/drawingEngine.js';
import { getDrawingCopy } from '../../i18n/drawing.js';
import './DrawingStudio.css';

const TOOLS = [['move', MousePointer2, 'V'], ['brush', Paintbrush, 'B'], ['eraser', Eraser, 'E'], ['rect', Square, 'U'], ['ellipse', Circle, 'O'], ['line', Minus, 'L'], ['text', Type, 'T'], ['fill', PaintBucket, 'G'], ['gradient', Blend, 'G'], ['picker', Pipette, 'I'], ['crop', Crop, 'C'], ['hand', Hand, 'H']];
const RASTER_TYPES = ['paint', 'image'];
const IMAGE_ACCEPT = '.png,.jpg,.jpeg,.webp,.gif,.bmp';
// Free-transform handles as fractions of the layer box; corners first so they win on small layers.
const HANDLES = [[1, 1], [0, 0], [1, 0], [0, 1], [.5, 0], [1, .5], [.5, 1], [0, .5]];
const RESIZE_CURSORS = ['ew-resize', 'nwse-resize', 'ns-resize', 'nesw-resize'];
const ROTATE_CURSOR = `url("data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round"><g stroke="#fff" stroke-width="4"><path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/></g><g stroke="#000" stroke-width="1.6"><path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/></g></svg>')}") 12 12, alias`;
const PAINT_TOOLS = ['brush', 'fill', 'gradient', 'rect', 'ellipse', 'line', 'text'];

function NumberField({ value, disabled, label, commit, min, max }) {
  const [draft, setDraft] = useState(String(Math.round(value)));
  const editing = useRef(false);
  useEffect(() => { if (!editing.current) setDraft(String(Math.round(value))); }, [value]);
  function finish(e) {
    if (!editing.current) { setDraft(String(Math.round(value))); return; }
    editing.current = false;
    const valid = e.currentTarget.checkValidity() && draft.trim() !== '' && Number.isFinite(Number(draft));
    if (valid && Number(draft) !== value) commit(draft);
    else setDraft(String(Math.round(value)));
  }
  return <input type="number" min={min} max={max} step="1" aria-label={label} value={draft} disabled={disabled} onFocus={() => { editing.current = true; }} onChange={e => setDraft(e.target.value)} onBlur={finish} onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); if (e.key === 'Escape') { setDraft(String(Math.round(value))); editing.current = false; e.currentTarget.blur(); } }} />;
}

function contentSnapshot(doc) { const value = JSON.parse(doc.serialize()); delete value.selected; return JSON.stringify(value); }

function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob), a = document.createElement('a');
  a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function Modal({ title, close, children, closeLabel }) {
  const ref = useRef(null);
  useEffect(() => {
    const previous = document.activeElement, dialog = ref.current;
    dialog.showModal();
    return () => { dialog.close(); previous?.focus(); };
  }, []);
  return <dialog className="draw-dialog" ref={ref} aria-labelledby="draw-dialog-title" onCancel={e => { e.preventDefault(); close(); }} onClick={e => { if (e.target === ref.current) { const b = ref.current.getBoundingClientRect(); if (e.clientX < b.left || e.clientX > b.right || e.clientY < b.top || e.clientY > b.bottom) close(); } }}>
    <div className="draw-dialog-head"><h2 id="draw-dialog-title">{title}</h2><button type="button" onClick={close} aria-label={closeLabel}><X size={20} /></button></div>{children}
  </dialog>;
}

function Thumbnail({ layer }) {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current.getContext('2d'); c.clearRect(0, 0, 40, 32);
    const scale = Math.min(36 / layer.canvas.width, 28 / layer.canvas.height);
    const w = layer.canvas.width * scale, h = layer.canvas.height * scale;
    c.drawImage(layer.canvas, (40 - w) / 2, (32 - h) / 2, w, h);
  });
  return <canvas className="draw-thumb" width="40" height="32" ref={ref} aria-hidden="true" />;
}

export default function DrawingStudio({ lang = 'en', active = true }) {
  const t = getDrawingCopy(lang);
  const root = useRef(null), engine = useRef(null), art = useRef(null), overlay = useRef(null), viewport = useRef(null), openInput = useRef(null), importInput = useRef(null), textInput = useRef(null);
  const gesture = useRef(null), space = useRef(false), pendingReplacement = useRef(null), dirty = useRef(false), savedState = useRef(null), brushRing = useRef(null), lastPaint = useRef(null), zoomAnchor = useRef(null);
  const [revision, setRevision] = useState(0), [tool, setTool] = useState('move'), [color, setColor] = useState('#765323'), [backColor, setBackColor] = useState('#ffffff'), [size, setSize] = useState(24);
  const [stroke, setStroke] = useState('#2c251e'), [strokeWidth, setStrokeWidth] = useState(0), [filled, setFilled] = useState(true), [tolerance, setTolerance] = useState(24);
  const [text, setText] = useState(t.defaultText), [fontSize, setFontSize] = useState(56), [fontFamily, setFontFamily] = useState('sans-serif'), [bold, setBold] = useState(false);
  const [zoom, setZoom] = useState('fit'), [viewSize, setViewSize] = useState({ width: 600, height: 500 }), [crop, setCrop] = useState(null), [panel, setPanel] = useState('layers');
  const [modal, setModal] = useState(null), [draft, setDraft] = useState({ width: 1200, height: 800, name: t.untitled, background: '#ffffff', scale: false });
  const [format, setFormat] = useState('png'), [quality, setQuality] = useState(92), [busy, setBusy] = useState(false), [notice, setNotice] = useState(null), [fullscreen, setFullscreen] = useState(false), [dragging, setDragging] = useState(null), [dropTarget, setDropTarget] = useState(null);
  const doc = engine.current, selected = doc?.active, selectedIndex = doc && selected ? doc.layers.indexOf(selected) : -1;
  const below = selectedIndex > 0 ? doc.layers[selectedIndex - 1] : null, canMerge = !!below && [selected, below].every(layer => layer.visible && !layer.locked);
  const scale = doc ? (zoom === 'fit' ? Math.max(.02, Math.min(1, (viewSize.width - 64) / doc.width, (viewSize.height - 64) / doc.height)) : zoom) : 1;

  function refresh(modified = false) { if (modified) dirty.current = true; setRevision(v => v + 1); }
  function error(e) { setNotice({ error: true, message: t.errors[e.message] || t.errors.generic }); }
  function message(value) { setNotice({ error: false, message: value }); }
  async function mutate(fn, grouped = false) {
    if (!doc || busy || gesture.current) return;
    try { doc.begin(); fn(); if (!grouped) doc.commit(); refresh(true); }
    catch (e) { const previous = doc.pending; setBusy(true); try { if (previous) await doc.restore(previous); } finally { doc.pending = null; setBusy(false); refresh(); error(e); } }
  }
  async function rollback(e) {
    const previous = doc.pending; gesture.current = null; setBusy(true);
    try { if (previous) await doc.restore(previous); } catch (restoreError) { error(restoreError); }
    finally { doc.pending = null; setBusy(false); refresh(); error(e); }
  }
  async function history(direction) {
    if (!doc || busy || gesture.current) return;
    setBusy(true);
    try { await doc[direction](); setCrop(null); dirty.current = contentSnapshot(doc) !== savedState.current; refresh(); } catch (e) { error(e); } finally { setBusy(false); }
  }
  function saveProject() {
    if (!doc) return false;
    try {
      doc.commit(); downloadBlob(new Blob([doc.serialize()], { type: 'application/json' }), `${safeName(doc.name)}.imghub.json`);
      savedState.current = contentSnapshot(doc); dirty.current = false; message(t.saved); return true;
    } catch (e) { error(e); return false; }
  }
  function safeName(name) { return (name || t.untitled).replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').slice(0, 80); }
  function requestReplace(action) {
    if (dirty.current) { pendingReplacement.current = action; setModal('replace'); }
    else action();
  }
  function replaceWith(next) {
    engine.current = next; dirty.current = next.layers.length > 0; savedState.current = dirty.current ? null : contentSnapshot(next); setCrop(null); setZoom('fit'); setTool('move'); setModal(null); setNotice(null); refresh();
    if (viewport.current) { viewport.current.scrollLeft = 0; viewport.current.scrollTop = 0; }
  }
  function changeTool(next) { doc?.commit(); setTool(next); setCrop(null); if (overlay.current) overlay.current.style.cursor = ''; }
  function swapColors() { setColor(backColor); setBackColor(color); }
  function selectLayer(layer) {
    doc.commit(); doc.selected = layer?.id || null; refresh();
    if (layer?.type === 'text') { setText(layer.text); setFontSize(layer.fontSize); setFontFamily(layer.fontFamily); setColor(layer.color); setBold(layer.bold); }
  }
  function updateText(values, grouped = false) {
    if (selected?.type !== 'text' || selected.locked || !selected.visible) return;
    mutate(() => {
      const opts = { text: selected.text, fontSize: selected.fontSize, fontFamily: selected.fontFamily, color: selected.color, bold: selected.bold, ...values };
      const canvas = textSurface(opts.text, opts.fontSize, opts.fontFamily, opts.color, opts.bold);
      doc.checkBudget(canvas, selected);
      const sx = selected.width / selected.canvas.width, sy = selected.height / selected.canvas.height;
      Object.assign(selected, opts, { canvas, width: canvas.width * sx, height: canvas.height * sy });
    }, grouped);
  }

  useEffect(() => {
    if (selected?.type !== 'text') return;
    setText(selected.text); setFontSize(selected.fontSize); setFontFamily(selected.fontFamily); setColor(selected.color); setBold(selected.bold);
  }, [selected?.id, selected?.text, selected?.fontSize, selected?.fontFamily, selected?.color, selected?.bold]);

  useEffect(() => { engine.current = new DrawingDocument(); engine.current.name = t.untitled; savedState.current = contentSnapshot(engine.current); refresh(); }, []);
  useEffect(() => {
    const observer = new ResizeObserver(entries => { const b = entries[0].contentRect; setViewSize({ width: b.width, height: b.height }); });
    observer.observe(viewport.current); return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const element = viewport.current;
    const wheel = e => {
      if (!(e.ctrlKey || e.metaKey) || !art.current) return;
      // Keep the pixel under the pointer in place while zooming.
      e.preventDefault(); const b = art.current.getBoundingClientRect();
      zoomAnchor.current = { clientX: e.clientX, clientY: e.clientY, x: (e.clientX - b.left) / scale, y: (e.clientY - b.top) / scale };
      zoomTo(scale * (e.deltaY < 0 ? 1.1 : .9));
    };
    element.addEventListener('wheel', wheel, { passive: false });
    return () => element.removeEventListener('wheel', wheel);
  }, [scale]);
  useEffect(() => {
    const anchor = zoomAnchor.current; zoomAnchor.current = null;
    if (!anchor || !art.current) return;
    const b = art.current.getBoundingClientRect();
    viewport.current.scrollLeft += b.left + anchor.x * scale - anchor.clientX; viewport.current.scrollTop += b.top + anchor.y * scale - anchor.clientY;
  }, [scale]);
  useEffect(() => {
    if (!doc || !art.current) return;
    doc.render(art.current.getContext('2d'));
    const ctx = overlay.current.getContext('2d'); ctx.clearRect(0, 0, doc.width, doc.height);
    if (crop) {
      ctx.fillStyle = 'rgba(0,0,0,.48)'; ctx.beginPath(); ctx.rect(0, 0, doc.width, doc.height); ctx.rect(crop.x, crop.y, crop.width, crop.height); ctx.fill('evenodd');
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5 / scale; ctx.setLineDash([6 / scale, 4 / scale]); ctx.strokeRect(crop.x, crop.y, crop.width, crop.height); ctx.setLineDash([]);
      ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = .7 / scale;
      for (const i of [1, 2]) { ctx.beginPath(); ctx.moveTo(crop.x + crop.width * i / 3, crop.y); ctx.lineTo(crop.x + crop.width * i / 3, crop.y + crop.height); ctx.moveTo(crop.x, crop.y + crop.height * i / 3); ctx.lineTo(crop.x + crop.width, crop.y + crop.height * i / 3); ctx.stroke(); }
    } else if (selected?.visible && (tool === 'move' || tool === 'text')) {
      const corners = [{ x: 0, y: 0 }, { x: selected.width, y: 0 }, { x: selected.width, y: selected.height }, { x: 0, y: selected.height }].map(p => worldPoint(selected, p));
      ctx.strokeStyle = '#b28440'; ctx.lineWidth = 1.5 / scale; ctx.beginPath(); corners.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.closePath(); ctx.stroke();
      if (!selected.locked && tool === 'move') {
        const top = worldPoint(selected, { x: selected.width / 2, y: 0 }), knob = rotateHandle(selected), handle = 9 / scale;
        ctx.beginPath(); ctx.moveTo(top.x, top.y); ctx.lineTo(knob.x, knob.y); ctx.stroke();
        ctx.fillStyle = '#fffdf8'; ctx.beginPath(); ctx.arc(knob.x, knob.y, 5 / scale, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        for (const p of handlePoints(selected)) { ctx.fillRect(p.x - handle / 2, p.y - handle / 2, handle, handle); ctx.strokeRect(p.x - handle / 2, p.y - handle / 2, handle, handle); }
      }
    }
  }, [revision, doc, crop, tool, scale]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), notice.error ? 9000 : 5000); return () => clearTimeout(timer);
  }, [notice]);
  useEffect(() => {
    const beforeUnload = e => { if (dirty.current) { e.preventDefault(); e.returnValue = ''; } };
    const fullChange = () => setFullscreen(document.fullscreenElement === root.current);
    window.addEventListener('beforeunload', beforeUnload); document.addEventListener('fullscreenchange', fullChange);
    return () => { window.removeEventListener('beforeunload', beforeUnload); document.removeEventListener('fullscreenchange', fullChange); };
  }, []);
  useEffect(() => { if (!active && document.fullscreenElement === root.current) document.exitFullscreen().catch(() => {}); }, [active]);
  useEffect(() => {
    const keydown = e => {
      if (!active || !doc || busy || modal || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName) || e.target.isContentEditable) return;
      const key = e.key.toLowerCase(), mod = e.ctrlKey || e.metaKey;
      if (mod && ['z', 'y', 's', 'o', 'j', 'e', '0', '1', '=', '+', '-'].includes(key)) {
        e.preventDefault(); if (gesture.current) return;
        if (key === 'z') history(e.shiftKey ? 'redo' : 'undo');
        if (key === 'y') history('redo');
        if (key === 's') saveProject();
        if (key === 'o') openInput.current.click();
        if (key === 'j' && selected) mutate(() => doc.duplicate(`${selected.name} ${t.copySuffix}`));
        if (key === 'e' && canMerge) mutate(() => doc.mergeDown());
        if (key === '0') setZoom('fit');
        if (key === '1') setZoom(1);
        if (key === '=' || key === '+') zoomTo(scale * 1.25);
        if (key === '-') zoomTo(scale / 1.25);
        return;
      }
      if (mod && e.shiftKey && key === 'n') { e.preventDefault(); mutate(() => doc.blank(t.painting)); return; }
      if (mod || e.altKey) return;
      if (['arrowleft', 'arrowright', 'arrowup', 'arrowdown'].includes(key) && selected && !selected.locked) {
        e.preventDefault(); const step = e.shiftKey ? 10 : 1;
        mutate(() => { selected.x += key === 'arrowleft' ? -step : key === 'arrowright' ? step : 0; selected.y += key === 'arrowup' ? -step : key === 'arrowdown' ? step : 0; }); return;
      }
      if (key === ' ') { e.preventDefault(); space.current = true; return; }
      if ((key === 'delete' || key === 'backspace') && selected && !selected.locked) { e.preventDefault(); mutate(() => doc.remove()); }
      if (key === 'escape') { setCrop(null); }
      if (key === '[') setSize(v => Math.max(1, v - 5));
      if (key === ']') setSize(v => Math.min(200, v + 5));
      if (key === 'x') swapColors();
      if (key === 'd') { setColor('#000000'); setBackColor('#ffffff'); }
      // G selects the bucket; Shift+G switches between bucket and gradient, as in Photoshop.
      if (key === 'g' && !gesture.current) { changeTool(e.shiftKey ? (tool === 'fill' ? 'gradient' : 'fill') : tool === 'gradient' ? 'gradient' : 'fill'); return; }
      const target = TOOLS.find(entry => entry[2].toLowerCase() === key);
      if (target && !gesture.current) changeTool(target[0]);
    };
    const keyup = e => { if (e.code === 'Space') space.current = false; };
    const blur = () => { space.current = false; };
    window.addEventListener('keydown', keydown); window.addEventListener('keyup', keyup); window.addEventListener('blur', blur);
    return () => { window.removeEventListener('keydown', keydown); window.removeEventListener('keyup', keyup); window.removeEventListener('blur', blur); };
  });

  async function readRaster(file) {
    if (file.size > 25 * 1024 * 1024) throw new Error('size');
    if (!/\.(png|jpe?g|webp|gif|bmp)$/i.test(file.name)) throw new Error('image');
    const url = URL.createObjectURL(file);
    try {
      const image = await loadImage(url), ratio = Math.min(1, MAX_SIDE / image.naturalWidth, MAX_SIDE / image.naturalHeight);
      const canvas = surface(image.naturalWidth * ratio, image.naturalHeight * ratio); canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
      return makeLayer('image', file.name.replace(/\.[^.]+$/, ''), canvas);
    } finally { URL.revokeObjectURL(url); }
  }
  async function readFiles(files, replace = false) {
    if (!doc || busy || !files.length || gesture.current) return;
    setBusy(true); doc.commit();
    try {
      const first = files[0];
      if (/\.json$/i.test(first.name)) {
        if (!replace || files.length !== 1) throw new Error('project');
        if (first.size > 60 * 1024 * 1024) throw new Error('size');
        const next = new DrawingDocument(); await next.restore(await first.text());
        requestReplace(() => { replaceWith(next); savedState.current = contentSnapshot(next); dirty.current = false; message(t.restored); });
      } else {
        // Decode first; a failed import leaves the current document untouched.
        const layers = [];
        if (files.length > 40) throw new Error('capacity');
        let total = replace ? 0 : doc.layers.reduce((sum, l) => sum + l.canvas.width * l.canvas.height, 0);
        for (const file of (replace ? files.slice(0, 1) : files)) {
          const layer = await readRaster(file); total += layer.canvas.width * layer.canvas.height;
          if (total > 32 * 1024 * 1024 || (!replace && doc.layers.length + layers.length + 1 > 40)) throw new Error('capacity');
          layers.push(layer);
        }
        if (replace) {
          const layer = layers[0], next = new DrawingDocument(layer.width, layer.height, 'transparent'); next.add(layer); next.name = layer.name;
          requestReplace(() => { replaceWith(next); message(t.restored); });
        } else {
          doc.begin(); layers.forEach(layer => {
            const ratio = Math.min(1, doc.width / layer.width, doc.height / layer.height);
            layer.width *= ratio; layer.height *= ratio; layer.x = (doc.width - layer.width) / 2; layer.y = (doc.height - layer.height) / 2; doc.add(layer);
          }); doc.commit(); setTool('move'); refresh(true); message(t.imported);
        }
      }
    } catch (e) { error(e); } finally { setBusy(false); }
  }
  async function sample() {
    if (busy) return;
    setBusy(true);
    try {
      const image = await loadImage('/assets/studio/subtitle.webp'), canvas = surface(1200, 800); canvas.getContext('2d').drawImage(image, 0, 0, 1200, 800);
      const next = new DrawingDocument(1200, 800, '#f4f0e8'); next.name = t.untitled;
      next.add(makeLayer('image', t.imageLayer, canvas));
      const shape = shapeSurface('rect', 1200, 210, '#2c251e', '#2c251e', 0, true);
      next.add(makeLayer('rect', t.rect, shape, { y: 590, opacity: .8 }));
      const title = textSurface(t.defaultText, 58, 'serif', '#fffdf8');
      next.add(makeLayer('text', t.defaultText, title, { x: 64, y: 624, text: t.defaultText, fontSize: 58, fontFamily: 'serif', color: '#fffdf8', bold: false }));
      requestReplace(() => replaceWith(next));
    } catch (e) { error(e); } finally { setBusy(false); }
  }
  function point(e) { const b = overlay.current.getBoundingClientRect(); return { x: (e.clientX - b.left) / scale, y: (e.clientY - b.top) / scale }; }
  function handlePoints(layer) { return HANDLES.map(([hx, hy]) => ({ hx, hy, ...worldPoint(layer, { x: layer.width * hx, y: layer.height * hy }) })); }
  function rotateHandle(layer) { return worldPoint(layer, { x: layer.width / 2, y: -28 / scale }); }
  function handleAt(p) {
    if (!selected || selected.locked || !selected.visible) return null;
    const near = h => Math.hypot(h.x - p.x, h.y - p.y) * scale < 12, knob = rotateHandle(selected);
    return near(knob) ? { rotate: true, ...knob } : handlePoints(selected).find(near) || null;
  }
  function handleCursor(h) {
    if (h.rotate) return ROTATE_CURSOR;
    const c = worldPoint(selected, { x: selected.width / 2, y: selected.height / 2 }), angle = Math.atan2(h.y - c.y, h.x - c.x) * 180 / Math.PI;
    return RESIZE_CURSORS[Math.round(((angle % 180) + 180) % 180 / 45) % 4];
  }
  function sampleColor(p, back = false) {
    const pixel = art.current.getContext('2d').getImageData(Math.min(doc.width - 1, Math.max(0, Math.floor(p.x))), Math.min(doc.height - 1, Math.max(0, Math.floor(p.y))), 1, 1).data;
    (back ? setBackColor : setColor)('#' + Array.from(pixel.slice(0, 3)).map(v => v.toString(16).padStart(2, '0')).join(''));
  }
  function hover(e) {
    if (e.currentTarget !== overlay.current) return;
    const b = overlay.current.getBoundingClientRect(), ring = brushRing.current;
    if (ring) { const d = size * scale; Object.assign(ring.style, { display: 'block', width: `${d}px`, height: `${d}px`, transform: `translate(${e.clientX - b.left - d / 2}px, ${e.clientY - b.top - d / 2}px)` }); }
    if (tool === 'move' && !gesture.current && doc) { const h = handleAt(point(e)); overlay.current.style.cursor = h ? handleCursor(h) : ''; }
  }
  function panDown(e) {
    if (busy || e.button !== 0 || !(tool === 'hand' || space.current) || gesture.current) return;
    e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId);
    gesture.current = { kind: 'pan', pointer: e.pointerId, start: { x: e.clientX, y: e.clientY }, left: viewport.current.scrollLeft, top: viewport.current.scrollTop };
  }
  function pointerDown(e) {
    e.stopPropagation();
    if (!doc || busy || gesture.current || e.button !== 0) return;
    if (space.current || tool === 'hand') { panDown(e); return; }
    e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId);
    const p = point(e);
    try {
      // Alt+click samples the background color with the eyedropper, and the foreground color with painting tools.
      if (tool === 'picker') { sampleColor(p, e.altKey); return; }
      if (e.altKey && PAINT_TOOLS.includes(tool)) { sampleColor(p); return; }
      if (tool === 'crop') { gesture.current = { kind: 'crop', pointer: e.pointerId, start: p }; setCrop(null); return; }
      if (tool === 'move') {
        const handle = handleAt(p);
        if (handle?.rotate) {
          const center = worldPoint(selected, { x: selected.width / 2, y: selected.height / 2 });
          doc.begin(); gesture.current = { kind: 'rotate', pointer: e.pointerId, layer: selected, center, rotation: selected.rotation, angle: Math.atan2(p.y - center.y, p.x - center.x) }; return;
        }
        if (handle) { doc.begin(); gesture.current = { kind: 'resize', pointer: e.pointerId, layer: selected, original: { ...selected }, handle }; return; }
        const hit = doc.hit(p); selectLayer(hit);
        if (hit) { doc.begin(); gesture.current = { kind: 'move', pointer: e.pointerId, layer: hit, start: p, x: hit.x, y: hit.y }; } return;
      }
      if (tool === 'text') {
        const hit = doc.hit(p);
        if (hit?.type === 'text') { selectLayer(hit); textInput.current?.focus(); return; }
        if (!text.trim()) { textInput.current?.focus(); return; }
        doc.begin(); const canvas = textSurface(text, fontSize, fontFamily, color, bold);
        doc.add(makeLayer('text', text.slice(0, 24), canvas, { x: p.x, y: p.y, text, fontSize, fontFamily, color, bold })); doc.commit(); refresh(true); return;
      }
      doc.begin();
      if (['rect', 'ellipse', 'line'].includes(tool)) {
        const canvas = shapeSurface(tool, 1, 1, color, stroke, strokeWidth, filled);
        const layer = doc.add(makeLayer(tool, t[tool], canvas, { x: p.x, y: p.y }));
        gesture.current = { kind: 'shape', pointer: e.pointerId, layer, start: p, type: tool }; refresh(true); return;
      }
      let layer = doc.active;
      if (layer && (layer.locked || !layer.visible)) { doc.pending = null; message(t.lockedHint); return; }
      if (!layer || (['brush', 'gradient'].includes(tool) && !RASTER_TYPES.includes(layer.type))) layer = doc.blank(t.painting);
      if ((tool === 'eraser' || tool === 'fill') && !RASTER_TYPES.includes(layer.type)) message(t.rasterized);
      if (tool === 'fill') { doc.fill(layer, p, color, tolerance); doc.commit(); refresh(true); return; }
      if (tool === 'gradient') {
        const base = surface(layer.canvas.width, layer.canvas.height); base.getContext('2d').drawImage(layer.canvas, 0, 0);
        gesture.current = { kind: 'gradient', pointer: e.pointerId, layer, start: p, base, moved: false }; refresh(true); return;
      }
      // Shift+click continues a straight line from the previous stroke on the same layer.
      const from = e.shiftKey && lastPaint.current?.layer === layer ? lastPaint.current.point : p;
      doc.stroke(layer, from, p, size, color, tool === 'eraser');
      gesture.current = { kind: tool, pointer: e.pointerId, layer, last: p }; refresh(true);
    } catch (e) { rollback(e); }
  }
  function pointerMove(e) {
    e.stopPropagation(); hover(e);
    const g = gesture.current; if (!g || g.pointer !== e.pointerId) return;
    if (g.kind === 'pan') { viewport.current.scrollLeft = g.left - (e.clientX - g.start.x); viewport.current.scrollTop = g.top - (e.clientY - g.start.y); return; }
    const p = point(e);
    if (g.kind === 'crop') { setCrop(cropBounds(g.start, p, doc.width, doc.height)); return; }
    if (g.kind === 'move') { g.layer.x = g.x + p.x - g.start.x; g.layer.y = g.y + p.y - g.start.y; }
    if (g.kind === 'resize') {
      const o = g.original, { hx, hy } = g.handle, at = localPoint(o, p), clamp = v => Math.min(MAX_SIDE * 4, Math.max(1, v));
      const w = hx === .5 ? o.width : clamp(hx ? at.x : o.width - at.x);
      const h = hy === .5 ? o.height : e.shiftKey && hx !== .5 ? clamp(w / (o.width / o.height)) : clamp(hy ? at.y : o.height - at.y);
      // Anchor the opposite handle even when rotated or flipped.
      const anchor = worldPoint(o, { x: o.width * (1 - hx), y: o.height * (1 - hy) }), a = o.rotation * Math.PI / 180;
      const dx = (hx - .5) * w * (o.flipX ? -1 : 1), dy = (hy - .5) * h * (o.flipY ? -1 : 1);
      Object.assign(g.layer, { width: w, height: h, x: anchor.x + dx * Math.cos(a) - dy * Math.sin(a) - w / 2, y: anchor.y + dx * Math.sin(a) + dy * Math.cos(a) - h / 2 });
    }
    if (g.kind === 'rotate') {
      let angle = g.rotation + (Math.atan2(p.y - g.center.y, p.x - g.center.x) - g.angle) * 180 / Math.PI;
      if (e.shiftKey) angle = Math.round(angle / 15) * 15;
      g.layer.rotation = ((angle % 360) + 540) % 360 - 180;
    }
    if (g.kind === 'gradient') {
      let end = p;
      if (e.shiftKey) { const step = Math.PI / 4, length = Math.hypot(p.x - g.start.x, p.y - g.start.y), angle = Math.round(Math.atan2(p.y - g.start.y, p.x - g.start.x) / step) * step; end = { x: g.start.x + Math.cos(angle) * length, y: g.start.y + Math.sin(angle) * length }; }
      const c = g.layer.canvas.getContext('2d'); c.clearRect(0, 0, g.layer.canvas.width, g.layer.canvas.height); c.drawImage(g.base, 0, 0);
      doc.gradient(g.layer, g.start, end, color, backColor); g.moved = true;
    }
    if (g.kind === 'brush' || g.kind === 'eraser') {
      const events = e.nativeEvent.getCoalescedEvents?.() || [e];
      try { for (const event of events.length ? events : [e]) { const next = point(event); doc.stroke(g.layer, g.last, next, size, color, g.kind === 'eraser'); g.last = next; } }
      catch (e) { rollback(e); return; }
    }
    if (g.kind === 'shape') {
      let dx = p.x - g.start.x, dy = p.y - g.start.y;
      if (e.shiftKey) {
        if (g.type === 'line') { if (Math.abs(dx) > Math.abs(dy)) dy = 0; else dx = 0; }
        else { const side = Math.max(Math.abs(dx), Math.abs(dy)); dx = Math.sign(dx || 1) * side; dy = Math.sign(dy || 1) * side; }
      }
      const w = Math.min(MAX_SIDE, Math.max(1, Math.abs(dx))), h = Math.min(MAX_SIDE, Math.max(1, Math.abs(dy)));
      const canvas = shapeSurface(g.type, w, h, color, g.type === 'line' ? color : stroke, g.type === 'line' ? Math.max(2, strokeWidth || size / 4) : strokeWidth, filled);
      try { doc.checkBudget(canvas, g.layer); Object.assign(g.layer, { canvas, width: w, height: h, x: dx < 0 ? g.start.x - w : g.start.x, y: dy < 0 ? g.start.y - h : g.start.y, flipY: g.type === 'line' && dx * dy < 0 }); } catch (e) { rollback(e); return; }
    }
    refresh(true);
  }
  async function pointerUp(e) {
    e.stopPropagation();
    const g = gesture.current; if (!g || g.pointer !== e.pointerId) return;
    gesture.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    if (g.kind === 'pan' || g.kind === 'crop') return;
    if (g.kind === 'brush' || g.kind === 'eraser') lastPaint.current = { layer: g.layer, point: g.last };
    if ((e.type === 'pointercancel' || (g.kind === 'gradient' && !g.moved)) && doc.pending) {
      setBusy(true); try { await doc.restore(doc.pending); refresh(); } catch (err) { error(err); } finally { setBusy(false); }
    } else { doc.commit(); refresh(true); }
  }
  function applyCrop() { if (!crop?.width || !crop?.height) return; mutate(() => doc.crop(crop)); setCrop(null); setZoom('fit'); setTool('move'); }
  function numeric(field, value) {
    if (!selected || selected.locked || value === '' || !Number.isFinite(Number(value))) return;
    const v = Number(value); if ((field === 'width' || field === 'height') && (v < 1 || v > MAX_SIDE * 4)) { error(new Error('dimensions')); refresh(); return; }
    if ((field === 'x' || field === 'y') && Math.abs(v) > MAX_SIDE * 4) { error(new Error('dimensions')); refresh(); return; }
    if (field === 'rotation' && Math.abs(v) > 360) { error(new Error('dimensions')); refresh(); return; }
    mutate(() => { selected[field] = v; });
  }
  function slider(field, value) {
    if (!selected || selected.locked) return;
    doc.begin(); selected[field] = Number(value); refresh(true);
  }
  function openCanvasModal(kind) {
    setNotice(null);
    setDraft(kind === 'resize' ? { width: doc.width, height: doc.height, name: doc.name, background: doc.background, scale: false } : { width: 1200, height: 800, name: t.untitled, background: '#ffffff', scale: false });
    setModal(kind);
  }
  function applyCanvas(e) {
    e.preventDefault();
    try {
      if (modal === 'new') { const next = new DrawingDocument(Number(draft.width), Number(draft.height), draft.background); next.name = draft.name || t.untitled; requestReplace(() => { replaceWith(next); setTool('brush'); }); }
      else { doc.begin(); doc.resize(Number(draft.width), Number(draft.height), draft.scale); doc.background = draft.background; doc.name = draft.name || t.untitled; doc.commit(); refresh(true); setModal(null); setZoom('fit'); }
    } catch (e) { error(e); }
  }
  async function exportImage(e) {
    e.preventDefault(); if (busy) return; setBusy(true);
    try {
      const canvas = doc.exportCanvas(format), blob = await new Promise(resolve => canvas.toBlob(resolve, `image/${format}`, quality / 100));
      if (!blob) throw new Error('export');
      downloadBlob(blob, `${safeName(doc.name)}.${format === 'jpeg' ? 'jpg' : format}`); message(t.downloaded); setModal(null);
    } catch (e) { error(e); } finally { setBusy(false); }
  }
  async function toggleFull() {
    try { if (fullscreen) await document.exitFullscreen(); else await root.current.requestFullscreen(); } catch (e) { error(e); }
  }
  function zoomTo(value) { setZoom(Math.max(.05, Math.min(4, value))); }
  const iconButton = (Icon, label, action, disabled = false, extra = {}) => <button type="button" title={label} aria-label={label} onClick={action} disabled={disabled || busy} {...extra}><Icon size={17} strokeWidth={1.6} /></button>;
  const rangeControl = (field, label, min, max, step = 1, suffix = '%') => <label className="draw-range"><span>{label}<output>{Math.round((selected?.[field] || 0) * (field === 'opacity' ? 100 : 1))}{suffix}</output></span><input aria-label={label} type="range" min={min} max={max} step={step} value={selected?.[field] ?? min} disabled={!selected || selected.locked || busy} onChange={e => slider(field, e.target.value)} onPointerUp={() => doc.commit()} onBlur={() => doc.commit()} /></label>;

  return <div className="drawing-studio" ref={root} aria-busy={busy}>
    <input className="draw-file" type="file" accept={IMAGE_ACCEPT + ',.json'} ref={openInput} onChange={e => { readFiles(Array.from(e.target.files), true); e.target.value = ''; }} aria-label={t.open} />
    <input className="draw-file" type="file" accept={IMAGE_ACCEPT} multiple ref={importInput} onChange={e => { readFiles(Array.from(e.target.files)); e.target.value = ''; }} aria-label={t.import} />
    <div className="draw-heading"><div><span className="draw-eyebrow">IMGHUB / DRAWING STUDIO</span><p>{t.local}</p></div><div className="draw-heading-actions">{iconButton(HelpCircle, t.help, () => setModal('help'))}{iconButton(Keyboard, t.shortcuts, () => setModal('shortcuts'))}{iconButton(fullscreen ? Minimize2 : Maximize2, fullscreen ? t.exitFullscreen : t.fullscreen, toggleFull)}</div></div>
    <div className="draw-workbench">
      <div className="draw-filebar">
        <div className="draw-file-actions"><button type="button" disabled={!doc || busy} onClick={() => openCanvasModal('new')}><FilePlus2 size={16} />{t.new}</button><button type="button" disabled={!doc || busy} onClick={() => openInput.current.click()}><FolderOpen size={16} />{t.open}</button><button type="button" disabled={!doc || busy} onClick={() => importInput.current.click()}><ImagePlus size={16} />{t.import}</button></div>
        <div className="draw-export-actions"><button type="button" disabled={!doc || busy} onClick={saveProject} title={t.projectHint}><Save size={16} />{t.save}</button><button type="button" className="draw-primary" disabled={!doc || busy} onClick={() => setModal('export')}><Download size={16} />{t.export}</button></div>
      </div>
      <div className="draw-options" aria-label={t[tool]}>
        <span className="draw-tool-name">{t[tool]}</span>
        {!['move', 'crop', 'hand'].includes(tool) && <label className="draw-color-control"><input aria-label={t.color} type="color" value={color} onChange={e => { setColor(e.target.value); if (tool === 'text') updateText({ color: e.target.value }); }} /><span>{t.color}</span></label>}
        {['brush', 'eraser'].includes(tool) && <label className="draw-inline-control">{t.brushSize}<input type="range" min="1" max="200" value={size} aria-label={t.brushSize} onChange={e => setSize(Number(e.target.value))} /><output>{size}px</output></label>}
        {['rect', 'ellipse', 'line'].includes(tool) && <>{tool !== 'line' && <label className="draw-color-control"><input aria-label={t.stroke} type="color" value={stroke} onChange={e => setStroke(e.target.value)} /><span>{t.stroke}</span></label>}<label className="draw-inline-control">{t.strokeWidth}<input aria-label={t.strokeWidth} type="number" min="0" max="100" value={strokeWidth} onChange={e => setStrokeWidth(Math.min(100, Math.max(0, Number(e.target.value))))} /></label>{tool !== 'line' && <label className="draw-check"><input type="checkbox" checked={filled} onChange={e => setFilled(e.target.checked)} />{t.filled}</label>}</>}
        {tool === 'text' && <><select aria-label={t.font} value={fontFamily} onChange={e => { setFontFamily(e.target.value); updateText({ fontFamily: e.target.value }); }}><option value="sans-serif">{t.sans}</option><option value="serif">{t.serif}</option><option value="monospace">{t.mono}</option></select><label className="draw-inline-control">{t.fontSize}<NumberField key={(selected?.id || 'new') + fontSize} value={fontSize} label={t.fontSize} min={8} max={300} commit={value => { const v = Number(value); setFontSize(v); updateText({ fontSize: v }); }} /></label><button type="button" className={bold ? 'draw-active' : ''} aria-pressed={bold} onClick={() => { setBold(!bold); updateText({ bold: !bold }); }}>{t.bold}</button></>}
        {tool === 'gradient' && <label className="draw-color-control"><input aria-label={t.backColor} type="color" value={backColor} onChange={e => setBackColor(e.target.value)} /><span>{t.backColor}</span></label>}
        {tool === 'gradient' && <span className="draw-option-note">{t.toolHelp.gradient}</span>}
        {tool === 'fill' && <label className="draw-inline-control">{t.tolerance}<input aria-label={t.tolerance} type="range" min="0" max="128" value={tolerance} onChange={e => setTolerance(Number(e.target.value))} /><output>{tolerance}</output></label>}
        {tool === 'crop' && <><span className="draw-option-note">{crop ? `${crop.width} × ${crop.height} px` : t.cropHint}</span><button type="button" className="draw-primary" disabled={!crop?.width || !crop?.height} onClick={applyCrop}>{t.cropApply}</button><button type="button" onClick={() => { setCrop(null); setTool('move'); }}>{t.cancel}</button></>}
        {['move', 'hand'].includes(tool) && <span className="draw-option-note">{t.toolHelp[tool]}</span>}
        <div className="draw-history-actions">{iconButton(Undo2, t.undo + ' (Ctrl+Z)', () => history('undo'), !doc?.past.length)}{iconButton(Redo2, t.redo + ' (Ctrl+Shift+Z)', () => history('redo'), !doc?.future.length)}</div>
      </div>
      <div className="draw-main">
        <div className="draw-toolbar" role="toolbar" aria-label={t.help} aria-orientation="vertical">{TOOLS.map(([id, Icon, key]) => <button type="button" key={id} disabled={busy} aria-label={t[id]} title={`${t[id]} (${key})`} aria-pressed={tool === id} className={tool === id ? 'draw-active' : ''} onClick={() => changeTool(id)}><Icon size={20} strokeWidth={1.5} /><kbd>{key}</kbd></button>)}<div className="draw-swatches"><label className="draw-swatch-fg" title={t.color}><input aria-label={t.color} type="color" value={color} onChange={e => setColor(e.target.value)} /></label><label className="draw-swatch-bg" title={t.backColor}><input aria-label={t.backColor} type="color" value={backColor} onChange={e => setBackColor(e.target.value)} /></label><button type="button" className="draw-swatch-swap" title={t.swapColors + ' (X)'} aria-label={t.swapColors + ' (X)'} onClick={swapColors}><ArrowLeftRight size={10} strokeWidth={2} /></button><button type="button" className="draw-swatch-reset" title={t.resetColors + ' (D)'} aria-label={t.resetColors + ' (D)'} onClick={() => { setColor('#000000'); setBackColor('#ffffff'); }}><span /><span /></button></div></div>
        <div className="draw-viewport" ref={viewport} onDragOver={e => { if (e.dataTransfer.types.includes('Files')) { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; } }} onDrop={e => { if (e.dataTransfer.files.length) { e.preventDefault(); readFiles(Array.from(e.dataTransfer.files)); } }} onPointerDown={panDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp}>
          <div className="draw-stage" style={{ width: doc ? Math.max(viewSize.width, doc.width * scale + 64) : '100%', height: doc ? Math.max(viewSize.height, doc.height * scale + 64) : '100%' }}>
            {doc && <div className="draw-canvas-wrap" style={{ width: doc.width * scale, height: doc.height * scale }}><canvas width={doc.width} height={doc.height} ref={art} className="draw-art" aria-label={t.artwork} /><canvas width={doc.width} height={doc.height} ref={overlay} className={'draw-overlay draw-cursor-' + tool} aria-label={t.toolHelp[tool]} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp} onPointerLeave={() => { if (brushRing.current) brushRing.current.style.display = 'none'; }} onDoubleClick={e => { const layer = doc.hit(point(e)); if (layer?.type === 'text') { selectLayer(layer); setTool('text'); setTimeout(() => textInput.current?.focus(), 0); } }} />{['brush', 'eraser'].includes(tool) && <div className="draw-brush-ring" ref={brushRing} aria-hidden="true" />}</div>}
            {doc && !doc.layers.length && tool === 'move' && <div className="draw-welcome"><div className="draw-welcome-mark" aria-hidden="true"><Paintbrush size={32} strokeWidth={1.2} /><span>✦</span></div><h2>{t.title}</h2><p>{t.intro}</p><div><button type="button" className="draw-primary" onClick={() => openCanvasModal('new')}><Plus size={16} />{t.new}</button><button type="button" onClick={() => openInput.current.click()}><FolderOpen size={16} />{t.open}</button></div><button className="draw-sample-link" type="button" onClick={sample}>{t.sample}<ArrowUpRight size={14} /></button><small>{t.emptyTip}</small></div>}
          </div>
        </div>
        <aside className="draw-sidebar">
          <div className="draw-panel-tabs" role="tablist" aria-label={t.properties}><button type="button" id="draw-layers-tab" role="tab" aria-selected={panel === 'layers'} aria-controls="draw-side-panel" className={panel === 'layers' ? 'draw-active' : ''} onClick={() => setPanel('layers')}><Layers size={16} />{t.layers}<span>{doc?.layers.length || 0}</span></button><button type="button" id="draw-adjust-tab" role="tab" aria-selected={panel === 'adjust'} aria-controls="draw-side-panel" className={panel === 'adjust' ? 'draw-active' : ''} onClick={() => setPanel('adjust')}><SlidersHorizontal size={16} />{t.adjustments}</button></div>
          <div className="draw-side-scroll" id="draw-side-panel" role="tabpanel" aria-labelledby={panel === 'layers' ? 'draw-layers-tab' : 'draw-adjust-tab'}>
            {panel === 'layers' ? <>
              <div className="draw-layer-actions">{iconButton(Plus, t.newLayer, () => mutate(() => doc.blank(t.painting)), !doc)}{iconButton(Copy, t.duplicate, () => mutate(() => doc.duplicate(`${selected.name} ${t.copySuffix}`)), !selected)}{iconButton(ChevronUp, t.up, () => mutate(() => doc.reorder(1)), !selected || doc.layers.at(-1) === selected)}{iconButton(ChevronDown, t.down, () => mutate(() => doc.reorder(-1)), !selected || doc.layers[0] === selected)}{iconButton(Merge, t.mergeDown + ' (Ctrl+E)', () => mutate(() => doc.mergeDown()), !canMerge)}{iconButton(Trash2, t.delete, () => mutate(() => doc.remove()), !selected || selected.locked)}</div>
              <div className="draw-layer-list">{doc?.layers.length ? [...doc.layers].reverse().map(layer => <div key={layer.id} className={'draw-layer-row ' + (selected === layer ? 'is-selected ' : '') + (!layer.visible ? 'is-hidden ' : '') + (dropTarget === layer.id && dragging !== layer.id ? 'is-drop-target' : '')} draggable={!busy} onDragStart={e => { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', layer.id); setDragging(layer.id); }} onDragOver={e => { if (dragging) { e.preventDefault(); setDropTarget(layer.id); } }} onDrop={e => { e.preventDefault(); if (dragging && dragging !== layer.id) { const target = doc.layers.indexOf(layer); mutate(() => doc.moveTo(dragging, target)); } setDragging(null); setDropTarget(null); }} onDragEnd={() => { setDragging(null); setDropTarget(null); }}>{iconButton(layer.visible ? Eye : EyeOff, (layer.visible ? t.hide : t.show) + ' · ' + layer.name, () => mutate(() => { layer.visible = !layer.visible; }))}<button type="button" className="draw-layer-select" aria-pressed={selected === layer} aria-label={layer.name} onClick={() => selectLayer(layer)}><Thumbnail layer={layer} /><span>{layer.name}<small>{layer.type === 'text' ? t.text : layer.type === 'paint' ? t.painting : t[layer.type] || t.imageLayer}</small></span></button>{iconButton(layer.locked ? Lock : Unlock, (layer.locked ? t.unlock : t.lock) + ' · ' + layer.name, () => mutate(() => { layer.locked = !layer.locked; }))}</div>) : <div className="draw-empty-layers"><Layers size={27} strokeWidth={1} /><p>{t.noLayers}</p><small>{t.layerHint}</small></div>}</div>
              {selected && <div className="draw-properties"><h3>{t.properties}</h3><label className="draw-field">{t.layerName}<input aria-label={t.layerName} value={selected.name} maxLength={100} disabled={selected.locked} onFocus={() => doc.begin()} onChange={e => { selected.name = e.target.value; refresh(true); }} onBlur={() => doc.commit()} /></label>{rangeControl('opacity', t.opacity, 0, 1, .01)}<label className="draw-field">{t.blend}<select value={selected.blend} aria-label={t.blend} disabled={selected.locked} onChange={e => mutate(() => { selected.blend = e.target.value; })}>{BLENDS.map((value, i) => <option key={value} value={value}>{t.blends[i]}</option>)}</select></label><div className="draw-transform-grid">{[['x', 'X'], ['y', 'Y'], ['width', t.width], ['height', t.height], ['rotation', t.rotation]].map(([field, label]) => <label key={field}>{label}<NumberField key={selected.id + field + revision} value={selected[field]} label={t.properties + ' ' + label} disabled={selected.locked} commit={value => numeric(field, value)} /></label>)}</div><div className="draw-flip-actions">{iconButton(FlipHorizontal2, t.flipX, () => mutate(() => { selected.flipX = !selected.flipX; }), selected.locked)}{iconButton(FlipVertical2, t.flipY, () => mutate(() => { selected.flipY = !selected.flipY; }), selected.locked)}</div></div>}
            </> : <div className="draw-adjustments"><h3>{t.adjustments}</h3>{selected ? <><p className="draw-option-note">{selected.name}</p>{rangeControl('brightness', t.brightness, 0, 200)}{rangeControl('contrast', t.contrast, 0, 200)}{rangeControl('saturation', t.saturation, 0, 200)}{rangeControl('hue', t.hue, -180, 180, 1, '°')}{rangeControl('blur', t.blur, 0, 20, .1, 'px')}<button type="button" disabled={selected.locked} onClick={() => mutate(() => Object.assign(selected, { brightness: 100, contrast: 100, saturation: 100, hue: 0, blur: 0 }))}>{t.reset}</button></> : <p className="draw-option-note">{t.chooseLayer}</p>}</div>}
            {tool === 'text' && <div className="draw-text-editor"><label className="draw-field">{t.editText}<textarea ref={textInput} aria-label={t.editText} rows={4} maxLength={5000} placeholder={t.textPlaceholder} value={text} onFocus={() => doc?.begin()} onBlur={() => { doc?.commit(); refresh(); }} onChange={e => { setText(e.target.value); updateText({ text: e.target.value }, true); }} /></label><small>{t.toolHelp.text}</small></div>}
          </div>
          <button type="button" className="draw-canvas-settings" disabled={!doc} onClick={() => openCanvasModal('resize')}><span>{t.document}<small>{doc ? `${doc.width} × ${doc.height} px` : '1200 × 800 px'}</small></span><SlidersHorizontal size={16} /></button>
        </aside>
      </div>
      <div className="draw-statusbar"><span className="draw-document-name">{doc?.name || t.untitled}<small>{doc ? `${doc.width} × ${doc.height} px` : ''}</small></span><div className="draw-zoom-controls">{iconButton(ZoomOut, t.zoomOut, () => zoomTo(scale / 1.25), !doc)}<select aria-label={t.zoomIn} value={zoom === 'fit' ? 'fit' : String(zoom)} onChange={e => setZoom(e.target.value === 'fit' ? 'fit' : Number(e.target.value))}><option value="fit">{t.fit} ({Math.round(scale * 100)}%)</option>{[.25, .5, .75, 1, 1.5, 2, 3, 4].map(z => <option key={z} value={z}>{z * 100}%</option>)}{zoom !== 'fit' && ![.25, .5, .75, 1, 1.5, 2, 3, 4].includes(zoom) && <option value={zoom}>{Math.round(zoom * 100)}%</option>}</select>{iconButton(ZoomIn, t.zoomIn, () => zoomTo(scale * 1.25), !doc)}{iconButton(Scan, t.fit, () => setZoom('fit'))}</div></div>
    </div>
    <p className="draw-footnote"><span>{t.toolHelp[tool]}</span><span>{t.projectHint}</span></p>
    {notice && <div className={'draw-notice ' + (notice.error ? 'is-error' : '')} role={notice.error ? 'alert' : 'status'}>{notice.message}<button type="button" aria-label={t.cancel} onClick={() => setNotice(null)}><X size={16} /></button></div>}
    {busy && <div className="draw-busy" role="status"><span className="draw-spinner" />{t.busy}</div>}
    {modal && <Modal key={modal} close={() => { setModal(null); pendingReplacement.current = null; }} title={modal === 'new' ? t.new : modal === 'resize' ? t.resize : modal === 'export' ? t.exportTitle : modal === 'replace' ? t.replaceTitle : modal === 'help' ? t.help : t.shortcuts} closeLabel={t.cancel}>
      {notice?.error && <p className="draw-dialog-error" role="alert">{notice.message}</p>}
      {(modal === 'new' || modal === 'resize') && <form onSubmit={applyCanvas}><label className="draw-field">{t.name}<input value={draft.name} maxLength={100} onChange={e => setDraft({ ...draft, name: e.target.value })} /></label><div className="draw-dialog-grid"><label className="draw-field">{t.width}<input type="number" min="1" max="4096" step="1" required value={draft.width} onChange={e => setDraft({ ...draft, width: e.target.value })} /></label><label className="draw-field">{t.height}<input type="number" min="1" max="4096" step="1" required value={draft.height} onChange={e => setDraft({ ...draft, height: e.target.value })} /></label></div>{modal === 'new' && <div className="draw-presets" role="group" aria-label={t.preset}>{[[t.landscape, 1200, 800], [t.square, 1080, 1080], [t.portrait, 1080, 1440]].map(([label, w, h]) => <button key={label} type="button" onClick={() => setDraft({ ...draft, width: w, height: h })}>{label}<small>{w} × {h}</small></button>)}</div>}<label className="draw-field">{t.background}<select value={draft.background === 'transparent' ? 'transparent' : draft.background === '#ffffff' ? '#ffffff' : 'custom'} onChange={e => setDraft({ ...draft, background: e.target.value === 'custom' ? '#f4f0e8' : e.target.value })}><option value="#ffffff">{t.white}</option><option value="transparent">{t.transparent}</option><option value="custom">{t.custom}</option></select></label>{draft.background !== 'transparent' && <label className="draw-color-control"><input type="color" aria-label={t.background} value={draft.background} onChange={e => setDraft({ ...draft, background: e.target.value })} /><span>{draft.background}</span></label>}{modal === 'resize' && <><label className="draw-check"><input type="checkbox" checked={draft.scale} onChange={e => setDraft({ ...draft, scale: e.target.checked })} />{t.scaleLayers}</label><p className="draw-dialog-note">{t.resizeHint}</p></>}<div className="draw-dialog-actions"><button type="button" onClick={() => setModal(null)}>{t.cancel}</button><button className="draw-primary" type="submit">{modal === 'new' ? t.create : t.apply}<ArrowUpRight size={16} /></button></div></form>}
      {modal === 'replace' && <><p className="draw-dialog-note">{t.replaceHint}</p><div className="draw-replace-actions"><button type="button" className="draw-primary" onClick={() => { if (saveProject()) { const action = pendingReplacement.current; pendingReplacement.current = null; action?.(); } }}>{t.saveFirst}</button><button type="button" onClick={() => { const action = pendingReplacement.current; pendingReplacement.current = null; action?.(); }}>{t.continue}</button><button type="button" onClick={() => { pendingReplacement.current = null; setModal(null); }}>{t.cancel}</button></div></>}
      {modal === 'export' && <form onSubmit={exportImage}><label className="draw-field">{t.name}<input value={doc.name} maxLength={100} onChange={e => { doc.name = e.target.value; refresh(true); }} /></label><label className="draw-field">{t.format}<select value={format} onChange={e => setFormat(e.target.value)}><option value="png">PNG</option><option value="jpeg">JPG</option><option value="webp">WebP</option></select></label>{format !== 'png' && <label className="draw-range"><span>{t.quality}<output>{quality}%</output></span><input type="range" min="10" max="100" value={quality} onChange={e => setQuality(Number(e.target.value))} /></label>}<div className="draw-export-summary"><span>{doc.width} × {doc.height} px</span><span>{format === 'png' ? 'PNG' : format === 'jpeg' ? 'JPG' : 'WebP'}</span></div><p className="draw-dialog-note">{t.exportHint}{format === 'jpeg' && <><br />{t.jpegHint}</>}</p><div className="draw-dialog-actions"><button type="button" onClick={() => setModal(null)}>{t.cancel}</button><button type="submit" className="draw-primary" disabled={busy}><Download size={16} />{t.download}</button></div></form>}
      {modal === 'help' && <><ol className="draw-help-list">{t.helpBody.map(line => <li key={line}>{line}</li>)}</ol><p className="draw-dialog-note">{t.projectHint}</p></>}
      {modal === 'shortcuts' && <dl className="draw-shortcuts">{t.shortcutRows.map(([key, label]) => <div key={key}><dt><kbd>{key}</kbd></dt><dd>{label}</dd></div>)}</dl>}
    </Modal>}
  </div>;
}



