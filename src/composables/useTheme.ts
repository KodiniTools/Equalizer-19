import { ref, computed } from 'vue'

export type Theme = 'dark' | 'light'

const isTheme = (value: unknown): value is Theme => value === 'dark' || value === 'light'

function detectSystemTheme(): Theme {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function loadTheme(): Theme {
  const stored = localStorage.getItem('equalizer-theme') || localStorage.getItem('theme')
  return isTheme(stored) ? stored : detectSystemTheme()
}

const currentTheme = ref<Theme>(loadTheme())

export function useTheme() {
  const setTheme = (theme: string): void => {
    if (theme !== currentTheme.value && isTheme(theme)) {
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
    const theme = (e as CustomEvent<{ theme?: unknown }>).detail?.theme
    if (isTheme(theme) && theme !== currentTheme.value) {
      currentTheme.value = theme
      localStorage.setItem('equalizer-theme', theme)
      document.documentElement.setAttribute('data-theme', theme)
    }
  })

  // Listen for system theme changes
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem('equalizer-theme') && !localStorage.getItem('theme')) {
        const theme: Theme = e.matches ? 'dark' : 'light'
        currentTheme.value = theme
        document.documentElement.setAttribute('data-theme', theme)
      }
    })
  }

  return {
    currentTheme: computed(() => currentTheme.value),
    setTheme,
  }
}

/** What `provide('theme', …)` hands to the components. */
export type ThemeApi = ReturnType<typeof useTheme>
