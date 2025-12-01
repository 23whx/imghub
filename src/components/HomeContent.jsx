import React, { useEffect, useState } from 'react';
import { useStore } from '@nanostores/react';
import { language as languageStore } from '../stores/globalStore';
import ToolCard from './ToolCard.jsx';

const translations = {
  zh: {
    heroTitle: '专业的在线图片处理工具集合',
    heroSubtitle: '简单、快速、免费 - 让图片处理更简单',
    whyTitle: '为什么选择 ImgHub？',
    freeTitle: '完全免费',
    freeDesc: '所有工具完全免费使用，无需注册',
    privacyTitle: '隐私安全',
    privacyDesc: '所有处理都在浏览器本地完成，图片不会上传到服务器',
    easyTitle: '简单易用',
    easyDesc: '界面清爽直观，上手零门槛',
    ctaTitle: '开始使用 ImgHub',
    ctaDesc: '选择一个你需要的工具，几秒钟内完成图片处理',
    ctaButton: '浏览所有工具',
  },
  en: {
    heroTitle: 'Professional online image tools collection',
    heroSubtitle: 'Simple, fast and free — make image editing easier',
    whyTitle: 'Why ImgHub?',
    freeTitle: 'Completely Free',
    freeDesc: 'All tools are free to use, no registration required',
    privacyTitle: 'Privacy First',
    privacyDesc: 'All processing is done locally in your browser, no image upload',
    easyTitle: 'Easy to Use',
    easyDesc: 'Clean and intuitive UI, zero learning curve',
    ctaTitle: 'Start with ImgHub',
    ctaDesc: 'Pick a tool you need and finish in seconds',
    ctaButton: 'Browse All Tools',
  },
  ja: {
    heroTitle: 'プロ仕様のオンライン画像ツール集',
    heroSubtitle: 'シンプル・高速・無料で画像編集をもっと簡単に',
    whyTitle: 'なぜ ImgHub なのか？',
    freeTitle: '完全無料',
    freeDesc: 'すべてのツールは無料で利用でき、登録も不要です',
    privacyTitle: 'プライバシー重視',
    privacyDesc: '画像処理はすべてブラウザ内で行われ、サーバーへは送信されません',
    easyTitle: 'かんたん操作',
    easyDesc: 'シンプルで直感的な UI で、すぐに使い始められます',
    ctaTitle: 'ImgHub を使い始める',
    ctaDesc: '必要なツールを選んで、数秒で画像処理を完了しましょう',
    ctaButton: 'すべてのツールを見る',
  },
};

const tools = [
  {
    href: '/tools/subtitle-generator',
    icon: 'Image',
    color: 'blue',
    title: {
      zh: '截图字幕生成器',
      en: 'Subtitle Screenshot Generator',
      ja: '字幕スクリーンショット生成器',
    },
    description: {
      zh: '为名人演讲添加自定义字幕，支持多语言和实时预览',
      en: 'Add custom subtitles to famous speeches with multi-language real-time preview',
      ja: '有名人スピーチに字幕を追加し、多言語リアルタイムプレビューに対応',
    },
  },
  {
    href: '/tools/pornhub-style',
    icon: 'Image',
    color: 'orange',
    title: {
      zh: 'Pornhub风格',
      en: 'Pornhub Style Logo',
      ja: 'Pornhub風ロゴ',
    },
    description: {
      zh: '制作经典的Pornhub风格Logo，黑底白字+橙色点缀',
      en: 'Create classic Pornhub-style logos with black, white and orange accents',
      ja: '黒背景に白文字＋オレンジアクセントの Pornhub 風ロゴを作成',
    },
  },
  {
    href: '/tools/dnd-alignment',
    icon: 'Grid3x3',
    color: 'purple',
    title: {
      zh: 'DND阵营九宫格',
      en: 'DND Alignment Grid',
      ja: 'DND陣営グリッド',
    },
    description: {
      zh: '上传9张图片，创建DND阵营九宫格对比图',
      en: 'Upload 9 images to create a DND alignment comparison grid',
      ja: '9枚の画像をアップロードして DND 陣営比較グリッドを作成',
    },
  },
  {
    href: '/tools/mbti-grid',
    icon: 'Users',
    color: 'blue',
    title: {
      zh: 'MBTI人格图',
      en: 'MBTI Personality Grid',
      ja: 'MBTI性格グリッド',
    },
    description: {
      zh: '选择多种MBTI类型，制作人格对比图片',
      en: 'Select multiple MBTI types and create personality comparison images',
      ja: '複数の MBTI タイプを選んで性格比較画像を作成',
    },
  },
  {
    href: '/tools/meme-slicer',
    icon: 'Scissors',
    color: 'green',
    title: {
      zh: '表情包切片',
      en: 'Meme Slicer',
      ja: 'ミームスライサー',
    },
    description: {
      zh: '上传图片，自定义行列数，快速切片导出',
      en: 'Upload an image, set rows and columns, and slice/export quickly',
      ja: '画像をアップロードし、行と列を指定して素早くスライス＆書き出し',
    },
  },
  // 网页截图和去水印暂时隐藏
  {
    href: '/tools/video-thumbnail',
    icon: 'Video',
    color: 'blue',
    title: {
      zh: '视频封面',
      en: 'Video Thumbnail',
      ja: '動画サムネイル',
    },
    description: {
      zh: '查看YouTube视频的高清封面图',
      en: 'View high-resolution thumbnails of YouTube videos',
      ja: 'YouTube 動画の高解像度サムネイルを取得',
    },
  },
  {
    href: '/tools/image-compress',
    icon: 'Minimize',
    color: 'green',
    title: {
      zh: '图片压缩',
      en: 'Image Compress',
      ja: '画像圧縮',
    },
    description: {
      zh: '批量压缩图片，保持质量的同时减小文件大小',
      en: 'Batch compress images to reduce file size while keeping quality',
      ja: '複数画像をまとめて圧縮し、品質を保ちながらファイルサイズを削減',
    },
  },
];

const HomeContent = () => {
  const $language = useStore(languageStore);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentLang = mounted ? $language : 'zh';
  const t = translations[currentLang] || translations.zh;

  const getToolText = (item, field) =>
    (item[field] && item[field][currentLang]) || (item[field] && item[field].zh) || '';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1
          className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-500 to-indigo-600 bg-clip-text text-transparent pb-2"
          style={{ lineHeight: 1.3 }}
        >
          ImgHub
        </h1>
        <p className="text-xl text-gray-700 mb-2">{t.heroTitle}</p>
        <p className="text-gray-600">{t.heroSubtitle}</p>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {tools.map((tool) => (
          <ToolCard
            key={tool.href}
            title={getToolText(tool, 'title')}
            description={getToolText(tool, 'description')}
            icon={tool.icon}
            href={tool.href}
            color={tool.color}
          />
        ))}
      </div>

      {/* Features */}
      <div className="bg-white rounded-2xl shadow-lg p-8 mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">{t.whyTitle}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">⚡</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{t.freeTitle}</h3>
            <p className="text-gray-600 text-sm">{t.freeDesc}</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🔒</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{t.privacyTitle}</h3>
            <p className="text-gray-600 text-sm">{t.privacyDesc}</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🚀</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{t.easyTitle}</h3>
            <p className="text-gray-600 text-sm">{t.easyDesc}</p>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-8 text-center text-white shadow-lg">
        <h2 className="text-2xl font-bold mb-3">{t.ctaTitle}</h2>
        <p className="mb-6 text-blue-50">{t.ctaDesc}</p>
        <a
          href="/#tools"
          className="inline-flex items-center px-6 py-3 bg-white/10 hover:bg-white/20 rounded-full text-sm font-medium transition-colors"
        >
          {t.ctaButton}
        </a>
      </div>
    </div>
  );
};

export default HomeContent;


