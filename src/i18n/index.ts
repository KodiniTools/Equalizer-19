import de, { type TranslationKey } from './de'
import en from './en'

export type Language = 'de' | 'en'

export const LANGUAGES: readonly Language[] = ['de', 'en']

export type { TranslationKey }

/**
 * Eine Übersetzungstabelle: bekannte Schlüssel liefern immer einen Text,
 * dynamisch gebaute Schlüssel (`lp_step${n}_title`) können fehlen.
 */
export type Translations = Readonly<Record<TranslationKey, string>> &
  Readonly<Record<string, string | undefined>>

/** Übersetzungstabellen je Sprache; `t.value.key` in den Komponenten liest daraus. */
export const translations: Readonly<Record<Language, Translations>> = {
  de,
  en,
}
