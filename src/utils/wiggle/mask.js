/** In-place soft brush: history is saved once per stroke, not per pixel stamp. */
export function stamp(
  mask,
  width,
  height,
  x,
  y,
  radius,
  strength,
  erase = false,
) {
  for (
    let py = Math.max(0, Math.floor(y - radius));
    py < Math.min(height, Math.ceil(y + radius));
    py++
  ) {
    for (
      let px = Math.max(0, Math.floor(x - radius));
      px < Math.min(width, Math.ceil(x + radius));
      px++
    ) {
      const distance = Math.hypot(px - x, py - y) / radius;
      if (distance >= 1) continue;
      const amount = strength * Math.min(1, (1 - distance) * 4);
      const i = py * width + px;
      mask[i] = erase ? mask[i] * (1 - amount) : Math.max(mask[i], amount);
    }
  }
}

/** The custard is movable; its base and porcelain plate remain anchored. */
export function puddingMask(width, height) {
  const mask = new Float32Array(width * height);
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const u = x / width,
        v = y / height;
      const top = ((u - 0.496) / 0.218) ** 2 + ((v - 0.309) / 0.09) ** 2 < 1;
      const half = 0.218 + Math.max(0, v - 0.309) * 0.195;
      const body = v >= 0.309 && v < 0.694 && Math.abs(u - 0.496) < half;
      if (top || body) {
        const edge = (half - Math.abs(u - 0.496)) * 110;
        const anchor = Math.min(1, Math.max(0, (0.694 - v) / 0.065));
        mask[y * width + x] = Math.min(1, Math.max(0, edge)) * anchor;
      }
    }
  return mask;
}

export function coverage(mask) {
  return mask.length
    ? mask.reduce((sum, v) => sum + (v > 0.01 ? 1 : 0), 0) / mask.length
    : 0;
}
