<template>
  <label class="ui-switch" :class="{ 'ui-switch--disabled': disabled }" :for="inputId">
    <input
      :id="inputId"
      class="ui-switch__input"
      type="checkbox"
      role="switch"
      :checked="modelValue"
      :disabled="disabled"
      :aria-checked="modelValue"
      @change="onChange"
    />
    <span class="ui-switch__track" aria-hidden="true"></span>
    <span class="ui-switch__label" :class="{ 'sr-only': labelHidden }">{{ label }}</span>
  </label>
</template>

<script setup lang="ts">
  import { computed, useId } from 'vue'

  /**
   * Schiebeschalter An/Aus (32 × 18 px) mit `role="switch"`. Das Label ist Pflicht
   * und steht rechts; mit `labelHidden` bleibt es nur für Screenreader.
   * Weitere Attribute (title, class) landen auf dem <label>.
   */
  const props = withDefaults(
    defineProps<{
      modelValue: boolean
      label: string
      labelHidden?: boolean
      disabled?: boolean
      id?: string
    }>(),
    { labelHidden: false, disabled: false, id: '' }
  )

  const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

  const generatedId = useId()
  const inputId = computed(() => props.id || generatedId)

  function onChange(event: Event): void {
    emit('update:modelValue', (event.target as HTMLInputElement).checked)
  }
</script>

<style scoped>
  .ui-switch {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    width: fit-content;
  }

  .ui-switch__input {
    position: absolute;
    opacity: 0;
    width: 1px;
    height: 1px;
    margin: 0;
  }

  .ui-switch__track {
    position: relative;
    flex-shrink: 0;
    width: 32px;
    height: 18px;
    border-radius: 999px;
    background: var(--secondary-bg);
    border: 1px solid var(--border-color);
    transition: background 0.2s;
  }

  .ui-switch__track::after {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--text-muted);
    transition:
      transform 0.2s,
      background 0.2s;
  }

  .ui-switch__input:checked + .ui-switch__track {
    background: var(--accent-primary);
    border-color: var(--accent-primary);
  }

  .ui-switch__input:checked + .ui-switch__track::after {
    transform: translateX(14px);
    background: var(--on-accent);
  }

  .ui-switch__input:focus-visible + .ui-switch__track {
    outline: 2px solid var(--accent-primary);
    outline-offset: 2px;
  }

  .ui-switch--disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  .ui-switch__label {
    font-size: 12px;
    font-weight: 600;
    color: var(--text-primary);
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
</style>
