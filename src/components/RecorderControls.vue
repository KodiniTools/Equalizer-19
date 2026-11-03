<template>
  <div class="recorder">
    <!-- Recording time display -->
    <div v-if="isRecording" class="rec-time" aria-live="assertive" aria-atomic="true">
      <span class="rec-dot" aria-hidden="true"></span>
      <span class="time">{{ formattedRecTime }}</span>
    </div>

    <!-- Format toggle (only when idle) -->
    <div v-if="!isRecording && !hasRecording && !isCounting" class="format-toggle" role="group">
      <button
        :class="['fmt-btn', { active: recordingFormat === 'wav' }]"
        :title="t.rec_format_wav"
        :aria-label="t.rec_format_wav"
        :aria-pressed="recordingFormat === 'wav'"
        @click="selectFormat('wav')"
      >
        WAV
      </button>
      <button
        :class="['fmt-btn', { active: recordingFormat === 'webm' }]"
        :title="t.rec_format_webm"
        :aria-label="t.rec_format_webm"
        :aria-pressed="recordingFormat === 'webm'"
        @click="selectFormat('webm')"
      >
        WebM
      </button>
    </div>

    <!-- WAV bit depth (only for WAV, changeable while idle) -->
    <div
      v-if="recordingFormat === 'wav' && !isRecording && !isCounting"
      class="format-toggle"
      role="group"
      :aria-label="t.rec_bit_depth"
    >
      <button
        v-for="depth in bitDepths"
        :key="depth"
        :class="['fmt-btn', { active: bitDepth === depth }]"
        :title="bitDepthTitle(depth)"
        :aria-label="bitDepthTitle(depth)"
        :aria-pressed="bitDepth === depth"
        @click="setBitDepth(depth)"
      >
        {{ depth === 32 ? '32f' : depth }}
      </button>
    </div>

    <!-- Start delay (countdown before recording starts) -->
    <label v-if="!isRecording && !hasRecording && !isCounting" class="delay" :title="t.rec_delay">
      <AppIcon name="timer" />
      <select
        class="delay-select"
        :value="startDelay"
        :aria-label="t.rec_delay"
        @change="setStartDelay($event.target.value)"
      >
        <option v-for="d in START_DELAYS" :key="d" :value="d">
          {{ d === 0 ? t.rec_delay_none : t.rec_delay_s.replace('{n}', d) }}
        </option>
      </select>
    </label>

    <div class="rec-controls">
      <!-- Countdown running: shows the seconds left, click cancels -->
      <button
        v-if="isCounting"
        class="btn btn-icon btn-sm rec-btn countdown"
        :title="t.rec_countdown_cancel"
        :aria-label="t.rec_countdown_cancel"
        @click="cancelCountdown"
      >
        {{ countdownRemaining }}
      </button>

      <!-- Record button -->
      <button
        v-if="!isRecording && !hasRecording && !isCounting"
        class="btn btn-icon btn-sm rec-btn rec"
        :title="t.rec_start"
        :aria-label="t.rec_start"
        @click="handleStartRecording"
      >
        <AppIcon name="record" />
      </button>

      <!-- Stop recording button -->
      <button
        v-if="isRecording"
        class="btn btn-icon btn-sm rec-btn stop"
        :title="t.stop"
        :aria-label="t.stop"
        @click="handleStopRecording"
      >
        <AppIcon name="stop" />
      </button>

      <!-- Download button -->
      <button
        v-if="hasRecording && !isRecording"
        class="btn btn-icon btn-sm rec-btn download"
        :title="t.download"
        :aria-label="t.download"
        @click="handleDownload"
      >
        <AppIcon name="download" />
      </button>

      <!-- New recording button -->
      <button
        v-if="hasRecording && !isRecording"
        class="btn btn-icon btn-sm rec-btn new"
        :title="t.rec_new"
        :aria-label="t.rec_new"
        @click="handleNewRecording"
      >
        <AppIcon name="redo" />
      </button>
    </div>

    <!-- Error indicator -->
    <div v-if="errorMessage" class="error-dot" :title="errorMessage" role="alert">
      <AppIcon name="alert" />
    </div>

    <!-- Large, centred countdown -->
    <CountdownOverlay
      :remaining="countdownRemaining"
      :total="countdownTotal"
      @cancel="cancelCountdown"
    />

    <!-- Download dialog: custom file name + (where supported) target folder -->
    <DownloadDialog
      :show="showDownloadDialog"
      :default-name="'audio-export'"
      :format="recordingFormat"
      :folder-supported="supportsFolderPicker"
      :saving="isSaving"
      @close="showDownloadDialog = false"
      @confirm="handleConfirmDownload"
    />
  </div>
</template>

<script setup>
  import { ref, inject, computed } from 'vue'
  import AppIcon from './AppIcon.vue'
  import { useOutputRecorder } from '../composables/useOutputRecorder'
  import { useCountdown, START_DELAYS } from '../composables/useCountdown'
  import DownloadDialog from './DownloadDialog.vue'
  import CountdownOverlay from './CountdownOverlay.vue'

  const { t } = inject('i18n')
  const audioEngine = inject('audioEngine')
  const notify = inject('notify', () => {})

  // ---- Output recorder (record + download) ----
  const {
    isRecording,
    recordingFormat,
    bitDepth,
    bitDepths,
    hasRecording,
    recordingTime,
    setAudioEngine,
    startRecording,
    stopRecording,
    saveRecordingAs,
    supportsFolderPicker,
    setFormat,
    setBitDepth,
    discardRecording,
  } = useOutputRecorder()

  if (audioEngine) {
    setAudioEngine(audioEngine)
  }

  // ---- Start delay / countdown ----
  const DELAY_STORAGE_KEY = 'eq19_rec_start_delay'
  const startDelay = ref(loadStartDelay())
  const {
    remaining: countdownRemaining,
    total: countdownTotal,
    isCounting,
    start: startCountdown,
    cancel: cancelCountdown,
  } = useCountdown()

  function loadStartDelay() {
    try {
      const stored = parseInt(localStorage.getItem(DELAY_STORAGE_KEY), 10)
      if (START_DELAYS.includes(stored)) return stored
    } catch {
      // storage unavailable
    }
    return 0
  }

  function setStartDelay(value) {
    const delay = parseInt(value, 10)
    if (!START_DELAYS.includes(delay)) return
    startDelay.value = delay
    try {
      localStorage.setItem(DELAY_STORAGE_KEY, String(delay))
    } catch {
      // storage unavailable
    }
  }

  const errorMessage = ref('')
  const showDownloadDialog = ref(false)
  const isSaving = ref(false)

  const formattedRecTime = computed(() => {
    const mins = Math.floor(recordingTime.value / 60)
    const secs = recordingTime.value % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  })

  function selectFormat(format) {
    setFormat(format)
  }

  function bitDepthTitle(depth) {
    return t.value[`rec_bit_${depth}`] || `${depth} Bit`
  }

  // Record button: start right away or after the chosen countdown
  function handleStartRecording() {
    errorMessage.value = ''
    if (!audioEngine) {
      errorMessage.value = t.value.rec_error_engine
      return
    }
    startCountdown(startDelay.value, beginRecording)
  }

  async function beginRecording() {
    const success = await startRecording()
    if (!success) {
      errorMessage.value = t.value.rec_error_start
      notify(t.value.rec_error_start_long, 'error')
    }
  }

  async function handleStopRecording() {
    await stopRecording()
  }

  function handleDownload() {
    errorMessage.value = ''
    showDownloadDialog.value = true
  }

  async function handleConfirmDownload({ filename }) {
    isSaving.value = true
    try {
      const result = await saveRecordingAs(filename)
      if (result.ok) {
        showDownloadDialog.value = false
        notify(t.value.dl_success, 'success')
        // Saved: clear the take so the record button is back and a new take can start
        discardRecording()
      } else if (result.aborted) {
        // User dismissed the native save dialog — keep it simple, just close.
        showDownloadDialog.value = false
      } else {
        showDownloadDialog.value = false
        errorMessage.value = t.value.rec_download_failed
      }
    } finally {
      isSaving.value = false
    }
  }

  function handleNewRecording() {
    discardRecording()
    errorMessage.value = ''
  }
</script>

<style scoped>
  /* ---- Recorder ---- */
  .recorder {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }

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

  .format-toggle {
    display: flex;
    gap: 2px;
    background: var(--secondary-bg);
    border-radius: 6px;
    padding: 2px;
  }

  .fmt-btn {
    padding: 4px 8px;
    font-size: 11px;
    font-weight: 600;
    border: none;
    background: transparent;
    color: var(--text-muted);
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .fmt-btn:hover {
    color: var(--text-primary);
  }

  .fmt-btn.active {
    background: var(--accent-primary);
    color: var(--on-accent);
  }

  .rec-controls {
    display: flex;
    gap: 6px;
  }

  /* Record / stop / download: global .btn system with a status colour */
  .btn.rec-btn.rec,
  .btn.rec-btn.countdown {
    background: var(--error);
    border-color: var(--error);
    color: #ffffff;
  }

  .btn.rec-btn.rec:hover:not(:disabled) {
    background: color-mix(in srgb, var(--error) 85%, #000);
    border-color: color-mix(in srgb, var(--error) 85%, #000);
  }

  /* Countdown in the bar: seconds left, click cancels */
  .btn.rec-btn.countdown {
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

  /* Start delay select */
  .delay {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    height: 28px;
    padding: 0 4px 0 8px;
    border-radius: 6px;
    background: var(--secondary-bg);
    color: var(--text-muted);
    font-size: 11px;
  }

  .delay-select {
    border: none;
    background: transparent;
    color: var(--text-primary);
    font-size: 1em;
    font-weight: 600;
    cursor: pointer;
    padding: 2px 2px;
  }

  .delay-select:focus-visible {
    outline: 2px solid var(--accent-primary);
    outline-offset: 1px;
    border-radius: 4px;
  }

  .delay-select option {
    background: var(--card-bg);
    color: var(--text-primary);
  }

  .btn.rec-btn.stop {
    background: var(--warning);
    border-color: var(--warning);
    color: #ffffff;
  }

  .btn.rec-btn.stop:hover:not(:disabled) {
    background: color-mix(in srgb, var(--warning) 85%, #000);
    border-color: color-mix(in srgb, var(--warning) 85%, #000);
  }

  .btn.rec-btn.download {
    background: var(--success);
    border-color: var(--success);
    color: #ffffff;
  }

  .btn.rec-btn.download:hover:not(:disabled) {
    background: color-mix(in srgb, var(--success) 85%, #000);
    border-color: color-mix(in srgb, var(--success) 85%, #000);
  }

  .error-dot {
    width: 24px;
    height: 24px;
    background: rgba(239, 68, 68, 0.2);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ef4444;
    font-size: 11px;
    flex-shrink: 0;
  }
</style>
