/**
 * Canvas 绘制工具函数
 */

/**
 * 加载图片
 * @param {string} src - 图片源
 * @returns {Promise<HTMLImageElement>}
 */
export const loadImage = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};

/**
 * 计算文字行数和总高度
 * @param {string} text - 文本内容
 * @param {number} fontSize - 字体大小
 * @param {number} lineHeight - 行高
 * @returns {object} 包含lines和totalHeight的对象
 */
export const calculateTextMetrics = (text, fontSize, lineHeight) => {
  const lines = text.split('\n').filter(line => line.trim());
  const lineHeightPx = fontSize * lineHeight;
  const totalHeight = lines.length * lineHeightPx;
  
  return {
    lines,
    totalHeight,
    lineHeightPx
  };
};

/**
 * 获取文字绘制位置
 * @param {number} canvasWidth - 画布宽度
 * @param {number} canvasHeight - 画布高度
 * @param {string} textAlign - 文字对齐方式
 * @param {string} verticalPosition - 垂直位置
 * @param {number} totalHeight - 文字总高度
 * @param {number} fontSize - 字体大小
 * @returns {object} 包含x和y坐标的对象
 */
export const getTextPosition = (canvasWidth, canvasHeight, textAlign, verticalPosition, totalHeight, fontSize) => {
  let x, y;
  
  // 水平位置
  switch (textAlign) {
    case 'left':
      x = 40;
      break;
    case 'right':
      x = canvasWidth - 40;
      break;
    case 'center':
    default:
      x = canvasWidth / 2;
      break;
  }
  
  // 垂直位置
  switch (verticalPosition) {
    case 'top':
      y = fontSize + 40;
      break;
    case 'center':
      y = (canvasHeight - totalHeight) / 2 + fontSize;
      break;
    case 'bottom':
    default:
      y = canvasHeight - totalHeight - 40 + fontSize;
      break;
  }
  
  return { x, y };
};

/**
 * 绘制带描边和阴影的文字
 * @param {CanvasRenderingContext2D} ctx - Canvas上下文
 * @param {string} text - 文字内容
 * @param {number} x - x坐标
 * @param {number} y - y坐标
 * @param {object} options - 样式选项
 */
export const drawStyledText = (ctx, text, x, y, options = {}) => {
  const {
    fillColor = '#ffffff',
    strokeColor = '#000000',
    strokeWidth = 2,
    shadowColor = 'rgba(0, 0, 0, 0.8)',
    shadowOffset = 2
  } = options;
  
  ctx.save();
  
  // 绘制阴影
  ctx.fillStyle = shadowColor;
  ctx.fillText(text, x + shadowOffset, y + shadowOffset);
  
  // 绘制描边
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = strokeWidth;
  ctx.strokeText(text, x, y);
  
  // 绘制文字
  ctx.fillStyle = fillColor;
  ctx.fillText(text, x, y);
  
  ctx.restore();
};

/**
 * 计算图片在Canvas中的绘制尺寸和位置
 * @param {HTMLImageElement} img - 图片对象
 * @param {number} canvasWidth - 画布宽度
 * @param {number} canvasHeight - 画布高度
 * @param {string} fit - 适应方式 ('cover' | 'contain')
 * @returns {object} 包含绘制参数的对象
 */
export const calculateImageDrawParams = (img, canvasWidth, canvasHeight, fit = 'cover') => {
  const imgAspect = img.width / img.height;
  const canvasAspect = canvasWidth / canvasHeight;
  
  let drawWidth, drawHeight, offsetX, offsetY;
  
  if (fit === 'cover') {
    if (imgAspect > canvasAspect) {
      // 图片更宽，以高度为准
      drawHeight = canvasHeight;
      drawWidth = drawHeight * imgAspect;
      offsetX = (canvasWidth - drawWidth) / 2;
      offsetY = 0;
    } else {
      // 图片更高，以宽度为准
      drawWidth = canvasWidth;
      drawHeight = drawWidth / imgAspect;
      offsetX = 0;
      offsetY = (canvasHeight - drawHeight) / 2;
    }
  } else { // contain
    if (imgAspect > canvasAspect) {
      // 图片更宽，以宽度为准
      drawWidth = canvasWidth;
      drawHeight = drawWidth / imgAspect;
      offsetX = 0;
      offsetY = (canvasHeight - drawHeight) / 2;
    } else {
      // 图片更高，以高度为准
      drawHeight = canvasHeight;
      drawWidth = drawHeight * imgAspect;
      offsetX = (canvasWidth - drawWidth) / 2;
      offsetY = 0;
    }
  }
  
  return {
    drawWidth,
    drawHeight,
    offsetX,
    offsetY
  };
};

/**
 * 创建渐变背景
 * @param {CanvasRenderingContext2D} ctx - Canvas上下文
 * @param {number} width - 宽度
 * @param {number} height - 高度
 * @param {Array<string>} colors - 渐变颜色数组
 * @param {string} direction - 渐变方向 ('horizontal' | 'vertical' | 'diagonal')
 */
export const createGradientBackground = (ctx, width, height, colors, direction = 'diagonal') => {
  let gradient;
  
  switch (direction) {
    case 'horizontal':
      gradient = ctx.createLinearGradient(0, 0, width, 0);
      break;
    case 'vertical':
      gradient = ctx.createLinearGradient(0, 0, 0, height);
      break;
    case 'diagonal':
    default:
      gradient = ctx.createLinearGradient(0, 0, width, height);
      break;
  }
  
  colors.forEach((color, index) => {
    gradient.addColorStop(index / (colors.length - 1), color);
  });
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
};

/**
 * 下载Canvas为图片
 * @param {HTMLCanvasElement} canvas - Canvas元素
 * @param {string} filename - 文件名
 * @param {string} format - 图片格式 ('png' | 'jpeg')
 * @param {number} quality - 图片质量 (0-1)
 */
export const downloadCanvasAsImage = (canvas, filename = 'screenshot', format = 'png', quality = 0.9) => {
  const link = document.createElement('a');
  link.download = `${filename}.${format}`;
  
  if (format === 'jpeg') {
    link.href = canvas.toDataURL(`image/${format}`, quality);
  } else {
    link.href = canvas.toDataURL(`image/${format}`);
  }
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * 检测是否为移动设备
 * @returns {boolean}
 */
export const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

/**
 * 节流函数
 * @param {Function} func - 要节流的函数
 * @param {number} delay - 延迟时间
 * @returns {Function} 节流后的函数
 */
export const throttle = (func, delay) => {
  let timeoutId;
  let lastExecTime = 0;
  
  return function (...args) {
    const currentTime = Date.now();
    
    if (currentTime - lastExecTime > delay) {
      func.apply(this, args);
      lastExecTime = currentTime;
    } else {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func.apply(this, args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  };
};
