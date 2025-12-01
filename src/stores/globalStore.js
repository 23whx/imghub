import { atom } from 'nanostores';

// 创建 atoms
export const isDarkMode = atom(false);
export const language = atom('zh'); // SSR 默认中文，避免与初始 HTML 不一致

// 仅在客户端执行初始化和监听
if (typeof window !== 'undefined') {
  // 1. 初始化：从 localStorage 读取
  const savedDarkMode = localStorage.getItem('isDarkMode');
  const savedLanguage = localStorage.getItem('language');

  if (savedDarkMode !== null) {
    isDarkMode.set(JSON.parse(savedDarkMode));
  }

  if (savedLanguage) {
    // 已有用户偏好，直接使用
    language.set(savedLanguage);
  } else {
    // 首次访问：根据 IP 粗略判断地区，设置默认语言
    (async () => {
      try {
        const res = await fetch('https://ipapi.co/json/');
        if (!res.ok) throw new Error('geo fetch failed');
        const data = await res.json();
        const country = (data.country || data.country_code || '').toUpperCase();

        let detected = 'en';
        if (country === 'CN' || country === 'TW') {
          detected = 'zh';
        } else if (country === 'JP') {
          detected = 'ja';
        }

        language.set(detected);
      } catch (e) {
        // 出错时默认英文
        language.set('en');
      }
    })();
  }

  // 2. 监听变化并持久化
  isDarkMode.subscribe(value => {
    localStorage.setItem('isDarkMode', JSON.stringify(value));
    if (value) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  });

  language.subscribe(value => {
    localStorage.setItem('language', value);
  });
}
