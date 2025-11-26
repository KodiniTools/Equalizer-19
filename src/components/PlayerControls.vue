<template>
  <div class="player">
    <!-- File upload button -->
    <input
      type="file"
      ref="fileInput"
      @change="handleFileSelect"
      accept="audio/*"
      multiple
      style="display: none"
    />

    <button @click="triggerFileSelect" class="btn-upload" title="Dateien auswählen">
      <i class="fas fa-folder-open"></i>
    </button>

    <!-- Track info -->
    <div class="track-info" v-if="currentTrack">
      <span class="track-name">{{ currentTrack.name }}</span>
      <span class="track-time">{{ formattedCurrentTime }} / {{ formattedDuration }}</span>
    </div>
    <div class="track-info empty" v-else>
      <span class="track-name">{{ hasPlaylist ? playlist.length + ' Tracks' : 'Keine Datei' }}</span>
    </div>

    <!-- Progress bar -->
    <div class="progress-wrap" v-if="hasTrack" @click="handleProgressClick">
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: progress + '%' }"></div>
      </div>
    </div>

    <!-- Control buttons -->
    <div class="controls">
      <button
        @click="playPrevious"
        :disabled="!canPlayPrevious"
        class="ctrl-btn"
        title="Zurück"
      >
        <i class="fas fa-step-backward"></i>
      </button>

      <button
        @click="togglePlayPause"
        class="ctrl-btn play"
        :title="isPlaying ? 'Pause' : 'Abspielen'"
      >
        <i v-if="isLoading" class="fas fa-spinner fa-spin"></i>
        <i v-else-if="isPlaying" class="fas fa-pause"></i>
        <i v-else class="fas fa-play"></i>
      </button>

      <button
        @click="stop"
        class="ctrl-btn"
        title="Stoppen"
      >
        <i class="fas fa-stop"></i>
      </button>

      <button
        @click="playNext"
        :disabled="!canPlayNext"
        class="ctrl-btn"
        title="Weiter"
      >
        <i class="fas fa-step-forward"></i>
      </button>
    </div>

    <!-- Volume -->
    <div class="volume">
      <button @click="toggleMute" class="vol-btn">
        <i v-if="isMuted" class="fas fa-volume-mute"></i>
        <i v-else-if="volume > 0.5" class="fas fa-volume-up"></i>
        <i v-else class="fas fa-volume-down"></i>
      </button>
      <input
        type="range"
        min="0"
        max="100"
        :value="volume * 100"
        @input="handleVolumeChange"
        class="vol-slider"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, inject } from 'vue'

const emit = defineEmits(['files-selected'])

const audioPlayer = inject('audioPlayer')
const notify = inject('notify', () => {})

const fileInput = ref(null)

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
  toggleMute
} = audioPlayer

function triggerFileSelect() {
  fileInput.value?.click()
}

async function handleFileSelect(event) {
  const files = event.target.files
  if (files && files.length > 0) {
    const tracks = addFiles(files)
    emit('files-selected', files)
    if (tracks.length > 0) {
      setTimeout(() => play(), 100)
    }
  }
  event.target.value = ''
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

@media (max-width: 500px) {
  .player {
    padding: 10px;
  }

  .volume {
    width: 100%;
    order: 11;
    margin-left: 0;
  }

  .vol-slider {
    flex: 1;
  }
}
</style>
