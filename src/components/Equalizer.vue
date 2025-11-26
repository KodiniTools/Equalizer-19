<template>
  <div class="equalizer">
    <div class="equalizer-header">
      <div class="header-icon" :title="t('equalizer.title') || '19-Band Equalizer'">
        <i class="fas fa-sliders-h"></i>
      </div>
      <button
        @click="toggleBypass"
        :class="['btn-toggle', { active: !isEqBypassed }]"
        :title="!isEqBypassed ? (t('equalizer.enabled') || 'An') : (t('equalizer.disabled') || 'Aus')"
      >
        <i :class="!isEqBypassed ? 'fas fa-toggle-on' : 'fas fa-toggle-off'"></i>
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

    <button @click="resetEqualizer" class="btn-reset" :title="t('equalizer.reset') || 'Zurücksetzen'">
      <i class="fas fa-undo"></i>
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
  background: var(--card-bg, white);
  border-radius: 16px;
  padding: 20px;
  border: 1px solid var(--border-color, #e9ecef);
  margin-bottom: 0;
}

.equalizer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-icon {
  width: 44px;
  height: 44px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3em;
  color: white;
}

.btn-toggle {
  width: 44px;
  height: 44px;
  border: 1px solid var(--border-color, #ddd);
  background: var(--secondary-bg, white);
  border-radius: 12px;
  color: var(--text-secondary, #666);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  font-size: 1.3em;
}

.btn-toggle:hover {
  border-color: #667eea;
  color: #667eea;
}

.btn-toggle.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: transparent;
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
  color: var(--text-primary, #333);
}

.equalizer-presets select {
  flex: 1;
  padding: 10px 15px;
  border: 1px solid var(--border-color, #e9ecef);
  border-radius: 10px;
  font-size: 1em;
  cursor: pointer;
  background: var(--secondary-bg, white);
  color: var(--text-primary, #333);
  transition: all 0.2s ease;
}

.equalizer-presets select:hover {
  border-color: #667eea;
}

.equalizer-presets select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.equalizer-controls {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 4px;
  padding: 20px 15px;
  background: var(--secondary-bg, #f8f9fa);
  border: 1px solid var(--border-color, #e9ecef);
  border-radius: 12px;
  margin-bottom: 20px;
  min-height: 280px;
  width: 100%;
}

.equalizer-controls.disabled {
  opacity: 0.5;
  pointer-events: none;
}

.eq-slider {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 30px;
  max-width: 45px;
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.4);
  transition: all 0.2s ease;
}

.slider.vertical::-webkit-slider-thumb:hover {
  transform: scale(1.2);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.6);
}

.slider.vertical::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.4);
}

.slider-value {
  font-weight: 600;
  font-size: 0.8em;
  color: #667eea;
  font-family: 'Courier New', monospace;
  min-width: 28px;
  text-align: center;
  white-space: nowrap;
}

.slider-label {
  font-size: 0.7em;
  color: var(--text-secondary, #666);
  font-weight: 500;
  text-align: center;
  min-width: 28px;
  white-space: nowrap;
}

.btn-reset {
  width: 44px;
  height: 44px;
  border: 1px solid var(--border-color, #ddd);
  background: var(--secondary-bg, white);
  border-radius: 12px;
  color: var(--text-secondary, #666);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  font-size: 1.1em;
  margin: 0 auto;
}

.btn-reset:hover {
  background: #667eea;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
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
