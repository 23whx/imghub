import { translateToolText } from '../../i18n/legacyTools.js';
import React, { useState, useRef } from 'react';
import { Download, Type, Palette } from 'lucide-react';

const PornhubStyle = ({ lang: langProp = 'en' }) => {
  const tr = text => translateToolText(langProp, text);
  const [leftText, setLeftText] = useState('Porn');
  const [rightText, setRightText] = useState('Hub');
  const [fontSize, setFontSize] = useState(80);
  const [layout, setLayout] = useState('horizontal'); // 'horizontal' 或 'vertical'
  const [textGap, setTextGap] = useState(10); // 可调节的文字间距，默认改为10
  const [transparent, setTransparent] = useState(false);
  const canvasRef = useRef(null);

  React.useEffect(() => {
    drawCanvas();
  }, [leftText, rightText, fontSize, layout, textGap, transparent]);

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const font = `bold ${fontSize}px Arial, sans-serif`;

    // 画布至少 800×450，文字放不下时按内容尺寸加边距扩大，避免裁切
    ctx.font = font;
    const padding = 10;
    const leftWidth = ctx.measureText(leftText).width;
    const rightWidth = ctx.measureText(rightText).width;
    const contentWidth = layout === 'horizontal'
      ? leftWidth + textGap + rightWidth + padding
      : Math.max(leftWidth, rightWidth + padding * 2);
    const contentHeight = layout === 'horizontal'
      ? fontSize + padding
      : fontSize * 2 + padding + textGap;
    const margin = 40;
    canvas.width = Math.max(800, Math.ceil(contentWidth + margin * 2));
    canvas.height = Math.max(450, Math.ceil(contentHeight + margin * 2));
    const width = canvas.width;
    const height = canvas.height;

    // 调整尺寸已清空画布；非透明时铺黑底
    if (!transparent) {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);
    }

    // 设置字体（改变画布尺寸会重置上下文状态）
    ctx.font = font;
    ctx.textBaseline = 'middle';

    if (layout === 'horizontal') {
      // 横向布局（左右结构）
      drawHorizontalLayout(ctx, width, height);
    } else {
      // 纵向布局（上下结构）
      drawVerticalLayout(ctx, width, height);
    }
  };

  const drawHorizontalLayout = (ctx, width, height) => {
    // 计算文字位置
    const leftWidth = ctx.measureText(leftText).width;
    const rightWidth = ctx.measureText(rightText).width;
    const totalWidth = leftWidth + rightWidth + textGap;
    const startX = (width - totalWidth) / 2;
    const y = height / 2;
    const rightX = startX + leftWidth + textGap;
    const padding = 10;
    const cornerRadius = 5;

    // 1. 先绘制右侧文字背景（橙色圆角矩形）- 确保它在最底层
    ctx.fillStyle = '#FF9900';
    ctx.beginPath();
    ctx.roundRect(
      rightX - padding,
      y - fontSize / 2 - padding / 2 - 3,
      rightWidth + padding * 2,
      fontSize + padding,
      cornerRadius
    );
    ctx.fill();

    // 2. 绘制左侧文字（白色）- 这样如果重叠，白字会遮挡橙色背景
    ctx.fillStyle = '#ffffff';
    ctx.fillText(leftText, startX, y);

    // 3. 绘制右侧文字（黑色）- 在橙色背景之上
    ctx.fillStyle = '#000000';
    ctx.fillText(rightText, rightX, y);
  };

  const drawVerticalLayout = (ctx, width, height) => {
    // 上下布局
    const bottomWidth = ctx.measureText(rightText).width;
    const padding = 10;
    const cornerRadius = 5;
    const boxHeight = fontSize + padding; // 橙色矩形的高度
    
    // 获取文字的精确度量信息
    const metrics = ctx.measureText(leftText);
    const actualAscent = metrics.actualBoundingBoxAscent; // 文字顶部距离基线(中线)的距离
    const actualDescent = metrics.actualBoundingBoxDescent; // 文字底部距离基线(中线)的距离
    
    // 计算上方文字的实际视觉高度 (ink height)
    // 如果不支持 actualBoundingBox，回退到估算值
    const topTextVisualHeight = (actualAscent && actualDescent) 
      ? actualAscent + actualDescent 
      : fontSize * 0.7; 

    // 计算总视觉高度：上方文字实际高度 + 间距 + 下方橙色背景高度
    const totalVisualHeight = topTextVisualHeight + textGap + boxHeight;
    
    // 视觉块的起始Y坐标 (让整体垂直居中)
    const startVisualY = (height - totalVisualHeight) / 2;
    
    // 上方文字的绘制基准点Y (textBaseline = 'middle')
    // 顶部墨迹位置 = startVisualY
    // 绘制点 = startVisualY + actualAscent
    const topY = (actualAscent !== undefined) 
      ? startVisualY + actualAscent 
      : startVisualY + fontSize * 0.35;
    
    // 橙色矩形的顶部Y = 上方文字墨迹底部 + 用户设置的间距
    // 墨迹底部 = topY + actualDescent (或者 startVisualY + topTextVisualHeight)
    const boxTopY = (actualDescent !== undefined)
      ? topY + actualDescent + textGap
      : topY + fontSize * 0.35 + textGap;

    // 下方文字的中心Y = 橙色矩形中心 + 3px偏移 (为了视觉平衡，同横向布局)
    const boxCenterY = boxTopY + boxHeight / 2;
    const bottomY = boxCenterY + 3;

    // 先绘制下方橙色背景（橙色圆角矩形）
    ctx.fillStyle = '#FF9900';
    ctx.beginPath();
    ctx.roundRect(
      (width - bottomWidth) / 2 - padding,
      boxTopY,
      bottomWidth + padding * 2,
      boxHeight,
      cornerRadius
    );
    ctx.fill();

    // 再绘制上方文字（白色）- 这样白色文字会覆盖在橙色之上
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(leftText, width / 2, topY);

    // 最后绘制下方文字（黑色）
    ctx.fillStyle = '#000000';
    ctx.fillText(rightText, width / 2, bottomY);
    
    // 重置textAlign
    ctx.textAlign = 'left';
  };

  const handleExport = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = 'pornhub-style.png';
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <div className="tool-shell">
      <div className="mb-4 sm:mb-8 text-center">
        <h2 className="tool-title">{tr("Pornhub风格Logo生成器")}</h2>
        <p className="tool-subtitle">{tr("制作经典的Pornhub风格Logo")}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
        {/* 左侧控制面板 */}
        <div className="space-y-4 sm:space-y-6">
          <div className="tool-card">
            <div className="flex items-center space-x-2 mb-4">
              <Type className="w-5 h-5 shrink-0" />
              <h2 className="text-lg font-semibold">{tr("文字设置")}</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">{tr("布局方式")}</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setLayout('horizontal')}
                    className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                      layout === 'horizontal'
                        ? 'bg-neutral-900 dark:bg-white text-white dark:text-black'
                        : 'bg-black/5 dark:bg-white/10 text-neutral-700 dark:text-neutral-300 hover:bg-black/10 dark:hover:bg-white/15'
                    }`}
                  >{tr("横向 (左右)")}</button>
                  <button
                    type="button"
                    onClick={() => setLayout('vertical')}
                    className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                      layout === 'vertical'
                        ? 'bg-neutral-900 dark:bg-white text-white dark:text-black'
                        : 'bg-black/5 dark:bg-white/10 text-neutral-700 dark:text-neutral-300 hover:bg-black/10 dark:hover:bg-white/15'
                    }`}
                  >{tr("纵向 (上下)")}</button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">{tr("左侧文字（白色）")}</label>
                <input
                  type="text"
                  value={leftText}
                  onChange={(e) => setLeftText(e.target.value)}
                  className="w-full px-4 py-2 border border-black/15 dark:border-white/15 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:ring-2 focus:ring-black/30 dark:focus:ring-white/30 focus:border-transparent"
                  placeholder={tr("例如：Porn")}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">{tr("右侧文字（橙底黑字）")}</label>
                <input
                  type="text"
                  value={rightText}
                  onChange={(e) => setRightText(e.target.value)}
                  className="w-full px-4 py-2 border border-black/15 dark:border-white/15 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:ring-2 focus:ring-black/30 dark:focus:ring-white/30 focus:border-transparent"
                  placeholder={tr("例如：Hub")}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">{tr("字体大小:")} {fontSize}px
                </label>
                <input
                  type="range"
                  min="40"
                  max="160"
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-full accent-neutral-900 dark:accent-white"
                />
              </div>

              <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                <input
                  type="checkbox"
                  checked={transparent}
                  onChange={(e) => setTransparent(e.target.checked)}
                  className="w-4 h-4 accent-neutral-900 dark:accent-white"
                />
                {tr("透明背景")}
              </label>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">{tr("文字间距:")} {textGap}px
                </label>
                <input
                  type="range"
                  min="0"
                  max="40"
                  value={textGap}
                  onChange={(e) => setTextGap(Number(e.target.value))}
                  className="w-full accent-neutral-900 dark:accent-white"
                />
                <div className="flex justify-between text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  <span>{tr("贴合")}</span>
                  <span>{tr("宽松")}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="tool-card">
            <div className="flex items-center space-x-2 mb-4">
              <Palette className="w-5 h-5 shrink-0" />
              <h2 className="text-lg font-semibold">{tr("快速模板")}</h2>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setLeftText('Porn');
                  setRightText('Hub');
                }}
                className="px-4 py-2 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 rounded-lg text-sm transition-colors"
              >
                PornHub
              </button>
              <button
                type="button"
                onClick={() => {
                  setLeftText('Code');
                  setRightText('Hub');
                }}
                className="px-4 py-2 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 rounded-lg text-sm transition-colors"
              >
                CodeHub
              </button>
              <button
                type="button"
                onClick={() => {
                  setLeftText('Img');
                  setRightText('Hub');
                }}
                className="px-4 py-2 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 rounded-lg text-sm transition-colors"
              >
                ImgHub
              </button>
              <button
                type="button"
                onClick={() => {
                  setLeftText('Study');
                  setRightText('Hub');
                }}
                className="px-4 py-2 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 rounded-lg text-sm transition-colors"
              >
                StudyHub
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleExport}
            className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-neutral-900 dark:bg-white hover:bg-neutral-700 dark:hover:bg-neutral-200 text-white dark:text-black rounded-lg font-medium transition-colors"
          >
            <Download className="w-5 h-5" />
            <span>{tr("下载图片")}</span>
          </button>
        </div>

        {/* 右侧预览区 */}
        <div className="tool-card">
          <h2 className="text-lg font-semibold mb-4">{tr("实时预览")}</h2>
          <div
            className="aspect-video bg-black/5 dark:bg-white/5 rounded-lg overflow-hidden"
            style={transparent ? { background: 'repeating-conic-gradient(#9ca3af 0% 25%, #d1d5db 0% 50%) 50% / 20px 20px' } : undefined}
          >
            <canvas
              ref={canvasRef}
              width={800}
              height={450}
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PornhubStyle;

