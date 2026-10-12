import { translateToolText } from '../../i18n/legacyTools.js';
import { useState, useRef, useEffect } from 'react';
import { Check, X, Monitor, Globe, Download, Loader2 } from 'lucide-react';
import { startScrollCapture } from '../../utils/scrollStitch.js';

const Screenshot = ({ lang: langProp = 'en' }) => {
  const tr = text => translateToolText(langProp, text);
  const [mode, setMode] = useState('menu'); // 'menu', 'scrolling', 'editor'
  const [imageUrl, setImageUrl] = useState(null);
  const [error, setError] = useState('');
  const [stitch, setStitch] = useState({ status: 'started', height: 0, lost: 0 });
  const [finishing, setFinishing] = useState(false);
  const captureRef = useRef(null);
  // 手机浏览器等不支持屏幕捕获；挂载后再检测，避免与服务端渲染结果不一致
  const [canCapture, setCanCapture] = useState(true);
  useEffect(() => {
    setCanCapture(!!navigator.mediaDevices?.getDisplayMedia);
  }, []);

  const showImage = (blob) => {
    setImageUrl(URL.createObjectURL(blob));
    setMode('editor');
    setError('');
  };

  const closeEditor = () => {
    URL.revokeObjectURL(imageUrl);
    setImageUrl(null);
    setMode('menu');
  };

  // --- 1. 获取截图逻辑 ---

  // 方式A: 本地屏幕/窗口截图 (getDisplayMedia)
  const handleLocalCapture = async () => {
    if (!navigator.mediaDevices?.getDisplayMedia) {
      setError(tr("当前浏览器不支持屏幕捕获，请使用电脑版 Chrome、Edge 或 Firefox。"));
      return;
    }
    let stream;
    try {
      stream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: "never" },
        audio: false
      });
      const track = stream.getVideoTracks()[0];
      let frame;
      if (typeof ImageCapture !== 'undefined') {
        frame = await new ImageCapture(track).grabFrame();
      } else {
        // Firefox / Safari 没有 ImageCapture，改从 video 元素取帧
        frame = document.createElement('video');
        frame.muted = true;
        frame.srcObject = stream;
        await frame.play();
      }

      const canvas = document.createElement('canvas');
      canvas.width = frame.videoWidth || frame.width;
      canvas.height = frame.videoHeight || frame.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(frame, 0, 0);
      
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      showImage(blob);
    } catch (err) {
      console.error(err);
      if (err.name !== 'NotAllowedError') {
        setError(tr("无法获取屏幕画面，请检查浏览器权限。"));
      }
    } finally {
      // 无论成功与否都结束屏幕共享
      stream?.getTracks().forEach(track => track.stop());
    }
  };

  // 方式B: 滚动拼接长截图（本地完成，不经过服务器）
  const handleScrollCapture = async () => {
    if (!navigator.mediaDevices?.getDisplayMedia) {
      setError(tr("当前浏览器不支持屏幕捕获，请使用电脑版 Chrome、Edge 或 Firefox。"));
      return;
    }
    let stream;
    try {
      stream = await navigator.mediaDevices.getDisplayMedia({
        // 优先展示“标签页”选项，并隐藏本页，避免截到工具自己
        // 不设上限时帧会被缩放到屏幕尺寸；给足上限即可拿到标签页原始分辨率
        video: { displaySurface: 'browser', width: { max: 8192 }, height: { max: 8192 } },
        audio: false,
        selfBrowserSurface: 'exclude',
        surfaceSwitching: 'exclude',
      });
    } catch (err) {
      if (err.name !== 'NotAllowedError') setError(tr("无法获取屏幕画面，请检查浏览器权限。"));
      return;
    }
    setError('');
    setFinishing(false);
    setStitch({ status: 'started', height: 0, lost: 0 });
    setMode('scrolling');
    const capture = startScrollCapture(stream, {
      // 偶尔一帧对不上很正常，连续多帧对不上才提示用户
      onUpdate: (update) => setStitch(previous => ({ ...update, lost: update.status === 'lost' ? previous.lost + 1 : 0 })),
    });
    captureRef.current = capture;
    try {
      const blob = await capture.result;
      if (captureRef.current === capture) showImage(blob);
    } catch {
      if (captureRef.current === capture) {
        setError(tr("没有收到画面，请重新开始并选择要截取的标签页。"));
        setMode('menu');
      }
    } finally {
      if (captureRef.current === capture) captureRef.current = null;
      setFinishing(false);
    }
  };

  const finishScrollCapture = () => {
    setFinishing(true);
    captureRef.current?.stop();
  };

  const cancelScrollCapture = () => {
    const capture = captureRef.current;
    captureRef.current = null;
    capture?.stop();
    setMode('menu');
  };

  const stitchMessage = {
    lost: stitch.lost >= 5 ? tr("画面对不上了：请往回滚动一点，再慢一些向下滚动。") : '',
    flat: tr("当前是大片空白，继续向下滚动即可。"),
    resized: tr("窗口尺寸改变了，请恢复原来的尺寸，或完成后重新开始。"),
    full: tr("已达到最大高度，拼接自动结束。"),
  }[stitch.status] || '';

  return (
    <div className="tool-shell">
      <div className="mb-4 sm:mb-8 text-center">
        <h2 className="tool-title">{tr("网页截图工具")}</h2>
        <p className="tool-subtitle">{tr("支持即时屏幕截图与滚动拼接长截图，全部在本机完成")}</p>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="max-w-2xl mx-auto mb-6 p-4 tool-card !rounded-lg border-black/10 dark:border-white/10 text-center animate-fade-in font-medium">
          {error}
        </div>
      )}

      {/* 不支持屏幕捕获时直接说明，而不是等点击后再报错 */}
      {mode === 'menu' && !canCapture && !error && (
        <div className="max-w-2xl mx-auto mb-6 p-4 tool-card !rounded-lg text-center font-medium" role="status">
          {tr("当前浏览器不支持屏幕捕获，请使用电脑版 Chrome、Edge 或 Firefox。")}
        </div>
      )}

      {/* 模式选择菜单 */}
      {mode === 'menu' && (
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* 选项1: 即时截图 */}
          <button
            onClick={handleLocalCapture}
            disabled={!canCapture}
            className="group tool-card !p-8 border-2 !border-black/10 dark:!border-white/10 hover:!border-black/40 dark:hover:!border-white/40 transition-all text-left flex flex-col h-full disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:!border-black/10 dark:disabled:hover:!border-white/10"
          >
            <div className="bg-black/5 dark:bg-white/10 w-16 h-16 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Monitor className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold mb-2">{tr("即时截图")}</h3>
            <p className="text-neutral-500 dark:text-neutral-400 mb-4 flex-grow">{tr("调用浏览器原生功能，直接选择标签页、窗口或屏幕进行截图。")}</p>
            <span className="font-medium flex items-center gap-1 group-hover:translate-x-1 transition-transform">{tr("开始截图 →")}</span>
          </button>

          {/* 选项2: 网页长截图 */}
          <button
            onClick={handleScrollCapture}
            disabled={!canCapture}
            className="group tool-card !p-8 border-2 !border-black/10 dark:!border-white/10 hover:!border-black/40 dark:hover:!border-white/40 transition-all text-left flex flex-col h-full disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:!border-black/10 dark:disabled:hover:!border-white/10"
          >
            <div className="bg-black/5 dark:bg-white/10 w-16 h-16 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Globe className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold mb-2">{tr("网页长截图")}</h3>
            <p className="text-neutral-500 dark:text-neutral-400 mb-4 flex-grow">{tr("选择要截取的标签页，在该页面中向下滚动，画面会自动拼接成一张长图。")}</p>
            <span className="font-medium flex items-center gap-1 group-hover:translate-x-1 transition-transform">{tr("选择标签页 →")}</span>
          </button>
        </div>
      )}

      {/* 滚动拼接进行中 */}
      {mode === 'scrolling' && (
        <div className="max-w-2xl mx-auto tool-card !p-8 animate-fade-in" aria-live="polite">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Globe className="w-6 h-6" />{tr("正在拼接长截图")}</h3>
          <ol className="list-decimal pl-5 space-y-1 text-neutral-600 dark:text-neutral-300 mb-6">
            <li>{tr("切换到刚才选择的标签页，先回到页面顶部。")}</li>
            <li>{tr("匀速向下滚动到想截取的位置，滚轮或 PageDown 都可以。")}</li>
            <li>{tr("回到这里点击“完成拼接”，或点浏览器的“停止共享”。")}</li>
          </ol>
          <p className="text-lg font-semibold mb-2">{tr("已拼接高度：")}{stitch.height} px</p>
          {stitchMessage && <p className="text-sm font-medium mb-4" role="status">{stitchMessage}</p>}
          <div className="flex flex-wrap gap-3 mt-6">
            <button
              onClick={finishScrollCapture}
              disabled={finishing}
              className="px-6 py-3 bg-neutral-900 dark:bg-white hover:bg-neutral-700 dark:hover:bg-neutral-200 text-white dark:text-black rounded-lg font-medium disabled:opacity-50 flex items-center gap-2"
            >
              {finishing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
              {finishing ? tr("生成中...") : tr("完成拼接")}
            </button>
            <button
              onClick={cancelScrollCapture}
              className="px-6 py-3 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 rounded-lg font-medium"
            >{tr("取消")}</button>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-6">{tr("画面只在本机处理，不会上传。固定在顶部或底部的导航栏只保留一次；建议使用 Chrome 或 Edge，其他浏览器在后台取帧较慢，请放慢滚动。")}</p>
        </div>
      )}

      {/* 全屏编辑器组件 */}
      {mode === 'editor' && imageUrl && (
        <ScreenshotEditor imageUrl={imageUrl} onClose={closeEditor} tr={tr} />
      )}
    </div>
  );
};

// --- 独立的编辑器组件 ---
const ScreenshotEditor = ({ imageUrl, onClose, tr }) => {
  const PAD = 16; // 图片四周留白，让贴边的控制点也能拖到
  const [selection, setSelection] = useState(null); // { x, y, width, height }，相对图片层（含留白）
  const [interaction, setInteraction] = useState({ action: 'none', anchor: null });
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [startSelection, setStartSelection] = useState(null);

  const containerRef = useRef(null);
  const imageRef = useRef(null);

  // 默认选中整张图片
  const fullSelection = () => {
    const img = imageRef.current;
    return img ? { x: PAD, y: PAD, width: img.clientWidth, height: img.clientHeight } : null;
  };

  // 把选区限制在图片范围内
  const clampSelection = ({ x, y, width, height }) => {
    const img = imageRef.current;
    const maxX = PAD + img.clientWidth;
    const maxY = PAD + img.clientHeight;
    const left = Math.min(Math.max(PAD, x), maxX);
    const top = Math.min(Math.max(PAD, y), maxY);
    return {
      x: left,
      y: top,
      width: Math.max(0, Math.min(x + width, maxX) - left),
      height: Math.max(0, Math.min(y + height, maxY) - top),
    };
  };

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
      setSelection(clampSelection({ x: pos.x, y: pos.y, width: 0, height: 0 }));
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

      setSelection(clampSelection({ x: newX, y: newY, width: newW, height: newH }));
    }
    else if (interaction.action === 'moving' && startSelection) {
      // 移动时保持尺寸，只在图片范围内平移
      const img = imageRef.current;
      setSelection({
        ...startSelection,
        x: Math.min(Math.max(PAD, startSelection.x + deltaX), PAD + img.clientWidth - startSelection.width),
        y: Math.min(Math.max(PAD, startSelection.y + deltaY), PAD + img.clientHeight - startSelection.height)
      });
    }
    else if (interaction.action === 'resizing' && startSelection) {
      const s = startSelection;
      let { x, y, width, height } = s;
      const { anchor } = interaction;

      if (anchor.includes('e')) width = s.width + deltaX;
      if (anchor.includes('s')) height = s.height + deltaY;
      if (anchor.includes('w')) { width = s.width - deltaX; x = s.x + deltaX; }
      if (anchor.includes('n')) { height = s.height - deltaY; y = s.y + deltaY; }

      // 最小 10px；从左/上边缩小时固定右/下边
      if (width < 10) { if (anchor.includes('w')) x = s.x + s.width - 10; width = 10; }
      if (height < 10) { if (anchor.includes('n')) y = s.y + s.height - 10; height = 10; }
      setSelection(clampSelection({ x, y, width, height }));
    }
  };

  const handleMouseUp = () => {
    // 单击没有拖出选区时恢复为整张图片
    if (interaction.action === 'drawing' && selection && (selection.width < 5 || selection.height < 5)) {
      setSelection(fullSelection());
    }
    setInteraction({ action: 'none', anchor: null });
  };

  const img = imageRef.current;
  const scale = img && img.clientWidth ? img.naturalWidth / img.clientWidth : 1;
  const exportWidth = selection ? Math.round(selection.width * scale) : 0;
  const exportHeight = selection ? Math.round(selection.height * scale) : 0;
  const isFull = !!img && exportWidth === img.naturalWidth && exportHeight === img.naturalHeight;

  const exportSelection = () => {
    if (!selection || !img || exportWidth < 1 || exportHeight < 1) return;
    const link = document.createElement('a');
    link.download = `imghub-screenshot-${Date.now()}.png`;
    if (isFull) {
      // 整张图片直接保存原文件，无需重新编码
      link.href = imageUrl;
      link.click();
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = exportWidth;
    canvas.height = exportHeight;
    canvas.getContext('2d').drawImage(
      img,
      Math.round((selection.x - PAD) * scale), Math.round((selection.y - PAD) * scale), exportWidth, exportHeight,
      0, 0, exportWidth, exportHeight
    );
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    }, 'image/png');
  };

  // 样式辅助
  const handleStyle = "absolute w-3 h-3 bg-white border border-neutral-900 rounded-full z-20";
  const positions = {
    nw: { top: -6, left: -6, cursor: 'nw-resize' },
    n:  { top: -6, left: '50%', transform: 'translateX(-50%)', cursor: 'n-resize' },
    ne: { top: -6, right: -6, cursor: 'ne-resize' },
    e:  { top: '50%', right: -6, transform: 'translateY(-50%)', cursor: 'e-resize' },
    se: { bottom: -6, right: -6, cursor: 'se-resize' },
    s:  { bottom: -6, left: '50%', transform: 'translateX(-50%)', cursor: 's-resize' },
    sw: { bottom: -6, left: -6, cursor: 'sw-resize' },
    w:  { top: '50%', left: -6, transform: 'translateY(-50%)', cursor: 'w-resize' },
  };
  const toolbarButton = "bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-full transition-colors flex items-center gap-2 text-sm disabled:opacity-40 disabled:hover:bg-white/10";

  return (
    <div className="fixed inset-0 z-[100] bg-neutral-950 flex flex-col overflow-hidden">
      {/* 顶部工具栏：独占一行，不遮挡图片和控制点；导出范围默认整张图片 */}
      <div className="shrink-0 flex flex-wrap items-center justify-end gap-2 px-4 py-3 border-b border-white/10">
        <div className="mr-auto text-white text-sm">
          {tr("导出范围：")}{exportWidth} × {exportHeight} px{isFull ? tr("（整张）") : ''}
          <span className="hidden sm:inline text-white/60 ml-3">{tr("拖动边框或四角调整范围")}</span>
        </div>
        <button onClick={() => setSelection(fullSelection())} disabled={isFull} className={toolbarButton}>
          {tr("选择整张")}</button>
        <button onClick={exportSelection} disabled={!selection} className="studio-button !min-h-0 !py-2 !gap-2 !text-sm disabled:opacity-50">
          <Download className="w-4 h-4" />{tr("下载选区")}</button>
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          aria-label={tr("关闭")}
          className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* 滚动容器 */}
      <div
        ref={containerRef}
        className="relative flex-1 min-h-0 w-full overflow-auto cursor-crosshair custom-scrollbar"
        onMouseDown={(e) => handleMouseDown(e, 'drawing')}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* 图片层 */}
        <div className="relative min-w-full min-h-full inline-block" style={{ padding: PAD }}>
          <img
            ref={imageRef}
            src={imageUrl}
            className="block pointer-events-none select-none"
            style={{ minWidth: '100%' }} // 保持原宽或撑满容器
            alt="Source"
            onLoad={() => setSelection(fullSelection())}
          />

          {/* 遮罩层 - 使用 box-shadow 模拟反向遮罩 */}
          {selection && (
            <div
              className="absolute border-2 border-white group"
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
              {/* 8个控制点 */}
              {Object.entries(positions).map(([pos, style]) => (
                <div
                  key={pos}
                  className={handleStyle}
                  style={style}
                  onMouseDown={(e) => handleMouseDown(e, 'resizing', pos)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Screenshot;
