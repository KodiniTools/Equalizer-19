<template>
  <div class="dynamics">
    <!-- Header with toggle -->
    <div class="dynamics-header">
      <button
        @click="toggleDynamics"
        :class="['toggle-btn', { active: dynamicsEnabled }]"
        :title="dynamicsEnabled ? 'Aus' : 'An'"
      >
        <i :class="dynamicsEnabled ? 'fas fa-toggle-on' : 'fas fa-toggle-off'"></i>
      </button>
    </div>

    <!-- Controls -->
    <div class="controls" :class="{ disabled: !dynamicsEnabled }">
      <div class="control-row">
        <span class="label">Threshold</span>
        <input
          type="range"
          min="-60"
          max="0"
          step="1"
          v-model.number="threshold"
          @input="applySettings"
          :disabled="!dynamicsEnabled"
        />
        <span class="val">{{ threshold }}dB</span>
      </div>

      <div class="control-row">
        <span class="label">Ratio</span>
        <input
          type="range"
          min="1"
          max="20"
          step="0.5"
          v-model.number="ratio"
          @input="applySettings"
          :disabled="!dynamicsEnabled"
        />
        <span class="val">{{ ratio }}:1</span>
      </div>

      <div class="control-row">
        <span class="label">Knee</span>
        <input
          type="range"
          min="0"
          max="40"
          step="1"
          v-model.number="knee"
          @input="applySettings"
          :disabled="!dynamicsEnabled"
        />
        <span class="val">{{ knee }}dB</span>
      </div>

      <div class="control-row">
        <span class="label">Attack</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.001"
          v-model.number="attack"
          @input="applySettings"
          :disabled="!dynamicsEnabled"
        />
        <span class="val">{{ (attack * 1000).toFixed(0) }}ms</span>
      </div>

      <div class="control-row">
        <span class="label">Release</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          v-model.number="release"
          @input="applySettings"
          :disabled="!dynamicsEnabled"
        />
        <span class="val">{{ (release * 1000).toFixed(0) }}ms</span>
      </div>
    </div>

    <!-- Reset -->
    <button @click="resetDynamics" class="reset-btn" title="Zurücksetzen">
      <i class="fas fa-undo"></i>
    </button>
  </div>
</template>

<script setup>
import { ref, inject, onMounted } from 'vue'

const audioEngine = inject('audioEngine')

const threshold = ref(-30)
const ratio = ref(4)
const knee = ref(20)
const attack = ref(0.003)
const release = ref(0.25)
const dynamicsEnabled = ref(true)

if (audioEngine && audioEngine.dynamics) {
  threshold.value = audioEngine.dynamics.threshold
  ratio.value = audioEngine.dynamics.ratio
  knee.value = audioEngine.dynamics.knee
  attack.value = audioEngine.dynamics.attack
  release.value = audioEngine.dynamics.release
  dynamicsEnabled.value = audioEngine.dynamicsEnabled?.value ?? true
}

function applySettings() {
  if (!audioEngine || !audioEngine.updateDynamics) return
  audioEngine.updateDynamics({
    threshold: threshold.value,
    ratio: ratio.value,
    knee: knee.value,
    attack: attack.value,
    release: release.value
  })
}

function toggleDynamics() {
  if (audioEngine && audioEngine.toggleDynamics) {
    audioEngine.toggleDynamics()
    dynamicsEnabled.value = audioEngine.dynamicsEnabled?.value ?? true
  }
}

function resetDynamics() {
  threshold.value = -30
  ratio.value = 4
  knee.value = 20
  attack.value = 0.003
  release.value = 0.25
  applySettings()
}

onMounted(() => {
  applySettings()
})
</script>

<style scoped>
.dynamics {
  background: var(--card-bg, #252530);
  border: 1px solid var(--border-color, #3a3a48);
  border-radius: 12px;
  padding: 12px;
}

.dynamics-header {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 10px;
}

.toggle-btn {
  width: 32px;
  height: 32px;
  border: 1px solid var(--border-color, #3a3a48);
  background: var(--secondary-bg, #1a1a22);
  border-radius: 8px;
  color: var(--text-muted, #8b8b9a);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1em;
  transition: all 0.2s;
}

.toggle-btn:hover {
  color: var(--text-primary, #fff);
}

.toggle-btn.active {
  background: var(--accent-primary, #00d9ff);
  border-color: var(--accent-primary, #00d9ff);
  color: #000;
}

.controls {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 10px;
}

.controls.disabled {
  opacity: 0.4;
  pointer-events: none;
}

.control-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.label {
  width: 60px;
  font-size: 0.7em;
  font-weight: 500;
  color: var(--text-secondary, #c8c8d5);
}

.control-row input[type="range"] {
  flex: 1;
  height: 4px;
  -webkit-appearance: none;
  background: var(--secondary-bg, #1a1a22);
  border-radius: 2px;
  outline: none;
  cursor: pointer;
}

.control-row input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--accent-primary, #00d9ff);
  cursor: pointer;
  transition: transform 0.2s;
}

.control-row input[type="range"]::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

.control-row input[type="range"]::-moz-range-thumb {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--accent-primary, #00d9ff);
  cursor: pointer;
  border: none;
}

.val {
  width: 45px;
  text-align: right;
  font-size: 0.65em;
  font-family: 'SF Mono', 'Courier New', monospace;
  color: var(--accent-primary, #00d9ff);
}

.reset-btn {
  width: 28px;
  height: 28px;
  border: 1px solid var(--border-color, #3a3a48);
  background: var(--secondary-bg, #1a1a22);
  border-radius: 6px;
  color: var(--text-muted, #8b8b9a);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7em;
  transition: all 0.2s;
  margin: 0 auto;
}

.reset-btn:hover {
  background: var(--hover-bg, #323240);
  color: var(--text-primary, #fff);
}
</style>
