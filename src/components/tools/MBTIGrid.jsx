import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { Upload, Download, X, Check, Move, ZoomIn } from 'lucide-react';
import { language } from '../../stores/globalStore';
import ErrorBoundary from '../ErrorBoundary';

const MBTIGridContent = () => {
  const $language = useStore(language);
  const canvasRef = useRef(null);
  const allMBTITypes = [
    'INTJ', 'INTP', 'ENTJ', 'ENTP',
    'INFJ', 'INFP', 'ENFJ', 'ENFP',
    'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
    'ISTP', 'ISFP', 'ESTP', 'ESFP'
  ];

  const [selectedTypes, setSelectedTypes] = useState(['INTJ', 'INTP', 'ENTJ', 'ENTP']);
  // 状态结构升级：key -> { img, src, x, y, scale }
  const [gridItems, setGridItems] = useState({});
  const [currentEditType, setCurrentEditType] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const translations = {
    zh: {
      title: 'MBTI人格图片生成器',
      subtitle: '选择MBTI类型，上传对应图片',
      uploadTitle: '上传图片',
      changeImage: '更换',
      clickToUpload: '点击上传',
      download: '下载MBTI图片',
      preview: '实时预览',
      selectTypes: '选择MBTI类型',
      adjustTitle: '调整图片',
      scale: '缩放',
      posX: '水平位置',
      posY: '垂直位置',
    },
    en: {
      title: 'MBTI Grid Generator',
      subtitle: 'Select MBTI types and upload images',
      uploadTitle: 'Upload Images',
      changeImage: 'Change',
      clickToUpload: 'Upload',
      download: 'Download',
      preview: 'Live Preview',
      selectTypes: 'Select MBTI Types',
      adjustTitle: 'Adjust Image',
      scale: 'Scale',
      posX: 'Position X',
      posY: 'Position Y',
    },
    ja: {
      title: 'MBTI性格画像ジェネレーター',
      subtitle: 'MBTIタイプを選択して画像をアップロード',
      uploadTitle: '画像アップロード',
      changeImage: '変更',
      clickToUpload: 'アップロード',
      download: 'ダウンロード',
      preview: 'プレビュー',
      selectTypes: 'MBTIタイプ選択',
      adjustTitle: '画像調整',
      scale: '拡大/縮小',
      posX: '水平位置',
      posY: '垂直位置',
    }
  };

  const currentLang = mounted ? $language : 'zh';
  const t = translations[currentLang] || translations.zh;

  useEffect(() => {
    drawCanvas();
  }, [selectedTypes, gridItems, currentLang]);

  const toggleType = (type) => {
    if (selectedTypes.includes(type)) {
      if (selectedTypes.length > 1) {
        setSelectedTypes(selectedTypes.filter(t => t !== type));
        const newItems = { ...gridItems };
        delete newItems[type];
        setGridItems(newItems);
        if (currentEditType === type) setCurrentEditType(null);
      }
    } else {
      if (selectedTypes.length < 16) {
        setSelectedTypes([...selectedTypes, type]);
      }
    }
  };

  const handleImageUpload = (type, event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setGridItems(prev => ({
          ...prev,
          [type]: {
            img: img,
            src: e.target.result,
            x: 0,
            y: 0,
            scale: 1
          }
        }));
        setCurrentEditType(type); // 自动选中
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (type) => {
    const newItems = { ...gridItems };
    delete newItems[type];
    setGridItems(newItems);
    if (currentEditType === type) setCurrentEditType(null);
  };

  const updateImageConfig = (key, value) => {
    if (!currentEditType || !gridItems[currentEditType]) return;
    setGridItems(prev => ({
      ...prev,
      [currentEditType]: {
        ...prev[currentEditType],
        [key]: value
      }
    }));
  };

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const numTypes = selectedTypes.length;
    const cols = Math.ceil(Math.sqrt(numTypes));
    const rows = Math.ceil(numTypes / cols);

    canvas.width = cols * 300;
    canvas.height = rows * 300;

    const ctx = canvas.getContext('2d');
    // 黑色背景
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const cellWidth = canvas.width / cols;
    const cellHeight = canvas.height / rows;
    const padding = 10;

    selectedTypes.forEach((type, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      const x = col * cellWidth;
      const y = row * cellHeight;

      // 绘制边框 (黑色间隔)
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, cellWidth, cellHeight);

      // 绘制图片
      if (gridItems[type]) {
        const item = gridItems[type];
        const img = item.img;
        const imgAspect = img.width / img.height;
        const cellAspect = cellWidth / (cellHeight - 50);

        let baseDrawWidth, baseDrawHeight, baseOffsetX, baseOffsetY;

        if (imgAspect > cellAspect) {
          baseDrawHeight = cellHeight - 50 - padding * 2;
          baseDrawWidth = baseDrawHeight * imgAspect;
          baseOffsetX = x + (cellWidth - baseDrawWidth) / 2;
          baseOffsetY = y + padding;
        } else {
          baseDrawWidth = cellWidth - padding * 2;
          baseDrawHeight = baseDrawWidth / imgAspect;
          baseOffsetX = x + padding;
          baseOffsetY = y + (cellHeight - 50 - baseDrawHeight) / 2;
        }

        // 应用用户调整
        const scale = item.scale || 1;
        const userX = item.x || 0;
        const userY = item.y || 0;

        const centerX = baseOffsetX + baseDrawWidth / 2;
        const centerY = baseOffsetY + baseDrawHeight / 2;

        const finalWidth = baseDrawWidth * scale;
        const finalHeight = baseDrawHeight * scale;
        
        const finalX = centerX + userX - finalWidth / 2;
        const finalY = centerY + userY - finalHeight / 2;

        ctx.save();
        ctx.beginPath();
        ctx.rect(x + padding, y + padding, cellWidth - padding * 2, cellHeight - 50 - padding);
        ctx.clip();
        ctx.drawImage(img, finalX, finalY, finalWidth, finalHeight);
        ctx.restore();
      } else {
        // 绘制占位符
        ctx.fillStyle = '#1f2937';
        ctx.fillRect(x + padding, y + padding, cellWidth - padding * 2, cellHeight - 50 - padding);
        
        ctx.fillStyle = '#6b7280';
        ctx.font = '18px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(t.clickToUpload, x + cellWidth / 2, y + (cellHeight - 50) / 2);
      }

      // 绘制MBTI标签
      ctx.fillStyle = '#000000';
      ctx.fillRect(x, y + cellHeight - 50, cellWidth, 50);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(type, x + cellWidth / 2, y + cellHeight - 25);

      // 高亮选中框
      if (currentEditType === type) {
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 4;
        ctx.strokeRect(x + padding - 2, y + padding - 2, cellWidth - padding * 2 + 4, cellHeight - 50 - padding + 4);
      }
    });
  };

  const handleExport = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = 'mbti-grid.png';
    link.href = canvas.toDataURL();
    link.click();
  };

  const getGridLayout = () => {
    const numTypes = selectedTypes.length;
    if (numTypes <= 4) return 'grid-cols-2';
    if (numTypes <= 9) return 'grid-cols-3';
    return 'grid-cols-4';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t.title}</h1>
        <p className="text-gray-600">{t.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 左侧控制区 */}
        <div className="space-y-6">
          {/* MBTI类型选择 */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-lg font-semibold mb-4">
              {t.selectTypes} ({selectedTypes.length}/16)
            </h2>
            <div className="grid grid-cols-4 gap-2">
              {allMBTITypes.map((type) => (
                <button
                  key={type}
                  onClick={() => toggleType(type)}
                  className={`relative px-3 py-2 rounded-lg font-medium text-sm transition-all ${
                    selectedTypes.includes(type)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {type}
                  {selectedTypes.includes(type) && (
                    <Check className="w-3 h-3 absolute top-1 right-1" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 图片上传区 */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-lg font-semibold mb-4">{t.uploadTitle}</h2>
            <div className={`grid ${getGridLayout()} gap-3`}>
              {selectedTypes.map((type) => (
                <div 
                  key={type} 
                  className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                    currentEditType === type ? 'border-blue-500 ring-2 ring-blue-200' : 'border-transparent'
                  }`}
                  onClick={() => gridItems[type] && setCurrentEditType(type)}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(type, e)}
                    className="hidden"
                    id={`upload-${type}`}
                  />
                  
                  {gridItems[type] ? (
                    <div className="w-full h-full relative group cursor-pointer">
                      <img
                        src={gridItems[type].src}
                        alt={type}
                        className="w-full h-full object-cover"
                        style={{
                          transform: `scale(${gridItems[type].scale}) translate(${gridItems[type].x}px, ${gridItems[type].y}px)`
                        }}
                      />
                      <div className={`absolute inset-0 bg-black/50 transition-opacity flex items-center justify-center ${
                        currentEditType === type ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'
                      }`}>
                        <label htmlFor={`upload-${type}`} className="cursor-pointer text-white text-sm hover:underline">
                          {t.changeImage}
                        </label>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeImage(type);
                        }}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-10"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 bg-blue-500 text-white text-xs py-1 text-center font-bold pointer-events-none">
                        {type}
                      </div>
                    </div>
                  ) : (
                    <label
                      htmlFor={`upload-${type}`}
                      className="block w-full h-full cursor-pointer border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-blue-500 hover:bg-blue-50 transition-colors"
                    >
                      <Upload className="w-5 h-5 text-gray-400 mb-1" />
                      <span className="text-xs text-gray-600 font-bold">{type}</span>
                    </label>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 调整面板 */}
          {currentEditType && gridItems[currentEditType] && (
            <div className="bg-white rounded-2xl shadow-lg p-6 animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Move className="w-5 h-5 text-blue-500" />
                  {t.adjustTitle}: {currentEditType}
                </h3>
                <button 
                  onClick={() => setCurrentEditType(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                {/* 缩放 */}
                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                      <ZoomIn className="w-4 h-4" /> {t.scale}
                    </label>
                    <span className="text-sm text-gray-500">{gridItems[currentEditType].scale.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="3"
                    step="0.1"
                    value={gridItems[currentEditType].scale}
                    onChange={(e) => updateImageConfig('scale', parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>

                {/* X位移 */}
                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-sm font-medium text-gray-700">{t.posX}</label>
                    <span className="text-sm text-gray-500">{gridItems[currentEditType].x}px</span>
                  </div>
                  <input
                    type="range"
                    min="-200"
                    max="200"
                    value={gridItems[currentEditType].x}
                    onChange={(e) => updateImageConfig('x', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>

                {/* Y位移 */}
                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-sm font-medium text-gray-700">{t.posY}</label>
                    <span className="text-sm text-gray-500">{gridItems[currentEditType].y}px</span>
                  </div>
                  <input
                    type="range"
                    min="-200"
                    max="200"
                    value={gridItems[currentEditType].y}
                    onChange={(e) => updateImageConfig('y', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handleExport}
            disabled={Object.keys(gridItems).length === 0}
            className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-lg font-medium transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            <Download className="w-5 h-5" />
            <span>{t.download}</span>
          </button>
        </div>

        {/* 右侧预览区 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 lg:sticky lg:top-24 self-start">
          <h2 className="text-lg font-semibold mb-4">{t.preview}</h2>
          <div className="bg-gray-900 rounded-lg overflow-hidden shadow-inner">
            <canvas
              ref={canvasRef}
              className="w-full h-auto"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default function MBTIGrid(props) {
  return (
    <ErrorBoundary>
      <MBTIGridContent {...props} />
    </ErrorBoundary>
  );
}