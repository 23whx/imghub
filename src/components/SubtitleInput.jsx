import React, { useState } from 'react';
import { Type, Globe, Languages } from 'lucide-react';

const SubtitleInput = ({ 
  subtitle, 
  onSubtitleChange, 
  subtitleType, 
  onSubtitleTypeChange, 
  isDarkMode, 
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
    { id: 'mono', name: t.monoMode, icon: Type, color: 'blue' },
    { id: 'bilingual', name: t.bilingualMode, icon: Languages, color: 'purple' },
  ];



  const placeholders = {
    mono: '如果你不够优秀\n人脉是不值钱的\n它不是追求来的\n而是吸引来的',
    bilingual: {
      top: '如果你不够优秀\n人脉是不值钱的',
      bottom: 'If you are not excellent enough\nConnections are worthless'
    }
  };

  // 处理模式变化
  const handleModeChange = (mode) => {
    if (mode === 'mono') {
      onSubtitleTypeChange('mono');
    } else {
      onSubtitleTypeChange('bilingual');
    }
  };

  const isBilingualMode = subtitleType !== 'mono';
  const currentMode = isBilingualMode ? 'bilingual' : 'mono';

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
          isDarkMode ? 'text-gray-200' : 'text-gray-700'
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
                    ? isDarkMode
                      ? mode.color === 'blue' 
                        ? 'bg-blue-900/50 text-blue-300 ring-2 ring-blue-500'
                        : 'bg-purple-900/50 text-purple-300 ring-2 ring-purple-500'
                      : mode.color === 'blue'
                        ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-500 ring-offset-1'
                        : 'bg-purple-100 text-purple-700 ring-2 ring-purple-500 ring-offset-1'
                    : isDarkMode
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {mode.name}
                {isSelected && (
                  <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${
                    mode.color === 'blue' ? 'bg-blue-500' : 'bg-purple-500'
                  }`}></div>
                )}
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
                isDarkMode ? 'text-gray-200' : 'text-gray-700'
              }`}>
                {t.topSubtitle}
                <span className={`text-xs ml-2 transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>{t.lineNote}</span>
              </label>
              <div className="relative">
                <textarea
                  value={topSubtitle}
                  onChange={(e) => {
                    setTopSubtitle(e.target.value);
                  }}
                  placeholder={placeholders.bilingual?.top || ''}
                  rows={4}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm leading-relaxed transition-all duration-200 backdrop-blur-sm ${
                    isDarkMode 
                      ? 'bg-gray-700/50 border-gray-600 text-gray-200 placeholder-gray-400' 
                      : 'bg-white/50 border-gray-200 text-gray-900 placeholder-gray-500'
                  }`}
                />
                <div className={`absolute bottom-3 right-3 text-xs transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-500' : 'text-gray-400'
                }`}>
                  {topSubtitle.split('\n').length} {t.linesSuffix}
                </div>
              </div>
            </div>

            {/* 下方字幕 */}
            <div>
              <label className={`block text-sm font-medium mb-3 transition-colors duration-300 ${
                isDarkMode ? 'text-gray-200' : 'text-gray-700'
              }`}>
                {t.bottomSubtitle}
                <span className={`text-xs ml-2 transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>{t.lineNote}</span>
              </label>
              <div className="relative">
                <textarea
                  value={bottomSubtitle}
                  onChange={(e) => {
                    setBottomSubtitle(e.target.value);
                  }}
                  placeholder={placeholders.bilingual?.bottom || ''}
                  rows={4}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm leading-relaxed transition-all duration-200 backdrop-blur-sm ${
                    isDarkMode 
                      ? 'bg-gray-700/50 border-gray-600 text-gray-200 placeholder-gray-400' 
                      : 'bg-white/50 border-gray-200 text-gray-900 placeholder-gray-500'
                  }`}
                />
                <div className={`absolute bottom-3 right-3 text-xs transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-500' : 'text-gray-400'
                }`}>
                  {bottomSubtitle.split('\n').length} {t.linesSuffix}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <label className={`block text-sm font-medium mb-3 transition-colors duration-300 ${
              isDarkMode ? 'text-gray-200' : 'text-gray-700'
            }`}>
              {t.subtitleContent}
              <span className={`text-xs ml-2 transition-colors duration-300 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>{t.lineNote}</span>
            </label>
            <div className="relative">
              <textarea
                value={subtitle}
                onChange={(e) => onSubtitleChange(e.target.value)}
                placeholder={placeholders.mono}
                rows={6}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm leading-relaxed transition-all duration-200 backdrop-blur-sm ${
                  isDarkMode 
                    ? 'bg-gray-700/50 border-gray-600 text-gray-200 placeholder-gray-400' 
                    : 'bg-white/50 border-gray-200 text-gray-900 placeholder-gray-500'
                }`}
              />
              <div className={`absolute bottom-3 right-3 text-xs transition-colors duration-300 ${
                isDarkMode ? 'text-gray-500' : 'text-gray-400'
              }`}>
                {subtitle.split('\n').length} {t.linesSuffix}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 使用提示 */}
      <div className={`border rounded-lg p-3 transition-colors duration-300 ${
        isDarkMode 
          ? 'bg-amber-900/30 border-amber-700' 
          : 'bg-amber-50 border-amber-200'
      }`}>
        <h4 className={`text-sm font-medium mb-1 transition-colors duration-300 ${
          isDarkMode ? 'text-amber-300' : 'text-amber-800'
        }`}>💡 {t.usageTips}</h4>
        <ul className={`text-xs space-y-1 transition-colors duration-300 ${
          isDarkMode ? 'text-amber-400' : 'text-amber-700'
        }`}>
          {t.tips.map((tip, index) => (
            <li key={index}>• {tip}</li>
          ))}
        </ul>
      </div>

      {/* 快速模板 - 仅单语模式显示 */}
      {!isBilingualMode && (
        <div>
          <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
            isDarkMode ? 'text-gray-200' : 'text-gray-700'
          }`}>
            快速模板
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
                    '经典励志': '成功没有捷径\n只有不懈的努力\n和永不放弃的信念',
                    '人生感悟': '人生如茶\n第一道苦如生命\n第二道甜似爱情\n第三道淡若微风',
                    '商业智慧': '做生意要讲诚信\n诚信是最大的财富\n信誉比黄金更珍贵',
                    '哲学思考': '知识改变命运\n态度决定高度\n细节决定成败',
                  };
                  onSubtitleChange(templates[template]);
                }}
                className={`px-3 py-1 text-xs rounded-full transition-colors duration-200 ${
                  isDarkMode 
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                }`}
              >
                {template}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SubtitleInput;
