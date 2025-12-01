import React from 'react';
import { Type } from 'lucide-react';

const Controls = ({
  fontSize,
  onFontSizeChange,
  fontFamily,
  onFontFamilyChange,
  textColor,
  onTextColorChange,
  isDarkMode,
  language
}) => {
  // 语言配置
  const languages = {
    en: {
      fontSize: 'Font Size',
      fontStyle: 'Font Style',
      textColor: 'Text Color',
      defaultFont: 'Default Font',
      serifFont: 'Serif Font',
      sansSerifFont: 'Sans-serif Font',
      monospaceFont: 'Monospace Font',
      cursiveFont: 'Cursive Font',
      fantasyFont: 'Fantasy Font',
      presetStyles: 'Preset Styles',
      classic: 'Classic',
      modern: 'Modern',
      formal: 'Formal',
      casual: 'Casual'
    },
    zh: {
      fontSize: '字体大小',
      fontStyle: '字体样式',
      textColor: '文字颜色',
      defaultFont: '默认字体',
      serifFont: '宋体衬线',
      sansSerifFont: '黑体无衬线',
      monospaceFont: '等宽字体',
      cursiveFont: '手写体',
      fantasyFont: '装饰字体',
      presetStyles: '预设样式',
      classic: '经典风格',
      modern: '现代简约',
      formal: '传统正式',
      casual: '活泼可爱'
    },
    ja: {
      fontSize: 'フォントサイズ',
      fontStyle: 'フォントスタイル',
      textColor: 'テキストの色',
      defaultFont: 'デフォルトフォント',
      serifFont: 'セリフフォント',
      sansSerifFont: 'サンセリフフォント',
      monospaceFont: '等幅フォント',
      cursiveFont: '筆記体フォント',
      fantasyFont: 'ファンタジーフォント',
      presetStyles: 'プリセットスタイル',
      classic: 'クラシック',
      modern: 'モダン',
      formal: 'フォーマル',
      casual: 'カジュアル'
    }
  };

  const t = languages[language] || languages.en;

  return (
    <div className="space-y-6">
      {/* 字体大小 */}
      <div>
        <label className={`flex items-center text-sm font-medium mb-3 transition-colors duration-300 ${
          isDarkMode ? 'text-gray-200' : 'text-gray-700'
        }`}>
          <Type className="w-4 h-4 mr-2" />
          {t.fontSize}
          <span className="ml-auto text-blue-600 font-semibold">{fontSize}px</span>
        </label>
        <div className="relative">
          <input
            type="range"
            min="20"
            max="80"
            value={fontSize}
            onChange={(e) => onFontSizeChange(Number(e.target.value))}
            className={`w-full h-2 rounded-lg appearance-none cursor-pointer transition-colors duration-300 ${
              isDarkMode ? 'bg-gray-600' : 'bg-gray-200'
            }`}
            style={{
              background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((fontSize - 20) / (80 - 20)) * 100}%, ${isDarkMode ? '#4b5563' : '#e5e7eb'} ${((fontSize - 20) / (80 - 20)) * 100}%, ${isDarkMode ? '#4b5563' : '#e5e7eb'} 100%)`
            }}
          />
          <div className={`flex justify-between text-xs mt-1 transition-colors duration-300 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-400'
          }`}>
            <span>20px</span>
            <span>50px</span>
            <span>80px</span>
          </div>
        </div>
      </div>

      {/* 字体选择 */}
      <div>
        <label className={`block text-sm font-medium mb-3 transition-colors duration-300 ${
          isDarkMode ? 'text-gray-200' : 'text-gray-700'
        }`}>
          {t.fontStyle}
        </label>
        <select
          value={fontFamily}
          onChange={(e) => onFontFamilyChange(e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-colors duration-300 ${
            isDarkMode 
              ? 'bg-gray-700 border-gray-600 text-gray-200' 
              : 'bg-white border-gray-200 text-gray-900'
          }`}
        >
          <option value="default">{t.defaultFont}</option>
          <option value="serif">{t.serifFont}</option>
          <option value="sans-serif">{t.sansSerifFont}</option>
          <option value="monospace">{t.monospaceFont}</option>
          <option value="cursive">{t.cursiveFont}</option>
          <option value="fantasy">{t.fantasyFont}</option>
        </select>
      </div>

      {/* 文字颜色 */}
      <div>
        <label className={`block text-sm font-medium mb-3 transition-colors duration-300 ${
          isDarkMode ? 'text-gray-200' : 'text-gray-700'
        }`}>
          {t.textColor}
        </label>
        <div className="flex items-center space-x-3">
          <input
            type="color"
            value={textColor}
            onChange={(e) => onTextColorChange(e.target.value)}
            className={`w-12 h-10 border rounded-lg cursor-pointer transition-colors duration-300 ${
              isDarkMode ? 'border-gray-600' : 'border-gray-200'
            }`}
          />
          <div className="flex-1">
            <input
              type="text"
              value={textColor}
              onChange={(e) => onTextColorChange(e.target.value)}
              placeholder="#ffffff"
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-300 ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-400' 
                  : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'
              }`}
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {['#ffffff', '#000000', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'].map((color) => (
            <button
              key={color}
              onClick={() => onTextColorChange(color)}
              className={`w-6 h-6 rounded border transition-transform hover:scale-110 ${
                isDarkMode ? 'border-gray-600' : 'border-gray-300'
              }`}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      </div>

      {/* 预设样式 */}
      <div>
        <label className={`block text-sm font-medium mb-3 transition-colors duration-300 ${
          isDarkMode ? 'text-gray-200' : 'text-gray-700'
        }`}>
          {t.presetStyles}
        </label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { name: t.classic, fontSize: 40 },
            { name: t.modern, fontSize: 36 },
            { name: t.formal, fontSize: 48 },
            { name: t.casual, fontSize: 42 },
          ].map((preset) => (
            <button
              key={preset.name}
              onClick={() => {
                onFontSizeChange(preset.fontSize);
              }}
              className={`px-3 py-2 text-xs rounded-lg transition-all duration-200 ${
                isDarkMode 
                  ? 'bg-gradient-to-r from-gray-700 to-gray-600 hover:from-blue-800 hover:to-blue-700 text-gray-300 hover:text-blue-200'
                  : 'bg-gradient-to-r from-gray-50 to-gray-100 hover:from-blue-50 hover:to-blue-100 text-gray-600 hover:text-blue-600'
              }`}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Controls;
