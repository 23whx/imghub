import { useEffect, useRef, forwardRef, useImperativeHandle, useState } from 'react';

const CanvasPreview = forwardRef(({ 
  selectedHero,
  customImage,
  subtitle,
  subtitleType,
  fontSize,
  lineHeight,
  textAlign,
  verticalPosition,
  fontFamily,
  textColor,
  language,
}, ref) => {
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const isDrawingRef = useRef(false);
  const PREVIEW_FIXED_WIDTH = 512; // 预览固定显示宽度（px）
  const TEXT_PADDING = 24; // 字幕距画布左右边缘的留白（px）


  useImperativeHandle(ref, () => canvasRef.current);

  // 默认背景图片映射（已上传的6位名人图片）
  const heroImages = {
    jobs: '/assets/heroes/hero_Jobs.png',
    luxun: '/assets/heroes/hero_LuXun.png', 
    mayun: '/assets/heroes/hero_MaYun.png',
    moyan: '/assets/heroes/hero_Moyan.png',
    musk: '/assets/heroes/hero_Musk.png',
    yuhua: '/assets/heroes/hero_Yuhua.png',
  };

  // 获取当前使用的图片URL
  const getCurrentImageUrl = () => {
    if (customImage) return customImage;
    if (selectedHero && heroImages[selectedHero]) return heroImages[selectedHero];
    return null;
  };

  // 解析段落：单语每行一段 [line]，双语每行一对 [top, bottom]
  const parseParagraphs = () => {
    if (subtitleType !== 'mono' && subtitle.includes('---BILINGUAL_SEPARATOR---')) {
      const [topSubtitleStr, bottomSubtitleStr] = subtitle.split('---BILINGUAL_SEPARATOR---');
      const topLines = topSubtitleStr.split('\n').filter(line => line.trim());
      const bottomLines = bottomSubtitleStr.split('\n').filter(line => line.trim());
      const maxLines = Math.max(topLines.length, bottomLines.length);
      const paragraphs = [];
      for (let i = 0; i < maxLines; i++) {
        const topLine = topLines[i] || '';
        const bottomLine = bottomLines[i] || '';
        if (topLine.trim() || bottomLine.trim()) {
          paragraphs.push([topLine, bottomLine]);
        }
      }
      return paragraphs;
    }
    return subtitle.split('\n').filter(line => line.trim()).map(line => [line]);
  };

  // 按可用宽度自动换行：中日文逐字断行，英文按单词断行，超长单词再按字符断开
  const wrapText = (ctx, text, maxWidth) => {
    const tokens = text.match(/[⺀-鿿豈-﫿＀-￯]|[^\s⺀-鿿豈-﫿＀-￯]+|\s+/g) || [];
    const lines = [];
    let line = '';
    const push = () => {
      if (line.trim()) lines.push(line.trim());
      line = '';
    };
    for (const token of tokens) {
      if (ctx.measureText(line + token).width <= maxWidth) {
        line += token;
      } else if (!token.trim()) {
        push();
      } else {
        push();
        if (ctx.measureText(token).width <= maxWidth) {
          line = token;
        } else {
          for (const char of token) {
            if (line && ctx.measureText(line + char).width > maxWidth) push();
            line += char;
          }
        }
      }
    }
    push();
    return lines;
  };

  // 段落排版：换行后的各行、行距和总高度（双语时字号略小、上下行更紧凑）
  const layoutParagraphs = (ctx, paragraphs, areaWidth) => {
    const isBilingual = Array.isArray(paragraphs[0]) && paragraphs[0].length === 2;
    const size = isBilingual ? Math.min(Math.max(14, Math.round(fontSize * 0.85)), 80) : Math.min(fontSize, 80);
    ctx.font = `${size}px ${getFontFamilyString(fontFamily)}`;
    const maxWidth = Math.max(size, areaWidth - TEXT_PADDING * 2);
    const lines = paragraphs.flat().flatMap(text => wrapText(ctx, text, maxWidth));
    const step = isBilingual ? size + Math.max(2, Math.round(size * 0.2)) : size * lineHeight;
    const height = lines.length ? (lines.length - 1) * step + (isBilingual ? size : step) : 0;
    return { size, lines, step, height };
  };

  // 计算画布尺寸：主图宽度最多 800，第二段起每段在下方拼接一条（高度随换行行数增加）
  const measureCanvas = (img) => {
    const maxWidth = 800;
    const width = img.width <= maxWidth ? img.width : maxWidth;
    const baseHeight = img.width <= maxWidth ? img.height : Math.round(img.height * (maxWidth / img.width));
    const ctx = canvasRef.current.getContext('2d');
    const segmentHeights = parseParagraphs().slice(1).map(paragraph => {
      const { height } = layoutParagraphs(ctx, [paragraph], width);
      return Math.max(height + 24, Math.min(160, Math.floor(baseHeight * 0.18)));
    });
    return { width, baseHeight, segmentHeights, height: baseHeight + segmentHeights.reduce((sum, h) => sum + h, 0) };
  };

  // 绘制Canvas内容
  const drawCanvas = () => {
    if (isDrawingRef.current) return; // 防止重复绘制

    const canvas = canvasRef.current;
    if (!canvas) return;

    isDrawingRef.current = true;

    const ctx = canvas.getContext('2d');
    const canvasWidth = canvasSize.width;
    const canvasHeight = canvasSize.height;

    // 设置Canvas尺寸
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // 清空画布
    ctx.fillStyle = '#f3f4f6';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // 根据图片和台词段落调整Canvas尺寸后绘制
    const layoutAndDraw = (img, delay) => {
      const size = measureCanvas(img);
      setCanvasSize({ width: size.width, height: size.height });
      // 延迟绘制避免状态更新冲突
      setTimeout(() => {
        const canvas = canvasRef.current;
        if (canvas) {
          drawImageAndText(canvas.getContext('2d'), img);
        }
      }, delay);
    };

    // 绘制背景图片
    const imageUrl = getCurrentImageUrl();
    if (imageUrl) {
      // img.src 会被解析为绝对地址，需比较原始属性值才能命中缓存
      if (imageRef.current && imageRef.current.getAttribute('src') === imageUrl) {
        // 复用已加载图片，但仍需按当前字幕和自适应裁切重新计算尺寸
        layoutAndDraw(imageRef.current, 10);
      } else {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          imageRef.current = img;
          layoutAndDraw(img, 50);
        };
        img.onerror = () => {
          console.warn(`背景图片加载失败: ${imageUrl}`);
          // 图片加载失败时显示占位图
          drawPlaceholderAndText(ctx, canvasWidth, canvasHeight, `图片加载失败: ${selectedHero || '自定义图片'}`);
        };
        img.src = imageUrl;
      }
    } else {
      // 没有图片时使用默认尺寸，但避免在渲染过程中更新状态
      drawPlaceholderAndText(ctx, canvasWidth, canvasHeight);
    }

    // 重置绘制标志
    isDrawingRef.current = false;
  };

  // 绘制图片和文字（电视截图拼接效果）
  const drawImageAndText = (ctx, img) => {
    const { width: canvasWidth, height: canvasHeight, baseHeight, segmentHeights } = measureCanvas(img);
    // 确保画布实际像素尺寸与即将绘制的尺寸一致，避免浏览器拉伸导致的变形
    if (ctx.canvas.width !== canvasWidth || ctx.canvas.height !== canvasHeight) {
      ctx.canvas.width = canvasWidth;
      ctx.canvas.height = canvasHeight;
    }

    const paragraphs = parseParagraphs();

    // 绘制主图片 - 保持原始宽高比
    ctx.drawImage(img, 0, 0, canvasWidth, baseHeight);

    // 绘制第一段台词在主图片上（双语/单语都绘制），位置由用户选择
    if (paragraphs.length > 0) {
      drawParagraphSubtitle(ctx, [paragraphs[0]], canvasWidth, baseHeight, 0, verticalPosition);
    }

    // 为额外的段落绘制背景：从原图底部复制
    let segmentY = baseHeight;
    for (let i = 1; i < paragraphs.length; i++) {
      const segmentHeight = segmentHeights[i - 1];

      // 计算源区域（从原图底部复制）
      const srcSliceHeight = Math.min(img.height, Math.max(1, Math.round(segmentHeight * (img.height / baseHeight))));
      const srcY = img.height - srcSliceHeight;
      ctx.drawImage(
        img,
        0, srcY, img.width, srcSliceHeight,
        0, segmentY, canvasWidth, segmentHeight
      );

      // 轻微暗化提升可读性（不改变背景一致性）
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.fillRect(0, segmentY, canvasWidth, segmentHeight);

      // 绘制当前段落的台词（传入一对/一段）
      drawParagraphSubtitle(ctx, [paragraphs[i]], canvasWidth, segmentHeight, segmentY, 'bottom');
      segmentY += segmentHeight;
    }
  };

  // 绘制占位图和文字
  const drawPlaceholderAndText = (ctx, canvasWidth, canvasHeight, errorMessage = null) => {
    // 绘制渐变背景
    const gradient = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight);
    gradient.addColorStop(0, '#3b82f6');
    gradient.addColorStop(1, '#8b5cf6');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    // 绘制占位文字
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.font = 'bold 36px Inter, sans-serif';
    ctx.textAlign = 'center';
    
    if (errorMessage) {
      // 显示错误信息
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.font = 'bold 28px Inter, sans-serif';
      ctx.fillText('🖼️ 背景图片未找到', canvasWidth / 2, canvasHeight / 2 - 40);
      
      ctx.font = '16px Inter, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.fillText('请上传自定义图片或添加对应的背景图片文件', canvasWidth / 2, canvasHeight / 2);
      
      ctx.font = '14px Inter, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fillText(`缺失文件: ${errorMessage}`, canvasWidth / 2, canvasHeight / 2 + 30);
    } else {
      // 默认占位文字
      ctx.fillText('选择背景图片', canvasWidth / 2, canvasHeight / 2 - 30);
      
      ctx.font = '18px Inter, sans-serif';
      ctx.fillText('从左侧选择名人背景或上传自定义图片', canvasWidth / 2, canvasHeight / 2 + 20);
    }
    
    // 在占位图中绘制字幕（如果有的话）
    if (subtitle.trim()) {
      const paragraphs = parseParagraphs();
      if (paragraphs.length > 0) {
        drawParagraphSubtitle(ctx, paragraphs, canvasWidth, canvasHeight, 0, verticalPosition);
      }
    }

    // 水印功能已移除
  };

  // 原drawSubtitle函数已被drawParagraphSubtitle替代

  // 获取字体家族字符串
  const getFontFamilyString = (family) => {
    const fontMap = {
      'default': 'Inter, "PingFang SC", "Microsoft YaHei", sans-serif',
      'serif': '"Times New Roman", "SimSun", "宋体", serif',
      'sans-serif': '"Arial", "SimHei", "黑体", sans-serif',
      'monospace': '"Courier New", "SimKai", "楷体", monospace',
      'cursive': '"Brush Script MT", "KaiTi", "楷体", cursive',
      'fantasy': '"Impact", "STHeiti", "华文黑体", fantasy'
    };
    return fontMap[family] || fontMap['default'];
  };

  // 绘制段落字幕（支持双语、自动换行、对齐方式和垂直位置）
  const drawParagraphSubtitle = (ctx, paragraphLines, areaWidth, areaHeight, offsetY, position = 'bottom') => {
    if (!paragraphLines || paragraphLines.length === 0) return;

    const { size, lines, step, height } = layoutParagraphs(ctx, paragraphLines, areaWidth);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.textAlign = textAlign;

    // 基线位置：底部/顶部各留 20px，居中时整体垂直居中
    const startY = position === 'top'
      ? offsetY + 20 + size
      : position === 'middle'
        ? offsetY + (areaHeight - height) / 2 + size
        : offsetY + areaHeight - height - 20 + size;
    const textX = textAlign === 'left' ? TEXT_PADDING : textAlign === 'right' ? areaWidth - TEXT_PADDING : areaWidth / 2;

    lines.forEach((line, index) => {
      const y = startY + index * step;

      // 绘制阴影效果
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillText(line, textX + 3, y + 3);

      // 绘制描边
      ctx.strokeText(line, textX, y);

      // 绘制文字
      ctx.fillStyle = textColor;
      ctx.fillText(line, textX, y);
    });
  };

  // 水印绘制函数已移除

  // 当没有图片时重置为默认尺寸
  useEffect(() => {
    const imageUrl = getCurrentImageUrl();
    if (!imageUrl) {
      setCanvasSize({ width: 800, height: 600 });
    }
  }, [selectedHero, customImage]);

  // 当相关参数变化时重新绘制（使用防抖避免频繁重绘）
  useEffect(() => {
    const timer = setTimeout(() => {
      drawCanvas();
    }, 10);
    
    return () => clearTimeout(timer);
  }, [selectedHero, customImage, subtitle, subtitleType, fontSize, lineHeight, textAlign, verticalPosition, fontFamily, textColor]);

  return (
    <div className="relative">
      <div className="bg-black/5 dark:bg-white/5 rounded-lg overflow-hidden" style={{ width: `${PREVIEW_FIXED_WIDTH}px`, maxWidth: '100%' }}>
        <canvas
          ref={canvasRef}
          className="block w-full h-auto"
          style={{ width: '100%', height: 'auto' }}
        />
      </div>
      
      {/* 预览信息 */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-500 dark:text-neutral-400">
        <span>{canvasSize.width} × {canvasSize.height} · PNG</span>
        <span>{language === 'ja' ? 'ライブプレビュー' : language === 'en' ? 'Live preview' : '实时预览'}</span>
      </div>

      {/* 加载提示 */}
      {getCurrentImageUrl() && (
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none flex items-center justify-center bg-white/80 dark:bg-black/80 rounded-lg opacity-0 transition-opacity duration-300" id="loading-overlay">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900 dark:border-white mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">{language === 'ja' ? '読み込み中…' : language === 'en' ? 'Loading…' : '加载中...'}</p>
          </div>
        </div>
      )}
    </div>
  );
});

CanvasPreview.displayName = 'CanvasPreview';

export default CanvasPreview;
