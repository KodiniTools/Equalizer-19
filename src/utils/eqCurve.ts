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
 * Build the SVG geometry for an EQ curve.
 * @param gains gain per band in dB
 */
export function buildEqCurve(
  gains: readonly number[],
  { w, h, maxGain = 12, range = h * 0.42 }: EqCurveOptions
): EqCurve {
  const mid = h / 2
  const step = gains.length ? w / gains.length : w
  const toY = (db: number): number =>
    mid - (Math.max(-maxGain, Math.min(maxGain, db)) / maxGain) * range
  const points: Point[] = gains.map((g, i) => [i * step + step / 2, toY(g)])
  const line = smoothPath(points)
  const area = points.length
    ? `${line} L${fmt(points[points.length - 1][0])},${fmt(mid)} L${fmt(points[0][0])},${fmt(mid)} Z`
    : ''
  const grid = [-1, -0.5, 0.5, 1].map((f) => ({ db: f * maxGain, y: toY(f * maxGain) }))
  return { mid, points, line, area, grid }
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
