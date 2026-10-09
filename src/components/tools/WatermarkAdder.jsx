import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Upload,
  Download,
  Type,
  Image as ImageIcon,
  RotateCw,
  Droplets,
  Maximize2,
  Grid3x3,
} from 'lucide-react';
import { syncLanguageFromLocale } from '../../stores/globalStore';

const copy = {
  zh: {
    title: '图片加水印',
    subtitle: '文字或图片水印，自由调节大小、角度、透明度',
    uploadBase: '上传原图',
    uploadHint: '支持 PNG / JPEG / WebP，本地处理不上传',
    mode: '水印类型',
    modeText: '文字水印',
    modeImage: '图片水印',
    textLabel: '水印文字',
    textPlaceholder: '输入水印内容…',
    fontSize: '文字大小',
    fontColor: '文字颜色',
    uploadMark: '上传水印图片',
    markHint: '建议透明底 PNG',
    size: '水印大小',
    opacity: '透明度',
    rotation: '旋转角度',
    posX: '水平位置',
    posY: '垂直位置',
    presets: '角度预设',
    horizontal: '横向',
    vertical: '竖向',
    diagonal: '斜向',
    diagonal2: '反斜',
    tile: '平铺铺满',
    tileGap: '平铺间距',
    download: '下载图片',
    preview: '实时预览',
    needImage: '请先上传原图',
    needMark: '请输入文字或上传水印图',
  },
  en: {
    title: 'Add Watermark',
    subtitle: 'Text or image watermark with size, angle and opacity controls',
    uploadBase: 'Upload image',
    uploadHint: 'PNG / JPEG / WebP — processed locally',
    mode: 'Watermark type',
    modeText: 'Text',
    modeImage: 'Image',
    textLabel: 'Watermark text',
    textPlaceholder: 'Enter watermark text…',
    fontSize: 'Font size',
    fontColor: 'Text color',
    uploadMark: 'Upload watermark image',
    markHint: 'PNG with transparency recommended',
    size: 'Size',
    opacity: 'Opacity',
    rotation: 'Rotation',
    posX: 'Horizontal position',
    posY: 'Vertical position',
    presets: 'Angle presets',
    horizontal: 'Horizontal',
    vertical: 'Vertical',
    diagonal: 'Diagonal',
    diagonal2: 'Anti-diagonal',
    tile: 'Tile across image',
    tileGap: 'Tile spacing',
    download: 'Download',
    preview: 'Live preview',
    needImage: 'Upload a base image first',
    needMark: 'Enter text or upload a watermark image',
  },
  ja: {
    title: '透かし追加',
    subtitle: '文字・画像透かし。サイズ・角度・透明度を自由に調整',
    uploadBase: '画像をアップロード',
    uploadHint: 'PNG / JPEG / WebP。端末内で処理',
    mode: '透かし種類',
    modeText: '文字',
    modeImage: '画像',
    textLabel: '透かし文字',
    textPlaceholder: '文字を入力…',
    fontSize: '文字サイズ',
    fontColor: '文字色',
    uploadMark: '透かし画像',
    markHint: '透明PNG推奨',
    size: 'サイズ',
    opacity: '不透明度',
    rotation: '回転',
    posX: '水平位置',
    posY: '垂直位置',
    presets: '角度プリセット',
    horizontal: '横',
    vertical: '縦',
    diagonal: '斜め',
    diagonal2: '逆斜め',
    tile: 'タイル敷き詰め',
    tileGap: '間隔',
    download: 'ダウンロード',
    preview: 'プレビュー',
    needImage: '先に画像をアップロードしてください',
    needMark: '文字を入れるか透かし画像を選んでください',
  },
};

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error('no file'));
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('load failed'));
    };
    img.src = url;
  });
}

const WatermarkAdder = ({ lang: langProp = 'zh' }) => {
  const t = copy[langProp] || copy.zh;
  useEffect(() => {
    syncLanguageFromLocale(langProp);
  }, [langProp]);

  const [baseImage, setBaseImage] = useState(null);
  const [markImage, setMarkImage] = useState(null);
  const [mode, setMode] = useState('text'); // text | image
  const [text, setText] = useState(langProp === 'en' ? 'Watermark' : langProp === 'ja' ? '透かし' : '水印');
  const [fontSize, setFontSize] = useState(48);
  const [fontColor, setFontColor] = useState('#ffffff');
  const [scale, setScale] = useState(1); // for image mark relative size
  const [opacity, setOpacity] = useState(0.45);
  const [rotation, setRotation] = useState(-30);
  const [posX, setPosX] = useState(50); // percent
  const [posY, setPosY] = useState(50);
  const [tile, setTile] = useState(false);
  const [tileGap, setTileGap] = useState(40); // percent of mark size
  const [status, setStatus] = useState('');

  const canvasRef = useRef(null);
  const previewWrapRef = useRef(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !baseImage) return;
    const ctx = canvas.getContext('2d');
    const w = baseImage.naturalWidth || baseImage.width;
    const h = baseImage.naturalHeight || baseImage.height;
    canvas.width = w;
    canvas.height = h;

    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(baseImage, 0, 0, w, h);

    const drawOne = (cx, cy) => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, opacity));
      ctx.translate(cx, cy);
      ctx.rotate((rotation * Math.PI) / 180);

      if (mode === 'text') {
        const size = Math.max(8, fontSize * (w / 800));
        ctx.font = `bold ${size}px system-ui, -apple-system, "Segoe UI", sans-serif`;
        ctx.fillStyle = fontColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        // subtle shadow for readability
        ctx.shadowColor = 'rgba(0,0,0,0.35)';
        ctx.shadowBlur = Math.max(2, size * 0.08);
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;
        ctx.fillText(text || ' ', 0, 0);
      } else if (markImage) {
        const mw = markImage.naturalWidth || markImage.width;
        const mh = markImage.naturalHeight || markImage.height;
        const targetW = Math.max(8, w * 0.28 * scale);
        const targetH = (mh / mw) * targetW;
        ctx.drawImage(markImage, -targetW / 2, -targetH / 2, targetW, targetH);
      }
      ctx.restore();
    };

    if (tile) {
      // Measure mark bounding box roughly for spacing
      let markW;
      let markH;
      if (mode === 'text') {
        const size = Math.max(8, fontSize * (w / 800));
        ctx.font = `bold ${size}px system-ui, sans-serif`;
        const metrics = ctx.measureText(text || 'W');
        markW = Math.max(metrics.width, size);
        markH = size * 1.2;
      } else if (markImage) {
        const mw = markImage.naturalWidth || markImage.width;
        const mh = markImage.naturalHeight || markImage.height;
        markW = Math.max(8, w * 0.28 * scale);
        markH = (mh / mw) * markW;
      } else {
        return;
      }
      const gap = 1 + tileGap / 100;
      const stepX = markW * gap * 1.4;
      const stepY = markH * gap * 1.8;
      // Extra padding so rotation still covers edges
      const pad = Math.max(stepX, stepY);
      for (let y = -pad; y < h + pad; y += stepY) {
        for (let x = -pad; x < w + pad; x += stepX) {
          drawOne(x, y);
        }
      }
    } else {
      const cx = (posX / 100) * w;
      const cy = (posY / 100) * h;
      drawOne(cx, cy);
    }
  }, [
    baseImage,
    markImage,
    mode,
    text,
    fontSize,
    fontColor,
    scale,
    opacity,
    rotation,
    posX,
    posY,
    tile,
    tileGap,
  ]);

  useEffect(() => {
    draw();
  }, [draw]);

  const onBaseUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const img = await loadImageFromFile(file);
      setBaseImage(img);
      setStatus('');
    } catch {
      setStatus(t.needImage);
    }
  };

  const onMarkUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const img = await loadImageFromFile(file);
      setMarkImage(img);
      setMode('image');
      setStatus('');
    } catch {
      setStatus(t.needMark);
    }
  };

  const download = () => {
    if (!baseImage) {
      setStatus(t.needImage);
      return;
    }
    if (mode === 'text' && !text.trim()) {
      setStatus(t.needMark);
      return;
    }
    if (mode === 'image' && !markImage) {
      setStatus(t.needMark);
      return;
    }
    draw();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'watermarked.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const anglePresets = [
    { label: t.horizontal, value: 0 },
    { label: t.diagonal, value: -30 },
    { label: t.diagonal2, value: 30 },
    { label: t.vertical, value: -90 },
  ];

  return (
    <div className="tool-shell">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">
        {/* Preview */}
        <div className="lg:col-span-3 tool-card order-1">
          <div className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3">{t.preview}</div>
          {!baseImage ? (
            <label
              className="flex flex-col items-center justify-center min-h-[260px] sm:min-h-[360px] border-2 border-dashed border-black/15 dark:border-white/15 rounded-xl cursor-pointer hover:border-black/40 dark:hover:border-white/40 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              onDragOver={(e) => e.preventDefault()}
              onDrop={async (e) => {
                e.preventDefault();
                const file = e.dataTransfer.files?.[0];
                if (!file) return;
                try {
                  setBaseImage(await loadImageFromFile(file));
                } catch {
                  /* ignore */
                }
              }}
            >
              <Upload className="w-10 h-10 text-neutral-400 mb-2" />
              <span className="font-medium text-neutral-800 dark:text-neutral-200">{t.uploadBase}</span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 px-4 text-center">{t.uploadHint}</span>
              <input type="file" accept="image/*" className="hidden" onChange={onBaseUpload} />
            </label>
          ) : (
            <div
              ref={previewWrapRef}
              className="relative bg-black/5 dark:bg-white/5 rounded-xl overflow-auto touch-scroll max-h-[55vh] sm:max-h-[70vh] flex items-center justify-center p-2"
            >
              <canvas
                ref={canvasRef}
                className="max-w-full h-auto shadow-md rounded-lg"
                style={{ maxHeight: 'min(65vh, 720px)' }}
              />
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="lg:col-span-2 space-y-4 order-2">
          <div className="tool-card space-y-4">
            <div>
              <div className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-2">{t.mode}</div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMode('text')}
                  className={`min-h-[44px] rounded-xl text-sm font-semibold inline-flex items-center justify-center gap-1.5 ${
                    mode === 'text' ? 'bg-neutral-900 dark:bg-white text-white dark:text-black' : 'bg-black/5 dark:bg-white/10 text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  <Type className="w-4 h-4" /> {t.modeText}
                </button>
                <button
                  type="button"
                  onClick={() => setMode('image')}
                  className={`min-h-[44px] rounded-xl text-sm font-semibold inline-flex items-center justify-center gap-1.5 ${
                    mode === 'image' ? 'bg-neutral-900 dark:bg-white text-white dark:text-black' : 'bg-black/5 dark:bg-white/10 text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  <ImageIcon className="w-4 h-4" /> {t.modeImage}
                </button>
              </div>
            </div>

            {baseImage && (
              <label className="block text-sm">
                <span className="font-medium text-neutral-700 dark:text-neutral-300">{t.uploadBase}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={onBaseUpload}
                  className="mt-1 block w-full text-sm file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-black/5 dark:file:bg-white/10 file:text-neutral-700 dark:file:text-neutral-300"
                />
              </label>
            )}

            {mode === 'text' ? (
              <>
                <label className="block text-sm">
                  <span className="font-medium text-neutral-700 dark:text-neutral-300">{t.textLabel}</span>
                  <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={t.textPlaceholder}
                    className="mt-1 w-full rounded-xl border border-black/15 dark:border-white/15 px-3 py-2.5 focus:ring-2 focus:ring-black/30 dark:focus:ring-white/30 outline-none bg-white dark:bg-neutral-900"
                  />
                </label>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  <span className="flex justify-between">
                    <span className="inline-flex items-center gap-1">
                      <Maximize2 className="w-3.5 h-3.5" /> {t.fontSize}
                    </span>
                    <output>{fontSize}px</output>
                  </span>
                  <input
                    type="range"
                    min={12}
                    max={200}
                    value={fontSize}
                    onChange={(e) => setFontSize(+e.target.value)}
                    className="w-full mt-1 accent-neutral-900 dark:accent-white"
                  />
                </label>
                <label className="flex items-center justify-between gap-3 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  <span>{t.fontColor}</span>
                  <input
                    type="color"
                    value={fontColor}
                    onChange={(e) => setFontColor(e.target.value)}
                    className="w-12 h-10 rounded-lg border border-black/15 dark:border-white/15 cursor-pointer"
                  />
                </label>
              </>
            ) : (
              <>
                <label className="block text-sm">
                  <span className="font-medium text-neutral-700 dark:text-neutral-300">{t.uploadMark}</span>
                  <span className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">{t.markHint}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={onMarkUpload}
                    className="block w-full text-sm file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-black/5 dark:file:bg-white/10 file:text-neutral-700 dark:file:text-neutral-300"
                  />
                </label>
                {markImage && (
                  <div className="flex items-center gap-3 p-2 bg-black/5 dark:bg-white/5 rounded-xl">
                    <img
                      src={markImage.src}
                      alt=""
                      className="h-12 w-12 object-contain rounded bg-white border border-black/10"
                    />
                    <span className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                      {markImage.naturalWidth}×{markImage.naturalHeight}
                    </span>
                  </div>
                )}
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  <span className="flex justify-between">
                    <span className="inline-flex items-center gap-1">
                      <Maximize2 className="w-3.5 h-3.5" /> {t.size}
                    </span>
                    <output>{Math.round(scale * 100)}%</output>
                  </span>
                  <input
                    type="range"
                    min={0.15}
                    max={3}
                    step={0.05}
                    value={scale}
                    onChange={(e) => setScale(+e.target.value)}
                    className="w-full mt-1 accent-neutral-900 dark:accent-white"
                  />
                </label>
              </>
            )}

            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              <span className="flex justify-between">
                <span className="inline-flex items-center gap-1">
                  <Droplets className="w-3.5 h-3.5" /> {t.opacity}
                </span>
                <output>{Math.round(opacity * 100)}%</output>
              </span>
              <input
                type="range"
                min={0.05}
                max={1}
                step={0.01}
                value={opacity}
                onChange={(e) => setOpacity(+e.target.value)}
                className="w-full mt-1 accent-neutral-900 dark:accent-white"
              />
            </label>

            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              <span className="flex justify-between">
                <span className="inline-flex items-center gap-1">
                  <RotateCw className="w-3.5 h-3.5" /> {t.rotation}
                </span>
                <output>{rotation}°</output>
              </span>
              <input
                type="range"
                min={-180}
                max={180}
                value={rotation}
                onChange={(e) => setRotation(+e.target.value)}
                className="w-full mt-1 accent-neutral-900 dark:accent-white"
              />
            </label>

            <div>
              <div className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-2">{t.presets}</div>
              <div className="grid grid-cols-4 gap-1.5">
                {anglePresets.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setRotation(p.value)}
                    className={`min-h-[40px] rounded-lg text-[11px] sm:text-xs font-medium ${
                      rotation === p.value
                        ? 'bg-neutral-900 dark:bg-white text-white dark:text-black'
                        : 'bg-black/5 dark:bg-white/10 text-neutral-700 dark:text-neutral-300 hover:bg-black/10 dark:hover:bg-white/15'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {!tile && (
              <>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  <span className="flex justify-between">
                    <span>{t.posX}</span>
                    <output>{posX}%</output>
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={posX}
                    onChange={(e) => setPosX(+e.target.value)}
                    className="w-full mt-1 accent-neutral-900 dark:accent-white"
                  />
                </label>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  <span className="flex justify-between">
                    <span>{t.posY}</span>
                    <output>{posY}%</output>
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={posY}
                    onChange={(e) => setPosY(+e.target.value)}
                    className="w-full mt-1 accent-neutral-900 dark:accent-white"
                  />
                </label>
              </>
            )}

            <label className="flex items-center gap-3 min-h-[44px] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={tile}
                onChange={(e) => setTile(e.target.checked)}
                className="w-5 h-5 accent-neutral-900 dark:accent-white"
              />
              <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200 inline-flex items-center gap-1.5">
                <Grid3x3 className="w-4 h-4" />
                {t.tile}
              </span>
            </label>

            {tile && (
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                <span className="flex justify-between">
                  <span>{t.tileGap}</span>
                  <output>{tileGap}%</output>
                </span>
                <input
                  type="range"
                  min={0}
                  max={120}
                  value={tileGap}
                  onChange={(e) => setTileGap(+e.target.value)}
                  className="w-full mt-1 accent-neutral-900 dark:accent-white"
                />
              </label>
            )}

            <button
              type="button"
              onClick={download}
              className="w-full min-h-[48px] rounded-xl bg-neutral-900 dark:bg-white hover:bg-neutral-700 dark:hover:bg-neutral-200 text-white dark:text-black font-semibold inline-flex items-center justify-center gap-2 shadow-md"
            >
              <Download className="w-5 h-5" />
              {t.download}
            </button>
            {status && <p className="text-center text-xs font-medium">{status}</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WatermarkAdder;
