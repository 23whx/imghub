import React, { useState, useRef, useEffect } from 'react';
import { Upload, Download, Grid } from 'lucide-react';
import JSZip from 'jszip';

const MemeSlicer = () => {
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

    const cellWidth = image.width / cols;
    const cellHeight = image.height / rows;

    const zip = new JSZip();
    const slicesFolder = zip.folder('slices');

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = cellWidth;
        tempCanvas.height = cellHeight;
        const tempCtx = tempCanvas.getContext('2d');

        tempCtx.drawImage(
          image,
          col * cellWidth,
          row * cellHeight,
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
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">表情包切片工具</h1>
        <p className="text-gray-600">上传图片，自定义行列数，批量导出切片</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 左侧控制面板 */}
        <div className="space-y-6">
          {/* 上传区 */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center space-x-2">
              <Upload className="w-5 h-5 text-green-500" />
              <span>上传图片</span>
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
              className="block w-full py-12 border-2 border-dashed border-gray-300 rounded-lg text-center cursor-pointer hover:border-green-500 hover:bg-green-50 transition-colors"
            >
              {image ? (
                <div>
                  <img
                    src={image.src}
                    alt="Preview"
                    className="max-h-32 mx-auto mb-2 rounded object-contain"
                  />
                  <p className="text-sm text-gray-600">点击更换图片</p>
                </div>
              ) : (
                <div>
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">点击上传图片</p>
                  <p className="text-sm text-gray-400 mt-1">支持 JPG, PNG, GIF</p>
                </div>
              )}
            </label>
          </div>

          {/* 切片设置 */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center space-x-2">
              <Grid className="w-5 h-5 text-green-500" />
              <span>切片设置</span>
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  行数: {rows}
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={rows}
                  onChange={(e) => setRows(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  列数: {cols}
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={cols}
                  onChange={(e) => setCols(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  将生成 <span className="font-bold text-green-600">{rows * cols}</span> 张切片图片
                </p>
              </div>
            </div>
          </div>

          {/* 快速预设 */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-lg font-semibold mb-4">快速预设</h2>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setRows(2);
                  setCols(2);
                }}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition-colors"
              >
                2×2
              </button>
              <button
                onClick={() => {
                  setRows(3);
                  setCols(3);
                }}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition-colors"
              >
                3×3
              </button>
              <button
                onClick={() => {
                  setRows(3);
                  setCols(4);
                }}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition-colors"
              >
                3×4
              </button>
              <button
                onClick={() => {
                  setRows(4);
                  setCols(4);
                }}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition-colors"
              >
                4×4
              </button>
            </div>
          </div>

          <button
            onClick={handleExport}
            disabled={!image}
            className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg font-medium transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            <Download className="w-5 h-5" />
            <span>导出切片 (ZIP)</span>
          </button>
        </div>

        {/* 右侧预览区 - 添加了 sticky 和 self-start */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6 lg:sticky lg:top-24 self-start">
          <h2 className="text-lg font-semibold mb-4">预览</h2>
          <div className="bg-gray-50 rounded-lg overflow-auto max-h-[80vh] flex items-center justify-center p-4">
            {image ? (
              <canvas
                ref={canvasRef}
                className="max-w-full h-auto shadow-lg"
              />
            ) : (
              <div className="text-center py-20">
                <Grid className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-400">上传图片后查看预览</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemeSlicer;