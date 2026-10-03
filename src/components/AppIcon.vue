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

<script setup>
  import { computed } from 'vue'
  import { ICONS } from '../utils/icons.js'

  /**
   * Inline SVG icon from utils/icons.js. Sized in em so it follows the
   * surrounding font size; colour comes from `currentColor`.
   */
  const props = defineProps({
    name: { type: String, required: true },
    size: { type: [String, Number], default: '1em' },
    spin: { type: Boolean, default: false },
  })

  const icon = computed(() => ICONS[props.name] || ICONS.alert)
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
