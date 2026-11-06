<template>
  <div class="eq-header">
    <UiIconButton :pressed="!bypassed" :label="t.a11y_eq_bypass" @click="emit('toggle-bypass')">
      <AppIcon name="power" />
    </UiIconButton>

    <select
      class="preset-select"
      :value="modelValue"
      :aria-label="t.a11y_eq_select_preset"
      @change="onChange($event.target.value)"
    >
      <option value="">Custom</option>
      <optgroup :label="t.eq_builtin_group">
        <option v-for="(_, name) in EQ_PRESETS" :key="name" :value="name">{{ name }}</option>
      </optgroup>
      <optgroup v-if="customPresets.length" :label="t.eq_custom_group">
        <option v-for="p in customPresets" :key="p.id" :value="p.id">{{ p.name }}</option>
      </optgroup>
    </select>

    <!-- Delete custom preset -->
    <UiIconButton
      v-if="isCustomSelected"
      class="delete-btn"
      :label="t.eq_preset_delete"
      @click="emit('delete')"
    >
      <AppIcon name="trash" />
    </UiIconButton>

    <!-- Save preset button -->
    <UiIconButton
      v-if="!saving"
      class="save-btn"
      :label="t.eq_preset_save_title"
      @click="emit('save')"
    >
      <AppIcon name="save" />
    </UiIconButton>

    <UiIconButton class="reset-btn" :label="t.reset" @click="emit('reset')">
      <AppIcon name="undo" />
    </UiIconButton>
  </div>
</template>

<script setup>
  import { computed, inject } from 'vue'
  import AppIcon from '../AppIcon.vue'
  import { EQ_PRESETS } from '../../utils/presets'
  import { isCustomPresetId } from '../../composables/useCustomPresets.js'
  import { UiIconButton } from '../ui'

  /**
   * Kopfzeile des Equalizers: Bypass, Preset-Auswahl (eingebaut + eigene),
   * Löschen/Speichern eigener Presets, Reset. Hält keinen Zustand selbst.
   */
  const props = defineProps({
    /** Gewähltes Preset: Name eines eingebauten, ID eines eigenen oder '' (Custom) */
    modelValue: { type: String, default: '' },
    customPresets: { type: Array, default: () => [] },
    bypassed: { type: Boolean, default: false },
    /** Speichern-Formular offen: blendet den Speichern-Button aus */
    saving: { type: Boolean, default: false },
  })

  const emit = defineEmits([
    'update:modelValue',
    'change',
    'toggle-bypass',
    'delete',
    'save',
    'reset',
  ])

  const { t } = inject('i18n')

  const isCustomSelected = computed(() => isCustomPresetId(props.modelValue))

  // Erst den Wert nach oben geben, dann die Änderung melden (wie v-model + @change)
  function onChange(value) {
    emit('update:modelValue', value)
    emit('change', value)
  }
</script>

<style scoped>
  .eq-header {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 8px;
  }

  .preset-select {
    flex: 1;
    padding: 5px 8px;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    font-size: 11px;
    cursor: pointer;
    background: var(--secondary-bg);
    color: var(--text-secondary);
    transition: all 0.2s ease;
    min-width: 0;
  }

  .preset-select:hover,
  .preset-select:focus {
    border-color: var(--accent-primary);
    outline: none;
  }

  /* Header buttons are UiIconButton; hover colours hint at the action */
  .ui-button.save-btn:hover:not(:disabled),
  .ui-button.reset-btn:hover:not(:disabled) {
    background: var(--accent-primary);
    border-color: var(--accent-primary);
    color: var(--on-accent);
  }

  .ui-button.delete-btn:hover:not(:disabled) {
    background: var(--error);
    border-color: var(--error);
    color: #ffffff;
  }

  @media (max-width: 600px) {
    .eq-header {
      gap: 5px;
    }

    .preset-select {
      font-size: 12px;
      padding: 6px 8px;
    }
  }
</style>
