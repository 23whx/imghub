import { useState, useEffect, useRef } from 'react';
import { useStore } from '@nanostores/react';
import { Menu, X, Sun, Moon, ArrowUpRight } from 'lucide-react';
import { isDarkMode, syncLanguageFromLocale } from '../stores/globalStore';
import { publicTools } from '../i18n/tools.js';
import { localizedPath, switchLocalePath } from '../i18n/utils.js';
import { locales } from '../i18n/config.js';
import { getStudioCopy } from '../i18n/studio.js';

export default function Navbar({ lang: langProp = 'en', isHome = false }) {
  const dark = useStore(isDarkMode);
  const [open, setOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const menuRef = useRef(null);
  const toolsRef = useRef(null);
  const triggerRef = useRef(null);
  const toolsTriggerRef = useRef(null);
  const t = getStudioCopy(langProp);
  const home = localizedPath(langProp);
  useEffect(() => { syncLanguageFromLocale(langProp); }, [langProp]);
  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') { if (menuRef.current) triggerRef.current?.focus(); else if (toolsRef.current?.contains(document.activeElement)) toolsTriggerRef.current?.focus(); setOpen(false); setToolsOpen(false); } };
    const onPointer = e => { if (!toolsRef.current?.contains(e.target)) setToolsOpen(false); };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('pointerdown', onPointer); };
  }, []);
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    menuRef.current?.querySelector('a')?.focus();
    const trap = e => {
      if (e.key !== 'Tab') return;
      const elements = [triggerRef.current, ...menuRef.current.querySelectorAll('a, button')];
      const first = elements[0], last = elements[elements.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', trap);
    return () => { document.body.style.overflow = prev; document.removeEventListener('keydown', trap); };
  }, [open]);
  const changeLanguage = next => {
    if (locales.includes(next) && next !== langProp) window.location.href = switchLocalePath(window.location.pathname, next) + window.location.hash;
  };
  return <nav className={'studio-nav ' + (isHome ? 'studio-nav-home' : '')} aria-label={langProp === 'zh' ? '主导航' : 'Main navigation'}>
    <div className="studio-container nav-inner">
      <a className="studio-wordmark" href={home}>ImgHub<span>THE IMAGE STUDIO</span></a>
      <div className="nav-desktop">
        <div className="nav-tool-menu" ref={toolsRef}>
          <button type="button" ref={toolsTriggerRef} aria-expanded={toolsOpen} aria-controls="desktop-tools" onClick={() => setToolsOpen(!toolsOpen)}>{t.toolsNav}<ArrowUpRight size={15} /></button>
          {toolsOpen && <div className="nav-tools-panel" id="desktop-tools">{publicTools.map(tool => <a key={tool.slug} href={localizedPath(langProp, 'tools/' + tool.slug)}>{tool.nav[langProp] || tool.nav.en}<ArrowUpRight size={14} /></a>)}<a href={home + '#tools'} className="nav-all-link">{t.browse}</a></div>}
        </div>
        <a href={localizedPath(langProp, 'about')}>{t.aboutNav}</a>
      </div>
      <div className="nav-actions">
        <select aria-label="Language" value={langProp} onChange={e => changeLanguage(e.target.value)}><option value="zh">中文</option><option value="en">EN</option><option value="ja">日本語</option></select>
        <span className="nav-divider" aria-hidden="true" />
        <button type="button" className="nav-icon" aria-label={t.theme} onClick={() => isDarkMode.set(!dark)}><Sun className="theme-sun" size={19} strokeWidth={1.3} /><Moon className="theme-moon" size={19} strokeWidth={1.3} /></button>
        <button type="button" ref={triggerRef} className="nav-icon nav-mobile-toggle" aria-label={open ? t.close : t.menu} aria-expanded={open} aria-controls="mobile-navigation" onClick={() => setOpen(!open)}>{open ? <X size={22} /> : <Menu size={22} />}</button>
      </div>
    </div>
    {open && <div className="nav-mobile-panel" id="mobile-navigation" ref={menuRef}><div className="studio-container"><a className="nav-mobile-home" href={home + '#tools'} onClick={() => setOpen(false)}>{t.toolsNav}<ArrowUpRight size={23} /></a>{publicTools.map((tool, i) => <a key={tool.slug} href={localizedPath(langProp, 'tools/' + tool.slug)} onClick={() => setOpen(false)}><span>{String(i + 1).padStart(2, '0')}</span>{tool.nav[langProp] || tool.nav.en}<ArrowUpRight size={18} /></a>)}<a href={localizedPath(langProp, 'about')}>{t.aboutNav}<ArrowUpRight size={18} /></a></div></div>}
  </nav>;
}
