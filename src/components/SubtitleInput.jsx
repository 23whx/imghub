import React, { useState } from 'react';
import { Type, Languages } from 'lucide-react';

const SubtitleInput = ({ 
  subtitle, 
  onSubtitleChange, 
  subtitleType, 
  onSubtitleTypeChange, 
  language 
}) => {
  // 用于双语模式的两个独立字幕内容
  const [topSubtitle, setTopSubtitle] = useState('');
  const [bottomSubtitle, setBottomSubtitle] = useState('');

  // 语言配置
  const languages = {
    en: {
      subtitleMode: 'Subtitle Mode',
      monoMode: 'Mono Mode',
      bilingualMode: 'Bilingual Mode',

      topSubtitle: 'Top Subtitle',
      bottomSubtitle: 'Bottom Subtitle',
      subtitleContent: 'Subtitle Content',
      lineNote: '(keep each line short)',
      linesSuffix: 'lines',
      usageTips: 'Usage Tips',
      tips: [
        '🎬 First line displays at bottom of original image',
        '📺 Multiple lines auto-splice (TV screenshot effect)', 
        '🎨 Adjust font, size, color in style settings',
        '🎯 Best effect with max 20 characters per line',
        '💫 Subtitles have shadow and stroke effects'
      ]
    },
    zh: {
      subtitleMode: '字幕模式',
      monoMode: '单语模式',
      bilingualMode: '双语模式', 

      topSubtitle: '上方字幕',
      bottomSubtitle: '下方字幕',
      subtitleContent: '台词内容',
      lineNote: '（一排不要太长了）',
      linesSuffix: '行',
      usageTips: '使用技巧',
      tips: [
        '🎬 第一行台词显示在原图底部',
        '📺 每一行都会自动拼接（模拟电视截图效果）',
        '🎨 可在样式设置中调整字体、大小、颜色',
        '🎯 每行不超过20个字符效果最佳',
        '💫 字幕带有阴影和描边效果'
      ]
    },
    ja: {
      subtitleMode: '字幕モード',
      monoMode: '単一言語モード',
      bilingualMode: '二言語モード',

      topSubtitle: '上部字幕',
      bottomSubtitle: '下部字幕',
      subtitleContent: '字幕内容',
      lineNote: '（1行を長くしすぎないでください）',
      linesSuffix: '行',
      usageTips: '使用のコツ',
      tips: [
        '🎬 最初の行は元画像の下部に表示',
        '📺 各行が自動的に結合（テレビスクリーンショット効果）',
        '🎨 スタイル設定でフォント、サイズ、色を調整可能',
        '🎯 1行20文字以下が最適',
        '💫 字幕には影と輪郭効果あり'
      ]
    }
  };

  const t = languages[language] || languages.en;

  const subtitleModes = [
    { id: 'mono', name: t.monoMode, icon: Type },
    { id: 'bilingual', name: t.bilingualMode, icon: Languages },
  ];



  // 占位文字跟随页面语言；双语示例为“页面语言 + 另一种语言”
  const allPlaceholders = {
    zh: {
      mono: '如果你不够优秀\n人脉是不值钱的\n它不是追求来的\n而是吸引来的',
      bilingual: {
        top: '如果你不够优秀\n人脉是不值钱的',
        bottom: 'If you are not excellent enough\nConnections are worthless'
      }
    },
    en: {
      mono: 'If you are not good enough\nconnections are worthless\nThey are not chased\nbut attracted',
      bilingual: {
        top: 'If you are not good enough\nconnections are worthless',
        bottom: '如果你不够优秀\n人脉是不值钱的'
      }
    },
    ja: {
      mono: '自分が優れていなければ\n人脈に価値はない\n人脈は追いかけるものではなく\n引き寄せるものだ',
      bilingual: {
        top: '自分が優れていなければ\n人脈に価値はない',
        bottom: 'If you are not good enough\nconnections are worthless'
      }
    }
  };
  const placeholders = allPlaceholders[language] || allPlaceholders.en;

  const isBilingualMode = subtitleType !== 'mono';
  const currentMode = isBilingualMode ? 'bilingual' : 'mono';

  // 处理模式变化：切换时保留已输入的台词
  const handleModeChange = (mode) => {
    if (mode === currentMode) return;
    if (mode === 'mono') {
      onSubtitleTypeChange('mono');
      // 回到单语时沿用上方字幕，避免把双语分隔符显示在输入框里
      onSubtitleChange(topSubtitle);
    } else {
      // 进入双语时把当前台词带到上方字幕
      setTopSubtitle(subtitle);
      onSubtitleTypeChange('bilingual');
    }
  };

  // 处理双语模式下的字幕变化
  React.useEffect(() => {
    if (isBilingualMode) {
      const combinedSubtitle = `${topSubtitle}\n---BILINGUAL_SEPARATOR---\n${bottomSubtitle}`;
      onSubtitleChange(combinedSubtitle);
    }
  }, [topSubtitle, bottomSubtitle, isBilingualMode, onSubtitleChange]);

  return (
    <div className="space-y-4">
      {/* 字幕模式选择 */}
      <div>
        <label className={`block text-sm font-medium mb-3 transition-colors duration-300 ${
          "text-gray-700 dark:text-gray-200"
        }`}>
          {t.subtitleMode}
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {subtitleModes.map((mode) => {
            const Icon = mode.icon;
            const isSelected = currentMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => handleModeChange(mode.id)}
                className={`relative flex items-center justify-center px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isSelected
                    ? "bg-neutral-900 text-white dark:bg-white dark:text-black"
                    : "bg-gray-50 text-gray-600 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {mode.name}
              </button>
            );
          })}
        </div>
      </div>



      {/* 字幕内容输入 */}
      <div>
        {isBilingualMode ? (
          <div className="space-y-4">
            {/* 上方字幕 */}
            <div>
              <label className={`block text-sm font-medium mb-3 transition-colors duration-300 ${
                "text-gray-700 dark:text-gray-200"
              }`}>
                {t.topSubtitle}
                <span className={`text-xs ml-2 transition-colors duration-300 ${
                  "text-gray-500 dark:text-gray-400"
                }`}>{t.lineNote}</span>
              </label>
              <div className="relative">
                <textarea
                  aria-label={t.topSubtitle}
                  value={topSubtitle}
                  onChange={(e) => {
                    setTopSubtitle(e.target.value);
                  }}
                  placeholder={placeholders.bilingual?.top || ''}
                  rows={4}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-black/30 dark:focus:ring-white/30 focus:border-transparent resize-none text-sm leading-relaxed transition-all duration-200 backdrop-blur-sm ${
                    "bg-white/50 border-gray-200 text-gray-900 placeholder-gray-500 dark:bg-gray-700/50 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400"
                  }`}
                />
                <div className={`absolute bottom-3 right-3 text-xs transition-colors duration-300 ${
                  "text-gray-400 dark:text-gray-500"
                }`}>
                  {topSubtitle.split('\n').length} {t.linesSuffix}
                </div>
              </div>
            </div>

            {/* 下方字幕 */}
            <div>
              <label className={`block text-sm font-medium mb-3 transition-colors duration-300 ${
                "text-gray-700 dark:text-gray-200"
              }`}>
                {t.bottomSubtitle}
                <span className={`text-xs ml-2 transition-colors duration-300 ${
                  "text-gray-500 dark:text-gray-400"
                }`}>{t.lineNote}</span>
              </label>
              <div className="relative">
                <textarea
                  aria-label={t.bottomSubtitle}
                  value={bottomSubtitle}
                  onChange={(e) => {
                    setBottomSubtitle(e.target.value);
                  }}
                  placeholder={placeholders.bilingual?.bottom || ''}
                  rows={4}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-black/30 dark:focus:ring-white/30 focus:border-transparent resize-none text-sm leading-relaxed transition-all duration-200 backdrop-blur-sm ${
                    "bg-white/50 border-gray-200 text-gray-900 placeholder-gray-500 dark:bg-gray-700/50 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400"
                  }`}
                />
                <div className={`absolute bottom-3 right-3 text-xs transition-colors duration-300 ${
                  "text-gray-400 dark:text-gray-500"
                }`}>
                  {bottomSubtitle.split('\n').length} {t.linesSuffix}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <label className={`block text-sm font-medium mb-3 transition-colors duration-300 ${
              "text-gray-700 dark:text-gray-200"
            }`}>
              {t.subtitleContent}
              <span className={`text-xs ml-2 transition-colors duration-300 ${
                "text-gray-500 dark:text-gray-400"
              }`}>{t.lineNote}</span>
            </label>
            <div className="relative">
              <textarea
                aria-label={t.subtitleContent}
                value={subtitle}
                onChange={(e) => onSubtitleChange(e.target.value)}
                placeholder={placeholders.mono}
                rows={6}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-black/30 dark:focus:ring-white/30 focus:border-transparent resize-none text-sm leading-relaxed transition-all duration-200 backdrop-blur-sm ${
                  "bg-white/50 border-gray-200 text-gray-900 placeholder-gray-500 dark:bg-gray-700/50 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400"
                }`}
              />
              <div className={`absolute bottom-3 right-3 text-xs transition-colors duration-300 ${
                "text-gray-400 dark:text-gray-500"
              }`}>
                {subtitle.split('\n').length} {t.linesSuffix}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 使用提示 */}
      <div className={`border rounded-lg p-3 transition-colors duration-300 ${
        "bg-black/5 border-black/10 dark:bg-black/5 dark:border-white/10"
      }`}>
        <h4 className={`text-sm font-medium mb-1 transition-colors duration-300 ${
          "text-gray-800 dark:text-gray-200"
        }`}>{t.usageTips}</h4>
        <ul className={`text-xs space-y-1 transition-colors duration-300 ${
          "text-gray-600 dark:text-gray-400"
        }`}>
          {t.tips.map((tip, index) => (
            <li key={index}>{tip.replace(/^[^\p{L}\p{N}]+/u, '')}</li>
          ))}
        </ul>
      </div>

      {/* 快速模板 - 仅单语模式显示 */}
      {!isBilingualMode && (
        <div>
          <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
            "text-gray-700 dark:text-gray-200"
          }`}>
            {language === 'ja' ? 'プリセット' : language === 'en' ? 'Quick templates' : '快速模板'}
          </label>
          <div className="flex flex-wrap gap-2">
            {[
              '经典励志',
              '人生感悟',
              '商业智慧',
              '哲学思考',
            ].map((template) => (
              <button
                key={template}
                onClick={() => {
                  const templates = {
                    zh: {
                      '经典励志': '成功没有捷径\n只有不懈的努力\n和永不放弃的信念',
                      '人生感悟': '人生如茶\n第一道苦如生命\n第二道甜似爱情\n第三道淡若微风',
                      '商业智慧': '做生意要讲诚信\n诚信是最大的财富\n信誉比黄金更珍贵',
                      '哲学思考': '知识改变命运\n态度决定高度\n细节决定成败',
                    },
                    en: {
                      '经典励志': 'There is no shortcut to success\nonly steady effort\nand the will to never give up',
                      '人生感悟': 'Life is like tea\nthe first cup is bitter like life\nthe second sweet like love\nthe third light as a breeze',
                      '商业智慧': 'Do business with integrity\nintegrity is the greatest wealth\nreputation is worth more than gold',
                      '哲学思考': 'Knowledge changes fate\nattitude sets your height\ndetails decide success',
                    },
                    ja: {
                      '经典励志': '成功に近道はない\nあるのはたゆまぬ努力と\n決してあきらめない信念だけ',
                      '人生感悟': '人生はお茶のようなもの\n一杯目は命のように苦く\n二杯目は恋のように甘く\n三杯目はそよ風のように淡い',
                      '商业智慧': '商売には誠実さが必要だ\n誠実さこそ最大の財産\n信用は黄金よりも尊い',
                      '哲学思考': '知識は運命を変え\n姿勢は高みを決め\n細部は成否を決める',
                    },
                  };
                  onSubtitleChange((templates[language] || templates.en)[template]);
                }}
                className={`px-3 py-1 text-xs rounded-full transition-colors duration-200 ${
                  "bg-gray-100 hover:bg-gray-200 text-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300"
                }`}
              >
                {({ en: { '经典励志': 'Motivation', '人生感悟': 'Life', '商业智慧': 'Business', '哲学思考': 'Philosophy' }, ja: { '经典励志': '励まし', '人生感悟': '人生', '商业智慧': 'ビジネス', '哲学思考': '哲学' } })[language]?.[template] || template}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SubtitleInput;
