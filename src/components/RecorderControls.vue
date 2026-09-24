<template>
  <div class="recorder">
    <!-- Recording time display -->
    <div class="rec-time" v-if="isRecording" aria-live="assertive" aria-atomic="true">
      <span class="rec-dot" aria-hidden="true"></span>
      <span class="time">{{ formattedRecTime }}</span>
    </div>

    <!-- Format toggle (only when idle) -->
    <div class="format-toggle" v-if="!isRecording && !hasRecording && !isCounting" role="group">
      <button
        @click="selectFormat('wav')"
        :class="['fmt-btn', { active: recordingFormat === 'wav' }]"
        :title="t.rec_format_wav"
        :aria-label="t.rec_format_wav"
        :aria-pressed="recordingFormat === 'wav'"
      >
        WAV
      </button>
      <button
        @click="selectFormat('webm')"
        :class="['fmt-btn', { active: recordingFormat === 'webm' }]"
        :title="t.rec_format_webm"
        :aria-label="t.rec_format_webm"
        :aria-pressed="recordingFormat === 'webm'"
      >
        WebM
      </button>
    </div>

    <!-- WAV bit depth (only for WAV, changeable while idle) -->
    <div
      class="format-toggle"
      v-if="recordingFormat === 'wav' && !isRecording && !isCounting"
      role="group"
      :aria-label="t.rec_bit_depth"
    >
      <button
        v-for="depth in bitDepths"
        :key="depth"
        @click="setBitDepth(depth)"
        :class="['fmt-btn', { active: bitDepth === depth }]"
        :title="bitDepthTitle(depth)"
        :aria-label="bitDepthTitle(depth)"
        :aria-pressed="bitDepth === depth"
      >
        {{ depth === 32 ? '32f' : depth }}
      </button>
    </div>

    <!-- Start delay (countdown before recording starts) -->
    <label v-if="!isRecording && !hasRecording && !isCounting" class="delay" :title="t.rec_delay">
      <i class="fas fa-stopwatch" aria-hidden="true"></i>
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
        @click="cancelCountdown"
        class="rec-btn countdown"
        :title="t.rec_countdown_cancel"
        :aria-label="t.rec_countdown_cancel"
      >
        {{ countdownRemaining }}
      </button>

      <!-- Record button -->
      <button
        v-if="!isRecording && !hasRecording && !isCounting"
        @click="handleStartRecording"
        class="rec-btn rec"
        :title="t.rec_start"
        :aria-label="t.rec_start"
      >
        <i class="fas fa-circle" aria-hidden="true"></i>
      </button>

      <!-- Stop recording button -->
      <button
        v-if="isRecording"
        @click="handleStopRecording"
        class="rec-btn stop"
        :title="t.stop"
        :aria-label="t.stop"
      >
        <i class="fas fa-stop" aria-hidden="true"></i>
      </button>

      <!-- Download button -->
      <button
        v-if="hasRecording && !isRecording"
        @click="handleDownload"
        class="rec-btn download"
        :title="t.download"
        :aria-label="t.download"
      >
        <i class="fas fa-download" aria-hidden="true"></i>
      </button>

      <!-- New recording button -->
      <button
        v-if="hasRecording && !isRecording"
        @click="handleNewRecording"
        class="rec-btn new"
        :title="t.rec_new"
        :aria-label="t.rec_new"
      >
        <i class="fas fa-redo" aria-hidden="true"></i>
      </button>
    </div>

    <!-- Error indicator -->
    <div v-if="errorMessage" class="error-dot" :title="errorMessage" role="alert">
      <i class="fas fa-exclamation" aria-hidden="true"></i>
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
    } catch (_e) {
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
    } catch (_e) {
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
    font-family: 'SF Mono', 'Courier New', monospace;
    font-size: 0.8em;
    color: var(--text-primary, #fff);
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
    background: var(--secondary-bg, #1a1a22);
    border-radius: 6px;
    padding: 2px;
  }

  .fmt-btn {
    padding: 4px 8px;
    font-size: 0.68em;
    font-weight: 600;
    border: none;
    background: transparent;
    color: var(--text-muted, #8b8b9a);
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .fmt-btn:hover {
    color: var(--text-primary, #fff);
  }

  .fmt-btn.active {
    background: var(--accent-primary, #00d9ff);
    color: var(--on-accent, #000);
  }

  .rec-controls {
    display: flex;
    gap: 6px;
  }

  .rec-btn {
    width: 32px;
    height: 32px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.85em;
    transition: all 0.2s;
  }

  .rec-btn.rec {
    background: #ef4444;
    color: white;
  }

  .rec-btn.rec:hover {
    background: #dc2626;
    transform: scale(1.05);
  }

  /* Countdown in the bar: seconds left, click cancels */
  .rec-btn.countdown {
    background: #ef4444;
    color: white;
    font-size: 0.95em;
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
    background: var(--secondary-bg, #1a1a22);
    color: var(--text-muted, #8b8b9a);
    font-size: 0.7em;
  }

  .delay-select {
    border: none;
    background: transparent;
    color: var(--text-primary, #fff);
    font-size: 1em;
    font-weight: 600;
    cursor: pointer;
    padding: 2px 2px;
  }

  .delay-select:focus-visible {
    outline: 2px solid var(--accent-primary, #00d9ff);
    outline-offset: 1px;
    border-radius: 4px;
  }

  .delay-select option {
    background: var(--card-bg, #252530);
    color: var(--text-primary, #fff);
  }

  .rec-btn.stop {
    background: #f59e0b;
    color: white;
  }

  .rec-btn.stop:hover {
    background: #d97706;
    transform: scale(1.05);
  }

  .rec-btn.download {
    background: #10b981;
    color: white;
  }

  .rec-btn.download:hover {
    background: #059669;
    transform: scale(1.05);
  }

  .rec-btn.new {
    background: var(--secondary-bg, #1a1a22);
    color: var(--text-secondary, #c8c8d5);
    border: 1px solid var(--border-color, #3a3a48);
  }

  .rec-btn.new:hover {
    background: var(--hover-bg, #323240);
    transform: scale(1.05);
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
    font-size: 0.7em;
    flex-shrink: 0;
  }

  @media (max-width: 600px) {
    .rec-btn {
      width: 34px;
      height: 34px;
    }
  }
</style>
