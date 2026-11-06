<template>
  <UiPanel icon="sliders" :title="t.dynamics">
    <template #actions>
      <UiIconButton :label="t.reset" @click="resetDynamics">
        <AppIcon name="undo" />
      </UiIconButton>
      <UiIconButton
        :pressed="dynamicsEnabled"
        :label="t.a11y_dynamics_toggle"
        :title="dynamicsEnabled ? t.comp_toggle_off : t.comp_toggle_on"
        @click="toggleDynamics"
      >
        <AppIcon name="power" />
      </UiIconButton>
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
        <SliderField
          :id="ids.threshold"
          v-model="threshold"
          :label="t.threshold"
          :value-text="`${threshold} dB`"
          :min="-60"
          :max="0"
          :step="1"
          :disabled="!dynamicsEnabled"
          :aria-label="t.a11y_threshold.replace('{val}', threshold)"
          @input="applySettings"
        />
        <SliderField
          :id="ids.ratio"
          v-model="ratio"
          :label="t.ratio"
          :value-text="`${ratio}:1`"
          :min="1"
          :max="20"
          :step="0.5"
          :disabled="!dynamicsEnabled"
          :aria-label="t.a11y_ratio.replace('{val}', ratio)"
          @input="applySettings"
        />
        <SliderField
          :id="ids.knee"
          v-model="knee"
          :label="t.knee"
          :value-text="`${knee} dB`"
          :min="0"
          :max="40"
          :step="1"
          :disabled="!dynamicsEnabled"
          :aria-label="t.a11y_knee.replace('{val}', knee)"
          @input="applySettings"
        />
        <SliderField
          :id="ids.attack"
          v-model="attack"
          :label="t.attack"
          :value-text="`${(attack * 1000).toFixed(0)} ms`"
          :min="0"
          :max="1"
          :step="0.001"
          :disabled="!dynamicsEnabled"
          :aria-label="t.a11y_attack.replace('{val}', (attack * 1000).toFixed(0))"
          @input="applySettings"
        />
        <SliderField
          :id="ids.release"
          v-model="release"
          :label="t.release"
          :value-text="`${(release * 1000).toFixed(0)} ms`"
          :min="0"
          :max="1"
          :step="0.01"
          :disabled="!dynamicsEnabled"
          :aria-label="t.a11y_release.replace('{val}', (release * 1000).toFixed(0))"
          @input="applySettings"
        />
      </div>
    </div>
  </UiPanel>
</template>

<script setup>
  import { ref, inject, onMounted, watch, useId } from 'vue'
  import AppIcon from './AppIcon.vue'
  import { DEFAULT_DYNAMICS } from '../utils/presets'
  import CompressorPresets from './CompressorPresets.vue'
  import { SliderField, UiIconButton, UiPanel } from './ui'
  import { useAudioEngineStore } from '../stores/audioEngine'

  const { t } = inject('i18n')
  const audioEngine = useAudioEngineStore()

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
    dynamicsEnabled.value = audioEngine.dynamicsEnabled
  }

  // Watch for external changes (e.g., from presets or undo/redo)
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
  if (audioEngine && audioEngine.dynamicsEnabled) {
    watch(
      () => audioEngine.dynamicsEnabled,
      (enabled) => {
        dynamicsEnabled.value = enabled
      }
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
      dynamicsEnabled.value = audioEngine.dynamicsEnabled
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
</style>
