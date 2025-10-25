<template>
  <div class="output-recording">
    <div class="recording-header">
      <h3>
        <i class="fas fa-save"></i>
        {{ t('outputRecording.title') || 'Output aufnehmen' }}
      </h3>
      <div class="recording-status" v-if="isRecording">
        <span class="recording-indicator"></span>
        <span class="recording-time">{{ formattedTime }}</span>
      </div>
    </div>

    <div class="recording-info-box">
      <i class="fas fa-info-circle"></i>
      <p>{{ t('outputRecording.description') || 'Nimmt das verarbeitete Audio (mit EQ und Dynamics) auf' }}</p>
    </div>

    <!-- Format Selection -->
    <div v-if="!hasRecording && !isRecording" class="format-selection">
      <label>
        <i class="fas fa-file-audio"></i>
        {{ t('outputRecording.format') || 'Format:' }}
      </label>
      <div class="format-buttons">
        <button 
          @click="selectFormat('webm')"
          :class="['btn-format', { active: recordingFormat === 'webm' }]"
        >
          <i class="fas fa-file-audio"></i>
          WebM
          <span class="format-note">(Klein, gute Qualität)</span>
        </button>
      </div>
    </div>

    <!-- Recording Controls -->
    <div class="recording-controls">
      <!-- Start Recording -->
      <button 
        v-if="!isRecording && !hasRecording"
        @click="handleStart"
        class="btn-control btn-start"
      >
        <i class="fas fa-circle"></i>
        {{ t('outputRecording.start') || 'Aufnahme starten' }}
      </button>

      <!-- Stop Recording -->
      <button 
        v-if="isRecording"
        @click="handleStop"
        class="btn-control btn-stop"
      >
        <i class="fas fa-stop"></i>
        {{ t('outputRecording.stop') || 'Aufnahme beenden' }}
      </button>

      <!-- Download -->
      <button 
        v-if="hasRecording && !isRecording"
        @click="handleDownload"
        class="btn-control btn-download"
      >
        <i class="fas fa-download"></i>
        {{ t('outputRecording.download') || 'Herunterladen' }}
      </button>

      <!-- New Recording -->
      <button 
        v-if="hasRecording && !isRecording"
        @click="handleNewRecording"
        class="btn-control btn-new"
      >
        <i class="fas fa-plus"></i>
        {{ t('outputRecording.new') || 'Neue Aufnahme' }}
      </button>
    </div>

    <!-- Success Message -->
    <div v-if="hasRecording && !isRecording" class="recording-info success">
      <i class="fas fa-check-circle"></i>
      {{ t('outputRecording.ready') || 'Aufnahme bereit zum Download' }}
    </div>

    <!-- Error Message -->
    <div v-if="errorMessage" class="error-message">
      <i class="fas fa-exclamation-triangle"></i>
      {{ errorMessage }}
    </div>

    <!-- Important Note -->
    <div class="important-note">
      <i class="fas fa-exclamation-circle"></i>
      <strong>{{ t('outputRecording.noteTitle') || 'Wichtig:' }}</strong>
      {{ t('outputRecording.note') || 'Audio muss abgespielt werden während der Aufnahme!' }}
    </div>
  </div>
</template>

<script setup>
import { ref, inject, computed } from 'vue'
import { useOutputRecorder } from '../composables/useOutputRecorder'

// Get dependencies
const i18n = inject('i18n', { t: (key) => key })
const audioEngine = inject('audioEngine')
const notify = inject('notify', () => {})

// Make t function available
const t = (key) => {
  if (i18n && typeof i18n.t === 'function') {
    return i18n.t(key)
  }
  const translations = {
    'outputRecording.title': 'Output aufnehmen',
    'outputRecording.description': 'Nimmt das verarbeitete Audio (mit EQ und Dynamics) auf',
    'outputRecording.format': 'Format:',
    'outputRecording.start': 'Aufnahme starten',
    'outputRecording.stop': 'Aufnahme beenden',
    'outputRecording.download': 'Herunterladen',
    'outputRecording.new': 'Neue Aufnahme',
    'outputRecording.ready': 'Aufnahme bereit zum Download',
    'outputRecording.noteTitle': 'Wichtig:',
    'outputRecording.note': 'Audio muss abgespielt werden während der Aufnahme!'
  }
  return translations[key] || key
}

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
  discardRecording
} = useOutputRecorder()

// Set audio engine reference
if (audioEngine) {
  setAudioEngine(audioEngine)
}

const errorMessage = ref('')

// Format recording time
const formattedTime = computed(() => {
  const mins = Math.floor(recordingTime.value / 60)
  const secs = recordingTime.value % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
})

function selectFormat(format) {
  setFormat(format)
}

async function handleStart() {
  errorMessage.value = ''
  
  if (!audioEngine) {
    errorMessage.value = 'AudioEngine nicht verfügbar'
    return
  }

  const success = await startRecording()
  
  if (!success) {
    errorMessage.value = 'Fehler beim Starten der Aufnahme'
    notify('Fehler beim Starten der Aufnahme', 'error')
  } else {
    notify('Output-Aufnahme gestartet', 'success')
  }
}

function handleStop() {
  const success = stopRecording()
  
  if (success) {
    notify('Aufnahme beendet', 'success')
  }
}

function handleDownload() {
  const success = downloadRecording('processed-audio')
  
  if (success) {
    notify('Aufnahme heruntergeladen', 'success')
  } else {
    errorMessage.value = 'Fehler beim Herunterladen'
    notify('Fehler beim Herunterladen', 'error')
  }
}

function handleNewRecording() {
  discardRecording()
  errorMessage.value = ''
  
  notify('Bereit für neue Aufnahme', 'info')
}
</script>

<style scoped>
.output-recording {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
  padding: 25px;
  margin-bottom: 25px;
  color: white;
  box-shadow: 0 10px 40px rgba(102, 126, 234, 0.3);
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

.recording-status {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(255, 255, 255, 0.2);
  padding: 8px 16px;
  border-radius: 20px;
  backdrop-filter: blur(10px);
}

.recording-indicator {
  width: 12px;
  height: 12px;
  background: #ff4444;
  border-radius: 50%;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.recording-time {
  font-family: 'Courier New', monospace;
  font-weight: 600;
  font-size: 1.1em;
}

.recording-info-box {
  background: rgba(255, 255, 255, 0.15);
  padding: 15px;
  border-radius: 12px;
  margin-bottom: 20px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  backdrop-filter: blur(10px);
}

.recording-info-box i {
  font-size: 1.2em;
  margin-top: 2px;
}

.recording-info-box p {
  margin: 0;
  line-height: 1.5;
  opacity: 0.95;
}

.format-selection {
  margin-bottom: 20px;
}

.format-selection label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  margin-bottom: 12px;
  font-size: 1em;
}

.format-buttons {
  display: flex;
  gap: 12px;
}

.btn-format {
  flex: 1;
  padding: 15px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  backdrop-filter: blur(10px);
}

.btn-format:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.5);
  transform: translateY(-2px);
}

.btn-format.active {
  background: rgba(255, 255, 255, 0.3);
  border-color: white;
}

.btn-format i {
  font-size: 1.5em;
}

.format-note {
  font-size: 0.8em;
  opacity: 0.8;
  font-weight: 400;
}

.recording-controls {
  display: flex;
  gap: 12px;
  margin-bottom: 15px;
}

.btn-control {
  flex: 1;
  padding: 15px 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  color: white;
  font-weight: 600;
  font-size: 1em;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  backdrop-filter: blur(10px);
}

.btn-control:hover {
  background: rgba(255, 255, 255, 0.25);
  border-color: rgba(255, 255, 255, 0.5);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.btn-control i {
  font-size: 1.1em;
}

.btn-start {
  background: rgba(76, 175, 80, 0.3);
  border-color: rgba(76, 175, 80, 0.5);
}

.btn-start:hover {
  background: rgba(76, 175, 80, 0.5);
  border-color: #4caf50;
}

.btn-stop {
  background: rgba(244, 67, 54, 0.3);
  border-color: rgba(244, 67, 54, 0.5);
}

.btn-stop:hover {
  background: rgba(244, 67, 54, 0.5);
  border-color: #f44336;
}

.btn-download {
  background: rgba(33, 150, 243, 0.3);
  border-color: rgba(33, 150, 243, 0.5);
}

.btn-download:hover {
  background: rgba(33, 150, 243, 0.5);
  border-color: #2196f3;
}

.btn-new {
  background: rgba(255, 152, 0, 0.3);
  border-color: rgba(255, 152, 0, 0.5);
}

.btn-new:hover {
  background: rgba(255, 152, 0, 0.5);
  border-color: #ff9800;
}

.recording-info {
  padding: 12px 16px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
  backdrop-filter: blur(10px);
}

.recording-info.success {
  background: rgba(76, 175, 80, 0.3);
  border: 2px solid rgba(76, 175, 80, 0.5);
}

.error-message {
  background: rgba(244, 67, 54, 0.3);
  border: 2px solid rgba(244, 67, 54, 0.5);
  padding: 12px 16px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
  backdrop-filter: blur(10px);
}

.important-note {
  background: rgba(255, 152, 0, 0.2);
  border: 2px solid rgba(255, 152, 0, 0.4);
  padding: 12px 16px;
  border-radius: 10px;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 0.9em;
  backdrop-filter: blur(10px);
}

.important-note i {
  font-size: 1.1em;
  margin-top: 2px;
}

@media (max-width: 768px) {
  .output-recording {
    padding: 20px;
  }

  .recording-controls {
    flex-direction: column;
  }

  .format-buttons {
    flex-direction: column;
  }
}
</style>
