import { locales, defaultLocale, isValidLocale, hreflang } from './config.js';

/**
 * Build a localized path (always trailing slash for consistent canonical/hreflang).
 * @param {string} lang
 * @param {string} [path=''] - path without leading lang, e.g. '', 'about', 'tools/xxx'
 */
export function localizedPath(lang, path = '') {
  const locale = isValidLocale(lang) ? lang : defaultLocale;
  const clean = String(path || '')
    .replace(/^\/+/, '')
    .replace(/\/+$/, '');
  return clean ? `/${locale}/${clean}/` : `/${locale}/`;
}

/**
 * Strip locale prefix from a pathname and return { lang, pathWithoutLang }.
 */
export function parseLocalizedPath(pathname = '/') {
  const parts = String(pathname).split('/').filter(Boolean);
  if (parts.length > 0 && isValidLocale(parts[0])) {
    return {
      lang: parts[0],
      pathWithoutLang: parts.slice(1).join('/'),
    };
  }
  return {
    lang: null,
    pathWithoutLang: parts.join('/'),
  };
}

/**
 * Swap language prefix while keeping the rest of the path.
 */
export function switchLocalePath(pathname, nextLang) {
  const { pathWithoutLang } = parseLocalizedPath(pathname);
  return localizedPath(nextLang, pathWithoutLang);
}

/**
 * Absolute alternate URLs for hreflang (including x-default).
 * @param {string} site - canonical production origin
 * @param {string} pathWithoutLang - e.g. '' | 'about' | 'tools/xxx'
 */
export function buildAlternates(site, pathWithoutLang = '') {
  const base = String(site || '').replace(/\/+$/, '');
  const alternates = locales.map((lang) => ({
    lang,
    hreflang: hreflang[lang],
    href: `${base}${localizedPath(lang, pathWithoutLang)}`,
  }));
  alternates.push({
    lang: 'x-default',
    hreflang: 'x-default',
    href: `${base}${localizedPath(defaultLocale, pathWithoutLang)}`,
  });
  return alternates;
}

/**
 * Pick locale from Accept-Language header; fall back to defaultLocale.
 */
export function pickLocaleFromAcceptLanguage(header = '') {
  if (!header) return defaultLocale;
  const lower = header.toLowerCase();
  // Order by quality if present
  const tags = lower.split(',').map((part) => {
    const [tag, ...params] = part.trim().split(';');
    const q = params.find((p) => p.trim().startsWith('q='));
    const quality = q ? parseFloat(q.split('=')[1]) : 1;
    return { tag: tag.trim(), quality: Number.isFinite(quality) ? quality : 1 };
  });
  tags.sort((a, b) => b.quality - a.quality);

  for (const { tag } of tags) {
    if (tag.startsWith('zh')) return 'zh';
    if (tag.startsWith('ja')) return 'ja';
    if (tag.startsWith('en')) return 'en';
  }
  return defaultLocale;
}

export { locales, defaultLocale, isValidLocale };
