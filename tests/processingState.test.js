import { test, mock } from 'node:test'
import assert from 'node:assert/strict'
import { useAudioEngine } from '../src/composables/useAudioEngine.js'
import { DEFAULT_DYNAMICS, EQ_BAND_FREQUENCIES } from '../src/utils/presets.js'
import {
  captureProcessingState,
  applyProcessingState,
  processingStatesEqual,
  describeProcessingChange,
  canMergeProcessingChanges,
} from '../src/utils/processingState.js'

mock.method(console, 'log', () => {})

// The engine works without an AudioContext: settings are kept in reactive
// state and only forwarded to nodes once they exist.
function engine() {
  return useAudioEngine()
}

test('captureProcessingState reads the engine defaults', () => {
  const state = captureProcessingState(engine())
  assert.equal(state.eqGains.length, EQ_BAND_FREQUENCIES.length)
  assert.ok(state.eqGains.every((g) => g === 0))
  assert.equal(state.eqBypass, false)
  assert.deepEqual(state.dynamics, { ...DEFAULT_DYNAMICS })
  assert.equal(state.dynamicsEnabled, true)
})

test('snapshots are detached from the engine', () => {
  const e = engine()
  const before = captureProcessingState(e)
  e.updateEqBand(3, 6)
  e.updateDynamics({ ratio: 9 })
  assert.equal(before.eqGains[3], 0)
  assert.equal(before.dynamics.ratio, DEFAULT_DYNAMICS.ratio)
})

test('applyProcessingState restores every covered setting', () => {
  const e = engine()
  const target = {
    eqGains: EQ_BAND_FREQUENCIES.map((_, i) => (i % 2 ? -3 : 4)),
    eqBypass: true,
    dynamics: { threshold: -12, knee: 5, ratio: 8, attack: 0.01, release: 0.1 },
    dynamicsEnabled: false,
  }
  applyProcessingState(e, target)
  assert.deepEqual(captureProcessingState(e), target)
  assert.equal(e.eqBypass.value, true)
  assert.equal(e.dynamicsEnabled.value, false)

  // and back again, flipping the toggles once more
  const defaults = captureProcessingState(engine())
  applyProcessingState(e, defaults)
  assert.deepEqual(captureProcessingState(e), defaults)
})

test('applyProcessingState only touches values that differ', () => {
  const e = engine()
  e.updateEqBand(0, 2)
  const calls = { band: 0, dyn: 0, eqToggle: 0, dynToggle: 0 }
  const spy = {
    ...e,
    updateEqBand: (i, g) => (calls.band++, e.updateEqBand(i, g)),
    updateDynamics: (d) => (calls.dyn++, e.updateDynamics(d)),
    toggleEqBypass: () => (calls.eqToggle++, e.toggleEqBypass()),
    toggleDynamics: () => (calls.dynToggle++, e.toggleDynamics()),
  }

  applyProcessingState(spy, captureProcessingState(e))
  assert.deepEqual(calls, { band: 0, dyn: 0, eqToggle: 0, dynToggle: 0 })

  const next = captureProcessingState(e)
  next.eqGains[5] = -1
  next.dynamics.attack = 0.5
  applyProcessingState(spy, next)
  assert.deepEqual(calls, { band: 1, dyn: 1, eqToggle: 0, dynToggle: 0 })
})

test('processingStatesEqual compares by value', () => {
  const e = engine()
  const a = captureProcessingState(e)
  const b = captureProcessingState(e)
  assert.equal(processingStatesEqual(a, b), true)
  b.eqGains[18] = 0.5
  assert.equal(processingStatesEqual(a, b), false)
  const c = captureProcessingState(e)
  c.dynamics.release = 0.3
  assert.equal(processingStatesEqual(a, c), false)
  const d = captureProcessingState(e)
  d.dynamicsEnabled = false
  assert.equal(processingStatesEqual(a, d), false)
  assert.equal(processingStatesEqual(a, null), false)
})

test('describeProcessingChange names the kind of change', () => {
  const e = engine()
  const base = captureProcessingState(e)
  const mod = (fn) => {
    const s = captureProcessingState(e)
    fn(s)
    return s
  }

  assert.equal(
    describeProcessingChange(
      base,
      mod(() => {})
    ),
    null
  )
  assert.deepEqual(
    describeProcessingChange(
      base,
      mod((s) => (s.eqGains[7] = 3))
    ),
    { type: 'eq-band', index: 7 }
  )
  assert.deepEqual(
    describeProcessingChange(
      base,
      mod((s) => s.eqGains.fill(2))
    ),
    { type: 'eq-curve' }
  )
  assert.deepEqual(
    describeProcessingChange(
      base,
      mod((s) => (s.eqBypass = true))
    ),
    { type: 'eq-bypass', enabled: false }
  )
  assert.deepEqual(
    describeProcessingChange(
      base,
      mod((s) => (s.dynamics.knee = 1))
    ),
    { type: 'dyn-param', param: 'knee' }
  )
  assert.deepEqual(
    describeProcessingChange(
      base,
      mod((s) => Object.assign(s.dynamics, { knee: 1, ratio: 2 }))
    ),
    { type: 'dyn-params' }
  )
  assert.deepEqual(
    describeProcessingChange(
      base,
      mod((s) => (s.dynamicsEnabled = false))
    ),
    { type: 'dyn-toggle', enabled: false }
  )
  assert.deepEqual(
    describeProcessingChange(
      base,
      mod((s) => {
        s.eqGains[0] = 1
        s.dynamics.ratio = 2
      })
    ),
    { type: 'mixed' }
  )
})

test('only moves of the same slider merge', () => {
  const band = (index) => ({ type: 'eq-band', index })
  const param = (p) => ({ type: 'dyn-param', param: p })
  assert.equal(canMergeProcessingChanges(band(2), band(2)), true)
  assert.equal(canMergeProcessingChanges(band(2), band(3)), false)
  assert.equal(canMergeProcessingChanges(param('ratio'), param('ratio')), true)
  assert.equal(canMergeProcessingChanges(param('ratio'), param('knee')), false)
  assert.equal(canMergeProcessingChanges({ type: 'eq-curve' }, { type: 'eq-curve' }), false)
  assert.equal(
    canMergeProcessingChanges({ type: 'eq-bypass', enabled: true }, { type: 'eq-bypass' }),
    false
  )
  assert.equal(canMergeProcessingChanges(null, band(1)), false)
})
