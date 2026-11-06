<template>
  <UiButton
    class="ui-icon-button"
    :class="`ui-icon-button--${size}`"
    :variant="variant"
    :size="size"
    :pressed="pressed"
    :round="round"
    :aria-label="label"
    :title="label"
  >
    <slot />
  </UiButton>
</template>

<script setup lang="ts">
  import UiButton from './UiButton.vue'
  import type { UiButtonVariant, UiSize } from './types'

  /**
   * Quadratischer Icon-Button. `label` ist Pflicht und wird zu aria-label und
   * title; ein eigenes `title`-Attribut überschreibt nur den Tooltip.
   * Das Icon (AppIcon) kommt in den Default-Slot.
   */
  withDefaults(
    defineProps<{
      label: string
      variant?: UiButtonVariant
      size?: UiSize
      pressed?: boolean | null
      round?: boolean
    }>(),
    { variant: 'secondary', size: 'sm', pressed: null, round: false }
  )
</script>

<style scoped>
  .ui-icon-button {
    padding: 0;
  }

  .ui-icon-button--sm {
    width: 30px;
  }

  .ui-icon-button--md {
    width: 36px;
  }

  .ui-icon-button--lg {
    width: 44px;
  }

  /* Touch-Ziele: kleine Icon-Buttons wachsen auf Smartphones auf 34 px */
  @media (max-width: 600px) {
    .ui-icon-button--sm {
      width: 34px;
      height: 34px;
    }
  }
</style>
