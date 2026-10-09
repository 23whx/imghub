import React, { useEffect, useRef, forwardRef, useImperativeHandle, useState } from 'react';

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
  isDarkMode,
  language,
}, ref) => {
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [aspectRatio, setAspectRatio] = useState(4/3);
  const isDrawingRef = useRef(false);
  const PREVIEW_FIXED_WIDTH = 512; // 预览固定显示宽度（px）


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

    // 绘制背景图片
    const imageUrl = getCurrentImageUrl();
    if (imageUrl) {
      if (imageRef.current && imageRef.current.src === imageUrl) {
        // 复用已加载图片，但仍需按当前字幕和自适应裁切重新计算尺寸
        const img = imageRef.current;
        const maxWidth = 800;
        const imgWidth = img.width;
        const imgHeight = img.height;
        let baseCanvasWidth, baseCanvasHeight;
        if (imgWidth <= maxWidth) {
          baseCanvasWidth = imgWidth;
          baseCanvasHeight = imgHeight;
        } else {
          const scale = maxWidth / imgWidth;
          baseCanvasWidth = maxWidth;
          baseCanvasHeight = Math.round(imgHeight * scale);
        }

        // 解析段落（与实际绘制逻辑一致）
        let paragraphs;
        if (subtitleType !== 'mono' && subtitle.includes('---BILINGUAL_SEPARATOR---')) {
          const [topSubtitleStr, bottomSubtitleStr] = subtitle.split('---BILINGUAL_SEPARATOR---');
          const topLines = topSubtitleStr.split('\n').filter(line => line.trim());
          const bottomLines = bottomSubtitleStr.split('\n').filter(line => line.trim());
          const maxLines = Math.max(topLines.length, bottomLines.length);
          paragraphs = [];
          for (let i = 0; i < maxLines; i++) {
            const topLine = topLines[i] || '';
            const bottomLine = bottomLines[i] || '';
            if (topLine.trim() || bottomLine.trim()) {
              paragraphs.push([topLine, bottomLine]);
            }
          }
        } else {
          const subtitleLines = subtitle.split('\n').filter(line => line.trim());
          paragraphs = subtitleLines.map(line => [line]);
        }

        // 计算每个段落的高度（与实际绘制一致）
        const isBilingualCalc = Array.isArray(paragraphs[0]) && paragraphs[0].length === 2;
        const subtitleFontSizeLocal = Math.min(fontSize, 80);
        const adjustedFontSize = isBilingualCalc ? Math.max(14, Math.round(subtitleFontSizeLocal * 0.85)) : subtitleFontSizeLocal;
        const normalLineHeightPx = adjustedFontSize * lineHeight;
        const pairGapPx = Math.max(2, Math.round(adjustedFontSize * 0.2));
        const perBlockHeight = isBilingualCalc ? (adjustedFontSize * 2 + pairGapPx) : normalLineHeightPx;
        const extraSegmentHeight = Math.max(perBlockHeight + 24, Math.min(160, Math.floor(baseCanvasHeight * 0.18)));
        const additionalSegments = Math.max(0, paragraphs.length - 1);
        const finalCanvasHeight = baseCanvasHeight + (additionalSegments * extraSegmentHeight);
        setCanvasSize({ width: baseCanvasWidth, height: finalCanvasHeight });
        setAspectRatio(baseCanvasWidth / finalCanvasHeight);
        setTimeout(() => {
          const canvas = canvasRef.current;
          if (canvas) {
            const ctx2 = canvas.getContext('2d');
            drawImageAndText(ctx2, img, baseCanvasWidth, finalCanvasHeight);
          }
        }, 10);
      } else {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          imageRef.current = img;
          
          // 根据图片和台词段落数量动态调整Canvas尺寸
          const maxWidth = 800; // 最大宽度限制
          const imgWidth = img.width;
          const imgHeight = img.height;
          
          let baseCanvasWidth, baseCanvasHeight;
          
          // 计算基础图片在Canvas中的尺寸
          if (imgWidth <= maxWidth) {
            baseCanvasWidth = imgWidth;
            baseCanvasHeight = imgHeight;
          } else {
            const scale = maxWidth / imgWidth;
            baseCanvasWidth = maxWidth;
            baseCanvasHeight = Math.round(imgHeight * scale);
          }
          
          // 解析段落（与实际绘制逻辑一致）
          let paragraphs;
          if (subtitleType !== 'mono' && subtitle.includes('---BILINGUAL_SEPARATOR---')) {
            const [topSubtitleStr, bottomSubtitleStr] = subtitle.split('---BILINGUAL_SEPARATOR---');
            const topLines = topSubtitleStr.split('\n').filter(line => line.trim());
            const bottomLines = bottomSubtitleStr.split('\n').filter(line => line.trim());
            const maxLines = Math.max(topLines.length, bottomLines.length);
            paragraphs = [];
            for (let i = 0; i < maxLines; i++) {
              const topLine = topLines[i] || '';
              const bottomLine = bottomLines[i] || '';
              if (topLine.trim() || bottomLine.trim()) {
                paragraphs.push([topLine, bottomLine]);
              }
            }
          } else {
            const subtitleLines = subtitle.split('\n').filter(line => line.trim());
            paragraphs = subtitleLines.map(line => [line]);
          }

          // 计算每个段落的高度（与实际绘制一致）
          const isBilingualCalc = Array.isArray(paragraphs[0]) && paragraphs[0].length === 2;
          const subtitleFontSizeLocal = Math.min(fontSize, 80);
          const adjustedFontSize = isBilingualCalc ? Math.max(14, Math.round(subtitleFontSizeLocal * 0.85)) : subtitleFontSizeLocal;
          const normalLineHeightPx = adjustedFontSize * lineHeight;
          const pairGapPx = Math.max(2, Math.round(adjustedFontSize * 0.2));
          const perBlockHeight = isBilingualCalc ? (adjustedFontSize * 2 + pairGapPx) : normalLineHeightPx;
          const extraSegmentHeight = Math.max(perBlockHeight + 24, Math.min(160, Math.floor(baseCanvasHeight * 0.18)));
          const additionalSegments = Math.max(0, paragraphs.length - 1);

          // 计算最终Canvas尺寸
          const finalCanvasHeight = baseCanvasHeight + (additionalSegments * extraSegmentHeight);

          // 更新Canvas尺寸和宽高比
          setCanvasSize({ width: baseCanvasWidth, height: finalCanvasHeight });
          setAspectRatio(baseCanvasWidth / finalCanvasHeight);

          // 延迟绘制避免状态更新冲突
          setTimeout(() => {
            const canvas = canvasRef.current;
            if (canvas) {
              const ctx = canvas.getContext('2d');
              drawImageAndText(ctx, img, baseCanvasWidth, finalCanvasHeight);
            }
          }, 50);
        };
        img.onerror = (error) => {
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
  const drawImageAndText = (ctx, img, canvasWidth, canvasHeight) => {
    // 确保画布实际像素尺寸与即将绘制的尺寸一致，避免浏览器拉伸导致的变形
    if (ctx.canvas.width !== canvasWidth || ctx.canvas.height !== canvasHeight) {
      ctx.canvas.width = canvasWidth;
      ctx.canvas.height = canvasHeight;
    }

    // 计算台词段落（每1行为一段）
    let paragraphs;
    
    // 仅当处于双语模式时，解析分隔符
    if (subtitleType !== 'mono' && subtitle.includes('---BILINGUAL_SEPARATOR---')) {
      const [topSubtitle, bottomSubtitle] = subtitle.split('---BILINGUAL_SEPARATOR---');
      const topLines = topSubtitle.split('\n').filter(line => line.trim());
      const bottomLines = bottomSubtitle.split('\n').filter(line => line.trim());
      
      // 双语模式：每行包含上下两个字幕
      const maxLines = Math.max(topLines.length, bottomLines.length);
      paragraphs = [];
      for (let i = 0; i < maxLines; i++) {
        const topLine = topLines[i] || '';
        const bottomLine = bottomLines[i] || '';
        if (topLine.trim() || bottomLine.trim()) {
          paragraphs.push([topLine, bottomLine]);
        }
      }
    } else {
      // 单语模式：每行单独成段
      const subtitleLines = subtitle.split('\n').filter(line => line.trim());
      paragraphs = subtitleLines.map(line => [line]);
    }
    
    // 计算基础图片尺寸，保持原始宽高比
    const maxWidth = 800;
    let baseWidth, baseHeight;
    
    if (img.width <= maxWidth) {
      baseWidth = img.width;
      baseHeight = img.height;
    } else {
      const scale = maxWidth / img.width;
      baseWidth = maxWidth;
      baseHeight = Math.round(img.height * scale);
    }
    
    // 绘制主图片 - 保持原始宽高比
    ctx.drawImage(img, 0, 0, canvasWidth, baseHeight);
    
    // 可选遮罩（关闭以避免条纹视觉干扰）
    // ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    // ctx.fillRect(0, 0, canvasWidth, baseHeight);
    
    // 绘制第一段台词在主图片上（双语/单语都绘制）
    const hasBilingualPairs = Array.isArray(paragraphs[0]) && paragraphs[0].length === 2;
    if (paragraphs.length > 0) {
      drawParagraphSubtitle(ctx, [paragraphs[0]], canvasWidth, baseHeight, 0);
    }
    
    // 为额外的段落绘制背景：从原图底部复制
    // 段落高度基于模式和字体，确保一对上下字幕能完整容纳且间距更紧凑
    const subtitleFontSizeLocal = Math.min(fontSize, 80);
    const adjustedFontSize = hasBilingualPairs ? Math.max(14, Math.round(subtitleFontSizeLocal * 0.85)) : subtitleFontSizeLocal;
    const normalLineHeightPx = adjustedFontSize * lineHeight;
    const pairGapPx = Math.max(2, Math.round(adjustedFontSize * 0.2));
    const perBlockHeight = hasBilingualPairs
      ? (adjustedFontSize * 2 + pairGapPx)
      : normalLineHeightPx;
    const extraSegmentHeight = Math.max(perBlockHeight + 24, Math.min(160, Math.floor(baseHeight * 0.18)));
    
    const startIndex = 1; // 主图已绘制第一段，从第二段开始拼接
    for (let i = startIndex; i < paragraphs.length; i++) {
      const segmentY = baseHeight + (i - startIndex) * extraSegmentHeight;
      
      // 计算源区域（从原图底部复制）
      const srcSliceHeight = Math.max(1, Math.round(extraSegmentHeight * (img.height / baseHeight)));
      const srcY = Math.max(0, img.height - srcSliceHeight);
      ctx.drawImage(
        img,
        0, srcY, img.width, srcSliceHeight,
        0, segmentY, canvasWidth, extraSegmentHeight
      );
      
      // 轻微暗化渐变以提升可读性（顶部更深，向下过渡）
      // 轻微暗化提升可读性（不改变背景一致性）
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.fillRect(0, segmentY, canvasWidth, extraSegmentHeight);
      
      // 绘制当前段落的台词（传入一对/一段）
      drawParagraphSubtitle(ctx, [paragraphs[i]], canvasWidth, extraSegmentHeight, segmentY);
    }
    
    // 水印功能已移除
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
      let paragraphs;
      
      // 仅当处于双语模式时解析分隔符
      if (subtitleType !== 'mono' && subtitle.includes('---BILINGUAL_SEPARATOR---')) {
        const [topSubtitle, bottomSubtitle] = subtitle.split('---BILINGUAL_SEPARATOR---');
        const topLines = topSubtitle.split('\n').filter(line => line.trim());
        const bottomLines = bottomSubtitle.split('\n').filter(line => line.trim());
        
        // 双语模式：每行包含上下两个字幕
        const maxLines = Math.max(topLines.length, bottomLines.length);
        paragraphs = [];
        for (let i = 0; i < maxLines; i++) {
          const topLine = topLines[i] || '';
          const bottomLine = bottomLines[i] || '';
          if (topLine.trim() || bottomLine.trim()) {
            paragraphs.push([topLine, bottomLine]);
          }
        }
      } else {
        // 单语模式：每行单独成段
        const lines = subtitle.split('\n').filter(line => line.trim());
        paragraphs = lines.map(line => [line]);
      }
      
      if (paragraphs.length > 0) {
        drawParagraphSubtitle(ctx, paragraphs, canvasWidth, canvasHeight, 0);
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

  // 绘制单个段落的字幕（支持双语）
  const drawParagraphSubtitle = (ctx, paragraphLines, areaWidth, areaHeight, offsetY) => {
    if (!paragraphLines || paragraphLines.length === 0) return;

    // 检查是否为双语模式（元素为 [top, bottom] 的一对）
    const isBilingual = Array.isArray(paragraphLines[0]) && paragraphLines[0].length === 2;
    
    // 设置字体样式
    // 双语模式默认把字号调小一些，使两行更紧凑适配同一背景
    const subtitleFontSize = isBilingual ? Math.min(Math.max(14, Math.round(fontSize * 0.85)), 80) : Math.min(fontSize, 80);
    const fontFamilyString = getFontFamilyString(fontFamily);
    ctx.font = `${subtitleFontSize}px ${fontFamilyString}`;
    ctx.fillStyle = textColor;
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.textAlign = 'center';

    if (isBilingual) {
      // 双语模式：每个段落仅包含一对上下字幕
      const topBottomGap = Math.max(2, Math.round(subtitleFontSize * 0.2));
      const singlePairHeight = subtitleFontSize + topBottomGap + subtitleFontSize; // 上行 + 间距 + 下行
      const totalHeight = paragraphLines.length * singlePairHeight;
      
      // 字幕在当前区域底部
      const startY = offsetY + areaHeight - totalHeight - 20 + subtitleFontSize;
      const textX = areaWidth / 2;

      // 绘制每一对双语字幕
      paragraphLines.forEach((linePair, pairIndex) => {
        const [topLine, bottomLine] = linePair;
        const pairY = startY + pairIndex * singlePairHeight;
        
        // 绘制上方字幕
        if (topLine && topLine.trim()) {
          const topY = pairY;
          // 阴影
          ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
          ctx.fillText(topLine, textX + 3, topY + 3);
          // 描边
          ctx.strokeText(topLine, textX, topY);
          // 文字
          ctx.fillStyle = textColor;
          ctx.fillText(topLine, textX, topY);
        }
        
        // 绘制下方字幕
        if (bottomLine && bottomLine.trim()) {
          const bottomY = pairY + subtitleFontSize + topBottomGap;
          // 阴影
          ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
          ctx.fillText(bottomLine, textX + 3, bottomY + 3);
          // 描边
          ctx.strokeText(bottomLine, textX, bottomY);
          // 文字
          ctx.fillStyle = textColor;
          ctx.fillText(bottomLine, textX, bottomY);
        }
      });
    } else {
      // 单语模式：原有逻辑
      const lineHeightPx = subtitleFontSize * lineHeight;
      const totalHeight = paragraphLines.length * lineHeightPx;
      
      // 字幕在当前区域底部
      const startY = offsetY + areaHeight - totalHeight - 20 + subtitleFontSize;
      const textX = areaWidth / 2;

      // 绘制每一行文字
      paragraphLines.forEach((line, index) => {
        const y = startY + index * lineHeightPx;
        
        // 绘制阴影效果
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillText(line, textX + 3, y + 3);
        
        // 绘制描边
        ctx.strokeText(line, textX, y);
        
        // 绘制文字
        ctx.fillStyle = textColor;
        ctx.fillText(line, textX, y);
      });
    }
  };

  // 水印绘制函数已移除

  // 当没有图片时重置为默认尺寸
  useEffect(() => {
    const imageUrl = getCurrentImageUrl();
    if (!imageUrl) {
      setCanvasSize({ width: 800, height: 600 });
      setAspectRatio(4/3);
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
