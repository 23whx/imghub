// /llms.txt: a plain-text map of the site for AI assistants and answer engines (llmstxt.org format).
import { siteConfig } from '../config/site.js';
import { canonicalPath } from '../utils/seo.js';
import { locales } from '../i18n/config.js';
import { publicTools } from '../i18n/tools.js';
import { getToolGuide } from '../i18n/toolGuides.js';
import { exhibitOrder } from '../i18n/studio.js';

const languages = { zh: 'Simplified Chinese', en: 'English', ja: 'Japanese' };
const tools = [...publicTools].sort((a, b) => exhibitOrder.indexOf(a.slug) - exhibitOrder.indexOf(b.slug));

const llmsTxt = `# ${siteConfig.name}

> ImgHub is a free online image toolkit by the independent developer ${siteConfig.creator}. It offers ${tools.length} browser-based tools for drawing and photo editing, image compression, AI image enhancement, OCR text extraction, watermarks, image splitting, screenshots and meme or subtitle image creation. No account or installation is needed, and most tools process images locally in the browser without uploading them.

Every page is available in ${locales.map(lang => languages[lang]).join(', ')}. URLs follow ${siteConfig.url}/{lang}/tools/{tool}/ with lang = ${locales.join(', ')}.

## Tools

${tools.map(tool => `- [${tool.seo.en.h1}](${canonicalPath('en', `tools/${tool.slug}`)}): ${getToolGuide(tool.slug, 'en')?.summary || tool.seo.en.description}`).join('\n')}

## Language versions

${locales.map(lang => `- [${languages[lang]} home](${canonicalPath(lang)})`).join('\n')}

## About

- [About ImgHub and its creator](${canonicalPath('en', 'about')}): ${siteConfig.creator}, contact ${siteConfig.email}, ${siteConfig.social}
- [Privacy policy](${canonicalPath('en', 'privacy')})
- [Terms of service](${canonicalPath('en', 'terms')})
`;

export async function GET() {
  return new Response(llmsTxt, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
