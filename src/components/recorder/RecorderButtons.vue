<template>
  <div class="rec-controls">
    <!-- Countdown running: shows the seconds left, click cancels -->
    <UiIconButton
      v-if="isCounting"
      class="rec-btn countdown"
      :label="t.rec_countdown_cancel"
      @click="emit('cancel-countdown')"
    >
      {{ countdownRemaining }}
    </UiIconButton>

    <!-- Record button -->
    <UiIconButton
      v-if="!isRecording && !hasRecording && !isCounting"
      class="rec-btn rec"
      :label="t.rec_start"
      @click="emit('start')"
    >
      <AppIcon name="record" />
    </UiIconButton>

    <!-- Stop recording button -->
    <UiIconButton v-if="isRecording" class="rec-btn stop" :label="t.stop" @click="emit('stop')">
      <AppIcon name="stop" />
    </UiIconButton>

    <!-- Download button -->
    <UiIconButton
      v-if="hasRecording && !isRecording"
      class="rec-btn download"
      :label="t.download"
      @click="emit('download')"
    >
      <AppIcon name="download" />
    </UiIconButton>

    <!-- New recording button -->
    <UiIconButton
      v-if="hasRecording && !isRecording"
      class="rec-btn new"
      :label="t.rec_new"
      @click="emit('new')"
    >
      <AppIcon name="redo" />
    </UiIconButton>
  </div>
</template>

<script setup>
  import { inject } from 'vue'
  import AppIcon from '../AppIcon.vue'
  import { UiIconButton } from '../ui'

  /**
   * Aufnahme-Buttons je nach Zustand: Aufnehmen, Countdown abbrechen, Stopp,
   * Download, neue Aufnahme. Emits: start, stop, download, new, cancel-countdown.
   */
  defineProps({
    isRecording: { type: Boolean, default: false },
    hasRecording: { type: Boolean, default: false },
    isCounting: { type: Boolean, default: false },
    countdownRemaining: { type: Number, default: 0 },
  })

  const emit = defineEmits(['start', 'stop', 'download', 'new', 'cancel-countdown'])

  const { t } = inject('i18n')
</script>

<style scoped>
  .rec-controls {
    display: flex;
    gap: 6px;
  }

  /* Record / stop / download: UiIconButton with a status colour */
  .ui-button.rec-btn.rec,
  .ui-button.rec-btn.countdown {
    background: var(--error);
    border-color: var(--error);
    color: #ffffff;
  }

  .ui-button.rec-btn.rec:hover:not(:disabled) {
    background: color-mix(in srgb, var(--error) 85%, #000);
    border-color: color-mix(in srgb, var(--error) 85%, #000);
  }

  /* Countdown in the bar: seconds left, click cancels */
  .ui-button.rec-btn.countdown {
    font-size: 15px;
    font-weight: 800;
    font-variant-numeric: tabular-nums;
    animation: rec-countdown-pulse 1s infinite;
  }

  @keyframes rec-countdown-pulse {
    50% {
      box-shadow: 0 0 0 6px rgba(239, 68, 68, 0.25);
    }
  }

  .ui-button.rec-btn.stop {
    background: var(--warning);
    border-color: var(--warning);
    color: #ffffff;
  }

  .ui-button.rec-btn.stop:hover:not(:disabled) {
    background: color-mix(in srgb, var(--warning) 85%, #000);
    border-color: color-mix(in srgb, var(--warning) 85%, #000);
  }

  .ui-button.rec-btn.download {
    background: var(--success);
    border-color: var(--success);
    color: #ffffff;
  }

  .ui-button.rec-btn.download:hover:not(:disabled) {
    background: color-mix(in srgb, var(--success) 85%, #000);
    border-color: color-mix(in srgb, var(--success) 85%, #000);
  }
</style>
