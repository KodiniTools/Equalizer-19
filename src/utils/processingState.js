import { DEFAULT_DYNAMICS } from './presets.js'

/**
 * Snapshot of everything undo/redo covers: the sound-processing settings of
 * the audio engine (EQ curve and bypass, compressor parameters and on/off).
 *
 * Playback controls (volume, mute, position, playlist) are deliberately not
 * part of the snapshot: they change constantly while listening and would
 * bury the processing steps the user actually wants to step back through.
 *
 * All functions are pure and only need the engine's public interface
 * (eqBands, eqBypass, dynamics, dynamicsEnabled, updateEqBand, updateDynamics,
 * toggleEqBypass, toggleDynamics), so they work without a Web Audio context.
 */

const DYNAMICS_KEYS = Object.keys(DEFAULT_DYNAMICS)

/**
 * Read the current processing settings as a plain, immutable-by-convention object.
 */
export function captureProcessingState(engine) {
  const dynamics = {}
  for (const key of DYNAMICS_KEYS) dynamics[key] = engine.dynamics[key]
  return {
    eqGains: engine.eqBands.map((band) => band.gain),
    eqBypass: !!engine.eqBypass.value,
    dynamics,
    dynamicsEnabled: !!engine.dynamicsEnabled.value,
  }
}

/**
 * Write a snapshot back to the engine. Only values that differ are touched,
 * so filters are not rewritten needlessly and the processing chain is only
 * rebuilt when a bypass state really changes.
 */
export function applyProcessingState(engine, state) {
  state.eqGains.forEach((gain, index) => {
    if (engine.eqBands[index] && engine.eqBands[index].gain !== gain) {
      engine.updateEqBand(index, gain)
    }
  })

  const dynamics = {}
  let dynamicsChanged = false
  for (const key of DYNAMICS_KEYS) {
    if (engine.dynamics[key] !== state.dynamics[key]) {
      dynamics[key] = state.dynamics[key]
      dynamicsChanged = true
    }
  }
  if (dynamicsChanged) engine.updateDynamics(dynamics)

  if (!!engine.eqBypass.value !== state.eqBypass) engine.toggleEqBypass()
  if (!!engine.dynamicsEnabled.value !== state.dynamicsEnabled) engine.toggleDynamics()
}

/**
 * Value equality of two snapshots.
 */
export function processingStatesEqual(a, b) {
  if (a === b) return true
  if (!a || !b) return false
  if (a.eqBypass !== b.eqBypass || a.dynamicsEnabled !== b.dynamicsEnabled) return false
  if (a.eqGains.length !== b.eqGains.length) return false
  for (let i = 0; i < a.eqGains.length; i++) if (a.eqGains[i] !== b.eqGains[i]) return false
  for (const key of DYNAMICS_KEYS) if (a.dynamics[key] !== b.dynamics[key]) return false
  return true
}

/**
 * Describe what changed between two snapshots. The result is i18n-neutral and
 * rendered into text by the UI:
 *
 *   { type: 'eq-band', index }           one EQ band moved
 *   { type: 'eq-curve' }                 several bands at once (preset, reset)
 *   { type: 'eq-bypass', enabled }       EQ switched on (enabled = true) / off
 *   { type: 'dyn-param', param }         one compressor parameter moved
 *   { type: 'dyn-params' }               several parameters (preset, reset)
 *   { type: 'dyn-toggle', enabled }      compressor switched on / off
 *   { type: 'mixed' }                    changes in more than one of the above
 *   null                                 nothing changed
 */
export function describeProcessingChange(prev, next) {
  const changes = []

  const bands = []
  next.eqGains.forEach((gain, index) => {
    if (prev.eqGains[index] !== gain) bands.push(index)
  })
  if (bands.length === 1) changes.push({ type: 'eq-band', index: bands[0] })
  else if (bands.length > 1) changes.push({ type: 'eq-curve' })

  if (prev.eqBypass !== next.eqBypass) {
    changes.push({ type: 'eq-bypass', enabled: !next.eqBypass })
  }

  const params = DYNAMICS_KEYS.filter((key) => prev.dynamics[key] !== next.dynamics[key])
  if (params.length === 1) changes.push({ type: 'dyn-param', param: params[0] })
  else if (params.length > 1) changes.push({ type: 'dyn-params' })

  if (prev.dynamicsEnabled !== next.dynamicsEnabled) {
    changes.push({ type: 'dyn-toggle', enabled: next.dynamicsEnabled })
  }

  if (changes.length === 0) return null
  return changes.length === 1 ? changes[0] : { type: 'mixed' }
}

/**
 * Whether two consecutive changes may collapse into one undo step. Only
 * continuous controls merge (dragging the same slider); switching presets or
 * toggling bypass always stays its own step.
 */
export function canMergeProcessingChanges(prev, next) {
  if (!prev || !next || prev.type !== next.type) return false
  if (prev.type === 'eq-band') return prev.index === next.index
  if (prev.type === 'dyn-param') return prev.param === next.param
  return false
}
