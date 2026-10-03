import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createHistory } from '../src/utils/history.js'

// Manual clock so merge windows are deterministic
function clock(start = 0) {
  let t = start
  return { now: () => t, advance: (ms) => (t += ms) }
}

test('starts empty: nothing to undo or redo', () => {
  const h = createHistory()
  h.reset('a')
  assert.equal(h.canUndo(), false)
  assert.equal(h.canRedo(), false)
  assert.equal(h.undo(), null)
  assert.equal(h.redo(), null)
  assert.equal(h.present(), 'a')
  assert.equal(h.peekUndo(), null)
  assert.equal(h.peekRedo(), null)
})

test('record / undo / redo walk the timeline and report the change', () => {
  const h = createHistory()
  h.reset('a')
  h.record('b', 'a→b')
  h.record('c', 'b→c')
  assert.equal(h.present(), 'c')
  assert.equal(h.undoDepth(), 2)
  assert.equal(h.peekUndo(), 'b→c')

  assert.deepEqual(h.undo(), { state: 'c', change: 'b→c' })
  assert.equal(h.present(), 'b')
  assert.equal(h.peekUndo(), 'a→b')
  assert.equal(h.peekRedo(), 'b→c')
  assert.equal(h.canRedo(), true)

  assert.deepEqual(h.undo(), { state: 'b', change: 'a→b' })
  assert.equal(h.present(), 'a')
  assert.equal(h.canUndo(), false)
  assert.equal(h.undo(), null)

  assert.deepEqual(h.redo(), { state: 'b', change: 'a→b' })
  assert.deepEqual(h.redo(), { state: 'c', change: 'b→c' })
  assert.equal(h.redo(), null)
  assert.equal(h.present(), 'c')
})

test('recording after undo discards the redo branch', () => {
  const h = createHistory()
  h.reset('a')
  h.record('b', 1)
  h.record('c', 2)
  h.undo()
  h.record('d', 3)
  assert.equal(h.canRedo(), false)
  assert.equal(h.redoDepth(), 0)
  assert.deepEqual(h.undo(), { state: 'd', change: 3 })
  assert.equal(h.present(), 'b')
})

test('limit drops the oldest steps', () => {
  const h = createHistory({ limit: 3 })
  h.reset(0)
  for (let i = 1; i <= 10; i++) h.record(i, i)
  assert.equal(h.undoDepth(), 3)
  h.undo()
  h.undo()
  h.undo()
  assert.equal(h.present(), 7)
  assert.equal(h.canUndo(), false)
})

test('consecutive mergeable changes inside the window collapse into one step', () => {
  const c = clock()
  const h = createHistory({
    mergeWindowMs: 500,
    now: c.now,
    canMerge: (prev, next) => prev.key === next.key,
  })
  h.reset(0)
  h.record(1, { key: 'slider' })
  c.advance(100)
  h.record(2, { key: 'slider' })
  c.advance(100)
  h.record(3, { key: 'slider' })
  assert.equal(h.undoDepth(), 1, 'one step for the whole drag')
  assert.deepEqual(h.undo(), { state: 3, change: { key: 'slider' } })
  assert.equal(h.present(), 0)
})

test('a different change, an expired window or a non-mergeable change start a new step', () => {
  const c = clock()
  const h = createHistory({
    mergeWindowMs: 500,
    now: c.now,
    canMerge: (prev, next) => prev.key === next.key,
  })
  h.reset(0)
  h.record(1, { key: 'a' })
  c.advance(100)
  h.record(2, { key: 'b' }) // other control
  c.advance(100)
  h.record(3, { key: 'b' }) // merges into previous
  c.advance(600)
  h.record(4, { key: 'b' }) // window expired
  c.advance(100)
  h.record(5, null) // unlabelled changes never merge
  assert.equal(h.undoDepth(), 4)
})

test('the first step is never merged into the baseline', () => {
  const h = createHistory({ canMerge: () => true })
  h.reset('base')
  h.record('x', 'k')
  assert.equal(h.undoDepth(), 1)
  assert.equal(h.undo().state, 'x')
  assert.equal(h.present(), 'base')
})

test('after undo a new change becomes its own step even if it would merge', () => {
  const c = clock()
  const h = createHistory({ mergeWindowMs: 10_000, now: c.now, canMerge: (a, b) => a === b })
  h.reset(0)
  h.record(1, 'k')
  h.record(2, 'k') // merged → present = 2
  h.undo() // present = 0 (baseline)
  h.record(3, 'k')
  h.undo()
  assert.equal(h.present(), 0)

  h.record(4, 'k')
  h.record(5, 'k') // merged
  h.record(6, 'other')
  h.undo() // present = 5, which is a merged step younger than the window
  h.record(7, 'k')
  assert.equal(h.undoDepth(), 2, 'step 7 is separate from the merged step 4/5')
  h.undo()
  assert.equal(h.present(), 5)
})

test('reset clears both stacks', () => {
  const h = createHistory()
  h.reset('a')
  h.record('b', 1)
  h.undo()
  h.reset('z')
  assert.equal(h.present(), 'z')
  assert.equal(h.canUndo(), false)
  assert.equal(h.canRedo(), false)
})
