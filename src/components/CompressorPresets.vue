<template>
  <div class="select-wrap">
    <select
      :id="id"
      class="preset-select"
      :value="activePreset"
      :aria-label="t.a11y_comp_preset"
      @change="onPresetChange"
    >
      <!-- Shown when the current settings match no preset -->
      <option value="" disabled>{{ t.comp_preset_custom }}</option>
      <optgroup
        v-for="group in COMP_PRESET_GROUPS"
        :key="group.labelKey"
        :label="t[group.labelKey] ?? group.labelKey"
      >
        <option v-for="name in group.presets" :key="name" :value="name">{{ name }}</option>
      </optgroup>
    </select>
    <AppIcon name="chevron-down" class="select-chevron" />
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import AppIcon from './AppIcon.vue'
  import {
    COMP_PRESETS,
    COMP_PRESET_GROUPS,
    compPresetToDynamics,
    findCompPreset,
  } from '../utils/presets'
  import { useAudioEngineStore } from '../stores/audioEngine'
  import { injectI18n } from '../composables/useI18n'

  withDefaults(defineProps<{ id?: string }>(), { id: undefined })

  const { t } = injectI18n()
  const audioEngine = useAudioEngineStore()

  // Derived from the engine: shows "Custom" as soon as a parameter is changed manually
  const activePreset = computed(() => findCompPreset(audioEngine.dynamics))

  function applyPreset(presetName: string): void {
    const preset = COMP_PRESETS[presetName]
    if (!preset) return
    audioEngine.updateDynamics(compPresetToDynamics(preset))
  }

  function onPresetChange(event: Event): void {
    applyPreset((event.target as HTMLSelectElement).value)
  }
</script>

<style scoped>
  .select-wrap {
    position: relative;
  }

  .preset-select {
    width: 100%;
    height: 32px;
    padding: 0 30px 0 10px;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    background: var(--secondary-bg);
    color: var(--text-primary);
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    appearance: none;
    -webkit-appearance: none;
    transition: border-color 0.2s;
  }

  .preset-select:hover {
    border-color: var(--accent-primary);
  }

  .preset-select:focus-visible {
    outline: 2px solid var(--accent-primary);
    outline-offset: 1px;
  }

  .preset-select option,
  .preset-select optgroup {
    background: var(--card-bg);
    color: var(--text-primary);
  }

  .select-chevron {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    width: 12px;
    height: 12px;
    color: var(--text-muted);
    pointer-events: none;
  }

  @media (max-width: 600px) {
    .preset-select {
      height: 36px;
    }
  }
</style>
