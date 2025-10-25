import { ref, reactive, watch } from 'vue'

export function useAudioEngine() {
  // Audio Context
  const audioContext = ref(null)
  const isInitialized = ref(false)
  
  // Audio Nodes
  const sourceNode = ref(null)
  const analyserNode = ref(null)
  const gainNode = ref(null)
  const dynamicsNode = ref(null)
  
  // Equalizer Filters (19 Bands)
  const eqFilters = ref([])
  
  // Equalizer Settings
  const eqBands = reactive([
    { frequency: 20, gain: 0, q: 1.0 },
    { frequency: 25, gain: 0, q: 1.0 },
    { frequency: 31.5, gain: 0, q: 1.0 },
    { frequency: 40, gain: 0, q: 1.0 },
    { frequency: 50, gain: 0, q: 1.0 },
    { frequency: 63, gain: 0, q: 1.0 },
    { frequency: 80, gain: 0, q: 1.0 },
    { frequency: 100, gain: 0, q: 1.0 },
    { frequency: 125, gain: 0, q: 1.0 },
    { frequency: 160, gain: 0, q: 1.0 },
    { frequency: 200, gain: 0, q: 1.0 },
    { frequency: 250, gain: 0, q: 1.0 },
    { frequency: 315, gain: 0, q: 1.0 },
    { frequency: 400, gain: 0, q: 1.0 },
    { frequency: 500, gain: 0, q: 1.0 },
    { frequency: 630, gain: 0, q: 1.0 },
    { frequency: 800, gain: 0, q: 1.0 },
    { frequency: 1000, gain: 0, q: 1.0 },
    { frequency: 1250, gain: 0, q: 1.0 }
  ])
  
  // Dynamics Settings (moderate defaults to prevent clipping)
  const dynamics = reactive({
    threshold: -30,      // dB (higher = less compression)
    knee: 20,           // dB (smoother transition)
    ratio: 4,           // ratio (gentler compression)
    attack: 0.003,      // seconds
    release: 0.25       // seconds
  })
  
  // Master Gain (reduced to prevent clipping)
  const masterGain = ref(0.7)
  
  // EQ Bypass
  const eqBypass = ref(false)
  
  // Dynamics Bypass
  const dynamicsEnabled = ref(true)
  
  /**
   * Initialize Audio Context and create audio nodes
   */
  function initAudioContext() {
    if (isInitialized.value) return
    
    try {
      audioContext.value = new (window.AudioContext || window.webkitAudioContext)()
      
      // Create Analyser Node
      analyserNode.value = audioContext.value.createAnalyser()
      analyserNode.value.fftSize = 2048
      analyserNode.value.smoothingTimeConstant = 0.8
      
      // Create Dynamics Compressor
      dynamicsNode.value = audioContext.value.createDynamicsCompressor()
      dynamicsNode.value.threshold.value = dynamics.threshold
      dynamicsNode.value.knee.value = dynamics.knee
      dynamicsNode.value.ratio.value = dynamics.ratio
      dynamicsNode.value.attack.value = dynamics.attack
      dynamicsNode.value.release.value = dynamics.release
      
      // Create Equalizer Filters (19 bands)
      createEqFilters()
      
      // Create Master Gain Node
      gainNode.value = audioContext.value.createGain()
      gainNode.value.gain.value = masterGain.value
      
      isInitialized.value = true
      
      console.log('✅ Audio Engine initialized with', eqFilters.value.length, 'EQ bands')
      
    } catch (error) {
      console.error('Failed to initialize Audio Context:', error)
    }
  }
  
  /**
   * Create 19-band equalizer filters
   */
  function createEqFilters() {
    eqFilters.value = []
    
    eqBands.forEach((band, index) => {
      const filter = audioContext.value.createBiquadFilter()
      
      // First and last band use different filter types
      if (index === 0) {
        filter.type = 'lowshelf'
      } else if (index === eqBands.length - 1) {
        filter.type = 'highshelf'
      } else {
        filter.type = 'peaking'
      }
      
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
    
    // CRITICAL: Connect to Destination (speakers)
    try {
      currentNode.connect(audioContext.value.destination)
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
    
    // Reconnect audio source to update routing
    if (sourceNode.value) {
      const source = sourceNode.value
      disconnectAudioSource()
      connectAudioSource(source)
    }
  }
  
  /**
   * Update dynamics compressor settings
   */
  function updateDynamics(settings) {
    Object.assign(dynamics, settings)
    
    if (dynamicsNode.value) {
      if (settings.threshold !== undefined) {
        dynamicsNode.value.threshold.value = settings.threshold
      }
      if (settings.knee !== undefined) {
        dynamicsNode.value.knee.value = settings.knee
      }
      if (settings.ratio !== undefined) {
        dynamicsNode.value.ratio.value = settings.ratio
      }
      if (settings.attack !== undefined) {
        dynamicsNode.value.attack.value = settings.attack
      }
      if (settings.release !== undefined) {
        dynamicsNode.value.release.value = settings.release
      }
    }
  }
  
  /**
   * Toggle dynamics compressor
   */
  function toggleDynamics() {
    dynamicsEnabled.value = !dynamicsEnabled.value
    
    // Reconnect audio source to update routing
    if (sourceNode.value) {
      const source = sourceNode.value
      disconnectAudioSource()
      connectAudioSource(source)
    }
  }
  
  /**
   * Update master gain
   */
  function updateMasterGain(value) {
    masterGain.value = Math.max(0, Math.min(2, value))
    
    if (gainNode.value) {
      gainNode.value.gain.value = masterGain.value
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
  
  /**
   * Apply preset EQ curve (moderate gains to prevent clipping)
   */
  function applyEqPreset(preset) {
    const presets = {
      flat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      bass_boost: [4, 3.5, 3, 2.5, 2, 1.5, 1, 0.5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      treble_boost: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1.5, 2, 2.5, 3, 4],
      vocal: [-1, -1, -0.5, 0, 0, 0, 0.5, 1, 1.5, 2, 1.5, 1, 0.5, 0, 0, -0.5, -0.5, -1, -1],
      rock: [2.5, 2, 1.5, 1, 0.5, 0, 0, 0.5, 1, 1.5, 1.5, 1, 0.5, 0, 0, 0.5, 1, 1.5, 2],
      jazz: [1.5, 1, 0.5, 0, 0, 0, 0, 0, 0.5, 1, 1, 1, 0.5, 0.5, 0, 0, 0, 0.5, 1],
      classical: [2, 1.5, 1, 0.5, 0, 0, 0, 0, 0.5, 1, 1, 1, 1, 1, 1, 0.5, 0, 0, 0],
      pop: [1, 0.5, 0, 0, 0.5, 1, 1, 1, 1, 0.5, 0, 0, 0, 0.5, 1, 1, 1, 0.5, 0],
      electronic: [3, 2.5, 2, 1.5, 1, 0, 0, 0, 0, 0, 0, 0, 0.5, 1, 1.5, 2, 2.5, 3, 3]
    }
    
    if (presets[preset]) {
      updateAllEqBands(presets[preset])
      console.log('✅ EQ Preset applied:', preset, '(moderate gains to prevent clipping)')
    }
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
      eqFilters: eqFilters.value
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
    gainNode,
    dynamicsNode,
    eqFilters,
    eqBands,
    dynamics,
    masterGain,
    eqBypass,
    dynamicsEnabled,
    
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
    getFrequencyData,
    getTimeDomainData,
    getAudioNodes,
    applyEqPreset,
    cleanup
  }
}
