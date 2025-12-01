import { atom } from 'nanostores';

// 创建 atoms
export const isDarkMode = atom(false);
export const language = atom('zh');

// 仅在客户端执行初始化和监听
if (typeof window !== 'undefined') {
  // 1. 初始化：从 localStorage 读取
  const savedDarkMode = localStorage.getItem('isDarkMode');
  const savedLanguage = localStorage.getItem('language');

  if (savedDarkMode !== null) {
    isDarkMode.set(JSON.parse(savedDarkMode));
  }
  
  if (savedLanguage) {
    language.set(savedLanguage);
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
