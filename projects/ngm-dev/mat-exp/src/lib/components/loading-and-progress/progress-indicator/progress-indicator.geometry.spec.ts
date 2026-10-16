import { bounded, progressPaths, type ProgressGeometry } from './progress-indicator.geometry';
import { indeterminateRanges, registerProgressEases } from './progress-indicator.animation';
const linear: ProgressGeometry = {
  circular: false,
  width: 240,
  height: 10,
  thickness: 4,
  trackThickness: 4,
  amplitude: 3,
  wavelength: 40,
  gap: 4,
};

describe('progress geometry', () => {
  it('keeps visible gaps clear of rounded caps', () => {
    const frame = progressPaths({ ...linear, amplitude: 0 }, [[0, 0.5]]);
    // Active center ends at 120; its cap ends at 122. Track starts at 128,
    // with cap starting at 126: four visible pixels between strokes.
    expect(frame.active).toContain('120.000,5.000');
    expect(frame.track).toMatch(/^M128.000,5.000/);
  });
  it('does not paint a track behind either indeterminate segment', () => {
    const frame = progressPaths(linear, [
      [0.1, 0.3],
      [0.6, 0.8],
    ]);
    expect(frame.active.match(/M/g)).toHaveLength(2);
    expect(frame.track.match(/M/g)).toHaveLength(3);
  });
  it('keeps full circular waves joined at their seam', () => {
    const frame = progressPaths(
      { ...linear, circular: true, width: 48, height: 48, amplitude: 1.6, wavelength: 15 },
      [[0, 1]],
      0.2,
    );
    const points = frame.active.slice(1).split('L');
    expect(points[0]).toBe(points.at(-1));
    expect(frame.track).toBe('');
  });
  it('handles circular rotation beyond a full turn', () => {
    const frame = progressPaths(
      { ...linear, circular: true, width: 48, height: 48 },
      [[3.2, 3.7]],
      0.5,
    );
    expect(frame.active).toMatch(/^M/);
    expect(frame.track).toMatch(/^M/);
    expect(frame.active + frame.track).not.toMatch(/NaN|Infinity/);
  });
  it('moves the wave while preserving progress endpoints in the linear axis', () => {
    const a = progressPaths(linear, [[0, 0.5]], 0);
    const b = progressPaths(linear, [[0, 0.5]], 0.25);
    expect(a.active).not.toBe(b.active);
    expect(a.track).toBe(b.track);
  });
  it('keeps a round-cap dot for even tiny nonzero progress', () => {
    expect(progressPaths(linear, [[0, 0.0000001]]).active).toMatch(/^M/);
  });
  it('clamps numerical ranges', () => {
    expect(bounded(NaN, 4, 1, 10)).toBe(4);
    expect(bounded(-5, 4, 1, 10)).toBe(1);
    expect(bounded(20, 4, 1, 10)).toBe(10);
  });
});

describe('reference motion choreography', () => {
  beforeAll(registerProgressEases);
  it('stages two linear segments over the 1750ms cycle', () => {
    const first = indeterminateRanges(false, 0.2);
    expect(first[0][1]).toBeGreaterThan(0);
    expect(first[0][0]).toBe(0);
    expect(first[1]).toEqual([0, 0]);
    const both = indeterminateRanges(false, 1);
    expect(both[0][1]).toBe(1);
    expect(both[1][1]).toBeGreaterThan(both[1][0]);
    expect(indeterminateRanges(false, 1.75)).toEqual([
      [0, 0],
      [0, 0],
    ]);
  });
  it('grows circular coverage from 10% to 87% and back each six seconds', () => {
    const length = (t: number) => {
      const [a, b] = indeterminateRanges(true, t)[0];
      return b - a;
    };
    expect(length(0)).toBeCloseTo(0.1);
    expect(length(3)).toBeCloseTo(0.87);
    expect(length(6)).toBeCloseTo(0.1);
  });
});
