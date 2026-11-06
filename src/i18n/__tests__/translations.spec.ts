// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { LANGUAGES, translations, type TranslationKey } from '../index'
import de from '../de'
import en from '../en'

const placeholders = (text: string) => [...text.matchAll(/\{\w+\}/g)].map((m) => m[0]).sort()

describe('Übersetzungen', () => {
  it('index bündelt de und en', () => {
    expect(LANGUAGES).toEqual(['de', 'en'])
    expect(translations.de).toBe(de)
    expect(translations.en).toBe(en)
  })

  it('en hat genau die Schlüssel von de', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(de).sort())
  })

  it('kein Text ist leer', () => {
    for (const lang of LANGUAGES) {
      const empty = Object.entries(translations[lang]).filter(([, v]) => !String(v).trim())
      expect(empty, lang).toEqual([])
    }
  })

  it('Platzhalter wie {name} stimmen zwischen de und en überein', () => {
    const mismatched = (Object.keys(de) as TranslationKey[]).filter(
      (key) => placeholders(de[key]).join() !== placeholders(en[key]).join()
    )
    expect(mismatched).toEqual([])
  })
})
