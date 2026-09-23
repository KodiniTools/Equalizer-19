<template>
  <BasePanel icon="fas fa-sliders" :title="t.dynamics">
    <template #actions>
      <button @click="resetDynamics" class="panel-btn" :title="t.reset" :aria-label="t.reset">
        <i class="fas fa-undo" aria-hidden="true"></i>
      </button>
      <button
        @click="toggleDynamics"
        :class="['panel-btn', { active: dynamicsEnabled }]"
        :title="dynamicsEnabled ? t.comp_toggle_off : t.comp_toggle_on"
        :aria-label="t.a11y_dynamics_toggle"
        :aria-pressed="dynamicsEnabled"
      >
        <i
          :class="dynamicsEnabled ? 'fas fa-toggle-on' : 'fas fa-toggle-off'"
          aria-hidden="true"
        ></i>
      </button>
    </template>

    <!-- Preset -->
    <div class="section">
      <label class="panel-section-label" :for="ids.preset">{{ t.comp_preset_label }}</label>
      <CompressorPresets :id="ids.preset" />
    </div>

    <!-- Parameters -->
    <div class="section">
      <span class="panel-section-label">{{ t.comp_params }}</span>
      <div class="params" :class="{ disabled: !dynamicsEnabled }">
        <div class="param">
          <div class="param-head">
            <label class="param-label" :for="ids.threshold">{{ t.threshold }}</label>
            <span class="param-val">{{ threshold }} dB</span>
          </div>
          <input
            :id="ids.threshold"
            type="range"
            min="-60"
            max="0"
            step="1"
            v-model.number="threshold"
            @input="applySettings"
            :disabled="!dynamicsEnabled"
            :aria-label="t.a11y_threshold.replace('{val}', threshold)"
            :aria-valuenow="threshold"
            aria-valuemin="-60"
            aria-valuemax="0"
          />
        </div>

        <div class="param">
          <div class="param-head">
            <label class="param-label" :for="ids.ratio">{{ t.ratio }}</label>
            <span class="param-val">{{ ratio }}:1</span>
          </div>
          <input
            :id="ids.ratio"
            type="range"
            min="1"
            max="20"
            step="0.5"
            v-model.number="ratio"
            @input="applySettings"
            :disabled="!dynamicsEnabled"
            :aria-label="t.a11y_ratio.replace('{val}', ratio)"
            :aria-valuenow="ratio"
            aria-valuemin="1"
            aria-valuemax="20"
          />
        </div>

        <div class="param">
          <div class="param-head">
            <label class="param-label" :for="ids.knee">{{ t.knee }}</label>
            <span class="param-val">{{ knee }} dB</span>
          </div>
          <input
            :id="ids.knee"
            type="range"
            min="0"
            max="40"
            step="1"
            v-model.number="knee"
            @input="applySettings"
            :disabled="!dynamicsEnabled"
            :aria-label="t.a11y_knee.replace('{val}', knee)"
            :aria-valuenow="knee"
            aria-valuemin="0"
            aria-valuemax="40"
          />
        </div>

        <div class="param">
          <div class="param-head">
            <label class="param-label" :for="ids.attack">{{ t.attack }}</label>
            <span class="param-val">{{ (attack * 1000).toFixed(0) }} ms</span>
          </div>
          <input
            :id="ids.attack"
            type="range"
            min="0"
            max="1"
            step="0.001"
            v-model.number="attack"
            @input="applySettings"
            :disabled="!dynamicsEnabled"
            :aria-label="t.a11y_attack.replace('{val}', (attack * 1000).toFixed(0))"
            :aria-valuenow="(attack * 1000).toFixed(0)"
            aria-valuemin="0"
            aria-valuemax="1000"
          />
        </div>

        <div class="param">
          <div class="param-head">
            <label class="param-label" :for="ids.release">{{ t.release }}</label>
            <span class="param-val">{{ (release * 1000).toFixed(0) }} ms</span>
          </div>
          <input
            :id="ids.release"
            type="range"
            min="0"
            max="1"
            step="0.01"
            v-model.number="release"
            @input="applySettings"
            :disabled="!dynamicsEnabled"
            :aria-label="t.a11y_release.replace('{val}', (release * 1000).toFixed(0))"
            :aria-valuenow="(release * 1000).toFixed(0)"
            aria-valuemin="0"
            aria-valuemax="1000"
          />
        </div>
      </div>
    </div>
  </BasePanel>
</template>

<script setup>
  import { ref, inject, onMounted, watch, useId } from 'vue'
  import { DEFAULT_DYNAMICS } from '../utils/presets.js'
  import BasePanel from './BasePanel.vue'
  import CompressorPresets from './CompressorPresets.vue'

  const { t } = inject('i18n')
  const audioEngine = inject('audioEngine')

  // Unique ids linking labels to their controls
  const uid = useId()
  const ids = Object.fromEntries(
    ['preset', 'threshold', 'ratio', 'knee', 'attack', 'release'].map((k) => [k, `${uid}-${k}`])
  )

  const threshold = ref(DEFAULT_DYNAMICS.threshold)
  const ratio = ref(DEFAULT_DYNAMICS.ratio)
  const knee = ref(DEFAULT_DYNAMICS.knee)
  const attack = ref(DEFAULT_DYNAMICS.attack)
  const release = ref(DEFAULT_DYNAMICS.release)
  const dynamicsEnabled = ref(true)

  if (audioEngine && audioEngine.dynamics) {
    threshold.value = audioEngine.dynamics.threshold
    ratio.value = audioEngine.dynamics.ratio
    knee.value = audioEngine.dynamics.knee
    attack.value = audioEngine.dynamics.attack
    release.value = audioEngine.dynamics.release
    dynamicsEnabled.value = audioEngine.dynamicsEnabled?.value ?? true
  }

  // Watch for external changes (e.g., from presets)
  if (audioEngine && audioEngine.dynamics) {
    watch(
      () => ({ ...audioEngine.dynamics }),
      (newVal) => {
        threshold.value = newVal.threshold
        ratio.value = newVal.ratio
        knee.value = newVal.knee
        attack.value = newVal.attack
        release.value = newVal.release
      },
      { deep: true }
    )
  }

  function applySettings() {
    if (!audioEngine || !audioEngine.updateDynamics) return
    audioEngine.updateDynamics({
      threshold: threshold.value,
      ratio: ratio.value,
      knee: knee.value,
      attack: attack.value,
      release: release.value,
    })
  }

  function toggleDynamics() {
    if (audioEngine && audioEngine.toggleDynamics) {
      audioEngine.toggleDynamics()
      dynamicsEnabled.value = audioEngine.dynamicsEnabled?.value ?? true
    }
  }

  function resetDynamics() {
    threshold.value = DEFAULT_DYNAMICS.threshold
    ratio.value = DEFAULT_DYNAMICS.ratio
    knee.value = DEFAULT_DYNAMICS.knee
    attack.value = DEFAULT_DYNAMICS.attack
    release.value = DEFAULT_DYNAMICS.release
    applySettings()
  }

  onMounted(() => {
    applySettings()
  })
</script>

<style scoped>
  .section {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .params {
    display: flex;
    flex-direction: column;
    gap: 10px;
    transition: opacity 0.2s;
  }

  .params.disabled {
    opacity: 0.4;
    pointer-events: none;
  }

  .param {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .param-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px;
  }

  .param-label {
    font-size: 0.7em;
    font-weight: 500;
    color: var(--text-secondary, #c8c8d5);
  }

  .param-val {
    font-size: 0.65em;
    font-family: 'SF Mono', 'Courier New', monospace;
    font-variant-numeric: tabular-nums;
    color: var(--accent-primary, #00d9ff);
  }

  .param input[type='range'] {
    width: 100%;
    height: 4px;
    margin: 4px 0;
    -webkit-appearance: none;
    appearance: none;
    background: var(--secondary-bg, #1a1a22);
    border-radius: 2px;
    outline: none;
    cursor: pointer;
  }

  .param input[type='range']:focus-visible {
    outline: 2px solid var(--accent-primary, #00d9ff);
    outline-offset: 4px;
  }

  .param input[type='range']::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--accent-primary, #00d9ff);
    cursor: pointer;
    transition: transform 0.2s;
  }

  .param input[type='range']::-webkit-slider-thumb:hover {
    transform: scale(1.2);
  }

  .param input[type='range']::-moz-range-thumb {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--accent-primary, #00d9ff);
    cursor: pointer;
    border: none;
  }

  @media (max-width: 600px) {
    .param input[type='range']::-webkit-slider-thumb {
      width: 16px;
      height: 16px;
    }

    .param input[type='range']::-moz-range-thumb {
      width: 16px;
      height: 16px;
    }
  }
</style>
