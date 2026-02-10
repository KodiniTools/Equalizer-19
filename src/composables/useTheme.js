import { ref, computed } from 'vue'

const currentTheme = ref(
  localStorage.getItem('equalizer-theme') || localStorage.getItem('theme') || detectSystemTheme()
)

function detectSystemTheme() {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function useTheme() {
  const setTheme = (theme) => {
    if (theme !== currentTheme.value && (theme === 'dark' || theme === 'light')) {
      currentTheme.value = theme
      localStorage.setItem('equalizer-theme', theme)
      localStorage.setItem('theme', theme)
      document.documentElement.setAttribute('data-theme', theme)
    }
  }

  // Initialize theme on mount
  document.documentElement.setAttribute('data-theme', currentTheme.value)
  // Sync SSI nav localStorage key on init
  localStorage.setItem('theme', currentTheme.value)

  // Listen for SSI navigation theme-changed events
  window.addEventListener('theme-changed', (e) => {
    const theme = e.detail?.theme
    if (theme && (theme === 'dark' || theme === 'light') && theme !== currentTheme.value) {
      currentTheme.value = theme
      localStorage.setItem('equalizer-theme', theme)
      document.documentElement.setAttribute('data-theme', theme)
    }
  })

  // Listen for system theme changes
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem('equalizer-theme') && !localStorage.getItem('theme')) {
        const theme = e.matches ? 'dark' : 'light'
        currentTheme.value = theme
        document.documentElement.setAttribute('data-theme', theme)
      }
    })
  }

  return {
    currentTheme: computed(() => currentTheme.value),
    setTheme
  }
}
