import React, { useState, useRef } from 'react';
import { Camera, Check, X, Monitor, Globe, Link, Loader2 } from 'lucide-react';

const Screenshot = () => {
  const [mode, setMode] = useState('menu'); // 'menu', 'url-input', 'editor'
  const [imageUrl, setImageUrl] = useState(null);
  const [inputUrl, setInputUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // --- 1. 获取截图逻辑 ---

  // 方式A: 本地屏幕/窗口截图 (getDisplayMedia)
  const handleLocalCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: "never" },
        audio: false
      });
      const track = stream.getVideoTracks()[0];
      const imageCapture = new ImageCapture(track);
      const bitmap = await imageCapture.grabFrame();
      track.stop();

      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(bitmap, 0, 0);
      
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      setImageUrl(URL.createObjectURL(blob));
      setMode('editor');
      setError('');
    } catch (err) {
      console.error(err);
      if (err.name !== 'NotAllowedError') {
        setError('无法获取屏幕画面，请检查浏览器权限。');
      }
    }
  };

  // 方式B: URL长截图 (后端Puppeteer)
  const handleUrlCapture = async () => {
    if (!inputUrl) return;
    let targetUrl = inputUrl;
    if (!inputUrl.startsWith('http')) targetUrl = `https://${inputUrl}`;

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/screenshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.details || '截图失败，请检查链接是否有效');
      }

      const blob = await response.blob();
      setImageUrl(URL.createObjectURL(blob));
      setMode('editor');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">网页截图工具</h1>
        <p className="text-gray-600">支持即时屏幕截图与网页长截图</p>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="max-w-2xl mx-auto mb-6 p-4 bg-red-50 text-red-600 rounded-lg border border-red-200 text-center animate-fade-in">
          {error}
        </div>
      )}

      {/* 模式选择菜单 */}
      {mode === 'menu' && (
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* 选项1: 即时截图 */}
          <button
            onClick={handleLocalCapture}
            className="group bg-white p-8 rounded-2xl shadow-lg border-2 border-transparent hover:border-blue-500 transition-all text-left flex flex-col h-full"
          >
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mb-6 text-blue-600 group-hover:scale-110 transition-transform">
              <Monitor className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">即时截图</h3>
            <p className="text-gray-500 mb-4 flex-grow">
              调用浏览器原生功能，直接选择标签页、窗口或屏幕进行截图。
            </p>
            <span className="text-blue-600 font-medium flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              开始截图 &rarr;
            </span>
          </button>

          {/* 选项2: 网页长截图 */}
          <button
            onClick={() => setMode('url-input')}
            className="group bg-white p-8 rounded-2xl shadow-lg border-2 border-transparent hover:border-purple-500 transition-all text-left flex flex-col h-full"
          >
            <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mb-6 text-purple-600 group-hover:scale-110 transition-transform">
              <Globe className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">网页长截图</h3>
            <p className="text-gray-500 mb-4 flex-grow">
              输入网址，自动滚动截取完整的网页长图（包括可视区域以外的内容）。
            </p>
            <span className="text-purple-600 font-medium flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              去输入网址 &rarr;
            </span>
          </button>
        </div>
      )}

      {/* URL输入界面 */}
      {mode === 'url-input' && (
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-lg animate-fade-in">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Link className="w-6 h-6 text-purple-500" />
            输入网页地址
          </h3>
          <div className="flex gap-3 mb-4">
            <input
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="例如: www.bilibili.com"
              className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 outline-none"
              onKeyDown={(e) => e.key === 'Enter' && handleUrlCapture()}
            />
            <button
              onClick={handleUrlCapture}
              disabled={loading || !inputUrl}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium disabled:opacity-50 flex items-center gap-2"
            >
              {loading && <Loader2 className="w-5 h-5 animate-spin" />}
              {loading ? '生成中...' : '开始截图'}
            </button>
          </div>
          <button 
            onClick={() => setMode('menu')}
            className="text-gray-500 text-sm hover:text-gray-700 hover:underline"
          >
            &larr; 返回选择模式
          </button>
        </div>
      )}

      {/* 全屏编辑器组件 */}
      {mode === 'editor' && imageUrl && (
        <ScreenshotEditor imageUrl={imageUrl} onClose={() => setMode('menu')} />
      )}
    </div>
  );
};

// --- 独立的编辑器组件 ---
const ScreenshotEditor = ({ imageUrl, onClose }) => {
  const [selection, setSelection] = useState(null); // { x, y, width, height }
  const [interaction, setInteraction] = useState({ action: 'none', anchor: null });
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [startSelection, setStartSelection] = useState(null);
  
  const containerRef = useRef(null);
  const imageRef = useRef(null);

  // 获取相对于内容区域(含滚动)的坐标
  const getMousePos = (e) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left + containerRef.current.scrollLeft,
      y: e.clientY - rect.top + containerRef.current.scrollTop
    };
  };

  const handleMouseDown = (e, action, anchor = null) => {
    e.preventDefault();
    e.stopPropagation();
    
    const pos = getMousePos(e);
    setStartPos(pos);
    setInteraction({ action, anchor });

    if (action === 'drawing') {
      setSelection({ x: pos.x, y: pos.y, width: 0, height: 0 });
    } else {
      setStartSelection({ ...selection });
    }
  };

  const handleMouseMove = (e) => {
    if (interaction.action === 'none' || !containerRef.current) return;
    e.preventDefault();

    const currentPos = getMousePos(e);
    const deltaX = currentPos.x - startPos.x;
    const deltaY = currentPos.y - startPos.y;
    
    // 自动滚动逻辑：当鼠标靠近视口边缘时滚动容器
    const rect = containerRef.current.getBoundingClientRect();
    const scrollSpeed = 20;
    const edgeThreshold = 50;

    if (e.clientY > rect.bottom - edgeThreshold) containerRef.current.scrollTop += scrollSpeed;
    if (e.clientY < rect.top + edgeThreshold) containerRef.current.scrollTop -= scrollSpeed;
    if (e.clientX > rect.right - edgeThreshold) containerRef.current.scrollLeft += scrollSpeed;
    if (e.clientX < rect.left + edgeThreshold) containerRef.current.scrollLeft -= scrollSpeed;

    if (interaction.action === 'drawing') {
      const newX = deltaX > 0 ? startPos.x : currentPos.x;
      const newY = deltaY > 0 ? startPos.y : currentPos.y;
      const newW = Math.abs(deltaX);
      const newH = Math.abs(deltaY);
      
      setSelection({ x: newX, y: newY, width: newW, height: newH });
    } 
    else if (interaction.action === 'moving' && startSelection) {
      setSelection({
        ...startSelection,
        x: startSelection.x + deltaX,
        y: startSelection.y + deltaY
      });
    }
    else if (interaction.action === 'resizing' && startSelection) {
      // 简化版 resize，完整版需要处理8个方向和负值翻转
      // 这里只演示右下角(se)拖拽效果，为了代码简洁，但逻辑是通用的
      // 真正的全方向 resize 代码较长，这里保留核心逻辑框架
      const s = startSelection;
      let { x, y, width, height } = s;
      const { anchor } = interaction;

      if (anchor.includes('e')) width = s.width + deltaX;
      if (anchor.includes('s')) height = s.height + deltaY;
      if (anchor.includes('w')) { width = s.width - deltaX; x = s.x + deltaX; }
      if (anchor.includes('n')) { height = s.height - deltaY; y = s.y + deltaY; }

      setSelection({ x, y, width: Math.max(10, width), height: Math.max(10, height) });
    }
  };

  const handleMouseUp = () => {
    setInteraction({ action: 'none', anchor: null });
  };

  const confirmCrop = () => {
    if (!selection || !imageRef.current) return;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = imageRef.current;

    // 这里的图片是原图大小显示的 (min-width: 100%)
    // 所以 selection 坐标直接对应图片坐标（除非图片被缩小了）
    // 我们检查一下 naturalWidth 和 clientWidth
    const scale = img.naturalWidth / img.clientWidth;

    canvas.width = selection.width * scale;
    canvas.height = selection.height * scale;

    ctx.drawImage(
      img,
      selection.x * scale, selection.y * scale, selection.width * scale, selection.height * scale,
      0, 0, canvas.width, canvas.height
    );

    const link = document.createElement('a');
    link.download = `imghub-crop-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    
    onClose();
  };

  // 样式辅助
  const handleStyle = "absolute w-3 h-3 bg-white border border-blue-500 rounded-full z-20";
  const positions = {
    nw: { top: -4, left: -4, cursor: 'nw-resize' },
    n:  { top: -4, left: '50%', transform: 'translateX(-50%)', cursor: 'n-resize' },
    ne: { top: -4, right: -4, cursor: 'ne-resize' },
    e:  { top: '50%', right: -4, transform: 'translateY(-50%)', cursor: 'e-resize' },
    se: { bottom: -4, right: -4, cursor: 'se-resize' },
    s:  { bottom: -4, left: '50%', transform: 'translateX(-50%)', cursor: 's-resize' },
    sw: { bottom: -4, left: -4, cursor: 'sw-resize' },
    w:  { top: '50%', left: -4, transform: 'translateY(-50%)', cursor: 'w-resize' },
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center overflow-hidden">
      {/* 滚动容器 */}
      <div 
        ref={containerRef}
        className="relative w-full h-full overflow-auto cursor-crosshair custom-scrollbar"
        onMouseDown={(e) => handleMouseDown(e, 'drawing')}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* 图片层 */}
        <div className="relative min-w-full min-h-full inline-block">
          <img 
            ref={imageRef}
            src={imageUrl} 
            className="block pointer-events-none select-none"
            style={{ minWidth: '100%' }} // 保持原宽或撑满容器
            alt="Source"
          />

          {/* 遮罩层 - 使用 box-shadow 模拟反向遮罩 */}
          {selection && (
            <div
              className="absolute border-2 border-blue-400 group"
              style={{
                left: selection.x,
                top: selection.y,
                width: selection.width,
                height: selection.height,
                boxShadow: '0 0 0 99999px rgba(0, 0, 0, 0.5)', // 超大阴影
                cursor: 'move'
              }}
              onMouseDown={(e) => handleMouseDown(e, 'moving')}
            >
              {/* 尺寸提示 */}
              <div className="absolute -top-8 left-0 bg-black/80 text-white text-xs px-2 py-1 rounded pointer-events-none whitespace-nowrap">
                {Math.round(selection.width)} × {Math.round(selection.height)}
              </div>

              {/* 8个控制点 */}
              {Object.entries(positions).map(([pos, style]) => (
                <div
                  key={pos}
                  className={handleStyle}
                  style={style}
                  onMouseDown={(e) => handleMouseDown(e, 'resizing', pos)}
                />
              ))}

              {/* 确认按钮组 */}
              <div 
                className="absolute flex gap-2 bg-white rounded shadow-lg p-1 pointer-events-auto cursor-default z-30"
                style={{
                  right: 0,
                  bottom: -45,
                }}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <button 
                  onClick={() => setSelection(null)} 
                  className="p-1 hover:bg-gray-100 rounded text-red-500"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="w-px bg-gray-200 mx-1"></div>
                <button 
                  onClick={confirmCrop} 
                  className="p-1 hover:bg-green-50 rounded text-green-500"
                >
                  <Check className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 顶部关闭按钮 */}
      <button 
        onClick={onClose}
        className="fixed top-4 right-4 z-[110] bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition-colors"
      >
        <X className="w-6 h-6" />
      </button>
    </div>
  );
};

export default Screenshot;