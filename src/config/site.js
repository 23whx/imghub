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
