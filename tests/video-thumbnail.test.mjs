import test from 'node:test';
import assert from 'node:assert/strict';
import { getBilibiliCover, normalizeBilibiliCover, parseVideoInput } from '../src/utils/videoThumbnail.js';

const payload = { code: 0, data: { bvid: 'BV1GBa66HEC7', pic: 'http://i2.hdslb.com/bfs/archive/cover.jpg', title: 'Example', owner: { name: 'Creator' } } };

test('Bilibili BV/AV URLs, IDs, mobile URLs and share text', () => {
  for (const value of ['BV1GBa66HEC7', 'bv1GBa66HEC7', 'https://www.bilibili.com/video/BV1GBa66HEC7/?p=2&share_source=copy', 'm.bilibili.com/video/BV1GBa66HEC7', '【示例】 https://www.bilibili.com/video/BV1GBa66HEC7/']) {
    assert.deepEqual(parseVideoInput(value), { platform: 'bilibili', kind: 'bvid', id: 'BV1GBa66HEC7' });
  }
  assert.deepEqual(parseVideoInput('AV170001'), { platform: 'bilibili', kind: 'aid', id: '170001' });
  assert.equal(parseVideoInput('https://www.bilibili.com/video/av170001/').kind, 'aid');
  assert.equal(parseVideoInput('https://b23.tv/abcdef?share_source=copy').kind, 'short');
});

test('YouTube watch, short, embed, live and Shorts URLs', () => {
  for (const value of ['https://www.youtube.com/watch?v=jNQXAC9IVRw&t=12', 'https://youtu.be/jNQXAC9IVRw', 'https://www.youtube.com/embed/jNQXAC9IVRw', 'https://m.youtube.com/shorts/jNQXAC9IVRw', 'https://www.youtube.com/live/jNQXAC9IVRw']) assert.equal(parseVideoInput(value).id, 'jNQXAC9IVRw');
});

test('reject lookalike hosts, credentials, invalid IDs and non-video pages', () => {
  for (const value of ['', 'hello', 'BV123', 'av0', 'https://www.bilibili.com.evil.test/video/BV1GBa66HEC7', 'https://evil.test/?bilibili.com/video/BV1GBa66HEC7', 'https://x@www.bilibili.com/video/BV1GBa66HEC7', 'https://www.bilibili.com:8080/video/BV1GBa66HEC7', 'https://www.bilibili.com/video/BV1GBa66HEC7bad', 'https://www.bilibili.com/bangumi/play/ep123', 'https://youtube.com/watch?v=short', 'https://b23.tv/a/b']) assert.equal(parseVideoInput(value), null, value);
});

test('normalize covers to HTTPS and reject unsafe cover URLs', () => {
  assert.equal(normalizeBilibiliCover(payload).url, 'https://i2.hdslb.com/bfs/archive/cover.jpg');
  for (const pic of ['javascript:alert(1)', 'https://i2.hdslb.com.evil.test/bfs/archive/cover.jpg', 'https://evil.test/cover.jpg', 'https://i2.hdslb.com/not-a-cover', 'https://x@i2.hdslb.com/bfs/archive/a.jpg']) assert.throws(() => normalizeBilibiliCover({ ...payload, data: { ...payload.data, pic } }), /image_failed/);
});

test('translate upstream not found and rate-limit response codes', () => {
  assert.throws(() => normalizeBilibiliCover({ code: -404 }), /video_not_found/);
  assert.throws(() => normalizeBilibiliCover({ code: -412 }), /rate_limited/);
  assert.throws(() => normalizeBilibiliCover({ code: 0, data: {} }), /upstream_failed/);
});

test('JSONP lifecycle uses only the official endpoint and cleans up callbacks', async () => {
  const previousDocument = globalThis.document;
  const previousWindow = globalThis.window;
  const scripts = [];
  globalThis.window = {};
  globalThis.document = {
    createElement: () => ({ remove() { this.removed = true; } }),
    head: { appendChild(script) { scripts.push(script); } },
  };
  try {
    const request = getBilibiliCover('BV1GBa66HEC7');
    const url = new URL(scripts[0].src);
    assert.equal(url.origin, 'https://api.bilibili.com');
    assert.equal(url.pathname, '/x/web-interface/view');
    assert.equal(url.searchParams.get('jsonp'), 'jsonp');
    assert.equal(scripts[0].referrerPolicy, 'no-referrer');
    const callback = url.searchParams.get('callback');
    assert.match(callback, /^imghubBili_[a-f0-9]+$/);
    window[callback](payload);
    assert.equal((await request).bvid, payload.data.bvid);
    assert.equal(window[callback], undefined);
    assert.equal(scripts[0].removed, true);

    const avRequest = getBilibiliCover('av170001');
    const avUrl = new URL(scripts[1].src);
    assert.equal(avUrl.searchParams.get('aid'), '170001');
    assert.equal(avUrl.searchParams.has('bvid'), false);
    window[avUrl.searchParams.get('callback')](payload);
    await avRequest;

    const abort = new AbortController();
    const cancelled = getBilibiliCover('BV1GBa66HEC7', { signal: abort.signal });
    abort.abort();
    await assert.rejects(cancelled, { name: 'AbortError' });
    assert.equal(scripts[2].removed, true);
    assert.deepEqual(Object.keys(window), []);

    const timedOut = getBilibiliCover('BV1GBa66HEC7', { timeout: 5 });
    await assert.rejects(timedOut, /timeout/);
    assert.equal(scripts[3].removed, true);
    assert.deepEqual(Object.keys(window), []);

    await assert.rejects(getBilibiliCover('https://b23.tv/abcdef'), /short_link_failed/);
    assert.equal(scripts.length, 4, 'Short URLs must not call an arbitrary proxy');

    // Script errors: a reachable API means risk control, an unreachable one a network failure.
    const previousFetch = globalThis.fetch;
    const probes = [];
    try {
      globalThis.fetch = async (url, options) => { probes.push({ url, options }); return {}; };
      const refused = getBilibiliCover('BV1GBa66HEC7');
      scripts[4].onerror();
      await assert.rejects(refused, /rate_limited/);
      assert.equal(probes[0].url, scripts[4].src);
      assert.equal(probes[0].options.mode, 'no-cors');
      assert.equal(scripts[4].removed, true);
      globalThis.fetch = async () => { throw new TypeError('Failed to fetch'); };
      const offline = getBilibiliCover('BV1GBa66HEC7');
      scripts[5].onerror();
      await assert.rejects(offline, /upstream_failed/);
      assert.deepEqual(Object.keys(window), []);
    } finally { globalThis.fetch = previousFetch; }
  } finally { globalThis.document = previousDocument; globalThis.window = previousWindow; }
});
