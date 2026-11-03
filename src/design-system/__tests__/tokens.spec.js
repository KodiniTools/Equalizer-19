// @vitest-environment node
/**
 * Konsistenz der Design-Tokens: tokens.json ↔ tokens.css ↔ Nav-Block in style.css.
 * Wer einen Wert ändert, muss ihn an beiden Stellen ändern.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import tokens from '../tokens.json'
import { colorToken, themeColors } from '../tokens.js'
import { DESIGN_SYSTEM, SRC, cssBlock, mediaBlock, normalizeValue } from './tokenTestUtils'

const tokensCss = readFileSync(join(DESIGN_SYSTEM, 'tokens.css'), 'utf8')
const styleCss = readFileSync(join(SRC, 'assets/style.css'), 'utf8')

const dark = cssBlock(tokensCss, ':root')
const light = cssBlock(tokensCss, "[data-theme='light']")
const highContrast = mediaBlock(tokensCss, '(prefers-contrast: high)')
const hcDark = cssBlock(highContrast, ':root')
const hcLight = cssBlock(highContrast, "[data-theme='light']")
const navLight = cssBlock(styleCss, "[data-theme='light'] .global-nav")

/** Alle JSON-Einträge, die eine CSS-Variable beschreiben: name → [{ path, value }]. */
function jsonVariables() {
  const result = new Map()
  const walk = (node, path) => {
    for (const [key, value] of Object.entries(node)) {
      if (key.startsWith('$')) continue
      if (key.startsWith('--') && value && typeof value === 'object' && '$value' in value) {
        if (!result.has(key)) result.set(key, [])
        result.get(key).push({ path: path.join('.'), value: normalizeValue(value.$value) })
      } else if (value && typeof value === 'object') {
        walk(value, [...path, key])
      }
    }
  }
  walk(tokens, [])
  return result
}

const jsonVars = jsonVariables()

/**
 * @param {Map<string, string>} cssVars
 * @param {string} themePath Pfad-Suffix in tokens.json, z. B. 'dark' oder 'high-contrast.light'
 */
function expectThemeMatchesJson(cssVars, themePath, label) {
  for (const [name, cssValue] of cssVars) {
    const entries = jsonVars.get(name) ?? []
    const themed = entries.filter((e) => e.path === themePath || e.path.endsWith(`.${themePath}`))
    // Theme-neutrale Gruppen (typography) gelten für beide Themes
    const neutral = entries.filter((e) => !/\b(dark|light)\b/.test(e.path))
    const candidates = [...themed, ...neutral].map((e) => e.value)
    expect(candidates, `${label}: ${name} fehlt in tokens.json unter …${themePath}`).not.toEqual([])
    expect(candidates, `${label}: ${name} weicht zwischen CSS und JSON ab`).toContain(
      normalizeValue(cssValue)
    )
  }
}

describe('tokens.css ↔ tokens.json', () => {
  it('liest beide Theme-Blöcke', () => {
    expect(dark.size).toBeGreaterThan(25)
    expect(light.size).toBe(dark.size - 2) // ohne --font-sans / --font-mono
  })

  it('dark: jeder CSS-Wert steht gleich in tokens.json', () => {
    expectThemeMatchesJson(dark, 'dark', 'dark')
  })

  it('light: jeder CSS-Wert steht gleich in tokens.json', () => {
    expectThemeMatchesJson(light, 'light', 'light')
  })

  it('high-contrast: beide Überschreibungen stehen gleich in tokens.json', () => {
    expectThemeMatchesJson(hcDark, 'high-contrast.dark', 'high-contrast dark')
    expectThemeMatchesJson(hcLight, 'high-contrast.light', 'high-contrast light')
    expect(hcDark.size).toBe(Object.keys(tokens.color['high-contrast'].dark).length)
  })

  it('nav-light: der Block [data-theme=light] .global-nav in style.css steht gleich in tokens.json', () => {
    expect(navLight.size).toBeGreaterThan(0)
    expectThemeMatchesJson(navLight, 'nav-light', 'nav-light')
    expect([...navLight.keys()].sort()).toEqual(
      Object.keys(tokens.color['nav-light'])
        .filter((k) => k.startsWith('--'))
        .sort()
    )
  })

  it('jedes Farb-Token aus tokens.json ist in tokens.css deklariert', () => {
    for (const theme of ['dark', 'light']) {
      const cssVars = theme === 'dark' ? dark : light
      for (const name of Object.keys(tokens.color[theme])) {
        if (!name.startsWith('--')) continue
        expect(cssVars.has(name), `${theme}: ${name} fehlt in tokens.css`).toBe(true)
      }
    }
  })

  it('jedes Dark-Token hat ein Light-Gegenstück (außer bewusst theme-neutralen)', () => {
    const neutral = new Set(['--font-sans', '--font-mono'])
    for (const name of dark.keys()) {
      if (neutral.has(name)) continue
      expect(light.has(name), `${name} fehlt im Light-Theme`).toBe(true)
    }
    for (const name of light.keys()) {
      expect(dark.has(name), `${name} fehlt im Dark-Theme`).toBe(true)
    }
  })

  it('Variablen in tokens.css verweisen nur auf definierte Tokens', () => {
    for (const [block, vars] of [
      ['dark', dark],
      ['light', light],
    ]) {
      for (const [name, value] of vars) {
        for (const [, ref] of value.matchAll(/var\((--[\w-]+)\)/g)) {
          expect(dark.has(ref) || light.has(ref), `${block}: ${name} → ${ref} undefiniert`).toBe(
            true
          )
        }
      }
    }
  })
})

describe('tokens.js', () => {
  it('löst Aliase auf', () => {
    expect(colorToken('dark', '--primary-bg')).toBe('#0a1426')
    expect(colorToken('dark', '--eq-boost')).toBe(colorToken('dark', '--accent-primary'))
    expect(colorToken('light', '--eq-cut')).toBe(colorToken('light', '--accent-secondary'))
  })

  it('themeColors liefert alle Farb-Tokens eines Themes als Literale', () => {
    const colors = themeColors('light')
    expect(Object.keys(colors).length).toBe(
      Object.keys(tokens.color.light).filter((k) => k.startsWith('--')).length
    )
    for (const value of Object.values(colors)) expect(value).not.toMatch(/\{|var\(/)
  })

  it('wirft bei unbekannten Tokens', () => {
    expect(() => colorToken('dark', '--nope')).toThrow(/Unbekanntes Farb-Token/)
  })
})
