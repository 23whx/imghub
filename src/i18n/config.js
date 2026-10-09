/** Supported locales and SEO locale mappings */

export const locales = ['zh', 'en', 'ja'];

/** Default locale for root redirect, old-URL 301, and x-default hreflang */
export const defaultLocale = 'en';

export const localeLabels = {
  zh: '中文',
  en: 'English',
  ja: '日本語',
};

/** <html lang> values */
export const htmlLang = {
  zh: 'zh-CN',
  en: 'en',
  ja: 'ja',
};

/** Open Graph locale */
export const ogLocale = {
  zh: 'zh_CN',
  en: 'en_US',
  ja: 'ja_JP',
};

/** hreflang attribute values */
export const hreflang = {
  zh: 'zh-CN',
  en: 'en',
  ja: 'ja',
};

export function isValidLocale(lang) {
  return locales.includes(lang);
}
