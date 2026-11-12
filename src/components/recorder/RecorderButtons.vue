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

    <!-- Pause / resume while recording -->
    <UiIconButton
      v-if="isRecording"
      class="rec-btn pause"
      :class="{ paused: isPaused }"
      :label="isPaused ? t.rec_resume : t.rec_pause"
      @click="isPaused ? emit('resume') : emit('pause')"
    >
      <AppIcon :name="isPaused ? 'record' : 'pause'" />
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

<script setup lang="ts">
  import AppIcon from '../AppIcon.vue'
  import { injectI18n } from '../../composables/useI18n'
  import { UiIconButton } from '../ui'

  /**
   * Aufnahme-Buttons je nach Zustand: Aufnehmen, Countdown abbrechen,
   * Pause/Fortsetzen, Stopp, Download, neue Aufnahme.
   * Emits: start, pause, resume, stop, download, new, cancel-countdown.
   */
  withDefaults(
    defineProps<{
      isRecording?: boolean
      isPaused?: boolean
      hasRecording?: boolean
      isCounting?: boolean
      countdownRemaining?: number
    }>(),
    {
      isRecording: false,
      isPaused: false,
      hasRecording: false,
      isCounting: false,
      countdownRemaining: 0,
    }
  )

  const emit = defineEmits<{
    start: []
    pause: []
    resume: []
    stop: []
    download: []
    new: []
    'cancel-countdown': []
  }>()

  const { t } = injectI18n()
</script>

<style scoped>
  .rec-controls {
    display: flex;
    gap: 6px;
  }

  /* Record / stop / download: UiIconButton with a status colour.
     Pause is neutral while recording and turns red ("continue") when paused. */
  .ui-button.rec-btn.rec,
  .ui-button.rec-btn.countdown,
  .ui-button.rec-btn.pause.paused {
    background: var(--error);
    border-color: var(--error);
    color: #ffffff;
  }

  .ui-button.rec-btn.rec:hover:not(:disabled),
  .ui-button.rec-btn.pause.paused:hover:not(:disabled) {
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
