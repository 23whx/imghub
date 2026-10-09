import { absoluteUrl } from '../config/site.js';

const robotsTxt = `User-agent: *
Allow: /
Disallow: /api/

Sitemap: ${absoluteUrl('/sitemap.xml')}
`;

export async function GET() {
  return new Response(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}

