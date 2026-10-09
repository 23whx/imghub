/**
 * Tool registry: slug, visibility, SEO + card copy per locale.
 * Component mapping is handled in the tool page (dynamic import map).
 */

export const tools = [
  {
    slug: 'image-enhancer', public: true, component: 'ImageEnhancer', icon: 'Sparkles', color: 'amber',
    browserRequirements: 'Requires JavaScript, WebAssembly and Web Workers. WebGPU is optional for GPU acceleration; CPU processing is supported. Internet access is needed for the initial model download.',
    nav: { zh: '图片变清晰', en: 'Image Enhancer', ja: '画像の鮮明化' },
    card: {
      zh: { title: '图片变清晰', description: '本机 AI 超分辨率，增强细节，支持 2 倍 / 4 倍放大' },
      en: { title: 'Image Enhancer', description: 'Local AI detail enhancement with 2× and 4× upscaling' },
      ja: { title: '画像の鮮明化', description: '端末 AI で細部を鮮明に。2 倍・4 倍の拡大に対応' },
    },
    seo: {
      zh: { title: '图片变清晰 - 免费 AI 图片增强与超分辨率放大 | ImgHub', description: '用本机 AI 超分辨率增强低清图片，支持原尺寸、2 倍和 4 倍放大，滑动对比、100% 查看与 WebP 下载。优先 WebGPU，图片不上传；增强可能改变细节。', keywords: '图片变清晰,AI图片增强,超分辨率,图片放大,WebGPU,Real-ESRGAN,ImgHub', h1: '图片变清晰' },
      en: { title: 'Free AI Image Enhancer & Upscaler | ImgHub', description: 'Enhance low-resolution images locally with AI. Original-size, 2× and 4× output, comparison, 100% inspection and WebP export. Uses WebGPU or CPU without uploads; detail may change.', keywords: 'AI image enhancer,image upscale,super resolution,WebGPU,Real-ESRGAN,ImgHub', h1: 'Image Enhancer' },
      ja: { title: 'AI 画像の鮮明化・超解像拡大 | ImgHub', description: '低解像度画像を端末の AI で鮮明化。元のサイズ、2 倍・4 倍の拡大、比較、100% 表示、WebP 保存に対応。GPU または CPU で処理し、細部が変わる場合があります。', keywords: '画像鮮明化,超解像,画像拡大,WebGPU,Real-ESRGAN,ImgHub', h1: '画像の鮮明化' },
    },
  },
  {
    slug: 'ai-watermark-remover', public: true, component: 'AIWatermarkRemover', icon: 'Eraser', color: 'amber',
    browserRequirements: 'AI reconstruction and local inpainting require JavaScript, WebAssembly and Web Workers. WebGPU is optional for GPU acceleration; CPU processing is supported. Internet access is needed for the initial model download.',
    nav: { zh: 'AI 图片去水印', en: 'AI Watermark Remover', ja: 'AI 画像の透かし除去' },
    card: {
      zh: { title: 'AI 图片去水印', description: '本机 GPU 整图重建实验、可见标记修复，隐形水印效果未验证' },
      en: { title: 'AI Watermark Remover', description: 'Local GPU reconstruction experiments and visible-mark repair' },
      ja: { title: 'AI 画像の透かし除去', description: '端末 GPU の再構築実験と可視マークの修復' },
    },
    seo: {
      zh: { title: 'AI 图片去水印 - 隐形水印重建实验与本地修复 | ImgHub', description: 'GPT-image / Nano Banana 整图重建实验，使用本机 WebGPU 或 CPU，隐形水印效果未验证。支持 Gemini 星形还原、局部修复、对比与 WebP 导出，图片不上传。', keywords: 'AI图片去水印,Gemini水印,Nano Banana去水印,本地图片修复,WebP,ImgHub', h1: 'AI 图片去水印' },
      en: { title: 'AI Watermark Experiments & Local Image Repair | ImgHub', description: 'Experiment with whole-image reconstruction for GPT-image / Nano Banana using local WebGPU or CPU. Invisible watermark removal is unverified. Also repair visible marks and export WebP locally.', keywords: 'AI watermark remover,Gemini watermark,Nano Banana,inpainting,WebP,ImgHub', h1: 'AI Watermark Remover' },
      ja: { title: 'AI 透かしの再構築実験・ローカル修復 | ImgHub', description: 'GPT-image / Nano Banana の画像全体を端末の WebGPU または CPU で再構築する実験。不可視透かしの除去は未検証。可視マークの修復、比較、WebP 保存にも対応。', keywords: 'AI透かし除去,Gemini,Nano Banana,画像修復,WebP,ImgHub', h1: 'AI 画像の透かし除去' },
    },
  },
  {
    slug: 'online-drawing',
    public: true,
    component: 'DrawingStudio',
    icon: 'Paintbrush',
    color: 'orange',
    nav: { zh: '在线画图', en: 'Drawing Studio', ja: 'オンライン描画' },
    card: {
      zh: { title: '在线画图 · 图片编辑', description: '画笔、文字、形状、图层、裁剪和调色，在浏览器中自由创作' },
      en: { title: 'Drawing Studio', description: 'Paint, add text and shapes, work with layers, crop, and adjust photos' },
      ja: { title: 'オンライン描画・画像編集', description: 'ブラシ、文字、図形、レイヤー、切り抜き、色調整で自由に創作' },
    },
    seo: {
      zh: { title: '在线画图 - 免费在线图片编辑与绘画工具 | ImgHub', description: '无需安装，打开浏览器就能画图、编辑图片。使用画笔、文字、形状、图层、裁剪和调色，保存工程或导出图片。', keywords: '在线画图,图片编辑,绘画工具,图层编辑,在线修图,ImgHub', h1: '在线画图' },
      en: { title: 'Free Online Drawing & Image Editor | ImgHub', description: 'Draw and edit images in your browser. Paint, add text and shapes, manage layers, crop, adjust colors, save projects, and export images.', keywords: 'online drawing,photo editor,paint,layers,image editing,ImgHub', h1: 'Online Drawing & Image Editor' },
      ja: { title: 'オンライン描画 - 無料の画像編集・お絵かきツール | ImgHub', description: 'ブラウザで描画と画像編集。ブラシ、文字、図形、レイヤー、切り抜き、色調整に対応。プロジェクト保存や画像書き出しも。', keywords: 'オンライン描画,画像編集,お絵かき,レイヤー,写真編集,ImgHub', h1: 'オンライン描画' },
    },
  },
  {
    slug: 'subtitle-generator',
    public: true,
    component: 'ScreenshotGenerator',
    icon: 'Image',
    color: 'blue',
    nav: {
      zh: '截图字幕生成器',
      en: 'Subtitle',
      ja: '字幕',
    },
    card: {
      zh: {
        title: '截图字幕生成器',
        description: '为名人演讲添加自定义字幕，支持多语言和实时预览',
      },
      en: {
        title: 'Subtitle Screenshot Generator',
        description:
          'Add custom subtitles to famous speeches with multi-language real-time preview',
      },
      ja: {
        title: '字幕スクリーンショット生成器',
        description:
          '有名人スピーチに字幕を追加し、多言語リアルタイムプレビューに対応',
      },
    },
    seo: {
      zh: {
        title: '截图字幕生成器 - 名人演讲字幕截图制作 | ImgHub',
        description:
          '免费在线字幕截图生成器：选择名人背景或上传图片，添加自定义字幕、调整样式，实时预览并导出 PNG 图片。',
        keywords: '字幕截图,演讲截图,字幕生成器,名人字幕,ImgHub',
        h1: '截图字幕生成器',
      },
      en: {
        title: 'Subtitle Screenshot Generator | ImgHub',
        description:
          'Make subtitle screenshots online for free. Choose a background or upload an image, style your custom captions, preview and export PNG.',
        keywords:
          'subtitle screenshot,speech caption generator,caption image maker,ImgHub',
        h1: 'Subtitle Screenshot Generator',
      },
      ja: {
        title: '字幕スクリーンショット生成器 | ImgHub',
        description:
          '無料の字幕スクリーンショット作成ツール。背景を選択または画像をアップロードし、字幕のスタイルを調整、プレビューして PNG を保存。',
        keywords: '字幕スクショ,字幕生成,スピーチ字幕,ImgHub',
        h1: '字幕スクリーンショット生成器',
      },
    },
  },
  {
    slug: 'pornhub-style',
    public: true,
    component: 'PornhubStyle',
    icon: 'Image',
    color: 'orange',
    nav: {
      zh: 'Pornhub风格',
      en: 'Pornhub Style',
      ja: 'Pornhub風',
    },
    card: {
      zh: {
        title: 'Pornhub风格',
        description: '制作经典的Pornhub风格Logo，黑底白字+橙色点缀',
      },
      en: {
        title: 'Pornhub Style Logo',
        description:
          'Create classic Pornhub-style logos with black, white and orange accents',
      },
      ja: {
        title: 'Pornhub風ロゴ',
        description:
          '黒背景に白文字＋オレンジアクセントの Pornhub 風ロゴを作成',
      },
    },
    seo: {
      zh: {
        title: 'Pornhub风格 Logo 生成器 | ImgHub',
        description:
          '免费在线制作 Pornhub 风格 Logo：黑底白字与橙色点缀，自定义文字，一键导出。',
        keywords: 'Pornhub风格,Logo生成器,黑橙Logo,ImgHub',
        h1: 'Pornhub风格 Logo 生成器',
      },
      en: {
        title: 'Pornhub Style Logo Maker | ImgHub',
        description:
          'Create a classic black-and-orange Pornhub-style logo online. Customize text and export instantly.',
        keywords: 'pornhub style logo,logo maker,black orange logo,ImgHub',
        h1: 'Pornhub Style Logo Maker',
      },
      ja: {
        title: 'Pornhub風ロゴメーカー | ImgHub',
        description:
          '黒とオレンジのクラシックな Pornhub 風ロゴを無料で作成。テキストを編集してすぐに書き出し。',
        keywords: 'Pornhub風,ロゴ作成,ImgHub',
        h1: 'Pornhub風ロゴメーカー',
      },
    },
  },
  {
    slug: 'dnd-alignment',
    public: true,
    component: 'DNDAlignment',
    icon: 'Grid3x3',
    color: 'purple',
    nav: {
      zh: 'DND阵营',
      en: 'DND Grid',
      ja: 'DND配置',
    },
    card: {
      zh: {
        title: 'DND阵营九宫格',
        description: '上传9张图片，创建DND阵营九宫格对比图',
      },
      en: {
        title: 'DND Alignment Grid',
        description: 'Upload 9 images to create a DND alignment comparison grid',
      },
      ja: {
        title: 'DND陣営グリッド',
        description:
          '9枚の画像をアップロードして DND 陣営比較グリッドを作成',
      },
    },
    seo: {
      zh: {
        title: 'DND阵营九宫格生成器 | ImgHub',
        description:
          '上传 9 张图片，一键生成 DND 阵营九宫格对比图，适合迷因与角色站队玩法。',
        keywords: 'DND阵营,九宫格,阵营图,迷因生成,ImgHub',
        h1: 'DND阵营九宫格生成器',
      },
      en: {
        title: 'DND Alignment Chart Maker | ImgHub',
        description:
          'Upload nine images and build a Dungeons & Dragons alignment chart meme online for free.',
        keywords: 'dnd alignment chart,alignment grid,meme maker,ImgHub',
        h1: 'DND Alignment Chart Maker',
      },
      ja: {
        title: 'DND陣営チャートメーカー | ImgHub',
        description:
          '9枚の画像で D&D アライメント（陣営）九宮格ミームを無料作成。',
        keywords: 'DND陣営,アライメントチャート,ミーム,ImgHub',
        h1: 'DND陣営チャートメーカー',
      },
    },
  },
  {
    slug: 'mbti-grid',
    public: true,
    component: 'MBTIGrid',
    icon: 'Users',
    color: 'blue',
    nav: {
      zh: 'MBTI人格',
      en: 'MBTI Grid',
      ja: 'MBTI性格',
    },
    card: {
      zh: {
        title: 'MBTI人格图',
        description: '选择多种MBTI类型，制作人格对比图片',
      },
      en: {
        title: 'MBTI Personality Grid',
        description:
          'Select multiple MBTI types and create personality comparison images',
      },
      ja: {
        title: 'MBTI性格グリッド',
        description: '複数の MBTI タイプを選んで性格比較画像を作成',
      },
    },
    seo: {
      zh: {
        title: 'MBTI人格图生成器 | ImgHub',
        description:
          '免费制作 MBTI 人格对比图：选择类型、上传图片，生成分享友好的人格九宫格/网格图。',
        keywords: 'MBTI,人格图,十六型人格,对比图,ImgHub',
        h1: 'MBTI人格图生成器',
      },
      en: {
        title: 'MBTI Personality Grid Maker | ImgHub',
        description:
          'Create MBTI personality comparison grids online. Pick types, add images, and export for free.',
        keywords: 'MBTI grid,personality chart,MBTI meme,ImgHub',
        h1: 'MBTI Personality Grid Maker',
      },
      ja: {
        title: 'MBTI性格グリッドメーカー | ImgHub',
        description:
          'MBTI タイプを選んで性格比較グリッド画像を無料作成・書き出し。',
        keywords: 'MBTI,性格診断,グリッド,ImgHub',
        h1: 'MBTI性格グリッドメーカー',
      },
    },
  },
  {
    slug: 'meme-slicer',
    public: true,
    component: 'MemeSlicer',
    icon: 'Scissors',
    color: 'green',
    nav: {
      zh: '表情包切片',
      en: 'Meme Slicer',
      ja: 'ミームスライサー',
    },
    card: {
      zh: {
        title: '表情包切片',
        description: '上传图片，自定义行列数，快速切片导出',
      },
      en: {
        title: 'Meme Slicer',
        description:
          'Upload an image, set rows and columns, and slice/export quickly',
      },
      ja: {
        title: 'ミームスライサー',
        description:
          '画像をアップロードし、行と列を指定して素早くスライス＆書き出し',
      },
    },
    seo: {
      zh: {
        title: '图片分割与表情包切片 - 九宫格切图工具 | ImgHub',
        description:
          '上传长图或九宫格，自定义行列数，一键切片导出多张表情包图片。',
        keywords: '表情包切片,九宫格切割,图片分割,ImgHub',
        h1: '表情包切片工具',
      },
      en: {
        title: 'Meme Slicer - Split Images into Grid | ImgHub',
        description:
          'Slice an image into custom rows and columns and export meme tiles instantly.',
        keywords: 'meme slicer,image splitter,grid cut,ImgHub',
        h1: 'Meme Slicer',
      },
      ja: {
        title: 'ミーム画像スライサー | ImgHub',
        description:
          '画像を任意の行・列で分割し、ミーム用タイルをすばやく書き出し。',
        keywords: 'ミーム,画像分割,スライサー,ImgHub',
        h1: 'ミーム画像スライサー',
      },
    },
  },
  {
    slug: 'video-thumbnail',
    public: true,
    component: 'VideoThumbnail',
    icon: 'Video',
    color: 'blue',
    nav: {
      zh: '视频封面',
      en: 'Video Thumbnail',
      ja: '動画サムネイル',
    },
    card: {
      zh: {
        title: '视频封面',
        description: '下载哔哩哔哩与 YouTube 视频的高清封面',
      },
      en: {
        title: 'Video Thumbnail',
        description: 'Download high-resolution Bilibili and YouTube video covers',
      },
      ja: {
        title: '動画サムネイル',
        description: 'Bilibili・YouTube 動画の高画質サムネイルを取得',
      },
    },
    seo: {
      zh: {
        title: '视频封面下载 - 哔哩哔哩 / YouTube 高清封面 | ImgHub',
        description:
          '输入哔哩哔哩视频链接、BV / AV 号或 YouTube 链接，免费预览高清封面并下载为 WebP。',
        keywords: '视频封面,哔哩哔哩封面,B站封面下载,BV号,YouTube缩略图,封面下载,ImgHub',
        h1: '视频封面下载',
      },
      en: {
        title: 'Bilibili & YouTube Thumbnail Downloader | ImgHub',
        description:
          'Paste a Bilibili video URL, BV / AV ID or YouTube URL to preview covers and download WebP thumbnails for free.',
        keywords: 'bilibili cover,BV cover,youtube thumbnail,video cover,thumbnail downloader,ImgHub',
        h1: 'Video Thumbnail Downloader',
      },
      ja: {
        title: 'Bilibili・YouTube サムネイル取得ツール | ImgHub',
        description:
          'Bilibili の動画 URL、BV / AV ID または YouTube URL から高画質カバーを表示し、WebP で無料ダウンロード。',
        keywords: 'サムネイル,Bilibili,BV,YouTube,動画カバー,ImgHub',
        h1: '動画サムネイルダウンロード',
      },
    },
  },
  {
    slug: 'image-compress',
    public: true,
    component: 'ImageCompress',
    icon: 'Minimize',
    color: 'green',
    nav: {
      zh: '图片压缩',
      en: 'Image Compress',
      ja: '画像圧縮',
    },
    card: {
      zh: {
        title: '图片压缩',
        description: '智能压缩 JPG、PNG、WebP，调节画质或限制目标体积',
      },
      en: {
        title: 'Image Compress',
        description:
          'Compress JPG, PNG and WebP with quality controls and size targets',
      },
      ja: {
        title: '画像圧縮',
        description:
          'JPG・PNG・WebPを一括圧縮。画質と目標容量を調整',
      },
    },
    seo: {
      zh: {
        title: '图片压缩 - 在线批量压缩 JPG、PNG、WebP | ImgHub',
        description:
          '免费在线批量压缩 JPG、PNG、WebP，可设置目标 KB、调节画质与尺寸，查看压缩率和前后对比。本地处理，支持透明图片和 ZIP 下载。',
        keywords: '图片压缩,图片压缩到指定大小,批量图片压缩,PNG压缩,WebP压缩,JPG压缩,ImgHub',
        h1: '图片压缩工具',
      },
      en: {
        title: 'Image Compressor - JPG, PNG & WebP Online | ImgHub',
        description:
          'Batch compress JPG, PNG and WebP for free. Control quality, set file size targets and compare results locally in your browser.',
        keywords: 'image compressor,batch compress,reduce image size,ImgHub',
        h1: 'Image Compressor',
      },
      ja: {
        title: '画像圧縮ツール - オンライン一括圧縮 | ImgHub',
        description:
          'JPG・PNG・WebPをブラウザ内で無料一括圧縮。画質と目標容量を調整し、処理前後を比較できます。',
        keywords: '画像圧縮,オンライン圧縮,一括圧縮,ImgHub',
        h1: '画像圧縮ツール',
      },
    },
  },
  {
    slug: 'wiggle-studio',
    public: true,
    component: 'WiggleStudio',
    icon: 'Waves',
    color: 'pink',
    nav: {
      zh: '晃动图片工坊',
      en: 'Wiggle Studio',
      ja: 'ぷるぷる工房',
    },
    card: {
      zh: {
        title: '晃动图片工坊',
        description: '涂抹晃动区域，弹性物理预览，导出 GIF / WebM / MP4',
      },
      en: {
        title: 'Wiggle Studio',
        description:
          'Paint areas to jiggle, preview spring motion, export GIF / WebM / MP4',
      },
      ja: {
        title: 'ぷるぷる画像工房',
        description:
          '動かす範囲を塗り、スプリング揺れをプレビューし GIF / 動画を書き出し',
      },
    },
    seo: {
      zh: {
        title: '晃动图片工坊 - 在线制作晃动 GIF / 视频 | ImgHub',
        description:
          '免费在线晃动图生成器：上传图片、涂抹要动的区域，预览弹性晃动效果，导出 GIF、WebM 或 MP4。全程浏览器本地处理。',
        keywords: '晃动图,抖动GIF,弹性动画,图片晃动,wiggle gif,ImgHub',
        h1: '晃动图片工坊',
      },
      en: {
        title: 'Wiggle Studio - Make Jiggle GIF & Video Online | ImgHub',
        description:
          'Free online image wiggle tool. Paint the moving area, preview springy motion, and export GIF, WebM, or MP4 — all in your browser.',
        keywords:
          'wiggle gif,jiggle image,image animation,spring mesh,purupuru,ImgHub',
        h1: 'Wiggle Studio',
      },
      ja: {
        title: 'ぷるぷる画像工房 - 揺れるGIF/動画を無料作成 | ImgHub',
        description:
          '画像の動かしたい部分を塗り、スプリングな揺れをプレビュー。GIF / WebM / MP4 をブラウザだけで書き出し。',
        keywords: 'ぷるぷる,ゆらゆらGIF,画像アニメ,ImgHub',
        h1: 'ぷるぷる画像工房',
      },
    },
  },
  {
    slug: 'watermark-adder',
    public: true,
    component: 'WatermarkAdder',
    icon: 'Droplets',
    color: 'indigo',
    nav: {
      zh: '图片加水印',
      en: 'Add Watermark',
      ja: '透かし追加',
    },
    card: {
      zh: {
        title: '图片加水印',
        description: '文字/图片水印，调节大小、角度、透明度，支持平铺',
      },
      en: {
        title: 'Add Watermark',
        description:
          'Text or image watermarks with size, angle, opacity and tile options',
      },
      ja: {
        title: '透かし追加',
        description: '文字・画像透かし。サイズ・角度・透明度・タイル対応',
      },
    },
    seo: {
      zh: {
        title: '图片加水印工具 - 文字/图片水印在线添加 | ImgHub',
        description:
          '免费在线给图片加水印：支持文字水印与图片水印，自由调节大小、横竖斜角度、透明度，可平铺。全程浏览器本地处理。',
        keywords: '加水印,文字水印,图片水印,在线水印,透明度,平铺水印,ImgHub',
        h1: '图片加水印',
      },
      en: {
        title: 'Add Watermark Online – Text & Image | ImgHub',
        description:
          'Free online watermark tool. Add text or image watermarks, adjust size, rotation, opacity, and tile. Local browser processing.',
        keywords:
          'add watermark,text watermark,image watermark,online watermark,ImgHub',
        h1: 'Add Watermark',
      },
      ja: {
        title: '透かし追加ツール - 文字/画像 | ImgHub',
        description:
          '無料で画像に透かしを追加。文字・画像、サイズ・角度・透明度・タイル敷き詰めに対応。ブラウザ内処理。',
        keywords: '透かし,ウォーターマーク,文字透かし,画像透かし,ImgHub',
        h1: '透かし追加',
      },
    },
  },
  {
    slug: 'image-ocr',
    public: true,
    component: 'ImageOCR',
    icon: 'ScanText',
    color: 'purple',
    nav: {
      zh: '在线 OCR',
      en: 'OCR',
      ja: 'OCR',
    },
    card: {
      zh: {
        title: '在线 OCR',
        description: '自动中英日混合识别，本机 GPU 加速，文字框校对与文本导出',
      },
      en: {
        title: 'Online OCR',
        description: 'Automatic multilingual OCR, local GPU, text boxes and editable exports',
      },
      ja: {
        title: 'オンライン OCR',
        description: '言語選択不要の中英日認識、端末 GPU、文字枠確認とテキスト保存',
      },
    },
    seo: {
      zh: {
        title: '图片转文字 - 免费在线 OCR 图片文字识别 | ImgHub',
        description:
          '免费在线 OCR：无需选择语言，自动识别简繁中文、英文、日文混合图片。本机 GPU 加速、长图分块、框选与文字框校对，可编辑并导出 TXT。图片不上传，无需注册。',
        keywords: 'OCR,图片转文字,文字识别,在线OCR,框选识别,ImgHub',
        h1: '图片文字识别（在线 OCR）',
      },
      en: {
        title: 'Online OCR – Extract Text from Images | ImgHub',
        description:
          'Automatic Chinese, English and Japanese OCR with local GPU acceleration. Recognize long images or regions, review text boxes, edit and export TXT. Images stay on your device.',
        keywords: 'OCR,image to text,text recognition,online OCR,ImgHub',
        h1: 'Online OCR',
      },
      ja: {
        title: 'オンライン OCR - 画像から文字認識 | ImgHub',
        description:
          '言語選択不要の中英日 OCR。端末 GPU、長い画像の分割、範囲選択と文字枠確認に対応。全文を編集して TXT を保存。画像はアップロードしません。',
        keywords: 'OCR,文字認識,画像から文字,オンラインOCR,ImgHub',
        h1: 'オンライン OCR',
      },
    },
  },
  // Hidden from homepage, still routable
  {
    slug: 'screenshot',
    public: false,
    component: 'Screenshot',
    icon: 'Monitor',
    color: 'blue',
    nav: {
      zh: '网页截图',
      en: 'Screenshot',
      ja: 'スクリーンショット',
    },
    card: {
      zh: {
        title: '网页截图',
        description: '输入网址生成网页截图',
      },
      en: {
        title: 'Web Screenshot',
        description: 'Capture a webpage screenshot from a URL',
      },
      ja: {
        title: 'ウェブスクリーンショット',
        description: 'URL からウェブページのスクリーンショットを作成',
      },
    },
    seo: {
      zh: {
        title: '网页截图工具 | ImgHub',
        description: '输入网址，在线生成网页截图。',
        keywords: '网页截图,在线截图,ImgHub',
        h1: '网页截图工具',
      },
      en: {
        title: 'Web Screenshot Tool | ImgHub',
        description: 'Capture webpage screenshots online from a URL.',
        keywords: 'web screenshot,url screenshot,ImgHub',
        h1: 'Web Screenshot Tool',
      },
      ja: {
        title: 'ウェブスクリーンショットツール | ImgHub',
        description: 'URL からウェブページのスクリーンショットを取得。',
        keywords: 'スクリーンショット,ウェブ截図,ImgHub',
        h1: 'ウェブスクリーンショットツール',
      },
    },
  },
  {
    slug: 'watermark-remover',
    public: false,
    component: 'WatermarkRemover',
    icon: 'Eraser',
    color: 'green',
    nav: {
      zh: '去水印',
      en: 'Watermark Remover',
      ja: '透かし除去',
    },
    card: {
      zh: {
        title: '去水印',
        description: '手动涂抹去除图片水印',
      },
      en: {
        title: 'Watermark Remover',
        description: 'Brush away watermarks from images locally',
      },
      ja: {
        title: '透かし除去',
        description: 'ブラシで画像の透かしをローカル除去',
      },
    },
    seo: {
      zh: {
        title: '图片去水印工具 | ImgHub',
        description: '在浏览器本地涂抹去除图片水印，图片不上传服务器。',
        keywords: '去水印,图片水印,ImgHub',
        h1: '图片去水印工具',
      },
      en: {
        title: 'Watermark Remover | ImgHub',
        description:
          'Remove image watermarks with a brush tool. Processing stays in your browser.',
        keywords: 'watermark remover,remove watermark,ImgHub',
        h1: 'Watermark Remover',
      },
      ja: {
        title: '透かし除去ツール | ImgHub',
        description:
          'ブラウザ上でブラシ操作により画像の透かしを除去。画像はサーバーに送信されません。',
        keywords: '透かし除去,ウォーターマーク,ImgHub',
        h1: '透かし除去ツール',
      },
    },
  },
];

export const toolSlugs = tools.map((t) => t.slug);

export const publicTools = tools.filter((t) => t.public);

export function getToolBySlug(slug) {
  return tools.find((t) => t.slug === slug) || null;
}

export function getToolSeo(slug, lang) {
  const tool = getToolBySlug(slug);
  if (!tool) return null;
  return tool.seo[lang] || tool.seo.en;
}
