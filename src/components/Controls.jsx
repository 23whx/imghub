import { Type } from 'lucide-react';

const Controls = ({
  fontSize,
  onFontSizeChange,
  lineHeight,
  onLineHeightChange,
  textAlign,
  onTextAlignChange,
  verticalPosition,
  onVerticalPositionChange,
  fontFamily,
  onFontFamilyChange,
  textColor,
  onTextColorChange,
  language
}) => {
  // 语言配置
  const languages = {
    en: {
      fontSize: 'Font Size',
      lineHeight: 'Line Height',
      textAlign: 'Alignment',
      alignLeft: 'Left',
      alignCenter: 'Center',
      alignRight: 'Right',
      verticalPosition: 'Position on Image',
      positionTop: 'Top',
      positionMiddle: 'Middle',
      positionBottom: 'Bottom',
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
      lineHeight: '行高',
      textAlign: '对齐方式',
      alignLeft: '左对齐',
      alignCenter: '居中',
      alignRight: '右对齐',
      verticalPosition: '首段位置',
      positionTop: '顶部',
      positionMiddle: '中间',
      positionBottom: '底部',
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
      lineHeight: '行の高さ',
      textAlign: '配置',
      alignLeft: '左揃え',
      alignCenter: '中央',
      alignRight: '右揃え',
      verticalPosition: '最初の字幕の位置',
      positionTop: '上',
      positionMiddle: '中央',
      positionBottom: '下',
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
          "text-gray-700 dark:text-gray-200"
        }`}>
          <Type className="w-4 h-4 mr-2" />
          {t.fontSize}
          <span className="ml-auto font-semibold">{fontSize}px</span>
        </label>
        <div className="relative">
          <input
            type="range"
            min="20"
            max="80"
            value={fontSize}
            onChange={(e) => onFontSizeChange(Number(e.target.value))}
            className="w-full accent-neutral-900 dark:accent-white"
          />
          <div className={`flex justify-between text-xs mt-1 transition-colors duration-300 ${
            "text-gray-400 dark:text-gray-400"
          }`}>
            <span>20px</span>
            <span>50px</span>
            <span>80px</span>
          </div>
        </div>
      </div>

      {/* 行高（单语模式） */}
      <div>
        <label className="flex items-center text-sm font-medium mb-3 text-gray-700 dark:text-gray-200">
          {t.lineHeight}
          <span className="ml-auto font-semibold">{lineHeight.toFixed(1)}</span>
        </label>
        <input
          type="range"
          min="1"
          max="2.5"
          step="0.1"
          value={lineHeight}
          onChange={(e) => onLineHeightChange(Number(e.target.value))}
          className="w-full accent-neutral-900 dark:accent-white"
        />
      </div>

      {/* 对齐方式与首段位置 */}
      {[
        { label: t.textAlign, value: textAlign, onChange: onTextAlignChange, options: [['left', t.alignLeft], ['center', t.alignCenter], ['right', t.alignRight]] },
        { label: t.verticalPosition, value: verticalPosition, onChange: onVerticalPositionChange, options: [['top', t.positionTop], ['middle', t.positionMiddle], ['bottom', t.positionBottom]] },
      ].map((group) => (
        <div key={group.label}>
          <label className="block text-sm font-medium mb-3 text-gray-700 dark:text-gray-200">
            {group.label}
          </label>
          <div className="grid grid-cols-3 gap-2">
            {group.options.map(([value, name]) => (
              <button
                key={value}
                type="button"
                aria-pressed={group.value === value}
                onClick={() => group.onChange(value)}
                className={`px-3 py-2 text-xs rounded-lg transition-colors duration-200 ${
                  group.value === value
                    ? "bg-neutral-900 text-white dark:bg-white dark:text-black"
                    : "bg-gray-50 hover:bg-gray-100 text-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300"
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* 字体选择 */}
      <div>
        <label className={`block text-sm font-medium mb-3 transition-colors duration-300 ${
          "text-gray-700 dark:text-gray-200"
        }`}>
          {t.fontStyle}
        </label>
        <select
          value={fontFamily}
          onChange={(e) => onFontFamilyChange(e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-black/30 dark:focus:ring-white/30 focus:border-transparent text-sm transition-colors duration-300 ${
            "bg-white border-gray-200 text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
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
          "text-gray-700 dark:text-gray-200"
        }`}>
          {t.textColor}
        </label>
        <div className="flex items-center space-x-3">
          <input
            type="color"
            value={textColor}
            onChange={(e) => onTextColorChange(e.target.value)}
            className={`w-12 h-10 border rounded-lg cursor-pointer transition-colors duration-300 ${
              "border-gray-200 dark:border-gray-600"
            }`}
          />
          <div className="flex-1">
            <input
              type="text"
              value={textColor}
              onChange={(e) => onTextColorChange(e.target.value)}
              placeholder="#ffffff"
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-black/30 dark:focus:ring-white/30 focus:border-transparent transition-colors duration-300 ${
                "bg-white border-gray-200 text-gray-900 placeholder-gray-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400"
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
                "border-gray-300 dark:border-gray-600"
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
          "text-gray-700 dark:text-gray-200"
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
              className={`px-3 py-2 text-xs rounded-lg transition-colors duration-200 ${
                "bg-gray-50 hover:bg-gray-100 text-gray-600 hover:text-black dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300 dark:hover:text-white"
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
