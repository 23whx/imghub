import React, { useState, useRef, useEffect } from 'react';
import { Upload, Download, Eraser, ZoomIn, ZoomOut } from 'lucide-react';

const WatermarkRemover = () => {
  const [image, setImage] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState(20);
  const [maskData, setMaskData] = useState([]);
  const canvasRef = useRef(null);
  const maskCanvasRef = useRef(null);

  useEffect(() => {
    if (image) {
      drawCanvas();
    }
  }, [image, maskData, brushSize]);

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setImage(img);
        setMaskData([]);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    if (!canvas || !maskCanvas || !image) return;

    canvas.width = image.width;
    canvas.height = image.height;
    maskCanvas.width = image.width;
    maskCanvas.height = image.height;

    const ctx = canvas.getContext('2d');
    const maskCtx = maskCanvas.getContext('2d');

    // 绘制原图
    ctx.drawImage(image, 0, 0);

    // 绘制遮罩
    maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
    maskCtx.fillStyle = 'rgba(255, 0, 0, 0.5)';
    
    maskData.forEach(point => {
      maskCtx.beginPath();
      maskCtx.arc(point.x, point.y, brushSize, 0, Math.PI * 2);
      maskCtx.fill();
    });
  };

  const handleMouseDown = (e) => {
    setIsDrawing(true);
    addPoint(e);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing) return;
    addPoint(e);
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const addPoint = (e) => {
    const canvas = maskCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    setMaskData([...maskData, { x, y }]);
  };

  const processImage = () => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;

    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // 简单的修复算法：对标记区域进行模糊处理
    maskData.forEach(point => {
      const x = Math.round(point.x);
      const y = Math.round(point.y);
      
      for (let dy = -brushSize; dy <= brushSize; dy++) {
        for (let dx = -brushSize; dx <= brushSize; dx++) {
          if (dx * dx + dy * dy <= brushSize * brushSize) {
            const px = x + dx;
            const py = y + dy;
            
            if (px >= 0 && px < canvas.width && py >= 0 && py < canvas.height) {
              const idx = (py * canvas.width + px) * 4;
              
              // 简单平均周边像素
              let r = 0, g = 0, b = 0, count = 0;
              
              for (let ny = -2; ny <= 2; ny++) {
                for (let nx = -2; nx <= 2; nx++) {
                  const npx = px + nx;
                  const npy = py + ny;
                  
                  if (npx >= 0 && npx < canvas.width && npy >= 0 && npy < canvas.height) {
                    const nidx = (npy * canvas.width + npx) * 4;
                    r += data[nidx];
                    g += data[nidx + 1];
                    b += data[nidx + 2];
                    count++;
                  }
                }
              }
              
              data[idx] = r / count;
              data[idx + 1] = g / count;
              data[idx + 2] = b / count;
            }
          }
        }
      }
    });

    ctx.putImageData(imageData, 0, 0);
    setMaskData([]);
  };

  const handleExport = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = 'watermark-removed.png';
    link.href = canvas.toDataURL();
    link.click();
  };

  const clearMask = () => {
    setMaskData([]);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">图片去水印工具</h1>
        <p className="text-gray-600">标记水印区域，智能修复图片</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 左侧控制面板 */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center space-x-2">
              <Upload className="w-5 h-5 text-red-500" />
              <span>上传图片</span>
            </h2>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              id="image-upload"
            />
            <label
              htmlFor="image-upload"
              className="block w-full py-8 border-2 border-dashed border-gray-300 rounded-lg text-center cursor-pointer hover:border-red-500 hover:bg-red-50 transition-colors"
            >
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">点击上传</p>
            </label>
          </div>

          {image && (
            <>
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                  <Eraser className="w-5 h-5 text-red-500" />
                  <span>画笔设置</span>
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      画笔大小: {brushSize}px
                    </label>
                    <input
                      type="range"
                      min="5"
                      max="50"
                      value={brushSize}
                      onChange={(e) => setBrushSize(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-6 space-y-3">
                <button
                  onClick={processImage}
                  disabled={maskData.length === 0}
                  className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  开始处理
                </button>
                <button
                  onClick={clearMask}
                  className="w-full px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  清除标记
                </button>
                <button
                  onClick={handleExport}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>下载图片</span>
                </button>
              </div>
            </>
          )}

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>使用说明：</strong><br />
              1. 上传包含水印的图片<br />
              2. 用鼠标涂抹标记水印区域<br />
              3. 点击"开始处理"修复图片<br />
              4. 下载处理后的图片
            </p>
          </div>
        </div>

        {/* 右侧预览区 */}
        <div className="lg:col-span-3 bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-lg font-semibold mb-4">图片编辑区</h2>
          <div className="relative bg-gray-50 rounded-lg overflow-auto max-h-[600px]">
            {image ? (
              <div className="relative inline-block">
                <canvas
                  ref={canvasRef}
                  className="max-w-full h-auto"
                />
                <canvas
                  ref={maskCanvasRef}
                  className="absolute top-0 left-0 max-w-full h-auto cursor-crosshair"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                />
              </div>
            ) : (
              <div className="text-center py-20">
                <Eraser className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-400">上传图片后开始编辑</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WatermarkRemover;

