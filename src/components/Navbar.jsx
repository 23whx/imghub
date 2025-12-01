import React, { useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { Menu, X, Home, Sun, Moon, Globe, User, Images } from 'lucide-react';
import { isDarkMode, language } from '../stores/globalStore';

const Navbar = () => {
  const $isDarkMode = useStore(isDarkMode);
  const $language = useStore(language);
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 语言配置
  const languages = {
    en: {
      home: 'Home',
      tools: 'Tools',
      aboutAuthor: 'About Author',
      moreTools: 'More Tools',
    },
    zh: {
      home: '首页',
      tools: '工具',
      aboutAuthor: '关于作者',
      moreTools: '更多工具',
    },
    ja: {
      home: 'ホーム',
      tools: 'ツール',
      aboutAuthor: '作者について',
      moreTools: 'その他のツール',
    }
  };

  // 关键修改：在组件挂载前使用默认语言 'zh'，挂载后使用 Store 中的语言
  // 这解决了服务端渲染(SSR)和客户端初次渲染不匹配导致的 Hydration Error
  const currentLang = mounted ? $language : 'zh';
  const t = languages[currentLang] || languages.zh;

  const tools = [
    { name: '截图字幕生成器', path: '/tools/subtitle-generator', nameEn: 'Subtitle', nameJa: '字幕' },
    { name: 'Pornhub风格', path: '/tools/pornhub-style', nameEn: 'Pornhub Style', nameJa: 'Pornhub風' },
    { name: 'DND阵营', path: '/tools/dnd-alignment', nameEn: 'DND Grid', nameJa: 'DND配置' },
    { name: 'MBTI人格', path: '/tools/mbti-grid', nameEn: 'MBTI Grid', nameJa: 'MBTI性格' },
    { name: '表情包切片', path: '/tools/meme-slicer', nameEn: 'Meme Slicer', nameJa: 'ミームスライサー' },
    // 暂时隐藏
    // { name: '网页截图', path: '/tools/screenshot', nameEn: 'Screenshot', nameJa: 'スクリーンショット' },
    // { name: '去水印', path: '/tools/watermark-remover', nameEn: 'Watermark Remover', nameJa: '透かし除去' },
    { name: '视频缩略图', path: '/tools/video-thumbnail', nameEn: 'Video Thumbnail', nameJa: '動画サムネイル' },
    { name: '图片压缩', path: '/tools/image-compress', nameEn: 'Image Compress', nameJa: '画像圧縮' },
  ];

  const getToolName = (tool) => {
    if (currentLang === 'en') return tool.nameEn;
    if (currentLang === 'ja') return tool.nameJa;
    return tool.name;
  };

  return (
    <nav className={`backdrop-blur-lg border-b sticky top-0 z-50 transition-colors duration-300 ${
      $isDarkMode 
        ? 'bg-gray-800/80 border-gray-700/50' 
        : 'bg-white/80 border-gray-200/50'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all duration-300">
              <Images className="w-6 h-6 text-white" />
            </div>
            <span className={`font-bold text-xl hidden sm:block transition-colors duration-300 ${
              $isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>ImgHub</span>
          </a>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-1">
            <a
              href="/"
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                $isDarkMode 
                  ? 'text-gray-200 hover:bg-gray-700' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>{t.home}</span>
            </a>
            
            {/* More Dropdown */}
            <div className="relative group">
              <button className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                $isDarkMode 
                  ? 'text-gray-200 hover:bg-gray-700' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}>
                {t.moreTools} ▾
              </button>
              <div className={`absolute right-0 mt-2 w-48 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 ${
                $isDarkMode ? 'bg-gray-800' : 'bg-white'
              }`}>
                {tools.map((tool) => (
                  <a
                    key={tool.path}
                    href={tool.path}
                    className={`block px-4 py-3 text-sm first:rounded-t-lg last:rounded-b-lg transition-colors ${
                      $isDarkMode 
                        ? 'text-gray-200 hover:bg-gray-700' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {getToolName(tool)}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Right Side Controls */}
          <div className="flex items-center space-x-2">
            {/* Language Selector */}
            <div className="relative">
              <select
                value={$language}
                onChange={(e) => language.set(e.target.value)}
                className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors appearance-none pr-8 border-0 cursor-pointer ${
                  $isDarkMode 
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                <option value="en">English</option>
                <option value="zh">中文</option>
                <option value="ja">日本語</option>
              </select>
              <Globe className={`absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none ${
                $isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`} />
            </div>
            
            {/* Dark Mode Toggle */}
            <button
              onClick={() => isDarkMode.set(!$isDarkMode)}
              className={`inline-flex items-center px-3 py-2 rounded-lg transition-colors ${
                $isDarkMode 
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              {$isDarkMode ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>

            {/* About Author */}
            <a
              href="/about"
              className={`hidden md:inline-flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors ${
                $isDarkMode 
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              <User className="w-4 h-4" />
              <span className="text-sm">{t.aboutAuthor}</span>
            </a>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`md:hidden p-2 rounded-lg transition-colors ${
                $isDarkMode 
                  ? 'text-gray-200 hover:bg-gray-700' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden pb-4">
            <div className="space-y-1">
              <a
                href="/"
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                  $isDarkMode 
                    ? 'text-gray-200 hover:bg-gray-700' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Home className="w-4 h-4" />
                <span>{t.home}</span>
              </a>
              {tools.map((tool) => (
                <a
                  key={tool.path}
                  href={tool.path}
                  className={`block px-3 py-2 rounded-lg transition-colors ${
                    $isDarkMode 
                      ? 'text-gray-200 hover:bg-gray-700' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {getToolName(tool)}
                </a>
              ))}
              <a
                href="/about"
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                  $isDarkMode 
                    ? 'text-gray-200 hover:bg-gray-700' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <User className="w-4 h-4" />
                <span>{t.aboutAuthor}</span>
              </a>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;