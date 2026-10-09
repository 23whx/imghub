import { atom } from 'nanostores';

// Warm ivory gallery by default; returning visitors retain their preference.
export const isDarkMode = atom(false);
// Default en to match site defaultLocale; URL / data-locale overrides on client
export const language = atom('en');

function getLocaleFromDocument() {
  if (typeof document === 'undefined') return null;
  const fromData = document.documentElement.getAttribute('data-locale');
  if (fromData === 'zh' || fromData === 'en' || fromData === 'ja') return fromData;
  return null;
}

function getLocaleFromPath() {
  if (typeof window === 'undefined') return null;
  const match = window.location.pathname.match(/^\/(zh|en|ja)(?:\/|$)/);
  return match ? match[1] : null;
}

// Client-only init and listeners
if (typeof window !== 'undefined') {
  const savedDarkMode = localStorage.getItem('isDarkMode');
  if (savedDarkMode !== null) {
    isDarkMode.set(JSON.parse(savedDarkMode));
  }

  // URL / html data-locale is the source of truth for SEO pages
  const fromUrl = getLocaleFromPath() || getLocaleFromDocument();
  if (fromUrl) {
    language.set(fromUrl);
    localStorage.setItem('language', fromUrl);
  } else {
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage === 'zh' || savedLanguage === 'en' || savedLanguage === 'ja') {
      language.set(savedLanguage);
    }
  }

  isDarkMode.subscribe((value) => {
    localStorage.setItem('isDarkMode', JSON.stringify(value));
    if (value) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  });

  language.subscribe((value) => {
    localStorage.setItem('language', value);
  });
}

/** Sync store from a known page locale (call from React with lang prop). */
export function syncLanguageFromLocale(lang) {
  if (lang === 'zh' || lang === 'en' || lang === 'ja') {
    if (language.get() !== lang) {
      language.set(lang);
    }
  }
}
