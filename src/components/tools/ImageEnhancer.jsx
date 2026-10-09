import { useEffect, useRef, useState } from 'react';
import { Upload, Sparkles, Download, RotateCcw, Loader2, ZoomIn, ShieldCheck } from 'lucide-react';
import { enhancerCopy } from '../../i18n/imageEnhancer.js';
import { outputSize } from '../../utils/imageEnhancer/core.js';
import { readImage, encodeWebP, enhanceImage, cancelEnhancement } from '../../utils/imageEnhancer/client.js';
import './ImageEnhancer.css';

export default function ImageEnhancer({lang='en'}) {
  const t=enhancerCopy[lang]||enhancerCopy.en;
  const [source,setSource]=useState(null),[result,setResult]=useState(null),[report,setReport]=useState(null);
  const [options,setOptions]=useState({scale:2,strength:.8,backend:'auto'}),[processedOptions,setProcessedOptions]=useState('');
  const [filename,setFilename]=useState('image'),[compare,setCompare]=useState(50),[actual,setActual]=useState(false);
  const [busy,setBusy]=useState(false),[loading,setLoading]=useState(false),[saving,setSaving]=useState(false),[progress,setProgress]=useState(null);
  const [error,setError]=useState(''),[notice,setNotice]=useState('');
  const resultCanvas=useRef(null),originalCanvas=useRef(null),job=useRef(0),readVersion=useRef(0),locked=useRef(false);
  locked.current=busy||loading||saving;
  const stale=Boolean(result&&processedOptions!==JSON.stringify(options));
  let dimensions,dimensionError;
  if(source) try {dimensions=outputSize(source.width,source.height,options.scale);} catch(failure) {dimensionError=t.errors[failure.message];}
  useEffect(()=>()=>{job.current++;readVersion.current++;cancelEnhancement();},[]);
  useEffect(()=>{
    if(!source) return;
    const pixels=result||source;
    for(const canvas of [resultCanvas.current,originalCanvas.current]) {canvas.width=pixels.width;canvas.height=pixels.height;}
    resultCanvas.current.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(pixels.data),pixels.width,pixels.height),0,0);
    const small=document.createElement('canvas');small.width=source.width;small.height=source.height;
    small.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(source.data),source.width,source.height),0,0);
    const ctx=originalCanvas.current.getContext('2d');ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(small,0,0,pixels.width,pixels.height);
  },[source,result]);
  const failureText=failure=>t.errors[failure.message]||t.errors.decode;
  const load=async file=>{
    if(!file||locked.current) return;
    const version=++readVersion.current;setLoading(true);setError('');setNotice('');
    try {
      const pixels=await readImage(file);outputSize(pixels.width,pixels.height,1);
      if(version!==readVersion.current) return;
      setSource(pixels);setResult(null);setReport(null);setCompare(50);setActual(false);setFilename(file.name.replace(/\.[^.]+$/,''));
      // Pick an available scale when a large input cannot be doubled.
      let scale=options.scale;try{outputSize(pixels.width,pixels.height,scale);}catch{scale=1;}
      setOptions({...options,scale});setNotice(t.ready);
    }catch(failure){if(version===readVersion.current)setError(failureText(failure));}
    finally{if(version===readVersion.current)setLoading(false);}
  };
  const example=async()=>{
    if(locked.current)return;
    const version=++readVersion.current;setError('');setNotice('');
    try{const response=await fetch('/assets/image-enhancer/example-low.webp');if(!response.ok)throw new Error('assets');const blob=await response.blob();if(version!==readVersion.current||locked.current)return;await load(new File([blob],'clarity-example.webp',{type:'image/webp'}));}
    catch(failure){if(version===readVersion.current)setError(failureText(failure));}
  };
  const process=async()=>{
    if(!source||locked.current||dimensionError)return;
    const version=++job.current;setBusy(true);setError('');setNotice('');setProgress(null);
    try{const data=await enhanceImage(source,options,setProgress);if(version!==job.current)return;setResult(data.result);setReport({backend:data.backend,seconds:data.seconds});setProcessedOptions(JSON.stringify(options));setCompare(50);setNotice(t.done);}
    catch(failure){if(version===job.current&&failure.name!=='AbortError')setError(failureText(failure));}
    finally{if(version===job.current){setBusy(false);setProgress(null);}}
  };
  const cancel=()=>{job.current++;cancelEnhancement();setBusy(false);setProgress(null);setNotice(t.cancelled);};
  const reset=()=>{setResult(null);setReport(null);setActual(false);setError('');setNotice(t.ready);};
  const save=async()=>{
    if(!result||locked.current||stale)return;setSaving(true);setError('');
    try{const blob=await encodeWebP(result),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`${filename}-enhanced-${options.scale}x.webp`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);setNotice(t.downloaded);}
    catch(failure){setError(failureText(failure));}finally{setSaving(false);}
  };
  const preview=result||source;
  return <div className="tool-shell enhance-shell"><div className="enhance-layout">
    <aside className="enhance-controls">
      <section className="enhance-panel"><h2><Upload size={17}/>{t.upload}</h2>
        <label className="enhance-upload" htmlFor="enhance-file" onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();load(e.dataTransfer.files?.[0]);}}>
          <input id="enhance-file" type="file" accept="image/png,image/jpeg,image/webp" disabled={busy||loading||saving} onChange={e=>{load(e.target.files?.[0]);e.target.value='';}}/>
          <Upload size={26} aria-hidden="true"/><strong>{t.drop}</strong><small>{t.formats}</small>
        </label><button className="studio-button secondary" type="button" onClick={example} disabled={busy||loading||saving}>{t.example}</button><p className="enhance-privacy"><ShieldCheck size={15} aria-hidden="true"/>{t.privacy}</p>
      </section>
      <fieldset className="enhance-panel" disabled={busy||loading||saving}><legend>{t.settings}</legend>
        <label htmlFor="enhance-scale">{t.scale}</label><select id="enhance-scale" value={options.scale} onChange={e=>setOptions({...options,scale:Number(e.target.value)})}>
          {[1,2,4].map(scale=>{let disabled=false;if(source)try{outputSize(source.width,source.height,scale);}catch{disabled=true;}return <option key={scale} value={scale} disabled={disabled}>{scale===1?t.same:scale===2?t.twice:t.four}</option>;})}
        </select>
        {source&&<p className="enhance-output">{source.width} × {source.height} → {dimensions?`${dimensions.width} × ${dimensions.height}`:'—'}</p>}
        <label htmlFor="enhance-strength">{t.strength}<output>{Math.round(options.strength*100)}%</output></label><input id="enhance-strength" type="range" min="0" max="1" step=".05" value={options.strength} onChange={e=>setOptions({...options,strength:Number(e.target.value)})}/><p>{t.strengthHint}</p>
        <label htmlFor="enhance-device">{t.device}</label><select id="enhance-device" value={options.backend} onChange={e=>setOptions({...options,backend:e.target.value})}><option value="auto">{t.auto}</option><option value="webgpu">{t.webgpu}</option><option value="wasm">{t.wasm}</option></select><p>{t.loadHint}</p>
      </fieldset>
      <section className="enhance-panel enhance-actions"><button className="studio-button" type="button" onClick={process} disabled={!source||busy||loading||saving||Boolean(dimensionError)}>{busy?<Loader2 size={17} className="animate-spin"/>:<Sparkles size={17}/>}{busy?t.busy:t.start}</button>{busy&&<button className="studio-button secondary" type="button" onClick={cancel}>{t.cancel}</button>}<button className="studio-button" type="button" onClick={save} disabled={!result||busy||loading||saving||stale}><Download size={17}/>{t.save}</button><button className="studio-button secondary" type="button" onClick={reset} disabled={!source||busy||loading||saving}><RotateCcw size={16}/>{t.reset}</button></section>
    </aside>
    <section className="enhance-panel enhance-preview" aria-label={t.compare}>
      <div className="enhance-heading"><h2>{t.compare}</h2>{preview&&<span>{preview.width} × {preview.height}</span>}</div>
      {!source?<div className="enhance-empty"><ZoomIn size={34} strokeWidth={1}/><h3>{t.empty}</h3><p>{t.emptyHint}</p><img src="/assets/image-enhancer/example-low.webp" alt="" width="192" height="128"/></div>:<>
        <div className="enhance-view" role="group" aria-label={t.compare}><button type="button" aria-pressed={!actual} onClick={()=>setActual(false)}>{t.fit}</button><button type="button" aria-pressed={actual} onClick={()=>setActual(true)}>{t.actual}</button></div>
        <div className="enhance-scroll" tabIndex={0} aria-label={t.compare}><div className="enhance-stage" style={{aspectRatio:`${preview.width}/${preview.height}`,width:actual?`${preview.width}px`:`min(100%, ${70*preview.width/preview.height}vh)`}}>
          <canvas ref={resultCanvas}/><canvas ref={originalCanvas} className="enhance-original" style={{clipPath:result?`inset(0 ${100-compare}% 0 0)`:'none'}}/>
          {result&&<><span className="enhance-divider" style={{left:`${compare}%`}}/><span className="enhance-label enhance-before">{t.before}</span><span className="enhance-label enhance-after">{t.after}</span></>}
        </div></div>
        {result&&<div className="enhance-comparison"><label htmlFor="enhance-compare">{t.slider}</label><input id="enhance-compare" type="range" min="0" max="100" value={compare} onChange={e=>setCompare(Number(e.target.value))}/><p>{t.compareHint}</p></div>}
      </>}
      {progress&&<div className="enhance-progress" role="status"><Loader2 size={16} className="animate-spin"/>{t.stages[progress.stage]}{['model','tiles'].includes(progress.stage)&&` ${progress.percent}%`}</div>}
      {report&&<div className="enhance-report"><h3>{t.report}</h3><dl><div><dt>{t.actualDevice}</dt><dd>{t[report.backend]}</dd></div><div><dt>{t.size}</dt><dd>{result.width} × {result.height}</dd></div><div><dt>{t.time}</dt><dd>{report.seconds.toFixed(1)} {t.seconds}</dd></div></dl></div>}
      <p className="enhance-scope">{t.scope}</p><p className="enhance-model">{t.model}</p>
      {stale&&<p className="enhance-notice" role="status">{t.stale}</p>}{notice&&<p className="enhance-notice" role="status">{notice}</p>}{(error||dimensionError)&&<p className="enhance-error" role="alert">{error||dimensionError}</p>}
    </section>
  </div></div>;
}
