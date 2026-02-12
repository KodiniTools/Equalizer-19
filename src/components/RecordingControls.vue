<template>
  <div class="recording-controls">
    <div class="recording-header">
      <h3>
        <i class="fas fa-microphone"></i>
        {{ currentLanguage === 'de' ? 'Aufnahme' : 'Recording' }}
      </h3>
      <div v-if="isRecording" class="recording-indicator">
        <span class="recording-dot"></span>
        <span>{{ currentLanguage === 'de' ? 'Aufnahme läuft...' : 'Recording...' }}</span>
      </div>
    </div>

    <!-- Format Selection -->
    <div class="format-selector" v-if="!isRecording && !hasRecording">
      <label>
        <input 
          type="radio" 
          value="webm" 
          :checked="recordingFormat === 'webm'"
          @change="setFormat('webm')"
        >
        <span>WebM (Opus)</span>
      </label>
      <label>
        <input 
          type="radio" 
          value="wav" 
          :checked="recordingFormat === 'wav'"
          @change="setFormat('wav')"
        >
        <span>WAV {{ currentLanguage === 'de' ? '(unkomprimiert)' : '(uncompressed)' }}</span>
      </label>
    </div>

    <!-- Recording Timer -->
    <div v-if="isRecording" class="recording-timer">
      <div class="timer-display">
        <i class="fas fa-clock"></i>
        <span class="time">{{ formattedTime }}</span>
      </div>
    </div>

    <!-- Control Buttons -->
    <div class="recording-buttons">
      <!-- Start Button -->
      <button 
        v-if="!isRecording && !hasRecording"
        @click="handleStart"
        class="btn-start"
        :disabled="isRecording"
      >
        <i class="fas fa-circle"></i>
        <span>{{ currentLanguage === 'de' ? 'Aufnahme starten' : 'Start Recording' }}</span>
      </button>

      <!-- Stop Button -->
      <button 
        v-if="isRecording"
        @click="handleStop"
        class="btn-stop"
      >
        <i class="fas fa-stop"></i>
        <span>{{ currentLanguage === 'de' ? 'Aufnahme stoppen' : 'Stop Recording' }}</span>
      </button>

      <!-- Download Button -->
      <button 
        v-if="hasRecording && !isRecording"
        @click="handleDownload"
        class="btn-download"
      >
        <i class="fas fa-download"></i>
        <span>Download ({{ recordingFormat.toUpperCase() }})</span>
      </button>

      <!-- New Recording Button -->
      <button 
        v-if="hasRecording && !isRecording"
        @click="handleNewRecording"
        class="btn-new"
      >
        <i class="fas fa-redo"></i>
        <span>{{ currentLanguage === 'de' ? 'Neue Aufnahme' : 'New Recording' }}</span>
      </button>
    </div>

    <!-- Success Message -->
    <div v-if="hasRecording && !isRecording" class="recording-info">
      <i class="fas fa-check-circle"></i>
      {{ currentLanguage === 'de' ? 'Aufnahme bereit zum Download' : 'Recording ready for download' }}
    </div>

    <!-- Error Message -->
    <div v-if="errorMessage" class="error-message">
      <i class="fas fa-exclamation-triangle"></i>
      {{ errorMessage }}
    </div>
  </div>
</template>

<script setup>
import { ref, inject, computed } from 'vue'
import { useRecorder } from '../composables/useRecorder'

// Get i18n from parent
const i18n = inject('i18n', { currentLanguage: ref('de') })
const currentLanguage = i18n.currentLanguage || ref('de')

// Get notification system
const notify = inject('notify', () => {})

const {
  isRecording,
  recordingFormat,
  hasRecording,
  recordingTime,
  startRecording,
  stopRecording,
  downloadRecording,
  setFormat,
  discardRecording
} = useRecorder()

const errorMessage = ref('')

// Format recording time
const formattedTime = computed(() => {
  const mins = Math.floor(recordingTime.value / 60)
  const secs = recordingTime.value % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
})

async function handleStart() {
  errorMessage.value = ''
  const success = await startRecording()
  if (success) {
    notify(
      currentLanguage.value === 'de' 
        ? 'Aufnahme gestartet' 
        : 'Recording started',
      'success'
    )
  } else {
    errorMessage.value = currentLanguage.value === 'de'
      ? 'Fehler beim Zugriff auf das Mikrofon'
      : 'Error accessing microphone'
    notify(errorMessage.value, 'error')
  }
}

function handleStop() {
  stopRecording()
  notify(
    currentLanguage.value === 'de' 
      ? 'Aufnahme gestoppt' 
      : 'Recording stopped',
    'info'
  )
}

function handleDownload() {
  downloadRecording()
  notify(
    currentLanguage.value === 'de' 
      ? 'Download gestartet' 
      : 'Download started',
    'success'
  )
}

function handleNewRecording() {
  // Discard current recording and reset
  discardRecording()
  errorMessage.value = ''
  
  notify(
    currentLanguage.value === 'de' 
      ? 'Bereit für neue Aufnahme' 
      : 'Ready for new recording',
    'info'
  )
}
</script>

<style scoped>
.recording-controls {
  background: var(--card-bg, linear-gradient(135deg, #667eea 0%, #764ba2 100%));
  border-radius: 20px;
  padding: 25px;
  margin-bottom: 25px;
  color: white;
  box-shadow: 0 10px 40px rgba(102, 126, 234, 0.3);
  transition: all 0.3s ease;
}

.recording-controls:hover {
  box-shadow: 0 15px 50px rgba(102, 126, 234, 0.4);
  transform: translateY(-2px);
}

.recording-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.recording-header h3 {
  margin: 0;
  font-size: 1.4em;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;
}

.recording-header h3 i {
  font-size: 1.2em;
}

.recording-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.2);
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 0.9em;
  font-weight: 500;
  backdrop-filter: blur(10px);
}

.recording-dot {
  width: 10px;
  height: 10px;
  background: #ff4444;
  border-radius: 50%;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.3);
  }
}

.format-selector {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  background: rgba(255, 255, 255, 0.1);
  padding: 15px;
  border-radius: 12px;
  backdrop-filter: blur(10px);
}

.format-selector label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 0.95em;
  transition: all 0.2s;
  flex: 1;
  padding: 5px;
  border-radius: 8px;
}

.format-selector label:hover {
  background: rgba(255, 255, 255, 0.1);
}

.format-selector input[type="radio"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #ffd700;
}

.format-selector span {
  font-weight: 500;
}

.recording-timer {
  margin-bottom: 20px;
  padding: 20px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 12px;
  text-align: center;
  backdrop-filter: blur(10px);
}

.timer-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
}

.timer-display i {
  font-size: 1.5em;
  color: #ffd700;
}

.time {
  font-size: 2.5em;
  font-weight: 700;
  font-family: 'Courier New', monospace;
  letter-spacing: 2px;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
}

.recording-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.recording-buttons button {
  flex: 1;
  min-width: 160px;
  padding: 15px 20px;
  border: none;
  border-radius: 12px;
  font-size: 1em;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  position: relative;
  overflow: hidden;
}

.recording-buttons button::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  transform: translate(-50%, -50%);
  transition: width 0.6s, height 0.6s;
}

.recording-buttons button:hover::before {
  width: 300px;
  height: 300px;
}

.recording-buttons button i {
  font-size: 1.2em;
  position: relative;
  z-index: 1;
}

.recording-buttons button span {
  position: relative;
  z-index: 1;
}

.btn-start {
  background: linear-gradient(135deg, #00ff88 0%, #00cc6a 100%);
  color: #003d20;
}

.btn-start:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(0, 255, 136, 0.4);
}

.btn-start:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.btn-stop {
  background: linear-gradient(135deg, #ff4444 0%, #cc0000 100%);
  color: white;
}

.btn-stop:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(255, 68, 68, 0.4);
}

.btn-download {
  background: linear-gradient(135deg, #ffd700 0%, #ffaa00 100%);
  color: #664400;
}

.btn-download:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(255, 215, 0, 0.4);
}

.btn-new {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-new:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.recording-info {
  margin-top: 15px;
  padding: 12px;
  background: rgba(0, 255, 136, 0.2);
  border-radius: 10px;
  text-align: center;
  font-weight: 500;
  font-size: 0.95em;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  backdrop-filter: blur(10px);
}

.recording-info i {
  font-size: 1.2em;
  color: #00ff88;
}

.error-message {
  margin-top: 15px;
  padding: 12px;
  background: rgba(255, 68, 68, 0.2);
  border: 1px solid rgba(255, 68, 68, 0.3);
  border-radius: 10px;
  text-align: center;
  font-weight: 500;
  font-size: 0.95em;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  backdrop-filter: blur(10px);
}

.error-message i {
  font-size: 1.2em;
  color: #ff4444;
}

@media (max-width: 768px) {
  .recording-controls {
    padding: 20px;
  }

  .recording-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .format-selector {
    flex-direction: column;
    gap: 10px;
  }

  .recording-buttons {
    flex-direction: column;
  }

  .recording-buttons button {
    min-width: 100%;
  }

  .time {
    font-size: 2em;
  }
}

@media (max-width: 480px) {
  .recording-controls {
    padding: 16px;
    border-radius: 14px;
    margin-bottom: 16px;
  }

  .recording-header h3 {
    font-size: 1.1em;
  }

  .recording-header h3 i {
    font-size: 1em;
  }

  .recording-indicator {
    padding: 6px 12px;
    font-size: 0.8em;
  }

  .format-selector {
    padding: 10px;
    margin-bottom: 14px;
  }

  .format-selector label {
    font-size: 0.85em;
  }

  .recording-buttons button {
    padding: 12px 16px;
    font-size: 0.9em;
    min-width: 100%;
  }

  .recording-timer {
    padding: 14px;
    margin-bottom: 14px;
  }

  .time {
    font-size: 1.6em;
  }

  .timer-display i {
    font-size: 1.2em;
  }

  .recording-info,
  .error-message {
    font-size: 0.85em;
    padding: 10px;
    margin-top: 10px;
  }
}

/* Dark/Light Theme Support */
@media (prefers-color-scheme: light) {
  .recording-controls {
    color: #333;
  }
  
  .recording-info,
  .error-message {
    color: #333;
  }
}
</style>
