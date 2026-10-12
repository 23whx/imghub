// Keep every public SEO URL on the same confirmed production origin.
export const siteConfig = {
  url: 'https://imghub.oumashu.top',
  name: 'ImgHub',
  creator: 'Rollkey',
  email: 'wyh93829@gmail.com',
  social: 'https://x.com/Rollkey8',
  socialHandle: '@Rollkey8',
  image: '/og-image.png',
};

export const absoluteUrl = path => new URL(path, `${siteConfig.url}/`).href;
// Per-language share images from scripts/generate-og-images.mjs (1200×630 JPEG): the home card, or a public tool's card.
export const ogImagePath = (lang, slug = 'home') => `/og/${lang}/${slug}.jpg`;
