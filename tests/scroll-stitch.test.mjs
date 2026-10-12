import test from 'node:test';
import assert from 'node:assert/strict';
import { createScrollStitcher, findScroll } from '../src/utils/scrollStitch.js';

const WIDTH = 128;
const VIEW = 300;

// A deterministic "page": rows of text-like blocks separated by blank lines.
function makePage(height, seed = 7) {
  let state = seed;
  const random = () => ((state = (state * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  const page = new Float32Array(WIDTH * height).fill(245);
  for (let y = 0; y < height; y += 18) {
    if (random() < 0.15) continue; // paragraph gap
    const words = 3 + Math.floor(random() * 8);
    let x = 4;
    for (let w = 0; w < words && x < WIDTH - 4; w++) {
      const len = 3 + Math.floor(random() * 14);
      const ink = 20 + Math.floor(random() * 80);
      for (let row = y + 3; row < y + 14 && row < height; row++) {
        for (let col = x; col < Math.min(WIDTH - 4, x + len); col++) page[row * WIDTH + col] = ink + ((row + col) % 5) * 9;
      }
      x += len + 3;
    }
  }
  return page;
}

// Viewport frame at a scroll position, with a fixed header and footer on top.
function frameAt(page, scroll, header = 0, footer = 0) {
  const frame = page.slice((scroll) * WIDTH, (scroll + VIEW) * WIDTH);
  for (let y = 0; y < header; y++) for (let x = 0; x < WIDTH; x++) frame[y * WIDTH + x] = 60 + (x % 7) * 10;
  for (let y = VIEW - footer; y < VIEW; y++) for (let x = 0; x < WIDTH; x++) frame[y * WIDTH + x] = 200 - (x % 3) * 30;
  return frame;
}

const copyRows = (frame, y, rows) => frame.slice(y * WIDTH, (y + rows) * WIDTH);

function stitch(frames, maxHeight = 100000) {
  const stitcher = createScrollStitcher({ height: VIEW, maxHeight, copyRows });
  const statuses = frames.map(frame => stitcher.push(frame, frame, WIDTH).status);
  const pieces = stitcher.result();
  const output = new Float32Array(WIDTH * pieces.reduce((sum, piece) => sum + piece.height, 0));
  let y = 0;
  for (const { piece, height } of pieces) {
    output.set(piece.subarray(0, height * WIDTH), y * WIDTH);
    y += height;
  }
  return { output, height: y, statuses };
}

// Expected long image: header once, every page row, footer once.
function expected(page, pageHeight, header, footer) {
  const full = new Float32Array(WIDTH * (pageHeight + header + footer));
  const top = frameAt(page, 0, header, 0);
  full.set(top.subarray(0, header * WIDTH), 0);
  full.set(page.subarray(0, pageHeight * WIDTH), header * WIDTH);
  const bottom = frameAt(page, 0, 0, footer);
  full.set(bottom.subarray((VIEW - footer) * WIDTH), (header + pageHeight) * WIDTH);
  return full;
}

test('finds the scroll distance between two frames', () => {
  const page = makePage(2000);
  const match = findScroll(frameAt(page, 100), frameAt(page, 173), WIDTH, VIEW);
  assert.equal(match.offset, 73);
  assert.deepEqual(findScroll(frameAt(page, 100), frameAt(page, 100), WIDTH, VIEW), { offset: 0, top: 0, bottom: 0 });
});

test('stitches a scrolled page pixel-exactly without repeating fixed bars', () => {
  // The viewport shows page rows below the header; content scrolls under the bars.
  const header = 40;
  const footer = 30;
  const content = makePage(2400);
  const pageHeight = 1500;
  const steps = [0, 37, 37, 120, 121, 260, 265, 400, 401, 401, 560, 700, 701, 840, 980, 1100, 1200, pageHeight - (VIEW - header - footer)];
  // The visible content area is rows [header, VIEW - footer) of each frame.
  const frames = steps.map(scroll => {
    const frame = new Float32Array(WIDTH * VIEW);
    frame.set(content.subarray(scroll * WIDTH, (scroll + VIEW - header - footer) * WIDTH), header * WIDTH);
    const bars = frameAt(content, 0, header, footer);
    frame.set(bars.subarray(0, header * WIDTH), 0);
    frame.set(bars.subarray((VIEW - footer) * WIDTH), (VIEW - footer) * WIDTH);
    return frame;
  });
  const { output, height, statuses } = stitch(frames);
  assert.ok(!statuses.includes('lost'), statuses.join(','));
  assert.equal(height, header + pageHeight + footer);
  const bars = frameAt(content, 0, header, footer);
  const want = new Float32Array(WIDTH * height);
  want.set(bars.subarray(0, header * WIDTH), 0);
  want.set(content.subarray(0, pageHeight * WIDTH), header * WIDTH);
  want.set(bars.subarray((VIEW - footer) * WIDTH), (header + pageHeight) * WIDTH);
  assert.deepEqual(output, want);
});

test('a page without fixed bars, scrolling back up and stopping', () => {
  const page = makePage(1200, 3);
  const frames = [0, 90, 90, 40, 180, 300, 420, 540, 660, 780, 900].map(scroll => frameAt(page, scroll));
  const { output, height, statuses } = stitch(frames);
  assert.equal(statuses[2], 'still');
  assert.equal(statuses[3], 'lost', 'scrolling up is ignored');
  assert.equal(height, 900 + VIEW);
  assert.deepEqual(output, expected(page, 900 + VIEW, 0, 0));
});

test('scrolling more than a viewport loses track until the user scrolls back', () => {
  const page = makePage(1200, 11);
  const frames = [0, 600, 200].map(scroll => frameAt(page, scroll));
  const { statuses, height } = stitch(frames);
  assert.deepEqual(statuses, ['started', 'lost', 'appended']);
  assert.equal(height, 200 + VIEW);
});

test('blank overlap is not guessed', () => {
  const blank = new Float32Array(WIDTH * 1000).fill(255);
  const match = findScroll(frameAt(blank, 0), frameAt(blank, 50), WIDTH, VIEW);
  assert.deepEqual(match, { offset: 0, top: 0, bottom: 0 });
  const mostlyBlank = blank.slice();
  mostlyBlank.fill(30, 0, WIDTH * 5);
  assert.deepEqual(findScroll(frameAt(mostlyBlank, 0), frameAt(mostlyBlank, 3), WIDTH, VIEW).flat, true);
});

test('stops at the maximum height', () => {
  const page = makePage(3000, 5);
  const frames = [0, 150, 300, 450, 600, 750].map(scroll => frameAt(page, scroll));
  const { height, statuses } = stitch(frames, 700);
  assert.equal(height, 700);
  assert.equal(statuses.at(-1), 'full');
});

test('blended edge rows of a fixed footer do not repeat between strips', () => {
  // Scaled captures blend the footer's top edge with the content scrolling under it.
  const footer = 30;
  const content = makePage(2000, 9);
  const pageHeight = 1200;
  const area = VIEW - footer;
  const frames = [0, 60, 140, 230, 330, 450, 580, 700, 820, 900, pageHeight - area].map(scroll => {
    const frame = new Float32Array(WIDTH * VIEW);
    frame.set(content.subarray(scroll * WIDTH, (scroll + area) * WIDTH), 0);
    for (let y = area; y < VIEW; y++) frame.fill(90, y * WIDTH, (y + 1) * WIDTH);
    for (let x = 0; x < WIDTH; x++) frame[(area - 1) * WIDTH + x] = (frame[(area - 1) * WIDTH + x] + 90) / 2;
    return frame;
  });
  const { output, height } = stitch(frames);
  assert.equal(height, pageHeight + footer);
  // Every content row except the last one (blended in the final frame) is clean.
  for (let y = 0; y < pageHeight - 1; y++) {
    assert.deepEqual(output.subarray(y * WIDTH, (y + 1) * WIDTH), content.subarray(y * WIDTH, (y + 1) * WIDTH), `row ${y}`);
  }
});
