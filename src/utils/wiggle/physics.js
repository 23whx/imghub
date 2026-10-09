/**
 * XPBD spring-mesh physics for local image deformation.
 * Coordinates in normalized image space: X spans aspect-corrected width, center at 0.
 */

const EPS = 1e-8;
const DT = 1 / 120;
const ITERATIONS = 4;
const MAX_CATCH_UP = 12;
const MESH_RES = 64;
const A_INPUT = 1.6;

/**
 * Material presets tuned for soft, elastic and floating motion.
 * Keys match site data-preset ids.
 */
export const PRESETS = {
  purupuru: {
    inputStrength: 42,
    stretch: 50,
    bounce: 12,
    damping: 22,
    cohesion: 20,
    gravityDirection: 'down',
    gravityStrength: 0.55,
    variation: 6,
    maxStretch: 62,
  },
  sloshing: {
    inputStrength: 80,
    stretch: 52,
    bounce: 96,
    damping: 7,
    cohesion: 70,
    gravityDirection: 'down',
    gravityStrength: 0.8,
    variation: 0,
    maxStretch: 55,
  },
  trembling: {
    inputStrength: 28,
    stretch: 6,
    bounce: 55,
    damping: 72,
    cohesion: 92,
    gravityDirection: 'down',
    gravityStrength: 0.25,
    variation: 90,
    maxStretch: 18,
  },
  floating: {
    inputStrength: 26,
    stretch: 65,
    bounce: 8,
    damping: 0,
    cohesion: 0,
    gravityDirection: 'none',
    gravityStrength: 0,
    variation: 3,
    maxStretch: 70,
  },
};

/** @deprecated aliases for older UI keys */
PRESETS.soft = PRESETS.purupuru;
PRESETS.sway = PRESETS.sloshing;
PRESETS.bounce = PRESETS.sloshing;
PRESETS.tremble = PRESETS.trembling;

export const PRESET_ORDER = ['purupuru', 'sloshing', 'trembling', 'floating'];

export function getPreset(id) {
  return PRESETS[id] || PRESETS.purupuru;
}

export function cloneParams(p) {
  return { ...p };
}

function clamp(v, a, b) {
  return Math.min(b, Math.max(a, v));
}

function clampVec(v, max) {
  const n = Math.hypot(v.x, v.y);
  if (n <= max || n < EPS) return v;
  const s = max / n;
  return { x: v.x * s, y: v.y * s };
}

function norm01(v) {
  return clamp(v, 0, 100) / 100;
}

/** Soft weight response H(w) from original */
export function weightResponse(w) {
  if (!Number.isFinite(w) || w <= 0) return 0;
  if (w >= 0.8) return Math.min(1, w);
  const t = w / 0.8;
  return w * (0.35 + 0.65 * (t * t * (3 - 2 * t)));
}

export function resolveParameters(p) {
  const stretch = norm01(p.stretch);
  const bounce = norm01(p.bounce);
  const damping = norm01(p.damping);
  const cohesion = norm01(p.cohesion);
  const inputStrength = norm01(p.inputStrength);
  const variation = norm01(p.variation);
  const maxStretch =
    p.maxStretch === undefined
      ? 1.12 + stretch * 0.68
      : 1.02 + norm01(p.maxStretch) * 0.98;

  const secondaryMotionStrength = clamp(
    (bounce * bounce * (1 - damping) * (0.25 + stretch) +
      (1 - cohesion) ** 4 * (1 - damping) -
      0.08) *
      2.1,
    0,
    1
  );
  const elongationStrength =
    stretch *
    stretch *
    (1 - cohesion) ** 1.2 *
    (0.65 + stretch * 1.8) *
    (1 + bounce * 1.4) *
    1.33;
  const tremorStrength = clamp(
    variation * variation * (1 - stretch) * (0.4 + bounce * 0.6) * 20,
    0,
    1
  );

  return {
    inputGain: 0.6 + inputStrength * 4.8,
    distanceCompliance: 2e-7 + stretch * stretch * 9e-4,
    tetherCompliance: 1e-6 + (1 - bounce) ** 2 * 0.0032 + secondaryMotionStrength * 7e-4,
    shapeStrength: 0.01 + cohesion ** 4 * 0.6,
    dampingRate: (0.25 + damping * damping * 18) * (0.04 + cohesion ** 3 * 0.96),
    gravityAcceleration: clamp(p.gravityStrength, 0, 2) * 0.6,
    gravityTargetDisplacement: clamp(p.gravityStrength, 0, 2) * 0.035,
    floatingAcceleration: (3.5 + stretch * 5) * (1 - damping * 0.45),
    fluctuationAcceleration: variation * 0.08,
    maximumStretchRatio: maxStretch,
    maximumDisplacement: 0.16 + stretch * 0.6,
    maximumSpeed: 3.5 + stretch * 7,
    secondaryMotionStrength,
    secondaryFrequency: 1.7 + bounce * 1.1,
    secondaryDampingRatio: 0.025 + damping * 0.18 + cohesion * 0.18,
    secondaryVerticalBias: 0.65 + secondaryMotionStrength * 0.25,
    secondaryPhaseSpread: 0.025 + secondaryMotionStrength * 0.13 + variation * 0.025,
    elongationStrength,
    tremorStrength,
    tremorFrequency: 8 + cohesion * 2 + bounce * 1.5,
  };
}

/** Scale material params by optional intensity 0–100 (legacy helper). */
export function applyIntensity(presetKey, intensity) {
  const base = getPreset(presetKey);
  const r = 0.55 + clamp(intensity, 0, 100) * 0.006;
  return {
    ...base,
    inputStrength: Math.min(100, base.inputStrength * r),
    variation: Math.min(100, base.variation * r),
  };
}

export function meshResolution(width, height, maxRes = MESH_RES) {
  if (width >= height) {
    return { columns: maxRes, rows: Math.max(4, Math.round((maxRes * height) / width)) };
  }
  return { columns: Math.max(4, Math.round((maxRes * width) / height)), rows: maxRes };
}

/**
 * Sample mask at uv (0..1). mask is Float32Array mw*mh, values 0..1
 */
function sampleMask(mask, mw, mh, u, v) {
  if (!mask) return 0;
  const x = clamp(Math.floor(u * (mw - 1)), 0, mw - 1);
  const y = clamp(Math.floor(v * (mh - 1)), 0, mh - 1);
  return mask[y * mw + x] || 0;
}

export function createMesh(imgW, imgH, mask, mw, mh, maxRes = MESH_RES) {
  const { columns, rows } = meshResolution(imgW, imgH, maxRes);
  const stride = columns + 1;
  const count = stride * (rows + 1);
  const restPositions = new Float64Array(count * 2);
  const positions = new Float64Array(count * 2);
  const previousPositions = new Float64Array(count * 2);
  const velocities = new Float64Array(count * 2);
  const uvs = new Float32Array(count * 2);
  const weights = new Float64Array(count);

  const minSide = Math.min(imgW, imgH);
  const sx = imgW / minSide;
  const sy = imgH / minSide;

  for (let j = 0; j <= rows; j++) {
    const v = j / rows;
    for (let i = 0; i <= columns; i++) {
      const u = i / columns;
      const idx = j * stride + i;
      restPositions[idx * 2] = (u - 0.5) * sx;
      restPositions[idx * 2 + 1] = (v - 0.5) * sy;
      uvs[idx * 2] = u;
      uvs[idx * 2 + 1] = v;
      weights[idx] = clamp(sampleMask(mask, mw, mh, u, v), 0, 1);
    }
  }
  positions.set(restPositions);
  previousPositions.set(restPositions);

  const indices = new Uint32Array(columns * rows * 6);
  let k = 0;
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < columns; i++) {
      const n = j * stride + i;
      const r = n + 1;
      const d = n + stride;
      const dr = d + 1;
      indices[k++] = n;
      indices[k++] = r;
      indices[k++] = dr;
      indices[k++] = n;
      indices[k++] = dr;
      indices[k++] = d;
    }
  }

  const inverseMasses = Float64Array.from(weights, (w) => Number(w > 0));

  return {
    columns,
    rows,
    restPositions,
    positions,
    previousPositions,
    velocities,
    uvs,
    indices,
    weights,
    inverseMasses,
    aspect: { sx, sy },
  };
}

function distRest(rest, a, b) {
  return Math.hypot(
    (rest[a * 2] ?? 0) - (rest[b * 2] ?? 0),
    (rest[a * 2 + 1] ?? 0) - (rest[b * 2 + 1] ?? 0)
  );
}

function triArea(px, py, qx, qy, rx, ry) {
  return 0.5 * ((qx - px) * (ry - py) - (qy - py) * (rx - px));
}

export function buildConstraints(mesh, areaScale = 0.08) {
  const distances = [];
  const areas = [];
  const stride = mesh.columns + 1;
  const inv = mesh.inverseMasses;

  const addDist = (a, b) => {
    if ((inv[a] ?? 0) <= 0 && (inv[b] ?? 0) <= 0) return;
    distances.push({ a, b, restLength: distRest(mesh.restPositions, a, b) });
  };

  const addArea = (a, b, c) => {
    if ((inv[a] ?? 0) <= 0 && (inv[b] ?? 0) <= 0 && (inv[c] ?? 0) <= 0) return;
    const area = triArea(
      mesh.restPositions[a * 2],
      mesh.restPositions[a * 2 + 1],
      mesh.restPositions[b * 2],
      mesh.restPositions[b * 2 + 1],
      mesh.restPositions[c * 2],
      mesh.restPositions[c * 2 + 1]
    );
    areas.push({ a, b, c, minimumArea: area * areaScale });
  };

  for (let j = 0; j <= mesh.rows; j++) {
    for (let i = 0; i <= mesh.columns; i++) {
      const id = j * stride + i;
      if (i < mesh.columns) addDist(id, id + 1);
      if (j < mesh.rows) addDist(id, id + stride);
      if (i < mesh.columns && j < mesh.rows) {
        addDist(id, id + stride + 1);
        addDist(id + 1, id + stride);
        const e = id + 1;
        const s = id + stride;
        const se = s + 1;
        addArea(id, e, se);
        addArea(id, se, s);
      }
    }
  }

  return {
    distances,
    areas,
    tetherX: new Float64Array(mesh.weights.length),
    tetherY: new Float64Array(mesh.weights.length),
    distanceLambdas: new Float64Array(distances.length),
    maximumDistanceLambdas: new Float64Array(distances.length),
    areaLambdas: new Float64Array(areas.length),
  };
}

function resetLambdas(c) {
  c.tetherX.fill(0);
  c.tetherY.fill(0);
  c.distanceLambdas.fill(0);
  c.maximumDistanceLambdas.fill(0);
  c.areaLambdas.fill(0);
}

function projectTether(mesh, c, compliance, dt, tetherTargets) {
  const alpha = compliance / (dt * dt);
  for (let i = 0; i < mesh.weights.length; i++) {
    const w = mesh.inverseMasses[i] ?? 0;
    if (w <= 0) continue;
    const project = (axis, lambdas) => {
      const idx = i * 2 + axis;
      const target = (mesh.restPositions[idx] ?? 0) + (tetherTargets[idx] ?? 0);
      const C = (mesh.positions[idx] ?? 0) - target;
      const dl = (-C - alpha * (lambdas[i] ?? 0)) / (w + alpha);
      lambdas[i] = (lambdas[i] ?? 0) + dl;
      mesh.positions[idx] = (mesh.positions[idx] ?? 0) + w * dl;
    };
    project(0, c.tetherX);
    project(1, c.tetherY);
  }
}

function projectDistance(mesh, c, compliance, dt) {
  const alpha = compliance / (dt * dt);
  c.distances.forEach((edge, i) => {
    const { a, b, restLength } = edge;
    const ax = mesh.positions[a * 2] ?? 0;
    const ay = mesh.positions[a * 2 + 1] ?? 0;
    const bx = mesh.positions[b * 2] ?? 0;
    const by = mesh.positions[b * 2 + 1] ?? 0;
    const dx = ax - bx;
    const dy = ay - by;
    const len = Math.hypot(dx, dy);
    if (len < EPS) return;
    const wa = mesh.inverseMasses[a] ?? 0;
    const wb = mesh.inverseMasses[b] ?? 0;
    const wSum = wa + wb + alpha;
    if (wSum < EPS) return;
    const lambda = c.distanceLambdas[i] ?? 0;
    const dl = (-(len - restLength) - alpha * lambda) / wSum;
    c.distanceLambdas[i] = lambda + dl;
    const nx = dx / len;
    const ny = dy / len;
    mesh.positions[a * 2] = ax + wa * nx * dl;
    mesh.positions[a * 2 + 1] = ay + wa * ny * dl;
    mesh.positions[b * 2] = bx - wb * nx * dl;
    mesh.positions[b * 2 + 1] = by - wb * ny * dl;
  });
}

function projectMaxStretch(mesh, c, maxRatio, compliance, dt) {
  const alpha = compliance / (dt * dt);
  c.distances.forEach((edge, i) => {
    const { a, b, restLength } = edge;
    const ax = mesh.positions[a * 2] ?? 0;
    const ay = mesh.positions[a * 2 + 1] ?? 0;
    const bx = mesh.positions[b * 2] ?? 0;
    const by = mesh.positions[b * 2 + 1] ?? 0;
    const dx = ax - bx;
    const dy = ay - by;
    const len = Math.hypot(dx, dy);
    if (len < EPS) return;
    const gap = restLength * maxRatio - len;
    const wa = mesh.inverseMasses[a] ?? 0;
    const wb = mesh.inverseMasses[b] ?? 0;
    const wSum = wa + wb + alpha;
    const lambda = c.maximumDistanceLambdas[i] ?? 0;
    if (wSum < EPS) return;
    if (gap >= 0 && lambda <= 0) return;
    const newLambda = Math.max(0, lambda + (-gap - alpha * lambda) / wSum);
    const dl = newLambda - lambda;
    c.maximumDistanceLambdas[i] = newLambda;
    const nx = dx / len;
    const ny = dy / len;
    // The gradient of maxLength - length points inward. Pull stretched
    // endpoints together; the opposite sign injects energy and tears the mesh.
    mesh.positions[a * 2] = ax - wa * nx * dl;
    mesh.positions[a * 2 + 1] = ay - wa * ny * dl;
    mesh.positions[b * 2] = bx + wb * nx * dl;
    mesh.positions[b * 2 + 1] = by + wb * ny * dl;
  });
}

function projectArea(mesh, c, compliance, dt) {
  const alpha = compliance / (dt * dt);
  c.areas.forEach((tri, i) => {
    const { a, b, c: cc, minimumArea } = tri;
    const ax = mesh.positions[a * 2] ?? 0;
    const ay = mesh.positions[a * 2 + 1] ?? 0;
    const bx = mesh.positions[b * 2] ?? 0;
    const by = mesh.positions[b * 2 + 1] ?? 0;
    const cx = mesh.positions[cc * 2] ?? 0;
    const cy = mesh.positions[cc * 2 + 1] ?? 0;
    const area = triArea(ax, ay, bx, by, cx, cy);
    const C = area - minimumArea;
    const lambda = c.areaLambdas[i] ?? 0;
    if (C >= 0 && lambda <= 0) return;

    // gradients of 0.5*((b-a)×(c-a))
    const g = [
      0.5 * (by - cy),
      0.5 * (cx - bx),
      0.5 * (cy - ay),
      0.5 * (ax - cx),
      0.5 * (ay - by),
      0.5 * (bx - ax),
    ];
    const masses = [mesh.inverseMasses[a] ?? 0, mesh.inverseMasses[b] ?? 0, mesh.inverseMasses[cc] ?? 0];
    let wSum = alpha;
    for (let k = 0; k < 3; k++) {
      wSum += masses[k] * (g[k * 2] ** 2 + g[k * 2 + 1] ** 2);
    }
    if (wSum < EPS) return;
    const newLambda = Math.max(0, lambda + (-C - alpha * lambda) / wSum);
    const dl = newLambda - lambda;
    c.areaLambdas[i] = newLambda;
    const ids = [a, b, cc];
    for (let k = 0; k < 3; k++) {
      const w = masses[k];
      mesh.positions[ids[k] * 2] += w * g[k * 2] * dl;
      mesh.positions[ids[k] * 2 + 1] += w * g[k * 2 + 1] * dl;
    }
  });
}

function gravityVec(dir, mag) {
  if (dir === 'down') return { x: 0, y: mag };
  if (dir === 'up') return { x: 0, y: -mag };
  if (dir === 'left') return { x: -mag, y: 0 };
  if (dir === 'right') return { x: mag, y: 0 };
  return { x: 0, y: 0 };
}

/** Gravity kick envelope at start */
function gravityKick(elapsed) {
  return 1 + 22 * Math.exp(-Math.max(0, elapsed) * 5);
}

class Mulberry {
  constructor(seed = 1347768917) {
    this.state = seed >>> 0;
  }
  nextSigned() {
    this.state = (this.state + 1831565813) >>> 0;
    let e = this.state;
    e = Math.imul(e ^ (e >>> 15), e | 1);
    e ^= e + Math.imul(e ^ (e >>> 7), e | 61);
    return (((e ^ (e >>> 14)) >>> 0) / 4294967296) * 2 - 1;
  }
}

export class WiggleSimulator {
  /**
   * @param {object} [options]
   * @param {number} [options.meshRes] mesh resolution on long edge (default 64)
   */
  constructor(imgW, imgH, mask, mw, mh, params, options = {}) {
    const meshRes = options.meshRes || MESH_RES;
    this.mesh = createMesh(imgW, imgH, mask, mw, mh, meshRes);
    this.constraints = buildConstraints(this.mesh);
    this.parameters = { ...params };
    this.resolved = resolveParameters(params);
    this.random = new Mulberry(1347768917);
    this.gravityElapsed = 0;
    this.tick = 0;
    this.secondaryOffsets = new Float64Array(this.mesh.positions.length);
    this.secondaryVelocities = new Float64Array(this.mesh.positions.length);
    this.tetherTargets = new Float64Array(this.mesh.positions.length);
    this.spatial = new Float64Array(this.mesh.weights.length);
    this.elongX = new Float64Array(this.mesh.weights.length);
    this.elongY = new Float64Array(this.mesh.weights.length);
    this.initSpatial();
    this.frame = { position: { x: 0, y: 0 }, velocity: { x: 0, y: 0 }, acceleration: { x: 0, y: 0 } };
    this.accumulator = 0;
  }

  initSpatial() {
    for (let i = 0; i < this.mesh.weights.length; i++) {
      const x = this.mesh.restPositions[i * 2] ?? 0;
      const y = this.mesh.restPositions[i * 2 + 1] ?? 0;
      this.spatial[i] = 0.55 + 0.45 * Math.sin(x * 7.1 + y * 5.3);
      this.elongX[i] = Math.sin(x * 4.2 + y * 1.7);
      this.elongY[i] = Math.cos(x * 2.3 - y * 5.1);
    }
  }

  setParameters(params) {
    this.parameters = { ...params };
    this.resolved = resolveParameters(params);
  }

  rebuildMask(mask, mw, mh) {
    const imgAspect = this.mesh.aspect;
    // rebuild weights on same topology using rest UV
    for (let i = 0; i < this.mesh.weights.length; i++) {
      const u = this.mesh.uvs[i * 2];
      const v = this.mesh.uvs[i * 2 + 1];
      const w = clamp(sampleMask(mask, mw, mh, u, v), 0, 1);
      this.mesh.weights[i] = w;
      this.mesh.inverseMasses[i] = Number(w > 0);
    }
    this.constraints = buildConstraints(this.mesh);
    // reset free vertices gently toward rest if newly fixed
    for (let i = 0; i < this.mesh.weights.length; i++) {
      if (this.mesh.inverseMasses[i] <= 0) {
        this.mesh.positions[i * 2] = this.mesh.restPositions[i * 2];
        this.mesh.positions[i * 2 + 1] = this.mesh.restPositions[i * 2 + 1];
        this.mesh.velocities[i * 2] = 0;
        this.mesh.velocities[i * 2 + 1] = 0;
      }
    }
    void imgAspect;
  }

  clampVertex(i) {
    const r = this.resolved;
    const ox = this.mesh.restPositions[i * 2] ?? 0;
    const oy = this.mesh.restPositions[i * 2 + 1] ?? 0;
    const d = clampVec(
      {
        x: (this.mesh.positions[i * 2] ?? 0) - ox,
        y: (this.mesh.positions[i * 2 + 1] ?? 0) - oy,
      },
      r.maximumDisplacement
    );
    this.mesh.positions[i * 2] = ox + d.x;
    this.mesh.positions[i * 2 + 1] = oy + d.y;
  }

  stepSecondary(i, drive, dt) {
    const r = this.resolved;
    const strength = r.secondaryMotionStrength;
    const ix = i * 2;
    if (strength <= 0) {
      this.secondaryOffsets[ix] = 0;
      this.secondaryOffsets[ix + 1] = 0;
      this.secondaryVelocities[ix] = 0;
      this.secondaryVelocities[ix + 1] = 0;
      return { x: 0, y: 0 };
    }
    const rx = this.mesh.restPositions[ix] ?? 0;
    const ry = this.mesh.restPositions[ix + 1] ?? 0;
    const phase = Math.sin(rx * 8.37 + ry * 5.19);
    const freq = r.secondaryFrequency * (1 + phase * r.secondaryPhaseSpread);
    const targetX = drive.x * 0.35 * strength;
    const targetY = drive.y * r.secondaryVerticalBias * strength;
    // spring-damper toward oscillating target
    const ox = this.secondaryOffsets[ix] ?? 0;
    const oy = this.secondaryOffsets[ix + 1] ?? 0;
    const vx = this.secondaryVelocities[ix] ?? 0;
    const vy = this.secondaryVelocities[ix + 1] ?? 0;
    const osc = Math.sin(this.tick * DT * freq * Math.PI * 2);
    const tx = targetX * osc;
    const ty = targetY * Math.cos(this.tick * DT * freq * Math.PI * 2 * 0.9);
    const ax = (tx - ox) * 40 - vx * (8 + r.secondaryDampingRatio * 40);
    const ay = (ty - oy) * 40 - vy * (8 + r.secondaryDampingRatio * 40);
    const nvx = vx + ax * dt;
    const nvy = vy + ay * dt;
    const nox = ox + nvx * dt;
    const noy = oy + nvy * dt;
    this.secondaryVelocities[ix] = nvx;
    this.secondaryVelocities[ix + 1] = nvy;
    this.secondaryOffsets[ix] = nox;
    this.secondaryOffsets[ix + 1] = noy;
    return { x: nox * 12, y: noy * 12 };
  }

  /**
   * Fixed timestep substep.
   * @param {object} input { automaticAcceleration, localAcceleration, frameTarget, frameDragging }
   */
  substep(input) {
    const mesh = this.mesh;
    const r = this.resolved;
    const dt = DT;
    resetLambdas(this.constraints);

    // Frame spring (drag)
    const frame = this.frame;
    const travelLimit = input.frameDragging ? 0.16 : 0.08;
    const target = input.frameDragging
      ? clampVec(input.frameTarget || { x: 0, y: 0 }, travelLimit)
      : { x: 0, y: 0 };
    const blend = 1 - Math.exp(-(input.frameDragging ? 35 : 70) * dt);
    const nextPos = {
      x: frame.position.x + (target.x - frame.position.x) * blend,
      y: frame.position.y + (target.y - frame.position.y) * blend,
    };
    const nextVel = {
      x: (nextPos.x - frame.position.x) / dt,
      y: (nextPos.y - frame.position.y) / dt,
    };
    frame.acceleration = {
      x: (nextVel.x - frame.velocity.x) / dt,
      y: (nextVel.y - frame.velocity.y) / dt,
    };
    frame.velocity = nextVel;
    frame.position = nextPos;

    const gForce = gravityVec(
      this.parameters.gravityDirection,
      r.gravityAcceleration * gravityKick(this.gravityElapsed)
    );
    const gTarget = gravityVec(this.parameters.gravityDirection, r.gravityTargetDisplacement);
    const local = clampVec(input.localAcceleration || { x: 0, y: 0 }, 8);
    const auto = clampVec(input.automaticAcceleration || { x: 0, y: 0 }, 1);
    const framePull = {
      x: -frame.acceleration.x * r.inputGain,
      y: -frame.acceleration.y * r.inputGain,
    };
    const combinedInput = clampVec(
      {
        x: local.x * r.inputGain + framePull.x,
        y: local.y * r.inputGain + framePull.y,
      },
      24
    );
    const secScale = 1 - r.secondaryMotionStrength * 0.52;
    const inputGainA = r.inputGain * A_INPUT;

    for (let i = 0; i < mesh.weights.length; i++) {
      const ix = i * 2;
      const invMass = mesh.inverseMasses[i] ?? 0;
      mesh.previousPositions[ix] = mesh.positions[ix] ?? 0;
      mesh.previousPositions[ix + 1] = mesh.positions[ix + 1] ?? 0;

      if (invMass <= 0) {
        mesh.positions[ix] = mesh.restPositions[ix] ?? 0;
        mesh.positions[ix + 1] = mesh.restPositions[ix + 1] ?? 0;
        mesh.velocities[ix] = 0;
        mesh.velocities[ix + 1] = 0;
        continue;
      }

      const wr = weightResponse(mesh.weights[i] ?? 0);
      const tremScale = (1 - r.tremorStrength) ** 2;
      const flucX = this.random.nextSigned() * r.fluctuationAcceleration * tremScale;
      const flucY = this.random.nextSigned() * r.fluctuationAcceleration * tremScale;
      const spatial = this.spatial[i] ?? 1;
      const autoScaled = { x: auto.x * inputGainA * spatial, y: auto.y * inputGainA * spatial };
      const drive = { x: combinedInput.x + auto.x * inputGainA, y: combinedInput.y + auto.y * inputGainA };
      const elong = {
        x: drive.x * r.elongationStrength * 1.8 * (this.elongX[i] ?? 0),
        y: drive.y * r.elongationStrength * 1.8 * (this.elongY[i] ?? 0),
      };
      const tremorPhase = this.tick * dt * r.tremorFrequency * Math.PI * 2 + i * 0.37;
      const tremor = {
        x: Math.sin(tremorPhase) * r.tremorStrength * 2.5,
        y: Math.cos(tremorPhase * 1.13) * r.tremorStrength * 2.5,
      };
      const tetherBias = {
        x: (drive.x / 24) * r.elongationStrength * 0.04 * (this.elongX[i] ?? 0) * wr,
        y: (drive.y / 24) * r.elongationStrength * 0.04 * (this.elongY[i] ?? 0) * wr,
      };
      this.tetherTargets[ix] = tremor.x * 0.01 + tetherBias.x + gTarget.x * wr;
      this.tetherTargets[ix + 1] = tremor.y * 0.01 + tetherBias.y + gTarget.y * wr;

      const forceBase = clampVec(
        {
          x: (combinedInput.x + autoScaled.x + elong.x + tremor.x) * wr,
          y: (combinedInput.y + autoScaled.y + elong.y + tremor.y) * wr,
        },
        24
      );
      const secondary = this.stepSecondary(i, forceBase, dt);
      const ax =
        (gForce.x + flucX) * wr + forceBase.x * secScale + secondary.x;
      const ay =
        (gForce.y + flucY) * wr + forceBase.y * secScale + secondary.y;

      const vel = clampVec(
        {
          x: (mesh.velocities[ix] ?? 0) + ax * invMass * dt,
          y: (mesh.velocities[ix + 1] ?? 0) + ay * invMass * dt,
        },
        r.maximumSpeed
      );
      mesh.velocities[ix] = vel.x;
      mesh.velocities[ix + 1] = vel.y;
      mesh.positions[ix] = (mesh.positions[ix] ?? 0) + vel.x * dt;
      mesh.positions[ix + 1] = (mesh.positions[ix + 1] ?? 0) + vel.y * dt;
      this.clampVertex(i);
    }

    for (let it = 0; it < ITERATIONS; it++) {
      projectTether(mesh, this.constraints, r.tetherCompliance, dt, this.tetherTargets);
      projectDistance(mesh, this.constraints, r.distanceCompliance, dt);
      projectMaxStretch(mesh, this.constraints, r.maximumStretchRatio, 1e-9, dt);
      projectArea(mesh, this.constraints, 1e-10, dt);
    }
    projectMaxStretch(mesh, this.constraints, r.maximumStretchRatio, 0, dt);
    projectArea(mesh, this.constraints, 0, dt);

    const damp = Math.exp(-r.dampingRate * dt);
    for (let i = 0; i < mesh.weights.length; i++) {
      const ix = i * 2;
      if ((mesh.inverseMasses[i] ?? 0) <= 0) {
        mesh.positions[ix] = mesh.restPositions[ix] ?? 0;
        mesh.positions[ix + 1] = mesh.restPositions[ix + 1] ?? 0;
        mesh.velocities[ix] = 0;
        mesh.velocities[ix + 1] = 0;
        continue;
      }
      this.clampVertex(i);
      const vel = clampVec(
        {
          x: (((mesh.positions[ix] ?? 0) - (mesh.previousPositions[ix] ?? 0)) / dt) * damp,
          y: (((mesh.positions[ix + 1] ?? 0) - (mesh.previousPositions[ix + 1] ?? 0)) / dt) * damp,
        },
        r.maximumSpeed
      );
      mesh.velocities[ix] = vel.x;
      mesh.velocities[ix + 1] = vel.y;
    }

    this.gravityElapsed += dt;
    this.tick += 1;
  }

  /** Advance by real delta seconds with fixed substeps. */
  advance(dt, input) {
    this.accumulator += Math.min(0.1, Math.max(0, dt));
    let steps = 0;
    while (this.accumulator >= DT && steps < MAX_CATCH_UP) {
      this.substep(input);
      this.accumulator -= DT;
      steps += 1;
    }
    if (steps === MAX_CATCH_UP) this.accumulator = 0;
  }

  getFrameOffset() {
    return { ...this.frame.position };
  }

  /** Export positions as clip-space friendly arrays for renderer */
  getRenderData() {
    return {
      positions: this.mesh.positions,
      uvs: this.mesh.uvs,
      indices: this.mesh.indices,
      restPositions: this.mesh.restPositions,
      aspect: this.mesh.aspect,
      frame: this.getFrameOffset(),
      vertexCount: this.mesh.weights.length,
    };
  }
}
