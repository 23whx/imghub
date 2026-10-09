import React from 'react';
import { getStudioCopy } from '../i18n/studio.js';
import { mbtiTypes, mbtiCharacterSrc } from '../data/mbti.js';

export default function ArtworkPreview({ slug, lang = 'en' }) {
  const t = getStudioCopy(lang);
  if (slug === 'image-enhancer') return <div className="artwork art-aiwm" aria-hidden="true"><img src="/assets/image-enhancer/example-enhanced.webp" alt="" loading="lazy" width="768" height="512" /><div className="art-aiwm-clean"><img src="/assets/image-enhancer/example-low.webp" alt="" loading="lazy" width="192" height="128" /></div><span className="art-aiwm-tag">{lang === 'zh' ? '低清 / AI 增强' : lang === 'ja' ? '低解像度 / AI 鮮明化' : 'LOW RES / AI ENHANCED'}</span></div>;
  if (slug === 'ai-watermark-remover') return <div className="artwork art-aiwm" aria-hidden="true"><img src="/assets/studio/subtitle.webp" alt="" loading="lazy" width="900" height="600" /><div className="art-aiwm-clean"><img src="/assets/ai-watermark/reconstruction-example.webp" alt="" loading="lazy" width="900" height="600" /></div><span className="art-aiwm-tag">{lang === 'zh' ? '整图重建 · 实验' : lang === 'ja' ? '画像再構築 · 実験' : 'RECONSTRUCTION · EXPERIMENT'}</span></div>;
  if (slug === 'online-drawing') return <div className="artwork art-drawing" aria-hidden="true"><div className="art-drawing-paper"><svg viewBox="0 0 300 180" fill="none"><circle cx="155" cy="81" r="43" fill="#dcc08b" /><path d="M35 149C78 54 90 148 131 104S174 36 260 126" stroke="#765323" strokeWidth="5" strokeLinecap="round" /><rect x="40" y="28" width="44" height="44" stroke="#a98454" strokeWidth="2" transform="rotate(-12 40 28)" /><path d="m226 30 4 13 13 4-13 4-4 13-4-13-13-4 13-4Z" fill="#9b654b" /></svg></div><span className="art-drawing-pencil" /><span className="art-drawing-tag">DRAW SOMETHING NEW</span></div>;
  if (slug === 'mbti-grid') return <div className="artwork art-mosaic art-mbti" aria-hidden="true">
    {mbtiTypes.map(type => <div className="art-mosaic-cell" key={type}>
      <img src={mbtiCharacterSrc(type)} alt="" loading="lazy" width="360" height="559" />
      <span>{type}</span>
    </div>)}
  </div>;
  if (slug === 'dnd-alignment') {
    return <div className="artwork art-dnd" aria-hidden="true">
      <img src="/assets/dnd/simpsons-alignment.webp" alt="" loading="lazy" width="1402" height="1122" />
    </div>;
  }
  if (slug === 'pornhub-style') return <div className="artwork art-logo" aria-hidden="true"><span>Image<b>hub</b></span></div>;
  if (slug === 'image-ocr') return <div className="artwork art-ocr" aria-hidden="true"><div className="ocr-paper"><span>IMAGINATION</span><p>Every image<br />tells a story.</p><small>Image → Text</small></div><div className="ocr-scan" /></div>;
  if (slug === 'wiggle-studio') return <div className="artwork art-motion art-pudding"><picture><source media="(prefers-reduced-motion: reduce)" srcSet="/assets/wiggle/pudding.webp" /><img src="/assets/wiggle/pudding-soft.webp" alt={lang === 'zh' ? '不停柔软晃动的焦糖布丁' : lang === 'ja' ? 'ぷるぷる揺れるキャラメルプリン' : 'A softly jiggling caramel pudding'} loading="lazy" width="384" height="384" /></picture><span className="art-pudding-label" aria-hidden="true">MADE TO MOVE</span></div>;
  return <div className={'artwork art-photo art-' + slug}>
    <img src="/assets/studio/subtitle.webp" alt="" loading="lazy" width="900" height="600" />
    {slug === 'subtitle-generator' && <div className="art-caption" aria-hidden="true">{t.subtitle}<small>Some views are only found along the way.</small></div>}
    {slug === 'watermark-adder' && <div className="art-watermarks" aria-hidden="true">ImgHub　ImgHub　ImgHub<br />ImgHub　ImgHub　ImgHub<br />ImgHub　ImgHub　ImgHub</div>}
    {slug === 'image-compress' && <div className="art-compress-line" aria-hidden="true"><span>Original</span><span>JPEG</span></div>}
    {slug === 'meme-slicer' && <div className="art-slice-grid" aria-hidden="true">{Array.from({length: 9}, (_, i) => <span key={i} />)}</div>}
    {slug === 'video-thumbnail' && <span className="art-play" aria-hidden="true">▶</span>}
  </div>;
}
