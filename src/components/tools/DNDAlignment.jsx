import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { Upload, Download, X, Move, ZoomIn } from 'lucide-react';
import { language } from '../../stores/globalStore';
import ErrorBoundary from '../ErrorBoundary';

const DNDAlignmentContent = () => {
  const $language = useStore(language);
  const canvasRef = useRef(null);
  // 状态结构升级：存储对象 { img, src, x, y, scale }
  const [gridItems, setGridItems] = useState(Array(9).fill(null));
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const translations = {
    zh: {
      title: 'DND阵营九宫格生成器',
      subtitle: '上传9张图片，创建DND阵营对比图',
      uploadTitle: '上传图片',
      changeImage: '更换图片',
      clickToUpload: '点击上传',
      download: '下载九宫格图片',
      preview: '实时预览',
      adjustTitle: '调整图片',
      scale: '缩放',
      posX: '水平位置',
      posY: '垂直位置',
      alignments: [
        { label: '守序善良', subtitle: 'Lawful Good' },
        { label: '中立善良', subtitle: 'Neutral Good' },
        { label: '混乱善良', subtitle: 'Chaotic Good' },
        { label: '守序中立', subtitle: 'Lawful Neutral' },
        { label: '完全中立', subtitle: 'True Neutral' },
        { label: '混乱中立', subtitle: 'Chaotic Neutral' },
        { label: '守序邪恶', subtitle: 'Lawful Evil' },
        { label: '中立邪恶', subtitle: 'Neutral Evil' },
        { label: '混乱邪恶', subtitle: 'Chaotic Evil' },
      ]
    },
    en: {
      title: 'DND Alignment Chart Generator',
      subtitle: 'Upload 9 images to create a DND alignment chart',
      uploadTitle: 'Upload Images',
      changeImage: 'Change Image',
      clickToUpload: 'Click to Upload',
      download: 'Download Chart',
      preview: 'Live Preview',
      adjustTitle: 'Adjust Image',
      scale: 'Scale',
      posX: 'Position X',
      posY: 'Position Y',
      alignments: [
        { label: 'Lawful Good', subtitle: '' },
        { label: 'Neutral Good', subtitle: '' },
        { label: 'Chaotic Good', subtitle: '' },
        { label: 'Lawful Neutral', subtitle: '' },
        { label: 'True Neutral', subtitle: '' },
        { label: 'Chaotic Neutral', subtitle: '' },
        { label: 'Lawful Evil', subtitle: '' },
        { label: 'Neutral Evil', subtitle: '' },
        { label: 'Chaotic Evil', subtitle: '' },
      ]
    },
    ja: {
      title: 'DND属性マトリックス作成',
      subtitle: '9枚の画像をアップロードしてDND属性図を作成',
      uploadTitle: '画像アップロード',
      changeImage: '画像変更',
      clickToUpload: 'アップロード',
      download: '画像をダウンロード',
      preview: 'プレビュー',
      adjustTitle: '画像調整',
      scale: '拡大/縮小',
      posX: '水平位置',
      posY: '垂直位置',
      alignments: [
        { label: '秩序・善', subtitle: 'Lawful Good' },
        { label: '中立・善', subtitle: 'Neutral Good' },
        { label: '混沌・善', subtitle: 'Chaotic Good' },
        { label: '秩序・中立', subtitle: 'Lawful Neutral' },
        { label: '真なる中立', subtitle: 'True Neutral' },
        { label: '混沌・中立', subtitle: 'Chaotic Neutral' },
        { label: '秩序・悪', subtitle: 'Lawful Evil' },
        { label: '中立・悪', subtitle: 'Neutral Evil' },
        { label: '混沌・悪', subtitle: 'Chaotic Evil' },
      ]
    }
  };

  const currentLang = mounted ? $language : 'zh';
  const t = translations[currentLang] || translations.zh;

  useEffect(() => {
    drawCanvas();
  }, [gridItems, currentLang]);

  const handleImageUpload = (index, event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const newItems = [...gridItems];
        newItems[index] = {
          img: img,
          src: e.target.result,
          x: 0,
          y: 0,
          scale: 1
        };
        setGridItems(newItems);
        setSelectedIndex(index); // 自动选中新上传的图片进行编辑
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (index) => {
    const newItems = [...gridItems];
    newItems[index] = null;
    setGridItems(newItems);
    if (selectedIndex === index) setSelectedIndex(null);
  };

  const updateImageConfig = (key, value) => {
    if (selectedIndex === null) return;
    const newItems = [...gridItems];
    if (newItems[selectedIndex]) {
      newItems[selectedIndex] = {
        ...newItems[selectedIndex],
        [key]: value
      };
      setGridItems(newItems);
    }
  };

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // 清空画布 - 黑色背景
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    const cellWidth = width / 3;
    const cellHeight = height / 3;
    const padding = 10;

    for (let i = 0; i < 9; i++) {
      const row = Math.floor(i / 3);
      const col = i % 3;
      const x = col * cellWidth;
      const y = row * cellHeight;

      // 绘制边框 (黑色，实际上是间隔)
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, cellWidth, cellHeight);

      // 绘制图片
      if (gridItems[i]) {
        const item = gridItems[i];
        const img = item.img;
        const imgAspect = img.width / img.height;
        const cellAspect = cellWidth / (cellHeight - 60);

        // 计算基础适配尺寸 (contain/cover逻辑)
        let baseDrawWidth, baseDrawHeight, baseOffsetX, baseOffsetY;

        if (imgAspect > cellAspect) {
          baseDrawHeight = cellHeight - 60 - padding * 2;
          baseDrawWidth = baseDrawHeight * imgAspect;
          baseOffsetX = x + (cellWidth - baseDrawWidth) / 2;
          baseOffsetY = y + padding;
        } else {
          baseDrawWidth = cellWidth - padding * 2;
          baseDrawHeight = baseDrawWidth / imgAspect;
          baseOffsetX = x + padding;
          baseOffsetY = y + (cellHeight - 60 - baseDrawHeight) / 2;
        }

        // 应用用户调整
        const scale = item.scale || 1;
        const userX = item.x || 0;
        const userY = item.y || 0;

        // 缩放是从中心点开始的
        const centerX = baseOffsetX + baseDrawWidth / 2;
        const centerY = baseOffsetY + baseDrawHeight / 2;

        const finalWidth = baseDrawWidth * scale;
        const finalHeight = baseDrawHeight * scale;
        
        // 最终绘制坐标 = 中心点 + 用户位移 - 最终宽高的一半
        const finalX = centerX + userX - finalWidth / 2;
        const finalY = centerY + userY - finalHeight / 2;

        ctx.save();
        ctx.beginPath();
        // 裁剪区域（除去底部文字区域）
        ctx.rect(x + padding, y + padding, cellWidth - padding * 2, cellHeight - 60 - padding);
        ctx.clip();
        ctx.drawImage(img, finalX, finalY, finalWidth, finalHeight);
        ctx.restore();
      } else {
        // 绘制占位符
        ctx.fillStyle = '#1f2937';
        ctx.fillRect(x + padding, y + padding, cellWidth - padding * 2, cellHeight - 60 - padding);
        
        ctx.fillStyle = '#6b7280';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(t.clickToUpload, x + cellWidth / 2, y + (cellHeight - 60) / 2);
      }

      // 绘制标签背景
      ctx.fillStyle = '#000000';
      ctx.fillRect(x, y + cellHeight - 60, cellWidth, 60);

      // 绘制标签文字
      const currentAlignment = t.alignments[i];
      
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      if (currentAlignment.subtitle) {
        ctx.font = 'bold 24px Arial';
        ctx.fillText(currentAlignment.label, x + cellWidth / 2, y + cellHeight - 38);
        
        ctx.fillStyle = '#9ca3af';
        ctx.font = '14px Arial';
        ctx.fillText(currentAlignment.subtitle, x + cellWidth / 2, y + cellHeight - 15);
      } else {
        ctx.font = 'bold 20px Arial';
        ctx.fillText(currentAlignment.label, x + cellWidth / 2, y + cellHeight - 30);
      }
      
      // 如果选中，绘制高亮边框
      if (selectedIndex === i) {
        ctx.strokeStyle = '#3b82f6'; // 蓝色高亮
        ctx.lineWidth = 4;
        ctx.strokeRect(x + padding - 2, y + padding - 2, cellWidth - padding * 2 + 4, cellHeight - 60 - padding + 4);
      }
    }
  };

  const handleExport = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = 'dnd-alignment.png';
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t.title}</h1>
        <p className="text-gray-600">{t.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 左侧操作区 */}
        <div className="space-y-6">
          {/* 上传网格 */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-lg font-semibold mb-4">{t.uploadTitle}</h2>
            <div className="grid grid-cols-3 gap-3">
              {t.alignments.map((alignment, index) => (
                <div 
                  key={index} 
                  className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                    selectedIndex === index ? 'border-blue-500 ring-2 ring-blue-200' : 'border-transparent'
                  }`}
                  onClick={() => gridItems[index] && setSelectedIndex(index)}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(index, e)}
                    className="hidden"
                    id={`upload-${index}`}
                  />
                  
                  {gridItems[index] ? (
                    <div className="w-full h-full relative group cursor-pointer">
                      <img
                        src={gridItems[index].src}
                        alt={alignment.label}
                        className="w-full h-full object-cover"
                        style={{
                          transform: `scale(${gridItems[index].scale}) translate(${gridItems[index].x}px, ${gridItems[index].y}px)`
                        }}
                      />
                      {/* 遮罩层：只有未选中时hover显示更换，选中时一直显示操作提示 */}
                      <div className={`absolute inset-0 bg-black/50 transition-opacity flex items-center justify-center ${
                        selectedIndex === index ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'
                      }`}>
                        <label htmlFor={`upload-${index}`} className="cursor-pointer text-white text-sm hover:underline">
                          {t.changeImage}
                        </label>
                      </div>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // 防止触发选中
                          removeImage(index);
                        }}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-10"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label
                      htmlFor={`upload-${index}`}
                      className="block w-full h-full cursor-pointer border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-purple-500 hover:bg-purple-50 transition-colors"
                    >
                      <Upload className="w-6 h-6 text-gray-400 mb-1" />
                      <span className="text-xs text-gray-500 text-center px-1">
                        {alignment.label}
                      </span>
                    </label>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 图片调整控制面板 */}
          {selectedIndex !== null && gridItems[selectedIndex] && (
            <div className="bg-white rounded-2xl shadow-lg p-6 animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Move className="w-5 h-5 text-blue-500" />
                  {t.adjustTitle}: {t.alignments[selectedIndex].label}
                </h3>
                <button 
                  onClick={() => setSelectedIndex(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                {/* 缩放控制 */}
                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                      <ZoomIn className="w-4 h-4" /> {t.scale}
                    </label>
                    <span className="text-sm text-gray-500">{gridItems[selectedIndex].scale.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="3"
                    step="0.1"
                    value={gridItems[selectedIndex].scale}
                    onChange={(e) => updateImageConfig('scale', parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>

                {/* X轴位移 */}
                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-sm font-medium text-gray-700">{t.posX}</label>
                    <span className="text-sm text-gray-500">{gridItems[selectedIndex].x}px</span>
                  </div>
                  <input
                    type="range"
                    min="-200"
                    max="200"
                    value={gridItems[selectedIndex].x}
                    onChange={(e) => updateImageConfig('x', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>

                {/* Y轴位移 */}
                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-sm font-medium text-gray-700">{t.posY}</label>
                    <span className="text-sm text-gray-500">{gridItems[selectedIndex].y}px</span>
                  </div>
                  <input
                    type="range"
                    min="-200"
                    max="200"
                    value={gridItems[selectedIndex].y}
                    onChange={(e) => updateImageConfig('y', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handleExport}
            disabled={gridItems.every(item => item === null)}
            className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg font-medium transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            <Download className="w-5 h-5" />
            <span>{t.download}</span>
          </button>
        </div>

        {/* 右侧预览区 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 lg:sticky lg:top-24 self-start">
          <h2 className="text-lg font-semibold mb-4">{t.preview}</h2>
          <div className="aspect-square bg-gray-900 rounded-lg overflow-hidden shadow-inner">
            <canvas
              ref={canvasRef}
              width={900}
              height={900}
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default function DNDAlignment(props) {
  return (
    <ErrorBoundary>
      <DNDAlignmentContent {...props} />
    </ErrorBoundary>
  );
}