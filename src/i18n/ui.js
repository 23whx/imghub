/** Shared UI strings: nav, footer, cookie banner */

export const ui = {
  zh: {
    home: '首页',
    tools: '工具',
    aboutAuthor: '关于作者',
    moreTools: '更多工具',
    about: '关于我们',
    privacy: '隐私政策',
    terms: '服务条款',
    contact: '联系我们',
    footerCopy: '© 2025 ImgHub. Made with ❤️ by Rollkey',
    cookieText:
      '我们使用 Cookie 来改善您的浏览体验、提供个性化内容和分析网站流量。继续使用本网站即表示您同意我们使用 Cookie。',
    cookieMore: '了解更多，请查看我们的',
    cookieAnd: '和',
    cookieAccept: '接受',
    cookieClose: '关闭',
  },
  en: {
    home: 'Home',
    tools: 'Tools',
    aboutAuthor: 'About Author',
    moreTools: 'More Tools',
    about: 'About',
    privacy: 'Privacy Policy',
    terms: 'Terms of Service',
    contact: 'Contact',
    footerCopy: '© 2025 ImgHub. Made with ❤️ by Rollkey',
    cookieText:
      'We use cookies to improve your experience, personalize content, and analyze traffic. By continuing to use this site, you agree to our use of cookies.',
    cookieMore: 'Learn more in our',
    cookieAnd: 'and',
    cookieAccept: 'Accept',
    cookieClose: 'Close',
  },
  ja: {
    home: 'ホーム',
    tools: 'ツール',
    aboutAuthor: '作者について',
    moreTools: 'その他のツール',
    about: 'About',
    privacy: 'プライバシー',
    terms: '利用規約',
    contact: 'お問い合わせ',
    footerCopy: '© 2025 ImgHub. Made with ❤️ by Rollkey',
    cookieText:
      '当サイトでは、体験向上・コンテンツ最適化・アクセス解析のために Cookie を使用します。継続して利用することで Cookie の使用に同意したものとみなされます。',
    cookieMore: '詳細は',
    cookieAnd: 'と',
    cookieAccept: '同意する',
    cookieClose: '閉じる',
  },
};

export function getUi(lang) {
  return ui[lang] || ui.en;
}
