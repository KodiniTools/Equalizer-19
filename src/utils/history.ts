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
 */

export interface HistoryOptions<C> {
  /** maximum number of undo steps kept (default 100) */
  limit?: number
  /** max. age of an entry to merge into (default 1000) */
  mergeWindowMs?: number
  /** merge predicate */
  canMerge?: (prev: C, next: C) => boolean
  /** clock, injectable for tests */
  now?: () => number
}

export interface HistoryEntry<S, C> {
  state: S
  change: C | null
}

interface StoredEntry<S, C> extends HistoryEntry<S, C> {
  time: number
}

export interface History<S, C> {
  /** Discard everything and start over with `state` as the baseline. */
  reset(state: S): void
  /**
   * Record a new state. `change` describes the transition from the current
   * state to `state`; it is handed back by undo()/redo()/peek*() so the UI can
   * label the step. Recording always clears the redo stack.
   */
  record(state: S, change?: C | null): void
  /**
   * Step back. Returns the entry that was undone ({ state, change }) or null.
   * After the call, present() is the state before that entry.
   */
  undo(): HistoryEntry<S, C> | null
  /** Step forward again. Returns the entry that was redone or null. */
  redo(): HistoryEntry<S, C> | null
  canUndo(): boolean
  canRedo(): boolean
  /** Description of the change undo() would revert, or null. */
  peekUndo(): C | null
  /** Description of the change redo() would re-apply, or null. */
  peekRedo(): C | null
  present(): S | undefined
  undoDepth(): number
  redoDepth(): number
}

export function createHistory<S, C = unknown>({
  limit = 100,
  mergeWindowMs = 1000,
  canMerge = () => false,
  now = () => Date.now(),
}: HistoryOptions<C> = {}): History<S, C> {
  let past: StoredEntry<S | undefined, C>[] = []
  let present: StoredEntry<S | undefined, C> = { state: undefined, change: null, time: 0 }
  let future: StoredEntry<S | undefined, C>[] = []
  // After undo/redo the next change must become its own step, even if it
  // would otherwise merge into the (older) entry that became present.
  let mergeBlocked = false

  function reset(state: S): void {
    past = []
    future = []
    present = { state, change: null, time: now() }
    mergeBlocked = false
  }

  function record(state: S, change: C | null = null): void {
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

  function undo(): HistoryEntry<S, C> | null {
    if (past.length === 0) return null
    const undone = present
    future.unshift(present)
    present = past.pop() as StoredEntry<S | undefined, C>
    mergeBlocked = true
    return { state: undone.state as S, change: undone.change }
  }

  function redo(): HistoryEntry<S, C> | null {
    if (future.length === 0) return null
    past.push(present)
    present = future.shift() as StoredEntry<S | undefined, C>
    mergeBlocked = true
    return { state: present.state as S, change: present.change }
  }

  const canUndo = (): boolean => past.length > 0
  const canRedo = (): boolean => future.length > 0

  const peekUndo = (): C | null => (past.length > 0 ? present.change : null)
  const peekRedo = (): C | null => (future.length > 0 ? future[0].change : null)

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
