import { locales } from '../i18n/config.js';
import { publicTools } from '../i18n/tools.js';
import { buildAlternates, localizedPath } from '../i18n/utils.js';
import { siteConfig, absoluteUrl } from '../config/site.js';

export const sitemapPaths = ['', 'about', 'privacy', 'terms', ...publicTools.map(tool => `tools/${tool.slug}`)];
const xmlEscape = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[character]);

export function GET() {
  const entries = sitemapPaths.flatMap(path => locales.map(lang => {
    const alternates = buildAlternates(siteConfig.url, path).map(alternate =>
      `    <xhtml:link rel="alternate" hreflang="${alternate.hreflang}" href="${xmlEscape(alternate.href)}" />`
    ).join('\n');
    return `  <url>\n    <loc>${xmlEscape(absoluteUrl(localizedPath(lang, path)))}</loc>\n${alternates}\n  </url>`;
  })).join('\n');
  // Omit lastmod until a real per-page content modification date is maintained.
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${entries}\n</urlset>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
