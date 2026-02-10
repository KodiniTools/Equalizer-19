import { ref, computed } from 'vue'
import { translations } from '../utils/translations'

const currentLanguage = ref(
  localStorage.getItem('equalizer-language') || localStorage.getItem('locale') || detectBrowserLanguage()
)

function detectBrowserLanguage() {
  const lang = navigator.language || navigator.userLanguage
  return lang.startsWith('de') ? 'de' : 'en'
}

// Update all SSI elements that use the data-lang-de / data-lang-en pattern
function updateDataLangElements(lang) {
  document.querySelectorAll('[data-lang-de][data-lang-en]').forEach(el => {
    el.textContent = el.getAttribute(`data-lang-${lang}`)
  })
}

export function useI18n() {
  const t = computed(() => translations[currentLanguage.value])

  const setLanguage = (lang) => {
    if (lang !== currentLanguage.value && (lang === 'de' || lang === 'en')) {
      currentLanguage.value = lang
      localStorage.setItem('equalizer-language', lang)
      localStorage.setItem('locale', lang)
      document.documentElement.lang = lang

      // Update meta tags
      const title = t.value.main_title
      document.title = title
      document.querySelector('meta[property="og:title"]')?.setAttribute('content', title)
      document.querySelector('meta[name="description"]')?.setAttribute('content', t.value.promo_subtitle)
      document.querySelector('meta[property="og:description"]')?.setAttribute('content', t.value.promo_subtitle)

      // Dispatch language-changed event for SSI partials (cookie banner, etc.)
      window.dispatchEvent(new CustomEvent('language-changed', { detail: { lang } }))

      // Update data-lang-* elements in SSI partials
      updateDataLangElements(lang)
    }
  }

  // Sync SSI nav localStorage key on init
  localStorage.setItem('locale', currentLanguage.value)

  // Listen for SSI navigation language-changed events
  window.addEventListener('language-changed', (e) => {
    const lang = e.detail?.lang
    if (lang && (lang === 'de' || lang === 'en') && lang !== currentLanguage.value) {
      currentLanguage.value = lang
      localStorage.setItem('equalizer-language', lang)
      document.documentElement.lang = lang

      // Update meta tags
      const title = t.value.main_title
      document.title = title
      document.querySelector('meta[property="og:title"]')?.setAttribute('content', title)
      document.querySelector('meta[name="description"]')?.setAttribute('content', t.value.promo_subtitle)
      document.querySelector('meta[property="og:description"]')?.setAttribute('content', t.value.promo_subtitle)

      // Update data-lang-* elements in SSI partials
      updateDataLangElements(lang)
    }
  })

  // Initial update of data-lang-* elements (SSI HTML is already in the DOM)
  updateDataLangElements(currentLanguage.value)

  return {
    t,
    currentLanguage: computed(() => currentLanguage.value),
    setLanguage
  }
}
