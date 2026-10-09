/**
 * Automatic motion drivers for periodic orbit, sway and hop gestures.
 */

const TWO_PI = Math.PI * 2;

const HOP_BASE = {
  period: 0.625,
  takeoffEnd: 0.14 / 1.6,
  hangEnd: 0.24 / 1.6,
  fallEnd: 0.48 / 1.6,
  compressionEnd: 0.56 / 1.6,
  firstRecoilEnd: 0.66 / 1.6,
  secondRecoilEnd: 0.74 / 1.6,
  settleEnd: 0.84 / 1.6,
};

/** Map intensity 0–100 to amplitude 0–1 (piecewise). */
export function intensityAmplitude(intensity) {
  const t = Number.isFinite(intensity) ? Math.max(0, Math.min(100, intensity)) : 0;
  const keys = [
    { percent: 0, amplitude: 0 },
    { percent: 25, amplitude: 0.3 },
    { percent: 50, amplitude: 0.6 },
    { percent: 80, amplitude: 0.84 },
    { percent: 100, amplitude: 1 },
  ];
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1];
    const b = keys[i];
    if (t > b.percent) continue;
    const u = (t - a.percent) / (b.percent - a.percent);
    return a.amplitude + (b.amplitude - a.amplitude) * u;
  }
  return 1;
}

/** Speed slider 10–100 → period ms (legacy). */
export function speedToPeriodMs(speed) {
  return 1900 - Math.max(10, Math.min(100, speed)) * 15;
}

/** Clamp auto-motion period to purupurumaker range (200–1800ms). */
export function clampPeriodMs(ms) {
  return Math.max(200, Math.min(1800, Number(ms) || 1000));
}

export function presetMotionMode(preset) {
  // Auto-motion is independent of material preset on purupurumaker.com
  if (preset === 'sway' || preset === 'sloshing') return 'sway';
  if (preset === 'bounce' || preset === 'hop') return 'hop';
  if (preset === 'orbit' || preset === 'floating' || preset === 'purupuru') return 'orbit';
  if (preset === 'tremble' || preset === 'trembling') return 'orbit';
  return 'orbit';
}

function hermite(t, t0, t1, y0, y1, m0, m1) {
  const s = t1 - t0;
  const u = (t - t0) / s;
  const u2 = u * u;
  const u3 = u2 * u;
  return (
    (2 * u3 - 3 * u2 + 1) * y0 +
    (u3 - 2 * u2 + u) * s * m0 +
    (-2 * u3 + 3 * u2) * y1 +
    (u3 - u2) * s * m1
  );
}

function hopTiming(period) {
  const t = Math.max(0.2, Math.min(1.8, period));
  if (t < 0.5) {
    const e = t / 0.5;
    const n = hopTiming(0.5);
    return {
      period: t,
      takeoffEnd: n.takeoffEnd * e,
      hangEnd: n.hangEnd * e,
      fallEnd: n.fallEnd * e,
      compressionEnd: n.compressionEnd * e,
      firstRecoilEnd: n.firstRecoilEnd * e,
      secondRecoilEnd: n.secondRecoilEnd * e,
      settleEnd: n.settleEnd * e,
    };
  }
  const n = t - HOP_BASE.period;
  const r = n >= 0 ? n * 0.25 : Math.min(0, n + (HOP_BASE.period - HOP_BASE.settleEnd));
  return {
    period: t,
    takeoffEnd: HOP_BASE.takeoffEnd,
    hangEnd: HOP_BASE.hangEnd + r,
    fallEnd: HOP_BASE.fallEnd + r,
    compressionEnd: HOP_BASE.compressionEnd + r,
    firstRecoilEnd: HOP_BASE.firstRecoilEnd + r,
    secondRecoilEnd: HOP_BASE.secondRecoilEnd + r,
    settleEnd: HOP_BASE.settleEnd + r,
  };
}

function hopY(elapsed, period) {
  const n = hopTiming(period);
  const r = ((elapsed % n.period) + n.period) % n.period;
  const i = 6 * 1.6 * (n.period < 0.5 ? 0.5 / n.period : 1);
  if (r < n.takeoffEnd) {
    const e = r / n.takeoffEnd;
    return -(e ** 3 * (e * (e * 6 - 15) + 10));
  }
  if (r < n.hangEnd) {
    const e = (r - n.takeoffEnd) / (n.hangEnd - n.takeoffEnd);
    return -1 + (1 - Math.cos(e * Math.PI)) * 0.04;
  }
  if (r < n.fallEnd) return hermite(r, n.hangEnd, n.fallEnd, -0.92, 0, 0, i);
  if (r < n.compressionEnd) return hermite(r, n.fallEnd, n.compressionEnd, 0, 0.22, i, 0);
  if (r < n.firstRecoilEnd) return hermite(r, n.compressionEnd, n.firstRecoilEnd, 0.22, -0.065, 0, 0);
  if (r < n.secondRecoilEnd) return hermite(r, n.firstRecoilEnd, n.secondRecoilEnd, -0.065, 0.03, 0, 0);
  if (r < n.settleEnd) return hermite(r, n.secondRecoilEnd, n.settleEnd, 0.03, 0, 0, 0);
  return 0;
}

function hash01(seed, i) {
  let n = (seed ^ Math.imul(i + 1, 2654435761)) >>> 0;
  n ^= n >>> 16;
  n = Math.imul(n, 2146121005);
  n ^= n >>> 15;
  n = Math.imul(n, 2221713035);
  n ^= n >>> 16;
  return n / 4294967296;
}

/**
 * @param {'orbit'|'sway'|'hop'} mode
 * @param {number} elapsedSeconds
 * @param {number} intensity 0–100
 * @param {number} periodMs from speedToPeriodMs
 */
export function automaticAcceleration(mode, elapsedSeconds, intensity, periodMs) {
  if (!mode) return { x: 0, y: 0 };
  const amp = intensityAmplitude(intensity);
  if (amp === 0) return { x: 0, y: 0 };
  const period = Math.max(0.2, Math.min(1.8, periodMs / 1000));
  const phase = (elapsedSeconds / period) * TWO_PI;

  if (mode === 'hop') {
    return {
      x: Math.sin(phase) * (hash01(1347768917, 0) - 0.5) * 0.025 * amp,
      y: hopY(elapsedSeconds, period) * amp,
    };
  }
  if (mode === 'orbit') {
    const e = phase + Math.sin(phase) * 0.22;
    const t = amp * (0.89 + Math.sin(phase * 0.5) * 0.11);
    return { x: Math.cos(e) * t, y: Math.sin(e) * t };
  }
  // sway
  return {
    x: (-Math.tanh(Math.cos(phase) * 2.2) / Math.tanh(2.2)) * amp,
    y: 0,
  };
}
