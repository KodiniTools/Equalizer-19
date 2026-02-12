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
        <div class="slider-wrapper" :class="{ active: band.gain !== 0 }">
          <input
            type="range"
            min="-12"
            max="12"
            step="0.5"
            :value="band.gain"
            @input="handleGainChange($event, index)"
            :disabled="isEqBypassed"
            class="slider-v"
            :class="{ active: band.gain !== 0 }"
          />
        </div>
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

/* Slider Wrapper für Zentrierung und Glow */
.slider-wrapper {
  position: relative;
  width: 24px;
  height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  transition: all 0.3s ease;
}

/* Aktiver Slider mit hellgrünem Glow */
.slider-wrapper.active {
  background: rgba(76, 217, 100, 0.1);
  box-shadow: 0 0 12px rgba(76, 217, 100, 0.4),
              inset 0 0 8px rgba(76, 217, 100, 0.15);
}

.slider-v {
  -webkit-appearance: none;
  appearance: none;
  writing-mode: vertical-lr;
  direction: rtl;
  width: 8px;
  height: 150px;
  padding: 0;
  margin: 0;
  cursor: pointer;
  background: linear-gradient(to top, #3a3a48 0%, #4a4a58 100%);
  border-radius: 4px;
  outline: none;
  border: none;
}

/* Track für aktive Slider hellgrün */
.slider-v.active {
  background: linear-gradient(to top, #2d8a3e 0%, #4cd964 100%);
  box-shadow: 0 0 6px rgba(76, 217, 100, 0.5);
}

.slider-v::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(102, 126, 234, 0.5);
  transition: all 0.15s ease;
  border: 2px solid #fff;
}

.slider-v.active::-webkit-slider-thumb {
  background: linear-gradient(135deg, #4cd964 0%, #2d8a3e 100%);
  box-shadow: 0 2px 8px rgba(76, 217, 100, 0.6);
}

.slider-v::-webkit-slider-thumb:hover {
  transform: scale(1.2);
  box-shadow: 0 3px 12px rgba(102, 126, 234, 0.7);
}

.slider-v.active::-webkit-slider-thumb:hover {
  box-shadow: 0 3px 12px rgba(76, 217, 100, 0.8);
}

/* Firefox Support */
.slider-v::-moz-range-track {
  width: 8px;
  background: linear-gradient(to top, #3a3a48 0%, #4a4a58 100%);
  border-radius: 4px;
  border: none;
}

.slider-v.active::-moz-range-track {
  background: linear-gradient(to top, #2d8a3e 0%, #4cd964 100%);
}

.slider-v::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  cursor: pointer;
  border: 2px solid #fff;
  box-shadow: 0 2px 6px rgba(102, 126, 234, 0.5);
}

.slider-v.active::-moz-range-thumb {
  background: linear-gradient(135deg, #4cd964 0%, #2d8a3e 100%);
  box-shadow: 0 2px 8px rgba(76, 217, 100, 0.6);
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

  .slider-wrapper {
    height: 130px;
    width: 20px;
  }

  .slider-v {
    height: 120px;
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

@media (max-width: 600px) {
  .equalizer {
    padding: 10px;
  }

  .eq-header {
    gap: 6px;
  }

  .toggle-btn,
  .reset-btn {
    width: 32px;
    height: 32px;
  }

  .preset-select {
    font-size: 0.75em;
    padding: 6px 8px;
  }

  .eq-bands {
    gap: 1px;
    padding: 8px 2px;
    min-height: 180px;
  }

  .slider-wrapper {
    height: 110px;
    width: 18px;
  }

  .slider-v {
    height: 100px;
    width: 6px;
  }

  .band {
    min-width: 15px;
    max-width: 28px;
  }

  .val {
    font-size: 0.5em;
  }

  .freq {
    font-size: 0.45em;
  }

  .slider-v::-webkit-slider-thumb {
    width: 14px;
    height: 14px;
  }

  .slider-v::-moz-range-thumb {
    width: 14px;
    height: 14px;
  }
}

@media (max-width: 400px) {
  .equalizer {
    padding: 8px;
  }

  .eq-bands {
    padding: 6px 2px;
    min-height: 160px;
    overflow-x: auto;
    justify-content: flex-start;
  }

  .slider-wrapper {
    height: 95px;
    width: 16px;
  }

  .slider-v {
    height: 85px;
    width: 5px;
  }

  .band {
    min-width: 14px;
    max-width: 24px;
  }

  .val {
    font-size: 0.45em;
  }

  .freq {
    font-size: 0.4em;
  }

  .slider-v::-webkit-slider-thumb {
    width: 12px;
    height: 12px;
    border-width: 1px;
  }

  .slider-v::-moz-range-thumb {
    width: 12px;
    height: 12px;
    border-width: 1px;
  }
}
</style>
