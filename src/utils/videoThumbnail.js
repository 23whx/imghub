// Shared link parsing; no network calls in the browser or arbitrary host fetching.
export const YOUTUBE_QUALITIES = [
  { key: 'maxresdefault', width: 1280, height: 720 },
  { key: 'sddefault', width: 640, height: 480 },
  { key: 'hqdefault', width: 480, height: 360 },
  { key: 'mqdefault', width: 320, height: 180 },
  { key: 'default', width: 120, height: 90 },
];

export function parseBilibiliId(value) {
  if (/^BV[a-zA-Z0-9]{10}$/i.test(value)) return { platform: 'bilibili', kind: 'bvid', id: `BV${value.slice(2)}` };
  if (/^av[1-9]\d{0,15}$/i.test(value)) return { platform: 'bilibili', kind: 'aid', id: value.slice(2) };
  return null;
}

export function parseVideoInput(value) {
  const text = String(value || '').trim();
  if (!text || text.length > 2048) return null;
  const bareId = parseBilibiliId(text);
  if (bareId) return bareId;
  // Bilibili's share text often includes a title before the URL.
  const match = text.match(/https?:\/\/[^\s<>"，。]+/i);
  const candidate = match?.[0] || (/^(?:www\.|m\.)?(?:bilibili\.com|b23\.tv|youtube\.com|youtu\.be)\//i.test(text) ? `https://${text}` : text);
  let url;
  try { url = new URL(candidate); } catch { return null; }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.port) return null;
  const host = url.hostname.toLowerCase();
  if (['bilibili.com', 'www.bilibili.com', 'm.bilibili.com'].includes(host)) {
    const id = url.pathname.match(/^\/video\/((?:BV[a-zA-Z0-9]{10}|av[1-9]\d{0,15}))(?:\/|$)/i)?.[1];
    return id ? parseBilibiliId(id) : null;
  }
  if (host === 'b23.tv' && /^\/[a-zA-Z0-9]{1,32}\/?$/.test(url.pathname)) {
    return { platform: 'bilibili', kind: 'short', id: url.pathname.split('/')[1], url: `https://b23.tv${url.pathname}` };
  }
  let id;
  if (host === 'youtu.be') id = url.pathname.split('/')[1];
  if (['youtube.com', 'www.youtube.com', 'm.youtube.com', 'www.youtube-nocookie.com', 'youtube-nocookie.com'].includes(host)) {
    id = url.pathname === '/watch' ? url.searchParams.get('v') : url.pathname.match(/^\/(?:embed|shorts|live|v)\/([^/]+)/)?.[1];
  }
  return /^[a-zA-Z0-9_-]{11}$/.test(id || '') ? { platform: 'youtube', kind: 'video', id } : null;
}

export function normalizeBilibiliCover(payload) {
  if (payload?.code !== 0) {
    const code = [-404, 62002, 62004].includes(payload?.code) ? 'video_not_found' : [-403, -352, -412, -509, -799].includes(payload?.code) ? 'rate_limited' : 'upstream_failed';
    throw new Error(code);
  }
  const data = payload.data;
  if (!data || !/^BV[a-zA-Z0-9]{10}$/.test(data.bvid || '')) throw new Error('upstream_failed');
  let url;
  try { url = new URL(data.pic); } catch { throw new Error('image_failed'); }
  if (!['http:', 'https:'].includes(url.protocol) || !/^i[0-9]+\.hdslb\.com$/.test(url.hostname) || url.username || url.password || url.port || !url.pathname.startsWith('/bfs/archive/')) throw new Error('image_failed');
  url.protocol = 'https:';
  url.search = ''; url.hash = '';
  return { url: url.href, title: String(data.title || '').slice(0, 300), author: String(data.owner?.name || '').slice(0, 100), bvid: data.bvid, videoUrl: `https://www.bilibili.com/video/${data.bvid}/` };
}

// A classic JSONP script can use Bilibili's public callback response without a
// server/proxy. Only a fixed Bilibili endpoint and validated video IDs are used.
export function getBilibiliCover(input, { signal, timeout = 15000 } = {}) {
  const parsed = parseVideoInput(input);
  if (parsed?.platform !== 'bilibili') return Promise.reject(new Error('invalid_input'));
  if (parsed.kind === 'short') return Promise.reject(new Error('short_link_failed'));
  if (signal?.aborted) return Promise.reject(new DOMException('Aborted', 'AbortError'));
  return new Promise((resolve, reject) => {
    const callback = `imghubBili_${crypto.randomUUID().replaceAll('-', '')}`;
    const script = document.createElement('script');
    let timer;
    let settled = false;
    const finish = (error, result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      signal?.removeEventListener('abort', onAbort);
      script.remove();
      delete window[callback];
      if (error) reject(error); else resolve(result);
    };
    const onAbort = () => finish(new DOMException('Aborted', 'AbortError'));
    window[callback] = payload => {
      try { finish(null, normalizeBilibiliCover(payload)); } catch (error) { finish(error); }
    };
    script.async = true;
    script.referrerPolicy = 'no-referrer';
    script.src = `https://api.bilibili.com/x/web-interface/view?${new URLSearchParams({ [parsed.kind]: parsed.id, jsonp: 'jsonp', callback })}`;
    // A script error hides the HTTP status. If an opaque request still gets an
    // answer, the API is reachable but refused (usually 412 risk control).
    script.onerror = () => fetch(script.src, { mode: 'no-cors', credentials: 'omit', referrerPolicy: 'no-referrer', signal })
      .then(() => finish(new Error('rate_limited')), () => finish(new Error('upstream_failed')));
    timer = setTimeout(() => finish(new Error('timeout')), timeout);
    signal?.addEventListener('abort', onAbort, { once: true });
    document.head.appendChild(script);
  });
}

export async function thumbnailWebPBlob(url, signal) {
  const response = await fetch(url, { referrerPolicy: 'no-referrer', credentials: 'omit', signal });
  if (!response.ok) throw new Error('image_failed');
  const source = await response.blob();
  if (!/^image\/(jpeg|png|webp)/.test(source.type) || source.size > 12 * 1024 * 1024) throw new Error('image_failed');
  const image = await createImageBitmap(source);
  try {
    if (image.width * image.height > 32 * 1024 * 1024) throw new Error('image_failed');
    const canvas = document.createElement('canvas');
    canvas.width = image.width; canvas.height = image.height;
    canvas.getContext('2d').drawImage(image, 0, 0);
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/webp', 0.95));
    if (!blob || blob.type !== 'image/webp') throw new Error('webp_unsupported');
    return blob;
  } finally { image.close(); }
}
