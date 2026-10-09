import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPageSchema, serializeJsonLd, canonicalPath } from '../src/utils/seo.js';
import { siteConfig } from '../src/config/site.js';
import { locales } from '../src/i18n/config.js';
import { publicTools, tools } from '../src/i18n/tools.js';
import { toolGuides } from '../src/i18n/toolGuides.js';
import { exhibitOrder } from '../src/i18n/studio.js';
import { buildAlternates } from '../src/i18n/utils.js';
import { GET as sitemap } from '../src/pages/sitemap.xml.js';
import { GET as robots } from '../src/pages/robots.txt.js';

test('JSON-LD cannot terminate its raw-text element with user-visible text', () => {
  const value = { name: '</script><script>alert("x")</script>', description: '<>&\u2028\u2029' };
  const output = serializeJsonLd(value);
  assert.ok(!output.includes('<') && !output.includes('>') && !output.includes('&'));
  assert.deepEqual(JSON.parse(output), value);
});
test('page graph connects creator, website, application and breadcrumb IDs', () => {
  const url = canonicalPath('zh', '/tools/online-drawing/');
  const data = buildPageSchema({ lang: 'zh', title: '画图', description: '图层编辑', path: 'tools/online-drawing', extra: [
    { '@context': 'https://schema.org', '@type': 'WebApplication', '@id': `${url}#application` },
    { '@type': 'BreadcrumbList', '@id': `${url}#breadcrumb` },
  ] });
  const page = data['@graph'].find(node => node['@type'] === 'WebPage');
  assert.equal(url, `${siteConfig.url}/zh/tools/online-drawing/`);
  assert.equal(page.mainEntity['@id'], `${url}#application`);
  assert.equal(page.breadcrumb['@id'], `${url}#breadcrumb`);
  assert.equal(data['@graph'].filter(node => node['@context']).length, 0);
  assert.equal(new Set(data['@graph'].map(node => node['@id'])).size, data['@graph'].length);
});
test('sitemap excludes unfinished tools and redirect aliases, robots points to production', async () => {
  const xml = await (await sitemap()).text(), txt = await (await robots()).text();
  assert.ok(txt.includes(`Sitemap: ${siteConfig.url}/sitemap.xml`));
  assert.equal([...xml.matchAll(/<loc>/g)].length, (publicTools.length + 4) * locales.length);
  for (const tool of tools.filter(tool => !tool.public)) assert.ok(!xml.includes(`/tools/${tool.slug}/`));
  assert.ok(!xml.includes('<lastmod>'));
});
test('all published guides have real localized content and unique public related destinations', () => {
  const publicSlugs = new Set(publicTools.map(tool => tool.slug));
  const summaries = new Set();
  for (const tool of publicTools) for (const lang of locales) {
    const guide = toolGuides[tool.slug]?.[lang];
    assert.ok(guide, `${tool.slug}/${lang}`);
    assert.equal(guide.steps.length, 3);
    assert.equal(guide.faqs.length, 2);
    assert.ok(guide.related.length >= 2 && new Set(guide.related).size === guide.related.length);
    assert.ok(guide.related.every(slug => slug !== tool.slug && publicSlugs.has(slug)));
    assert.ok(!summaries.has(guide.summary)); summaries.add(guide.summary);
  }
});

test('published tools have complete localized metadata and appear once in homepage ordering', () => {
  assert.equal(new Set(tools.map(tool => tool.slug)).size, tools.length);
  assert.equal(new Set(exhibitOrder).size, exhibitOrder.length);
  assert.deepEqual([...exhibitOrder].sort(), publicTools.map(tool => tool.slug).sort());
  for (const tool of publicTools) for (const lang of locales) {
    for (const field of ['title', 'description', 'h1']) assert.ok(tool.seo[lang]?.[field]?.trim(), `${tool.slug}/${lang}/${field}`);
    assert.ok(tool.card[lang]?.title?.trim(), `${tool.slug}/${lang}/card`);
  }
});

test('AI tools are indexed in every language with reciprocal alternates and incoming related links', async () => {
  const xml = await (await sitemap()).text();
  for (const slug of ['image-enhancer', 'ai-watermark-remover']) {
    const tool = publicTools.find(tool => tool.slug === slug);
    assert.ok(tool, `${slug}: public registry`);
    assert.match(tool.browserRequirements, /WebGPU is optional/);
    assert.match(tool.browserRequirements, /CPU processing is supported/);
    for (const lang of locales) {
      const url = canonicalPath(lang, `tools/${slug}`);
      const entry = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].find(match => match[1].includes(`<loc>${url}</loc>`))?.[1];
      assert.ok(entry, `${url}: sitemap entry`);
      for (const alternate of buildAlternates(siteConfig.url, `tools/${slug}`)) {
        assert.ok(entry.includes(`hreflang="${alternate.hreflang}" href="${alternate.href}"`), `${url}: ${alternate.hreflang}`);
      }
      assert.ok(publicTools.some(other => other.slug !== slug && toolGuides[other.slug][lang].related.includes(slug)), `${slug}/${lang}: incoming guide link`);
    }
  }
});
