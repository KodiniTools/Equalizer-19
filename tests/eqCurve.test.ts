// @vitest-environment node
import { test } from 'vitest'
import assert from 'node:assert/strict'
import {
  smoothPath,
  buildEqCurve,
  formatGain,
  logFrequencyPosition,
  logFrequencyX,
  monotonePath,
} from '../src/utils/eqCurve'
import { EQ_PRESETS, EQ_BAND_FREQUENCIES } from '../src/utils/presets'

test('smoothPath: empty for fewer than two points', () => {
  assert.equal(smoothPath([]), '')
  assert.equal(smoothPath([[1, 2]]), '')
})

test('smoothPath: starts at first point, one cubic segment per interval', () => {
  const d = smoothPath([
    [0, 10],
    [10, 0],
    [20, 10],
  ])
  assert.ok(d.startsWith('M0,10'))
  assert.equal((d.match(/ C/g) || []).length, 2)
  assert.ok(d.endsWith('20,10'))
})

test('buildEqCurve: flat preset sits on the 0 dB line', () => {
  const { mid, points, area } = buildEqCurve(EQ_PRESETS.Flat, { w: 380, h: 110 })
  assert.equal(mid, 55)
  assert.equal(points.length, EQ_BAND_FREQUENCIES.length)
  for (const [, y] of points) assert.equal(y, mid)
  assert.ok(area.endsWith('Z'))
})

test('buildEqCurve: boost goes up, cut goes down, clamped at maxGain', () => {
  const { mid, points } = buildEqCurve([12, -12, 30, -30, 6], { w: 100, h: 100, range: 40 })
  assert.equal(points[0][1], mid - 40)
  assert.equal(points[1][1], mid + 40)
  assert.equal(points[2][1], mid - 40, 'values above maxGain are clamped')
  assert.equal(points[3][1], mid + 40)
  assert.equal(points[4][1], mid - 20)
})

test('buildEqCurve: band centres are evenly spaced across the width', () => {
  const { points } = buildEqCurve(EQ_PRESETS['V-Shape'], { w: 380, h: 110 })
  const step = 380 / 19
  points.forEach(([x], i) => assert.ok(Math.abs(x - (i * step + step / 2)) < 1e-9))
})

test('buildEqCurve: grid lines at ±6 and ±12 dB', () => {
  const { grid } = buildEqCurve([0], { w: 10, h: 100, range: 40 })
  assert.deepEqual(
    grid.map((g) => g.db),
    [-12, -6, 6, 12]
  )
  assert.deepEqual(
    grid.map((g) => g.y),
    [90, 70, 30, 10]
  )
})

test('formatGain', () => {
  assert.equal(formatGain(3), '+3')
  assert.equal(formatGain(-2.5), '−2.5')
  assert.equal(formatGain(0), '0')
})

test('logFrequencyPosition: 0 at 20 Hz, 1 at 20 kHz, geometric midpoint in between', () => {
  assert.equal(logFrequencyPosition(20), 0)
  assert.equal(logFrequencyPosition(20000), 1)
  assert.ok(Math.abs(logFrequencyPosition(Math.sqrt(20 * 20000)) - 0.5) < 1e-9)
  assert.equal(logFrequencyPosition(5), 0, 'clamped below the axis')
  assert.equal(logFrequencyPosition(40000), 1, 'clamped above the axis')
  assert.equal(logFrequencyPosition(0), 0, 'invalid input falls back to 0')
})

test('logFrequencyX: maps the 19 bands monotonically onto the given span', () => {
  const xs = logFrequencyX(EQ_BAND_FREQUENCIES, 10, 110)
  assert.equal(xs.length, 19)
  assert.equal(xs[0], 10)
  assert.ok(Math.abs(xs[18] - 110) < 1e-9)
  for (let i = 1; i < xs.length; i++) assert.ok(xs[i] > xs[i - 1])
})

test('buildEqCurve: explicit xs replace the even spacing', () => {
  const xs = [5, 50, 95]
  const { points } = buildEqCurve([0, 6, 0], { w: 100, h: 100, xs })
  assert.deepEqual(
    points.map(([x]) => x),
    xs
  )
})

/** All y coordinates in a path (control points and end points). */
function pathYs(d: string): number[] {
  return [...d.matchAll(/[-\d.]+,([-\d.]+)/g)].map((m) => Number(m[1]))
}

test('monotonePath: flat points stay flat, one cubic segment per interval', () => {
  const d = monotonePath([
    [0, 50],
    [10, 50],
    [20, 50],
  ])
  assert.ok(d.startsWith('M0,50'))
  assert.equal((d.match(/ C/g) || []).length, 2)
  assert.ok(pathYs(d).every((y) => y === 50))
})

test('monotonePath: never overshoots the neighbouring points', () => {
  const pts: ReadonlyArray<[number, number]> = [
    [0, 50],
    [10, 50],
    [20, 20],
    [30, 50],
    [40, 50],
  ]
  const ys = pathYs(monotonePath(pts))
  assert.ok(ys.every((y) => y >= 20 && y <= 50))
  // Catmull-Rom does overshoot here (above the 50 line next to the peak)
  assert.ok(pathYs(smoothPath(pts)).some((y) => y > 50))
  assert.equal(monotonePath([[1, 1]]), '')
})

test("buildEqCurve: smoothing 'monotone' keeps the flat bands on the 0 dB line", () => {
  const { mid, line } = buildEqCurve([0, 0, 6, 0, 0], { w: 100, h: 100, smoothing: 'monotone' })
  const ys = pathYs(line)
  assert.ok(ys.every((y) => y <= mid))
  assert.ok(ys.filter((y) => y === mid).length >= 8)
})
