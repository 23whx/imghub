/**
 * Wiggle / spring-mesh engine inspired by purupuru-style image wobble tools.
 * Painted mask weights control which mesh vertices move; fixed areas stay anchored.
 */

export const PRESETS = {
  soft: {
    id: 'soft',
    forceScale: 0.55,
    freqX: 1.0,
    freqY: 0.85,
    phaseY: Math.PI / 2,
    damping: 0.88,
    stiffness: 0.18,
  },
  sway: {
    id: 'sway',
    forceScale: 0.9,
    freqX: 1.15,
    freqY: 0.25,
    phaseY: 0,
    damping: 0.9,
    stiffness: 0.16,
  },
  bounce: {
    id: 'bounce',
    forceScale: 1.0,
    freqX: 0.2,
    freqY: 1.35,
    phaseY: 0,
    damping: 0.86,
    stiffness: 0.2,
    bounceY: true,
  },
  tremble: {
    id: 'tremble',
    forceScale: 0.45,
    freqX: 3.2,
    freqY: 2.8,
    phaseY: Math.PI / 3,
    damping: 0.82,
    stiffness: 0.22,
  },
};

/** Fit image into max edge while keeping aspect ratio. */
export function fitSize(width, height, maxEdge = 640) {
  const edge = Math.max(width, height);
  if (edge <= maxEdge) return { width, height, scale: 1 };
  const scale = maxEdge / edge;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
    scale,
  };
}

/** Gaussian-ish box blur on Float32 mask for soft falloff. */
export function blurMask(mask, w, h, radius = 2) {
  if (radius <= 0) return mask.slice();
  const tmp = new Float32Array(w * h);
  const out = new Float32Array(w * h);
  const r = radius;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let sum = 0;
      let count = 0;
      for (let k = -r; k <= r; k++) {
        const xx = Math.min(w - 1, Math.max(0, x + k));
        sum += mask[y * w + xx];
        count++;
      }
      tmp[y * w + x] = sum / count;
    }
  }

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let sum = 0;
      let count = 0;
      for (let k = -r; k <= r; k++) {
        const yy = Math.min(h - 1, Math.max(0, y + k));
        sum += tmp[yy * w + x];
        count++;
      }
      out[y * w + x] = sum / count;
    }
  }
  return out;
}

/**
 * Sample average mask weight for a mesh vertex (normalized 0..1 coords).
 */
function sampleMaskAt(mask, mw, mh, u, v) {
  const x = Math.min(mw - 1, Math.max(0, Math.floor(u * (mw - 1))));
  const y = Math.min(mh - 1, Math.max(0, Math.floor(v * (mh - 1))));
  return mask[y * mw + x] || 0;
}

/**
 * Create a spring mesh over the image.
 * @param {number} cols
 * @param {number} rows
 * @param {number} width
 * @param {number} height
 * @param {Float32Array} mask 0..1 weights, size mw*mh
 * @param {number} mw
 * @param {number} mh
 */
export function createMesh(cols, rows, width, height, mask, mw, mh) {
  const points = [];
  for (let j = 0; j <= rows; j++) {
    for (let i = 0; i <= cols; i++) {
      const u = i / cols;
      const v = j / rows;
      const x = u * (width - 1);
      const y = v * (height - 1);
      const weight = sampleMaskAt(mask, mw, mh, u, v);
      points.push({
        x,
        y,
        ox: x,
        oy: y,
        vx: 0,
        vy: 0,
        weight,
        fixed: weight < 0.04,
      });
    }
  }
  return { cols, rows, width, height, points };
}

/**
 * Step spring simulation one frame.
 * @param {object} mesh
 * @param {number} time seconds
 * @param {object} preset from PRESETS
 * @param {number} strength 0..1
 * @param {number} speed 0.25..2
 * @param {{x:number,y:number}|null} drag world-space pull applied near free points
 * @param {number} dt
 */
export function stepMesh(mesh, time, preset, strength, speed, drag, dt = 1 / 30) {
  const { cols, rows, points } = mesh;
  const stride = cols + 1;
  const p = preset || PRESETS.soft;
  const amp = 14 * strength * p.forceScale;
  const t = time * speed;

  // Restoring + automatic force
  for (let idx = 0; idx < points.length; idx++) {
    const pt = points[idx];
    if (pt.fixed) {
      pt.x = pt.ox;
      pt.y = pt.oy;
      pt.vx = 0;
      pt.vy = 0;
      continue;
    }

    const w = pt.weight;
    let fx = (pt.ox - pt.x) * p.stiffness;
    let fy = (pt.oy - pt.y) * p.stiffness;

    // Spatial variation so mesh doesn't move as a rigid block
    const phase = (pt.ox * 0.02 + pt.oy * 0.015) * w;
    let ax = Math.sin(t * p.freqX * Math.PI * 2 + phase) * amp * w;
    let ay = Math.sin(t * p.freqY * Math.PI * 2 + phase + p.phaseY) * amp * w;
    if (p.bounceY) {
      ay = -Math.abs(Math.sin(t * p.freqY * Math.PI * 2 + phase)) * amp * 1.2 * w;
    }
    fx += ax * 0.08;
    fy += ay * 0.08;

    if (drag) {
      const dx = pt.x - drag.x;
      const dy = pt.y - drag.y;
      const dist = Math.hypot(dx, dy) + 1e-3;
      const influence = Math.exp(-(dist * dist) / (2 * 55 * 55)) * w;
      fx += drag.fx * influence;
      fy += drag.fy * influence;
    }

    pt.vx = (pt.vx + fx) * p.damping;
    pt.vy = (pt.vy + fy) * p.damping;
    pt.x += pt.vx;
    pt.y += pt.vy;
  }

  // Neighbor springs (structural)
  const kNeighbor = 0.35;
  const relax = (a, b) => {
    if (a.fixed && b.fixed) return;
    const restX = a.ox - b.ox;
    const restY = a.oy - b.oy;
    const restLen = Math.hypot(restX, restY) || 1;
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const len = Math.hypot(dx, dy) || 1;
    const diff = ((len - restLen) / len) * 0.5 * kNeighbor;
    const ox = dx * diff;
    const oy = dy * diff;
    if (!a.fixed) {
      a.x -= ox * (0.5 + 0.5 * a.weight);
      a.y -= oy * (0.5 + 0.5 * a.weight);
    }
    if (!b.fixed) {
      b.x += ox * (0.5 + 0.5 * b.weight);
      b.y += oy * (0.5 + 0.5 * b.weight);
    }
  };

  for (let j = 0; j <= rows; j++) {
    for (let i = 0; i <= cols; i++) {
      const idx = j * stride + i;
      if (i < cols) relax(points[idx], points[idx + 1]);
      if (j < rows) relax(points[idx], points[idx + stride]);
    }
  }
}

/**
 * Affine triangle draw: maps source triangle (s0,s1,s2) onto dest (d0,d1,d2).
 */
function drawTexturedTriangle(ctx, img, s0, s1, s2, d0, d1, d2) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(d0.x, d0.y);
  ctx.lineTo(d1.x, d1.y);
  ctx.lineTo(d2.x, d2.y);
  ctx.closePath();
  ctx.clip();

  // Solve affine transform: [x'] = A [x] + b
  const denom =
    s0.x * (s1.y - s2.y) + s1.x * (s2.y - s0.y) + s2.x * (s0.y - s1.y);
  if (Math.abs(denom) < 1e-6) {
    ctx.restore();
    return;
  }

  const m11 =
    (d0.x * (s1.y - s2.y) + d1.x * (s2.y - s0.y) + d2.x * (s0.y - s1.y)) / denom;
  const m12 =
    (d0.x * (s2.x - s1.x) + d1.x * (s0.x - s2.x) + d2.x * (s1.x - s0.x)) / denom;
  const m13 =
    (d0.x * (s1.x * s2.y - s2.x * s1.y) +
      d1.x * (s2.x * s0.y - s0.x * s2.y) +
      d2.x * (s0.x * s1.y - s1.x * s0.y)) /
    denom;
  const m21 =
    (d0.y * (s1.y - s2.y) + d1.y * (s2.y - s0.y) + d2.y * (s0.y - s1.y)) / denom;
  const m22 =
    (d0.y * (s2.x - s1.x) + d1.y * (s0.x - s2.x) + d2.y * (s1.x - s0.x)) / denom;
  const m23 =
    (d0.y * (s1.x * s2.y - s2.x * s1.y) +
      d1.y * (s2.x * s0.y - s0.x * s2.y) +
      d2.y * (s0.x * s1.y - s1.x * s0.y)) /
    denom;

  ctx.setTransform(m11, m21, m12, m22, m13, m23);
  ctx.drawImage(img, 0, 0);
  ctx.restore();
}

/** Render deformed mesh onto canvas context. */
export function renderMesh(ctx, image, mesh) {
  const { cols, rows, points, width, height } = mesh;
  const stride = cols + 1;
  ctx.clearRect(0, 0, width, height);
  // Fill base (static) first for holes
  ctx.drawImage(image, 0, 0, width, height);

  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const i00 = j * stride + i;
      const i10 = i00 + 1;
      const i01 = i00 + stride;
      const i11 = i01 + 1;

      const p00 = points[i00];
      const p10 = points[i10];
      const p01 = points[i01];
      const p11 = points[i11];

      // Skip fully fixed cells (already drawn by base)
      if (p00.fixed && p10.fixed && p01.fixed && p11.fixed) continue;

      const s00 = { x: p00.ox, y: p00.oy };
      const s10 = { x: p10.ox, y: p10.oy };
      const s01 = { x: p01.ox, y: p01.oy };
      const s11 = { x: p11.ox, y: p11.oy };

      const d00 = { x: p00.x, y: p00.y };
      const d10 = { x: p10.x, y: p10.y };
      const d01 = { x: p01.x, y: p01.y };
      const d11 = { x: p11.x, y: p11.y };

      drawTexturedTriangle(ctx, image, s00, s10, s01, d00, d10, d01);
      drawTexturedTriangle(ctx, image, s10, s11, s01, d10, d11, d01);
    }
  }
}

/** Composite content into target aspect ratio with high-quality blurred fill. */
export function compositeToAspect(sourceCanvas, aspect = 'original') {
  const sw = sourceCanvas.width;
  const sh = sourceCanvas.height;
  if (aspect === 'original') {
    const out = document.createElement('canvas');
    out.width = sw;
    out.height = sh;
    const octx = out.getContext('2d');
    octx.imageSmoothingEnabled = true;
    octx.imageSmoothingQuality = 'high';
    octx.drawImage(sourceCanvas, 0, 0);
    return out;
  }

  let ratio = 1;
  if (aspect === '1:1') ratio = 1;
  else if (aspect === '4:5') ratio = 4 / 5;
  else if (aspect === '9:16') ratio = 9 / 16;
  else if (aspect === '16:9') ratio = 16 / 9;

  // Fit source inside target
  let tw;
  let th;
  if (sw / sh > ratio) {
    tw = sw;
    th = Math.round(sw / ratio);
  } else {
    th = sh;
    tw = Math.round(sh * ratio);
  }

  // Cap extreme aspect canvases for mobile memory
  const maxEdge = 1280;
  const edge = Math.max(tw, th);
  if (edge > maxEdge) {
    const s = maxEdge / edge;
    tw = Math.round(tw * s);
    th = Math.round(th * s);
  }

  const out = document.createElement('canvas');
  out.width = tw;
  out.height = th;
  const ctx = out.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Soft blurred cover (draw oversized then soft dim)
  const coverScale = Math.max(tw / sw, th / sh) * 1.08;
  const bw = sw * coverScale;
  const bh = sh * coverScale;
  ctx.filter = 'blur(36px) saturate(1.05) brightness(0.82)';
  ctx.drawImage(sourceCanvas, (tw - bw) / 2, (th - bh) / 2, bw, bh);
  ctx.filter = 'none';

  // Centered contain subject
  const containScale = Math.min(tw / sw, th / sh);
  const cw = sw * containScale;
  const ch = sh * containScale;
  ctx.drawImage(sourceCanvas, (tw - cw) / 2, (th - ch) / 2, cw, ch);
  return out;
}

/** Pick best MediaRecorder mime for video export. */
export function pickVideoMime() {
  const candidates = [
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
    'video/mp4',
  ];
  for (const type of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return '';
}
