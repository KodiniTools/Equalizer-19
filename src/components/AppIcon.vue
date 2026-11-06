<template>
  <svg
    class="icon"
    :class="{ 'icon-spin': spin }"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    :fill="icon.fill ? 'currentColor' : 'none'"
    :stroke="icon.fill ? 'none' : 'currentColor'"
    :stroke-width="icon.width || 2.2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <path :d="icon.d" />
  </svg>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { ICONS, isIconName, type IconDefinition } from '../utils/icons'

  /**
   * Inline SVG icon from utils/icons.ts. Sized in em so it follows the
   * surrounding font size; colour comes from `currentColor`.
   * Unknown names fall back to the `alert` icon.
   */
  const props = withDefaults(
    defineProps<{
      name: string
      size?: string | number
      spin?: boolean
    }>(),
    { size: '1em', spin: false }
  )

  const icon = computed<IconDefinition>(() =>
    isIconName(props.name) ? ICONS[props.name] : ICONS.alert
  )
</script>

<style scoped>
  .icon {
    display: inline-block;
    flex-shrink: 0;
    vertical-align: -0.15em;
  }

  .icon-spin {
    animation: icon-spin 0.8s linear infinite;
  }

  @keyframes icon-spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .icon-spin {
      animation-duration: 2s;
    }
  }
</style>
