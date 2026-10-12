import fs from 'node:fs/promises';
import path from 'node:path';
import { parse } from 'parse5';
import sharp from 'sharp';
import { siteConfig, ogImagePath } from '../src/config/site.js';

const adsensePublisher = 'pub-4880646654838411';
import { locales, htmlLang } from '../src/i18n/config.js';
import { tools, publicTools } from '../src/i18n/tools.js';
import { buildAlternates, localizedPath } from '../src/i18n/utils.js';
import { getToolGuide } from '../src/i18n/toolGuides.js';

const root = path.resolve('dist');
const report = { checkedAt: new Date().toISOString(), origin: siteConfig.url, scope: 'Built static HTML and local assets; not Google indexing or CWV field data', assertions: 0, errors: [], warnings: [], pages: [], redirects: [] };
const check = (condition, message) => { report.assertions++; if (!condition) report.errors.push(message); };
const attr = (node, name) => node?.attrs?.find(item => item.name === name)?.value;
const text = node => node?.nodeName === '#text' ? node.value : (node?.childNodes || []).map(text).join('');
function walk(node, result = []) { result.push(node); for (const child of node.childNodes || []) walk(child, result); return result; }
async function files(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  return (await Promise.all(entries.map(entry => entry.isDirectory() ? files(path.join(directory, entry.name)) : [path.join(directory, entry.name)]))).flat();
}
const allFiles = await files(root);
const exists = new Set(allFiles.map(file => path.relative(root, file).replaceAll('\\', '/')));
const documents = new Map();
const fileFor = pathname => {
  const relative = decodeURIComponent(pathname).replace(/^\/+/, '');
  return relative.endsWith('/') || !path.posix.extname(relative) ? `${relative.replace(/\/$/, '')}${relative ? '/' : ''}index.html` : relative;
};
for (const file of allFiles.filter(file => file.endsWith('.html'))) {
  const source = await fs.readFile(file, 'utf8');
  const nodes = walk(parse(source));
  const relative = path.relative(root, file).replaceAll('\\', '/');
  const pathname = relative === 'index.html' ? '/' : `/${relative.replace(/index\.html$/, '')}`;
  documents.set(relative, { source, nodes, pathname });
}
const expectedPaths = ['', 'about', 'privacy', 'terms', ...publicTools.map(tool => `tools/${tool.slug}`)];
const expected = new Set(expectedPaths.flatMap(page => locales.map(lang => `${siteConfig.url}${localizedPath(lang, page)}`)));
const seenTitles = new Set(), seenDescriptions = new Set(), indexed = new Set();
let guides = 0, hidden = 0, linkCount = 0;
for (const [file, document] of documents) {
  const { nodes, pathname, source } = document;
  const tags = tag => nodes.filter(node => node.tagName === tag);
  const meta = name => tags('meta').find(node => attr(node, 'name') === name || attr(node, 'property') === name);
  const refresh = tags('meta').find(node => attr(node, 'http-equiv')?.toLowerCase() === 'refresh');
  if (refresh) {
    const content = attr(refresh, 'content');
    check(content?.startsWith('0;'), `${pathname}: delayed redirect fallback`);
    const destination = content?.match(/url=(.*)/i)?.[1];
    check(destination?.endsWith('/'), `${pathname}: redirect target needs trailing slash`);
    check(destination && exists.has(fileFor(new URL(destination, siteConfig.url).pathname)), `${pathname}: redirect target missing`);
    report.redirects.push({ path: pathname, destination });
    continue;
  }
  if (file === '404.html') {
    // Not-found page: never indexed, no canonical of its own, links every language's tools.
    check(attr(meta('robots'), 'content') === 'noindex, follow', '/404.html: must be noindex');
    check(!tags('link').some(node => ['canonical', 'alternate'].includes(attr(node, 'rel'))), '/404.html: must not declare canonical or language alternates');
    const hrefs = new Set(tags('a').map(node => attr(node, 'href')));
    for (const lang of locales) for (const tool of publicTools) check(hrefs.has(localizedPath(lang, `tools/${tool.slug}`)), `/404.html: missing link to ${lang}/${tool.slug}`);
    for (const href of hrefs) if (href?.startsWith('/')) check(exists.has(fileFor(href.split('#')[0])), `/404.html: broken link ${href}`);
    continue;
  }
  const canonical = attr(tags('link').find(node => attr(node, 'rel') === 'canonical'), 'href');
  const title = text(tags('title')[0]).trim(), description = attr(meta('description'), 'content');
  const robots = attr(meta('robots'), 'content') || '';
  const lang = pathname.split('/')[1], slug = pathname.split('/')[3];
  const tool = tools.find(item => item.slug === slug);
  const isHidden = tool?.public === false;
  check(canonical === `${siteConfig.url}${pathname}`, `${pathname}: wrong canonical ${canonical}`);
  check(attr(tags('html')[0], 'lang') === htmlLang[lang], `${pathname}: wrong html language`);
  check(tags('h1').length === 1, `${pathname}: expected one H1, got ${tags('h1').length}`);
  check(Boolean(title && description), `${pathname}: missing title or description`);
  check(attr(meta('og:url'), 'content') === canonical && attr(meta('twitter:url'), 'content') === canonical, `${pathname}: social URL differs from canonical`);
  check(attr(meta('twitter:creator'), 'content') === siteConfig.socialHandle, `${pathname}: wrong creator handle`);
  check(attr(meta('og:image'), 'content') === `${siteConfig.url}${ogImagePath(lang, tool?.public ? slug : undefined)}`, `${pathname}: wrong share image URL`);
  const alternates = tags('link').filter(node => attr(node, 'hreflang'));
  if (isHidden) {
    hidden++;
    check(robots === 'noindex, follow' && alternates.length === 0, `${pathname}: hidden tool indexable or linked as language alternate`);
  } else {
    indexed.add(canonical);
    check(robots === 'index, follow, max-image-preview:large', `${pathname}: indexable page blocked`);
    check(!seenTitles.has(title), `${pathname}: duplicate title`); seenTitles.add(title);
    check(!seenDescriptions.has(description), `${pathname}: duplicate description`); seenDescriptions.add(description);
    check(expected.has(canonical), `${pathname}: indexable URL absent from sitemap registry`);
    const expectedAlternates = buildAlternates(siteConfig.url, pathname.split('/').filter(Boolean).slice(1).join('/'));
    check(alternates.length === 4 && expectedAlternates.every(alternate => alternates.some(node => attr(node, 'hreflang') === alternate.hreflang && attr(node, 'href') === alternate.href)), `${pathname}: language alternates missing or incorrect`);
  }
  const adsense = tags('script').filter(node => attr(node, 'src')?.startsWith('https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js'));
  check(adsense.length === 1 && attr(adsense[0], 'src').endsWith(`?client=ca-${adsensePublisher}`) && attr(adsense[0], 'crossorigin') === 'anonymous' && adsense[0].parentNode?.tagName === 'head', `${pathname}: AdSense script missing from head`);
  const scripts = tags('script').filter(node => attr(node, 'type') === 'application/ld+json');
  check(scripts.length === 1, `${pathname}: expected one JSON-LD graph`);
  let graph = [];
  try { graph = JSON.parse(text(scripts[0]))['@graph']; } catch { check(false, `${pathname}: invalid JSON-LD`); }
  check(Array.isArray(graph) && graph.length >= 3, `${pathname}: incomplete graph`);
  if (!Array.isArray(graph)) graph = [];
  const person = graph.find(node => node['@type'] === 'Person');
  check(person?.email === siteConfig.email && person?.sameAs?.includes(siteConfig.social), `${pathname}: incorrect author identity`);
  check(!graph.some(node => node.aggregateRating || node.review || node['@type'] === 'FAQPage'), `${pathname}: unverified reviews or FAQ rich-result markup`);
  const primaryImage = graph.find(node => node['@type'] === 'ImageObject');
  check(primaryImage?.url === attr(meta('og:image'), 'content') && graph.find(node => node['@id'] === `${canonical}#webpage`)?.primaryImageOfPage?.['@id'] === primaryImage?.['@id'], `${pathname}: primary image differs from share image`);
  check(graph.find(node => node['@type'] === 'WebSite')?.alternateName?.length === siteConfig.alternateName.length, `${pathname}: website alternate names missing`);
  if (tool?.public) {
    const app = graph.find(node => node['@type'] === 'WebApplication');
    check(app?.url === canonical && app?.offers?.price === '0' && app?.name === tool.seo[lang].h1, `${pathname}: incorrect application schema`);
    check(app?.description === tool.seo[lang].description && app?.mainEntityOfPage?.['@id'] === `${canonical}#webpage` && app?.image?.['@id'] === primaryImage?.['@id'], `${pathname}: application metadata disconnected from page`);
    if (tool.browserRequirements) check(app?.browserRequirements === tool.browserRequirements, `${pathname}: incorrect browser requirements`);
    const breadcrumb = graph.find(node => node['@type'] === 'BreadcrumbList');
    check(breadcrumb?.itemListElement?.length === 2 && breadcrumb.itemListElement[1].item === canonical, `${pathname}: invalid breadcrumb`);
    const guide = nodes.find(node => attr(node, 'class')?.split(' ').includes('tool-guide'));
    const expectedGuide = getToolGuide(slug, lang);
    check(Boolean(guide && expectedGuide) && text(guide).includes(expectedGuide.summary), `${pathname}: guide absent from initial HTML`);
    check(expectedGuide?.faqs.every(faq => text(guide).includes(faq.question) && text(guide).includes(faq.answer)), `${pathname}: FAQ content incomplete`);
    check(expectedGuide?.related.every(related => walk(guide || {}).some(node => node.tagName === 'a' && attr(node, 'href') === localizedPath(lang, `tools/${related}`))), `${pathname}: related links missing`);
    guides++;
  } else {
    check(!graph.some(node => node['@type'] === 'WebApplication'), `${pathname}: hidden/non-tool page has application schema`);
  }
  if (pathname === localizedPath(lang)) {
    const list = graph.find(node => node['@type'] === 'ItemList');
    const items = list?.itemListElement || [];
    check(list?.numberOfItems === publicTools.length && items.length === publicTools.length, `${pathname}: homepage tool count out of date`);
    check(new Set(items.map(item => item.url)).size === publicTools.length, `${pathname}: duplicate or missing homepage schema destinations`);
    check(items.every((item, index) => item.position === index + 1), `${pathname}: incorrect homepage list positions`);
    for (const publicTool of publicTools) {
      const toolPath = localizedPath(lang, `tools/${publicTool.slug}`);
      check(items.some(item => item.url === `${siteConfig.url}${toolPath}` && item.name === publicTool.card[lang].title), `${pathname}: tool missing from homepage schema: ${publicTool.slug}`);
      check(tags('a').some(node => attr(node, 'href') === toolPath), `${pathname}: tool has no crawlable homepage link: ${publicTool.slug}`);
    }
  }
  for (const node of nodes) {
    const refs = ['a', 'link'].includes(node.tagName) ? [attr(node, 'href')] : ['img', 'script', 'source'].includes(node.tagName) ? [attr(node, 'src'), ...(attr(node, 'srcset') || '').split(',').map(value => value.trim().split(/\s+/)[0])] : [];
    for (const reference of refs.filter(Boolean)) {
      if (/^(data:|blob:|mailto:|tel:)/i.test(reference)) continue;
      const url = new URL(reference, `${siteConfig.url}${pathname}`);
      if (url.origin !== siteConfig.url) continue;
      const targetFile = fileFor(url.pathname);
      check(exists.has(targetFile), `${pathname}: broken internal reference ${reference}`); linkCount++;
      if (node.tagName === 'a' && url.hash && documents.has(targetFile)) {
        check(documents.get(targetFile).nodes.some(target => attr(target, 'id') === decodeURIComponent(url.hash.slice(1))), `${pathname}: missing link anchor ${reference}`);
      }
    }
    if (node.tagName === 'img') {
      check(attr(node, 'alt') !== undefined, `${pathname}: image missing alt`);
      check(Boolean(attr(node, 'width') && attr(node, 'height')), `${pathname}: image dimensions missing`);
    }
  }
  report.pages.push({ path: pathname, canonical, title, descriptionLength: description?.length, indexable: !isHidden, h1: text(tags('h1')[0]), htmlBytes: Buffer.byteLength(source), schemaTypes: graph.map(node => node['@type']) });
}
check(indexed.size === expected.size && [...expected].every(url => indexed.has(url)), 'Sitemap and indexable page set differ');
const sitemap = await fs.readFile(path.join(root, 'sitemap.xml'), 'utf8');
const locations = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => match[1]);
check(locations.length === expected.size && new Set(locations).size === locations.length && locations.every(url => expected.has(url)), 'Generated sitemap URLs differ from indexable pages');
check(!/<lastmod>|<priority>|<changefreq>/.test(sitemap), 'Sitemap contains unmaintained freshness or unused signals');
for (const entry of sitemap.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
  const location = entry[1].match(/<loc>(.*?)<\/loc>/)?.[1];
  if (!expected.has(location)) continue;
  const pagePath = new URL(location).pathname.split('/').filter(Boolean).slice(1).join('/');
  const alternateNodes = walk(parse(entry[1])).filter(node => node.tagName === 'xhtml:link');
  check(alternateNodes.length === 4 && buildAlternates(siteConfig.url, pagePath).every(alternate =>
    alternateNodes.some(node => attr(node, 'rel') === 'alternate' && attr(node, 'hreflang') === alternate.hreflang && attr(node, 'href') === alternate.href)
  ), `${location}: sitemap language alternates missing or incorrect`);
}
const robots = await fs.readFile(path.join(root, 'robots.txt'), 'utf8');
const adsTxt = await fs.readFile(path.join(root, 'ads.txt'), 'utf8').catch(() => '');
check(adsTxt.split('\n').some(line => line.trim() === `google.com, ${adsensePublisher}, DIRECT, f08c47fec0942fa0`), 'ads.txt missing or without the AdSense publisher line');
check(robots.includes(`Sitemap: ${siteConfig.url}/sitemap.xml`) && !robots.includes('Disallow: /\n'), 'Incorrect robots sitemap or sitewide block');
for (const file of locales.flatMap(lang => [undefined, ...publicTools.map(tool => tool.slug)].map(slug => ogImagePath(lang, slug)))) {
  try {
    const image = await sharp(path.join(root, file)).metadata();
    check(image.width === 1200 && image.height === 630 && image.format === 'jpeg', `${file}: share image wrong dimensions`);
  } catch { check(false, `${file}: share image missing; run scripts/generate-og-images.mjs and build`); }
}
for (const file of allFiles.filter(file => file.endsWith('.css'))) {
  const css = await fs.readFile(file, 'utf8');
  for (const match of css.matchAll(/url\(["']?([^\s"')]+)["']?\)/g)) {
    const reference = match[1]; if (!reference.startsWith('/') || reference.startsWith('//')) continue;
    check(exists.has(decodeURIComponent(reference.slice(1)).split(/[?#]/)[0]), `${path.basename(file)}: broken CSS asset ${reference}`);
  }
}
report.summary = { contentPages: report.pages.length, indexablePages: indexed.size, publicTools: publicTools.length, toolGuides: guides, hiddenPages: hidden, redirectFallbacks: report.redirects.length, internalReferences: linkCount, errors: report.errors.length };
await fs.mkdir('docs/imghub.oumashu.top-audit', { recursive: true });
await fs.writeFile('docs/imghub.oumashu.top-audit/static-audit.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify({ summary: report.summary, assertions: report.assertions, errors: report.errors }, null, 2));
process.exitCode = report.errors.length ? 1 : 0;
