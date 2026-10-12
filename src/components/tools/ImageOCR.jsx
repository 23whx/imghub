import { useCallback, useEffect, useRef, useState } from 'react';
import { Upload, ScanText, Copy, Check, RotateCw, Download, X, Languages, Loader2, Scan, ZoomIn } from 'lucide-react';
import { syncLanguageFromLocale } from '../../stores/globalStore';
import { OCRClient, readOCRImage } from '../../utils/ocr/client.js';
import { textFromLines } from '../../utils/ocr/core.js';
import { ocrCopy } from '../../i18n/ocr.js';
import './ImageOCR.css';

export default function ImageOCR({lang='zh'}) {
  const t=ocrCopy[lang]||ocrCopy.zh;
  const [image,setImage]=useState(null), [name,setName]=useState('image'), [mode,setMode]=useState('full'), [selection,setSelection]=useState(null);
  const [backend,setBackend]=useState('auto'), [smallText,setSmallText]=useState(true), [boxes,setBoxes]=useState(true), [actualSize,setActualSize]=useState(false);
  const [running,setRunning]=useState(false), [progress,setProgress]=useState(null), [notice,setNotice]=useState(''), [error,setError]=useState('');
  const [report,setReport]=useState(null), [text,setText]=useState(''), [tab,setTab]=useState('text'), [active,setActive]=useState(-1), [copied,setCopied]=useState(false);
  const canvasRef=useRef(null), scrollRef=useRef(null), inputRef=useRef(null), clientRef=useRef(null), version=useRef(0), drag=useRef(null), mounted=useRef(true), copyTimer=useRef(null), busy=useRef(false);
  useEffect(()=>{syncLanguageFromLocale(lang);},[lang]);
  useEffect(()=> { mounted.current=true; clientRef.current=new OCRClient(); return ()=>{mounted.current=false;version.current++;clientRef.current?.cancel();clearTimeout(copyTimer.current);}; },[]);
  const resetResult=()=> {setReport(null);setText('');setActive(-1);setCopied(false);setNotice('');setError('');};
  const load=useCallback(async file=> {
    if (!file || busy.current) return;
    const id=++version.current; setError('');setNotice('');
    try {
      const canvas=await readOCRImage(file);
      if (!mounted.current || id!==version.current || busy.current) return;
      setImage(canvas);setName(file.name.replace(/\.[^.]+$/,''));setSelection(null);setReport(null);setText('');setActive(-1);setCopied(false);
    } catch(e) {if(mounted.current&&id===version.current)setError(t.errors[e.message]||t.errors.file);}
  },[t]);
  useEffect(()=> { const paste=e=> {if(busy.current)return;const item=[...(e.clipboardData?.items||[])].find(i=>i.type.startsWith('image/'));if(item){e.preventDefault();load(item.getAsFile());}};window.addEventListener('paste',paste);return()=>window.removeEventListener('paste',paste);},[load]);
  useEffect(()=> {const c=canvasRef.current;if(c&&image){c.width=image.width;c.height=image.height;c.getContext('2d').drawImage(image,0,0);}},[image]);
  const sample=async()=> {const id=++version.current;try{const r=await fetch('/assets/ocr/example.webp');if(!r.ok)throw Error('assets');const blob=await r.blob();if(id===version.current&&mounted.current&&!busy.current)await load(new File([blob],'ocr-example.webp',{type:'image/webp'}));}catch{if(id===version.current&&mounted.current)setError(t.errors.assets);}};
  const point=e=> {const r=canvasRef.current.getBoundingClientRect();return{x:Math.max(0,Math.min(image.width,(e.clientX-r.left)/r.width*image.width)),y:Math.max(0,Math.min(image.height,(e.clientY-r.top)/r.height*image.height))};};
  const pointerDown=e=> {if(mode!=='region'||running)return;e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);drag.current=point(e);setSelection(null);resetResult();};
  const pointerMove=e=> {if(!drag.current)return;const p=point(e),a=drag.current;setSelection({x:Math.round(Math.min(p.x,a.x)),y:Math.round(Math.min(p.y,a.y)),width:Math.round(Math.abs(p.x-a.x)),height:Math.round(Math.abs(p.y-a.y))});};
  const rotate=()=> {if(!image||running)return;version.current++;const c=document.createElement('canvas');c.width=image.height;c.height=image.width;const ctx=c.getContext('2d');ctx.translate(c.width,0);ctx.rotate(Math.PI/2);ctx.drawImage(image,0,0);setImage(c);setSelection(null);resetResult();};
  const clear=()=> {version.current++;setImage(null);setSelection(null);resetResult();};
  const run=async()=> {
    if(!image||busy.current)return;
    if(mode==='region'&&(!selection||selection.width<8||selection.height<8)){setError(t.selection);return;}
    version.current++; const id=version.current; busy.current=true;setRunning(true);resetResult();setProgress({stage:'initialize'});
    const crop=mode==='region'?selection:{x:0,y:0,width:image.width,height:image.height};
    const canvas=document.createElement('canvas');canvas.width=crop.width;canvas.height=crop.height;canvas.getContext('2d').drawImage(image,crop.x,crop.y,crop.width,crop.height,0,0,crop.width,crop.height);
    try {
      const result=await clientRef.current.recognize(canvas,{backend,smallText},p=>{if(mounted.current&&id===version.current)setProgress(p);});
      if(!mounted.current||id!==version.current)return;
      result.items=result.items.map(item=>({...item,poly:item.poly.map(([x,y])=>[x+crop.x,y+crop.y])}));
      setReport({...result,crop});setText(textFromLines(result.items));setTab('text');
      if(!result.items.length)setNotice(t.none);
    }catch(e){if(mounted.current&&id===version.current){if(e.name==='AbortError')setNotice(t.cancelled);else setError(t.errors[e.message]||t.errors.processing);}}
    finally{busy.current=false;if(mounted.current&&id===version.current){setRunning(false);setProgress(null);}}
  };
  const cancel=()=>clientRef.current?.cancel();
  const copy=async()=> {try{await navigator.clipboard.writeText(text);setCopied(true);clearTimeout(copyTimer.current);copyTimer.current=setTimeout(()=>{if(mounted.current)setCopied(false);},1800);}catch{setError(t.copyError);}};
  const download=type=> {
    const content=type==='txt'?'\uFEFF'+text:JSON.stringify({text,image:{width:image.width,height:image.height},crop:report.crop,lines:report.items,runtime:report.runtime,seconds:report.seconds},null,2);
    const url=URL.createObjectURL(new Blob([content],{type:type==='txt'?'text/plain;charset=utf-8':'application/json;charset=utf-8'}));
    const link=document.createElement('a');link.href=url;link.download=(name.replace(/[<>:"/\\|?*]/g,'-')||'image')+'-ocr.'+type;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  const stage=progress?.stage==='model'?`${t.model} · ${progress.percent}%`:progress?.stage==='recognize'?`${t.recognize} ${progress.current} / ${progress.total}`:progress?.stage==='fallback'?t.fallback:t.initialize;
  const device=report && (report.runtime.detProvider==='webgpu'&&report.runtime.recProvider==='webgpu'?'WebGPU':report.runtime.detProvider==='wasm'&&report.runtime.recProvider==='wasm'?'CPU':'WebGPU + CPU');
  const polygonColor=i=>i===active?'#c57025':report.items[i].score<.85?'#bd5446':'#347c67';
  return <div className="tool-shell ocr-workspace">
    <div className="ocr-banner"><Languages size={19}/><div><strong>{t.auto}</strong><p>{t.languages}</p></div></div>
    <div className="ocr-layout">
      <section className="ocr-panel ocr-source" aria-label={t.upload} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();load(e.dataTransfer.files?.[0]);}}>
        <div className="ocr-toolbar"><button className="studio-button secondary" disabled={running} onClick={()=>inputRef.current.click()}><Upload size={16}/>{t.upload}</button><button className="studio-button secondary" disabled={running} onClick={sample}>{t.example}</button></div>
        <input ref={inputRef} className="ocr-file" type="file" accept="image/png,image/jpeg,image/webp" aria-label={t.upload} tabIndex={-1} disabled={running} onChange={e=>{load(e.target.files?.[0]);e.target.value='';}}/>
        {!image?<button className="ocr-empty" onClick={()=>inputRef.current.click()}><ScanText size={42}/><strong>{t.upload}</strong><span>{t.hint}</span></button>:<>
          <div ref={scrollRef} className="ocr-image-scroll" tabIndex={0} aria-label={t.scope}><div className={`ocr-image-stage ${mode==='region'?'selecting':''}`} style={{aspectRatio:`${image.width}/${image.height}`,width:actualSize?`${image.width}px`:'100%',maxWidth:actualSize?'none':'100%'}}>
            <canvas ref={canvasRef} aria-label={t.upload} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={()=>{drag.current=null;}} onPointerCancel={()=>{drag.current=null;}}/>
            <svg viewBox={`0 0 ${image.width} ${image.height}`} aria-hidden="true" className="ocr-overlay">{boxes&&report?.items.map((item,i)=><g key={i}><polygon points={item.poly.map(p=>p.join(',')).join(' ')} fill={i===active?'#c5702530':'transparent'} stroke={polygonColor(i)} strokeWidth={Math.max(2,image.width/500)}/><text x={item.poly[0][0]} y={Math.max(18,item.poly[0][1]-5)} fill={polygonColor(i)} fontSize={Math.max(18,image.width/45)}>{i+1}</text></g>)}{mode==='region'&&selection&&<rect x={selection.x} y={selection.y} width={selection.width} height={selection.height} fill="#76532325" stroke="#c57025" strokeWidth={Math.max(2,image.width/400)}/>}</svg>
          </div></div>
          <div className="ocr-image-info">
            <span className="ocr-image-dimensions">{image.width} × {image.height}</span>
            <div className="ocr-zoom" role="group" aria-label={t.previewSize}>
              <button type="button" aria-pressed={!actualSize} onClick={()=>setActualSize(false)} title={t.fitHint}><Scan size={15} aria-hidden="true"/>{t.fitWidth}</button>
              <button type="button" aria-pressed={actualSize} onClick={()=>setActualSize(true)} title={t.actualHint}><ZoomIn size={15} aria-hidden="true"/>{t.actualPixels}</button>
            </div>
            <div className="ocr-image-actions">
              <button type="button" disabled={running} title={t.rotate} aria-label={t.rotate} onClick={rotate}><RotateCw size={18}/></button>
              <button type="button" disabled={running} title={t.clear} aria-label={t.clear} onClick={clear}><X size={18}/></button>
              <label><input type="checkbox" checked={boxes} onChange={e=>setBoxes(e.target.checked)}/>{t.boxes}</label>
            </div>
          </div>
        </>}
        <div className="ocr-settings">
          <fieldset><legend>{t.scope}</legend><div className="ocr-segments">{['full','region'].map(m=><button key={m} aria-pressed={mode===m} disabled={running} onClick={()=>{setMode(m);setSelection(null);resetResult();}}>{t[m]}</button>)}</div></fieldset>
          <div className="ocr-device"><label htmlFor="ocr-device">{t.device}</label><select id="ocr-device" value={backend} disabled={running} onChange={e=>setBackend(e.target.value)}><option value="auto">{t.autoDevice}</option><option value="webgpu">{t.gpu}</option><option value="wasm">{t.cpu}</option></select></div>
          <div className="ocr-small"><label><input type="checkbox" checked={smallText} disabled={running} onChange={e=>setSmallText(e.target.checked)}/>{t.small}</label><p>{t.smallHint}</p></div>
        </div>
        {mode==='region'&&<p className="ocr-hint">{t.regionHint} {selection&&`${selection.width} × ${selection.height}`} {selection&&<button disabled={running} onClick={()=>{setSelection(null);resetResult();}}>{t.clearRegion}</button>}</p>}
        <div className="ocr-run"><button className="studio-button" disabled={running||!image} onClick={run}><ScanText size={18}/>{t.run}</button>{running&&<button className="studio-button secondary" onClick={cancel}>{t.cancel}</button>}</div>
        {running&&<p className="ocr-progress" role="status"><Loader2 size={17} className="animate-spin"/>{stage}</p>}
        {error&&<p className="ocr-error" role="alert">{error}</p>}{notice&&<p className="ocr-hint" role="status">{notice}</p>}
        <p className="ocr-privacy">{t.privacy}</p><p className="ocr-hint">{t.tip}</p>
      </section>
      <section className="ocr-panel ocr-result" aria-label={t.result}>
        <div className="ocr-result-heading"><h2>{t.result}</h2>{report&&<span>{report.items.length} {t.report} · {device} · {report.seconds.toFixed(1)} {t.seconds}</span>}</div>
        <div className="ocr-segments ocr-tabs">{['text','lines'].map(key=><button key={key} aria-pressed={tab===key} onClick={()=>setTab(key)}>{t[key]}</button>)}</div>
        {tab==='text'?<><label className="sr-only" htmlFor="ocr-text">{t.result}</label><textarea id="ocr-text" value={text} onChange={e=>{setText(e.target.value);setCopied(false);}} placeholder={t.empty} disabled={running} spellCheck={false}/><div className="ocr-toolbar"><button disabled={!text||running} onClick={()=>setText(text.replace(/\s*\n\s*/g,' ').replace(/([\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]) +(?=[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}])/gu,'$1'))}>{t.merge}</button><button disabled={!report||running} onClick={()=>setText(textFromLines(report.items))}>{t.restore}</button></div></>:<><p className="ocr-hint">{t.lineNote}</p><ol className="ocr-lines">{report?.items.map((item,i)=><li key={i}><button aria-pressed={active===i} onClick={()=>{setActive(i);setBoxes(true);const scroll=scrollRef.current,scale=canvasRef.current.getBoundingClientRect().width/image.width;scroll.scrollTo({top:Math.max(0,item.poly[0][1]*scale-scroll.clientHeight/2),left:Math.max(0,item.poly[0][0]*scale-scroll.clientWidth/2),behavior:'smooth'});}}><span className="ocr-line-number">{i+1}</span><span>{item.text}</span><small className={item.score<.85?'low':''} title={item.score<.85?t.low:t.confidence}>{Math.round(item.score*100)}%</small></button></li>)}</ol></>}
        <div className="ocr-exports"><button className="studio-button" disabled={!text||running} onClick={copy}>{copied?<Check size={16}/>:<Copy size={16}/>} {copied?t.copied:t.copy}</button><button className="studio-button secondary" disabled={!text||running} onClick={()=>download('txt')}><Download size={16}/>{t.txt}</button><button className="studio-button secondary" disabled={!report||running} onClick={()=>download('json')}>{t.json}</button></div>
      </section>
    </div>
  </div>;
}
