import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { Upload, Download, X, Move, ZoomIn } from 'lucide-react';
import { language, syncLanguageFromLocale } from '../../stores/globalStore';
import ErrorBoundary from '../ErrorBoundary';

function wrapDescription(ctx, text, maxWidth) {
  if (!text.trim()) return [];
  const lines = [];
  for (const paragraph of text.trim().split(/\r\n|\r|\n/)) {
    let line = '';
    for (const character of Array.from(paragraph)) {
      if (line && ctx.measureText(line + character).width > maxWidth) {
        const space = line.lastIndexOf(' ');
        if (space > 0) {
          lines.push(line.slice(0, space).trimEnd());
          line = line.slice(space + 1) + character;
        } else {
          lines.push(line.trimEnd());
          line = character;
        }
      } else {
        line += character;
      }
    }
    lines.push(line.trimEnd());
  }
  return lines;
}

const DNDAlignmentContent = ({ lang: langProp }) => {
  const $language = useStore(language);
  const canvasRef = useRef(null);
  // 状态结构升级：存储对象 { img, src, x, y, scale }
  const [gridItems, setGridItems] = useState(Array(9).fill(null));
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [showDescriptions, setShowDescriptions] = useState(false);
  const [descriptions, setDescriptions] = useState(Array(9).fill(''));
  const [exportError, setExportError] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (langProp) syncLanguageFromLocale(langProp);
  }, [langProp]);

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
      descriptionSettings: '阵营描述',
      showDescriptions: '在阵营下方显示描述',
      descriptionHint: '为每个阵营填写介绍或台词，预览和导出图片会同步显示。',
      descriptionPlaceholder: '写一句描述或台词…',
      descriptionFor: '描述',
      exportError: 'WebP 导出失败，请重试或使用支持 WebP 的浏览器。',
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
      descriptionSettings: 'Alignment descriptions',
      showDescriptions: 'Show descriptions below alignments',
      descriptionHint: 'Add a description or quote for each alignment. It will appear in the preview and exported image.',
      descriptionPlaceholder: 'Write a description or quote…',
      descriptionFor: 'Description',
      exportError: 'WebP export failed. Retry or use a browser that supports WebP.',
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
      descriptionSettings: '属性の説明',
      showDescriptions: '属性の下に説明を表示',
      descriptionHint: '各属性に説明やセリフを入力すると、プレビューと書き出し画像に表示されます。',
      descriptionPlaceholder: '説明やセリフを入力…',
      descriptionFor: '説明',
      exportError: 'WebP の書き出しに失敗しました。再試行するか WebP 対応ブラウザをお使いください。',
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

  const currentLang = langProp || (mounted ? $language : 'en');
  const t = translations[currentLang] || translations.en;

  useEffect(() => {
    drawCanvas();
  }, [gridItems, currentLang, showDescriptions, descriptions]);

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
    const width = 900;
    const padding = 10;
    ctx.font = '14px Arial';
    const descriptionLines = descriptions.map(text => showDescriptions ? wrapDescription(ctx, text, width / 3 - padding * 2) : []);
    const lineCount = Math.max(...descriptionLines.map(lines => lines.length));
    const descriptionHeight = lineCount ? lineCount * 18 + 20 : 0;
    const labelHeight = 60 + descriptionHeight;
    // Keep the existing photo area unchanged; descriptions extend each row below it.
    const height = (300 + descriptionHeight) * 3;
    canvas.width = width;
    canvas.height = height;

    // 清空画布 - 黑色背景
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    const cellWidth = width / 3;
    const cellHeight = height / 3;

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
        const cellAspect = cellWidth / (cellHeight - labelHeight);

        // 计算基础适配尺寸 (contain/cover逻辑)
        let baseDrawWidth, baseDrawHeight, baseOffsetX, baseOffsetY;

        if (imgAspect > cellAspect) {
          baseDrawHeight = cellHeight - labelHeight - padding * 2;
          baseDrawWidth = baseDrawHeight * imgAspect;
          baseOffsetX = x + (cellWidth - baseDrawWidth) / 2;
          baseOffsetY = y + padding;
        } else {
          baseDrawWidth = cellWidth - padding * 2;
          baseDrawHeight = baseDrawWidth / imgAspect;
          baseOffsetX = x + padding;
          baseOffsetY = y + (cellHeight - labelHeight - baseDrawHeight) / 2;
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
        ctx.rect(x + padding, y + padding, cellWidth - padding * 2, cellHeight - labelHeight - padding);
        ctx.clip();
        ctx.drawImage(img, finalX, finalY, finalWidth, finalHeight);
        ctx.restore();
      } else {
        // 绘制占位符
        ctx.fillStyle = '#1f2937';
        ctx.fillRect(x + padding, y + padding, cellWidth - padding * 2, cellHeight - labelHeight - padding);
        
        ctx.fillStyle = '#6b7280';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(t.clickToUpload, x + cellWidth / 2, y + (cellHeight - labelHeight) / 2);
      }

      // 绘制标签背景
      ctx.fillStyle = '#000000';
      const labelTop = y + cellHeight - labelHeight;
      ctx.fillRect(x, labelTop, cellWidth, labelHeight);

      // 绘制标签文字
      const currentAlignment = t.alignments[i];
      
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      if (currentAlignment.subtitle) {
        ctx.font = 'bold 24px Arial';
        ctx.fillText(currentAlignment.label, x + cellWidth / 2, labelTop + 22);
        
        ctx.fillStyle = '#9ca3af';
        ctx.font = '14px Arial';
        ctx.fillText(currentAlignment.subtitle, x + cellWidth / 2, labelTop + 45);
      } else {
        ctx.font = 'bold 20px Arial';
        ctx.fillText(currentAlignment.label, x + cellWidth / 2, labelTop + 30);
      }

      ctx.fillStyle = '#d1d5db';
      ctx.font = '14px Arial';
      ctx.textBaseline = 'top';
      descriptionLines[i].forEach((line, index) => {
        ctx.fillText(line, x + cellWidth / 2, labelTop + 68 + index * 18);
      });
      
      // 如果选中，绘制高亮边框
      if (selectedIndex === i) {
        ctx.strokeStyle = '#ffffff'; // 高亮
        ctx.lineWidth = 4;
        ctx.strokeRect(x + padding - 2, y + padding - 2, cellWidth - padding * 2 + 4, cellHeight - labelHeight - padding + 4);
      }
    }
  };

  const handleExport = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setExportError(false);
    canvas.toBlob(blob => {
      if (!blob || blob.type !== 'image/webp') {
        setExportError(true);
        return;
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = 'dnd-alignment.webp';
      link.href = url;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, 'image/webp', 0.95);
  };

  return (
    <div className="tool-shell !max-w-7xl">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
        {/* 左侧操作区 */}
        <div className="space-y-4 sm:space-y-6">
          <section className="tool-card" aria-labelledby="dnd-descriptions-title">
            <h2 id="dnd-descriptions-title" className="text-lg font-semibold mb-2">{t.descriptionSettings}</h2>
            <label className="flex items-center gap-3 min-h-11 cursor-pointer text-sm font-medium">
              <input type="checkbox" checked={showDescriptions} onChange={event => setShowDescriptions(event.target.checked)} aria-describedby="dnd-descriptions-hint" className="w-4 h-4 accent-neutral-900 dark:accent-white" />
              {t.showDescriptions}
            </label>
            <p id="dnd-descriptions-hint" className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">{t.descriptionHint}</p>
            {showDescriptions && <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              {t.alignments.map((alignment, index) => <div key={index}>
                <label htmlFor={`dnd-description-${index}`} className="flex items-center justify-between gap-2 text-sm font-medium mb-2">
                  <span>{alignment.label}</span>
                  <span className="text-xs font-normal text-neutral-500 dark:text-neutral-400">{descriptions[index].length}/300</span>
                </label>
                <textarea id={`dnd-description-${index}`} aria-label={`${alignment.label} ${t.descriptionFor}`} rows={2} maxLength={300} value={descriptions[index]} placeholder={t.descriptionPlaceholder}
                  onChange={event => setDescriptions(previous => previous.map((text, i) => i === index ? event.target.value : text))}
                  className="w-full p-3 rounded-md border border-black/15 dark:border-white/15 text-base resize-y" />
              </div>)}
            </div>}
          </section>
          {/* 上传网格 */}
          <div className="tool-card">
            <h2 className="text-lg font-semibold mb-4">{t.uploadTitle}</h2>
            <div className="grid grid-cols-3 gap-3">
              {t.alignments.map((alignment, index) => (
                <div
                  key={index}
                  className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                    selectedIndex === index ? 'border-neutral-900 dark:border-white ring-2 ring-black/10 dark:ring-white/20' : 'border-transparent'
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
                        className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80 z-10"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label
                      htmlFor={`upload-${index}`}
                      className="block w-full h-full cursor-pointer border-2 border-dashed border-black/15 dark:border-white/15 rounded-lg flex flex-col items-center justify-center hover:border-black/40 dark:hover:border-white/40 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                    >
                      <Upload className="w-6 h-6 text-neutral-400 mb-1" />
                      <span className="text-xs text-neutral-500 dark:text-neutral-400 text-center px-1">
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
            <div className="tool-card animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Move className="w-5 h-5" />
                  {t.adjustTitle}: {t.alignments[selectedIndex].label}
                </h3>
                <button
                  onClick={() => setSelectedIndex(null)}
                  className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* 缩放控制 */}
                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 flex items-center gap-1">
                      <ZoomIn className="w-4 h-4" /> {t.scale}
                    </label>
                    <span className="text-sm text-neutral-500 dark:text-neutral-400">{gridItems[selectedIndex].scale.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="3"
                    step="0.1"
                    value={gridItems[selectedIndex].scale}
                    onChange={(e) => updateImageConfig('scale', parseFloat(e.target.value))}
                    className="w-full h-2 bg-black/10 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-neutral-900 dark:accent-white"
                  />
                </div>

                {/* X轴位移 */}
                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{t.posX}</label>
                    <span className="text-sm text-neutral-500 dark:text-neutral-400">{gridItems[selectedIndex].x}px</span>
                  </div>
                  <input
                    type="range"
                    min="-200"
                    max="200"
                    value={gridItems[selectedIndex].x}
                    onChange={(e) => updateImageConfig('x', parseInt(e.target.value))}
                    className="w-full h-2 bg-black/10 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-neutral-900 dark:accent-white"
                  />
                </div>

                {/* Y轴位移 */}
                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{t.posY}</label>
                    <span className="text-sm text-neutral-500 dark:text-neutral-400">{gridItems[selectedIndex].y}px</span>
                  </div>
                  <input
                    type="range"
                    min="-200"
                    max="200"
                    value={gridItems[selectedIndex].y}
                    onChange={(e) => updateImageConfig('y', parseInt(e.target.value))}
                    className="w-full h-2 bg-black/10 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-neutral-900 dark:accent-white"
                  />
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handleExport}
            disabled={gridItems.every(item => item === null)}
            className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-neutral-900 dark:bg-white hover:bg-neutral-700 dark:hover:bg-neutral-200 text-white dark:text-black rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-5 h-5" />
            <span>{t.download} · WebP</span>
          </button>
          {exportError && <p className="text-sm text-neutral-600 dark:text-neutral-300" role="alert">{t.exportError}</p>}
        </div>

        {/* 右侧预览区 */}
        <div className="tool-card lg:sticky lg:top-24 self-start">
          <h2 className="text-lg font-semibold mb-4">{t.preview}</h2>
          <div className="bg-gray-900 rounded-lg overflow-hidden shadow-inner">
            <canvas
              ref={canvasRef}
              width={900}
              height={900}
              role="img"
              aria-label={t.preview}
              className="w-full h-auto"
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
