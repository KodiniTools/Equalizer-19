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
        <button
          @click="selectFormat('wav')"
          :class="['btn-format', { active: recordingFormat === 'wav' }]"
        >
          <i class="fas fa-file-audio"></i>
          WAV
          <span class="format-note">(Unkomprimiert)</span>
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
        {{ t('outputRecording.download') || 'Herunterladen' }} ({{ recordingFormat.toUpperCase() }})
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
  background: var(--gradient-card);
  border: 1px solid var(--border-color);
  border-radius: 20px;
  padding: 25px;
  margin-bottom: 25px;
  color: var(--text-primary);
  box-shadow: 0 10px 40px var(--shadow-light);
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
  background: var(--secondary-bg);
  border: 1px solid var(--border-color);
  padding: 8px 16px;
  border-radius: 20px;
  color: var(--text-primary);
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
  background: var(--secondary-bg);
  border: 1px solid var(--border-color);
  padding: 15px;
  border-radius: 12px;
  margin-bottom: 20px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  color: var(--text-primary);
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
  border: 2px solid #6B7280 !important;
  background: #4B5563 !important;  /* FORCE Helleres Grau */
  border-radius: 12px;
  color: #FFFFFF !important;  /* FORCE weiß */
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.btn-format * {
  color: #FFFFFF !important;  /* ALLE Kindelemente weiß */
}

.btn-format:hover {
  background: #6B7280 !important;
  border-color: #3B82F6 !important;
  transform: translateY(-2px);
}

.btn-format:hover * {
  color: #FFFFFF !important;  /* Beim Hover auch alle weiß */
}

.btn-format.active {
  background: #3B82F6 !important;
  border-color: #3B82F6 !important;
  color: #FFFFFF !important;
}

.btn-format.active * {
  color: #FFFFFF !important;  /* Auch beim aktiven Button alles weiß */
}

.btn-format i {
  font-size: 1.5em;
  color: #FFFFFF !important;  /* FORCE weiß für Icon */
}

.format-note {
  font-size: 0.8em;
  opacity: 1 !important;  /* Volle Deckkraft */
  font-weight: 400;
  color: #E5E7EB !important;  /* FORCE helles Grau */
}

.recording-controls {
  display: flex;
  gap: 12px;
  margin-bottom: 15px;
}

.btn-control {
  flex: 1;
  padding: 15px 20px;
  border: 1px solid var(--border-color);
  background: var(--secondary-bg);
  border-radius: 12px;
  color: var(--text-primary);
  font-weight: 600;
  font-size: 1em;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.btn-control:hover {
  background: var(--hover-bg);
  border-color: var(--accent-primary);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px var(--shadow-light);
}

.btn-control i {
  font-size: 1.1em;
}

.btn-start {
  background: var(--success);
  border-color: var(--success);
  color: white;
}

.btn-start:hover {
  background: #059669;
  border-color: #059669;
}

.btn-stop {
  background: var(--error);
  border-color: var(--error);
  color: white;
}

.btn-stop:hover {
  background: #DC2626;
  border-color: #DC2626;
}

.btn-download {
  background: var(--accent-primary);
  border-color: var(--accent-primary);
  color: white;
}

.btn-download:hover {
  background: var(--accent-secondary);
  border-color: var(--accent-secondary);
}

.btn-new {
  background: var(--secondary-bg);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
}

.btn-new:hover {
  background: var(--hover-bg);
  border-color: var(--accent-primary);
}

.recording-info {
  padding: 12px 16px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
  color: var(--text-primary);
}

.recording-info.success {
  background: var(--secondary-bg);
  border: 1px solid var(--success);
}

.recording-info.success i {
  color: var(--success);
}

.error-message {
  background: var(--secondary-bg);
  border: 1px solid var(--error);
  padding: 12px 16px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
  color: var(--text-primary);
}

.error-message i {
  color: var(--error);
}

.important-note {
  background: var(--secondary-bg);
  border: 1px solid var(--warning);
  padding: 12px 16px;
  border-radius: 10px;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 0.9em;
  color: var(--text-primary);
}

.important-note i {
  color: var(--warning);
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
