import { useEffect, useRef, useState } from 'react';
import { Upload, Download, Minimize2, FileImage, X, Trash2, ArrowRight, Check, Loader2 } from 'lucide-react';
import JSZip from 'jszip';
import { compressImage, inspectImage, compressionSettings, downloadName, uniqueNames, COMPRESSION_LIMITS } from '../../utils/imageCompression.js';
import { getCompressionCopy } from '../../i18n/compression.js';
import './ImageCompress.css';

const size = bytes => bytes < 1024 ? `${bytes} B` : bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1024 / 1024).toFixed(2)} MB`;
function download(blob, filename) { const url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = filename; a.click(); setTimeout(() => URL.revokeObjectURL(url), 5000); }
function Compare({ item, t, close }) {
  const ref = useRef(null);
  useEffect(() => { const previous = document.activeElement; ref.current.showModal(); return () => { ref.current?.close(); previous?.focus(); }; }, []);
  return <dialog ref={ref} className="compress-dialog" aria-labelledby="compress-compare-title" onCancel={e => { e.preventDefault(); close(); }}><header><h2 id="compress-compare-title">{item.file.name}</h2><button type="button" onClick={close} aria-label={t.close}><X size={20} /></button></header><div className="compress-compare-grid">{[[t.original, item.originalURL, item.file.size, item.width, item.height], [t.result, item.resultURL, item.result.blob.size, item.result.width, item.result.height]].map(([label, url, bytes, width, height]) => <figure key={label}><div className="compress-checker"><img src={url} alt={label} /></div><figcaption><strong>{label}</strong><span>{size(bytes)} · {width} × {height}</span></figcaption></figure>)}</div></dialog>;
}

export default function ImageCompress({ lang = 'en' }) {
  const t = getCompressionCopy(lang), input = useRef(null), entries = useRef([]), mounted = useRef(true), controller = useRef(null), busyRef = useRef(false);
  const [images, setImages] = useState([]), [busy, setBusy] = useState(null), [dragging, setDragging] = useState(false), [progress, setProgress] = useState({ done: 0, total: 0 }), [errors, setErrors] = useState([]), [notice, setNotice] = useState(null), [compare, setCompare] = useState(null);
  const [settings, setSettings] = useState({ format: 'auto', mode: 'quality', quality: .8, maxEdge: '0', targetKB: '300', allowResize: true });
  const [hydrated, setHydrated] = useState(false);
  let normalized, settingError;
  try { normalized = compressionSettings(settings); } catch (error) { settingError = error; }
  const key = normalized && JSON.stringify(normalized), ready = images.filter(item => item.result && item.resultKey === key), totalBefore = ready.reduce((sum, item) => sum + item.file.size, 0), totalAfter = ready.reduce((sum, item) => sum + item.result.blob.size, 0);
  const errorText = error => t.errors[error.message] || t.errors.generic;
  function update(fn) { entries.current = fn(entries.current); if (mounted.current) setImages([...entries.current]); }
  function patch(id, values) { update(items => items.map(item => item.id === id ? { ...item, ...values } : item)); }
  function release(item) { URL.revokeObjectURL(item.originalURL); if (item.resultURL) URL.revokeObjectURL(item.resultURL); }
  useEffect(() => { mounted.current = true; setHydrated(true); return () => { mounted.current = false; controller.current?.abort(); entries.current.forEach(release); }; }, []);
  function begin(kind) { busyRef.current = true; setBusy(kind); setNotice(null); setErrors([]); const abort = new AbortController(); controller.current = abort; return abort; }
  function finish() { busyRef.current = false; controller.current = null; if (mounted.current) setBusy(null); }
  async function upload(files) {
    if (!files.length || busyRef.current) return;
    const job = begin('upload'), issues = [];
    try {
      for (const file of files) {
        if (job.signal.aborted) break;
        if (entries.current.length >= COMPRESSION_LIMITS.files || entries.current.reduce((sum, item) => sum + item.file.size, 0) + file.size > COMPRESSION_LIMITS.batchBytes) { issues.push({ name: file.name, message: t.errors.capacity }); continue; }
        try {
          const info = await inspectImage(file, job.signal); if (job.signal.aborted) break;
          const item = { id: crypto.randomUUID(), file, ...info, originalURL: URL.createObjectURL(file), result: null, resultURL: null, resultKey: null, status: 'pending' };
          update(items => [...items, item]);
        } catch (error) { if (error.name === 'AbortError') break; issues.push({ name: file.name, message: errorText(error) }); }
      }
      if (mounted.current) { setErrors(issues); if (job.signal.aborted) setNotice(t.cancelled); }
    } finally { finish(); }
  }
  async function compress() {
    if (busyRef.current || !normalized || !images.length) return;
    const job = begin('compress'), work = [...entries.current], jobSettings = normalized, jobKey = key;
    setProgress({ done: 0, total: work.length });
    try {
      for (let i = 0; i < work.length; i++) {
        if (job.signal.aborted) break;
        const item = work[i]; patch(item.id, { status: 'processing', error: null });
        try {
          const result = await compressImage(item.file, jobSettings, job.signal);
          if (job.signal.aborted || !mounted.current) break;
          const url = URL.createObjectURL(result.blob); if (item.resultURL) URL.revokeObjectURL(item.resultURL);
          patch(item.id, { result, resultURL: url, resultKey: jobKey, status: 'ready' });
        } catch (error) { if (error.name === 'AbortError') break; patch(item.id, { status: 'failed', error: errorText(error), resultKey: null }); }
        if (mounted.current) setProgress({ done: i + 1, total: work.length });
      }
      update(items => items.map(item => item.status === 'processing' ? { ...item, status: item.result ? 'ready' : 'pending' } : item));
      if (mounted.current) setNotice(job.signal.aborted ? t.cancelled : t.completed);
    } finally { finish(); }
  }
  function remove(id) { if (busyRef.current) return; const item = entries.current.find(entry => entry.id === id); if (item) release(item); update(items => items.filter(item => item.id !== id)); if (compare === id) setCompare(null); }
  function clear() { if (busyRef.current) return; entries.current.forEach(release); update(() => []); setCompare(null); setNotice(null); setErrors([]); }
  async function zipAll() {
    if (busyRef.current || !ready.length) return;
    begin('zip');
    try {
      if (totalAfter > COMPRESSION_LIMITS.zipBytes) throw new Error('zip');
      const zip = new JSZip(), names = uniqueNames(ready.map(item => downloadName(item.file.name, item.result.format)));
      for (let i = 0; i < ready.length; i++) zip.file(names[i], await ready[i].result.blob.arrayBuffer());
      const blob = await zip.generateAsync({ type: 'blob', compression: 'STORE' });
      if (mounted.current) download(blob, 'compressed-images.zip');
    } catch (error) { if (mounted.current) setErrors([{ name: '', message: error.message === 'zip' ? t.errors.zip : t.zipError }]); }
    finally { finish(); }
  }
  const saving = (before, after) => `${Math.abs((1 - after / before) * 100).toFixed(1)}%`;
  const selectedCompare = images.find(item => item.id === compare && item.result);
  return <div className="image-compress tool-shell" aria-busy={!!busy}>
    <div className="compress-intro"><Minimize2 size={21} /><p>{t.intro}</p><small>{t.local}</small></div>
    <input ref={input} id="images-upload" type="file" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" multiple hidden disabled={!hydrated || !!busy} onChange={e => { const files = [...e.target.files]; e.target.value = ''; upload(files); }} />
    <button type="button" className={`compress-drop ${dragging ? 'dragging' : ''}`} disabled={!hydrated || !!busy} onClick={() => input.current.click()} onDragOver={e => { e.preventDefault(); if (!busyRef.current) setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={e => { e.preventDefault(); setDragging(false); upload([...e.dataTransfer.files]); }}><Upload size={30} /><strong>{t.upload}</strong><span>{t.uploadHint}</span></button>
    {errors.length > 0 && <div className="compress-alert" role="alert"><strong>{t.errorTitle}</strong><ul>{errors.map((error, i) => <li key={i}>{error.name && <span>{error.name}: </span>}{error.message}</li>)}</ul><button type="button" aria-label={t.close} onClick={() => setErrors([])}><X size={18} /></button></div>}
    {notice && <p className="compress-notice" role="status">{notice}</p>}
    {images.length > 0 ? <div className="compress-layout">
      <section className="tool-card compress-settings"><h2>{t.settings}</h2><fieldset disabled={!!busy}>
        <label>{t.format}<select aria-label={t.format} value={settings.format} onChange={e => setSettings({ ...settings, format: e.target.value })}><option value="auto">{t.auto}</option><option value="jpg">JPG</option><option value="webp">WebP</option><option value="png">PNG</option></select></label>
        <p className="compress-hint">{settings.format === 'jpg' ? t.jpegHint : settings.format === 'png' ? t.pngHint : settings.format === 'auto' ? t.autoHint : t.qualityHint}</p>
        <label>{t.mode}<select aria-label={t.mode} value={settings.mode} onChange={e => setSettings({ ...settings, mode: e.target.value })}><option value="quality">{t.qualityMode}</option><option value="target">{t.targetMode}</option></select></label>
        {settings.mode === 'quality' ? <label className="compress-range"><span>{t.quality}<output>{Math.round(settings.quality * 100)}%</output></span><input type="range" aria-label={t.quality} min=".1" max="1" step=".01" value={settings.quality} disabled={settings.format === 'png'} onChange={e => setSettings({ ...settings, quality: Number(e.target.value) })} /><small>{t.qualityHint}</small></label> : <><label>{t.target}<input type="number" aria-label={t.target} min="1" max="10240" step="1" value={settings.targetKB} onChange={e => setSettings({ ...settings, targetKB: e.target.value })} /></label><small className="compress-hint">{t.targetHint}</small><label className="compress-checkbox"><input type="checkbox" checked={settings.allowResize} onChange={e => setSettings({ ...settings, allowResize: e.target.checked })} />{t.allowResize}</label></>}
        <label>{t.maxEdge}<input type="number" aria-label={t.maxEdge} min="0" max="8192" step="1" value={settings.maxEdge} onChange={e => setSettings({ ...settings, maxEdge: e.target.value })} /></label><p className="compress-hint">{t.maxEdgeHint}</p>
        <div className="compress-presets">{[0, 2560, 1920, 1280].map(edge => <button type="button" key={edge} aria-pressed={Number(settings.maxEdge) === edge} onClick={() => setSettings({ ...settings, maxEdge: String(edge) })}>{edge === 0 ? t.original : `${edge}px`}</button>)}</div>
      </fieldset>{settingError && <p className="compress-inline-error" role="alert">{errorText(settingError)}</p>}
        <button className="compress-primary" type="button" disabled={!!busy || !!settingError} onClick={compress}><Minimize2 size={17} />{images.some(item => item.result) ? t.again : t.start}</button>
        {busy && busy !== 'zip' && <button className="compress-cancel" type="button" onClick={() => controller.current?.abort()}>{t.cancel}</button>}
        {busy === 'compress' && <div className="compress-progress" role="status"><span>{t.processing} {progress.done} / {progress.total}</span><progress aria-label={t.progress} value={progress.done} max={progress.total} /></div>}
        {busy === 'upload' && <p role="status">{t.loading}</p>}
      </section>
      <section className="tool-card compress-results"><header><h2>{t.list} <span>{images.length}</span></h2><div><button type="button" disabled={!!busy} onClick={() => input.current.click()}><Upload size={15} />{t.add}</button><button type="button" disabled={!!busy} aria-label={t.clear} onClick={clear}><Trash2 size={17} /></button></div></header>
        {ready.length > 0 && <div className="compress-summary"><span>{t.total} · {ready.length}<strong>{size(totalBefore)} <ArrowRight size={13} /> {size(totalAfter)}</strong><small>{totalAfter <= totalBefore ? t.saved : t.increased} {saving(totalBefore, totalAfter)}</small></span><button type="button" disabled={!!busy} onClick={zipAll}><Download size={17} />{busy === 'zip' ? t.downloading : t.downloadAll}</button></div>}
        <div className="compress-list">{images.map(item => {
          const fresh = item.result && item.resultKey === key, stale = item.result && !fresh, result = item.result;
          return <article className="compress-item" key={item.id} data-id={item.id} data-status={item.status}>
            <div className="compress-item-top"><img className="compress-thumbnail compress-checker" src={item.originalURL} alt={item.file.name} loading="lazy" /><div className="compress-item-info"><h3 title={item.file.name}>{item.file.name}</h3><p>{size(item.file.size)} · {item.width} × {item.height} · {item.format.toUpperCase()}</p><span className="compress-status">{item.status === 'processing' ? <><Loader2 size={13} className="compress-spinner" />{t.processing}</> : item.status === 'failed' ? t.failed : stale ? t.stale : fresh ? <><Check size={13} />{result.keptOriginal ? t.unchanged : t.ready}</> : t.pending}</span></div><button type="button" disabled={!!busy} aria-label={`${t.remove} ${item.file.name}`} onClick={() => remove(item.id)}><X size={17} /></button></div>
            {item.error && <p className="compress-inline-error" role="alert">{item.error}</p>}
            {fresh && <div className="compress-output"><div><strong>{size(result.blob.size)}</strong><span>{result.width} × {result.height} · {result.format.toUpperCase()}</span><small className={result.blob.size > item.file.size ? 'grew' : ''}>{result.blob.size <= item.file.size ? t.saved : t.increased} {saving(item.file.size, result.blob.size)}</small></div><div><button type="button" disabled={!!busy} onClick={() => setCompare(item.id)}>{t.compare}</button><button type="button" disabled={!!busy} aria-label={`${t.download} ${item.file.name}`} onClick={() => download(result.blob, downloadName(item.file.name, result.format))}><Download size={17} /></button></div></div>}
            {fresh && !result.targetReached && <p className="compress-target-miss" role="status">{t.targetMiss}</p>}
          </article>;
        })}</div>
      </section>
    </div> : <p className="compress-empty"><FileImage size={28} />{busy === 'upload' ? t.loading : t.empty}{busy === 'upload' && <button type="button" onClick={() => controller.current?.abort()}>{t.cancel}</button>}</p>}
    {selectedCompare && <Compare item={selectedCompare} t={t} close={() => setCompare(null)} />}
  </div>;
}
