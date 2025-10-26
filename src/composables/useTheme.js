import { ref, computed } from 'vue'

// FORCE LIGHT MODE - Dunkelmodus deaktiviert
const currentTheme = ref('light')

function detectSystemTheme() {
  return 'light' // Immer Light Mode
}

export function useTheme() {
  const setTheme = (theme) => {
    // Nur Light Mode erlauben
    currentTheme.value = 'light'
    localStorage.setItem('equalizer-theme', 'light')
    document.documentElement.setAttribute('data-theme', 'light')
  }

  // Initialize theme on mount - IMMER LIGHT
  document.documentElement.setAttribute('data-theme', 'light')
  localStorage.setItem('equalizer-theme', 'light')

  return {
    currentTheme: computed(() => 'light'),
    setTheme
  }
}
