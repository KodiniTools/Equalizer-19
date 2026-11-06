import { computed, ref } from 'vue'

/**
 * Minimaler i18n-Ersatz für Komponententests: jeder Schlüssel liefert sich
 * selbst als Text, damit Templates mit dynamischen Schlüsseln rendern.
 * Verwendung: mount(Comp, { global: { provide: i18nStub() } })
 */
export function i18nStub(language = 'de') {
  const t = computed(() => new Proxy({}, { get: (_, key) => String(key) }))
  return { i18n: { t, currentLanguage: ref(language) } }
}
