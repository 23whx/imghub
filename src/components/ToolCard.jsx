import { ArrowUpRight } from 'lucide-react';
import ArtworkPreview from './ArtworkPreview.jsx';
import { localizedPath } from '../i18n/utils.js';
import { getStudioCopy } from '../i18n/studio.js';

export default function ToolCard({ tool, lang = 'en', index = 1, featured = false }) {
  const copy = tool.card[lang] || tool.card.en;
  const t = getStudioCopy(lang);
  return <a className={'exhibit-card ' + (featured ? 'exhibit-featured' : '')} href={localizedPath(lang, 'tools/' + tool.slug)} aria-label={copy.title + ' · ' + t.open}>
    <div className="exhibit-image"><ArtworkPreview slug={tool.slug} lang={lang} /></div>
    <div className="exhibit-caption"><span className="exhibit-number">{String(index).padStart(2, '0')}</span><div>{featured ? <p className="exhibit-title">{copy.title}</p> : <h3>{copy.title}</h3>}{!featured && <p>{copy.description}</p>}</div><ArrowUpRight size={21} strokeWidth={1.25} aria-hidden="true" /></div>
  </a>;
}
