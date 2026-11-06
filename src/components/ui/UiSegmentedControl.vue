<template>
  <div
    class="ui-segmented"
    :class="[`ui-segmented--${variant}`, `ui-segmented--${size}`, { 'ui-segmented--block': block }]"
    :style="block ? { gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` } : null"
    role="radiogroup"
    :aria-label="label"
  >
    <button
      v-for="(option, index) in options"
      :key="String(option.value)"
      :ref="(el) => setButtonRef(el, index)"
      type="button"
      role="radio"
      class="ui-segmented__option"
      :class="{ 'is-active': option.value === modelValue }"
      :aria-checked="option.value === modelValue"
      :aria-label="option.title"
      :title="option.title"
      :tabindex="index === activeIndex ? 0 : -1"
      :disabled="option.disabled"
      @click="select(index)"
      @keydown="onKeydown($event, index)"
    >
      {{ option.label }}
    </button>
  </div>
</template>

<script setup lang="ts">
  import { computed, ref, type ComponentPublicInstance } from 'vue'
  import type { UiSegmentedOption, UiSegmentedVariant, UiSize } from './types'

  /**
   * Segmented Control nach dem Radiogroup-Muster: genau eine Option ist gewählt,
   * Pfeiltasten wechseln und wählen, Tab springt als Ganzes hinein und hinaus.
   *
   * options: [{ value, label, title?, disabled? }]; `title` wird zusätzlich aria-label.
   * variant: accent (gewählt = Akzentfläche) | surface (gewählt = Kartenfläche mit Schatten)
   * size: sm (kompakt, ohne Rahmen) | md (28 px) | lg (32 px)
   * block: füllt die Breite, alle Optionen gleich breit (sonst inline, so breit wie der Inhalt)
   */
  const props = withDefaults(
    defineProps<{
      options: readonly UiSegmentedOption[]
      modelValue: string | number
      label?: string
      variant?: UiSegmentedVariant
      size?: UiSize
      block?: boolean
    }>(),
    { label: undefined, variant: 'accent', size: 'md', block: false }
  )

  const emit = defineEmits<{ 'update:modelValue': [value: string | number] }>()

  const buttons = ref<HTMLButtonElement[]>([])

  function setButtonRef(el: Element | ComponentPublicInstance | null, index: number): void {
    if (el instanceof HTMLButtonElement) buttons.value[index] = el
  }

  const activeIndex = computed(() => {
    const index = props.options.findIndex((option) => option.value === props.modelValue)
    return index === -1 ? 0 : index
  })

  function select(index: number): void {
    const option = props.options[index]
    if (!option || option.disabled) return
    if (option.value !== props.modelValue) emit('update:modelValue', option.value)
    buttons.value[index]?.focus()
  }

  function step(from: number, direction: 1 | -1): number {
    const count = props.options.length
    let index = from
    for (let i = 0; i < count; i++) {
      index = (index + direction + count) % count
      if (!props.options[index]?.disabled) return index
    }
    return from
  }

  function firstEnabled(): number {
    const index = props.options.findIndex((option) => !option.disabled)
    return index === -1 ? 0 : index
  }

  function lastEnabled(): number {
    for (let index = props.options.length - 1; index >= 0; index--) {
      if (!props.options[index]?.disabled) return index
    }
    return 0
  }

  function onKeydown(event: KeyboardEvent, index: number): void {
    const targets: Record<string, () => number> = {
      ArrowRight: () => step(index, 1),
      ArrowDown: () => step(index, 1),
      ArrowLeft: () => step(index, -1),
      ArrowUp: () => step(index, -1),
      Home: firstEnabled,
      End: lastEnabled,
    }
    const target = targets[event.key]
    if (!target) return
    event.preventDefault()
    select(target())
  }
</script>

<style scoped>
  .ui-segmented {
    display: inline-flex;
    gap: 2px;
    padding: 2px;
    box-sizing: border-box;
    max-width: 100%;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    background: var(--secondary-bg);
  }

  .ui-segmented--block {
    display: grid;
  }

  .ui-segmented__option {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 28px;
    min-width: 0;
    padding: 0 6px;
    border: none;
    border-radius: 6px;
    background: transparent;
    color: var(--text-muted);
    font-family: inherit;
    line-height: normal;
    font-size: 11px;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    cursor: pointer;
    transition:
      background 0.2s,
      color 0.2s;
  }

  .ui-segmented__option:hover:not(:disabled) {
    color: var(--text-primary);
  }

  .ui-segmented__option:focus-visible {
    outline: 2px solid var(--accent-primary);
    outline-offset: 1px;
  }

  .ui-segmented__option:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Varianten */
  .ui-segmented--accent .ui-segmented__option.is-active {
    background: var(--accent-primary);
    color: var(--on-accent);
  }

  .ui-segmented--surface .ui-segmented__option {
    color: var(--text-secondary);
  }

  .ui-segmented--surface .ui-segmented__option.is-active {
    background: var(--card-bg);
    color: var(--text-primary);
    box-shadow: 0 1px 2px var(--shadow-raised);
  }

  /* Größen */
  .ui-segmented--sm {
    border: none;
    border-radius: 6px;
  }

  .ui-segmented--sm .ui-segmented__option {
    height: 20px;
    padding: 0 8px;
    border-radius: 4px;
  }

  .ui-segmented--lg {
    padding: 3px;
    border-radius: 10px;
  }

  .ui-segmented--lg .ui-segmented__option {
    height: 32px;
    padding: 0 8px;
    border-radius: 7px;
    font-size: 13px;
  }
</style>
