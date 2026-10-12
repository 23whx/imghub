export const studioCopy = {
  zh: {
    headline: ['在线图片工具，', '创作更简单。'], intro: '免费在线图片工具集，一站完成图片编辑与创作。', detail: '在线画图、图片压缩、图片文字识别、字幕截图，无需安装，打开即用。', start: '开始创作', browse: '浏览全部工具', selected: '创作，从这里开始。', selectedDesc: '选一个灵感，让它变成你的作品。', all: '免费在线图片工具', allDesc: '画图、压缩、文字识别与图片创作，按需选择。', filters: ['全部工具', '创作图片', '处理图片', '提取内容'], search: '搜索工具', noResults: '没有找到匹配的工具，试试其他关键词。', clear: '清除筛选', open: '打开工具', philosophy: '把想象，留给你。', philosophyDesc: '把繁琐的步骤交给工具，把时间留给创作。', values: [['免费使用', '无需注册，打开就能开始。'], ['本地处理', '上传的图片在浏览器内编辑。'], ['即时预览', '边调整，边看见你的想法。']], footer: '每张图片，都有新的可能。', back: '全部工具', workspace: '创作工作台', guide: '上传图片 · 调整效果 · 导出作品', ready: '准备好开始创作了吗？', toolsNav: '全部工具', aboutNav: '关于', theme: '切换明暗主题', menu: '打开导航', close: '关闭导航', subtitle: '有些风景，只有出发才能看见。', sample: '效果示例', contact: '联系作者'
  },
  en: {
    headline: ['Online image tools.', 'Create with ease.'], intro: 'A free online image toolkit for editing and creating.', detail: 'Draw online, compress images, extract text and make subtitle screenshots. No installation needed.', start: 'Start creating', browse: 'Explore all tools', selected: 'A little inspiration. A new creation.', selectedDesc: 'Choose an idea. Make it yours.', all: 'Free online image tools', allDesc: 'Drawing, compression, OCR and image creation, all in your browser.', filters: ['All tools', 'Create', 'Edit', 'Extract'], search: 'Search tools', noResults: 'No tools found. Try another keyword.', clear: 'Clear filters', open: 'Open tool', philosophy: 'More room for imagination.', philosophyDesc: 'Let the tools handle the steps. Keep your time for creating.', values: [['Free to use', 'No account needed. Just start.'], ['Local editing', 'Your uploaded images are edited in your browser.'], ['Live preview', 'See your ideas take shape as you adjust.']], footer: 'Every image holds a new possibility.', back: 'All tools', workspace: 'Creative workspace', guide: 'Upload · Adjust · Export', ready: 'Ready to make something?', toolsNav: 'All tools', aboutNav: 'About', theme: 'Toggle color theme', menu: 'Open navigation', close: 'Close navigation', subtitle: 'Some views are only found along the way.', sample: 'Example result', contact: 'Contact the creator'
  },
  ja: {
    headline: ['画像ツール、', '創作を自由に。'], intro: '画像編集と創作をひとつに。無料オンライン画像ツール集。', detail: 'オンラインお絵描き、画像圧縮、画像文字認識、字幕スクショを、インストール不要で。', start: '創作をはじめる', browse: 'すべてのツール', selected: 'ここから、創作がはじまる。', selectedDesc: 'ひとつのアイデアを、あなたの作品に。', all: '無料オンライン画像ツール', allDesc: 'お絵描き、圧縮、文字認識、画像作成をブラウザで。', filters: ['すべて', 'つくる', '編集する', '抽出する'], search: 'ツールを検索', noResults: 'ツールが見つかりません。別のキーワードをお試しください。', clear: '絞り込みを解除', open: 'ツールを開く', philosophy: '想像する時間を、あなたに。', philosophyDesc: '面倒な手順はツールに任せて、創作を楽しもう。', values: [['無料で使える', '登録不要。すぐにはじめられます。'], ['ローカルで編集', 'アップロードした画像はブラウザ内で編集。'], ['すぐにプレビュー', '調整しながら、アイデアを形に。']], footer: 'すべての画像に、新しい可能性。', back: 'すべてのツール', workspace: '創作ワークスペース', guide: 'アップロード · 調整 · 書き出し', ready: '創作をはじめませんか？', toolsNav: 'ツール', aboutNav: 'About', theme: 'テーマを切り替える', menu: 'ナビゲーションを開く', close: 'ナビゲーションを閉じる', subtitle: '旅に出て、はじめて見える景色がある。', sample: '仕上がりの例', contact: '作者に連絡'
  }
};

export function getStudioCopy(lang) { return studioCopy[lang] || studioCopy.en; }

export const toolCategory = {
  'subtitle-generator': 1, 'wiggle-studio': 1, 'online-drawing': 1, 'mbti-grid': 1, 'dnd-alignment': 1, 'pornhub-style': 1,
  'image-compress': 2, 'image-enhancer': 2, 'meme-slicer': 2, 'watermark-adder': 2, 'ai-watermark-remover': 2, 'image-ocr': 3, 'video-thumbnail': 3, 'screenshot': 3,
};

export const exhibitOrder = ['subtitle-generator', 'wiggle-studio', 'online-drawing', 'mbti-grid', 'dnd-alignment', 'pornhub-style', 'image-compress', 'image-enhancer', 'meme-slicer', 'watermark-adder', 'ai-watermark-remover', 'image-ocr', 'video-thumbnail', 'screenshot'];
