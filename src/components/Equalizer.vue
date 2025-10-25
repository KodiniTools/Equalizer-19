<template>
  <div class="equalizer">
    <div class="equalizer-header">
      <h3>
        <i class="fas fa-sliders-h"></i>
        {{ t('equalizer.title') || '19-Band Equalizer' }}
      </h3>
      <button 
        @click="toggleBypass"
        :class="['btn-toggle', { active: !isEqBypassed }]"
      >
        <i :class="!isEqBypassed ? 'fas fa-toggle-on' : 'fas fa-toggle-off'"></i>
        {{ !isEqBypassed ? (t('equalizer.enabled') || 'An') : (t('equalizer.disabled') || 'Aus') }}
      </button>
    </div>

    <div class="equalizer-presets">
      <label>{{ t('equalizer.presets') || 'Presets:' }}</label>
      <select @change="handlePresetChange" v-model="selectedPreset">
        <option value="">{{ t('equalizer.custom') || 'Custom' }}</option>
        <option value="flat">Flat</option>
        <option value="bass_boost">Bass Boost</option>
        <option value="treble_boost">Treble Boost</option>
        <option value="vocal">Vocal</option>
        <option value="rock">Rock</option>
        <option value="jazz">Jazz</option>
        <option value="classical">Classical</option>
        <option value="pop">Pop</option>
        <option value="electronic">Electronic</option>
      </select>
    </div>

    <div class="equalizer-controls" :class="{ disabled: isEqBypassed }">
      <div 
        v-for="(band, index) in localBands" 
        :key="band.frequency"
        class="eq-slider"
      >
        <input
          type="range"
          min="-12"
          max="12"
          step="0.5"
          :value="band.gain"
          @input="handleGainChange($event, index)"
          :disabled="isEqBypassed"
          class="slider vertical"
        />
        <div class="slider-value">{{ band.gain > 0 ? '+' : '' }}{{ band.gain }}</div>
        <div class="slider-label">{{ formatFrequency(band.frequency) }}</div>
      </div>
    </div>

    <button @click="resetEqualizer" class="btn-reset">
      <i class="fas fa-undo"></i>
      {{ t('equalizer.reset') || 'Zurücksetzen' }}
    </button>
  </div>
</template>

<script setup>
import { ref, inject, computed, watch, onMounted } from 'vue'

// Get dependencies
const i18n = inject('i18n', { t: (key) => key })
const audioEngine = inject('audioEngine')
const notify = inject('notify', () => {})

// Make t function available
const t = (key) => {
  if (i18n && typeof i18n.t === 'function') {
    return i18n.t(key)
  }
  const translations = {
    'equalizer.title': '19-Band Equalizer',
    'equalizer.enabled': 'An',
    'equalizer.disabled': 'Aus',
    'equalizer.presets': 'Presets:',
    'equalizer.custom': 'Custom',
    'equalizer.reset': 'Zurücksetzen'
  }
  return translations[key] || key
}

// Local state - initialize with 19 bands
const localBands = ref([
  { frequency: 20, gain: 0 },
  { frequency: 25, gain: 0 },
  { frequency: 31.5, gain: 0 },
  { frequency: 40, gain: 0 },
  { frequency: 50, gain: 0 },
  { frequency: 63, gain: 0 },
  { frequency: 80, gain: 0 },
  { frequency: 100, gain: 0 },
  { frequency: 125, gain: 0 },
  { frequency: 160, gain: 0 },
  { frequency: 200, gain: 0 },
  { frequency: 250, gain: 0 },
  { frequency: 315, gain: 0 },
  { frequency: 400, gain: 0 },
  { frequency: 500, gain: 0 },
  { frequency: 630, gain: 0 },
  { frequency: 800, gain: 0 },
  { frequency: 1000, gain: 0 },
  { frequency: 1250, gain: 0 }
])

const selectedPreset = ref('')
const isEqBypassed = ref(false)

// Sync with audioEngine if available
if (audioEngine && audioEngine.eqBands) {
  watch(() => audioEngine.eqBands, (newBands) => {
    if (newBands && newBands.length === 19) {
      localBands.value = newBands.map(band => ({
        frequency: band.frequency,
        gain: band.gain
      }))
    }
  }, { deep: true, immediate: true })
  
  if (audioEngine.eqBypass) {
    isEqBypassed.value = audioEngine.eqBypass.value
  }
}

function handleGainChange(event, index) {
  const value = parseFloat(event.target.value)
  
  // Update local state safely
  if (localBands.value && localBands.value[index]) {
    localBands.value[index].gain = value
  }
  
  // Update audioEngine
  if (audioEngine && audioEngine.updateEqBand) {
    audioEngine.updateEqBand(index, value)
  }
  
  selectedPreset.value = '' // Mark as custom
}

function handlePresetChange() {
  if (selectedPreset.value && audioEngine && audioEngine.applyEqPreset) {
    audioEngine.applyEqPreset(selectedPreset.value)
    
    // Update local display
    if (audioEngine.eqBands) {
      localBands.value = audioEngine.eqBands.map(band => ({
        frequency: band.frequency,
        gain: band.gain
      }))
    }
    
    notify(
      `Preset "${selectedPreset.value}" angewendet`,
      'success'
    )
  }
}

function toggleBypass() {
  if (audioEngine && audioEngine.toggleEqBypass) {
    audioEngine.toggleEqBypass()
    isEqBypassed.value = audioEngine.eqBypass?.value ?? false
    
    notify(
      isEqBypassed.value 
        ? 'Equalizer deaktiviert'
        : 'Equalizer aktiviert',
      'info'
    )
  }
}

function resetEqualizer() {
  if (audioEngine && audioEngine.resetEq) {
    audioEngine.resetEq()
    
    // Reset local display
    localBands.value.forEach(band => {
      band.gain = 0
    })
    
    selectedPreset.value = ''
    
    notify('Equalizer zurückgesetzt', 'info')
  }
}

function formatFrequency(freq) {
  if (freq >= 1000) {
    return (freq / 1000).toFixed(1) + 'k'
  }
  return freq.toString()
}

onMounted(() => {
  console.log('✅ Equalizer mounted with', localBands.value.length, 'bands')
})
</script>

<style scoped>
.equalizer {
  background: var(--gradient-card);
  border: 1px solid var(--border-color);
  border-radius: 20px;
  padding: 25px;
  box-shadow: 0 4px 20px var(--shadow-light);
  margin-bottom: 25px;
}

.equalizer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.equalizer-header h3 {
  margin: 0;
  font-size: 1.4em;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--text-primary);
}

.btn-toggle {
  padding: 10px 20px;
  border: 2px solid var(--border-color);
  background: var(--secondary-bg);
  border-radius: 25px;
  color: var(--text-secondary);
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
  font-size: 0.95em;
}

.btn-toggle:hover {
  border-color: var(--accent-primary);
  color: var(--accent-primary);
}

.btn-toggle.active {
  background: var(--accent-primary);
  border-color: var(--accent-primary);
  color: white;
}

.btn-toggle i {
  font-size: 1.2em;
}

.equalizer-presets {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 25px;
}

.equalizer-presets label {
  font-weight: 600;
  color: var(--text-primary);
}

.equalizer-presets select {
  flex: 1;
  padding: 10px 15px;
  border: 2px solid var(--border-color);
  border-radius: 10px;
  font-size: 1em;
  cursor: pointer;
  background: var(--secondary-bg);
  color: var(--text-primary);
  transition: all 0.2s ease;
}

.equalizer-presets select:hover {
  border-color: var(--accent-primary);
}

.equalizer-presets select:focus {
  outline: none;
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px var(--shadow-light);
}

.equalizer-controls {
  display: flex;
  justify-content: space-around;
  align-items: flex-end;
  gap: 8px;
  padding: 20px 10px;
  background: var(--secondary-bg);
  border: 1px solid var(--border-color);
  border-radius: 15px;
  margin-bottom: 20px;
  min-height: 300px;
}

.equalizer-controls.disabled {
  opacity: 0.5;
  pointer-events: none;
}

.eq-slider {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.slider.vertical {
  writing-mode: bt-lr;
  -webkit-appearance: slider-vertical;
  width: 8px;
  height: 200px;
  padding: 0;
  margin: 0;
  cursor: pointer;
}

.slider.vertical::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--accent-primary);
  cursor: pointer;
  box-shadow: 0 2px 8px var(--shadow-medium);
  transition: all 0.2s ease;
}

.slider.vertical::-webkit-slider-thumb:hover {
  transform: scale(1.2);
  box-shadow: 0 4px 12px var(--shadow-medium);
}

.slider.vertical::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--accent-primary);
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 8px var(--shadow-medium);
}

.slider-value {
  font-weight: 600;
  font-size: 0.85em;
  color: var(--accent-primary);
  font-family: 'Courier New', monospace;
  min-width: 35px;
  text-align: center;
}

.slider-label {
  font-size: 0.75em;
  color: var(--text-secondary);
  font-weight: 500;
  text-align: center;
  min-width: 35px;
}

.btn-reset {
  width: 100%;
  padding: 12px 20px;
  border: 2px solid var(--accent-primary);
  background: var(--secondary-bg);
  border-radius: 12px;
  color: var(--accent-primary);
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: all 0.3s ease;
  font-size: 1em;
}

.btn-reset:hover {
  background: var(--accent-primary);
  border-color: var(--accent-primary);
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px var(--shadow-medium);
}

.btn-reset i {
  font-size: 1.1em;
}

@media (max-width: 768px) {
  .equalizer {
    padding: 20px;
  }

  .equalizer-controls {
    gap: 4px;
    padding: 15px 5px;
    overflow-x: auto;
  }

  .slider.vertical {
    height: 150px;
  }

  .slider-value {
    font-size: 0.75em;
  }

  .slider-label {
    font-size: 0.7em;
  }
}
</style>
