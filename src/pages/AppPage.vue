<template>
  <div class="app-page">
    <!-- Notification System -->
    <Notification ref="notificationRef" />

    <!-- Main Content -->
    <main class="app-main">
      <div class="container main-layout">
        <div class="grid-three-column">
          <!-- Left Column: Recorder & Player -->
          <div class="column-left">
            <!-- OUTPUT RECORDING -->
            <OutputRecordingControls />

            <!-- File Upload & Player Controls -->
            <PlayerControls
              @files-selected="handleFilesSelected"
            />

            <!-- Playlist -->
            <Playlist />
          </div>

          <!-- Center Column: Equalizer & Visualizer -->
          <div class="column-center">
            <!-- Equalizer -->
            <Equalizer />

            <!-- Visualization -->
            <Visualization />
          </div>

          <!-- Right Column: Dynamics Processor -->
          <div class="column-right">
            <!-- Dynamics Processor -->
            <DynamicsProcessor />

            <!-- Compressor Presets -->
            <CompressorPresets />
          </div>
        </div>
      </div>

      <!-- Audio Converter Promo -->
      <AudioConverter />
    </main>
  </div>
</template>

<script setup>
import { ref, inject, onMounted } from 'vue'

import Notification from '../components/Notification.vue'
import OutputRecordingControls from '../components/OutputRecordingControls.vue'
import PlayerControls from '../components/PlayerControls.vue'
import Equalizer from '../components/Equalizer.vue'
import DynamicsProcessor from '../components/DynamicsProcessor.vue'
import CompressorPresets from '../components/CompressorPresets.vue'
import Visualization from '../components/Visualization.vue'
import Playlist from '../components/Playlist.vue'
import AudioConverter from '../components/AudioConverter.vue'

const { t, currentLanguage } = inject('i18n')
const audioEngine = inject('audioEngine')
const notify = inject('notify')

const notificationRef = ref(null)

const handleFilesSelected = (files) => {
  if (notificationRef.value) {
    const message = currentLanguage.value === 'de'
      ? `${files.length} Datei(en) hinzugefugt`
      : `${files.length} file(s) added`
    notificationRef.value.show(message, 'success')
  }
}

onMounted(() => {
  // Initialize audio context on first user interaction
  const init = () => {
    console.log('Initializing AudioEngine on user interaction...')
    audioEngine.initAudioContext()
    console.log('AudioEngine AudioContext initialized')
    document.removeEventListener('click', init)
  }
  document.addEventListener('click', init, { once: true })
})
</script>

<style scoped>
.app-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Main Content */
.app-main {
  flex: 1;
  padding-top: 16px;
}

</style>
