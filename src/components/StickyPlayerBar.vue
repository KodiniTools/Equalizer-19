<template>
  <div
    class="sticky-player"
    :class="{ 'drop-active': isDragOver }"
    @dragover.prevent="isDragOver = true"
    @dragleave.prevent="isDragOver = false"
    @drop.prevent="handleDrop"
    role="region"
    :aria-label="currentLanguage === 'de' ? 'Player-Leiste' : 'Player bar'"
  >
    <!-- Hidden file inputs -->
    <input
      type="file"
      ref="fileInput"
      @change="handleFileSelect"
      accept="audio/*"
      multiple
      style="display: none"
    />
    <input
      type="file"
      ref="folderInput"
      @change="handleFileSelect"
      accept="audio/*"
      webkitdirectory
      mozdirectory
      style="display: none"
    />

    <!-- Full-width progress bar at the top edge of the bar -->
    <div
      class="sp-progress"
      :class="{ disabled: !hasTrack }"
      @click="hasTrack && handleProgressClick($event)"
      :title="hasTrack ? t.player_vol_hint : ''"
    >
      <div class="sp-progress-bar">
        <div class="sp-progress-fill" :style="{ width: (hasTrack ? progress : 0) + '%' }"></div>
      </div>
    </div>

    <div class="sp-body">
      <!-- LEFT: Upload + track info -->
      <div class="sp-section sp-left">
        <div class="upload-group">
          <button
            @click="triggerFileSelect"
            class="btn-upload"
            :title="t.player_select_files"
            :aria-label="t.player_select_files"
          >
            <i class="fas fa-file-audio" aria-hidden="true"></i>
          </button>
          <button
            @click="triggerFolderSelect"
            class="btn-upload"
            :title="t.player_select_folder"
            :aria-label="t.player_select_folder"
          >
            <i class="fas fa-folder-open" aria-hidden="true"></i>
          </button>
        </div>

        <div class="track-info" v-if="currentTrack">
          <span class="track-name">{{ currentTrack.name }}</span>
          <span class="track-time">{{ formattedCurrentTime }} / {{ formattedDuration }}</span>
        </div>
        <div class="track-info empty" v-else>
          <span class="track-name">{{
            hasPlaylist ? playlist.length + ' Tracks' : t.player_no_file
          }}</span>
        </div>
      </div>

      <!-- CENTER: Transport controls -->
      <div class="sp-section sp-center">
        <button
          @click="playPrevious"
          :disabled="!canPlayPrevious"
          class="ctrl-btn"
          :title="t.player_prev"
          :aria-label="t.player_prev"
        >
          <i class="fas fa-step-backward" aria-hidden="true"></i>
        </button>

        <button
          @click="togglePlayPause"
          class="ctrl-btn play"
          :title="isPlaying ? t.pause : t.play"
          :aria-label="isPlaying ? t.pause : t.play"
          :aria-pressed="isPlaying"
        >
          <i v-if="isLoading" class="fas fa-spinner fa-spin" aria-hidden="true"></i>
          <i v-else-if="isPlaying" class="fas fa-pause" aria-hidden="true"></i>
          <i v-else class="fas fa-play" aria-hidden="true"></i>
        </button>

        <button @click="stop" class="ctrl-btn" :title="t.stop" :aria-label="t.stop">
          <i class="fas fa-stop" aria-hidden="true"></i>
        </button>

        <button
          @click="playNext"
          :disabled="!canPlayNext"
          class="ctrl-btn"
          :title="t.player_next"
          :aria-label="t.player_next"
        >
          <i class="fas fa-step-forward" aria-hidden="true"></i>
        </button>
      </div>

      <!-- RIGHT: Volume + Recording / Download -->
      <div class="sp-section sp-right">
        <!-- Volume -->
        <div class="volume">
          <button
            @click="toggleMute"
            class="vol-btn"
            :title="t.player_mute"
            :aria-label="t.player_mute"
            :aria-pressed="isMuted"
          >
            <i v-if="isMuted" class="fas fa-volume-mute" aria-hidden="true"></i>
            <i v-else-if="volume > 0.5" class="fas fa-volume-up" aria-hidden="true"></i>
            <i v-else class="fas fa-volume-down" aria-hidden="true"></i>
          </button>
          <input
            type="range"
            min="0"
            max="100"
            :value="volume * 100"
            @input="handleVolumeChange"
            class="vol-slider"
            :title="t.player_vol_hint"
            :aria-label="t.a11y_volume.replace('{val}', Math.round(volume * 100))"
            :aria-valuenow="Math.round(volume * 100)"
            aria-valuemin="0"
            aria-valuemax="100"
          />
        </div>

        <div class="sp-divider" aria-hidden="true"></div>

        <!-- Recording & Download -->
        <div class="recorder">
          <!-- Recording time display -->
          <div class="rec-time" v-if="isRecording" aria-live="assertive" aria-atomic="true">
            <span class="rec-dot" aria-hidden="true"></span>
            <span class="time">{{ formattedRecTime }}</span>
          </div>

          <!-- Format toggle (only when idle) -->
          <div class="format-toggle" v-if="!isRecording && !hasRecording" role="group">
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

          <div class="rec-controls">
            <!-- Record button -->
            <button
              v-if="!isRecording && !hasRecording"
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
        </div>
      </div>
    </div>

    <!-- Drop overlay hint -->
    <div v-if="isDragOver" class="drop-hint" aria-live="polite">
      <i class="fas fa-cloud-upload-alt" aria-hidden="true"></i>
      <span>{{ t.player_drop_hint }}</span>
    </div>
  </div>
</template>

<script setup>
  import { ref, inject, computed } from 'vue'
  import { useOutputRecorder } from '../composables/useOutputRecorder'

  const emit = defineEmits(['files-selected'])

  const { t, currentLanguage } = inject('i18n')
  const audioPlayer = inject('audioPlayer')
  const audioEngine = inject('audioEngine')
  const notify = inject('notify', () => {})

  const fileInput = ref(null)
  const folderInput = ref(null)
  const isDragOver = ref(false)

  // ---- Player (playback) ----
  const {
    playlist,
    currentTrack,
    isPlaying,
    isLoading,
    volume,
    isMuted,
    hasTrack,
    hasPlaylist,
    canPlayNext,
    canPlayPrevious,
    progress,
    formattedCurrentTime,
    formattedDuration,
    addFiles,
    play,
    stop,
    togglePlayPause,
    playNext,
    playPrevious,
    seekToPercent,
    setVolume,
    toggleMute,
  } = audioPlayer

  // ---- Output recorder (record + download) ----
  const {
    isRecording,
    recordingFormat,
    hasRecording,
    recordingTime,
    setAudioEngine,
    startRecording,
    stopRecording,
    downloadRecording,
    setFormat,
    discardRecording,
  } = useOutputRecorder()

  if (audioEngine) {
    setAudioEngine(audioEngine)
  }

  const errorMessage = ref('')

  const formattedRecTime = computed(() => {
    const mins = Math.floor(recordingTime.value / 60)
    const secs = recordingTime.value % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  })

  // ---- File selection / drag & drop ----
  function triggerFileSelect() {
    fileInput.value?.click()
  }

  function triggerFolderSelect() {
    folderInput.value?.click()
  }

  function getAudioFiles(fileList) {
    return Array.from(fileList).filter(
      (f) => f.type.startsWith('audio/') || /\.(mp3|wav|ogg|flac|aac|m4a|opus|webm)$/i.test(f.name)
    )
  }

  async function handleFileSelect(event) {
    const files = getAudioFiles(event.target.files || [])
    if (files.length > 0) {
      const tracks = addFiles(files)
      emit('files-selected', files)
      if (tracks.length > 0) {
        setTimeout(() => play(), 100)
      }
      notify(t.value.player_tracks_added.replace('{count}', files.length), 'success')
    }
    event.target.value = ''
  }

  async function handleDrop(event) {
    isDragOver.value = false
    const files = getAudioFiles(event.dataTransfer.files || [])

    // Also handle directory entries via DataTransferItemList
    if (files.length === 0 && event.dataTransfer.items) {
      const extracted = await extractFilesFromItems(event.dataTransfer.items)
      if (extracted.length > 0) {
        const tracks = addFiles(extracted)
        emit('files-selected', extracted)
        if (tracks.length > 0) setTimeout(() => play(), 100)
        notify(t.value.player_tracks_added.replace('{count}', extracted.length), 'success')
        return
      }
    }

    if (files.length > 0) {
      const tracks = addFiles(files)
      emit('files-selected', files)
      if (tracks.length > 0) setTimeout(() => play(), 100)
      notify(t.value.player_tracks_added.replace('{count}', files.length), 'success')
    }
  }

  async function extractFilesFromItems(items) {
    const files = []
    const promises = []

    for (const item of items) {
      const entry = item.webkitGetAsEntry?.()
      if (entry) {
        promises.push(traverseEntry(entry, files))
      }
    }

    await Promise.all(promises)
    return files.filter((f) => /\.(mp3|wav|ogg|flac|aac|m4a|opus|webm)$/i.test(f.name))
  }

  function traverseEntry(entry, files) {
    return new Promise((resolve) => {
      if (entry.isFile) {
        entry.file((file) => {
          files.push(file)
          resolve()
        }, resolve)
      } else if (entry.isDirectory) {
        const reader = entry.createReader()
        const readAll = () => {
          reader.readEntries(async (entries) => {
            if (entries.length === 0) return resolve()
            await Promise.all(entries.map((e) => traverseEntry(e, files)))
            readAll()
          }, resolve)
        }
        readAll()
      } else {
        resolve()
      }
    })
  }

  function handleProgressClick(event) {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - rect.left
    const percent = (x / rect.width) * 100
    seekToPercent(percent)
  }

  function handleVolumeChange(event) {
    const value = parseInt(event.target.value) / 100
    setVolume(value)
  }

  // ---- Recording / download ----
  function selectFormat(format) {
    setFormat(format)
  }

  async function handleStartRecording() {
    errorMessage.value = ''
    if (!audioEngine) {
      errorMessage.value = t.value.rec_error_engine
      return
    }
    const success = await startRecording()
    if (!success) {
      errorMessage.value = t.value.rec_error_start
      notify(t.value.rec_error_start_long, 'error')
    }
  }

  function handleStopRecording() {
    stopRecording()
  }

  function handleDownload() {
    const success = downloadRecording('audio-export')
    if (!success) {
      errorMessage.value = t.value.rec_download_failed
    }
  }

  function handleNewRecording() {
    discardRecording()
    errorMessage.value = ''
  }
</script>

<style scoped>
  .sticky-player {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1000;
    background: var(--card-bg, #252530);
    border-top: 1px solid var(--border-color, #3a3a48);
    box-shadow: 0 -6px 24px var(--shadow-light, rgba(0, 0, 0, 0.35));
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    transition: border-color 0.2s;
  }

  .sticky-player.drop-active {
    border-top-color: var(--accent-primary, #00d9ff);
    background: color-mix(in srgb, var(--card-bg, #252530) 85%, var(--accent-primary, #00d9ff));
  }

  /* Progress bar spans the full width along the top edge */
  .sp-progress {
    width: 100%;
    padding: 5px 0 3px;
    cursor: pointer;
  }

  .sp-progress.disabled {
    cursor: default;
  }

  .sp-progress-bar {
    height: 4px;
    background: var(--secondary-bg, #1a1a22);
    overflow: hidden;
  }

  .sp-progress-fill {
    height: 100%;
    background: var(--accent-primary, #00d9ff);
    border-radius: 0 2px 2px 0;
    transition: width 0.1s;
  }

  .sp-body {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 8px 16px 10px;
    max-width: 1600px;
    margin: 0 auto;
  }

  .sp-section {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .sp-left {
    flex: 1 1 0;
    min-width: 0;
  }

  .sp-center {
    flex: 0 0 auto;
    justify-content: center;
    gap: 6px;
  }

  .sp-right {
    flex: 1 1 0;
    min-width: 0;
    justify-content: flex-end;
  }

  /* ---- Upload buttons ---- */
  .upload-group {
    display: flex;
    gap: 4px;
    flex-shrink: 0;
  }

  .btn-upload {
    width: 32px;
    height: 32px;
    border: 1px solid var(--border-color, #3a3a48);
    background: var(--secondary-bg, #1a1a22);
    border-radius: 8px;
    color: var(--text-secondary, #c8c8d5);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.85em;
    transition: all 0.2s;
  }

  .btn-upload:hover {
    background: var(--accent-primary, #00d9ff);
    color: var(--on-accent, #000);
    border-color: var(--accent-primary, #00d9ff);
  }

  /* ---- Track info ---- */
  .track-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    overflow: hidden;
    min-width: 0;
  }

  .track-name {
    font-size: 0.78em;
    font-weight: 500;
    color: var(--text-primary, #fff);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .track-time {
    font-size: 0.68em;
    color: var(--text-muted, #8b8b9a);
    font-family: 'SF Mono', 'Courier New', monospace;
  }

  .track-info.empty .track-name {
    color: var(--text-muted, #8b8b9a);
  }

  /* ---- Transport controls ---- */
  .ctrl-btn {
    width: 30px;
    height: 30px;
    border: none;
    border-radius: 6px;
    background: var(--secondary-bg, #1a1a22);
    color: var(--text-secondary, #c8c8d5);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.72em;
    transition: all 0.2s;
  }

  .ctrl-btn:hover:not(:disabled) {
    background: var(--hover-bg, #323240);
    color: var(--text-primary, #fff);
  }

  .ctrl-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .ctrl-btn.play {
    width: 40px;
    height: 40px;
    background: var(--accent-primary, #00d9ff);
    color: var(--on-accent, #000);
    font-size: 0.9em;
  }

  .ctrl-btn.play:hover {
    background: var(--accent-hover, #00c4e6);
    transform: scale(1.05);
  }

  /* ---- Volume ---- */
  .volume {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
  }

  .vol-btn {
    width: 24px;
    height: 24px;
    border: none;
    background: transparent;
    color: var(--text-muted, #8b8b9a);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75em;
    transition: color 0.2s;
  }

  .vol-btn:hover {
    color: var(--text-primary, #fff);
  }

  .vol-slider {
    width: 80px;
    height: 4px;
    -webkit-appearance: none;
    appearance: none;
    background: var(--secondary-bg, #1a1a22);
    border-radius: 2px;
    outline: none;
    cursor: pointer;
  }

  .vol-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--accent-primary, #00d9ff);
    cursor: pointer;
    transition: transform 0.2s;
  }

  .vol-slider::-webkit-slider-thumb:hover {
    transform: scale(1.2);
  }

  .vol-slider::-moz-range-thumb {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--accent-primary, #00d9ff);
    cursor: pointer;
    border: none;
  }

  /* ---- Divider ---- */
  .sp-divider {
    width: 1px;
    height: 26px;
    background: var(--border-color, #3a3a48);
    flex-shrink: 0;
  }

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

  /* ---- Drop hint overlay ---- */
  .drop-hint {
    position: absolute;
    inset: 0;
    background: rgba(0, 217, 255, 0.12);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    color: var(--accent-primary, #00d9ff);
    font-size: 0.9em;
    font-weight: 600;
    pointer-events: none;
    z-index: 5;
  }

  .drop-hint i {
    font-size: 1.4em;
  }

  /* ===== Responsive ===== */
  @media (max-width: 900px) {
    .sp-body {
      flex-wrap: wrap;
      gap: 10px 12px;
    }

    .sp-left {
      order: 1;
      flex: 1 1 100%;
    }

    .sp-center {
      order: 2;
      flex: 0 0 auto;
    }

    .sp-right {
      order: 3;
      flex: 1 1 auto;
    }
  }

  @media (max-width: 600px) {
    .sp-body {
      padding: 8px 10px 10px;
    }

    .sp-right {
      flex-wrap: wrap;
      justify-content: center;
      gap: 8px;
    }

    .sp-divider {
      display: none;
    }

    .vol-slider {
      width: 60px;
    }

    .ctrl-btn {
      width: 34px;
      height: 34px;
    }

    .ctrl-btn.play {
      width: 42px;
      height: 42px;
    }

    .btn-upload {
      width: 34px;
      height: 34px;
    }

    .rec-btn {
      width: 34px;
      height: 34px;
    }
  }

  @media (max-width: 400px) {
    .sp-body {
      gap: 8px;
    }

    .sp-center {
      gap: 4px;
    }
  }

  /* Light theme shadow tweak */
  @media (prefers-color-scheme: light) {
    .sticky-player {
      box-shadow: 0 -4px 18px rgba(0, 0, 0, 0.12);
    }
  }
</style>
