# 网站图标说明

## 已生成的图标文件

本项目使用完整的 favicon 方案，确保在所有平台和导航站点正确显示：

### 主图标
- **favicon.svg** - 矢量图标（现代浏览器）
- **favicon.ico** - 传统 ICO 格式（最广泛支持）

### PNG 格式图标
- **favicon-16x16.png** - 小尺寸图标
- **favicon-32x32.png** - 标准尺寸图标
- **favicon-512x512.png** - 高分辨率图标（用于 Open Graph）

### 移动平台图标
- **apple-touch-icon.png** (180x180) - iOS/macOS
- **android-chrome-192x192.png** - Android 标准尺寸
- **android-chrome-512x512.png** - Android 高分辨率

### 配置文件
- **site.webmanifest** - PWA 配置文件

## 图标设计说明

图标采用蓝紫渐变背景，中心是一个屏幕框架配合字幕条的设计，体现"字幕截图生成器"的主题：
- 🎬 屏幕框架代表视频/截图
- 📝 双层字幕条代表字幕功能
- 💬 淡色引号装饰强调"语录"概念

## 导航站显示

像 [OumaShu](https://oumashu.top/) 这样的导航站会自动抓取以下标签：
1. `<link rel="icon" href="/favicon.ico">` （优先）
2. `<link rel="apple-touch-icon">` （iOS 设备）
3. `<meta property="og:image">` （社交分享）
4. `<link rel="manifest">` （PWA 应用）

所有这些标签都已在项目中正确配置。

## 验证方法

访问以下 URL 检查图标是否正确加载：
- http://localhost:4321/favicon.ico ✓
- http://localhost:4321/favicon.svg ✓
- http://localhost:4321/apple-touch-icon.png ✓
- http://localhost:4321/site.webmanifest ✓

## 缓存刷新

上传到服务器后：
1. 清除浏览器缓存（Ctrl+Shift+Delete）
2. 等待导航站重新抓取（通常 1-24 小时）
3. 如需立即更新，可联系导航站管理员手动刷新

