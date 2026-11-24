<template>
  <div class="ui-knob" :class="{ 'ui-knob--disabled': disabled }">
    <div
      :id="knobId"
      ref="knobRef"
      class="ui-knob__dial"
      role="slider"
      :tabindex="disabled ? -1 : 0"
      :aria-label="ariaLabel || label"
      :aria-valuemin="min"
      :aria-valuemax="max"
      :aria-valuenow="modelValue"
      :aria-valuetext="ariaValueText || valueText || undefined"
      :aria-disabled="disabled || undefined"
      :title="title"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
      @keydown="onKeyDown"
      @dblclick="onDblClick"
    >
      <svg class="ui-knob__svg" viewBox="0 0 56 56" aria-hidden="true">
        <!-- Track: 270° arc from 7:30 to 4:30 o'clock -->
        <path class="ui-knob__track" :d="ARC" />
        <!-- Progress: the same arc, drawn only up to the current value -->
        <path
          class="ui-knob__value"
          :d="ARC"
          :style="{
            strokeDasharray: `${ARC_LENGTH}`,
            strokeDashoffset: `${ARC_LENGTH * (1 - ratio)}`,
          }"
        />
      </svg>
      <span class="ui-knob__readout">{{ valueText }}</span>
    </div>
    <label class="ui-knob__label" :for="knobId">{{ label }}</label>
  </div>
</template>

<script setup lang="ts">
  import { computed, ref, useId } from 'vue'

  /**
   * Drehregler (56 px) mit `role="slider"`: Wertebogen über 270°, Anzeige in
   * der Mitte, Label darunter.
   *
   * - `v-model` ist immer eine Zahl zwischen `min` und `max`, gerundet auf `step`.
   * - Ziehen (Maus/Finger) nach oben erhöht, nach unten senkt: `dragRange` Pixel
   *   entsprechen dem ganzen Wertebereich. Pfeiltasten ±`step`, mit Shift oder
   *   Bild auf/ab ±10 Schritte, Pos1/Ende = min/max. Doppelklick setzt `defaultValue`.
   * - `valueText` ist die Anzeige, z. B. "250 ms"; sie geht auch als aria-valuetext
   *   an den Regler, sofern `ariaValueText` nichts anderes sagt.
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
      /** Wert nach Doppelklick (nichts: kein Zurücksetzen) */
      defaultValue?: number | null
      /** Pixel, die dem ganzen Bereich entsprechen */
      dragRange?: number
      disabled?: boolean
      id?: string
      title?: string
      ariaLabel?: string
      ariaValueText?: string
    }>(),
    {
      valueText: '',
      min: 0,
      max: 100,
      step: 1,
      defaultValue: null,
      dragRange: 180,
      disabled: false,
      id: '',
      title: undefined,
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
  const knobId = computed(() => props.id || generatedId)
  const knobRef = ref<HTMLElement | null>(null)

  // Arc geometry: radius 22 around (28, 28), 270° starting at 135° (bottom left)
  const ARC = 'M 12.44 43.56 A 22 22 0 1 1 43.56 43.56'
  const ARC_LENGTH = (2 * Math.PI * 22 * 270) / 360

  const ratio = computed(() => {
    const span = props.max - props.min
    if (span <= 0) return 0
    return Math.max(0, Math.min(1, (props.modelValue - props.min) / span))
  })

  /** Round to the step grid and clamp to [min, max]. */
  function normalize(value: number): number {
    const step = props.step > 0 ? props.step : 1
    const snapped = Math.round((value - props.min) / step) * step + props.min
    // Avoid float noise like 0.30000000000000004
    const decimals = Math.min(10, (String(step).split('.')[1] ?? '').length)
    const clean = Number(snapped.toFixed(decimals))
    return Math.max(props.min, Math.min(props.max, clean))
  }

  function set(value: number, final = false): void {
    const next = normalize(value)
    if (next !== props.modelValue) {
      emit('update:modelValue', next)
      emit('input', next)
    }
    if (final) emit('change', next)
  }

  // ---- Pointer drag: vertical movement, dragRange px = full range ----
  let dragStartY = 0
  let dragStartValue = 0
  let dragging = false

  function onPointerDown(event: PointerEvent): void {
    if (props.disabled || event.button !== 0) return
    dragging = true
    dragStartY = event.clientY
    dragStartValue = props.modelValue
    knobRef.value?.setPointerCapture(event.pointerId)
    knobRef.value?.focus({ preventScroll: true })
    event.preventDefault()
  }

  function onPointerMove(event: PointerEvent): void {
    if (!dragging) return
    const span = props.max - props.min
    const delta = ((dragStartY - event.clientY) / props.dragRange) * span
    set(dragStartValue + delta)
  }

  function onPointerUp(event: PointerEvent): void {
    if (!dragging) return
    dragging = false
    if (knobRef.value?.hasPointerCapture(event.pointerId)) {
      knobRef.value.releasePointerCapture(event.pointerId)
    }
    emit('change', props.modelValue)
  }

  function onDblClick(): void {
    if (props.disabled || props.defaultValue === null) return
    set(props.defaultValue, true)
  }

  // ---- Keyboard ----
  function onKeyDown(event: KeyboardEvent): void {
    if (props.disabled) return
    const step = props.step > 0 ? props.step : 1
    const big = step * 10
    let next: number | null = null
    switch (event.key) {
      case 'ArrowUp':
      case 'ArrowRight':
        next = props.modelValue + (event.shiftKey ? big : step)
        break
      case 'ArrowDown':
      case 'ArrowLeft':
        next = props.modelValue - (event.shiftKey ? big : step)
        break
      case 'PageUp':
        next = props.modelValue + big
        break
      case 'PageDown':
        next = props.modelValue - big
        break
      case 'Home':
        next = props.min
        break
      case 'End':
        next = props.max
        break
      default:
        return
    }
    event.preventDefault()
    set(next, true)
  }
</script>

<style scoped>
  .ui-knob {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    min-width: 0;
  }

  .ui-knob__dial {
    position: relative;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    cursor: ns-resize;
    touch-action: none;
    user-select: none;
    -webkit-user-select: none;
    outline: none;
  }

  .ui-knob__dial:focus-visible {
    outline: 2px solid var(--accent-primary);
    outline-offset: 3px;
  }

  .ui-knob--disabled .ui-knob__dial {
    cursor: not-allowed;
    opacity: 0.5;
  }

  .ui-knob__svg {
    display: block;
    width: 100%;
    height: 100%;
  }

  .ui-knob__track {
    fill: none;
    stroke: var(--secondary-bg);
    stroke-width: 5;
    stroke-linecap: round;
  }

  .ui-knob__value {
    fill: none;
    stroke: var(--accent-primary);
    stroke-width: 5;
    stroke-linecap: round;
    transition: stroke-dashoffset 0.08s linear;
  }

  .ui-knob__readout {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--font-mono);
    font-size: 11px;
    font-variant-numeric: tabular-nums;
    color: var(--text-primary);
    pointer-events: none;
  }

  .ui-knob__label {
    font-size: 11px;
    font-weight: 400;
    color: var(--text-secondary);
    text-align: center;
    white-space: nowrap;
  }

  @media (prefers-reduced-motion: reduce) {
    .ui-knob__value {
      transition: none;
    }
  }
</style>
