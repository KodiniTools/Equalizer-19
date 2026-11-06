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
          :aria-label="t.a11y_threshold.replace('{val}', String(threshold))"
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
          :aria-label="t.a11y_ratio.replace('{val}', String(ratio))"
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
          :aria-label="t.a11y_knee.replace('{val}', String(knee))"
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

<script setup lang="ts">
  import { ref, onMounted, watch, useId } from 'vue'
  import AppIcon from './AppIcon.vue'
  import { DEFAULT_DYNAMICS } from '../utils/presets'
  import CompressorPresets from './CompressorPresets.vue'
  import { SliderField, UiIconButton, UiPanel } from './ui'
  import { useAudioEngineStore } from '../stores/audioEngine'
  import { injectI18n } from '../composables/useI18n'

  const { t } = injectI18n()
  const audioEngine = useAudioEngineStore()

  // Unique ids linking labels to their controls
  const uid = useId()
  const ID_KEYS = ['preset', 'threshold', 'ratio', 'knee', 'attack', 'release'] as const
  const ids = Object.fromEntries(ID_KEYS.map((k) => [k, `${uid}-${k}`])) as Record<
    (typeof ID_KEYS)[number],
    string
  >

  const threshold = ref(audioEngine.dynamics.threshold)
  const ratio = ref(audioEngine.dynamics.ratio)
  const knee = ref(audioEngine.dynamics.knee)
  const attack = ref(audioEngine.dynamics.attack)
  const release = ref(audioEngine.dynamics.release)
  const dynamicsEnabled = ref(audioEngine.dynamicsEnabled)

  // Watch for external changes (e.g., from presets or undo/redo)
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
  watch(
    () => audioEngine.dynamicsEnabled,
    (enabled) => {
      dynamicsEnabled.value = enabled
    }
  )

  function applySettings(): void {
    audioEngine.updateDynamics({
      threshold: threshold.value,
      ratio: ratio.value,
      knee: knee.value,
      attack: attack.value,
      release: release.value,
    })
  }

  function toggleDynamics(): void {
    audioEngine.toggleDynamics()
    dynamicsEnabled.value = audioEngine.dynamicsEnabled
  }

  function resetDynamics(): void {
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
