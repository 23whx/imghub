// Scrolling screenshot: compare consecutive frames of a captured tab to find how
// far the page scrolled, then append only the newly revealed rows. Headers and
// footers that stay fixed while scrolling are detected so they appear only once.
// Everything runs locally on frames from getDisplayMedia; no server is involved.

// Frames are reduced to this many grayscale columns (full height) for matching.
export const SIGNATURE_WIDTH = 128;
const SAME_ROW = 1.5; // mean luma difference below which two rows count as identical
const MATCH_LIMIT = 6; // highest mean luma difference accepted for a scroll match
const FLAT_LIMIT = 1; // overlap below this luma deviation is blank and cannot be matched
const MAX_BAND = 0.4; // fixed header/footer can take at most this share of the frame
const BAND_MARGIN = 2; // rows added to a fixed band: its edge row is blended with the scrolling content

export function lumaSignature(rgba, width, height) {
  const signature = new Float32Array(width * height);
  for (let i = 0, j = 0; j < signature.length; i += 4, j++) {
    signature[j] = rgba[i] * 0.299 + rgba[i + 1] * 0.587 + rgba[i + 2] * 0.114;
  }
  return signature;
}

function rowDiff(a, rowA, b, rowB, width) {
  let sum = 0;
  const offsetA = rowA * width;
  const offsetB = rowB * width;
  for (let x = 0; x < width; x++) sum += Math.abs(a[offsetA + x] - b[offsetB + x]);
  return sum / width;
}

function deviation(signature, width, fromRow, toRow) {
  let sum = 0;
  let squares = 0;
  const start = fromRow * width;
  const end = toRow * width;
  for (let i = start; i < end; i++) {
    sum += signature[i];
    squares += signature[i] * signature[i];
  }
  const count = end - start || 1;
  const mean = sum / count;
  return Math.sqrt(Math.max(0, squares / count - mean * mean));
}

// Returns { offset, top, bottom } where offset is how many rows the content moved
// up, and top/bottom are the fixed bands; { offset: 0 } when nothing moved,
// { flat: true } when the overlap is blank, or null when no scroll matches.
export function findScroll(previous, next, width, height, hint = 0) {
  const maxBand = Math.floor(height * MAX_BAND);
  let top = 0;
  while (top < height && rowDiff(previous, top, next, top, width) < SAME_ROW) top++;
  if (top === height) return { offset: 0, top: 0, bottom: 0 };
  top = Math.min(top && top + BAND_MARGIN, maxBand);
  let bottom = 0;
  while (bottom < maxBand && rowDiff(previous, height - 1 - bottom, next, height - 1 - bottom, width) < SAME_ROW) bottom++;
  bottom = Math.min(bottom && bottom + BAND_MARGIN, maxBand);

  const regionEnd = height - bottom;
  const minOverlap = Math.max(24, Math.round((regionEnd - top) * 0.2));
  const maxOffset = regionEnd - top - minOverlap;
  if (maxOffset < 1) return null;

  // Try the previous scroll distance first so the early exit kicks in sooner.
  const candidates = [];
  if (hint >= 1 && hint <= maxOffset) candidates.push(hint);
  for (let offset = 1; offset <= maxOffset; offset++) candidates.push(offset);

  let best = 0;
  let bestMean = MATCH_LIMIT;
  for (const offset of candidates) {
    // Every second row is enough to tell offsets apart and halves the work.
    const count = Math.ceil((regionEnd - offset - top) / 2);
    const budget = bestMean * count;
    let sum = 0;
    let rows = 0;
    for (let row = top; row < regionEnd - offset && sum < budget; row += 2) {
      sum += rowDiff(next, row, previous, row + offset, width);
      rows++;
    }
    if (rows === count && sum < budget) {
      best = offset;
      bestMean = sum / count;
    }
  }
  if (!best) return null;
  if (deviation(previous, width, top + best, regionEnd) < FLAT_LIMIT) return { flat: true };
  return { offset: best, top, bottom };
}

// Keeps the pieces of the long image. copyRows(frame, y, rows) must return a
// copy of those rows, because the caller reuses its frame buffer.
export function createScrollStitcher({ height, maxHeight, copyRows }) {
  let previous = null;
  let first = null;
  let firstEnd = null; // rows of the first frame kept above the strips
  let endRow = 0; // row in the latest frame where stitched content ends
  let hint = 0;
  let footer = null;
  let stitched = 0;
  let full = false;
  const strips = [];
  const total = () => (firstEnd === null ? height : stitched + (footer?.height || 0));

  return {
    push(frame, signature, width) {
      if (full) return { status: 'full', height: total() };
      if (!previous) {
        previous = signature;
        first = copyRows(frame, 0, height);
        return { status: 'started', height: total() };
      }
      const match = findScroll(previous, signature, width, height, hint);
      if (!match) return { status: 'lost', height: total() };
      if (match.flat) return { status: 'flat', height: total() };
      if (match.offset === 0) return { status: 'still', height: total() };

      if (firstEnd === null) {
        firstEnd = height - match.bottom;
        endRow = firstEnd;
        stitched = firstEnd;
      }
      const from = endRow - match.offset;
      let to = Math.max(from, height - match.bottom);
      if (stitched + (to - from) + (height - to) > maxHeight) {
        // Stop at the size limit; the footer would no longer join the content.
        to = from + Math.max(0, maxHeight - stitched);
        full = true;
      }
      if (to > from) {
        strips.push({ piece: copyRows(frame, from, to - from), height: to - from });
        stitched += to - from;
      }
      footer = !full && to < height ? { piece: copyRows(frame, to, height - to), height: height - to } : null;
      endRow = to;
      previous = signature;
      hint = match.offset;
      return { status: full ? 'full' : 'appended', height: total() };
    },
    // Pieces in order; draw rows [0, height) of each one below the previous.
    result() {
      if (!first) return [];
      if (firstEnd === null) return [{ piece: first, height }];
      return [{ piece: first, height: firstEnd }, ...strips, ...(footer ? [footer] : [])];
    },
  };
}

// Reads frames from a display-capture stream and stitches them until stop() is
// called or the shared tab stops. `result` resolves to a PNG blob.
export function startScrollCapture(stream, { onUpdate, maxPixels = 120_000_000 } = {}) {
  const track = stream.getVideoTracks()[0];
  let stitcher = null;
  let frameCanvas;
  let signatureContext;
  let frameWidth = 0;
  let frameHeight = 0;
  let stopped = false;
  let finished;
  const done = new Promise(resolve => { finished = resolve; });
  const canvas = (width, height) => Object.assign(document.createElement('canvas'), { width, height });

  const handle = (source, width, height) => {
    if (stopped || !width || !height) return;
    if (!stitcher) {
      frameWidth = width;
      frameHeight = height;
      frameCanvas = canvas(width, height);
      signatureContext = canvas(SIGNATURE_WIDTH, height).getContext('2d', { willReadFrequently: true });
      stitcher = createScrollStitcher({
        height,
        maxHeight: Math.min(32000, Math.floor(maxPixels / width)),
        copyRows: (frame, y, rows) => {
          const piece = canvas(width, rows);
          piece.getContext('2d').drawImage(frame, 0, y, width, rows, 0, 0, width, rows);
          return piece;
        },
      });
    }
    if (width !== frameWidth || height !== frameHeight) {
      onUpdate?.({ status: 'resized', height: 0 });
      return;
    }
    frameCanvas.getContext('2d').drawImage(source, 0, 0, width, height);
    signatureContext.drawImage(frameCanvas, 0, 0, width, height, 0, 0, SIGNATURE_WIDTH, height);
    const pixels = signatureContext.getImageData(0, 0, SIGNATURE_WIDTH, height).data;
    const update = stitcher.push(frameCanvas, lumaSignature(pixels, SIGNATURE_WIDTH, height), SIGNATURE_WIDTH);
    onUpdate?.(update);
    if (update.status === 'full') stop();
  };

  let cleanup;
  if (typeof MediaStreamTrackProcessor === 'function') {
    // Frames arrive as stream reads, which keep running while this tab is in the
    // background (timers would be throttled to once per second there).
    const reader = new MediaStreamTrackProcessor({ track }).readable.getReader();
    cleanup = () => reader.cancel().catch(() => {});
    (async () => {
      while (!stopped) {
        const { value: frame, done: ended } = await reader.read().catch(() => ({ done: true }));
        if (ended) break;
        try { handle(frame, frame.displayWidth, frame.displayHeight); } finally { frame.close(); }
      }
      stop();
    })();
  } else {
    const video = Object.assign(document.createElement('video'), { muted: true, srcObject: stream });
    video.play().catch(() => {});
    const timer = setInterval(() => handle(video, video.videoWidth, video.videoHeight), 100);
    cleanup = () => { clearInterval(timer); video.srcObject = null; };
  }

  function stop() {
    if (stopped) return;
    stopped = true;
    cleanup();
    stream.getTracks().forEach(t => t.stop());
    finished();
  }
  track.addEventListener('ended', stop);

  const result = done.then(() => {
    const pieces = stitcher?.result() || [];
    if (!pieces.length) throw new Error('no_frames');
    const output = canvas(frameWidth, pieces.reduce((sum, piece) => sum + piece.height, 0));
    const context = output.getContext('2d');
    let y = 0;
    for (const { piece, height } of pieces) {
      context.drawImage(piece, 0, 0, frameWidth, height, 0, y, frameWidth, height);
      y += height;
    }
    return new Promise((resolve, reject) => output.toBlob(blob => (blob ? resolve(blob) : reject(new Error('encode_failed'))), 'image/png'));
  });
  return { stop, result };
}
