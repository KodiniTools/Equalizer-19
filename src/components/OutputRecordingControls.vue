<template>
  <div class="recorder">
    <!-- Recording time display -->
    <div class="rec-time" v-if="isRecording">
      <span class="rec-dot"></span>
      <span class="time">{{ formattedTime }}</span>
    </div>

    <!-- Format toggle (only when not recording and no recording available) -->
    <div class="format-toggle" v-if="!isRecording && !hasRecording">
      <button
        @click="selectFormat('wav')"
        :class="['fmt-btn', { active: recordingFormat === 'wav' }]"
        title="WAV (Unkomprimiert)"
      >WAV</button>
      <button
        @click="selectFormat('webm')"
        :class="['fmt-btn', { active: recordingFormat === 'webm' }]"
        title="WebM (Komprimiert)"
      >WebM</button>
    </div>

    <!-- Control buttons -->
    <div class="controls">
      <!-- Record button -->
      <button
        v-if="!isRecording && !hasRecording"
        @click="handleStart"
        class="ctrl-btn rec"
        title="Aufnahme starten"
      >
        <i class="fas fa-circle"></i>
      </button>

      <!-- Stop button -->
      <button
        v-if="isRecording"
        @click="handleStop"
        class="ctrl-btn stop"
        title="Stoppen"
      >
        <i class="fas fa-stop"></i>
      </button>

      <!-- Download button -->
      <button
        v-if="hasRecording && !isRecording"
        @click="handleDownload"
        class="ctrl-btn download"
        title="Herunterladen"
      >
        <i class="fas fa-download"></i>
      </button>

      <!-- New recording button -->
      <button
        v-if="hasRecording && !isRecording"
        @click="handleNewRecording"
        class="ctrl-btn new"
        title="Neue Aufnahme"
      >
        <i class="fas fa-redo"></i>
      </button>
    </div>

    <!-- Error indicator -->
    <div v-if="errorMessage" class="error-dot" :title="errorMessage">
      <i class="fas fa-exclamation"></i>
    </div>
  </div>
</template>

<script setup>
import { ref, inject, computed } from 'vue'
import { useOutputRecorder } from '../composables/useOutputRecorder'

const audioEngine = inject('audioEngine')
const notify = inject('notify', () => {})

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

if (audioEngine) {
  setAudioEngine(audioEngine)
}

const errorMessage = ref('')

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
    errorMessage.value = 'Fehler beim Starten'
    notify('Fehler beim Starten der Aufnahme', 'error')
  }
}

function handleStop() {
  stopRecording()
}

function handleDownload() {
  const success = downloadRecording('audio-export')
  if (!success) {
    errorMessage.value = 'Download fehlgeschlagen'
  }
}

function handleNewRecording() {
  discardRecording()
  errorMessage.value = ''
}
</script>

<style scoped>
.recorder {
  background: var(--card-bg, #252530);
  border: 1px solid var(--border-color, #3a3a48);
  border-radius: 12px;
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.rec-time {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: 'SF Mono', 'Courier New', monospace;
  font-size: 0.85em;
  color: var(--text-primary, #fff);
  background: rgba(239, 68, 68, 0.15);
  padding: 4px 10px;
  border-radius: 6px;
}

.rec-dot {
  width: 8px;
  height: 8px;
  background: #ef4444;
  border-radius: 50%;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.time {
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
  font-size: 0.7em;
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
  color: #000;
}

.controls {
  display: flex;
  gap: 6px;
  margin-left: auto;
}

.ctrl-btn {
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

.ctrl-btn.rec {
  background: #ef4444;
  color: white;
}

.ctrl-btn.rec:hover {
  background: #dc2626;
  transform: scale(1.05);
}

.ctrl-btn.stop {
  background: #f59e0b;
  color: white;
}

.ctrl-btn.stop:hover {
  background: #d97706;
  transform: scale(1.05);
}

.ctrl-btn.download {
  background: #10b981;
  color: white;
}

.ctrl-btn.download:hover {
  background: #059669;
  transform: scale(1.05);
}

.ctrl-btn.new {
  background: var(--secondary-bg, #1a1a22);
  color: var(--text-secondary, #c8c8d5);
  border: 1px solid var(--border-color, #3a3a48);
}

.ctrl-btn.new:hover {
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
}

@media (max-width: 600px) {
  .recorder {
    padding: 10px;
    gap: 8px;
    flex-wrap: wrap;
  }

  .rec-time {
    font-size: 0.8em;
    padding: 3px 8px;
  }

  .fmt-btn {
    padding: 5px 10px;
    font-size: 0.75em;
  }

  .ctrl-btn {
    width: 36px;
    height: 36px;
  }

  .controls {
    margin-left: auto;
  }
}

@media (max-width: 400px) {
  .recorder {
    padding: 8px;
    gap: 6px;
  }

  .controls {
    width: 100%;
    justify-content: center;
    margin-left: 0;
  }

  .format-toggle {
    flex: 1;
  }
}
</style>
