<template>
  <div class="app-root">
    <router-view />
  </div>
</template>

<script setup>
import { ref, provide, onMounted } from 'vue'
import { useI18n } from './composables/useI18n'
import { useTheme } from './composables/useTheme'
import { useAudioEngine } from './composables/useAudioEngine'
import { useAudioPlayer } from './composables/useAudioPlayer'

// Initialize composables
const { t, currentLanguage, setLanguage } = useI18n()
const { currentTheme, setTheme } = useTheme()
const audioEngine = useAudioEngine()
const audioPlayer = useAudioPlayer()

// CRITICAL: Connect AudioPlayer to AudioEngine
console.log('Connecting AudioPlayer to AudioEngine...')
audioPlayer.setAudioEngine(audioEngine)
console.log('AudioEngine connected to AudioPlayer')

// Make available globally for debugging
if (typeof window !== 'undefined') {
  window.audioEngine = audioEngine
  window.audioPlayer = audioPlayer
  console.log('audioEngine and audioPlayer available in window for debugging')
}

// Provide to all child components
provide('i18n', { t, currentLanguage, setLanguage })
provide('theme', { currentTheme, setTheme })
provide('audioEngine', audioEngine)
provide('audioPlayer', audioPlayer)
provide('notify', (message, type = 'info') => {
  // Will be implemented by individual pages that need it
  console.log(`[${type}] ${message}`)
})

onMounted(() => {
  console.log('Equalizer 19 Vue 3 ready!')
})
</script>

<style>
.app-root {
  min-height: 100vh;
}
</style>
