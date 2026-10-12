# ImgHub 关键词与页面映射

正式域名：https://imghub.oumashu.top/ 。每个工具只保留一个稳定的页面；格式、使用场景和问题作为该页的辅助内容，避免创建大量内容相同的关键词落地页。

下列词来自实际功能、用户意图和本次搜索样本，属于待验证的关键词方案。没有付费关键词库或 Search Console 数据，未填写搜索量、难度或排名。上线后按国家、语言、页面分析真实曝光和点击，再调整文案。

| 页面路径（语言前缀后） | 中文主关键词 / 辅助词 | English primary / supporting queries | 日本語 主語 / 補助語 |
| --- | --- | --- | --- |
| 首页 | 免费在线图片工具 / 图片处理工具集 | free online image tools / browser image toolkit | 無料オンライン画像ツール / 画像編集ツール集 |
| tools/online-drawing/ | 在线画图 / 免费图片编辑、图层编辑、在线修图 | online drawing / free image editor, layers, crop | オンライン描画 / お絵かき、画像編集、レイヤー |
| tools/image-enhancer/ | 图片变清晰 / AI 图片增强、超分辨率、2 倍与 4 倍图片放大 | AI image enhancer / image upscaler, super resolution, local processing | 画像高画質化 / 鮮明化、超解像、画像拡大、端末内処理 |
| tools/image-compress/ | 图片压缩 / 压缩到指定大小、PNG 压缩、WebP 压缩、批量压缩 | image compressor / reduce image size (in title), target KB, batch compression | 画像圧縮 / 一括圧縮、目標容量、PNG 圧縮 |
| tools/image-ocr/ | 图片转文字 / 图片文字识别、在线 OCR、框选识别 | online OCR / image to text, screenshot text extraction | オンライン OCR / 画像から文字認識、範囲指定 |
| tools/subtitle-generator/ | 截图字幕生成器 / 字幕截图、图片加字幕 | subtitle screenshot generator / caption image maker | 字幕スクリーンショット / 画像に字幕、字幕画像作成 |
| tools/wiggle-studio/ | 晃动 GIF 制作 / 图片动画、晃动图片 | wiggle GIF maker / jiggle image, animated photo | ぷるぷる画像 / 揺れる GIF、画像アニメ |
| tools/meme-slicer/ | 图片分割 / 九宫格切图、表情包切片、长图分割 | image splitter / split image into grid, meme tiles | 画像分割 / グリッド分割、九宮格、ミーム |
| tools/watermark-adder/ | 图片加水印 / 文字水印、平铺水印 | add watermark online / text and image watermark | 透かし追加 / 文字透かし、画像透かし |
| tools/ai-watermark-remover/ | AI 图片去水印 / 整图重建实验、Gemini 星形还原、本地修复 | AI watermark remover (in title) / reconstruction experiment, Gemini sparkle, local inpainting | AI 透かし除去（タイトル） / 再構築実験、Gemini 星形復元、画像修復 |
| tools/screenshot/ | 网页长截图 / 长截图、滚动截图、在线截图 | full page screenshot / scrolling screenshot, long screenshot | スクロールスクリーンショット / ページ全体 スクショ、縦長スクショ |
| tools/video-thumbnail/ | 视频封面下载 / B站封面、YouTube 封面 | video thumbnail downloader / YouTube, Bilibili cover | 動画サムネイル取得 / YouTube、Bilibili |
| tools/mbti-grid/ | MBTI 人格图生成器 / 人格对比图、角色网格 | MBTI grid maker / personality comparison chart | MBTI グリッド / 性格比較画像 |
| tools/dnd-alignment/ | DND 阵营九宫格 / 阵营图生成器、角色阵营 | DND alignment chart / alignment meme maker | DND 陣営チャート / アライメント、九宮格 |
| tools/pornhub-style/ | Pornhub 风格 Logo 生成器 / 黑橙文字 Logo | Pornhub style logo maker / black orange text logo | Pornhub 風ロゴ / 黒オレンジ文字ロゴ |

语言路径分别为 `/zh/`、`/en/`、`/ja/`。首页承接工具集合意图；工具页承接具体操作意图。关于、隐私、条款页使用品牌和页面主题词，不竞争工具词。

## 本次内容落地

- 主关键词进入独立标题、H1 或简介；辅助词自然出现在功能介绍、步骤和 FAQ 中，不重复堆词。
- 压缩页回答画质与体积、PNG 无损、目标 KB 无法达成等问题。在线画图页说明真实图层能力、输出格式和工程保存，并明确 PSD 尚不支持。
- OCR 页说明语言、框选和初次联网加载；字幕页明确生成静态图片，不提供音频自动转录。
- MBTI 只制作图表，不宣称人格诊断；AI 修复区分可见标记和不可见水印，整图重建为实验功能，隐形水印效果未验证；MP4 标注浏览器兼容性。
- 图片变清晰说明原尺寸、2 倍与 4 倍输出、WebGPU/CPU 处理和初次模型加载，明确 AI 增强可能改变细节。
- 每个公开工具连接 2–3 个相关工具，形成编辑、压缩、文字提取与创作之间的工作流程。
- 保留旧 URL 重定向，不为插入关键词修改现有工具 slug。

## 搜索样本（2026-10-03）

查看了“在线图片压缩到指定大小 免费”“free online drawing image editor layers”“画像 文字認識 ブラウザ 無料”的公开搜索结果。样本支持优先解释目标体积、图层和端内处理这些功能意图；它不代表 Google 排名或搜索量统计。

参考公开页面：[PicsSizer 图片压缩](https://www.picssizer.com/zh/image-compressor)、[Drawora 在线画图](https://drawora.online/)。不复制其文案或功能承诺。关键词应继续以 ImgHub 实际功能和 Search Console 查询数据校准。

Google 不使用 `meta keywords` 作为排名信号。该站保留兼容字段，优化重点是用户可见内容、标题和页面结构。[Google SEO 入门指南](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)

## 2026-10-12 调整

- 新公开的网页截图工具：标题和 H1 改为“网页长截图 / Full Page Screenshot / スクロールスクリーンショット”。公开搜索样本中同类产品多以“长截图”“滚动截屏”“full page screenshot”“scrolling screenshot”“ページ全体”命名，原标题“网页截图工具”不含这些词。
- 图片分割：英文标题以 “Image Splitter / Split an Image into a Grid” 开头，日文标题以“画像分割ツール”开头，与关键词表的主词一致；URL slug `meme-slicer` 不变。
- 图片变清晰（日文）：主词改为“画像高画質化”。搜索样本中的同类工具普遍使用“高画質化”。
- AI 去水印（英文、日文）：标题加入“AI Watermark Remover / AI 透かし除去”主词，同时保留“实验”说明，不夸大隐形水印效果。
- 图片压缩（英文）：标题加入辅助词 “Reduce … Size”。
- OCR 页的关联工具加入网页长截图（截图 → 提取文字的工作流），新页面因此获得站内入链。

以上仍然只是基于公开搜索样本的词选择，没有搜索量数据。OpenSEO 登录后可用 keyword-research 技能补充搜索量与难度，再据 Search Console 实际查询校准。
