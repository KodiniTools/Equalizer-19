import { ref, computed } from 'vue'
import { translations, type Language } from '../i18n'
import { applyPageMeta, resolveInitialLanguage, routePathFromLocation } from '../utils/seoMeta'

// ?lang=en (hreflang-Ziel) hat Vorrang vor der gespeicherten Sprache, sonst Deutsch.
const currentLanguage = ref<Language>(
  resolveInitialLanguage(
    window.location.search,
    localStorage.getItem('equalizer-language'),
    localStorage.getItem('locale')
  )
)
localStorage.setItem('equalizer-language', currentLanguage.value)

const isLanguage = (value: unknown): value is Language => value === 'de' || value === 'en'

/** Current UI language ('de' | 'en'), readable outside components (router). */
export function getCurrentLanguage(): Language {
  return currentLanguage.value
}

// Update all SSI elements that use the data-lang-de / data-lang-en pattern
function updateDataLangElements(lang: Language): void {
  document.querySelectorAll('[data-lang-de][data-lang-en]').forEach((el) => {
    const text = el.getAttribute(`data-lang-${lang}`)
    if (el.textContent !== text) {
      el.textContent = text
    }
  })
}

// Ensure SSI data-lang-* elements are populated as soon as the DOM is ready
// and keep watching for any SSI content injected later
let ssiObserver: MutationObserver | null = null
function initSSILanguageSync(lang: Language): void {
  // Immediate pass
  updateDataLangElements(lang)

  // After next frame (catches late paints / server-injected fragments)
  requestAnimationFrame(() => updateDataLangElements(lang))

  // MutationObserver: only react to NEW child nodes being added (not text changes)
  if (!ssiObserver) {
    ssiObserver = new MutationObserver((mutations) => {
      const hasNewNodes = mutations.some((m) => m.addedNodes.length > 0)
      if (hasNewNodes) {
        updateDataLangElements(currentLanguage.value)
      }
    })
    ssiObserver.observe(document.body, { childList: true, subtree: true })
  }
}

/** Detail of the `language-changed` / `locale-changed` events exchanged with the SSI nav. */
interface LanguageEventDetail {
  lang?: unknown
  locale?: unknown
}

export function useI18n() {
  const t = computed(() => translations[currentLanguage.value])

  // Apply a language: state, storage, <html lang>, meta tags
  function applyLanguage(lang: Language): void {
    currentLanguage.value = lang
    localStorage.setItem('equalizer-language', lang)
    localStorage.setItem('locale', lang)
    document.documentElement.lang = lang

    // Update meta tags for the current route
    applyPageMeta(routePathFromLocation(window.location.pathname), lang)

    // Update data-lang-* elements in SSI partials
    updateDataLangElements(lang)
  }

  const setLanguage = (lang: string): void => {
    if (lang !== currentLanguage.value && isLanguage(lang)) {
      applyLanguage(lang)

      // Dispatch language-changed event for SSI partials (cookie banner, etc.)
      window.dispatchEvent(new CustomEvent('language-changed', { detail: { lang } }))

      // Dispatch locale-changed event for SSI global nav
      window.dispatchEvent(new CustomEvent('locale-changed', { detail: { locale: lang } }))
    }
  }

  // Sync SSI nav localStorage key on init
  localStorage.setItem('locale', currentLanguage.value)

  // Handle language change from any source (internal or SSI nav)
  function handleExternalLanguageChange(lang: unknown): void {
    if (isLanguage(lang) && lang !== currentLanguage.value) {
      applyLanguage(lang)
    }
  }

  // Listen for internal language-changed events
  window.addEventListener('language-changed', (e) => {
    handleExternalLanguageChange((e as CustomEvent<LanguageEventDetail>).detail?.lang)
  })

  // Listen for SSI global nav locale-changed events
  window.addEventListener('locale-changed', (e) => {
    handleExternalLanguageChange((e as CustomEvent<LanguageEventDetail>).detail?.locale)
  })

  // Bootstrap: populate SSI elements + start observer
  initSSILanguageSync(currentLanguage.value)

  return {
    t,
    currentLanguage: computed(() => currentLanguage.value),
    setLanguage,
  }
}

/** What `provide('i18n', …)` hands to the components. */
export type I18n = ReturnType<typeof useI18n>
