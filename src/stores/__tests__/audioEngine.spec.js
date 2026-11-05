import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { isReactive, isRef } from 'vue'
import { useAudioEngineStore } from '../audioEngine'
import { EQ_BAND_FREQUENCIES } from '../../utils/presets'

// Minimal fake of the Web Audio API (plain objects, so Vue would proxy them)
function node() {
  return {
    connect() {},
    disconnect() {},
    gain: { value: 1 },
    frequency: { value: 0 },
    Q: { value: 1 },
  }
}

class FakeAudioContext {
  state = 'running'
  destination = node()
  createAnalyser = () => node()
  createDynamicsCompressor = () => ({
    ...node(),
    threshold: { value: 0 },
    ratio: { value: 1 },
    knee: { value: 0 },
    attack: { value: 0 },
    release: { value: 0 },
  })
  createGain = () => node()
  createBiquadFilter = () => node()
  resume = () => Promise.resolve()
  close = () => Promise.resolve()
}

describe('audioEngine store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    window.AudioContext = FakeAudioContext
  })

  it('hält die Parameter reaktiv, die Audio-Nodes aber roh', () => {
    const engine = useAudioEngineStore()
    engine.initAudioContext()
    expect(engine.isInitialized).toBe(true)
    expect(isReactive(engine.eqBands)).toBe(true)
    expect(isReactive(engine.dynamics)).toBe(true)
    for (const n of [
      engine.audioContext,
      engine.gainNode,
      engine.analyserNode,
      engine.dynamicsNode,
    ]) {
      expect(isReactive(n)).toBe(false)
      expect(isRef(n)).toBe(false)
    }
    expect(engine.eqFilters).toHaveLength(EQ_BAND_FREQUENCIES.length)
    expect(engine.eqFilters.every((f) => !isReactive(f))).toBe(true)
  })

  it('schreibt Band-Änderungen in Parameter und Filter', () => {
    const engine = useAudioEngineStore()
    engine.initAudioContext()
    engine.updateEqBand(3, 6)
    expect(engine.eqBands[3].gain).toBe(6)
    expect(engine.eqFilters[3].gain.value).toBe(6)
    engine.toggleEqBypass()
    expect(engine.eqBypass).toBe(true)
  })
})
