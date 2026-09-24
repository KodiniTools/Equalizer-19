<template>
  <Teleport to="body">
    <Transition name="cd-fade">
      <!-- The page stays usable underneath (e.g. to press play); only the card is interactive -->
      <div v-if="remaining > 0" class="cd-layer">
        <div class="cd-card" role="dialog" aria-modal="false" :aria-label="t.rec_countdown_title">
          <p class="cd-title">{{ t.rec_countdown_title }}</p>

          <div class="cd-ring">
            <svg viewBox="0 0 120 120" aria-hidden="true">
              <circle class="cd-track" cx="60" cy="60" :r="RADIUS" />
              <circle
                class="cd-progress"
                cx="60"
                cy="60"
                :r="RADIUS"
                :stroke-dasharray="CIRCUMFERENCE"
                :stroke-dashoffset="dashOffset"
              />
            </svg>
            <!-- key re-triggers the pop animation on every second -->
            <span :key="remaining" class="cd-number" aria-live="assertive" aria-atomic="true">
              {{ remaining }}
            </span>
          </div>

          <button type="button" class="cd-cancel" @click="emit('cancel')">
            {{ t.rec_countdown_cancel }}
          </button>
          <p class="cd-hint">{{ t.rec_countdown_hint }}</p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
  import { computed, inject, watch, onBeforeUnmount } from 'vue'

  const props = defineProps({
    remaining: { type: Number, required: true },
    total: { type: Number, required: true },
  })
  const emit = defineEmits(['cancel'])

  const { t } = inject('i18n')

  const RADIUS = 52
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS

  // Ring empties as the countdown runs (full at start, empty at 0)
  const dashOffset = computed(() => {
    const fraction = props.total > 0 ? props.remaining / props.total : 0
    return CIRCUMFERENCE * (1 - fraction)
  })

  // Escape cancels while the countdown is visible
  function onKeydown(event) {
    if (event.key === 'Escape') {
      event.preventDefault()
      emit('cancel')
    }
  }

  watch(
    () => props.remaining > 0,
    (visible) => {
      if (visible) window.addEventListener('keydown', onKeydown)
      else window.removeEventListener('keydown', onKeydown)
    },
    { immediate: true }
  )

  onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<style scoped>
  .cd-layer {
    position: fixed;
    inset: 0;
    z-index: 1500;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
    background: radial-gradient(
      circle at center,
      color-mix(in srgb, var(--primary-bg, #000) 55%, transparent) 0%,
      transparent 70%
    );
  }

  .cd-card {
    pointer-events: auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
    padding: 28px 36px 22px;
    border-radius: 24px;
    background: var(--card-bg, #252530);
    border: 1px solid var(--border-color, #3a3a48);
    box-shadow: 0 24px 80px rgba(0, 0, 0, 0.35);
  }

  .cd-title {
    margin: 0;
    font-size: 15px;
    font-weight: 700;
    letter-spacing: 0.3px;
    color: var(--text-primary, #fff);
  }

  .cd-ring {
    position: relative;
    width: 180px;
    height: 180px;
  }

  .cd-ring svg {
    width: 100%;
    height: 100%;
    transform: rotate(-90deg);
  }

  .cd-track {
    fill: none;
    stroke: var(--secondary-bg, #1a1a22);
    stroke-width: 8;
  }

  .cd-progress {
    fill: none;
    stroke: var(--error, #ef4444);
    stroke-width: 8;
    stroke-linecap: round;
    transition: stroke-dashoffset 1s linear;
  }

  .cd-number {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 84px;
    font-weight: 800;
    line-height: 1;
    font-variant-numeric: tabular-nums;
    color: var(--text-primary, #fff);
    animation: cd-pop 0.35s ease-out;
  }

  @keyframes cd-pop {
    from {
      transform: scale(1.35);
      opacity: 0.4;
    }
    to {
      transform: scale(1);
      opacity: 1;
    }
  }

  .cd-cancel {
    min-width: 160px;
    height: 40px;
    padding: 0 20px;
    border-radius: 10px;
    border: 1px solid var(--border-color, #3a3a48);
    background: var(--secondary-bg, #1a1a22);
    color: var(--text-primary, #fff);
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: border-color 0.2s;
  }

  .cd-cancel:hover {
    border-color: var(--accent-primary, #00d9ff);
  }

  .cd-cancel:focus-visible {
    outline: 2px solid var(--accent-primary, #00d9ff);
    outline-offset: 3px;
  }

  .cd-hint {
    margin: 0;
    font-size: 12px;
    color: var(--text-muted, #8b8b9a);
  }

  .cd-fade-enter-active,
  .cd-fade-leave-active {
    transition: opacity 0.2s;
  }

  .cd-fade-enter-from,
  .cd-fade-leave-to {
    opacity: 0;
  }

  @media (max-width: 600px) {
    .cd-card {
      padding: 22px 24px 18px;
    }

    .cd-ring {
      width: 140px;
      height: 140px;
    }

    .cd-number {
      font-size: 64px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .cd-number {
      animation: none;
    }

    .cd-progress {
      transition: none;
    }
  }
</style>
