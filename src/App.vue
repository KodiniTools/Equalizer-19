<template>
  <div class="app-container">
    <!-- Notification System -->
    <Notification ref="notificationRef" />
    
    <!-- Language & Theme Switcher -->
    <LanguageThemeSwitcher />
    
    <!-- Promo Section -->
    <PromoSection />
    
    <!-- Main Content -->
    <div class="container main-layout">
      <div class="grid-three-column">
        <!-- Left Column: Recorder & Player -->
        <div class="column-left">
          <!-- 🎙️ MIKROFON RECORDING -->
          <RecordingControls />

          <!-- 💾 OUTPUT RECORDING -->
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
        </div>
      </div>
    </div>
    
    <!-- Audio Converter Promo -->
    <AudioConverter />
  </div>
</template>

<script setup>
import { ref, provide, onMounted } from 'vue'
import { useI18n } from './composables/useI18n'
import { useTheme } from './composables/useTheme'
import { useAudioEngine } from './composables/useAudioEngine'
import { useAudioPlayer } from './composables/useAudioPlayer'

import Notification from './components/Notification.vue'
import LanguageThemeSwitcher from './components/LanguageThemeSwitcher.vue'
import PromoSection from './components/PromoSection.vue'
import RecordingControls from './components/RecordingControls.vue'  // 🎙️ Mikrofon
import OutputRecordingControls from './components/OutputRecordingControls.vue'  // 💾 Output
import PlayerControls from './components/PlayerControls.vue'
import Equalizer from './components/Equalizer.vue'
import DynamicsProcessor from './components/DynamicsProcessor.vue'
import Visualization from './components/Visualization.vue'
import Playlist from './components/Playlist.vue'
import AudioConverter from './components/AudioConverter.vue'

// Initialize composables
const { t, currentLanguage, setLanguage } = useI18n()
const { currentTheme, setTheme } = useTheme()
const audioEngine = useAudioEngine()
const audioPlayer = useAudioPlayer()

const notificationRef = ref(null)

// CRITICAL: Connect AudioPlayer to AudioEngine
console.log('🔗 Connecting AudioPlayer to AudioEngine...')
audioPlayer.setAudioEngine(audioEngine)
console.log('✅ AudioEngine connected to AudioPlayer')

// Make available globally for debugging
window.audioEngine = audioEngine
window.audioPlayer = audioPlayer
console.log('🔍 audioEngine and audioPlayer available in window for debugging')

// Provide to all child components
provide('i18n', { t, currentLanguage, setLanguage })
provide('theme', { currentTheme, setTheme })
provide('audioEngine', audioEngine)
provide('audioPlayer', audioPlayer)
provide('notify', (message, type = 'info') => {
  if (notificationRef.value) {
    notificationRef.value.show(message, type)
  }
})

const handleFilesSelected = (files) => {
  audioPlayer.addFiles(files)
  if (notificationRef.value) {
    const message = currentLanguage.value === 'de' 
      ? `${files.length} Datei(en) hinzugefügt`
      : `${files.length} file(s) added`
    notificationRef.value.show(message, 'success')
  }
}

onMounted(() => {
  // Initialize audio context on first user interaction
  const init = () => {
    console.log('🎵 Initializing AudioEngine on user interaction...')
    audioEngine.initAudioContext()
    console.log('✅ AudioEngine AudioContext initialized')
    document.removeEventListener('click', init)
  }
  document.addEventListener('click', init, { once: true })
  
  console.log('✅ Equalizer 19 Vue 3 ready!')
  console.log('🎙️ Recording Controls active!')
  console.log('🎛️ AudioEngine initialized and connected!')
  console.log('💡 Tipp: Teste Audio-Routing mit TEST_AUDIO_ROUTING.js in Console')
})
</script>

<style scoped>
.app-container {
  min-height: 100vh;
}
</style>
