import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const CookieConsent = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      setShow(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem('cookieConsent', 'accepted');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t-2 border-gray-200 shadow-2xl p-4 md:p-6 animate-slide-up">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex-1 text-sm text-gray-700">
          <p className="mb-2">
            🍪 我们使用 Cookie 来改善您的浏览体验、提供个性化内容和分析网站流量。
            继续使用本网站即表示您同意我们使用 Cookie。
          </p>
          <p className="text-xs text-gray-600">
            了解更多，请查看我们的
            <a href="/privacy" className="text-blue-600 hover:underline ml-1">隐私政策</a> 和
            <a href="/terms" className="text-blue-600 hover:underline ml-1">服务条款</a>。
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={acceptCookies}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium whitespace-nowrap"
          >
            接受
          </button>
          <button
            onClick={acceptCookies}
            className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="关闭"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;

