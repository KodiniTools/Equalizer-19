<template>
  <div class="select-wrap">
    <select
      :id="id"
      class="preset-select"
      :value="activePreset"
      @change="applyPreset($event.target.value)"
      :aria-label="t.a11y_comp_preset"
    >
      <!-- Shown when the current settings match no preset -->
      <option value="" disabled>{{ t.comp_preset_custom }}</option>
      <optgroup
        v-for="group in COMP_PRESET_GROUPS"
        :key="group.labelKey"
        :label="t[group.labelKey]"
      >
        <option v-for="name in group.presets" :key="name" :value="name">{{ name }}</option>
      </optgroup>
    </select>
    <i class="fas fa-chevron-down select-chevron" aria-hidden="true"></i>
  </div>
</template>

<script setup>
  import { inject, computed } from 'vue'
  import {
    COMP_PRESETS,
    COMP_PRESET_GROUPS,
    compPresetToDynamics,
    findCompPreset,
  } from '../utils/presets'

  defineProps({
    id: { type: String, default: undefined },
  })

  const { t } = inject('i18n')
  const audioEngine = inject('audioEngine')

  // Derived from the engine: shows "Custom" as soon as a parameter is changed manually
  const activePreset = computed(() => findCompPreset(audioEngine?.dynamics))

  function applyPreset(presetName) {
    const preset = COMP_PRESETS[presetName]
    if (!preset || !audioEngine?.updateDynamics) return
    audioEngine.updateDynamics(compPresetToDynamics(preset))
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
    border: 1px solid var(--border-color, #3a3a48);
    border-radius: 8px;
    background: var(--secondary-bg, #1a1a22);
    color: var(--text-primary, #fff);
    font-size: 0.72em;
    font-weight: 500;
    cursor: pointer;
    appearance: none;
    -webkit-appearance: none;
    transition: border-color 0.2s;
  }

  .preset-select:hover {
    border-color: var(--accent-primary, #00d9ff);
  }

  .preset-select:focus-visible {
    outline: 2px solid var(--accent-primary, #00d9ff);
    outline-offset: 1px;
  }

  .preset-select option,
  .preset-select optgroup {
    background: var(--card-bg, #252530);
    color: var(--text-primary, #fff);
  }

  .select-chevron {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 0.6em;
    color: var(--text-muted, #8b8b9a);
    pointer-events: none;
  }

  @media (max-width: 600px) {
    .preset-select {
      height: 36px;
    }
  }
</style>
