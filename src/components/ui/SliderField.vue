<template>
  <div class="slider-field">
    <div class="slider-field__head">
      <label class="slider-field__label" :for="inputId">{{ label }}</label>
      <span class="slider-field__value" aria-hidden="true">{{ valueText }}</span>
    </div>
    <input
      :id="inputId"
      class="ui-range"
      type="range"
      :min="min"
      :max="max"
      :step="step"
      :value="modelValue"
      :disabled="disabled"
      :aria-label="ariaLabel || label"
      :aria-valuetext="ariaValueText || valueText"
      @input="onInput"
      @change="emit('change', Number($event.target.value))"
    />
  </div>
</template>

<script setup>
  import { computed, useId } from 'vue'

  /**
   * Beschrifteter Regler mit Wertanzeige: Label links, formatierter Wert rechts
   * (Mono-Ziffern in Akzentfarbe), darunter der Range-Input.
   *
   * - `v-model` ist immer eine Zahl.
   * - `valueText` ist die Anzeige, z. B. "-30 dB" oder "4:1"; sie geht auch als
   *   aria-valuetext an den Regler, sofern `ariaValueText` nichts anderes sagt.
   * - `ariaLabel` überschreibt das Label für Screenreader (Standard: `label`).
   * - Events: `update:modelValue` und `input` bei jeder Bewegung, `change` beim Loslassen.
   */
  const props = defineProps({
    modelValue: { type: Number, required: true },
    label: { type: String, required: true },
    valueText: { type: String, default: '' },
    min: { type: Number, default: 0 },
    max: { type: Number, default: 100 },
    step: { type: Number, default: 1 },
    disabled: { type: Boolean, default: false },
    id: { type: String, default: '' },
    ariaLabel: { type: String, default: '' },
    ariaValueText: { type: String, default: '' },
  })

  const emit = defineEmits(['update:modelValue', 'input', 'change'])

  const generatedId = useId()
  const inputId = computed(() => props.id || generatedId)

  function onInput(event) {
    const value = Number(event.target.value)
    emit('update:modelValue', value)
    emit('input', value)
  }
</script>

<style scoped src="./range.css"></style>

<style scoped>
  .slider-field {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .slider-field__head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px;
  }

  .slider-field__label {
    font-size: 11px;
    font-weight: 500;
    color: var(--text-secondary);
  }

  .slider-field__value {
    font-size: 11px;
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
    color: var(--accent-primary);
  }
</style>
