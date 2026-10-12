import { useEffect, useRef, useState } from 'react';
import { Download, ExternalLink, Link, Loader2, Video } from 'lucide-react';
import { getBilibiliCover, parseVideoInput, thumbnailWebPBlob, YOUTUBE_QUALITIES } from '../../utils/videoThumbnail.js';

const copy = {
  zh: {
    title: '视频封面下载', subtitle: '粘贴哔哩哔哩或 YouTube 链接，预览并下载高清封面。',
    input: '视频链接或 BV / AV 号', placeholder: '粘贴 B 站 / YouTube 视频链接或 BV / AV 号',
    formats: '支持 B 站完整视频链接、BV / AV 号，以及 YouTube 常规、短视频和直播链接。b23 短链接需打开后复制完整地址。', shortOpen: '打开短链接，复制完整视频地址',
    auto: '自动识别平台', bilibili: '哔哩哔哩', example: '试用示例：', find: '获取封面', loading: '正在获取…',
    empty: '把喜欢的视频，留成一张封面。', emptyHint: '输入链接，或点击上方示例开始。', result: '封面预览', original: '原始封面',
    download: '下载 WebP', downloading: '正在下载…', downloaded: '封面已下载', dimensions: '图片尺寸', open: '打开视频', author: 'UP 主', address: '原图链接',
    failedImage: '该清晰度封面暂不可用，可尝试其他清晰度。', webpError: '当前浏览器不支持 WebP 导出，请使用较新的 Chrome、Edge 或 Firefox。',
    qualities: ['超清封面', '标准封面', '高清封面', '中等封面', '默认封面'],
    errors: { invalid_input: '无法识别链接，请输入 B 站视频链接、BV / AV 号或 YouTube 链接。', short_link_failed: '短链接无法解析，请复制视频完整链接重试。', video_not_found: '视频不存在、已被删除或暂不可见，请检查链接。', rate_limited: '哔哩哔哩暂时限制了请求，请稍后重试。', timeout: '获取封面超时，请稍后重试。', quality_unavailable: '该清晰度封面不可用，请选择其他清晰度。', image_failed: '封面下载失败，请重试。', upstream_failed: '暂时无法获取视频信息，请稍后重试。' },
  },
  en: {
    title: 'Video thumbnail downloader', subtitle: 'Paste a Bilibili or YouTube link to preview and download high-resolution covers.',
    input: 'Video URL or BV / AV ID', placeholder: 'Paste a Bilibili / YouTube URL or BV / AV ID',
    formats: 'Supports full Bilibili video URLs, BV / AV IDs, and YouTube videos, Shorts and live links. For b23 links, open the link and copy the full URL.', shortOpen: 'Open short link and copy the full video URL',
    auto: 'Platform detected automatically', bilibili: 'Bilibili', example: 'Try an example:', find: 'Find thumbnail', loading: 'Loading…',
    empty: 'Save a favorite video as a cover.', emptyHint: 'Paste a link or choose an example above.', result: 'Thumbnail preview', original: 'Original cover',
    download: 'Download WebP', downloading: 'Downloading…', downloaded: 'Cover downloaded', dimensions: 'Image size', open: 'Open video', author: 'Creator', address: 'Original image URL',
    failedImage: 'This thumbnail quality is unavailable. Try another quality.', webpError: 'This browser cannot export WebP. Please use a recent Chrome, Edge or Firefox.', qualities: ['Maximum resolution', 'Standard', 'High quality', 'Medium quality', 'Default'],
    errors: { invalid_input: 'Enter a valid Bilibili video URL, BV / AV ID or YouTube URL.', short_link_failed: 'Unable to resolve the short link. Try the full video URL.', video_not_found: 'This video does not exist, was removed or is unavailable.', rate_limited: 'Bilibili is limiting requests. Please try again later.', timeout: 'The request timed out. Please try again.', quality_unavailable: 'This thumbnail quality is unavailable. Choose another quality.', image_failed: 'Unable to download the image. Please try again.', upstream_failed: 'Unable to load video information. Please try again later.' },
  },
  ja: {
    title: '動画サムネイルダウンロード', subtitle: 'Bilibili または YouTube のリンクから、高画質カバーを表示・ダウンロード。',
    input: '動画 URL または BV / AV ID', placeholder: 'Bilibili / YouTube URL または BV / AV ID を入力',
    formats: '完全な Bilibili 動画 URL、BV / AV ID、YouTube の動画・ショート・ライブに対応。b23 短縮リンクは開いて完全な URL をコピーしてください。', shortOpen: '短縮リンクを開いて完全な動画 URL をコピー',
    auto: 'プラットフォームを自動判別', bilibili: 'Bilibili', example: 'サンプル：', find: 'サムネイルを取得', loading: '読み込み中…',
    empty: 'お気に入りの動画を、一枚のカバーに。', emptyHint: 'リンクを入力するか、上のサンプルを選択してください。', result: 'サムネイルプレビュー', original: '元のカバー',
    download: 'WebP をダウンロード', downloading: 'ダウンロード中…', downloaded: 'カバーをダウンロードしました', dimensions: '画像サイズ', open: '動画を開く', author: '投稿者', address: '元画像の URL',
    failedImage: 'この画質のサムネイルは利用できません。別の画質をお試しください。', webpError: 'このブラウザは WebP を出力できません。最新の Chrome、Edge、Firefox をお使いください。', qualities: ['最高画質', '標準', '高画質', '中画質', '通常'],
    errors: { invalid_input: '正しい Bilibili の動画 URL、BV / AV ID または YouTube URL を入力してください。', short_link_failed: '短縮リンクを解析できません。動画の完全な URL をお試しください。', video_not_found: '動画が存在しない、削除済み、または非公開です。', rate_limited: 'Bilibili がリクエストを制限しています。しばらくしてからお試しください。', timeout: '読み込みがタイムアウトしました。もう一度お試しください。', quality_unavailable: 'この画質は利用できません。別の画質を選択してください。', image_failed: '画像をダウンロードできません。もう一度お試しください。', upstream_failed: '動画情報を取得できません。しばらくしてからお試しください。' },
  },
};

function CoverCard({ thumbnail, t, download, downloading, disabled }) {
  const [dimensions, setDimensions] = useState('');
  const [failed, setFailed] = useState(false);
  return <article className="border border-black/15 dark:border-white/15 rounded-lg overflow-hidden">
    <div className="bg-black/5 dark:bg-white/5 min-h-32 flex items-center justify-center">
      {failed ? <p className="p-6 text-sm text-center text-neutral-600 dark:text-neutral-300" role="status">{t.failedImage}</p> : <img
        src={thumbnail.previewUrl} alt={thumbnail.title || thumbnail.label} className="w-full h-auto max-h-[420px] object-contain" referrerPolicy="no-referrer"
        onLoad={event => {
          const { naturalWidth: width, naturalHeight: height } = event.currentTarget;
          if (thumbnail.platform === 'youtube' && ['maxresdefault', 'sddefault'].includes(thumbnail.quality) && width <= 120) setFailed(true);
          else setDimensions(`${width} × ${height}`);
        }} onError={() => setFailed(true)} />}
    </div>
    <div className="p-4 sm:p-5 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h3 className="font-medium">{thumbnail.label}</h3><p className="text-sm text-neutral-500 dark:text-neutral-400">{t.dimensions}: {dimensions || '—'}</p></div>
        <button type="button" disabled={failed || !dimensions || disabled} onClick={() => download(thumbnail)} className="studio-button !gap-2 !min-h-11 disabled:opacity-50">
          {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} {downloading ? t.downloading : t.download}
        </button>
      </div>
      <label className="block text-xs text-neutral-500 dark:text-neutral-400">{t.address}
        <input aria-label={`${t.address} · ${thumbnail.label}`} readOnly value={thumbnail.url} className="mt-1 w-full min-w-0 px-3 py-2 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-md text-xs" onClick={event => event.currentTarget.select()} />
      </label>
    </div>
  </article>;
}

export default function VideoThumbnail({ lang = 'en' }) {
  const t = copy[lang] || copy.en;
  const [input, setInput] = useState('');
  const [thumbnails, setThumbnails] = useState([]);
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const controller = useRef(null);
  const requestNumber = useRef(0);
  useEffect(() => () => controller.current?.abort(), []);
  const detected = parseVideoInput(input);
  const showError = code => code === 'webp_unsupported' ? t.webpError : t.errors[code] || t.errors.upstream_failed;

  const findThumbnails = async (value = input) => {
    controller.current?.abort();
    const serial = ++requestNumber.current;
    const abort = new AbortController();
    controller.current = abort;
    setError(''); setNotice(''); setThumbnails([]); setMetadata(null);
    const parsed = parseVideoInput(value);
    if (!parsed) { setLoading(false); setError(t.errors.invalid_input); return; }
    if (parsed.platform === 'youtube') {
      setLoading(false);
      setMetadata({ platform: 'YouTube', videoUrl: `https://www.youtube.com/watch?v=${parsed.id}` });
      setThumbnails(YOUTUBE_QUALITIES.map((item, index) => ({ id: parsed.id, platform: 'youtube', quality: item.key, label: t.qualities[index], url: `https://i.ytimg.com/vi/${parsed.id}/${item.key}.jpg`, previewUrl: `https://i.ytimg.com/vi/${parsed.id}/${item.key}.jpg` })));
      return;
    }
    setLoading(true);
    try {
      const data = await getBilibiliCover(value, { signal: abort.signal });
      if (serial !== requestNumber.current) return;
      setMetadata({ ...data, platform: t.bilibili });
      setThumbnails([{ id: data.bvid, platform: 'bilibili', quality: 'original', label: t.original, title: data.title, url: data.url, previewUrl: data.url }]);
    } catch (failure) {
      if (!abort.signal.aborted && serial === requestNumber.current) setError(showError(failure.message));
    } finally { if (serial === requestNumber.current) setLoading(false); }
  };

  const downloadThumbnail = async thumbnail => {
    setError(''); setNotice(''); setDownloading(thumbnail.quality);
    try {
      const blob = await thumbnailWebPBlob(thumbnail.url, AbortSignal.timeout(20000));
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = `${thumbnail.platform}_${thumbnail.id}${thumbnail.platform === 'youtube' ? `_${thumbnail.quality}` : ''}.webp`;
      document.body.appendChild(link); link.click(); link.remove();
      // Give the browser time to consume the blob before releasing it.
      setTimeout(() => URL.revokeObjectURL(objectUrl), 10000);
      setNotice(t.downloaded);
    } catch (failure) { setError(showError(failure.name === 'TimeoutError' ? 'timeout' : failure.message)); }
    finally { setDownloading(''); }
  };

  const tryExample = value => { setInput(value); findThumbnails(value); };
  return <div className="tool-shell !max-w-4xl space-y-5">
    <div className="text-center"><h2 className="tool-title">{t.title}</h2><p className="tool-subtitle">{t.subtitle}</p></div>
    <form className="tool-card" onSubmit={event => { event.preventDefault(); findThumbnails(); }}>
      <div className="flex flex-wrap gap-2 mb-5 text-xs"><span className="px-3 py-1.5 border border-black/15 dark:border-white/15 rounded-full">{t.bilibili}</span><span className="px-3 py-1.5 border border-black/15 dark:border-white/15 rounded-full">YouTube</span><span className="py-1.5 text-neutral-500 dark:text-neutral-400">{t.auto}</span></div>
      <label htmlFor="video-thumbnail-input" className="flex gap-2 items-center text-sm font-medium mb-2"><Link className="w-4 h-4" />{t.input}</label>
      <input id="video-thumbnail-input" type="text" value={input} onChange={event => {
        setInput(event.target.value); controller.current?.abort(); requestNumber.current++; setLoading(false); setError(''); setNotice(''); setThumbnails([]); setMetadata(null);
      }} placeholder={t.placeholder} autoComplete="off" maxLength={2048} aria-describedby="video-thumbnail-formats" className="w-full min-w-0 px-4 py-3 border border-black/15 dark:border-white/15 rounded-md !text-base" />
      <p id="video-thumbnail-formats" className="mt-2 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">{t.formats}</p>
      <div className="flex flex-wrap items-center gap-2 my-4 text-sm"><span className="text-neutral-500 dark:text-neutral-400">{t.example}</span><button type="button" onClick={() => tryExample('https://www.bilibili.com/video/BV1GBa66HEC7/')} className="underline underline-offset-4 min-h-11 px-2">{t.bilibili}</button><button type="button" onClick={() => tryExample('https://www.youtube.com/watch?v=jNQXAC9IVRw')} className="underline underline-offset-4 min-h-11 px-2">YouTube</button></div>
      <button type="submit" disabled={!input.trim() || loading} className="studio-button w-full !gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Video className="w-5 h-5" />}{loading ? t.loading : t.find}{!loading && detected && <span className="text-xs opacity-80">· {detected.platform === 'bilibili' ? t.bilibili : 'YouTube'}</span>}
      </button>
    </form>
    {error && <div role="alert" className="tool-card text-sm border-red-400/50 text-red-700 dark:text-red-300"><p>{error}</p>{detected?.kind === 'short' && <a className="inline-flex items-center gap-2 underline underline-offset-4 min-h-11" href={detected.url} target="_blank" rel="noopener noreferrer">{t.shortOpen}<ExternalLink className="w-4 h-4" /></a>}</div>}
    {notice && <p role="status" className="text-sm text-center">{notice}</p>}
    <section className="tool-card" aria-busy={loading} aria-label={t.result}>
      {metadata ? <div className="mb-5 space-y-2"><span className="text-xs text-neutral-500 dark:text-neutral-400">{metadata.platform}{metadata.bvid && ` · ${metadata.bvid}`}</span>
        <h2 className="text-lg font-medium break-words">{metadata.title || t.result}</h2>
        {metadata.author && <p className="text-sm text-neutral-500 dark:text-neutral-400">{t.author}: {metadata.author}</p>}
        <a href={metadata.videoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm underline underline-offset-4 min-h-11">{t.open}<ExternalLink className="w-3.5 h-3.5" /></a>
      </div> : <div className="py-10 text-center text-neutral-500 dark:text-neutral-400"><Video className="w-8 h-8 mx-auto mb-4" /><p>{loading ? t.loading : t.empty}</p>{!loading && <p className="mt-2 text-sm">{t.emptyHint}</p>}</div>}
      <div className="space-y-5">{thumbnails.map(thumbnail => <CoverCard key={`${thumbnail.platform}-${thumbnail.id}-${thumbnail.quality}`} thumbnail={thumbnail} t={t} download={downloadThumbnail} downloading={downloading === thumbnail.quality} disabled={!!downloading} />)}</div>
    </section>
  </div>;
}
