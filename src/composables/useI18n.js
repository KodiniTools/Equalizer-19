import { ref, computed } from 'vue'
import { translations } from '../utils/translations'

const currentLanguage = ref(
  localStorage.getItem('equalizer-language') || detectBrowserLanguage()
)

function detectBrowserLanguage() {
  const lang = navigator.language || navigator.userLanguage
  return lang.startsWith('de') ? 'de' : 'en'
}

export function useI18n() {
  const t = computed(() => translations[currentLanguage.value])
  
  const setLanguage = (lang) => {
    if (lang !== currentLanguage.value && (lang === 'de' || lang === 'en')) {
      currentLanguage.value = lang
      localStorage.setItem('equalizer-language', lang)
      document.documentElement.lang = lang
      
      // Update meta tags
      const title = t.value.main_title
      document.title = title
      document.querySelector('meta[property="og:title"]')?.setAttribute('content', title)
      document.querySelector('meta[name="description"]')?.setAttribute('content', t.value.promo_subtitle)
      document.querySelector('meta[property="og:description"]')?.setAttribute('content', t.value.promo_subtitle)
    }
  }
  
  return {
    t,
    currentLanguage: computed(() => currentLanguage.value),
    setLanguage
  }
}
