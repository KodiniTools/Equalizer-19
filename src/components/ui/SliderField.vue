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
      @change="onChange"
    />
  </div>
</template>

<script setup lang="ts">
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
  const props = withDefaults(
    defineProps<{
      modelValue: number
      label: string
      valueText?: string
      min?: number
      max?: number
      step?: number
      disabled?: boolean
      id?: string
      ariaLabel?: string
      ariaValueText?: string
    }>(),
    {
      valueText: '',
      min: 0,
      max: 100,
      step: 1,
      disabled: false,
      id: '',
      ariaLabel: '',
      ariaValueText: '',
    }
  )

  const emit = defineEmits<{
    'update:modelValue': [value: number]
    input: [value: number]
    change: [value: number]
  }>()

  const generatedId = useId()
  const inputId = computed(() => props.id || generatedId)

  const valueOf = (event: Event): number => Number((event.target as HTMLInputElement).value)

  function onInput(event: Event): void {
    const value = valueOf(event)
    emit('update:modelValue', value)
    emit('input', value)
  }

  function onChange(event: Event): void {
    emit('change', valueOf(event))
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
