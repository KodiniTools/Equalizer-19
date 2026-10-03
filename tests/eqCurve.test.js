import { test } from 'node:test'
import assert from 'node:assert/strict'
import { smoothPath, buildEqCurve, formatGain } from '../src/utils/eqCurve.js'
import { EQ_PRESETS, EQ_BAND_FREQUENCIES } from '../src/utils/presets.js'

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
