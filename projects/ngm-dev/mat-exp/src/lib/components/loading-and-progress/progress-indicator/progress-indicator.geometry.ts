/** @internal Finite input normalization, shared by rendering and accessibility. */
export function bounded(value: number, fallback: number, min: number, max: number): number {
  return Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
}
/** @internal */
export interface ProgressGeometry {
  circular: boolean;
  width: number;
  height: number;
  thickness: number;
  trackThickness: number;
  amplitude: number;
  wavelength: number;
  gap: number;
}
/** @internal */
export interface ProgressFrame {
  active: string;
  track: string;
}
/**
 * Generates open, round-capped active paths and the complementary inactive track.
 * Gaps include the radii of both stroke caps so gap measures visible empty space.
 * Circular waves use an integral wave count to join without a seam.
 * @internal
 */
export function progressPaths(
  g: ProgressGeometry,
  ranges: readonly (readonly [number, number])[],
  phase = 0,
): ProgressFrame {
  const radius = Math.max(
    0.5,
    (g.width - Math.max(g.thickness, g.trackThickness)) / 2 - g.amplitude,
  );
  const length = g.circular
    ? 2 * Math.PI * radius
    : Math.max(1, g.width - Math.max(g.thickness, g.trackThickness));
  const gap = (g.gap + (g.thickness + g.trackThickness) / 2) / length;
  const waves = g.circular ? Math.max(3, Math.round(length / g.wavelength)) : length / g.wavelength;
  const point = (t: number, active: boolean): string => {
    const wave = active ? g.amplitude * Math.sin(2 * Math.PI * (waves * t - phase)) : 0;
    if (g.circular) {
      const angle = 2 * Math.PI * t - Math.PI / 2;
      return `${(g.width / 2 + (radius + wave) * Math.cos(angle)).toFixed(3)},${(g.height / 2 + (radius + wave) * Math.sin(angle)).toFixed(3)}`;
    }
    return `${(Math.max(g.thickness, g.trackThickness) / 2 + t * length).toFixed(3)},${(g.height / 2 + wave).toFixed(3)}`;
  };
  const path = (start: number, end: number, active: boolean): string => {
    if (end <= start) return '';
    const steps = Math.min(
      4096,
      Math.max(2, Math.ceil((end - start) * Math.max(length / 2, waves * 24))),
    );
    let d = `M${point(start, active)}`;
    for (let i = 1; i <= steps; i++) d += `L${point(start + ((end - start) * i) / steps, active)}`;
    return d;
  };
  const valid = ranges.filter(([a, b]) => b > a);
  const active = valid.map(([a, b]) => path(a, b, true)).join('');
  if (g.circular) {
    if (!valid.length) return { active, track: path(0, 1, false) };
    const [a, b] = valid[0];
    return { active, track: path(b + gap, a + 1 - gap, false) };
  }
  let cursor = 0;
  let track = '';
  for (const [a, b] of [...valid].sort((a, b) => a[0] - b[0])) {
    track += path(cursor, Math.max(cursor, a - gap), false);
    cursor = Math.max(cursor, b + gap);
  }
  track += path(cursor, 1, false);
  return { active, track };
}
