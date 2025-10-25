import { ref, computed, watch } from 'vue'

const currentTheme = ref(
  localStorage.getItem('equalizer-theme') || detectSystemTheme()
)

function detectSystemTheme() {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function useTheme() {
  const setTheme = (theme) => {
    if (theme !== currentTheme.value && (theme === 'dark' || theme === 'light')) {
      currentTheme.value = theme
      localStorage.setItem('equalizer-theme', theme)
      document.documentElement.setAttribute('data-theme', theme)
    }
  }
  
  // Initialize theme on mount
  document.documentElement.setAttribute('data-theme', currentTheme.value)
  
  // Listen for system theme changes
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem('equalizer-theme')) {
        currentTheme.value = e.matches ? 'dark' : 'light'
        document.documentElement.setAttribute('data-theme', currentTheme.value)
      }
    })
  }
  
  return {
    currentTheme: computed(() => currentTheme.value),
    setTheme
  }
}
