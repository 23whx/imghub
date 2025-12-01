---
// 动态生成 sitemap.xml
const pages = [
  { url: '', changefreq: 'daily', priority: '1.0' },
  { url: 'tools/subtitle-generator', changefreq: 'weekly', priority: '0.9' },
  { url: 'tools/pornhub-style', changefreq: 'weekly', priority: '0.9' },
  { url: 'tools/dnd-alignment', changefreq: 'weekly', priority: '0.9' },
  { url: 'tools/mbti-grid', changefreq: 'weekly', priority: '0.9' },
  { url: 'tools/meme-slicer', changefreq: 'weekly', priority: '0.9' },
  { url: 'tools/video-thumbnail', changefreq: 'weekly', priority: '0.9' },
  { url: 'tools/image-compress', changefreq: 'weekly', priority: '0.9' },
  { url: 'about', changefreq: 'monthly', priority: '0.6' },
  { url: 'privacy', changefreq: 'monthly', priority: '0.5' },
  { url: 'terms', changefreq: 'monthly', priority: '0.5' },
];

const site = 'https://imghub.com'; // 请替换为您的实际域名

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${pages.map(page => `  <url>
    <loc>${site}/${page.url}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

return new Response(xml, {
  headers: {
    'Content-Type': 'application/xml; charset=utf-8',
  },
});
---
