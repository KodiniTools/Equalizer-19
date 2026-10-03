import { ref, computed, watch } from 'vue'
import { createHistory } from '../utils/history.js'
import {
  captureProcessingState,
  applyProcessingState,
  processingStatesEqual,
  describeProcessingChange,
  canMergeProcessingChanges,
} from '../utils/processingState.js'

/**
 * Undo/redo for the audio engine's processing settings (EQ, compressor).
 *
 * The engine stays the single source of truth: this composable observes it and
 * records a history step whenever the settings change, no matter where the
 * change comes from (sliders, presets, reset buttons, bypass toggles). All
 * mutations that happen synchronously in one tick (e.g. a preset writing 19
 * bands) become one step; consecutive moves of the same slider within
 * `mergeWindowMs` collapse into one step as well.
 *
 * undo()/redo() write the neighbouring snapshot back to the engine. The
 * resulting state equals the history's present state, so the observer records
 * nothing for it.
 *
 * @param {ReturnType<import('./useAudioEngine.js').useAudioEngine>} engine
 * @param {object} [options]
 * @param {number} [options.limit=100]
 * @param {number} [options.mergeWindowMs=1000]
 * @param {() => number} [options.now] clock, injectable for tests
 */
export function useUndoRedo(engine, { limit = 100, mergeWindowMs = 1000, now } = {}) {
  const history = createHistory({
    limit,
    mergeWindowMs,
    now,
    canMerge: canMergeProcessingChanges,
  })
  history.reset(captureProcessingState(engine))

  // The history itself is not reactive; `version` is bumped on every mutation
  // and read inside each computed so that the derived values re-evaluate.
  const version = ref(0)
  const tracked = (read) => computed(() => read(version.value))

  const canUndo = tracked(() => history.canUndo())
  const canRedo = tracked(() => history.canRedo())
  /** Change descriptor of the step undo() would revert (see processingState.js) */
  const undoChange = tracked(() => history.peekUndo())
  /** Change descriptor of the step redo() would re-apply */
  const redoChange = tracked(() => history.peekRedo())
  const undoDepth = tracked(() => history.undoDepth())
  const redoDepth = tracked(() => history.redoDepth())
  /** Last undo/redo performed: { kind: 'undo' | 'redo', change, id } – for UI feedback */
  const lastAction = ref(null)
  let actionId = 0

  const stop = watch(
    () => captureProcessingState(engine),
    (state) => {
      const current = history.present()
      if (processingStatesEqual(state, current)) return
      history.record(state, describeProcessingChange(current, state))
      version.value++
    }
  )

  function undo() {
    const entry = history.undo()
    if (!entry) return null
    applyProcessingState(engine, history.present())
    version.value++
    lastAction.value = { kind: 'undo', change: entry.change, id: ++actionId }
    return entry.change
  }

  function redo() {
    const entry = history.redo()
    if (!entry) return null
    applyProcessingState(engine, entry.state)
    version.value++
    lastAction.value = { kind: 'redo', change: entry.change, id: ++actionId }
    return entry.change
  }

  /**
   * Forget all steps; the current settings become the new baseline.
   */
  function clear() {
    history.reset(captureProcessingState(engine))
    version.value++
  }

  return {
    canUndo,
    canRedo,
    undoChange,
    redoChange,
    lastAction,
    undoDepth,
    redoDepth,
    undo,
    redo,
    clear,
    stop,
  }
}
