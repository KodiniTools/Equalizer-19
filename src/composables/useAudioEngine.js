import { ref, reactive, watch } from 'vue'
import { EQ_PRESETS, EQ_BAND_FREQUENCIES, EQ_BAND_Q, DEFAULT_DYNAMICS } from '../utils/presets.js'

export function useAudioEngine() {
  // Audio Context
  const audioContext = ref(null)
  const isInitialized = ref(false)

  // Audio Nodes
  const sourceNode = ref(null)
  const analyserNode = ref(null)
  const inputAnalyserNode = ref(null)
  const gainNode = ref(null)
  // Between the end of the chain and the speakers; recording/meters tap before it
  const monitorNode = ref(null)
  const dynamicsNode = ref(null)

  // Equalizer Filters (19 Bands)
  const eqFilters = ref([])

  // Equalizer Settings (19 bands, 20 Hz – 20 kHz)
  const eqBands = reactive(
    EQ_BAND_FREQUENCIES.map((frequency) => ({ frequency, gain: 0, q: EQ_BAND_Q }))
  )

  // Dynamics Settings (moderate defaults to prevent clipping)
  const dynamics = reactive({ ...DEFAULT_DYNAMICS })

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
  function initAudioContext() {
    if (isInitialized.value) return

    try {
      audioContext.value = new (window.AudioContext || window.webkitAudioContext)()

      // Create Analyser Nodes
      analyserNode.value = audioContext.value.createAnalyser()
      analyserNode.value.fftSize = 2048
      analyserNode.value.smoothingTimeConstant = 0.8

      inputAnalyserNode.value = audioContext.value.createAnalyser()
      inputAnalyserNode.value.fftSize = 1024
      inputAnalyserNode.value.smoothingTimeConstant = 0.3

      // Create Dynamics Compressor
      dynamicsNode.value = audioContext.value.createDynamicsCompressor()
      applyDynamicsToNode(dynamics)

      // Create Equalizer Filters (19 bands)
      createEqFilters()

      // Create Master Gain Node
      gainNode.value = audioContext.value.createGain()
      gainNode.value.gain.value = masterGain.value

      // Monitor (speaker output) gain – muted for live inputs to avoid feedback
      monitorNode.value = audioContext.value.createGain()
      monitorNode.value.gain.value = monitorEnabled.value ? 1 : 0
      monitorNode.value.connect(audioContext.value.destination)

      isInitialized.value = true

      console.log('✅ Audio Engine initialized with', eqFilters.value.length, 'EQ bands')
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
  function createEqFilters() {
    eqFilters.value = []

    eqBands.forEach((band) => {
      const filter = audioContext.value.createBiquadFilter()

      filter.type = 'peaking'
      filter.frequency.value = band.frequency
      filter.gain.value = band.gain
      filter.Q.value = band.q

      eqFilters.value.push(filter)
    })
  }

  /**
   * Connect audio source to the audio processing chain
   * Chain: Source → EQ Filters → Dynamics → Gain → Analyser → Destination
   */
  function connectAudioSource(source) {
    if (!audioContext.value || !isInitialized.value) {
      initAudioContext()
    }

    // Resume context if suspended
    if (audioContext.value.state === 'suspended') {
      audioContext.value.resume()
    }

    // Disconnect previous source if exists
    if (sourceNode.value) {
      try {
        sourceNode.value.disconnect()
      } catch (e) {
        // Ignore disconnect errors
      }
    }

    sourceNode.value = source

    // Side tap for input metering (before EQ chain)
    if (inputAnalyserNode.value) {
      try {
        source.connect(inputAnalyserNode.value)
      } catch (_e) {
        // Node already connected — safe to ignore
      }
    }

    console.log('🔌 Connecting audio source...')
    console.log('   Source Node:', sourceNode.value)
    console.log('   EQ Bypass:', eqBypass.value)
    console.log('   Dynamics Enabled:', dynamicsEnabled.value)

    // Build the audio chain
    let currentNode = sourceNode.value

    // Connect through all EQ filters sequentially
    if (!eqBypass.value && eqFilters.value.length > 0) {
      console.log('   → Connecting through', eqFilters.value.length, 'EQ filters')
      eqFilters.value.forEach((filter, index) => {
        try {
          currentNode.connect(filter)
          currentNode = filter
          if (index === 0 || index === eqFilters.value.length - 1) {
            console.log('      Filter', index, ':', filter.type, filter.frequency.value + 'Hz')
          }
        } catch (e) {
          console.error('      Error connecting filter', index, ':', e)
        }
      })
    } else if (eqBypass.value) {
      console.log('   ⊘ EQ bypassed')
    }

    // Connect to Dynamics Compressor if enabled
    if (dynamicsEnabled.value && dynamicsNode.value) {
      console.log('   → Connecting to Dynamics Compressor')
      try {
        currentNode.connect(dynamicsNode.value)
        currentNode = dynamicsNode.value
        console.log('      Threshold:', dynamicsNode.value.threshold.value + 'dB')
        console.log('      Ratio:', dynamicsNode.value.ratio.value + ':1')
      } catch (e) {
        console.error('      Error connecting dynamics:', e)
      }
    } else {
      console.log('   ⊘ Dynamics bypassed')
    }

    // Connect to Master Gain
    if (gainNode.value) {
      console.log('   → Connecting to Gain Node')
      try {
        currentNode.connect(gainNode.value)
        currentNode = gainNode.value
        console.log('      Gain:', gainNode.value.gain.value)
      } catch (e) {
        console.error('      Error connecting gain:', e)
      }
    }

    // Connect to Analyser (for visualization)
    if (analyserNode.value) {
      try {
        currentNode.connect(analyserNode.value)
        console.log('   → Connected to Analyser')
      } catch (e) {
        console.error('      Error connecting analyser:', e)
      }
    }

    // CRITICAL: Connect to Destination (speakers) via the monitor gain
    try {
      currentNode.connect(monitorNode.value || audioContext.value.destination)
      console.log('   → Connected to DESTINATION (Speakers)')
      console.log('✅ Audio chain complete!')
    } catch (e) {
      console.error('❌ Error connecting to destination:', e)
    }
  }

  /**
   * Disconnect audio source
   */
  function disconnectAudioSource() {
    if (sourceNode.value) {
      try {
        sourceNode.value.disconnect()
      } catch (e) {
        // Ignore
      }
      sourceNode.value = null
    }
  }

  /**
   * Rebuild the processing chain for the current source (after routing changes)
   */
  function reconnectSource() {
    if (sourceNode.value) {
      const source = sourceNode.value
      disconnectAudioSource()
      connectAudioSource(source)
    }
  }

  /**
   * Update a specific EQ band
   */
  function updateEqBand(index, gain) {
    if (index >= 0 && index < eqBands.length) {
      eqBands[index].gain = gain

      if (eqFilters.value[index]) {
        eqFilters.value[index].gain.value = gain
        console.log(`🎛️ EQ Band ${index} (${eqBands[index].frequency}Hz) set to ${gain}dB`)
      }
    }
  }

  /**
   * Update all EQ bands at once
   */
  function updateAllEqBands(gains) {
    gains.forEach((gain, index) => {
      updateEqBand(index, gain)
    })
  }

  /**
   * Reset all EQ bands to 0
   */
  function resetEq() {
    eqBands.forEach((band, index) => {
      updateEqBand(index, 0)
    })
  }

  /**
   * Toggle EQ bypass
   */
  function toggleEqBypass() {
    eqBypass.value = !eqBypass.value
    reconnectSource()
  }

  /**
   * Update dynamics compressor settings
   */
  function updateDynamics(settings) {
    Object.assign(dynamics, settings)
    applyDynamicsToNode(settings)
  }

  /**
   * Write the given (partial) dynamics settings to the compressor node
   */
  function applyDynamicsToNode(settings) {
    if (!dynamicsNode.value) return
    for (const key of Object.keys(DEFAULT_DYNAMICS)) {
      if (settings[key] !== undefined) {
        dynamicsNode.value[key].value = settings[key]
      }
    }
  }

  /**
   * Toggle dynamics compressor
   */
  function toggleDynamics() {
    dynamicsEnabled.value = !dynamicsEnabled.value
    reconnectSource()
  }

  /**
   * Update master gain
   */
  function updateMasterGain(value) {
    // The masterGain watcher below forwards the value to the gain node
    masterGain.value = Math.max(0, Math.min(2, value))
  }

  /**
   * Mute / unmute the speaker output without affecting recording and meters
   */
  function setMonitorEnabled(enabled) {
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
  function getFrequencyData() {
    if (!analyserNode.value) return new Uint8Array(0)

    const bufferLength = analyserNode.value.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    analyserNode.value.getByteFrequencyData(dataArray)

    return dataArray
  }

  /**
   * Get time domain data for waveform
   */
  function getTimeDomainData() {
    if (!analyserNode.value) return new Uint8Array(0)

    const bufferLength = analyserNode.value.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    analyserNode.value.getByteTimeDomainData(dataArray)

    return dataArray
  }

  function applyEqPreset(preset) {
    if (EQ_PRESETS[preset]) {
      updateAllEqBands(EQ_PRESETS[preset])
    }
  }

  /**
   * Compute RMS dBFS for a given AnalyserNode (-Infinity when silent)
   */
  function _rmsDb(node) {
    if (!node) return -Infinity
    const buf = new Float32Array(node.fftSize)
    node.getFloatTimeDomainData(buf)
    let sum = 0
    for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i]
    const rms = Math.sqrt(sum / buf.length)
    return rms > 0 ? 20 * Math.log10(rms) : -Infinity
  }

  function getInputLevel() {
    return _rmsDb(inputAnalyserNode.value)
  }
  function getOutputLevel() {
    return _rmsDb(analyserNode.value)
  }

  /**
   * Get all audio nodes for external use
   */
  function getAudioNodes() {
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
  function cleanup() {
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
}
