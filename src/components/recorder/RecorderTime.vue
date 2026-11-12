<template>
  <div class="rec-time" :class="{ paused }" aria-live="assertive" aria-atomic="true">
    <!-- Recording time display; paused: still dot, amber tint, "Paused" label -->
    <span class="rec-dot" aria-hidden="true"></span>
    <span class="time">{{ formatted }}</span>
    <span v-if="paused" class="paused-label">{{ t.rec_paused }}</span>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { injectI18n } from '../../composables/useI18n'

  /**
   * Laufende Aufnahmezeit als mm:ss mit pulsierendem Punkt.
   * `paused` friert den Punkt ein und blendet „Pausiert“ ein.
   */
  const props = withDefaults(defineProps<{ seconds: number; paused?: boolean }>(), {
    paused: false,
  })

  const { t } = injectI18n()

  const formatted = computed(() => {
    const mins = Math.floor(props.seconds / 60)
    const secs = props.seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  })
</script>

<style scoped>
  .rec-time {
    display: flex;
    align-items: center;
    gap: 6px;
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
    font-size: 13px;
    color: var(--text-primary);
    background: rgba(239, 68, 68, 0.15);
    padding: 4px 8px;
    border-radius: 6px;
  }

  .rec-dot {
    width: 8px;
    height: 8px;
    background: #ef4444;
    border-radius: 50%;
    animation: sp-pulse 1s infinite;
  }

  @keyframes sp-pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.4;
    }
  }

  .rec-time .time {
    font-weight: 600;
  }

  .rec-time.paused {
    background: color-mix(in srgb, var(--warning) 18%, transparent);
  }

  .rec-time.paused .rec-dot {
    background: var(--warning);
    animation: none;
  }

  .paused-label {
    font-family: var(--font-sans);
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--warning);
  }
</style>
