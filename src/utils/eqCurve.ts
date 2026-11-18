/**
 * Geometry helpers that turn a list of EQ band gains into SVG paths.
 * Pure functions, shared by the landing-page demo and the app's equalizer,
 * so both draw the same curve for the same gains.
 */

export type Point = [number, number]

export interface EqCurveOptions {
  /** SVG width in user units */
  w: number
  /** SVG height in user units */
  h: number
  /** dB that maps to the top/bottom (default 12) */
  maxGain?: number
  /** distance in user units from the 0 dB line to maxGain (default 42 % of h) */
  range?: number
  /**
   * Curve through the band points: 'spline' (Catmull-Rom, may overshoot
   * between a boosted and a flat band) or 'monotone' (Fritsch-Carlson, never
   * overshoots; flat neighbours stay on the 0 dB line). Default 'spline'.
   */
  smoothing?: 'spline' | 'monotone'
  /**
   * x position per band in user units. Without it the band centres are spread
   * evenly across the width; with it (e.g. from logFrequencyX) the curve
   * follows a real frequency axis.
   */
  xs?: readonly number[]
}

export interface EqCurve {
  mid: number
  points: Point[]
  /** open spline through the band centres */
  line: string
  /** the same spline closed against the 0 dB line (fill it clipped above/below mid) */
  area: string
  /** y positions of the ±maxGain/2 and ±maxGain helper lines */
  grid: Array<{ db: number; y: number }>
}

/**
 * Smooth cubic-Bézier path through the points (Catmull-Rom spline).
 * @returns SVG path data, '' for fewer than two points
 */
export function smoothPath(pts: readonly Point[]): string {
  if (pts.length < 2) return ''
  let d = `M${fmt(pts[0][0])},${fmt(pts[0][1])}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] || p2
    const c1x = p1[0] + (p2[0] - p0[0]) / 6
    const c1y = p1[1] + (p2[1] - p0[1]) / 6
    const c2x = p2[0] - (p3[0] - p1[0]) / 6
    const c2y = p2[1] - (p3[1] - p1[1]) / 6
    d += ` C${fmt(c1x)},${fmt(c1y)} ${fmt(c2x)},${fmt(c2y)} ${fmt(p2[0])},${fmt(p2[1])}`
  }
  return d
}

/**
 * Smooth path through the points without overshoot (monotone cubic Hermite
 * interpolation after Fritsch-Carlson, written as cubic Béziers). Points
 * must be sorted by x.
 * @returns SVG path data, '' for fewer than two points
 */
export function monotonePath(pts: readonly Point[]): string {
  const n = pts.length
  if (n < 2) return ''
  const dx: number[] = []
  const slope: number[] = []
  for (let i = 0; i < n - 1; i++) {
    const h = pts[i + 1][0] - pts[i][0]
    dx.push(h)
    slope.push(h > 0 ? (pts[i + 1][1] - pts[i][1]) / h : 0)
  }
  // Tangent per point: 0 at extrema and flats, otherwise the harmonic mean of
  // the neighbouring slopes (which keeps the segment within its endpoints)
  const tangent: number[] = new Array(n).fill(0)
  tangent[0] = slope[0]
  tangent[n - 1] = slope[n - 2]
  for (let i = 1; i < n - 1; i++) {
    const a = slope[i - 1]
    const b = slope[i]
    if (a * b <= 0) {
      tangent[i] = 0
    } else {
      const w1 = 2 * dx[i] + dx[i - 1]
      const w2 = dx[i] + 2 * dx[i - 1]
      tangent[i] = (w1 + w2) / (w1 / a + w2 / b)
    }
  }
  let d = `M${fmt(pts[0][0])},${fmt(pts[0][1])}`
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i]
    const [x0, y0] = pts[i]
    const [x1, y1] = pts[i + 1]
    const c1x = x0 + h / 3
    const c1y = y0 + (tangent[i] * h) / 3
    const c2x = x1 - h / 3
    const c2y = y1 - (tangent[i + 1] * h) / 3
    d += ` C${fmt(c1x)},${fmt(c1y)} ${fmt(c2x)},${fmt(c2y)} ${fmt(x1)},${fmt(y1)}`
  }
  return d
}

/**
 * Build the SVG geometry for an EQ curve.
 * @param gains gain per band in dB
 */
export function buildEqCurve(
  gains: readonly number[],
  { w, h, maxGain = 12, range = h * 0.42, xs, smoothing = 'spline' }: EqCurveOptions
): EqCurve {
  const mid = h / 2
  const step = gains.length ? w / gains.length : w
  const toY = (db: number): number =>
    mid - (Math.max(-maxGain, Math.min(maxGain, db)) / maxGain) * range
  const points: Point[] = gains.map((g, i) => [xs?.[i] ?? i * step + step / 2, toY(g)])
  const line = smoothing === 'monotone' ? monotonePath(points) : smoothPath(points)
  const area = points.length
    ? `${line} L${fmt(points[points.length - 1][0])},${fmt(mid)} L${fmt(points[0][0])},${fmt(mid)} Z`
    : ''
  const grid = [-1, -0.5, 0.5, 1].map((f) => ({ db: f * maxGain, y: toY(f * maxGain) }))
  return { mid, points, line, area, grid }
}

/**
 * Position of a frequency on a logarithmic axis, 0 at `min` and 1 at `max`
 * (clamped). 20 Hz … 20 kHz are the audible defaults.
 */
export function logFrequencyPosition(freq: number, min = 20, max = 20000): number {
  if (!(freq > 0) || !(max > min) || !(min > 0)) return 0
  const pos = Math.log(freq / min) / Math.log(max / min)
  return Math.max(0, Math.min(1, pos))
}

/** x positions of the band frequencies on a log axis between `left` and `right`. */
export function logFrequencyX(
  freqs: readonly number[],
  left: number,
  right: number,
  min = 20,
  max = 20000
): number[] {
  return freqs.map((f) => left + logFrequencyPosition(f, min, max) * (right - left))
}

/** "+3", "−2.5", "0" with a typographic minus sign. */
export function formatGain(db: number): string {
  if (db > 0) return `+${trim(db)}`
  if (db < 0) return `−${trim(-db)}`
  return '0'
}

function trim(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1)
}

function fmt(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1)
}
