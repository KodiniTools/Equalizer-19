import { test, mock } from 'node:test'
import assert from 'node:assert/strict'
import { nextTick } from 'vue'
import { useAudioEngine } from '../src/composables/useAudioEngine.js'
import { useUndoRedo } from '../src/composables/useUndoRedo.js'
import { EQ_PRESETS, DEFAULT_DYNAMICS } from '../src/utils/presets.js'

mock.method(console, 'log', () => {})

function clock(start = 1000) {
  let t = start
  return { now: () => t, advance: (ms) => (t += ms) }
}

// Engine without an AudioContext plus a history observing it; `flush` lets
// the observer (a Vue watcher) run, as it would before the next render.
function setup(options = {}) {
  const c = clock()
  const engine = useAudioEngine()
  const history = useUndoRedo(engine, { now: c.now, ...options })
  return { engine, history, clock: c, flush: nextTick }
}

const gains = (engine) => engine.eqBands.map((b) => b.gain)

test('starts without steps', () => {
  const { history } = setup()
  assert.equal(history.canUndo.value, false)
  assert.equal(history.canRedo.value, false)
  assert.equal(history.undoChange.value, null)
  assert.equal(history.undo(), null)
})

test('a band change becomes an undoable step; undo and redo restore the engine', async () => {
  const { engine, history, flush } = setup()
  engine.updateEqBand(4, 6)
  await flush()
  assert.equal(history.canUndo.value, true)
  assert.deepEqual(history.undoChange.value, { type: 'eq-band', index: 4 })

  assert.deepEqual(history.undo(), { type: 'eq-band', index: 4 })
  assert.equal(engine.eqBands[4].gain, 0)
  await flush()
  assert.equal(history.canUndo.value, false, 'undo itself is not recorded')
  assert.equal(history.canRedo.value, true)
  assert.deepEqual(history.redoChange.value, { type: 'eq-band', index: 4 })

  history.redo()
  assert.equal(engine.eqBands[4].gain, 6)
  await flush()
  assert.equal(history.canRedo.value, false)
  assert.equal(history.canUndo.value, true)
})

test('all band writes of a preset form one step', async () => {
  const { engine, history, flush } = setup()
  engine.applyEqPreset('Rock')
  await flush()
  assert.equal(history.undoDepth.value, 1)
  assert.deepEqual(history.undoChange.value, { type: 'eq-curve' })
  history.undo()
  assert.ok(gains(engine).every((g) => g === 0))
  history.redo()
  assert.deepEqual(gains(engine), EQ_PRESETS.Rock)
})

test('dragging one slider collapses into one step, another slider starts a new one', async () => {
  const { engine, history, flush, clock } = setup()
  for (const v of [1, 2, 3, 4]) {
    engine.updateEqBand(2, v)
    await flush()
    clock.advance(50)
  }
  assert.equal(history.undoDepth.value, 1)

  engine.updateDynamics({ ratio: 6 })
  await flush()
  clock.advance(50)
  engine.updateDynamics({ ratio: 7 })
  await flush()
  assert.equal(history.undoDepth.value, 2)
  assert.deepEqual(history.undoChange.value, { type: 'dyn-param', param: 'ratio' })

  history.undo()
  assert.equal(engine.dynamics.ratio, DEFAULT_DYNAMICS.ratio)
  history.undo()
  assert.equal(engine.eqBands[2].gain, 0)
})

test('bypass and compressor toggles are undoable and rebuild the chain state', async () => {
  const { engine, history, flush } = setup()
  engine.toggleEqBypass()
  await flush()
  engine.toggleDynamics()
  await flush()
  assert.equal(history.undoDepth.value, 2)
  assert.deepEqual(history.undoChange.value, { type: 'dyn-toggle', enabled: false })

  history.undo()
  assert.equal(engine.dynamicsEnabled.value, true)
  assert.equal(engine.eqBypass.value, true)
  assert.deepEqual(history.undoChange.value, { type: 'eq-bypass', enabled: false })
  history.undo()
  assert.equal(engine.eqBypass.value, false)
  await flush()
  assert.equal(history.canUndo.value, false)
})

test('a new change after undo drops the redo branch', async () => {
  const { engine, history, flush } = setup()
  engine.updateEqBand(0, 1)
  await flush()
  engine.updateEqBand(1, 1)
  await flush()
  history.undo()
  await flush()
  assert.equal(history.canRedo.value, true)
  engine.updateDynamics({ knee: 3 })
  await flush()
  assert.equal(history.canRedo.value, false)
  assert.equal(history.undoDepth.value, 2)
})

test('lastAction reports what was undone/redone for user feedback', async () => {
  const { engine, history, flush } = setup()
  assert.equal(history.lastAction.value, null)
  engine.updateDynamics({ threshold: -10 })
  await flush()
  history.undo()
  assert.equal(history.lastAction.value.kind, 'undo')
  assert.deepEqual(history.lastAction.value.change, { type: 'dyn-param', param: 'threshold' })
  const firstId = history.lastAction.value.id
  history.redo()
  assert.equal(history.lastAction.value.kind, 'redo')
  assert.notEqual(history.lastAction.value.id, firstId)
})

test('clear makes the current settings the new baseline', async () => {
  const { engine, history, flush } = setup()
  engine.updateEqBand(0, 5)
  await flush()
  history.clear()
  assert.equal(history.canUndo.value, false)
  assert.equal(engine.eqBands[0].gain, 5)
  engine.updateEqBand(0, 7)
  await flush()
  history.undo()
  assert.equal(engine.eqBands[0].gain, 5)
})

test('respects the step limit', async () => {
  const { engine, history, flush, clock } = setup({ limit: 5 })
  for (let i = 0; i < 12; i++) {
    engine.updateEqBand(i, 1)
    await flush()
    clock.advance(5000)
  }
  assert.equal(history.undoDepth.value, 5)
})
