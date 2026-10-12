/** Static, indexable help copy. Features and limits follow the actual tools. */
export const guideCopy = {
  zh: { overview: '这个工具能做什么', steps: '如何使用', tips: '使用建议', faq: '常见问题', related: '接着完成你的创作' },
  en: { overview: 'What this tool does', steps: 'How to use it', tips: 'Practical tips', faq: 'Frequently asked questions', related: 'Continue your project' },
  ja: { overview: 'このツールでできること', steps: '使い方', tips: '使うときのヒント', faq: 'よくある質問', related: '次の作業に使えるツール' },
};

const faq = (question, answer) => ({ question, answer });
const guideData = {
  'image-enhancer': {
    zh: {
      summary: '用本机 Real-ESRGAN 超分辨率模型增强低分辨率、压缩过的图片，支持原尺寸增强、2 倍和 4 倍放大。自动优先使用 WebGPU，兼容模式使用 CPU。调整增强力度，滑动对比，在 100% 模式检查细节，再下载 WebP。图片不上传服务器。',
      steps: ['上传 PNG、JPG 或 WebP，或试用低清案例。', '选择输出尺寸、增强力度和运行设备，开始增强。', '滑动对比并在 100% 模式检查细节，确认后下载 WebP。'],
      tips: ['输入最多 25 MB、400 万像素、单边 4096px；输出最多 1600 万像素、单边 8192px。超出限制的倍率不可选。', '首次加载约 27 MB 模型和运行组件；分块推理控制显存，CPU 或较大图片可能较慢，可以取消。', '原尺寸和 2 倍输出由模型的 4 倍结果缩小获得。保留透明度，增强不会凭空恢复可信的真实细节。'],
      faqs: [faq('可以修复严重失焦的照片或还原微小文字吗？', '超分辨率更适合低分辨率和压缩损失。严重失焦的信息可能已经丢失，AI 会推断纹理，可能改变人脸、文字和图案，应在 100% 查看模式检查。'), faq('有显卡才能用吗？', '支持 WebGPU 的浏览器可用用户本机显卡。自动模式在 GPU 不可用或运行失败时改用 CPU。所有计算在浏览器完成，Vercel 仅提供静态文件。')],
    },
    en: {
      summary: 'Enhance low-resolution and compressed images locally with Real-ESRGAN super-resolution. Choose original-size, 2× or 4× output, adjust strength, compare with a slider and inspect at 100% before exporting WebP. Automatic mode prefers local WebGPU and falls back to CPU. Images are never uploaded for processing.',
      steps: ['Upload PNG, JPG or WebP, or load the low-resolution example.', 'Choose output size, strength and device, then enhance.', 'Compare and inspect at 100%, then download WebP.'],
      tips: ['Input: 25 MB, 4 megapixels, 4096px per side. Output: 16 megapixels, 8192px per side. Unsupported scales are disabled.', 'First use loads about 27 MB. Context-padded tiles bound GPU memory. CPU and larger images take longer; you can cancel.', 'Original-size and 2× outputs are reduced from the model’s 4× result. Alpha is retained. Inferred detail is not verified original detail.'],
      faqs: [faq('Can it restore severe defocus or tiny text?', 'Super-resolution is better suited to low resolution and compression damage. Information lost to severe defocus may be unrecoverable. AI can alter faces, text and patterns; inspect them at 100%.'), faq('Do I need a GPU?', 'WebGPU uses your own GPU in supported browsers. Automatic mode falls back to CPU if unavailable or execution fails. Computation stays in the browser; Vercel only serves static assets.')],
    },
    ja: {
      summary: '低解像度や圧縮された画像を端末の Real-ESRGAN 超解像で鮮明化します。元のサイズ、2 倍・4 倍出力、強さの調整、スライダー比較、100% 表示に対応。確認後に WebP を保存します。WebGPU を優先し、利用できない場合は CPU に切り替わります。画像は送信しません。',
      steps: ['PNG・JPG・WebP を読み込むか、低解像度のサンプルを選びます。', '出力サイズ、強さ、実行デバイスを選んで処理します。', '比較と 100% 表示で細部を確認し、WebP を保存します。'],
      tips: ['入力は 25 MB、400 万画素、各辺 4096px。出力は 1600 万画素、各辺 8192px までです。利用不可の倍率は無効になります。', '初回は約 27 MB を読み込みます。周辺画素を含む分割処理でメモリを制御します。CPU や大きい画像は時間がかかり、中止できます。', '元のサイズと 2 倍出力はモデルの 4 倍結果を縮小します。透明度を保持しますが、推測した細部が実際の細部とは限りません。'],
      faqs: [faq('強いピンぼけや小さい文字を復元できますか？', '低解像度と圧縮による劣化に適しています。強いピンぼけで失われた情報は戻らない場合があります。顔、文字、模様が変わる場合があるため、100% 表示で確認してください。'), faq('GPU は必要ですか？', '対応ブラウザは端末の WebGPU を利用します。自動モードは利用不可や失敗時に CPU へ切り替えます。処理はブラウザ内で完結し、Vercel は静的ファイルだけを提供します。')],
    },
  },

  'online-drawing': {
    zh: {
      summary: '在线画图工具把绘画和日常图片编辑放在同一个工作区。你可以新建画布，也可以打开照片，用画笔、橡皮擦、文字和形状制作配图，再通过图层、裁剪和颜色调整完善细节。无需安装软件，编辑在浏览器内完成，适合制作社交图片、简单插画和图片标注。',
      steps: ['新建指定尺寸的画布，或打开本机图片。', '添加绘画、文字或形状图层，调整位置、大小和颜色。', '保存工程以便继续编辑，或选择 PNG、JPG、WebP 导出成图。'],
      tips: ['画布单边最大 4096 像素；导入大图会按比例缩小。', '需要透明背景时选择 PNG 或 WebP；JPG 导出会使用白色背景。', '工程保存为 .imghub.json，可重新打开；普通图片导出会合并图层。'],
      faqs: [faq('能用这个工具打开 PSD 文件吗？', '目前支持本工具的 .imghub.json 工程和常见图片，不支持 PSD 工程。需要保留可编辑图层时，请同时保存 ImgHub 工程。'), faq('导出图片后还能单独修改文字吗？', '导出的 PNG、JPG 和 WebP 是合并后的图片。保留工程文件，重新打开后才能继续编辑原来的文字和图层。')],
    },
    en: {
      summary: 'Draw and edit photos in one browser workspace. Start with a blank canvas or a local image, then add brush strokes, text and shapes. Layers, cropping and color adjustments help you finish social graphics, simple illustrations and annotated screenshots without installing an editor. Editing takes place in your browser.',
      steps: ['Create a canvas at your chosen size or open a local image.', 'Add drawing, text or shape layers and adjust their position, size and colors.', 'Save an editable project or export the finished image as PNG, JPG or WebP.'],
      tips: ['Canvas sides are limited to 4096 pixels; larger imported images are scaled proportionally.', 'Choose PNG or WebP for transparency. JPG export uses a white background.', 'The .imghub.json project preserves editable layers; image exports flatten them.'],
      faqs: [faq('Can I open a Photoshop PSD file?', 'The editor opens its own .imghub.json projects and common image files. PSD projects are not supported. Save an ImgHub project to keep your layers editable.'), faq('Can I edit text separately after exporting?', 'PNG, JPG and WebP exports are flattened images. Keep the project file and reopen it to change the original text and layers.')],
    },
    ja: {
      summary: 'ブラウザでお絵かきと写真編集を行えるツールです。空白のキャンバスから始めるほか、手元の画像にブラシ、文字、図形を加えられます。レイヤー、切り抜き、色調整を使って、SNS 用画像や簡単なイラスト、説明入りのスクリーンショットを作成できます。編集処理はブラウザ内で行います。',
      steps: ['サイズを指定してキャンバスを作るか、端末内の画像を開きます。', '描画・文字・図形のレイヤーを加え、位置や大きさ、色を調整します。', '編集用プロジェクトを保存するか、PNG・JPG・WebP で画像を書き出します。'],
      tips: ['キャンバスの各辺は最大 4096 ピクセルです。大きい画像の読み込み時は縦横比を保って縮小します。', '透明背景には PNG または WebP を選びます。JPG の背景は白になります。', '.imghub.json は編集用のレイヤーを保持します。通常の画像出力ではレイヤーが結合されます。'],
      faqs: [faq('Photoshop の PSD を開けますか？', '独自の .imghub.json プロジェクトと一般的な画像を開けます。PSD には対応していません。レイヤーを残すにはプロジェクトも保存してください。'), faq('書き出した後に文字だけを変更できますか？', 'PNG・JPG・WebP はレイヤーを結合した画像です。元の文字やレイヤーを編集するには、保存したプロジェクトを開き直します。')],
    },
  },
  'image-compress': {
    zh: {
      summary: '在线图片压缩工具帮助你在画质和文件体积之间找到合适的平衡。支持批量处理 JPG、PNG 和 WebP，可调节画质、指定目标 KB 或限制最长边，并查看压缩前后的图片。自动模式会比较可用格式与原文件的体积，适合网页配图、邮件附件和有上传容量限制的图片。',
      steps: ['上传或拖入 JPG、PNG、WebP，可一次添加多张图片。', '选择画质模式或目标体积，设置输出格式和最长边。', '开始压缩，查看前后对比与实际体积，单张下载或打包下载。'],
      tips: ['最多保留 50 张图片，单张不超过 50 MB，批次总量不超过 200 MB。', 'PNG 在原尺寸下采用无损优化；画质滑块不会改变 PNG 编码质量。JPG 不保留透明背景。', '目标体积过小时可能需要降低画质或允许缩小尺寸；工具会提示无法达到的目标。'],
      faqs: [faq('为什么压缩后体积没有明显变小？', '原图可能已经充分压缩。自动模式在原尺寸下会保留更小的原文件，避免重复编码反而变大。需要进一步减小体积，可以降低画质或缩小尺寸。'), faq('如何把图片压缩到指定 KB？', '选择目标体积模式，输入 1–10240 KB 范围内的数值。工具搜索可用画质；允许缩小尺寸时还会按比例减小图片。复杂图片不一定能在原尺寸下达到很小的目标。')],
    },
    en: {
      summary: 'Balance image quality and file size with batch JPG, PNG and WebP compression. Set an encoder quality, choose a target in KB or limit the longest edge, then compare the result with your original. Automatic mode compares suitable formats and the source file to find a smaller output for web graphics, email attachments and upload limits.',
      steps: ['Upload or drop one or more JPG, PNG or WebP files.', 'Choose quality or target size mode, then set the format and longest edge.', 'Compress, compare the images and actual sizes, then download individual files or a ZIP.'],
      tips: ['Keep up to 50 images, with a 50 MB limit per file and 200 MB per batch.', 'PNG optimization at the original dimensions is lossless; its encoder has no quality slider. JPG removes transparency.', 'Very small size targets may require lower quality or smaller dimensions; unmet targets are shown.'],
      faqs: [faq('Why is my image barely getting smaller?', 'Your source may already be efficiently compressed. At unchanged dimensions, automatic mode keeps the smaller original rather than increasing its size through re-encoding. Lower quality or smaller dimensions can reduce it further.'), faq('How do I compress an image to a specific KB size?', 'Use target size mode and enter a value from 1 to 10240 KB. The tool searches encoder quality and, if enabled, reduces dimensions proportionally. A very small target may be impossible at the original dimensions.')],
    },
    ja: {
      summary: 'JPG・PNG・WebP をまとめて圧縮し、画質と容量を調整できます。画質、目標 KB、長辺の上限を指定し、元画像と結果を比較します。自動モードは使える形式と元ファイルのサイズを比較するため、Web 用画像やメール添付、容量制限のある投稿に役立ちます。',
      steps: ['JPG・PNG・WebP をアップロード、またはドラッグして追加します。', '画質モードか目標容量モードを選び、形式と長辺を設定します。', '圧縮後の画像と実際の容量を確認し、個別または ZIP で保存します。'],
      tips: ['最大 50 枚、1 ファイル 50 MB、合計 200 MB まで追加できます。', '元の寸法での PNG 最適化は可逆圧縮です。PNG の画質はスライダーで変わりません。JPG は透明背景を保持しません。', '小さすぎる目標では画質や寸法の変更が必要です。達成できない場合は結果に表示します。'],
      faqs: [faq('圧縮しても容量があまり減らないのはなぜですか？', '元画像が十分に圧縮されている可能性があります。元の寸法では、自動モードは再変換より小さい元ファイルを保持します。さらに減らすには画質を下げるか寸法を縮小します。'), faq('指定した KB 以下にできますか？', '目標容量モードで 1〜10240 KB を指定します。画質を探索し、許可した場合は縦横比を保って縮小します。元の寸法のまま極端に小さくできるとは限りません。')],
    },
  },
  'image-ocr': {
    zh: {
      summary: '使用 PP-OCRv5 在浏览器内检测文字并识别内容。简体中文、繁体中文、英文和日文可混合输入，无需选择语言。支持上传、粘贴、整图或框选识别，长图分块、小字增强、文字框与逐行置信度校对。优先使用本机 WebGPU，自动模式不可用时切换 CPU。结果可编辑、复制或下载 TXT 和文字框 JSON，图片不上传。',
      steps: ['上传 PNG、JPG、WebP，粘贴截图或试用混合语言示例。', '直接使用自动多语言识别；需要时框选段落、旋转图片或开启小字增强。', '开始识别，查看原图文字框与低置信度行，编辑全文并复制或下载。'],
      tips: ['每张图片限 25 MB、1200 万像素、最长边 16000 px。长截图按原始像素分块处理，重叠文字框会去重。', '自动模式优先本机 GPU，失败后重试 CPU；也可手动指定设备。首次需加载约 58 MB 静态引擎与模型，图片本身不上传。', '100% 预览可滚动查看小字。表格、复杂分栏、严重模糊和手写内容仍需核对；当前模型不覆盖所有世界语言。'],
      faqs: [faq('需要选择图片的语言吗？', '不需要。一个联合模型直接识别简体中文、繁体中文、英文和日文，支持这些文字的混合图片。这不是所有语言通用的识别器。'), faq('没有 GPU 也可以用吗？', '可以。自动模式检测浏览器 WebGPU，不可用或执行失败时使用本机 CPU。使用新版 Chrome 或 Edge 可尝试 GPU 加速，CPU 的耗时可能较长。')],
    },
    en: {
      summary: 'PP-OCRv5 detects and reads text locally in your browser. Simplified and Traditional Chinese, English and Japanese can be mixed without language selection. Upload or paste, recognize the whole image or a region, inspect text boxes and confidence, then edit, copy or export TXT and boxes JSON. Long images use overlapping source-resolution tiles. Automatic mode prefers local WebGPU and retries on CPU when unavailable or unsuccessful.',
      steps: ['Upload PNG, JPG or WebP, paste a screenshot or try the multilingual sample.', 'Use automatic multilingual recognition; select a region, rotate or enhance small text if needed.', 'Recognize, review low-confidence lines against the image and edit or export the full text.'],
      tips: ['Limits: 25 MB, 12 megapixels and 16000 px per edge. Long screenshots use overlapping tiles with duplicate boxes removed.', 'First use loads about 58 MB of static engine and models. Images are not uploaded. You can force CPU or WebGPU instead of automatic mode.', 'Use the scrollable 100% preview for small text. Review tables, columns, handwriting and severe blur. The model does not cover every language.'],
      faqs: [faq('Do I need to select a language?', 'No. A joint model reads Simplified and Traditional Chinese, English and Japanese, including mixed images. This is not a universal recognizer for all languages.'), faq('Can I use OCR without a GPU?', 'Yes. Automatic mode uses local CPU when WebGPU is unavailable or fails. Current Chrome or Edge can use WebGPU; CPU processing may take longer.')],
    },
    ja: {
      summary: 'PP-OCRv5 でブラウザ内の文字検出と認識を行います。日本語、英語、簡体字・繁体字中国語が混在していても言語選択は不要です。全体または範囲認識、長い画像の分割、小さい文字の強化、文字枠と信頼度の確認に対応します。自動モードは端末の WebGPU を優先し、失敗時は CPU で再試行します。全文を編集・コピーし、TXT や文字枠 JSON を保存できます。',
      steps: ['PNG・JPG・WebP をアップロード、貼り付け、または多言語サンプルを読み込みます。', '言語は自動です。必要に応じて範囲を指定し、回転や小さい文字の強化を使います。', '認識後、信頼度の低い行を原画像と照合し、全文を編集・保存します。'],
      tips: ['最大 25 MB、1200 万画素、長辺 16000 px。長い画像は元の画素で分割し、重複する文字枠を除きます。', '初回は約 58 MB の静的エンジンとモデルを読み込みます。画像はアップロードしません。CPU や WebGPU を指定することもできます。', '100% 表示はスクロールできます。表、複雑な段組み、手書きや強いぼけは確認が必要です。全世界の言語を網羅するモデルではありません。'],
      faqs: [faq('言語の選択は必要ですか？', '不要です。日本語、英語、簡体字・繁体字中国語を単一モデルで認識し、混在にも対応します。すべての言語に対応する汎用認識器ではありません。'), faq('GPU がなくても使えますか？', 'はい。WebGPU が利用できない場合や実行に失敗した場合、自動モードは端末の CPU を使用します。新しい Chrome や Edge では GPU を利用できます。CPU は時間がかかる場合があります。')],
    },
  },
  'watermark-adder': {
    zh: {
      summary: '给图片添加文字或图片水印，在分享照片、作品展示和商品配图时标注来源。输入署名或上传 Logo，调整大小、位置、角度和透明度，也可把水印平铺在整张图上。预览满意后导出 PNG；底图和水印图片都在浏览器内处理。',
      steps: ['上传需要标注的底图，选择文字水印或图片水印。', '输入文字或上传 Logo，调整大小、透明度、角度与位置；需要重复效果时开启平铺。', '检查水印在浅色和深色区域的可读性，下载带水印的 PNG。'],
      tips: ['透明 PNG Logo 可以避免水印周围出现矩形背景。', '平铺模式可调间距；单个水印模式可用横向、纵向位置控制摆放。', '水印会与底图合成，保留原图方便日后更换署名。'],
      faqs: [faq('可以用自己的 Logo 做水印吗？', '可以。切换到图片水印并上传 Logo，再调整缩放、透明度和角度。带透明背景的 Logo 更容易融入照片。'), faq('怎么让水印重复铺满整张图片？', '开启平铺选项，调整间距控制密度，再用角度和透明度设置效果。关闭平铺后可以调整单个水印的横向与纵向位置。')],
    },
    en: {
      summary: 'Add a text or logo watermark to credit photos, portfolio images and product graphics before sharing. Adjust its size, position, angle and opacity, or tile it across the whole picture. Preview your changes and download a PNG. Both the base image and watermark are processed in your browser.',
      steps: ['Upload the base image and choose a text or image watermark.', 'Enter your text or upload a logo, then adjust size, opacity, angle and position; enable tiling for repetition.', 'Check readability on light and dark areas and download the watermarked PNG.'],
      tips: ['A transparent PNG logo avoids a rectangular background around the watermark.', 'Tiling has an adjustable gap; a single watermark has horizontal and vertical position controls.', 'The watermark is merged with the picture. Keep the original for future changes.'],
      faqs: [faq('Can I use my own logo as a watermark?', 'Yes. Select image watermark, upload your logo and adjust its scale, opacity and rotation. A transparent logo blends into the base image more easily.'), faq('How do I repeat a watermark across the image?', 'Enable tiling and adjust the spacing, angle and opacity. Turn tiling off to position a single watermark horizontally and vertically.')],
    },
    ja: {
      summary: '写真、作品紹介、商品画像に文字やロゴの透かしを加えられます。大きさ、位置、角度、透明度を調整したり、画像全体に繰り返して配置したりできます。プレビューを確認して PNG で保存します。元画像と透かし画像の処理はブラウザ内で行います。',
      steps: ['元画像を読み込み、文字か画像の透かしを選びます。', '文字を入力するかロゴを読み込み、サイズ、透明度、角度、位置を調整します。繰り返す場合はタイルを有効にします。', '明るい部分と暗い部分で見え方を確認し、PNG を保存します。'],
      tips: ['透明な PNG ロゴなら、透かしの周囲に四角い背景が出ません。', 'タイルでは間隔、単独配置では横と縦の位置を調整できます。', '透かしは元画像と結合されます。後で変更するために元の画像を残してください。'],
      faqs: [faq('自分のロゴを透かしにできますか？', '画像の透かしを選んでロゴを読み込み、拡大率、透明度、角度を調整します。背景が透明なロゴを使うと写真になじみやすくなります。'), faq('画像全体に透かしを繰り返すには？', 'タイルを有効にし、間隔で密度を調整します。角度と透明度も変更できます。タイルを解除すると単独の透かしの位置を指定できます。')],
    },
  },
  'ai-watermark-remover': {
    zh: {
      summary: '针对 GPT-image / Nano Banana 提供实验性的整图自编码器重建和潜空间扰动。优先使用用户本机 WebGPU，也可选择 CPU，图片不上传。处理会改变画质，目前不能验证隐形水印是否消失。另保留 Gemini 可见星形还原、局部 AI 修复和元数据清理。',
      steps: ['上传 PNG、JPG 或 WebP，选择隐形水印实验处理。', '选择 GPU / CPU、处理分辨率和扰动强度，运行整图重建。', '查看实际设备、耗时、PSNR 和原图对比，确认画质后导出 WebP。'],
      tips: ['单张不超过 25 MB、1200 万像素，每边不超过 8192 像素。', '首次整图重建加载约 32 MB 模型和运行组件。导出恢复原图尺寸，但不能恢复模型损失的细节。每次从原图处理。', '局部修复首次加载约 40.8 MB，选区不得超过图片面积的 25%。元数据清理不等于去除像素水印。'],
      faqs: [faq('能确认去除了 GPT-image / Nano Banana 的 SynthID 吗？', '不能。整图重建是实验功能，没有本地 SynthID 检测器，也未做供应方验证。PSNR 仅表示与原图的画质差异，不能作为去水印分数。'), faq('可以用我自己的显卡吗？', '可以。WebGPU 在支持的浏览器内调用用户设备的 GPU。自动模式遇到不支持或运行失败会切换 CPU。无需后端和 API 密钥。')],
    },
    en: {
      summary: 'Experimental whole-image autoencoder reconstruction and latent perturbation for GPT-image / Nano Banana images. Uses local WebGPU when available or CPU, without uploading images. Detail changes and invisible watermark removal remains unverified. Gemini visible sparkle restoration, local inpainting and metadata cleaning are also available.',
      steps: ['Upload PNG, JPG or WebP and choose the invisible watermark experiment.', 'Choose GPU / CPU, working resolution and perturbation strength, then reconstruct.', 'Inspect the device, timing, PSNR and comparison before exporting WebP.'],
      tips: ['Inputs are limited to 25 MB, 12 million pixels and 8192 pixels per side.', 'First reconstruction loads about 32 MB of models and runtime. Export retains original dimensions, not lost detail. Each run starts from the original.', 'Local inpainting loads about 40.8 MB initially. Keep the mask below 25% of the image. Metadata cleaning does not remove pixel watermarks.'],
      faqs: [faq('Is GPT-image / Nano Banana SynthID removal verified?', 'No. This is experimental reconstruction without a local SynthID detector or provider verification. PSNR measures pixel differences and is not a watermark score.'), faq('Can it use my GPU?', 'Yes. WebGPU runs on the user device in supported browsers. Automatic mode falls back to CPU when unavailable or when GPU execution fails. No backend or API key is needed.')],
    },
    ja: {
      summary: 'GPT-image / Nano Banana 向けの画像全体のオートエンコーダー再構築と潜在空間の摂動実験です。端末の WebGPU または CPU を使い、画像を送信しません。細部が変わり、不可視透かしの除去は未検証です。可視の Gemini 星形復元、局所修復、メタデータ削除にも対応します。',
      steps: ['PNG・JPG・WebP を読み込み、不可視透かしの実験処理を選びます。', 'GPU / CPU、解像度、摂動の強さを設定して再構築します。', '実行デバイス、時間、PSNR と比較を確認して WebP を保存します。'],
      tips: ['入力は 25 MB、1200 万画素、各辺 8192 ピクセルまでです。', '初回の再構築は約 32 MB を読み込みます。出力寸法は元に戻りますが、失われた細部は戻りません。毎回、元画像から処理します。', '局所修復の初回は約 40.8 MB です。選択は画像面積の 25% 以下にします。メタデータ削除は画素の透かし除去とは別です。'],
      faqs: [faq('SynthID の除去を確認できますか？', 'できません。ローカル検出器や提供元の検証はありません。PSNR は元画像との差で、透かし検出スコアではありません。'), faq('自分の GPU を使えますか？', 'はい。対応ブラウザの WebGPU で端末の GPU を使います。自動モードは利用不能や失敗時に CPU へ切り替わります。バックエンドや API キーは不要です。')],
    },
  },
  'subtitle-generator': {
    zh: {
      summary: '字幕截图生成器把你输入的台词排版到背景图片上，制作演讲风格截图、引用配图或字幕迷因。可以选择内置背景，也可以上传自己的图片；支持单语和双语排版，修改字号、字体与文字颜色，并实时查看效果，最后保存为 PNG。',
      steps: ['选择一个背景，或上传自己的 JPG、PNG 图片。', '输入台词，按需要设置单语或双语内容，调整文字样式。', '检查分行和画面中的字幕位置，保存 PNG 图片。'],
      tips: ['用换行把台词分成易读的短句；双语内容应按行对应。', '这是给静态图片添加台词的工具，不会从音频自动生成字幕，也不导出 SRT。', '背景图宽度最多按 800 像素处理；需要更大尺寸的文字配图可以使用在线画图。'],
      faqs: [faq('能自动识别视频里的台词吗？', '不能。此工具使用你输入的字幕文字制作静态图片。如果台词已出现在截图中，可以先用在线 OCR 提取文字再编辑。'), faq('可以换成自己的照片吗？', '可以上传本机图片替代内置背景。上传后会使用自定义图片制作预览，导出的文件为 PNG。')],
    },
    en: {
      summary: 'Turn your own lines into subtitle screenshots, quote graphics and caption memes. Choose a built-in speech background or upload an image, use single-language or bilingual text, and adjust the font, size and color. The preview updates as you edit, and the finished screenshot downloads as PNG.',
      steps: ['Choose a background or upload your own JPG or PNG.', 'Enter the lines, select single-language or bilingual layout and adjust the text style.', 'Review line breaks and subtitle placement, then save the PNG.'],
      tips: ['Use short lines for readability and align corresponding lines in bilingual content.', 'This creates captions on still images. It does not transcribe audio or export SRT subtitles.', 'Background width is capped at 800 pixels; use the drawing editor for larger text graphics.'],
      faqs: [faq('Can it automatically transcribe dialogue from a video?', 'No. It creates a still image from text you enter. If the dialogue is already visible in a screenshot, use online OCR to extract it before editing.'), faq('Can I use my own photo as the background?', 'Yes. Upload a local picture to replace the built-in background. The custom image appears in the preview and the result exports as PNG.')],
    },
    ja: {
      summary: '入力したセリフを背景画像に重ねて、字幕スクリーンショット、引用画像、字幕ミームを作成できます。用意された背景か自分の画像を選び、単一言語・二言語の字幕を配置します。字体、サイズ、色を変えながらプレビューし、PNG として保存します。',
      steps: ['背景を選ぶか、自分の JPG・PNG を読み込みます。', 'セリフを入力し、単一言語か二言語の配置と文字のスタイルを選びます。', '改行と字幕の配置を確認し、PNG を保存します。'],
      tips: ['読みやすい短い行に分け、二言語では対応する行をそろえます。', '静止画像にセリフを入れるツールです。音声の自動文字起こしや SRT 出力には対応しません。', '背景の幅は最大 800 ピクセルで処理します。大きな文字入り画像にはオンライン描画を利用できます。'],
      faqs: [faq('動画の会話を自動で字幕にできますか？', '入力した文字から静止画像を作成するため、自動文字起こしはできません。字幕が写った画像なら、OCR で文字を取り出して編集できます。'), faq('自分の写真を背景にできますか？', '端末内の画像を読み込むと、用意された背景の代わりに使用できます。プレビューを確認して PNG で保存します。')],
    },
  },
  'meme-slicer': {
    zh: {
      summary: '表情包切片工具把一张图片按行列均匀分割，适合拆分表情包合集、切九宫格或把长图分成多张图片。上传后修改行数与列数，预览网格边界，再一次下载包含所有 PNG 切片的 ZIP。每个文件名标明行列，方便按原来的顺序整理。',
      steps: ['上传要切割的图片。', '设置行数和列数，根据预览网格确认每个切片的内容。', '导出 ZIP，解压后获取按行列命名的 PNG 切片。'],
      tips: ['行和列各可设置 1–10；九宫格选择 3 行、3 列。', '这是均匀网格切割，不会自动检测表情的边界；非规则合集可先在在线画图里裁剪。', '预览中的红色网格线不会写入导出的切片。'],
      faqs: [faq('怎么把长图分成几张竖向排列的图片？', '把列数设置为 1，行数设置为需要的张数；工具会沿高度均匀分割。若原图各段高度不同，建议先单独裁剪。'), faq('导出的文件怎么排序？', 'ZIP 内切片使用 slice_行号_列号.png 命名，例如 slice_1_1.png。按行号再按列号整理即可还原网格顺序。')],
    },
    en: {
      summary: 'Split an image into evenly sized rows and columns for meme sheets, nine-tile layouts or shorter pieces of a long image. Adjust the grid and inspect the boundaries before downloading a ZIP of PNG tiles. Each filename includes its row and column so you can organize the pieces in the original order.',
      steps: ['Upload the image you want to split.', 'Set rows and columns and inspect the preview grid.', 'Export the ZIP and unzip the PNG tiles named by row and column.'],
      tips: ['Rows and columns each range from 1 to 10. Use 3 by 3 for nine tiles.', 'This uses an even grid rather than detecting individual stickers. Crop irregular sheets in the drawing tool first.', 'The red preview grid is not included in exported tiles.'],
      faqs: [faq('How do I split a long image vertically?', 'Set columns to 1 and rows to the number of pieces. The tool splits the height evenly. Crop sections separately if they have different heights.'), faq('How are the downloaded tiles ordered?', 'The ZIP uses slice_row_column.png filenames, such as slice_1_1.png. Sort by row and then column to recover the original arrangement.')],
    },
    ja: {
      summary: '画像を均等な行と列に分割し、ミーム集や 9 分割画像、長い画像の切り分けに使えます。プレビューで境界を確認してから、PNG の切片をまとめた ZIP を保存します。ファイル名に行と列の番号が入るので、元の順序で整理できます。',
      steps: ['分割したい画像を読み込みます。', '行数と列数を指定して、プレビューの境界を確認します。', 'ZIP を保存し、解凍して行列番号付きの PNG を取り出します。'],
      tips: ['行数と列数はそれぞれ 1〜10 です。9 分割は 3 行・3 列にします。', '均等な分割で、スタンプの境界の自動検出は行いません。不規則な画像は先に切り抜きます。', 'プレビューの赤い線は、出力する画像には含まれません。'],
      faqs: [faq('縦長画像を何枚かに分けるには？', '列を 1、行を必要な枚数にします。高さを均等に分割するため、各部分の高さが違う場合は個別の切り抜きが適しています。'), faq('保存した切片はどの順番ですか？', 'slice_行番号_列番号.png という名前です。例えば slice_1_1.png は 1 行 1 列目です。行、列の順で並べると元の配置に戻せます。')],
    },
  },
  'dnd-alignment': {
    zh: {
      summary: '制作 DND 阵营九宫格，把角色、朋友或物品放进从守序善良到混乱邪恶的九个位置。逐格上传图片、调整缩放和位置，还能为阵营添加描述或台词。实时预览方便检查人物裁切和文字，完成后导出一张 WebP 阵营对比图。',
      steps: ['为九个阵营格子上传对应的图片。', '选择格子调整缩放与位置，按需开启并填写阵营描述。', '检查完整九宫格，下载 WebP 图片。'],
      tips: ['人物面部尽量放在格子中心，使用缩放与位置控制避免被裁掉。', '描述会同时显示在预览和导出图片里，短句通常更易读。', '这是角色阵营图制作工具，不会自动分析角色属于哪个阵营。'],
      faqs: [faq('可以给每个阵营加一句台词吗？', '可以。开启阵营描述，为相应格子输入介绍或台词，内容会跟随图片一起导出。'), faq('为什么上传的人物图片边缘被裁掉？', '格子使用固定形状展示图片。选择该格子，通过缩放和水平、垂直位置调整重要区域；不同长宽比的图片需要分别调整。')],
    },
    en: {
      summary: 'Build a DND alignment chart with nine images, from Lawful Good to Chaotic Evil. Assign characters, friends or objects to each cell, adjust image scale and position, and optionally add descriptions or quotes. Preview the whole chart before downloading a single WebP comparison image.',
      steps: ['Upload the corresponding image for each of the nine alignments.', 'Adjust each cell’s scale and position and optionally enable alignment descriptions.', 'Review the complete chart and download the WebP.'],
      tips: ['Position faces near the cell center and adjust the crop with scale and position controls.', 'Descriptions appear in both the preview and export; short lines stay readable.', 'This is a chart maker and does not automatically decide a character’s alignment.'],
      faqs: [faq('Can I add a quote to each alignment?', 'Yes. Enable alignment descriptions and enter a line for each cell. The text is included in the preview and exported chart.'), faq('Why are the edges of my character image cropped?', 'Each image fills a fixed cell shape. Select the cell and adjust scale, horizontal position and vertical position to show the important area. Different aspect ratios need individual adjustments.')],
    },
    ja: {
      summary: '秩序・善から混沌・悪までの 9 つの枠に画像を並べ、DND アライメント表を作成します。キャラクター、友人、物を各枠に置き、拡大率と位置を調整できます。属性の説明やセリフも加え、全体を確認して WebP 画像として保存できます。',
      steps: ['9 つの属性の枠に対応する画像を読み込みます。', '各枠の拡大率と位置を調整し、必要なら属性の説明を入力します。', '表全体を確認して WebP を保存します。'],
      tips: ['顔を枠の中央付近に置き、サイズと位置で重要な部分を調整します。', '説明はプレビューと保存画像の両方に入ります。短い文が読みやすくなります。', 'キャラクターの属性を自動判定する機能ではありません。'],
      faqs: [faq('各属性にセリフを加えられますか？', '属性の説明を有効にし、各枠にセリフや紹介文を入力できます。文字はプレビューと書き出し画像に表示されます。'), faq('人物画像の端が切れるのはなぜですか？', '決まった形の枠に画像を配置します。枠を選んで拡大率、水平位置、垂直位置を調整してください。縦横比が異なる画像は個別に調整します。')],
    },
  },
  'mbti-grid': {
    zh: {
      summary: 'MBTI 人格图生成器把选中的人格类型与图片组合成对比网格。可以使用内置纸雕角色案例，也可以替换成自己选择的人物图片，调整各格的缩放和位置，导出 WebP。适合制作角色类型对照、好友人格图或 MBTI 迷因，不提供人格测试或自动分类。',
      steps: ['选择需要的 MBTI 类型，或使用一组内置角色案例。', '按类型上传自己的图片，调整缩放与位置以显示重点。', '检查所选类型组成的网格，下载 WebP。'],
      tips: ['可选择 1–16 个类型，不必填满全部十六型人格。', '选择不同类型组合时，网格会根据数量重新排布，下载前再看一遍裁切。', '内置案例可以直接使用，也可以逐格替换；最终导出为一张图片。'],
      faqs: [faq('能只制作四种人格的对比图吗？', '可以。取消不需要的类型，保留四种即可，网格会根据所选类型数量排列。至少需要保留一种类型。'), faq('这个工具会测出我的 MBTI 吗？', '不会。它根据你选择的类型生成图片，不包含人格问卷、诊断或从照片推断人格的功能。')],
    },
    en: {
      summary: 'Create an MBTI personality grid by pairing selected types with images. Start with the built-in papercraft character examples or replace them with your own pictures, adjust each crop and export a WebP. Use it for character comparisons, friend groups and MBTI memes. It does not test or automatically classify personality.',
      steps: ['Choose MBTI types or start with a built-in character group.', 'Upload replacements for each type and adjust image scale and position.', 'Review the grid of selected types and download the WebP.'],
      tips: ['Choose from 1 to 16 types; filling all sixteen is optional.', 'The layout adapts to the number of selected types, so recheck cropping before downloading.', 'Use the examples as they are or replace individual cells. The export is one combined image.'],
      faqs: [faq('Can I compare only four personality types?', 'Yes. Deselect unwanted types and keep four. The grid adapts to your selection. At least one type must remain selected.'), faq('Will this tool tell me my MBTI type?', 'No. It creates an image from types you choose. It has no personality questionnaire, diagnosis or photo-based personality inference.')],
    },
    ja: {
      summary: '選んだ MBTI タイプと画像を組み合わせ、性格タイプの比較グリッドを作成します。用意されたペーパークラフトのキャラクターを使うか、自分の画像に置き換え、各枠のサイズと位置を調整して WebP を保存できます。キャラクター比較や友人のタイプ紹介に使えますが、性格診断や自動分類は行いません。',
      steps: ['MBTI タイプを選ぶか、用意されたキャラクターグループを使います。', '各タイプの画像を置き換え、拡大率と位置を調整します。', '選んだタイプのグリッドを確認し、WebP を保存します。'],
      tips: ['1〜16 タイプを選べます。全タイプを埋める必要はありません。', '選択した数に合わせて配置が変わるため、保存前に切り取り位置を確認します。', '作例をそのまま使うことも、枠ごとに置き換えることもできます。出力は 1 枚の画像です。'],
      faqs: [faq('4 種類のタイプだけを比較できますか？', '不要なタイプの選択を外して 4 種類を残せば、数に合わせて配置されます。最低 1 種類は選択する必要があります。'), faq('自分の MBTI タイプを判定できますか？', '選択したタイプを画像にするツールです。性格質問票、診断、写真から性格を推定する機能はありません。')],
    },
  },
  'pornhub-style': {
    zh: {
      summary: '用黑底、白字和橙色块制作 Pornhub 风格文字 Logo。自定义前后两段文字，选择左右或上下布局，调整字号和间距，并从实时画布下载 PNG。适合制作文字梗图和风格化标题，不需要上传背景图片。',
      steps: ['输入两段要显示的文字。', '选择横向或纵向布局，调整字号与间距。', '在预览中确认效果，下载 PNG Logo。'],
      tips: ['文字较长时画布会自动加宽，不会裁掉文字。', '默认导出黑色背景；勾选透明背景可导出透明 PNG Logo。', '颜色保持黑、白、橙的既定风格；复杂排版可在在线画图中继续编辑。'],
      faqs: [faq('能把两段文字上下排列吗？', '可以。选择纵向布局后，白色文字放在上方，橙色块文字放在下方；可调整间距。'), faq('能直接下载透明背景的 Logo 吗？', '可以。勾选透明背景后，导出的 PNG 只保留文字和橙色块；需要自由设置背景或图层时可使用在线画图。')],
    },
    en: {
      summary: 'Make a Pornhub-style text logo with a black background, white lettering and an orange block. Customize two text segments, choose horizontal or stacked layout and adjust font size and spacing. The canvas updates as you edit and downloads as PNG, making it useful for text memes and stylized titles.',
      steps: ['Enter the two text segments.', 'Choose horizontal or vertical layout and adjust font size and spacing.', 'Check the preview and download the PNG logo.'],
      tips: ['The canvas widens automatically for longer text, so nothing is cut off.', 'The export uses a black background by default; turn on transparent background for a transparent PNG logo.', 'The palette stays black, white and orange. Use the drawing editor for more flexible layouts.'],
      faqs: [faq('Can I stack the text vertically?', 'Yes. Choose vertical layout to place the white text above the orange block, then adjust the gap.'), faq('Can I download a transparent logo?', 'Yes. Turn on transparent background and the PNG keeps only the lettering and the orange block. Use the drawing editor when you need custom backgrounds or layers.')],
    },
    ja: {
      summary: '黒背景、白い文字、オレンジのブロックを使った Pornhub 風の文字ロゴを作成します。2 つの文字列を入力し、横並び・縦並び、文字サイズ、間隔を調整できます。編集した内容をキャンバスで確認して PNG を保存でき、文字ミームやスタイル付きの見出しに使えます。',
      steps: ['表示したい 2 つの文字列を入力します。', '横並びか縦並びを選び、文字サイズと間隔を調整します。', 'プレビューを確認して PNG を保存します。'],
      tips: ['長い文字列ではキャンバスが自動で広がり、文字は切れません。', '標準では黒い背景で出力します。透明な背景を選ぶと透過 PNG ロゴを保存できます。', '配色は黒・白・オレンジです。より自由なレイアウトにはオンライン描画を使えます。'],
      faqs: [faq('文字を上下に並べられますか？', '縦並びを選ぶと、白い文字が上、オレンジのブロックが下になります。間隔も変更できます。'), faq('透明な背景で保存できますか？', 'できます。透明な背景を選ぶと、文字とオレンジのブロックだけの PNG を保存します。背景やレイヤーを自由に設定するにはオンライン描画を使えます。')],
    },
  },
  'video-thumbnail': {
    zh: {
      summary: '从哔哩哔哩或 YouTube 视频获取封面，方便整理视频资料、参考封面排版或保存缩略图。输入 B 站完整链接、BV / AV 号或 YouTube 链接，预览可用封面与尺寸，再下载 WebP。YouTube 提供多个清晰度选项，实际最高分辨率取决于该视频提供的图片。',
      steps: ['粘贴 B 站视频完整链接、BV / AV 号，或 YouTube 视频链接。', '获取封面，查看预览；YouTube 可比较不同清晰度。', '选择可用图片，下载 WebP，或打开原视频核对。'],
      tips: ['b23.tv 短链接请先换成完整 bilibili.com/video/ 链接。', '最高分辨率不可用时，选择标准或其他清晰度；工具不会放大不存在的高清原图。', '封面获取依赖视频平台，请求限制或视频不可见时可能无法获取。'],
      faqs: [faq('为什么 YouTube 最高分辨率封面不能下载？', '并非每个视频都提供 maxres 封面。遇到不可用提示时选择标准、高质量或其他清晰度，再检查图片实际尺寸。'), faq('会下载视频文件吗？', '不会。此工具获取并导出静态封面图片，下载结果为 WebP，不包含视频画面、音频或视频文件。')],
    },
    en: {
      summary: 'Find Bilibili and YouTube video thumbnails for reference, media notes or cover-layout research. Enter a full Bilibili URL, BV / AV ID or YouTube link, inspect the available cover and dimensions, then download WebP. YouTube offers several quality options, but the highest available resolution depends on the video.',
      steps: ['Paste a full Bilibili video URL, BV / AV ID or YouTube video link.', 'Fetch the cover and compare the available YouTube quality options.', 'Choose an available image, download WebP or open the video to verify it.'],
      tips: ['Replace b23.tv short links with a full bilibili.com/video/ URL.', 'If maximum resolution is unavailable, choose another quality. The tool does not upscale a missing high-resolution original.', 'Platform request limits and unavailable videos can prevent thumbnail retrieval.'],
      faqs: [faq('Why is a YouTube maximum-resolution thumbnail unavailable?', 'Not every video provides a maxres image. Choose standard, high quality or another available option, and check the actual dimensions.'), faq('Does it download the video?', 'No. This retrieves and exports a still cover image as WebP. It does not download the video or its audio.')],
    },
    ja: {
      summary: 'Bilibili と YouTube の動画サムネイルを取得し、資料整理やカバーのレイアウト参考に使えます。Bilibili の完全な URL、BV・AV 番号、または YouTube リンクを入力して、画像と寸法を確認し WebP を保存します。YouTube では複数の画質を選べますが、最高解像度の有無は動画によって異なります。',
      steps: ['Bilibili の完全な動画 URL・BV / AV 番号、または YouTube リンクを貼り付けます。', 'サムネイルを取得し、YouTube では使える画質を比較します。', '利用できる画像を選んで WebP を保存するか、元動画を開いて確認します。'],
      tips: ['b23.tv の短縮リンクは bilibili.com/video/ の完全な URL に置き換えてください。', '最高解像度がなければ別の画質を選びます。存在しない高解像度画像を拡大して作る機能ではありません。', '動画が非公開の場合やプラットフォームのリクエスト制限で取得できない場合があります。'],
      faqs: [faq('YouTube の最高解像度を保存できないのはなぜですか？', 'すべての動画が maxres 画像を提供するわけではありません。標準や高画質など、利用可能な選択肢を選び、実際の寸法を確認してください。'), faq('動画そのものをダウンロードしますか？', '静止したカバー画像を取得し WebP に保存するツールです。動画ファイルや音声はダウンロードしません。')],
    },
  },
  'wiggle-studio': {
    zh: {
      summary: '晃动图片工坊把静态照片中的局部做成弹性动画。涂抹要动的区域，选择晃动效果并调整力度与速度，也可以直接拖动图片中的柔软区域，录制当前看到的动作。可导出循环 GIF，或在浏览器支持时导出 WebM、MP4 视频，适合制作动态表情和有趣的照片动效。',
      steps: ['上传 PNG、JPG、WebP，涂抹希望晃动的区域。', '选择运动预设并调整力度、速度，预览或拖动交互效果。', '选择可用格式和 1–10 秒录制时长，录制后下载动画。'],
      tips: ['上传图片不超过 80 MB；只涂要动的部分，留出稳定的背景作为参照。', 'GIF 适合循环播放；WebM 和 MP4 是否可选取决于浏览器的录制编码支持。', '录制捕捉当前预览，也会保留录制时的手动动作；不同浏览器和设备可能影响流畅度。'],
      faqs: [faq('为什么 MP4 按钮不能用？', 'MP4 录制需要浏览器支持相应视频编码。工具会检测支持情况并禁用不可用格式，可以选择 GIF 或可用的 WebM。'), faq('能只让照片中的一个物体动吗？', '可以。涂抹该物体所在区域，避开不希望动的背景，再调整晃动力度和速度。选区边界与周围内容会影响视觉效果。')],
    },
    en: {
      summary: 'Turn part of a still photo into springy motion. Paint the area that should move, select a motion preset and adjust intensity and speed, or drag the soft region directly. Record the motion you see and export a looping GIF, or WebM and MP4 when your browser supports recording them. It works well for animated reactions and playful photo effects.',
      steps: ['Upload PNG, JPG or WebP and paint the area that should move.', 'Choose a motion preset, adjust intensity and speed, and preview or drag the effect.', 'Choose an available format and a 1–10 second duration, record and download.'],
      tips: ['Images must be no larger than 80 MB. Leave the background unpainted for a stable reference.', 'GIF loops; WebM and MP4 availability depends on the browser’s recording codecs.', 'Recording captures the preview and your live gestures. Smoothness can vary by browser and device.'],
      faqs: [faq('Why is MP4 recording disabled?', 'MP4 requires a compatible browser recording codec. The tool detects available formats and disables unsupported ones. Choose GIF or an available WebM option.'), faq('Can I animate just one object in a photo?', 'Yes. Paint that object while avoiding the background, then adjust motion intensity and speed. The selection boundary and surrounding content affect the result.')],
    },
    ja: {
      summary: '静止写真の一部分を、弾むようなアニメーションに変えます。動かす範囲を塗り、動きのプリセット、強さ、速度を調整したり、柔らかい部分を直接ドラッグしたりできます。見えている動きを録画してループ GIF を保存でき、ブラウザが対応していれば WebM・MP4 も利用できます。',
      steps: ['PNG・JPG・WebP を読み込み、動かしたい範囲を塗ります。', '動きのプリセット、強さ、速度を選び、プレビューやドラッグで確認します。', '利用できる形式と 1〜10 秒の時間を選び、録画後に保存します。'],
      tips: ['画像は 80 MB 以下です。背景は塗らずに残すと、動く部分との違いが分かりやすくなります。', 'GIF はループ再生に適しています。WebM・MP4 の利用可否はブラウザの録画用コーデックによります。', '録画はプレビューと操作中の動きを記録します。滑らかさはブラウザや端末によって変わります。'],
      faqs: [faq('MP4 ボタンが使えないのはなぜですか？', 'MP4 録画に対応したブラウザのコーデックが必要です。対応形式を検出し、非対応のものは無効になります。GIF または利用できる WebM を選んでください。'), faq('写真の 1 つの物だけを動かせますか？', 'その物の範囲だけを塗り、背景を避けて動きの強さと速度を調整します。選択境界や周辺の内容によって見え方が変わります。')],
    },
  },
  screenshot: {
    zh: {
      summary: '在浏览器里截取屏幕，或把滚动中的网页自动拼接成一张长截图。即时截图可选择标签页、窗口或整个屏幕；长截图会在你向下滚动时比对画面，只追加新出现的内容，吸顶导航和固定页脚只保留一次。画面在本机处理，不上传服务器，导出前可框选要保留的部分。',
      steps: ['选择即时截图，或选择网页长截图后挑选要截取的标签页。', '长截图时从页面顶部开始匀速向下滚动，完成后回到工具页点击完成拼接。', '默认导出整张图片，也可以拖动选区边框只保留需要的部分，再下载 PNG。'],
      tips: ['滚动过快时工具会提示往回滚动一点，对上画面后会继续拼接。', '长截图使用标签页原始分辨率，最高约 32000 像素；超过后自动结束。', '需要电脑版 Chrome、Edge 或 Firefox；手机浏览器不支持屏幕捕获。Chrome 和 Edge 在后台取帧更稳定。'],
      faqs: [faq('会把网页内容上传到服务器吗？', '不会。截图和拼接都在你的浏览器中完成，网站没有截图接口，也不会保存画面。'), faq('长截图里为什么能看到滚动条？', '截取的是标签页的真实画面，网页自己的滚动条也在其中。导出前把选区右边缘向左拖一点即可去掉。')],
    },
    en: {
      summary: 'Capture your screen in the browser, or stitch a scrolling webpage into one long screenshot. Screen capture lets you pick a tab, window or whole screen. Full-page capture compares frames as you scroll and appends only new content, keeping sticky headers and fixed footers once. Frames are processed on your device, and you can select the area to keep before exporting.',
      steps: ['Choose screen capture, or choose full-page capture and pick the tab to capture.', 'For a long capture, start at the top and scroll down steadily, then return to the tool and select Finish.', 'The whole image is selected by default. Drag the selection edges to keep only part of it, then download PNG.'],
      tips: ['If you scroll too fast, the tool asks you to scroll back a little and continues once the frames line up.', 'Long captures keep the tab\u2019s native resolution, up to about 32,000 pixels tall, and finish automatically at that limit.', 'Use desktop Chrome, Edge or Firefox. Mobile browsers cannot capture the screen. Chrome and Edge capture more reliably in the background.'],
      faqs: [faq('Is the page uploaded to a server?', 'No. Capturing and stitching happen in your browser. There is no screenshot server, and frames are not stored.'), faq('Why is the scrollbar visible in a long screenshot?', 'The tool captures what the tab actually shows, including the page\u2019s own scrollbar. Drag the right edge of the selection inward before exporting to remove it.')],
    },
    ja: {
      summary: 'ブラウザで画面を撮影したり、スクロールしたページを 1 枚の縦長スクリーンショットにつなげたりできます。画面の撮影ではタブ、ウィンドウ、画面全体を選べます。縦長の撮影ではスクロール中のフレームを比較して新しい部分だけを追加し、固定ヘッダーやフッターは 1 回だけ残します。画面は端末内で処理され、書き出す前に残す範囲を選べます。',
      steps: ['画面の撮影を選ぶか、ページ全体の撮影を選んで撮影するタブを指定します。', '縦長の撮影ではページの一番上から一定の速さで下へスクロールし、ツールに戻って完了を選びます。', '初期状態では画像全体が選択されています。選択範囲の端をドラッグして必要な部分だけにし、PNG を保存します。'],
      tips: ['速くスクロールしすぎると少し戻すよう案内が出て、位置が合うと続きをつなげます。', '縦長の撮影はタブ本来の解像度で、高さ約 32,000 ピクセルまで記録し、上限に達すると自動で完了します。', 'パソコン版の Chrome、Edge、Firefox を使ってください。スマートフォンのブラウザは画面を取得できません。Chrome と Edge はバックグラウンドでも安定して取得できます。'],
      faqs: [faq('ページの内容はサーバーに送信されますか？', 'いいえ。撮影も結合もブラウザ内で行われ、撮影用のサーバーはなく、画面も保存されません。'), faq('縦長のスクリーンショットにスクロールバーが写るのはなぜですか？', 'タブに実際に表示されている画面をそのまま取得するため、ページのスクロールバーも含まれます。書き出す前に選択範囲の右端を内側へドラッグすると除けます。')],
    },
  },
};

const relatedTools = {
  'image-enhancer': ['image-compress', 'online-drawing', 'ai-watermark-remover'],
  'online-drawing': ['image-compress', 'watermark-adder', 'wiggle-studio'],
  'image-compress': ['image-enhancer', 'online-drawing', 'meme-slicer'],
  'image-ocr': ['screenshot', 'online-drawing', 'subtitle-generator'],
  'watermark-adder': ['online-drawing', 'image-compress'],
  'ai-watermark-remover': ['image-enhancer', 'online-drawing', 'image-compress'],
  'subtitle-generator': ['image-ocr', 'online-drawing', 'image-compress'],
  'meme-slicer': ['online-drawing', 'dnd-alignment', 'image-compress'],
  'dnd-alignment': ['mbti-grid', 'meme-slicer', 'online-drawing'],
  'mbti-grid': ['dnd-alignment', 'online-drawing', 'image-compress'],
  'pornhub-style': ['online-drawing', 'watermark-adder'],
  'video-thumbnail': ['online-drawing', 'image-compress', 'image-ocr'],
  'wiggle-studio': ['online-drawing', 'image-compress'],
  screenshot: ['image-ocr', 'online-drawing', 'image-compress'],
};

export const toolGuides = Object.fromEntries(Object.entries(guideData).map(([slug, locales]) => [
  slug,
  Object.fromEntries(Object.entries(locales).map(([lang, guide]) => [lang, { ...guide, related: relatedTools[slug] }])),
]));

export function getToolGuide(slug, lang) {
  return toolGuides[slug]?.[lang] || toolGuides[slug]?.en || null;
}
