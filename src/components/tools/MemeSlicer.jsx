import { translateToolText } from '../../i18n/legacyTools.js';
import { useState, useRef, useEffect } from 'react';
import { Upload, Download, Grid } from 'lucide-react';
import JSZip from 'jszip';

const MemeSlicer = ({ lang: langProp = 'en' }) => {
  const tr = text => translateToolText(langProp, text);
  const [image, setImage] = useState(null);
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setImage(img);
        // 移除这里的 drawCanvas 调用，改用 useEffect 监听 image 变化
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const drawCanvas = () => {
    // 使用当前的 image 状态
    if (!image || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    canvas.width = image.width;
    canvas.height = image.height;

    ctx.drawImage(image, 0, 0);

    // 绘制网格线
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 2;

    const cellWidth = image.width / cols;
    const cellHeight = image.height / rows;

    // 绘制垂直线
    for (let i = 1; i < cols; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellWidth, 0);
      ctx.lineTo(i * cellWidth, image.height);
      ctx.stroke();
    }

    // 绘制水平线
    for (let i = 1; i < rows; i++) {
      ctx.beginPath();
      ctx.moveTo(0, i * cellHeight);
      ctx.lineTo(image.width, i * cellHeight);
      ctx.stroke();
    }
  };

  // 监听 image, rows, cols 变化，自动重绘
  // 此时 DOM 已经更新，canvasRef.current 应该存在
  useEffect(() => {
    if (image) {
      drawCanvas();
    }
  }, [image, rows, cols]);

  const handleExport = async () => {
    if (!image) return;

    // 整数像素边界：尺寸不能整除时避免切片被截断或重采样
    const edgeX = i => Math.round((i * image.width) / cols);
    const edgeY = i => Math.round((i * image.height) / rows);

    const zip = new JSZip();
    const slicesFolder = zip.folder('slices');

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const sx = edgeX(col);
        const sy = edgeY(row);
        const cellWidth = edgeX(col + 1) - sx;
        const cellHeight = edgeY(row + 1) - sy;
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = cellWidth;
        tempCanvas.height = cellHeight;
        const tempCtx = tempCanvas.getContext('2d');

        tempCtx.drawImage(
          image,
          sx,
          sy,
          cellWidth,
          cellHeight,
          0,
          0,
          cellWidth,
          cellHeight
        );

        const dataUrl = tempCanvas.toDataURL('image/png');
        const base64Data = dataUrl.split(',')[1];
        slicesFolder.file(`slice_${row + 1}_${col + 1}.png`, base64Data, { base64: true });
      }
    }

    const content = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = 'meme-slices.zip';
    link.click();
  };

  return (
    <div className="tool-shell">
      <div className="mb-4 sm:mb-8 text-center">
        <h2 className="tool-title">{tr("表情包切片工具")}</h2>
        <p className="tool-subtitle">{tr("上传图片，自定义行列数，批量导出切片")}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
        {/* 左侧控制面板 */}
        <div className="space-y-4 sm:space-y-6">
          {/* 上传区 */}
          <div className="tool-card">
            <h2 className="text-lg font-semibold mb-4 flex items-center space-x-2">
              <Upload className="w-5 h-5" />
              <span>{tr("上传图片")}</span>
            </h2>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              id="image-upload"
            />
            <label
              htmlFor="image-upload"
              className="block w-full py-8 sm:py-12 border-2 border-dashed border-black/15 dark:border-white/15 rounded-lg text-center cursor-pointer hover:border-black/40 dark:hover:border-white/40 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              {image ? (
                <div>
                  <img
                    src={image.src}
                    alt="Preview"
                    className="max-h-32 mx-auto mb-2 rounded object-contain"
                  />
                  <p className="text-sm text-neutral-600 dark:text-neutral-300">{tr("点击更换图片")}</p>
                </div>
              ) : (
                <div>
                  <Upload className="w-12 h-12 text-neutral-400 mx-auto mb-2" />
                  <p className="text-neutral-600 dark:text-neutral-300">{tr("点击上传图片")}</p>
                  <p className="text-sm text-neutral-400 mt-1">{tr("支持 JPG, PNG, GIF")}</p>
                </div>
              )}
            </label>
          </div>

          {/* 切片设置 */}
          <div className="tool-card">
            <h2 className="text-lg font-semibold mb-4 flex items-center space-x-2">
              <Grid className="w-5 h-5" />
              <span>{tr("切片设置")}</span>
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">{tr("行数:")} {rows}
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={rows}
                  onChange={(e) => setRows(Number(e.target.value))}
                  className="w-full accent-neutral-900 dark:accent-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">{tr("列数:")} {cols}
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={cols}
                  onChange={(e) => setCols(Number(e.target.value))}
                  className="w-full accent-neutral-900 dark:accent-white"
                />
              </div>

              <div className="pt-4 border-t border-black/10 dark:border-white/10">
                <p className="text-sm text-neutral-600 dark:text-neutral-400">{tr("将生成")} <span className="font-semibold">{rows * cols}</span> {tr("张切片图片")}</p>
              </div>
            </div>
          </div>

          {/* 快速预设 */}
          <div className="tool-card">
            <h2 className="text-lg font-semibold mb-4">{tr("快速预设")}</h2>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setRows(2);
                  setCols(2);
                }}
                className="px-4 py-2 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 rounded-lg text-sm transition-colors"
              >
                2×2
              </button>
              <button
                onClick={() => {
                  setRows(3);
                  setCols(3);
                }}
                className="px-4 py-2 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 rounded-lg text-sm transition-colors"
              >
                3×3
              </button>
              <button
                onClick={() => {
                  setRows(3);
                  setCols(4);
                }}
                className="px-4 py-2 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 rounded-lg text-sm transition-colors"
              >
                3×4
              </button>
              <button
                onClick={() => {
                  setRows(4);
                  setCols(4);
                }}
                className="px-4 py-2 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 rounded-lg text-sm transition-colors"
              >
                4×4
              </button>
            </div>
          </div>

          <button
            onClick={handleExport}
            disabled={!image}
            className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-neutral-900 dark:bg-white hover:bg-neutral-700 dark:hover:bg-neutral-200 text-white dark:text-black rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-5 h-5" />
            <span>{tr("导出切片 (ZIP)")}</span>
          </button>
        </div>

        {/* 右侧预览区 - 添加了 sticky 和 self-start */}
        <div className="lg:col-span-2 tool-card lg:sticky lg:top-24 self-start">
          <h2 className="text-lg font-semibold mb-4">{tr("预览")}</h2>
          <div className="bg-black/5 dark:bg-white/5 rounded-lg overflow-auto max-h-[80vh] flex items-center justify-center p-4">
            {image ? (
              <canvas
                ref={canvasRef}
                className="max-w-full h-auto shadow-lg"
              />
            ) : (
              <div className="text-center py-20">
                <Grid className="w-16 h-16 text-neutral-300 dark:text-neutral-700 mx-auto mb-4" />
                <p className="text-neutral-400">{tr("上传图片后查看预览")}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemeSlicer;