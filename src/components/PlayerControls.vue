<template>
  <div class="player-controls">
    <div class="player-header">
      <h3>
        <i class="fas fa-play-circle"></i>
        {{ t('player.title') }}
      </h3>
    </div>

    <!-- File Upload -->
    <div class="upload-section">
      <input
        type="file"
        ref="fileInput"
        @change="handleFileSelect"
        accept="audio/*"
        multiple
        style="display: none"
      />
      
      <button @click="triggerFileSelect" class="btn-upload">
        <i class="fas fa-folder-open"></i>
        <span>{{ t('player.selectFiles') }}</span>
      </button>

      <div v-if="hasPlaylist" class="file-info">
        <i class="fas fa-music"></i>
        {{ playlist.length }} {{ t('player.tracks') }}
      </div>
    </div>

    <!-- Current Track Display -->
    <div v-if="currentTrack" class="current-track">
      <div class="track-info">
        <i class="fas fa-file-audio"></i>
        <div class="track-details">
          <div class="track-name">{{ currentTrack.name }}</div>
          <div class="track-meta">
            {{ formatFileSize(currentTrack.size) }} • {{ currentTrack.type }}
          </div>
        </div>
      </div>
    </div>

    <!-- Playback Controls -->
    <div v-if="hasTrack" class="playback-controls">
      <!-- Time Display -->
      <div class="time-display">
        <span class="time-current">{{ formattedCurrentTime }}</span>
        <span class="time-separator">/</span>
        <span class="time-duration">{{ formattedDuration }}</span>
      </div>

      <!-- Progress Bar -->
      <div class="progress-bar-container" @click="handleProgressClick">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progress + '%' }"></div>
          <div class="progress-handle" :style="{ left: progress + '%' }"></div>
        </div>
      </div>

      <!-- Control Buttons -->
      <div class="control-buttons">
        <button 
          @click="playPrevious"
          :disabled="!canPlayPrevious"
          class="btn-control"
          :title="t('player.previous')"
        >
          <i class="fas fa-step-backward"></i>
        </button>

        <button 
          @click="togglePlayPause"
          class="btn-control btn-play-pause"
          :title="isPlaying ? t('player.pause') : t('player.play')"
        >
          <i v-if="isLoading" class="fas fa-spinner fa-spin"></i>
          <i v-else-if="isPlaying" class="fas fa-pause"></i>
          <i v-else class="fas fa-play"></i>
        </button>

        <button 
          @click="stop"
          class="btn-control"
          :title="t('player.stop')"
        >
          <i class="fas fa-stop"></i>
        </button>

        <button 
          @click="playNext"
          :disabled="!canPlayNext"
          class="btn-control"
          :title="t('player.next')"
        >
          <i class="fas fa-step-forward"></i>
        </button>
      </div>

      <!-- Volume Control -->
      <div class="volume-control">
        <button @click="toggleMute" class="btn-volume">
          <i v-if="isMuted" class="fas fa-volume-mute"></i>
          <i v-else-if="volume > 0.5" class="fas fa-volume-up"></i>
          <i v-else-if="volume > 0" class="fas fa-volume-down"></i>
          <i v-else class="fas fa-volume-off"></i>
        </button>
        
        <input
          type="range"
          min="0"
          max="100"
          :value="volume * 100"
          @input="handleVolumeChange"
          class="volume-slider"
        />
        
        <span class="volume-value">{{ Math.round(volume * 100) }}%</span>
      </div>
    </div>

    <!-- Error Display -->
    <div v-if="error" class="error-message">
      <i class="fas fa-exclamation-triangle"></i>
      {{ error }}
    </div>

    <!-- Empty State -->
    <div v-if="!hasPlaylist" class="empty-state">
      <i class="fas fa-music"></i>
      <p>{{ t('player.noFiles') }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, inject, computed } from 'vue'

const emit = defineEmits(['files-selected'])

// Get dependencies from parent
const i18n = inject('i18n', { 
  t: (key) => key,
  currentLanguage: ref('de')
})
const audioPlayer = inject('audioPlayer')
const audioEngine = inject('audioEngine')
const notify = inject('notify', () => {})

// Fallback translations if i18n not available
const translations = {
  de: {
    'player.title': 'Audio Player',
    'player.selectFiles': 'Dateien auswählen',
    'player.tracks': 'Track(s)',
    'player.noFiles': 'Keine Dateien ausgewählt',
    'player.play': 'Abspielen',
    'player.pause': 'Pause',
    'player.stop': 'Stoppen',
    'player.previous': 'Zurück',
    'player.next': 'Weiter'
  },
  en: {
    'player.title': 'Audio Player',
    'player.selectFiles': 'Select Files',
    'player.tracks': 'Track(s)',
    'player.noFiles': 'No files selected',
    'player.play': 'Play',
    'player.pause': 'Pause',
    'player.stop': 'Stop',
    'player.previous': 'Previous',
    'player.next': 'Next'
  }
}

const t = (key) => {
  const lang = i18n.currentLanguage?.value || 'de'
  return translations[lang]?.[key] || key
}

const fileInput = ref(null)

// Get audio player state
const {
  playlist,
  currentTrack,
  isPlaying,
  isPaused,
  isLoading,
  currentTime,
  duration,
  volume,
  isMuted,
  error,
  hasTrack,
  hasPlaylist,
  canPlayNext,
  canPlayPrevious,
  progress,
  formattedCurrentTime,
  formattedDuration,
  addFiles,
  play,
  pause,
  stop,
  togglePlayPause,
  playNext,
  playPrevious,
  seekToPercent,
  setVolume,
  toggleMute
} = audioPlayer

// File handling
function triggerFileSelect() {
  fileInput.value?.click()
}

async function handleFileSelect(event) {
  const files = event.target.files
  if (files && files.length > 0) {
    const tracks = addFiles(files)
    
    notify(
      `${files.length} ${t('player.tracks')} hinzugefügt`,
      'success'
    )
    
    emit('files-selected', files)
    
    // Auto-play first track
    if (tracks.length > 0) {
      setTimeout(() => {
        play()
      }, 100)
    }
  }
  
  // Reset input
  event.target.value = ''
}

// Progress bar handling
function handleProgressClick(event) {
  const rect = event.currentTarget.getBoundingClientRect()
  const x = event.clientX - rect.left
  const percent = (x / rect.width) * 100
  seekToPercent(percent)
}

// Volume handling
function handleVolumeChange(event) {
  const value = parseInt(event.target.value) / 100
  setVolume(value)
}

// Utility
function formatFileSize(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}
</script>

<style scoped>
.player-controls {
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  border-radius: 20px;
  padding: 25px;
  margin-bottom: 25px;
  color: white;
  box-shadow: 0 10px 40px rgba(30, 60, 114, 0.3);
  transition: all 0.3s ease;
}

.player-controls:hover {
  box-shadow: 0 15px 50px rgba(30, 60, 114, 0.4);
  transform: translateY(-2px);
}

.player-header {
  margin-bottom: 20px;
}

.player-header h3 {
  margin: 0;
  font-size: 1.4em;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;
}

.upload-section {
  display: flex;
  gap: 15px;
  align-items: center;
  margin-bottom: 20px;
}

.btn-upload {
  flex: 1;
  padding: 15px 20px;
  background: linear-gradient(135deg, #00d4ff 0%, #0099cc 100%);
  border: none;
  border-radius: 12px;
  color: white;
  font-size: 1em;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 212, 255, 0.3);
}

.btn-upload:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(0, 212, 255, 0.5);
}

.btn-upload i {
  font-size: 1.2em;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.2);
  padding: 10px 15px;
  border-radius: 10px;
  font-size: 0.95em;
  font-weight: 500;
  backdrop-filter: blur(10px);
}

.current-track {
  background: rgba(255, 255, 255, 0.1);
  padding: 15px;
  border-radius: 12px;
  margin-bottom: 20px;
  backdrop-filter: blur(10px);
}

.track-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.track-info > i {
  font-size: 2em;
  color: #00d4ff;
}

.track-details {
  flex: 1;
  min-width: 0;
}

.track-name {
  font-weight: 600;
  font-size: 1.1em;
  margin-bottom: 5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.track-meta {
  font-size: 0.85em;
  opacity: 0.8;
}

.playback-controls {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.time-display {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  font-family: 'Courier New', monospace;
  font-size: 1.1em;
  font-weight: 600;
}

.time-separator {
  opacity: 0.5;
}

.progress-bar-container {
  padding: 10px 0;
  cursor: pointer;
}

.progress-bar {
  position: relative;
  height: 8px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  overflow: visible;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #00d4ff 0%, #0099cc 100%);
  border-radius: 10px;
  transition: width 0.1s ease;
}

.progress-handle {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 18px;
  height: 18px;
  background: white;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  transition: left 0.1s ease;
  pointer-events: none;
}

.progress-bar-container:hover .progress-handle {
  transform: translate(-50%, -50%) scale(1.3);
}

.control-buttons {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
}

.btn-control {
  width: 50px;
  height: 50px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  font-size: 1.2em;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.btn-control:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}

.btn-control:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.btn-play-pause {
  width: 70px;
  height: 70px;
  font-size: 1.8em;
  background: linear-gradient(135deg, #00d4ff 0%, #0099cc 100%);
  box-shadow: 0 4px 15px rgba(0, 212, 255, 0.4);
}

.btn-play-pause:hover:not(:disabled) {
  background: linear-gradient(135deg, #00e4ff 0%, #00a9dd 100%);
  box-shadow: 0 6px 20px rgba(0, 212, 255, 0.6);
}

.volume-control {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.1);
  padding: 12px 15px;
  border-radius: 12px;
  backdrop-filter: blur(10px);
}

.btn-volume {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  font-size: 1.1em;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.btn-volume:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}

.volume-slider {
  flex: 1;
  height: 6px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.2);
  outline: none;
  cursor: pointer;
  -webkit-appearance: none;
}

.volume-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: white;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  transition: all 0.2s ease;
}

.volume-slider::-webkit-slider-thumb:hover {
  transform: scale(1.3);
}

.volume-slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: white;
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  transition: all 0.2s ease;
}

.volume-slider::-moz-range-thumb:hover {
  transform: scale(1.3);
}

.volume-value {
  min-width: 45px;
  text-align: right;
  font-weight: 600;
  font-size: 0.95em;
}

.error-message {
  margin-top: 15px;
  padding: 12px;
  background: rgba(255, 68, 68, 0.2);
  border: 1px solid rgba(255, 68, 68, 0.3);
  border-radius: 10px;
  text-align: center;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  opacity: 0.6;
}

.empty-state i {
  font-size: 3em;
  margin-bottom: 15px;
  display: block;
}

.empty-state p {
  margin: 0;
  font-size: 1.1em;
}

@media (max-width: 768px) {
  .player-controls {
    padding: 20px;
  }

  .upload-section {
    flex-direction: column;
  }

  .control-buttons {
    gap: 10px;
  }

  .btn-control {
    width: 45px;
    height: 45px;
    font-size: 1.1em;
  }

  .btn-play-pause {
    width: 60px;
    height: 60px;
    font-size: 1.5em;
  }

  .volume-control {
    flex-direction: column;
    gap: 10px;
  }

  .volume-slider {
    width: 100%;
  }
}
</style>
