<template>
  <div class="app-root">
    <router-view />
  </div>
</template>

<script setup>
  import { provide, onMounted } from 'vue'
  import { useI18n } from './composables/useI18n'
  import { useTheme } from './composables/useTheme'
  import { useKeyboardShortcuts } from './composables/useKeyboardShortcuts'
  import { usePlayerStore } from './stores/player'
  import { useHistoryStore } from './stores/history'

  // Initialize composables
  const { t, currentLanguage, setLanguage } = useI18n()
  const { currentTheme, setTheme } = useTheme()
  // Audio engine, player, history and toasts are Pinia stores (src/stores)
  useKeyboardShortcuts(usePlayerStore(), { history: useHistoryStore() })

  // Provide to all child components
  provide('i18n', { t, currentLanguage, setLanguage })
  provide('theme', { currentTheme, setTheme })

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
