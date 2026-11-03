/**
 * Design Tokens von Equalizer 19: Zugriff auf tokens.json aus JavaScript,
 * z. B. für Canvas- oder SVG-Zeichnung (AudioMeter, Visualization), wo kein
 * CSS var() verfügbar ist. Laufzeit-Quelle für Styles bleibt tokens.css.
 *
 * Werte in tokens.json dürfen andere Tokens referenzieren
 * (`{color.dark.--accent-primary}`); die Funktionen hier lösen das auf.
 */
import tokens from './tokens.json'

/** @typedef {'dark' | 'light'} ThemeName */

export const designTokens = tokens

/** Alias-Syntax der Design-Tokens: `{group.theme.--name}`. */
const ALIAS = /^\{([\w-]+(?:\.[\w-]+)*)\}$/

/**
 * Löst einen Token-Wert auf; Aliase werden rekursiv ersetzt.
 * @param {unknown} value
 * @param {number} [depth]
 * @returns {string}
 */
function resolveValue(value, depth = 0) {
  if (Array.isArray(value)) return value.join(', ')
  const text = String(value)
  const alias = text.match(ALIAS)
  if (!alias) return text
  if (depth > 8) throw new Error(`Token-Alias zu tief verschachtelt: ${text}`)
  /** @type {any} */
  let node = tokens
  for (const key of alias[1].split('.')) {
    node = node?.[key]
    if (node === undefined) throw new Error(`Unbekannter Token-Alias: ${text}`)
  }
  return resolveValue(node.$value, depth + 1)
}

/**
 * Farbwert eines Tokens für ein Theme, z. B. colorToken('dark', '--accent-primary') → '#c9984d'.
 * @param {ThemeName} theme
 * @param {string} name CSS-Variablenname inklusive `--`
 * @returns {string}
 */
export function colorToken(theme, name) {
  const entry = tokens.color[theme]?.[name]
  if (!entry) throw new Error(`Unbekanntes Farb-Token: ${name} (${theme})`)
  return resolveValue(entry.$value)
}

/**
 * Flache Farbkarte eines Themes, Schlüssel sind die CSS-Variablennamen.
 * @param {ThemeName} theme
 * @returns {Readonly<Record<string, string>>}
 */
export function themeColors(theme) {
  /** @type {Record<string, string>} */
  const result = {}
  for (const name of Object.keys(tokens.color[theme])) {
    if (name.startsWith('--')) result[name] = colorToken(theme, name)
  }
  return result
}

/**
 * var()-Ausdruck für ein Token, z. B. cssVar('--text-primary') → 'var(--text-primary)'.
 * @param {string} name
 * @param {string} [fallback]
 * @returns {string}
 */
export function cssVar(name, fallback) {
  return fallback === undefined ? `var(${name})` : `var(${name}, ${fallback})`
}

/**
 * Aktueller Wert eines Tokens im Dokument (nach Theme und Kontrastmodus).
 * @param {string} name
 * @param {Element} [element]
 * @returns {string}
 */
export function readCssVar(name, element = document.documentElement) {
  return getComputedStyle(element).getPropertyValue(name).trim()
}
