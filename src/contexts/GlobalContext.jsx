import React, { createContext, useState, useEffect } from 'react';

export const GlobalContext = createContext({
  isDarkMode: false,
  setIsDarkMode: () => {},
  language: 'zh',
  setLanguage: () => {},
});

export const GlobalProvider = ({ children }) => {
  // 初始化时从 localStorage 读取
  const [isDarkMode, setIsDarkModeState] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('isDarkMode');
      return saved ? JSON.parse(saved) : false;
    }
    return false;
  });

  const [language, setLanguageState] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('language');
      return saved || 'zh';
    }
    return 'zh';
  });

  // 包装 setter 函数，同时更新 localStorage
  const setIsDarkMode = (value) => {
    setIsDarkModeState(value);
    if (typeof window !== 'undefined') {
      localStorage.setItem('isDarkMode', JSON.stringify(value));
    }
  };

  const setLanguage = (value) => {
    setLanguageState(value);
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', value);
    }
  };

  // 监听暗黑模式变化，更新 body 类名
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [isDarkMode]);

  return (
    <GlobalContext.Provider value={{ isDarkMode, setIsDarkMode, language, setLanguage }}>
      {children}
    </GlobalContext.Provider>
  );
};

