<template>
  <div
    class="player"
    :class="{ 'drop-active': isDragOver }"
    @dragover.prevent="isDragOver = true"
    @dragleave.prevent="isDragOver = false"
    @drop.prevent="handleDrop"
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

    <!-- Upload buttons -->
    <div class="upload-group">
      <button @click="triggerFileSelect" class="btn-upload" :title="t.player_select_files" :aria-label="t.player_select_files">
        <i class="fas fa-file-audio" aria-hidden="true"></i>
      </button>
      <button @click="triggerFolderSelect" class="btn-upload" :title="t.player_select_folder" :aria-label="t.player_select_folder">
        <i class="fas fa-folder-open" aria-hidden="true"></i>
      </button>
    </div>

    <!-- Drop overlay hint -->
    <div v-if="isDragOver" class="drop-hint" aria-live="polite">
      <i class="fas fa-cloud-upload-alt" aria-hidden="true"></i>
      <span>{{ t.player_drop_hint }}</span>
    </div>

    <!-- Track info -->
    <div class="track-info" v-if="currentTrack">
      <span class="track-name">{{ currentTrack.name }}</span>
      <span class="track-time">{{ formattedCurrentTime }} / {{ formattedDuration }}</span>
    </div>
    <div class="track-info empty" v-else>
      <span class="track-name">{{
        hasPlaylist ? playlist.length + ' Tracks' : t.player_no_file
      }}</span>
    </div>

    <!-- Progress bar -->
    <div class="progress-wrap" v-if="hasTrack" @click="handleProgressClick">
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: progress + '%' }"></div>
      </div>
    </div>

    <!-- Control buttons -->
    <div class="controls">
      <button @click="playPrevious" :disabled="!canPlayPrevious" class="ctrl-btn" :title="t.player_prev" :aria-label="t.player_prev">
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

      <button @click="playNext" :disabled="!canPlayNext" class="ctrl-btn" :title="t.player_next" :aria-label="t.player_next">
        <i class="fas fa-step-forward" aria-hidden="true"></i>
      </button>
    </div>

    <!-- Volume -->
    <div class="volume">
      <button @click="toggleMute" class="vol-btn" :title="t.player_mute" :aria-label="t.player_mute" :aria-pressed="isMuted">
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
  </div>
</template>

<script setup>
  import { ref, inject } from 'vue'

  const emit = defineEmits(['files-selected'])

  const { t } = inject('i18n')
  const audioPlayer = inject('audioPlayer')
  const notify = inject('notify', () => {})

  const fileInput = ref(null)
  const folderInput = ref(null)
  const isDragOver = ref(false)

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

  function triggerFileSelect() {
    fileInput.value?.click()
  }

  function triggerFolderSelect() {
    folderInput.value?.click()
  }

  function getAudioFiles(fileList) {
    return Array.from(fileList).filter((f) => f.type.startsWith('audio/') || /\.(mp3|wav|ogg|flac|aac|m4a|opus|webm)$/i.test(f.name))
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
</script>

<style scoped>
  .player {
    background: var(--card-bg, #252530);
    border: 1px solid var(--border-color, #3a3a48);
    border-radius: 12px;
    padding: 12px;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
    position: relative;
    transition: border-color 0.2s;
  }

  .player.drop-active {
    border-color: var(--accent-primary, #00d9ff);
    background: color-mix(in srgb, var(--card-bg, #252530) 85%, var(--accent-primary, #00d9ff));
  }

  .drop-hint {
    position: absolute;
    inset: 0;
    border-radius: 12px;
    background: rgba(0, 217, 255, 0.12);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    color: var(--accent-primary, #00d9ff);
    font-size: 0.85em;
    font-weight: 600;
    pointer-events: none;
    z-index: 5;
  }

  .drop-hint i {
    font-size: 1.4em;
  }

  .upload-group {
    display: flex;
    gap: 4px;
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
    color: #000;
    border-color: var(--accent-primary, #00d9ff);
  }

  .track-info {
    flex: 1;
    min-width: 100px;
    display: flex;
    flex-direction: column;
    gap: 2px;
    overflow: hidden;
  }

  .track-name {
    font-size: 0.75em;
    font-weight: 500;
    color: var(--text-primary, #fff);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .track-time {
    font-size: 0.65em;
    color: var(--text-muted, #8b8b9a);
    font-family: 'SF Mono', 'Courier New', monospace;
  }

  .track-info.empty .track-name {
    color: var(--text-muted, #8b8b9a);
  }

  .progress-wrap {
    width: 100%;
    padding: 4px 0;
    cursor: pointer;
    order: 10;
  }

  .progress-bar {
    height: 4px;
    background: var(--secondary-bg, #1a1a22);
    border-radius: 2px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: var(--accent-primary, #00d9ff);
    border-radius: 2px;
    transition: width 0.1s;
  }

  .controls {
    display: flex;
    gap: 4px;
  }

  .ctrl-btn {
    width: 28px;
    height: 28px;
    border: none;
    border-radius: 6px;
    background: var(--secondary-bg, #1a1a22);
    color: var(--text-secondary, #c8c8d5);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.7em;
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
    width: 36px;
    height: 36px;
    background: var(--accent-primary, #00d9ff);
    color: #000;
    font-size: 0.85em;
  }

  .ctrl-btn.play:hover {
    background: #00c4e6;
    transform: scale(1.05);
  }

  .volume {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-left: auto;
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
    width: 60px;
    height: 4px;
    -webkit-appearance: none;
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

  @media (max-width: 768px) {
    .ctrl-btn {
      width: 32px;
      height: 32px;
      font-size: 0.75em;
    }

    .ctrl-btn.play {
      width: 40px;
      height: 40px;
      font-size: 0.9em;
    }

    .vol-slider {
      width: 50px;
    }
  }

  @media (max-width: 500px) {
    .player {
      padding: 10px;
      gap: 8px;
    }

    .track-info {
      min-width: 80px;
    }

    .track-name {
      font-size: 0.7em;
    }

    .track-time {
      font-size: 0.6em;
    }

    .volume {
      width: 100%;
      order: 11;
      margin-left: 0;
    }

    .vol-slider {
      flex: 1;
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
      width: 36px;
      height: 36px;
    }
  }

  @media (max-width: 400px) {
    .player {
      padding: 8px;
    }

    .controls {
      gap: 3px;
    }
  }
</style>
