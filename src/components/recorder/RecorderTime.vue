<template>
  <div class="rec-time" aria-live="assertive" aria-atomic="true">
    <!-- Recording time display -->
    <span class="rec-dot" aria-hidden="true"></span>
    <span class="time">{{ formatted }}</span>
  </div>
</template>

<script setup>
  import { computed } from 'vue'

  /** Laufende Aufnahmezeit als mm:ss mit pulsierendem Punkt. */
  const props = defineProps({
    seconds: { type: Number, required: true },
  })

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
</style>
