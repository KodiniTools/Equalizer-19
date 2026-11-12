<template>
  <div class="recorder">
    <RecorderTime v-if="isRecording" :seconds="recordingTime" :paused="isPaused" />

    <RecorderSettings
      :format="recordingFormat"
      :bit-depth="bitDepth"
      :bit-depths="bitDepths"
      :start-delay="startDelay"
      :idle="!isRecording && !isCounting"
      :has-recording="hasRecording"
      @update:format="setFormat"
      @update:bit-depth="setBitDepth"
      @update:start-delay="setStartDelay"
    />

    <RecorderButtons
      :is-recording="isRecording"
      :is-paused="isPaused"
      :has-recording="hasRecording"
      :is-counting="isCounting"
      :countdown-remaining="countdownRemaining"
      @start="handleStartRecording"
      @pause="pauseRecording"
      @resume="resumeRecording"
      @stop="handleStopRecording"
      @download="handleDownload"
      @new="handleNewRecording"
      @cancel-countdown="cancelCountdown"
    />

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

<script setup lang="ts">
  import { ref } from 'vue'
  import AppIcon from './AppIcon.vue'
  import { useOutputRecorder } from '../composables/useOutputRecorder'
  import { useCountdown, START_DELAYS } from '../composables/useCountdown'
  import RecorderTime from './recorder/RecorderTime.vue'
  import RecorderSettings from './recorder/RecorderSettings.vue'
  import RecorderButtons from './recorder/RecorderButtons.vue'
  import DownloadDialog from './recorder/DownloadDialog.vue'
  import CountdownOverlay from './recorder/CountdownOverlay.vue'
  import { useAudioEngineStore } from '../stores/audioEngine'
  import { useToastStore } from '../stores/toast'
  import { injectI18n } from '../composables/useI18n'

  /**
   * Container für Aufnahme und Download in der Player-Leiste: verbindet
   * useOutputRecorder und useCountdown mit den Teilen in components/recorder/.
   */
  const { t } = injectI18n()
  const audioEngine = useAudioEngineStore()
  const { notify } = useToastStore()

  // ---- Output recorder (record + download) ----
  const {
    isRecording,
    isPaused,
    recordingFormat,
    bitDepth,
    bitDepths,
    hasRecording,
    recordingTime,
    setAudioEngine,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    saveRecordingAs,
    supportsFolderPicker,
    setFormat,
    setBitDepth,
    discardRecording,
  } = useOutputRecorder()

  setAudioEngine(audioEngine)

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

  function loadStartDelay(): number {
    try {
      const stored = parseInt(localStorage.getItem(DELAY_STORAGE_KEY) ?? '', 10)
      if (START_DELAYS.includes(stored)) return stored
    } catch {
      // storage unavailable
    }
    return 0
  }

  function setStartDelay(delay: number): void {
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

  // Record button: start right away or after the chosen countdown
  function handleStartRecording(): void {
    errorMessage.value = ''
    startCountdown(startDelay.value, beginRecording)
  }

  async function beginRecording(): Promise<void> {
    const success = await startRecording()
    if (!success) {
      errorMessage.value = t.value.rec_error_start
      notify(t.value.rec_error_start_long, 'error')
    }
  }

  async function handleStopRecording(): Promise<void> {
    await stopRecording()
  }

  function handleDownload(): void {
    errorMessage.value = ''
    showDownloadDialog.value = true
  }

  async function handleConfirmDownload({ filename }: { filename: string }): Promise<void> {
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

  function handleNewRecording(): void {
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
