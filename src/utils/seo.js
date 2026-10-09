import { siteConfig, absoluteUrl } from '../config/site.js';
import { localizedPath } from '../i18n/utils.js';
import { htmlLang } from '../i18n/config.js';

export function canonicalPath(lang, path = '') { return absoluteUrl(localizedPath(lang, path)); }

/** @param {{lang: string, title: string, description: string, path?: string, extra?: Record<string, unknown> | Record<string, unknown>[] | null}} options */
export function buildPageSchema({ lang, title, description, path = '', extra = null }) {
  const url = canonicalPath(lang, path), creatorId = `${siteConfig.url}/#creator`, websiteId = `${siteConfig.url}/#website`;
  const additions = (Array.isArray(extra) ? extra : extra ? [extra] : []).map(({ ['@context']: context, ...node }) => node);
  const mainEntity = additions.find(node => ['WebApplication', 'ItemList'].includes(node['@type']));
  const breadcrumb = additions.find(node => node['@type'] === 'BreadcrumbList');
  return {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'Person', '@id': creatorId, name: siteConfig.creator, url: canonicalPath(lang, 'about'), sameAs: [siteConfig.social], email: siteConfig.email },
      { '@type': 'WebSite', '@id': websiteId, name: siteConfig.name, url: `${siteConfig.url}/`, inLanguage: Object.values(htmlLang), publisher: { '@id': creatorId } },
      { '@type': path === '' ? 'CollectionPage' : path === 'about' ? 'AboutPage' : 'WebPage', '@id': `${url}#webpage`, name: title, description, url, inLanguage: htmlLang[lang] || 'en', isPartOf: { '@id': websiteId }, publisher: { '@id': creatorId }, ...(path === 'about' ? { mainEntity: { '@id': creatorId } } : mainEntity?.['@id'] ? { mainEntity: { '@id': mainEntity['@id'] } } : {}), ...(breadcrumb ? { breadcrumb: { '@id': breadcrumb['@id'] } } : {}) },
      ...additions,
    ],
  };
}

// JSON-LD uses a raw-text HTML element: escape characters that could close it.
export function serializeJsonLd(data) {
  return JSON.stringify(data).replace(/[<>&\u2028\u2029]/g, character => ({ '<': '\\u003c', '>': '\\u003e', '&': '\\u0026', '\u2028': '\\u2028', '\u2029': '\\u2029' })[character]);
}
