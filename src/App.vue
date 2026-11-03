<template>
  <div class="app-root">
    <router-view />
  </div>
</template>

<script setup>
  import { provide, onMounted } from 'vue'
  import { useI18n } from './composables/useI18n'
  import { useTheme } from './composables/useTheme'
  import { useAudioEngine } from './composables/useAudioEngine'
  import { useAudioPlayer } from './composables/useAudioPlayer'
  import { useUndoRedo } from './composables/useUndoRedo'
  import { useKeyboardShortcuts } from './composables/useKeyboardShortcuts'

  // Initialize composables
  const { t, currentLanguage, setLanguage } = useI18n()
  const { currentTheme, setTheme } = useTheme()
  const audioEngine = useAudioEngine()
  const audioPlayer = useAudioPlayer()

  // Connect AudioPlayer to AudioEngine
  audioPlayer.setAudioEngine(audioEngine)

  // Undo/redo history of the processing settings (EQ + compressor)
  const history = useUndoRedo(audioEngine)

  useKeyboardShortcuts(audioPlayer, { history })

  // Provide to all child components
  provide('i18n', { t, currentLanguage, setLanguage })
  provide('theme', { currentTheme, setTheme })
  provide('audioEngine', audioEngine)
  provide('audioPlayer', audioPlayer)
  provide('history', history)
  // Fallback without UI; AppPage overrides it with the toast implementation
  provide('notify', () => {})

  onMounted(() => {
    // Dispatch initial language-changed so SSI partials (nav, footer, cookie-banner) sync
    window.dispatchEvent(
      new CustomEvent('language-changed', { detail: { lang: currentLanguage.value } })
    )
  })
</script>

<style>
  .app-root {
    min-height: 100vh;
  }
</style>
