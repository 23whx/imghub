// Render the 1200×630 Open Graph images: one per language for the home page and one per public tool.
// Output: public/og/<lang>/home.jpg and public/og/<lang>/<slug>.jpg (committed; rerun after copy changes).
// Usage: node scripts/generate-og-images.mjs   (needs network for Google Fonts; set OG_CHROME to use a local Chrome)
import fs from 'node:fs/promises';
import path from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import * as icons from 'lucide-react';
import puppeteer from 'puppeteer';
import sharp from 'sharp';
import { locales } from '../src/i18n/config.js';
import { publicTools } from '../src/i18n/tools.js';
import { getStudioCopy } from '../src/i18n/studio.js';
import { siteConfig } from '../src/config/site.js';

const outDir = 'public/og';
const domain = new URL(siteConfig.url).host;
const fonts = {
  zh: { title: 'Noto Serif SC', body: 'Noto Sans SC' },
  en: { title: 'Cormorant Garamond', body: 'Inter' },
  ja: { title: 'Noto Serif JP', body: 'Noto Sans JP' },
};
const copy = {
  zh: { eyebrow: '免费在线图片工具', badge: '免费使用 · 无需注册' },
  en: { eyebrow: 'Free online image tools', badge: 'Free · No sign-up' },
  ja: { eyebrow: '無料オンライン画像ツール', badge: '無料 · 登録不要' },
};

// The home hero photo; its dark left half carries the text.
const hero = await sharp('public/assets/studio/gallery-hero-alps.webp').resize(1200, 630, { fit: 'cover', position: 'right' }).jpeg({ quality: 88 }).toBuffer();
const heroUrl = `data:image/jpeg;base64,${hero.toString('base64')}`;

const escape = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// Titles may only wrap between words (keep-all + <wbr>), so CJK titles never split mid-word.
const breakable = (lang, s) => [...new Intl.Segmenter(lang, { granularity: 'word' }).segment(s)].map(w => escape(w.segment)).join('<wbr>');
const fontCss = async (family, weight, text) => {
  const url = `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, '+')}:wght@${weight}&text=${encodeURIComponent(text)}`;
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 Chrome/120' } });
  if (!res.ok) throw new Error(`Google Fonts ${res.status}: ${family}`);
  return res.text();
};

const page = ({ lang, eyebrow, title, description, icon }) => `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><style>
  * { box-sizing: border-box; margin: 0; }
  body { width: 1200px; height: 630px; overflow: hidden; background: #0d0b08 url(${heroUrl}) center / cover; color: #f4ecdf; font-family: '${fonts[lang].body}', sans-serif; }
  .shade { position: absolute; inset: 0; background: linear-gradient(90deg, rgb(10 8 6 / .94) 0%, rgb(10 8 6 / .86) 42%, rgb(10 8 6 / .35) 68%, rgb(10 8 6 / .05) 100%), linear-gradient(0deg, rgb(10 8 6 / .7), transparent 32%); }
  .frame { position: absolute; inset: 28px; border: 1px solid rgb(214 182 128 / .32); }
  main { position: absolute; left: 76px; top: 72px; bottom: 64px; width: 580px; display: flex; flex-direction: column; }
  .eyebrow { display: flex; align-items: center; gap: 14px; color: #d6b680; font-size: 21px; letter-spacing: ${lang === 'en' ? '.16em' : '.12em'}; text-transform: uppercase; }
  .eyebrow::before { content: ''; width: 44px; height: 1px; background: #d6b680; }
  .icon { width: 64px; height: 64px; margin-top: 40px; display: grid; place-items: center; border: 1px solid rgb(214 182 128 / .55); border-radius: 50%; color: #e9cf9f; }
  .icon svg { width: 30px; height: 30px; }
  h1 { margin-top: 26px; font-family: '${fonts[lang].title}', serif; font-weight: 600; line-height: 1.12; letter-spacing: ${lang === 'en' ? '-.01em' : '.02em'}; text-wrap: balance; word-break: keep-all; }
  p { margin-top: 22px; max-width: 540px; color: #cfc4b3; font-size: 25px; line-height: 1.5; text-wrap: pretty; }
  footer { margin-top: auto; padding-top: 28px; display: flex; align-items: baseline; gap: 22px; }
  .mark { font-family: 'Cormorant Garamond', serif; font-weight: 600; font-size: 40px; color: #f4ecdf; }
  .meta { color: #a99c88; font-size: 19px; letter-spacing: .04em; }
</style></head><body><div class="shade"></div><div class="frame"></div><main>
  <div class="eyebrow">${escape(eyebrow)}</div>
  ${icon ? `<div class="icon">${icon}</div>` : ''}
  <h1>${title.map(line => breakable(lang, line)).join('<br>')}</h1>
  <p>${escape(description)}</p>
  <footer><span class="mark">ImgHub</span><span class="meta">${escape(domain)} · ${escape(copy[lang].badge)}</span></footer>
</main></body></html>`;

const jobs = locales.flatMap(lang => {
  const studio = getStudioCopy(lang);
  return [
    { lang, file: 'home', eyebrow: copy[lang].eyebrow, title: studio.headline, description: studio.intro },
    ...publicTools.map(tool => {
      const Icon = icons[tool.icon] || icons.Image;
      return {
        lang, file: tool.slug, eyebrow: copy[lang].eyebrow,
        title: [(tool.seo[lang] || tool.seo.en).h1],
        description: (tool.card[lang] || tool.card.en).description,
        icon: renderToStaticMarkup(createElement(Icon, { strokeWidth: 1.6 })),
      };
    }),
  ];
});

const browser = await puppeteer.launch({ executablePath: process.env.OG_CHROME || undefined });
try {
  const tab = await browser.newPage();
  await tab.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
  for (const job of jobs) {
    const text = [job.eyebrow, ...job.title, job.description, copy[job.lang].badge, domain, 'ImgHub'].join('');
    const css = (await Promise.all([
      fontCss(fonts[job.lang].title, 600, text),
      fontCss(fonts[job.lang].body, 400, text),
      fontCss('Cormorant Garamond', 600, 'ImgHub'),
    ])).join('\n');
    await tab.setContent(page(job).replace('</style>', `${css}</style>`), { waitUntil: 'load', timeout: 120000 });
    await tab.evaluate(async () => {
      await document.fonts.ready;
      // Largest title size that keeps the copy inside the text column.
      const h1 = document.querySelector('h1');
      const main = document.querySelector('main');
      // Keep each title line whole first (no mid-word CJK breaks), then allow wrapping.
      const fits = () => main.scrollHeight <= main.clientHeight && h1.scrollWidth <= h1.clientWidth;
      const fit = (from, to) => { for (let size = from; size >= to; size -= 2) { h1.style.fontSize = `${size}px`; if (fits()) return true; } return false; };
      h1.style.whiteSpace = 'nowrap';
      if (fit(84, 58)) return;
      h1.style.whiteSpace = '';
      fit(84, 40);
    });
    const png = await tab.screenshot({ type: 'png' });
    const file = path.join(outDir, job.lang, `${job.file}.jpg`);
    await fs.mkdir(path.dirname(file), { recursive: true });
    await sharp(png).jpeg({ quality: 86, mozjpeg: true }).toFile(file);
    console.log(file);
  }
} finally {
  await browser.close();
}
