import React, { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Search, X, Lock, Sparkles, Eye } from 'lucide-react';
import { syncLanguageFromLocale } from '../stores/globalStore';
import ToolCard from './ToolCard.jsx';
import { publicTools } from '../i18n/tools.js';
import { localizedPath } from '../i18n/utils.js';
import { exhibitOrder, getStudioCopy, toolCategory } from '../i18n/studio.js';

export default function HomeContent({ lang = 'en' }) {
  const t = getStudioCopy(lang);
  const [filter, setFilter] = useState(0);
  const [query, setQuery] = useState('');
  const root = useRef(null);
  useEffect(() => {
    syncLanguageFromLocale(lang);
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.08 });
    root.current?.querySelectorAll('[data-reveal]').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [lang]);
  const ordered = exhibitOrder.map(slug => publicTools.find(tool => tool.slug === slug)).filter(Boolean);
  const shown = ordered.filter(tool => (!filter || toolCategory[tool.slug] === filter) && ((tool.card[lang] || tool.card.en).title + ' ' + (tool.card[lang] || tool.card.en).description + ' ' + tool.slug).toLowerCase().includes(query.trim().toLowerCase()));
  const firstTool = localizedPath(lang, 'tools/online-drawing');
  const card = (tool, featured = false) => <ToolCard key={tool.slug} tool={tool} lang={lang} index={exhibitOrder.indexOf(tool.slug) + 1} featured={featured} />;
  const valueIcons = [Sparkles, Lock, Eye];
  return <div className="studio-home" ref={root}>
    <section className="gallery-hero" aria-labelledby="home-heading">
      <picture className="gallery-backdrop">
        <source media="(max-width: 700px)" srcSet="/assets/studio/gallery-hero-alps-mobile.webp" />
        <img src="/assets/studio/gallery-hero-alps.webp" alt="" width="1800" height="1029" fetchpriority="high" />
      </picture>
      <div className="hero-shade" />
      <div className="hero-content studio-container">
        <p className="eyebrow">THE IMAGE STUDIO</p>
        <h1 id="home-heading">{t.headline.map(line => <span key={line}>{line}</span>)}</h1>
        <p className="hero-intro">{t.intro}<br /><span>{t.detail}</span></p>
        <div className="hero-actions">
          <a className="studio-button" href={firstTool}>{t.start}<ArrowUpRight size={18} /></a>
          <a className="text-link" href="#tools">{t.browse}<ArrowUpRight size={17} /></a>
        </div>
      </div>
    </section>
    <section className="selected-section studio-container" aria-labelledby="selected-heading" data-reveal>
      <div className="section-heading"><div><h2 id="selected-heading">{t.selected}</h2><p>{t.selectedDesc}</p></div><a className="text-link" href="#tools">{t.browse}<ArrowUpRight size={16} /></a></div>
      <div className="selected-grid">{ordered.slice(0, 3).map(tool => card(tool, true))}</div>
    </section>
    <section className="tools-section studio-container" id="tools" aria-labelledby="tools-heading" data-reveal>
      <div className="section-heading"><div><h2 id="tools-heading">{t.all}</h2><p>{t.allDesc}</p></div><span className="collection-count">{String(publicTools.length).padStart(2, '0')} / TOOLS</span></div>
      <div className="collection-controls">
        <div className="collection-filters" role="group" aria-label={t.browse}>{t.filters.map((label, i) => <button key={label} type="button" aria-pressed={filter === i} className={filter === i ? 'active' : ''} onClick={() => setFilter(i)}>{label}</button>)}</div>
        <div className="collection-search"><Search size={17} aria-hidden="true" /><input aria-label={t.search} placeholder={t.search} value={query} onChange={e => setQuery(e.target.value)} />{query && <button type="button" aria-label={t.clear} onClick={() => setQuery('')}><X size={16} /></button>}</div>
      </div>
      <div className="collection-grid" aria-live="polite">{shown.map(tool => card(tool))}</div>
      {!shown.length && <div className="collection-empty"><p>{t.noResults}</p><button type="button" className="text-link" onClick={() => { setQuery(''); setFilter(0); }}>{t.clear}</button></div>}
    </section>
    <section className="studio-values studio-container" data-reveal>
      <div className="values-title"><h2>{t.philosophy}</h2><p>{t.philosophyDesc}</p></div>
      <div className="values-grid">{t.values.map(([title, description], i) => { const Icon = valueIcons[i]; return <div key={title}><Icon size={21} strokeWidth={1.3} /><h3>{title}</h3><p>{description}</p></div>; })}</div>
    </section>
  </div>;
}
