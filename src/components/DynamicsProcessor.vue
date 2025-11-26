<template>
  <div class="dynamics-processor">
    <div class="dynamics-header">
      <div class="header-icon" :title="t('dynamics.title') || 'Dynamics Processor'">
        <i class="fas fa-compress-alt"></i>
      </div>
      <button
        @click="toggleDynamics"
        :class="['btn-toggle', { active: dynamicsEnabled }]"
        :title="dynamicsEnabled ? (t('dynamics.enabled') || 'An') : (t('dynamics.disabled') || 'Aus')"
      >
        <i :class="dynamicsEnabled ? 'fas fa-toggle-on' : 'fas fa-toggle-off'"></i>
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
    <button @click="resetDynamics" class="btn-reset" :title="t('dynamics.reset') || 'Zurücksetzen'">
      <i class="fas fa-undo"></i>
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
  background: var(--card-bg, white);
  border-radius: 16px;
  padding: 20px;
  border: 1px solid var(--border-color, #e9ecef);
}

.dynamics-header {
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
  color: var(--text-primary, #333);
  font-size: 0.95em;
}

.control-group label i {
  margin-right: 8px;
  color: #667eea;
  width: 20px;
}

.value {
  color: #667eea;
  font-family: 'Courier New', monospace;
  font-size: 0.9em;
}

.control-group input[type="range"] {
  width: 100%;
  height: 8px;
  border-radius: 5px;
  background: var(--secondary-bg, #e9ecef);
  border: 1px solid var(--border-color, #ddd);
  outline: none;
  cursor: pointer;
  -webkit-appearance: none;
}

.control-group input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.4);
  transition: all 0.2s ease;
}

.control-group input[type="range"]::-webkit-slider-thumb:hover {
  transform: scale(1.2);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.6);
}

.control-group input[type="range"]::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.4);
  transition: all 0.2s ease;
}

.control-group input[type="range"]::-moz-range-thumb:hover {
  transform: scale(1.2);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.6);
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
