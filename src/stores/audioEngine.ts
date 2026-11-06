import { defineStore } from 'pinia'
import { ref, shallowRef, reactive, markRaw, watch } from 'vue'
import {
  EQ_PRESETS,
  EQ_BAND_FREQUENCIES,
  EQ_BAND_Q,
  DEFAULT_DYNAMICS,
  type DynamicsKey,
  type DynamicsSettings,
} from '../utils/presets'
import { processingChainOrder, connectProcessingChain } from '../utils/audioChain'

/** One EQ band: centre frequency, gain in dB, Q. */
export interface EqBand {
  frequency: number
  gain: number
  q: number
}

/** The nodes getAudioNodes() hands out (null while the engine is not initialised). */
export interface AudioNodes {
  audioContext: AudioContext | null
  sourceNode: AudioNode | null
  analyserNode: AnalyserNode | null
  gainNode: GainNode | null
  dynamicsNode: DynamicsCompressorNode | null
  eqFilters: BiquadFilterNode[]
}

type AudioContextCtor = new () => AudioContext

/** Safari < 14.1 only has the prefixed constructor. */
function audioContextCtor(): AudioContextCtor {
  const w = window as Window & { webkitAudioContext?: AudioContextCtor }
  return window.AudioContext || (w.webkitAudioContext as AudioContextCtor)
}

/**
 * Audio-Engine: Web-Audio-Kette Source → 19 EQ-Filter → Kompressor → Master-Gain →
 * Analyser/Monitor. Nur die Parameter (eqBands, dynamics, masterGain, Bypass-Flags)
 * sind reaktiv; die AudioNodes liegen in shallowRef und sind markRaw, damit Vue sie
 * nie in Proxies wickelt (connect()/disconnect() auf einem Proxy schlägt fehl).
 */
export const useAudioEngineStore = defineStore('audioEngine', () => {
  // Audio Context
  const audioContext = shallowRef<AudioContext | null>(null)
  const isInitialized = ref(false)

  // Audio Nodes
  const sourceNode = shallowRef<AudioNode | null>(null)
  const analyserNode = shallowRef<AnalyserNode | null>(null)
  const inputAnalyserNode = shallowRef<AnalyserNode | null>(null)
  const gainNode = shallowRef<GainNode | null>(null)
  // Between the end of the chain and the speakers; recording/meters tap before it
  const monitorNode = shallowRef<GainNode | null>(null)
  const dynamicsNode = shallowRef<DynamicsCompressorNode | null>(null)

  // Equalizer Filters (19 Bands)
  const eqFilters = shallowRef<BiquadFilterNode[]>([])

  // Equalizer Settings (19 bands, 20 Hz – 20 kHz)
  const eqBands = reactive<EqBand[]>(
    EQ_BAND_FREQUENCIES.map((frequency) => ({ frequency, gain: 0, q: EQ_BAND_Q }))
  )

  // Dynamics Settings (moderate defaults to prevent clipping)
  const dynamics = reactive<DynamicsSettings>({ ...DEFAULT_DYNAMICS })

  // Master Gain (reduced to prevent clipping)
  const masterGain = ref(0.7)

  // EQ Bypass
  const eqBypass = ref(false)

  // Dynamics Bypass
  const dynamicsEnabled = ref(true)

  // Speaker monitoring (playback is always monitored; live inputs may mute it)
  const monitorEnabled = ref(true)

  /**
   * Initialize Audio Context and create audio nodes
   */
  function initAudioContext(): void {
    if (isInitialized.value) return

    try {
      const ctx = markRaw(new (audioContextCtor())())
      audioContext.value = ctx

      // Create Analyser Nodes
      const analyser = markRaw(ctx.createAnalyser())
      analyser.fftSize = 2048
      analyser.smoothingTimeConstant = 0.8
      analyserNode.value = analyser

      const inputAnalyser = markRaw(ctx.createAnalyser())
      inputAnalyser.fftSize = 1024
      inputAnalyser.smoothingTimeConstant = 0.3
      inputAnalyserNode.value = inputAnalyser

      // Create Dynamics Compressor
      dynamicsNode.value = markRaw(ctx.createDynamicsCompressor())
      applyDynamicsToNode(dynamics)

      // Create Equalizer Filters (19 bands)
      createEqFilters(ctx)

      // Create Master Gain Node
      const gain = markRaw(ctx.createGain())
      gain.gain.value = masterGain.value
      gainNode.value = gain

      // Monitor (speaker output) gain – muted for live inputs to avoid feedback
      const monitor = markRaw(ctx.createGain())
      monitor.gain.value = monitorEnabled.value ? 1 : 0
      monitor.connect(ctx.destination)
      monitorNode.value = monitor

      isInitialized.value = true
    } catch (error) {
      console.error('Failed to initialize Audio Context:', error)
    }
  }

  /**
   * Create 19-band equalizer filters.
   * All bands are peaking (bell) filters: with the outermost bands sitting at
   * the edges of the audible range (20 Hz / 20 kHz), shelving filters there
   * would only act outside the hearing range and the sliders would do nothing.
   */
  function createEqFilters(ctx: AudioContext): void {
    const filters: BiquadFilterNode[] = []

    eqBands.forEach((band) => {
      const filter = markRaw(ctx.createBiquadFilter())

      filter.type = 'peaking'
      filter.frequency.value = band.frequency
      filter.gain.value = band.gain
      filter.Q.value = band.q

      filters.push(filter)
    })

    eqFilters.value = filters
  }

  /**
   * Connect audio source to the audio processing chain
   * Chain: Source → EQ Filters → Dynamics → Gain → Analyser → Destination
   *
   * The same chain serves file playback and live inputs (line-in, microphone,
   * system audio): EQ and compressor sit in front of the master gain, where
   * the recorder taps the signal, so recordings always contain the processed
   * sound. Rebuilding the chain never touches the gain node's outputs, so a
   * running recording survives routing changes.
   */
  function connectAudioSource(source: AudioNode): void {
    if (!audioContext.value || !isInitialized.value) {
      initAudioContext()
    }
    const ctx = audioContext.value
    if (!ctx) return

    // Resume context if suspended
    if (ctx.state === 'suspended') {
      ctx.resume()
    }

    // Disconnect previous source if exists
    if (sourceNode.value && sourceNode.value !== source) {
      try {
        sourceNode.value.disconnect()
      } catch {
        // Ignore disconnect errors
      }
    }

    sourceNode.value = markRaw(source)

    // Build the chain: source → [EQ] → [dynamics] → gain. Bypassed parts are
    // detached as well so no edge of an earlier routing keeps feeding the output.
    const order = processingChainOrder<AudioNode>({
      source,
      eqFilters: eqFilters.value,
      dynamicsNode: dynamicsNode.value,
      gainNode: gainNode.value,
      eqBypass: eqBypass.value,
      dynamicsEnabled: dynamicsEnabled.value,
    })
    try {
      const processors: AudioNode[] = [...eqFilters.value]
      if (dynamicsNode.value) processors.push(dynamicsNode.value)
      connectProcessingChain(order, processors)
    } catch (e) {
      console.error('❌ Error building the processing chain:', e)
    }

    // Side tap for input metering (after the rebuild, which detaches the source)
    if (inputAnalyserNode.value) {
      try {
        source.connect(inputAnalyserNode.value)
      } catch (e) {
        console.error('      Error connecting input analyser:', e)
      }
    }

    const tail = order[order.length - 1]

    // Connect to Analyser (for visualization)
    if (analyserNode.value) {
      try {
        tail.connect(analyserNode.value)
      } catch (e) {
        console.error('      Error connecting analyser:', e)
      }
    }

    // CRITICAL: Connect to Destination (speakers) via the monitor gain
    try {
      tail.connect(monitorNode.value || ctx.destination)
    } catch (e) {
      console.error('❌ Error connecting to destination:', e)
    }
  }

  /**
   * Disconnect audio source
   */
  function disconnectAudioSource(): void {
    if (sourceNode.value) {
      try {
        sourceNode.value.disconnect()
      } catch {
        // Ignore
      }
      sourceNode.value = null
    }
  }

  /**
   * Rebuild the processing chain for the current source (after routing changes)
   */
  function reconnectSource(): void {
    if (sourceNode.value) {
      const source = sourceNode.value
      disconnectAudioSource()
      connectAudioSource(source)
    }
  }

  /**
   * Update a specific EQ band
   */
  function updateEqBand(index: number, gain: number): void {
    if (index >= 0 && index < eqBands.length) {
      eqBands[index].gain = gain

      const filter = eqFilters.value[index]
      if (filter) {
        filter.gain.value = gain
      }
    }
  }

  /**
   * Update all EQ bands at once
   */
  function updateAllEqBands(gains: readonly number[]): void {
    gains.forEach((gain, index) => {
      updateEqBand(index, gain)
    })
  }

  /**
   * Reset all EQ bands to 0
   */
  function resetEq(): void {
    eqBands.forEach((_band, index) => {
      updateEqBand(index, 0)
    })
  }

  /**
   * Toggle EQ bypass
   */
  function toggleEqBypass(): void {
    eqBypass.value = !eqBypass.value
    reconnectSource()
  }

  /**
   * Update dynamics compressor settings
   */
  function updateDynamics(settings: Partial<DynamicsSettings>): void {
    Object.assign(dynamics, settings)
    applyDynamicsToNode(settings)
  }

  /**
   * Write the given (partial) dynamics settings to the compressor node
   */
  function applyDynamicsToNode(settings: Partial<DynamicsSettings>): void {
    const node = dynamicsNode.value
    if (!node) return
    for (const key of Object.keys(DEFAULT_DYNAMICS) as DynamicsKey[]) {
      const value = settings[key]
      if (value !== undefined) {
        node[key].value = value
      }
    }
  }

  /**
   * Toggle dynamics compressor
   */
  function toggleDynamics(): void {
    dynamicsEnabled.value = !dynamicsEnabled.value
    reconnectSource()
  }

  /**
   * Update master gain
   */
  function updateMasterGain(value: number): void {
    // The masterGain watcher below forwards the value to the gain node
    masterGain.value = Math.max(0, Math.min(2, value))
  }

  /**
   * Mute / unmute the speaker output without affecting recording and meters
   */
  function setMonitorEnabled(enabled: boolean): void {
    monitorEnabled.value = !!enabled
    if (monitorNode.value && audioContext.value) {
      monitorNode.value.gain.setTargetAtTime(
        monitorEnabled.value ? 1 : 0,
        audioContext.value.currentTime,
        0.015
      )
    }
  }

  /**
   * Get frequency data for visualization
   */
  function getFrequencyData(): Uint8Array {
    if (!analyserNode.value) return new Uint8Array(0)

    const bufferLength = analyserNode.value.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    analyserNode.value.getByteFrequencyData(dataArray)

    return dataArray
  }

  /**
   * Get time domain data for waveform
   */
  function getTimeDomainData(): Uint8Array {
    if (!analyserNode.value) return new Uint8Array(0)

    const bufferLength = analyserNode.value.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    analyserNode.value.getByteTimeDomainData(dataArray)

    return dataArray
  }

  function applyEqPreset(preset: string): void {
    const gains = EQ_PRESETS[preset]
    if (gains) {
      updateAllEqBands(gains)
    }
  }

  /**
   * Compute RMS dBFS for a given AnalyserNode (-Infinity when silent)
   */
  function _rmsDb(node: AnalyserNode | null): number {
    if (!node) return -Infinity
    const buf = new Float32Array(node.fftSize)
    node.getFloatTimeDomainData(buf)
    let sum = 0
    for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i]
    const rms = Math.sqrt(sum / buf.length)
    return rms > 0 ? 20 * Math.log10(rms) : -Infinity
  }

  function getInputLevel(): number {
    return _rmsDb(inputAnalyserNode.value)
  }
  function getOutputLevel(): number {
    return _rmsDb(analyserNode.value)
  }

  /**
   * Get all audio nodes for external use
   */
  function getAudioNodes(): AudioNodes {
    return {
      audioContext: audioContext.value,
      sourceNode: sourceNode.value,
      analyserNode: analyserNode.value,
      gainNode: gainNode.value,
      dynamicsNode: dynamicsNode.value,
      eqFilters: eqFilters.value,
    }
  }

  /**
   * Cleanup
   */
  function cleanup(): void {
    disconnectAudioSource()

    if (audioContext.value) {
      audioContext.value.close()
      audioContext.value = null
    }

    isInitialized.value = false
  }

  // Watch for master gain changes
  watch(masterGain, (newValue) => {
    if (gainNode.value) {
      gainNode.value.gain.value = newValue
    }
  })

  return {
    // State
    audioContext,
    isInitialized,
    sourceNode,
    analyserNode,
    inputAnalyserNode,
    gainNode,
    monitorNode,
    dynamicsNode,
    eqFilters,
    eqBands,
    dynamics,
    masterGain,
    eqBypass,
    dynamicsEnabled,
    monitorEnabled,

    // Methods
    initAudioContext,
    connectAudioSource,
    disconnectAudioSource,
    updateEqBand,
    updateAllEqBands,
    resetEq,
    toggleEqBypass,
    updateDynamics,
    toggleDynamics,
    updateMasterGain,
    setMonitorEnabled,
    getFrequencyData,
    getTimeDomainData,
    getInputLevel,
    getOutputLevel,
    getAudioNodes,
    applyEqPreset,
    cleanup,
  }
})
