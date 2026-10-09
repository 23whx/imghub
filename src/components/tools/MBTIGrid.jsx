import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { Upload, Download, X, Check, Move, ZoomIn } from 'lucide-react';
import { language, syncLanguageFromLocale } from '../../stores/globalStore';
import ErrorBoundary from '../ErrorBoundary';
import { mbtiGroups, mbtiTypes, mbtiCharacterSrc, mbtiGroupSrc } from '../../data/mbti.js';

const MBTIGridContent = ({ lang: langProp }) => {
  const $language = useStore(language);
  const canvasRef = useRef(null);
  const allMBTITypes = mbtiTypes;

  const [selectedTypes, setSelectedTypes] = useState(mbtiTypes);
  // 状态结构升级：key -> { img, src, x, y, scale }
  const [gridItems, setGridItems] = useState({});
  const [currentEditType, setCurrentEditType] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [loadingSamples, setLoadingSamples] = useState(true);
  const [error, setError] = useState(null);
  const sampleLoadsRef = useRef(null);
  const sampleCacheRef = useRef({});

  const loadSamples = () => {
    if (!sampleLoadsRef.current) {
      sampleLoadsRef.current = Promise.all(mbtiTypes.map(type => new Promise((resolve, reject) => {
        const img = new Image();
        const src = mbtiCharacterSrc(type);
        img.onload = () => resolve([type, { img, src, x: 0, y: 0, scale: 1, example: true }]);
        img.onerror = reject;
        img.src = src;
      }))).then(entries => {
        sampleCacheRef.current = Object.fromEntries(entries);
        return sampleCacheRef.current;
      }).catch(reason => {
        sampleLoadsRef.current = null;
        throw reason;
      });
    }
    return sampleLoadsRef.current;
  };

  useEffect(() => {
    let cancelled = false;
    loadSamples().then(items => {
      if (!cancelled) setGridItems(previous => ({ ...items, ...previous }));
    }).catch(() => {
      if (!cancelled) setError('sampleError');
    }).finally(() => {
      if (!cancelled) setLoadingSamples(false);
    });
    return () => { cancelled = true; };
  }, []);

  const applyExample = async (types) => {
    setLoadingSamples(true);
    setError(null);
    try {
      const samples = await loadSamples();
      setSelectedTypes(types);
      setGridItems(Object.fromEntries(types.map(type => [type, { ...samples[type] }])));
      setCurrentEditType(null);
    } catch {
      setError('sampleError');
    } finally {
      setLoadingSamples(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    if (langProp) syncLanguageFromLocale(langProp);
  }, [langProp]);

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
      examples: '从一组人格开始',
      exampleHint: '纸雕角色案例，可直接使用，也可以上传自己的图片。',
      useExample: '使用这组案例',
      useAll: '使用完整16人格',
      loading: '正在载入案例…',
      sampleError: '案例载入失败，请点击案例重试。',
      exportError: 'WebP 导出失败，请重试或使用支持 WebP 的浏览器。',
      remove: '移除图片',
      close: '关闭调整面板',
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
      examples: 'Start with a personality group',
      exampleHint: 'Use the papercraft examples or upload your own images.',
      useExample: 'Use this example',
      useAll: 'Use all 16 personalities',
      loading: 'Loading examples…',
      sampleError: 'Examples could not load. Select an example to retry.',
      exportError: 'WebP export failed. Retry or use a browser that supports WebP.',
      remove: 'Remove image',
      close: 'Close adjustments',
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
      examples: '性格グループから始める',
      exampleHint: 'ペーパークラフトの作例を使うか、自分の画像をアップロードできます。',
      useExample: 'この作例を使う',
      useAll: '全16タイプを使う',
      loading: '作例を読み込み中…',
      sampleError: '作例を読み込めませんでした。作例を選んで再試行してください。',
      exportError: 'WebP の書き出しに失敗しました。再試行するか WebP 対応ブラウザをお使いください。',
      remove: '画像を削除',
      close: '調整を閉じる',
    }
  };

  const currentLang = langProp || (mounted ? $language : 'en');
  const t = translations[currentLang] || translations.en;

  useEffect(() => {
    drawCanvas();
  }, [selectedTypes, gridItems, currentLang]);

  const toggleType = (type) => {
    if (selectedTypes.includes(type)) {
      if (selectedTypes.length > 1) {
        setSelectedTypes(selectedTypes.filter(t => t !== type));
        if (currentEditType === type) setCurrentEditType(null);
      }
    } else {
      if (selectedTypes.length < 16) {
        setSelectedTypes([...selectedTypes, type]);
        if (!gridItems[type] && sampleCacheRef.current[type]) {
          setGridItems(previous => ({ ...previous, [type]: { ...sampleCacheRef.current[type] } }));
        }
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
    ctx.fillStyle = '#f4f0e8';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const cellWidth = canvas.width / cols;
    const cellHeight = canvas.height / rows;
    const padding = 10;

    selectedTypes.forEach((type, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      const x = col * cellWidth;
      const y = row * cellHeight;

      ctx.strokeStyle = '#d5cbbb';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, cellWidth, cellHeight);

      // 绘制图片
      if (gridItems[type]) {
        const item = gridItems[type];
        const img = item.img;
        const imgAspect = img.width / img.height;
        const cellAspect = cellWidth / (cellHeight - 50);

        let baseDrawWidth, baseDrawHeight, baseOffsetX, baseOffsetY;

        if (item.example) {
          const fit = Math.min((cellWidth - padding * 2) / img.width, (cellHeight - 50 - padding * 2) / img.height);
          baseDrawWidth = img.width * fit;
          baseDrawHeight = img.height * fit;
          baseOffsetX = x + (cellWidth - baseDrawWidth) / 2;
          baseOffsetY = y + (cellHeight - 50 - baseDrawHeight) / 2;
        } else if (imgAspect > cellAspect) {
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
        ctx.fillStyle = '#eee8dd';
        ctx.fillRect(x + padding, y + padding, cellWidth - padding * 2, cellHeight - 50 - padding);
        
        ctx.fillStyle = '#75685b';
        ctx.font = '18px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(t.clickToUpload, x + cellWidth / 2, y + (cellHeight - 50) / 2);
      }

      // 绘制MBTI标签
      ctx.fillStyle = '#fffdf8';
      ctx.fillRect(x, y + cellHeight - 50, cellWidth, 50);

      ctx.fillStyle = '#2c251e';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(type, x + cellWidth / 2, y + cellHeight - 25);

    });
  };

  const handleExport = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setError(null);
    canvas.toBlob(blob => {
      if (!blob || blob.type !== 'image/webp') {
        setError('exportError');
        return;
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = 'mbti-grid.webp';
      link.href = url;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, 'image/webp', 0.95);
  };

  const getGridLayout = () => {
    const numTypes = selectedTypes.length;
    if (numTypes <= 4) return 'grid-cols-2';
    if (numTypes <= 9) return 'grid-cols-2 sm:grid-cols-3';
    return 'grid-cols-2 sm:grid-cols-4';
  };

  return (
    <div className="tool-shell !max-w-7xl">
      <section className="mbti-examples" aria-labelledby="mbti-examples-title">
        <div className="mbti-examples-heading">
          <div><h2 id="mbti-examples-title">{t.examples}</h2><p>{t.exampleHint}</p></div>
          <button className="text-link" onClick={() => applyExample(mbtiTypes)} disabled={loadingSamples}>{t.useAll}<span aria-hidden="true">↗</span></button>
        </div>
        <div className="mbti-example-grid">
          {mbtiGroups.map(group => <button key={group.id} className="mbti-example" onClick={() => applyExample(group.types)} disabled={loadingSamples}>
            <img src={mbtiGroupSrc(group.id)} alt={`${group.names[currentLang] || group.names.en}: ${group.types.join(' / ')}`} width="1440" height="640" />
            <span className="mbti-example-caption"><span><i style={{ background: group.color }} aria-hidden="true" />{group.names[currentLang] || group.names.en}</span><span>{t.useExample} ↗</span></span>
          </button>)}
        </div>
        {loadingSamples && <p className="mbti-status" role="status">{t.loading}</p>}
        {error && <p className="mbti-status" role="alert">{t[error]}</p>}
      </section>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
        {/* 左侧控制区 */}
        <div className="space-y-4 sm:space-y-6">
          {/* MBTI类型选择 */}
          <div className="tool-card">
            <h2 className="text-lg font-semibold mb-4">
              {t.selectTypes} ({selectedTypes.length}/16)
            </h2>
            <div className="grid grid-cols-4 gap-2">
              {allMBTITypes.map((type) => (
                <button
                  key={type}
                  onClick={() => toggleType(type)}
                  aria-pressed={selectedTypes.includes(type)}
                  className={`relative px-3 py-2 rounded-lg font-medium text-sm transition-all ${
                    selectedTypes.includes(type)
                      ? 'bg-neutral-900 dark:bg-white text-white dark:text-black'
                      : 'bg-black/5 dark:bg-white/10 text-neutral-600 dark:text-neutral-300 hover:bg-black/10 dark:hover:bg-white/15'
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
          <div className="tool-card">
            <h2 className="text-lg font-semibold mb-4">{t.uploadTitle}</h2>
            <div className={`grid ${getGridLayout()} gap-3`}>
              {selectedTypes.map((type) => (
                <div
                  key={type}
                  className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                    currentEditType === type ? 'border-neutral-900 dark:border-white ring-2 ring-black/10 dark:ring-white/20' : 'border-transparent'
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
                        className={`w-full h-full ${gridItems[type].example ? 'object-contain bg-[#f4f0e8]' : 'object-cover'}`}
                        style={{
                          transform: `scale(${gridItems[type].scale}) translate(${gridItems[type].x}px, ${gridItems[type].y}px)`
                        }}
                      />
                      <div className="absolute top-1 left-1 bg-black/60 rounded px-2 py-1">
                        <label htmlFor={`upload-${type}`} className="cursor-pointer text-white text-xs hover:underline" tabIndex={0} onKeyDown={event => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            document.getElementById(`upload-${type}`)?.click();
                          }
                        }}>
                          {t.changeImage}
                        </label>
                      </div>
                      <button
                        aria-label={`${t.remove}: ${type}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          removeImage(type);
                        }}
                        className="absolute top-1 right-1 p-2 bg-black/60 text-white rounded-full hover:bg-black/80 z-10"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs py-1 text-center font-bold pointer-events-none">
                        {type}
                      </div>
                    </div>
                  ) : (
                    <label
                      htmlFor={`upload-${type}`}
                      className="block w-full h-full cursor-pointer border-2 border-dashed border-black/15 dark:border-white/15 rounded-lg flex flex-col items-center justify-center hover:border-black/40 dark:hover:border-white/40 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                    >
                      <Upload className="w-5 h-5 text-neutral-400 mb-1" />
                      <span className="text-xs text-neutral-600 dark:text-neutral-300 font-bold">{type}</span>
                    </label>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 调整面板 */}
          {currentEditType && gridItems[currentEditType] && (
            <div className="tool-card animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Move className="w-5 h-5" />
                  {t.adjustTitle}: {currentEditType}
                </h3>
                <button
                  aria-label={t.close}
                  onClick={() => setCurrentEditType(null)}
                  className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* 缩放 */}
                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 flex items-center gap-1">
                      <ZoomIn className="w-4 h-4" /> {t.scale}
                    </label>
                    <span className="text-sm text-neutral-500 dark:text-neutral-400">{gridItems[currentEditType].scale.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="3"
                    step="0.1"
                    value={gridItems[currentEditType].scale}
                    onChange={(e) => updateImageConfig('scale', parseFloat(e.target.value))}
                    className="w-full h-2 bg-black/10 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-neutral-900 dark:accent-white"
                  />
                </div>

                {/* X位移 */}
                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{t.posX}</label>
                    <span className="text-sm text-neutral-500 dark:text-neutral-400">{gridItems[currentEditType].x}px</span>
                  </div>
                  <input
                    type="range"
                    min="-200"
                    max="200"
                    value={gridItems[currentEditType].x}
                    onChange={(e) => updateImageConfig('x', parseInt(e.target.value))}
                    className="w-full h-2 bg-black/10 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-neutral-900 dark:accent-white"
                  />
                </div>

                {/* Y位移 */}
                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{t.posY}</label>
                    <span className="text-sm text-neutral-500 dark:text-neutral-400">{gridItems[currentEditType].y}px</span>
                  </div>
                  <input
                    type="range"
                    min="-200"
                    max="200"
                    value={gridItems[currentEditType].y}
                    onChange={(e) => updateImageConfig('y', parseInt(e.target.value))}
                    className="w-full h-2 bg-black/10 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-neutral-900 dark:accent-white"
                  />
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handleExport}
            disabled={loadingSamples || !selectedTypes.some(type => gridItems[type])}
            className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-neutral-900 dark:bg-white hover:bg-neutral-700 dark:hover:bg-neutral-200 text-white dark:text-black rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-5 h-5" />
            <span>{t.download} · WebP</span>
          </button>
        </div>

        {/* 右侧预览区 */}
        <div className="tool-card lg:sticky lg:top-24 self-start">
          <h2 className="text-lg font-semibold mb-4">{t.preview}</h2>
          <div className="bg-[#f4f0e8] rounded-lg overflow-hidden border border-black/10">
            <canvas
              ref={canvasRef}
              role="img"
              aria-label={`${t.preview}: ${selectedTypes.join(', ')}`}
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
