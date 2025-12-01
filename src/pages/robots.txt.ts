---
const robotsTxt = `# https://www.robotstxt.org/robotstxt.html
User-agent: *
Allow: /

# Disallow crawling of API routes (if any)
Disallow: /api/

# Sitemap
Sitemap: https://imghub.com/sitemap.xml
`;

return new Response(robotsTxt, {
  headers: {
    'Content-Type': 'text/plain; charset=utf-8',
  },
});
---
