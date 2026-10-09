import { useEffect, useRef, useState } from 'react';
import { Upload, Download, Sparkles, Brush, Square, Eraser, Undo2, RotateCcw, Loader2, ShieldCheck } from 'lucide-react';
import { aiWatermarkCopy } from '../../i18n/aiWatermark.js';
import { invisibleWatermarkCopy } from '../../i18n/invisibleWatermark.js';
import { cancelWatermarkJob, processWatermark, readWatermarkImage, watermarkWebP } from '../../utils/aiWatermark/client.js';
import { canonicalGeminiRegion } from '../../utils/aiWatermark/core.js';
import './AIWatermarkRemover.css';

export default function AIWatermarkRemover({ lang = 'en' }) {
  const t = aiWatermarkCopy[lang] || aiWatermarkCopy.en;
  const v = invisibleWatermarkCopy[lang] || invisibleWatermarkCopy.en;
  const [source, setSource] = useState(null), [result, setResult] = useState(null);
  const [filename, setFilename] = useState('image');
  const [mode, setMode] = useState('invisible'), [tool, setTool] = useState('rectangle');
  const [latentSettings, setLatentSettings] = useState({ backend: 'auto', maxEdge: 512, strength: .05, seed: 42 });
  const [report, setReport] = useState(null), [resultMode, setResultMode] = useState(null), [lastSettings, setLastSettings] = useState('');
  const stale = resultMode === 'invisible' && lastSettings !== JSON.stringify(latentSettings);
  const [brushSize, setBrushSize] = useState(24), [compare, setCompare] = useState(50);
  const [showCompare, setShowCompare] = useState(true), [loadingImage, setLoadingImage] = useState(false);
  const [maskCount, setMaskCount] = useState(0), [undoCount, setUndoCount] = useState(0);
  const [region, setRegion] = useState({ x: 0, y: 0, w: 48, h: 48 }), [rectangle, setRectangle] = useState(null);
  const [busy, setBusy] = useState(false), [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(null), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const baseRef = useRef(null), originalRef = useRef(null), maskRef = useRef(null), inputRef = useRef(null);
  const history = useRef([]), gesture = useRef(null), loadVersion = useRef(0), jobVersion = useRef(0);
  const busyRef = useRef(false); busyRef.current = busy;
  useEffect(() => () => { loadVersion.current++; jobVersion.current++; cancelWatermarkJob(); }, []);

  useEffect(() => {
    if (!source) return;
    for (const [canvas, pixels] of [[baseRef.current, result || source], [originalRef.current, source]]) {
      canvas.width = source.width; canvas.height = source.height;
      canvas.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(pixels.data), pixels.width, pixels.height), 0, 0);
    }
  }, [source, result]);
  useEffect(() => {
    if (!source || !maskRef.current) return;
    maskRef.current.width = source.width; maskRef.current.height = source.height;
    history.current = []; setMaskCount(0); setUndoCount(0);
  }, [source]);

  const errorText = failure => v.errors[failure.message] || t.errors[failure.message] || t.errors.decode;
  const readMask = () => {
    const canvas = maskRef.current;
    const rgba = canvas.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, canvas.width, canvas.height).data;
    return Uint8Array.from({ length: canvas.width * canvas.height }, (_, i) => rgba[i * 4 + 3]);
  };
  const updateMask = () => { const bytes = readMask(); setMaskCount(bytes.reduce((sum, a) => sum + (a > 64 ? 1 : 0), 0)); };
  const pushUndo = () => { history.current.push(readMask()); if (history.current.length > 5) history.current.shift(); setUndoCount(history.current.length); };
  const restoreMask = bytes => {
    const canvas = maskRef.current, ctx = canvas.getContext('2d', { willReadFrequently: true });
    const img = ctx.createImageData(canvas.width, canvas.height);
    for (let i = 0; i < bytes.length; i++) { img.data[i * 4] = 220; img.data[i * 4 + 1] = 70; img.data[i * 4 + 2] = 60; img.data[i * 4 + 3] = bytes[i]; }
    ctx.putImageData(img, 0, 0); updateMask();
  };
  const clearMask = (save = true) => {
    if (!maskRef.current) return;
    if (save) pushUndo(); else { history.current = []; setUndoCount(0); }
    const canvas = maskRef.current; canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    setMaskCount(0); setRectangle(null); gesture.current = null;
  };
  const undoMask = () => { const bytes = history.current.pop(); if (bytes) restoreMask(bytes); setUndoCount(history.current.length); };

  const load = async file => {
    if (!file || busyRef.current) return;
    const version = ++loadVersion.current;
    setError(''); setNotice(''); setLoadingImage(true);
    try {
      const pixels = await readWatermarkImage(file);
      if (version !== loadVersion.current) return;
      setSource(pixels); setResult(null); setReport(null); setResultMode(null); setCompare(50); setShowCompare(true); setFilename(file.name.replace(/\.[^.]+$/, ''));
      const r = canonicalGeminiRegion(pixels.width, pixels.height);
      setRegion({ x: Math.max(0, r.x), y: Math.max(0, r.y), w: Math.min(r.w, pixels.width), h: Math.min(r.h, pixels.height) }); setRectangle(null); setNotice(t.ready);
    } catch (failure) { if (version === loadVersion.current) setError(errorText(failure)); }
    finally { if (version === loadVersion.current) setLoadingImage(false); }
  };
  const example = async () => {
    setError('');
    try { const response = await fetch(mode === 'invisible' ? '/assets/studio/subtitle.webp' : '/assets/ai-watermark/example.webp'); if (!response.ok) throw new Error('assets'); await load(new File([await response.blob()], mode === 'invisible' ? 'reconstruction-example.webp' : 'gemini-example.webp', { type: 'image/webp' })); }
    catch (failure) { setError(errorText(failure)); }
  };

  const coordinates = event => {
    const canvas = maskRef.current, box = canvas.getBoundingClientRect();
    return { x: Math.max(0, Math.min(canvas.width - 1, (event.clientX - box.left) * canvas.width / box.width)), y: Math.max(0, Math.min(canvas.height - 1, (event.clientY - box.top) * canvas.height / box.height)) };
  };
  const stroke = (a, b) => {
    const ctx = maskRef.current.getContext('2d');
    ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
    ctx.strokeStyle = '#dc463c'; ctx.fillStyle = '#dc463c'; ctx.lineWidth = brushSize; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    ctx.beginPath(); ctx.arc(b.x, b.y, brushSize / 2, 0, Math.PI * 2); ctx.fill(); ctx.globalCompositeOperation = 'source-over';
  };
  const pointerDown = event => {
    if (mode !== 'inpaint' || busy || event.button !== 0 || gesture.current) return;
    setShowCompare(false);
    event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId);
    pushUndo(); const point = coordinates(event); gesture.current = { start: point, last: point, pointerId: event.pointerId };
    if (tool !== 'rectangle') stroke(point, point);
    else setRectangle({ x: point.x, y: point.y, w: 1, h: 1 });
  };
  const pointerMove = event => {
    if (!gesture.current || busy || event.pointerId !== gesture.current.pointerId) return;
    const point = coordinates(event), { start, last } = gesture.current;
    if (tool === 'rectangle') setRectangle({ x: Math.min(start.x, point.x), y: Math.min(start.y, point.y), w: Math.max(1, Math.abs(point.x - start.x)), h: Math.max(1, Math.abs(point.y - start.y)) });
    else stroke(last, point);
    gesture.current.last = point;
  };
  const pointerUp = event => {
    if (!gesture.current || event.pointerId !== gesture.current.pointerId) return;
    if (tool === 'rectangle') {
      const end = coordinates(event), start = gesture.current.start;
      const box = { x: Math.floor(Math.min(start.x, end.x)), y: Math.floor(Math.min(start.y, end.y)), w: Math.max(1, Math.ceil(Math.abs(end.x - start.x))), h: Math.max(1, Math.ceil(Math.abs(end.y - start.y))) };
      const ctx = maskRef.current.getContext('2d'); ctx.fillStyle = '#dc463c'; ctx.fillRect(box.x, box.y, box.w, box.h); setRegion(box);
    }
    gesture.current = null; setRectangle(null); updateMask();
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };
  const pointerCancel = event => {
    if (!gesture.current || event.pointerId !== gesture.current.pointerId) return;
    gesture.current = null; setRectangle(null); undoMask();
  };
  const applyRegion = (box = region) => {
    const values = ['x', 'y', 'w', 'h'].map(key => Number(box[key]));
    if (values.some(v => !Number.isInteger(v)) || values[0] < 0 || values[1] < 0 || values[2] <= 0 || values[3] <= 0 || values[0] + values[2] > source.width || values[1] + values[3] > source.height) { setError(t.errors.region); return; }
    setShowCompare(false); pushUndo(); const ctx = maskRef.current.getContext('2d'); ctx.fillStyle = '#dc463c'; ctx.fillRect(...values); setError(''); updateMask();
  };
  const process = async () => {
    if (!source || busy || loadingImage) return;
    const mask = mode === 'inpaint' ? readMask() : null;
    if (mode === 'inpaint' && !maskCount) { setError(t.errors.emptyMask); return; }
    const version = ++jobVersion.current;
    setError(''); setNotice(''); setBusy(true); setProgress(null);
    try {
      const current = mode === 'invisible' ? source : result || source;
      if (mode === 'metadata') { setResult(current); setNotice(t.cleaned); }
      else {
        const data = await processWatermark(mode, current, mask, setProgress, latentSettings);
        if (version !== jobVersion.current) return;
        setResult(data.result);
        setNotice(mode === 'invisible' ? v.done : mode === 'gemini' ? data.detection ? `${t.detected} · ${t.matchScore} ${Math.round(data.detection.score * 100)}%` : t.notDetected : t.repaired);
        setReport(mode === 'invisible' ? data : null); setLastSettings(JSON.stringify(latentSettings));
        clearMask(false);
      }
      setResultMode(mode); setCompare(50); setShowCompare(true);
    } catch (failure) { if (version === jobVersion.current && failure.name !== 'AbortError') setError(errorText(failure)); }
    finally { if (version === jobVersion.current) { setBusy(false); setProgress(null); } }
  };
  const cancel = () => { jobVersion.current++; cancelWatermarkJob(); setBusy(false); setProgress(null); setNotice(t.cancelled); };
  const reset = () => { setResult(null); setReport(null); setResultMode(null); clearMask(false); setNotice(t.ready); setError(''); };
  const download = async () => {
    if (!result || busy || exporting || stale) return;
    setExporting(true); setError('');
    try {
      const blob = await watermarkWebP(result);
      const url = URL.createObjectURL(blob), link = document.createElement('a');
      link.href = url; link.download = `${filename}-clean.webp`; document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000); setNotice(t.downloaded);
    } catch (failure) { setError(errorText(failure)); } finally { setExporting(false); }
  };

  return <div className="tool-shell aiwm-shell">
    <div className="aiwm-layout">
      <aside className="aiwm-controls">
        <section className="tool-card">
          <h2 className="aiwm-section-title"><Upload size={17} />{t.upload}</h2>
          <input ref={inputRef} id="aiwm-upload" className="sr-only" type="file" accept="image/png,image/jpeg,image/webp" disabled={busy} onChange={event => { load(event.target.files?.[0]); event.target.value = ''; }} />
          <label htmlFor="aiwm-upload" className="aiwm-drop" onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); load(event.dataTransfer.files?.[0]); }}><Upload size={26} /><span>{t.drop}</span><small>{t.types}</small></label>
          <button type="button" className="aiwm-link" disabled={busy} onClick={example}>{mode === 'invisible' ? v.example : t.example}</button>
          <p className="aiwm-muted aiwm-local"><ShieldCheck size={14} />{t.local}</p>
        </section>
        <section className="tool-card">
          <fieldset disabled={busy}><legend className="aiwm-section-title">{t.mode}</legend><div className="aiwm-modes">{['invisible', 'gemini', 'inpaint', 'metadata'].map(value => <label className={mode === value ? 'active' : ''} key={value}><input type="radio" name="aiwm-mode" checked={mode === value} onChange={() => { setMode(value); setShowCompare(value !== 'inpaint'); setError(''); }} />{value === 'invisible' ? v.title : t[value]}</label>)}</div></fieldset>
          <p className="aiwm-muted">{mode === 'invisible' ? v.hint : t[`${mode}Hint`]}</p>
          {mode === 'invisible' && <fieldset disabled={busy} className="aiwm-latent-settings">
            <legend className="aiwm-section-title">{v.controls}</legend>
            <label>{v.backend}<select value={latentSettings.backend} onChange={event => setLatentSettings({ ...latentSettings, backend: event.target.value })}>{['auto', 'webgpu', 'wasm'].map(key => <option key={key} value={key}>{v[key]}</option>)}</select></label>
            <label>{v.resolution}<select value={latentSettings.maxEdge} onChange={event => setLatentSettings({ ...latentSettings, maxEdge: Number(event.target.value) })}>{[256, 512, 768, 1024].map(size => <option key={size} value={size}>{size}px</option>)}</select></label>
            <p className="aiwm-muted">{v.resolutionHint}</p>
            <label className="aiwm-slider-label">{v.strength} · {latentSettings.strength.toFixed(3)}<input aria-label={v.strength} type="range" min="0" max="0.25" step="0.005" value={latentSettings.strength} onChange={event => setLatentSettings({ ...latentSettings, strength: Number(event.target.value) })} /></label>
            <div className="aiwm-row">{[['low', .01], ['standard', .05], ['strong', .15]].map(([key, strength]) => <button key={key} type="button" className="aiwm-secondary" aria-pressed={latentSettings.strength === strength} onClick={() => setLatentSettings({ ...latentSettings, strength })}>{v[key]}</button>)}</div>
            <label>{v.seed}<input type="number" min="1" max="2147483647" value={latentSettings.seed} onChange={event => setLatentSettings({ ...latentSettings, seed: Number(event.target.value) })} /></label>
            <p className="aiwm-muted">{v.strengthHint}</p>
          </fieldset>}
          {source && mode === 'inpaint' && <fieldset disabled={busy} className="aiwm-mask-settings">
            <legend className="aiwm-section-title">{t.tools}</legend>
            <div className="aiwm-tool-buttons">{[['rectangle', Square], ['brush', Brush], ['eraser', Eraser]].map(([value, Icon]) => <button key={value} type="button" aria-pressed={tool === value} className={tool === value ? 'active' : ''} onClick={() => setTool(value)}><Icon size={16} />{t[value]}</button>)}</div>
            <label className="aiwm-slider-label">{t.brushSize} · {brushSize}px<input aria-label={t.brushSize} type="range" min="4" max="160" value={brushSize} onChange={event => setBrushSize(Number(event.target.value))} /></label>
            <button type="button" className="aiwm-secondary" onClick={() => { const r = canonicalGeminiRegion(source.width, source.height); const box = { x: Math.max(0, r.x), y: Math.max(0, r.y), w: Math.min(r.w, source.width), h: Math.min(r.h, source.height) }; setRegion(box); setShowCompare(false); applyRegion(box); }}>{t.preset}</button>
            <details><summary>{t.region}</summary><div className="aiwm-coordinate-grid">{['x', 'y', 'w', 'h'].map(key => <label key={key}>{key.toUpperCase()}<input aria-label={`${t.region} ${key.toUpperCase()}`} type="number" min={key === 'x' || key === 'y' ? 0 : 1} value={region[key]} onChange={event => setRegion({ ...region, [key]: event.target.value })} /></label>)}</div><button type="button" className="aiwm-secondary" onClick={() => applyRegion()}>{t.applyRegion}</button></details>
            <div className="aiwm-row"><button type="button" className="aiwm-secondary" disabled={!undoCount} onClick={undoMask}><Undo2 size={15} />{t.undo}</button><button type="button" className="aiwm-secondary" disabled={!maskCount} onClick={() => clearMask()}>{t.clear}</button></div>
            <p className="aiwm-muted">{t.marked}: {maskCount.toLocaleString()} px</p>
          </fieldset>}
          <p className="aiwm-scope">{mode === 'invisible' ? v.status : t.scope}</p>
        </section>
        <section className="tool-card aiwm-actions">
          <button type="button" className="studio-button" disabled={!source || busy || loadingImage} onClick={process}>{busy ? <Loader2 size={17} className="animate-spin" /> : <Sparkles size={17} />}{busy ? t.busy : t.process}</button>
          {busy && <button type="button" className="aiwm-secondary" onClick={cancel}>{t.cancel}</button>}
          <button type="button" className="studio-button" disabled={!result || busy || exporting || stale} onClick={download}><Download size={17} />{exporting ? t.exporting : t.download}</button>
          <button type="button" className="aiwm-secondary" disabled={!source || busy} onClick={reset}><RotateCcw size={15} />{t.reset}</button>
        </section>
      </aside>
      <section className="tool-card aiwm-preview" aria-label={t.preview} aria-busy={busy}>
        <div className="aiwm-preview-heading"><h2>{t.preview}</h2>{source && <span>{source.width} × {source.height}</span>}</div>
        {source ? <>
          <div className="aiwm-stage" style={{ aspectRatio: `${source.width}/${source.height}` }}>
            <canvas ref={baseRef} className="aiwm-base" />
            <canvas ref={originalRef} className="aiwm-original" style={{ clipPath: `inset(0 ${100 - compare}% 0 0)`, visibility: result && showCompare ? 'visible' : 'hidden' }} />
            <canvas ref={maskRef} className="aiwm-mask" style={{ pointerEvents: mode === 'inpaint' && !busy ? 'auto' : 'none', visibility: mode === 'inpaint' ? 'visible' : 'hidden' }} aria-label={t.tools} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerCancel} />
            {rectangle && <div className="aiwm-rectangle" style={{ left: `${rectangle.x / source.width * 100}%`, top: `${rectangle.y / source.height * 100}%`, width: `${rectangle.w / source.width * 100}%`, height: `${rectangle.h / source.height * 100}%` }} />}
            {result && showCompare && <><div className="aiwm-divider" style={{ left: `${compare}%` }} /><span className="aiwm-label aiwm-before">{t.before}</span><span className="aiwm-label aiwm-after">{t.after}</span></>}
          </div>
          {result && <label className="aiwm-slider-label aiwm-compare">{t.compare}<input aria-label={t.compare} type="range" min="0" max="100" value={compare} onChange={event => { setCompare(Number(event.target.value)); setShowCompare(true); }} /><small>{t.compareHint}</small></label>}
          {mode === 'inpaint' && <p className="aiwm-muted">{t.maskHint}</p>}
        </> : <div className="aiwm-empty"><Sparkles size={38} strokeWidth={1.2} /><h3>{t.empty}</h3><p>{t.emptyHint}</p></div>}
        {progress && <div className="aiwm-progress" role="status"><Loader2 size={17} className="animate-spin" /><span>{v.stages[progress.stage] || t.stages[progress.stage]}{['model', 'vaeModel'].includes(progress.stage) && ` ${progress.percent}%`}</span></div>}
        {mode === 'invisible' && <p className="aiwm-unverified">{v.status}</p>}
        {report && <section className="aiwm-report"><h3>{v.report}</h3><dl><div><dt>{v.device}</dt><dd>{report.backend === 'webgpu-software' ? v.software : v[report.backend]}</dd></div><div><dt>{v.resolution}</dt><dd>{report.dimensions.width} × {report.dimensions.height}</dd></div><div><dt>{v.quality}</dt><dd>{report.psnr === null ? '∞' : report.psnr.toFixed(2)} dB</dd></div><div><dt>{v.duration}</dt><dd>{report.seconds.toFixed(1)} {v.seconds}</dd></div></dl><p>{v.qualityHint}</p></section>}
        {stale && <p className="aiwm-error" role="status">{v.stale}</p>}
        {notice && <p className="aiwm-notice" role="status">{notice}</p>}
        {error && <p className="aiwm-error" role="alert">{error}</p>}
      </section>
    </div>
  </div>;
}
