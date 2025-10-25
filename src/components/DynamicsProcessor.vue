<template>
  <div class="dynamics-processor">
    <div class="dynamics-header">
      <h3>
        <i class="fas fa-sliders-h"></i>
        {{ t('dynamics.title') || 'Dynamics Processor' }}
      </h3>
      <button 
        @click="toggleDynamics"
        :class="['btn-toggle', { active: dynamicsEnabled }]"
      >
        <i :class="dynamicsEnabled ? 'fas fa-toggle-on' : 'fas fa-toggle-off'"></i>
        {{ dynamicsEnabled ? (t('dynamics.enabled') || 'An') : (t('dynamics.disabled') || 'Aus') }}
      </button>
    </div>

    <div class="dynamics-controls" :class="{ disabled: !dynamicsEnabled }">
      <!-- Threshold -->
      <div class="control-group">
        <label>
          <i class="fas fa-arrow-down"></i>
          {{ t('dynamics.threshold') || 'Threshold' }}
          <span class="value">{{ threshold }}dB</span>
        </label>
        <input
          type="range"
          min="-60"
          max="0"
          step="1"
          v-model.number="threshold"
          @input="handleThresholdChange"
          :disabled="!dynamicsEnabled"
        />
      </div>

      <!-- Ratio -->
      <div class="control-group">
        <label>
          <i class="fas fa-compress"></i>
          {{ t('dynamics.ratio') || 'Ratio' }}
          <span class="value">{{ ratio }}:1</span>
        </label>
        <input
          type="range"
          min="1"
          max="20"
          step="0.5"
          v-model.number="ratio"
          @input="handleRatioChange"
          :disabled="!dynamicsEnabled"
        />
      </div>

      <!-- Knee -->
      <div class="control-group">
        <label>
          <i class="fas fa-adjust"></i>
          {{ t('dynamics.knee') || 'Knee' }}
          <span class="value">{{ knee }}dB</span>
        </label>
        <input
          type="range"
          min="0"
          max="40"
          step="1"
          v-model.number="knee"
          @input="handleKneeChange"
          :disabled="!dynamicsEnabled"
        />
      </div>

      <!-- Attack -->
      <div class="control-group">
        <label>
          <i class="fas fa-bolt"></i>
          {{ t('dynamics.attack') || 'Attack' }}
          <span class="value">{{ (attack * 1000).toFixed(1) }}ms</span>
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.001"
          v-model.number="attack"
          @input="handleAttackChange"
          :disabled="!dynamicsEnabled"
        />
      </div>

      <!-- Release -->
      <div class="control-group">
        <label>
          <i class="fas fa-clock"></i>
          {{ t('dynamics.release') || 'Release' }}
          <span class="value">{{ (release * 1000).toFixed(0) }}ms</span>
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          v-model.number="release"
          @input="handleReleaseChange"
          :disabled="!dynamicsEnabled"
        />
      </div>
    </div>

    <!-- Reset Button -->
    <button @click="resetDynamics" class="btn-reset">
      <i class="fas fa-undo"></i>
      {{ t('dynamics.reset') || 'Zurücksetzen' }}
    </button>
  </div>
</template>

<script setup>
import { ref, inject, onMounted } from 'vue'

// Get dependencies
const i18n = inject('i18n', { t: (key) => key })
const audioEngine = inject('audioEngine')
const notify = inject('notify', () => {})

// Make t function available in template
const t = (key) => {
  if (i18n && typeof i18n.t === 'function') {
    return i18n.t(key)
  }
  // Fallback translations
  const translations = {
    'dynamics.title': 'Dynamics Processor',
    'dynamics.enabled': 'An',
    'dynamics.disabled': 'Aus',
    'dynamics.threshold': 'Threshold',
    'dynamics.ratio': 'Ratio',
    'dynamics.knee': 'Knee',
    'dynamics.attack': 'Attack',
    'dynamics.release': 'Release',
    'dynamics.reset': 'Zurücksetzen'
  }
  return translations[key] || key
}

// Local state (moderate defaults to prevent clipping)
const threshold = ref(-30)
const ratio = ref(4)
const knee = ref(20)
const attack = ref(0.003)
const release = ref(0.25)
const dynamicsEnabled = ref(true)

// Sync with audioEngine if available
if (audioEngine && audioEngine.dynamics) {
  threshold.value = audioEngine.dynamics.threshold
  ratio.value = audioEngine.dynamics.ratio
  knee.value = audioEngine.dynamics.knee
  attack.value = audioEngine.dynamics.attack
  release.value = audioEngine.dynamics.release
  dynamicsEnabled.value = audioEngine.dynamicsEnabled?.value ?? true
}

function applySettings() {
  if (!audioEngine || !audioEngine.updateDynamics) {
    console.warn('⚠️ AudioEngine not available')
    return
  }

  try {
    audioEngine.updateDynamics({
      threshold: threshold.value,
      ratio: ratio.value,
      knee: knee.value,
      attack: attack.value,
      release: release.value
    })
    
    console.log('🎚️ Dynamics updated:', {
      threshold: threshold.value,
      ratio: ratio.value,
      knee: knee.value,
      attack: attack.value,
      release: release.value
    })
  } catch (e) {
    console.error('Error updating dynamics:', e)
  }
}

function handleThresholdChange() {
  applySettings()
}

function handleRatioChange() {
  applySettings()
}

function handleKneeChange() {
  applySettings()
}

function handleAttackChange() {
  applySettings()
}

function handleReleaseChange() {
  applySettings()
}

function toggleDynamics() {
  if (audioEngine && audioEngine.toggleDynamics) {
    audioEngine.toggleDynamics()
    dynamicsEnabled.value = audioEngine.dynamicsEnabled?.value ?? true
    
    notify(
      dynamicsEnabled.value 
        ? (t('dynamics.enabled') || 'Dynamics aktiviert')
        : (t('dynamics.disabled') || 'Dynamics deaktiviert'),
      'info'
    )
  }
}

function resetDynamics() {
  threshold.value = -30
  ratio.value = 4
  knee.value = 20
  attack.value = 0.003
  release.value = 0.25
  
  applySettings()
  
  notify(
    t('dynamics.reset') || 'Dynamics zurückgesetzt',
    'info'
  )
}

onMounted(() => {
  applySettings()
})
</script>

<style scoped>
.dynamics-processor {
  background: var(--gradient-card);
  border: 1px solid var(--border-color);
  border-radius: 20px;
  padding: 25px;
  box-shadow: 0 4px 20px var(--shadow-light);
}

.dynamics-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
}

.dynamics-header h3 {
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

.dynamics-controls {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 20px;
}

.dynamics-controls.disabled {
  opacity: 0.5;
  pointer-events: none;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.control-group label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  color: var(--text-primary);
  font-size: 0.95em;
}

.control-group label i {
  margin-right: 8px;
  color: var(--accent-primary);
  width: 20px;
}

.value {
  color: var(--accent-primary);
  font-family: 'Courier New', monospace;
  font-size: 0.9em;
}

.control-group input[type="range"] {
  width: 100%;
  height: 8px;
  border-radius: 5px;
  background: var(--secondary-bg);
  border: 1px solid var(--border-color);
  outline: none;
  cursor: pointer;
  -webkit-appearance: none;
}

.control-group input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--accent-primary);
  cursor: pointer;
  box-shadow: 0 2px 8px var(--shadow-medium);
  transition: all 0.2s ease;
}

.control-group input[type="range"]::-webkit-slider-thumb:hover {
  transform: scale(1.2);
  box-shadow: 0 4px 12px var(--shadow-medium);
}

.control-group input[type="range"]::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--accent-primary);
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 8px var(--shadow-medium);
  transition: all 0.2s ease;
}

.control-group input[type="range"]::-moz-range-thumb:hover {
  transform: scale(1.2);
  box-shadow: 0 4px 12px var(--shadow-medium);
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
  .dynamics-processor {
    padding: 20px;
  }

  .dynamics-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }

  .btn-toggle {
    width: 100%;
    justify-content: center;
  }
}
</style>
