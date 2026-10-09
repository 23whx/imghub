import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { getUi } from '../i18n/ui.js';
import { localizedPath } from '../i18n/utils.js';

export default function CookieConsent({ lang = 'en' }) {
  const [show, setShow] = useState(false);
  const t = getUi(lang);
  useEffect(() => { if (!localStorage.getItem('cookieConsent')) setShow(true); }, []);
  const accept = () => { localStorage.setItem('cookieConsent', 'accepted'); setShow(false); };
  if (!show) return null;
  return <aside className="studio-consent" aria-label="Cookies"><div><p>{t.cookieText}</p><small>{t.cookieMore} <a href={localizedPath(lang, 'privacy')}>{t.privacy}</a> {t.cookieAnd} <a href={localizedPath(lang, 'terms')}>{t.terms}</a>.</small></div><div className="consent-actions"><button type="button" className="studio-button" onClick={accept}>{t.cookieAccept}</button><button type="button" className="nav-icon" onClick={accept} aria-label={t.cookieClose}><X size={19} /></button></div></aside>;
}
