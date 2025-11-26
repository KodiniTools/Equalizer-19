<template>
  <div class="equalizer">
    <div class="eq-header">
      <button @click="toggleBypass" :class="['toggle-btn', { active: !isEqBypassed }]">
        <i :class="!isEqBypassed ? 'fas fa-toggle-on' : 'fas fa-toggle-off'"></i>
      </button>
      <select @change="handlePresetChange" v-model="selectedPreset" class="preset-select">
        <option value="">Custom</option>
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
      <button @click="resetEqualizer" class="reset-btn">
        <i class="fas fa-undo"></i>
      </button>
    </div>

    <div class="eq-bands" :class="{ disabled: isEqBypassed }">
      <div v-for="(band, index) in localBands" :key="band.frequency" class="band">
        <input
          type="range"
          min="-12"
          max="12"
          step="0.5"
          :value="band.gain"
          @input="handleGainChange($event, index)"
          :disabled="isEqBypassed"
          class="slider-v"
        />
        <span class="val">{{ band.gain > 0 ? '+' : '' }}{{ band.gain }}</span>
        <span class="freq">{{ formatFrequency(band.frequency) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, inject, watch, onMounted } from 'vue'

const audioEngine = inject('audioEngine')
const notify = inject('notify', () => {})

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
  background: var(--card-bg, #252530);
  border: 1px solid var(--border-color, #3a3a48);
  border-radius: 12px;
  padding: 12px;
}

.eq-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.toggle-btn {
  width: 28px;
  height: 28px;
  border: 1px solid var(--border-color, #3a3a48);
  background: var(--secondary-bg, #1a1a22);
  border-radius: 6px;
  color: var(--text-secondary, #8a8a9a);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85em;
  transition: all 0.2s ease;
}

.toggle-btn:hover {
  border-color: #667eea;
  color: #667eea;
}

.toggle-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: transparent;
  color: white;
}

.preset-select {
  flex: 1;
  padding: 5px 8px;
  border: 1px solid var(--border-color, #3a3a48);
  border-radius: 6px;
  font-size: 0.7em;
  cursor: pointer;
  background: var(--secondary-bg, #1a1a22);
  color: var(--text-secondary, #c8c8d5);
  transition: all 0.2s ease;
}

.preset-select:hover {
  border-color: #667eea;
}

.preset-select:focus {
  outline: none;
  border-color: #667eea;
}

.reset-btn {
  width: 28px;
  height: 28px;
  border: 1px solid var(--border-color, #3a3a48);
  background: var(--secondary-bg, #1a1a22);
  border-radius: 6px;
  color: var(--text-secondary, #8a8a9a);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7em;
  transition: all 0.2s ease;
}

.reset-btn:hover {
  background: #667eea;
  color: white;
}

.eq-bands {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 2px;
  padding: 12px 8px;
  background: var(--secondary-bg, #1a1a22);
  border: 1px solid var(--border-color, #3a3a48);
  border-radius: 8px;
  min-height: 220px;
}

.eq-bands.disabled {
  opacity: 0.4;
  pointer-events: none;
}

.band {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  flex: 1;
  min-width: 22px;
  max-width: 36px;
}

.slider-v {
  writing-mode: bt-lr;
  -webkit-appearance: slider-vertical;
  width: 6px;
  height: 160px;
  padding: 0;
  margin: 0;
  cursor: pointer;
  background: transparent;
}

.slider-v::-webkit-slider-runnable-track {
  width: 6px;
  background: linear-gradient(to top, #3a3a48 0%, #4a4a58 100%);
  border-radius: 3px;
}

.slider-v::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(102, 126, 234, 0.5);
  transition: all 0.15s ease;
}

.slider-v::-webkit-slider-thumb:hover {
  transform: scale(1.15);
  box-shadow: 0 3px 10px rgba(102, 126, 234, 0.7);
}

.slider-v::-moz-range-track {
  width: 6px;
  background: linear-gradient(to top, #3a3a48 0%, #4a4a58 100%);
  border-radius: 3px;
}

.slider-v::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 6px rgba(102, 126, 234, 0.5);
}

.val {
  font-size: 0.6em;
  font-weight: 600;
  color: #667eea;
  font-family: 'SF Mono', 'Monaco', monospace;
  min-width: 24px;
  text-align: center;
  white-space: nowrap;
}

.freq {
  font-size: 0.55em;
  color: var(--text-secondary, #8a8a9a);
  font-weight: 500;
  text-align: center;
  white-space: nowrap;
}

@media (max-width: 900px) {
  .eq-bands {
    gap: 1px;
    padding: 10px 4px;
  }

  .slider-v {
    height: 130px;
  }

  .band {
    min-width: 18px;
  }

  .val {
    font-size: 0.55em;
  }

  .freq {
    font-size: 0.5em;
  }
}
</style>
