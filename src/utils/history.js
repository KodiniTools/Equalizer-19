/**
 * Generic, framework-free undo/redo history.
 *
 * The history holds immutable snapshots of some state. Every entry carries the
 * snapshot (`state`), a free-form description of how the state got there
 * (`change`, supplied by the caller) and the time it was recorded. Nothing in
 * here knows what the state looks like.
 *
 * Consecutive entries can be merged ("coalesced") so that e.g. the many
 * intermediate values of a slider drag end up as a single undo step: when
 * `canMerge(previousChange, nextChange)` returns true and the previous entry is
 * younger than `mergeWindowMs`, the new snapshot replaces the previous entry
 * instead of adding a new one.
 *
 * @param {object} [options]
 * @param {number} [options.limit=100] maximum number of undo steps kept
 * @param {number} [options.mergeWindowMs=1000] max. age of an entry to merge into
 * @param {(prev: any, next: any) => boolean} [options.canMerge] merge predicate
 * @param {() => number} [options.now] clock, injectable for tests
 */
export function createHistory({
  limit = 100,
  mergeWindowMs = 1000,
  canMerge = () => false,
  now = () => Date.now(),
} = {}) {
  let past = []
  let present = { state: undefined, change: null, time: 0 }
  let future = []
  // After undo/redo the next change must become its own step, even if it
  // would otherwise merge into the (older) entry that became present.
  let mergeBlocked = false

  /**
   * Discard everything and start over with `state` as the baseline.
   */
  function reset(state) {
    past = []
    future = []
    present = { state, change: null, time: now() }
    mergeBlocked = false
  }

  /**
   * Record a new state. `change` describes the transition from the current
   * state to `state`; it is handed back by undo()/redo()/peek*() so the UI can
   * label the step. Recording always clears the redo stack.
   */
  function record(state, change = null) {
    const time = now()
    const mergeable =
      !mergeBlocked &&
      past.length > 0 &&
      present.change !== null &&
      change !== null &&
      time - present.time <= mergeWindowMs &&
      canMerge(present.change, change)

    if (!mergeable) {
      past.push(present)
      if (past.length > limit) past.splice(0, past.length - limit)
    }
    present = { state, change, time }
    future = []
    mergeBlocked = false
  }

  /**
   * Step back. Returns the entry that was undone ({ state, change }) or null.
   * After the call, present() is the state before that entry.
   */
  function undo() {
    if (past.length === 0) return null
    const undone = present
    future.unshift(present)
    present = past.pop()
    mergeBlocked = true
    return { state: undone.state, change: undone.change }
  }

  /**
   * Step forward again. Returns the entry that was redone or null.
   */
  function redo() {
    if (future.length === 0) return null
    past.push(present)
    present = future.shift()
    mergeBlocked = true
    return { state: present.state, change: present.change }
  }

  const canUndo = () => past.length > 0
  const canRedo = () => future.length > 0

  /** Description of the change undo() would revert, or null. */
  const peekUndo = () => (past.length > 0 ? present.change : null)
  /** Description of the change redo() would re-apply, or null. */
  const peekRedo = () => (future.length > 0 ? future[0].change : null)

  return {
    reset,
    record,
    undo,
    redo,
    canUndo,
    canRedo,
    peekUndo,
    peekRedo,
    present: () => present.state,
    undoDepth: () => past.length,
    redoDepth: () => future.length,
  }
}
