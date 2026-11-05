import de, { type TranslationKey } from './de'
import en from './en'

export type Language = 'de' | 'en'

export const LANGUAGES: readonly Language[] = ['de', 'en']

export type { TranslationKey }

/** Übersetzungstabellen je Sprache; `t.value.key` in den Komponenten liest daraus. */
export const translations: Readonly<Record<Language, Readonly<Record<TranslationKey, string>>>> = {
  de,
  en,
}
