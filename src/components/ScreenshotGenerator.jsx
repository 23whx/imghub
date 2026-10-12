import { useState, useRef, useEffect } from 'react';
import HeroSelector from './HeroSelector.jsx';
import SubtitleInput from './SubtitleInput.jsx';
import CanvasPreview from './CanvasPreview.jsx';
import Controls from './Controls.jsx';
import { Download, Settings } from 'lucide-react';
import { useStore } from '@nanostores/react';
import { language as languageStore, syncLanguageFromLocale } from '../stores/globalStore';

// 默认台词跟随页面语言
const defaultSubtitles = {
  zh: '如果你不够优秀\n人脉是不值钱的\n它不是追求来的\n而是吸引来的\n只有等价的交换\n才能得到合理的帮助\n虽然听起来很冷\n但这是事实',
  en: 'If you are not good enough\nconnections are worthless\nThey are not chased\nbut attracted\nOnly an equal exchange\nbrings real help\nIt may sound cold\nbut it is the truth',
  ja: '自分が優れていなければ\n人脈に価値はない\n人脈は追いかけるものではなく\n引き寄せるものだ\n対等な交換だけが\n本当の助けをもたらす\n冷たく聞こえるかもしれないが\nそれが事実だ',
};

const ScreenshotGenerator = ({ lang: langProp }) => {
  const languageFromStore = useStore(languageStore);
  const language = langProp || languageFromStore;

  useEffect(() => {
    if (langProp) syncLanguageFromLocale(langProp);
  }, [langProp]);
  const [selectedHero, setSelectedHero] = useState('jobs');
  const [customImage, setCustomImage] = useState(null);
  const [subtitle, setSubtitle] = useState(defaultSubtitles[language] || defaultSubtitles.en);
  const [subtitleType, setSubtitleType] = useState('mono');
  const [fontSize, setFontSize] = useState(36);
  const [lineHeight, setLineHeight] = useState(1.5);
  const [textAlign, setTextAlign] = useState('center');
  const [verticalPosition, setVerticalPosition] = useState('bottom');
  const [fontFamily, setFontFamily] = useState('default');
  const [textColor, setTextColor] = useState('#ffffff');
  const [showControls, setShowControls] = useState(false);
  // 样式面板在左栏底部，打开后滚动到它，否则用户看不到点击的结果
  useEffect(() => {
    if (showControls) document.getElementById('subtitle-settings')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [showControls]);
  const canvasRef = useRef(null);

  // 语言配置
  const languages = {
    en: {
      title: 'ImgHub - Image Generator',
      subtitle: '"If there is a screenshot, it must be true"',
      styleSettings: 'Style Settings',
      saveImage: 'Save Image',
      selectHero: 'Select Celebrity Background',
      uploadImage: 'Upload Custom Image',
      subtitleContent: 'Subtitle Content',
      realTimePreview: 'Real-time Preview',
    },
    zh: {
      title: '字幕截图生成器',
      subtitle: '"都有截图了一定是真的"',
      styleSettings: '样式设置',
      saveImage: '保存图片',
      selectHero: '选择名人背景',
      uploadImage: '上传本机图片',
      subtitleContent: '台词内容',
      realTimePreview: '实时预览',
    },
    ja: {
      title: '字幕スクリーンショット生成器',
      subtitle: '"スクリーンショットがあれば、それは真実に違いない"',
      styleSettings: 'スタイル設定',
      saveImage: '画像を保存',
      selectHero: '有名人の背景を選択',
      uploadImage: 'カスタム画像をアップロード',
      subtitleContent: '字幕内容',
      realTimePreview: 'リアルタイムプレビュー',
    }
  };

  const t = languages[language] || languages.en;

  const handleExport = () => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const link = document.createElement('a');
      link.download = 'imghub-generated.png';
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  return (
    <div className="tool-shell subtitle-workspace">
      <div className="subtitle-toolbar">
        <button type="button" aria-expanded={showControls} aria-controls="subtitle-settings" onClick={() => setShowControls(!showControls)}><Settings size={16} />{t.styleSettings}</button>
        <button type="button" className="studio-button" onClick={handleExport}><Download size={16} />{t.saveImage}</button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 lg:gap-7">
        <div className="lg:col-span-2 space-y-5 order-2 lg:order-1">
          <section className="studio-panel"><h2 className="mb-4">{t.selectHero}</h2><HeroSelector selectedHero={selectedHero} onHeroChange={setSelectedHero} customImage={customImage} onCustomImageChange={setCustomImage} language={language} /></section>
          <section className="studio-panel"><h2 className="mb-4">{t.subtitleContent}</h2><SubtitleInput subtitle={subtitle} onSubtitleChange={setSubtitle} subtitleType={subtitleType} onSubtitleTypeChange={setSubtitleType} language={language} /></section>
          {showControls && <section id="subtitle-settings" className="studio-panel"><h2 className="mb-4">{t.styleSettings}</h2><Controls fontSize={fontSize} onFontSizeChange={setFontSize} lineHeight={lineHeight} onLineHeightChange={setLineHeight} textAlign={textAlign} onTextAlignChange={setTextAlign} verticalPosition={verticalPosition} onVerticalPositionChange={setVerticalPosition} fontFamily={fontFamily} onFontFamilyChange={setFontFamily} textColor={textColor} onTextColorChange={setTextColor} language={language} /></section>}
        </div>
        <div className="lg:col-span-3 order-1 lg:order-2 self-start"><section className="studio-panel subtitle-preview"><h2 className="mb-4">{t.realTimePreview}</h2><CanvasPreview ref={canvasRef} selectedHero={selectedHero} customImage={customImage} subtitle={subtitle} subtitleType={subtitleType} fontSize={fontSize} lineHeight={lineHeight} textAlign={textAlign} verticalPosition={verticalPosition} fontFamily={fontFamily} textColor={textColor} language={language} /></section></div>
      </div>
    </div>
  );
};
export default ScreenshotGenerator;
