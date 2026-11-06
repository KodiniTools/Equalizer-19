/**
 * Design Tokens von Equalizer 19: Zugriff auf tokens.json aus TypeScript,
 * z. B. für Canvas- oder SVG-Zeichnung (AudioMeter, Visualization), wo kein
 * CSS var() verfügbar ist. Laufzeit-Quelle für Styles bleibt tokens.css.
 *
 * Werte in tokens.json dürfen andere Tokens referenzieren
 * (`{color.dark.--accent-primary}`); die Funktionen hier lösen das auf.
 */
import tokens from './tokens.json'

export type ThemeName = 'dark' | 'light'

/** Ein Eintrag in tokens.json: `$value` plus optionale Metadaten. */
interface TokenEntry {
  $value: unknown
  [meta: string]: unknown
}

export const designTokens = tokens

/** Alias-Syntax der Design-Tokens: `{group.theme.--name}`. */
const ALIAS = /^\{([\w-]+(?:\.[\w-]+)*)\}$/

/**
 * Löst einen Token-Wert auf; Aliase werden rekursiv ersetzt.
 */
function resolveValue(value: unknown, depth = 0): string {
  if (Array.isArray(value)) return value.join(', ')
  const text = String(value)
  const alias = text.match(ALIAS)
  if (!alias) return text
  if (depth > 8) throw new Error(`Token-Alias zu tief verschachtelt: ${text}`)
  let node: unknown = tokens
  for (const key of alias[1].split('.')) {
    node = (node as Record<string, unknown> | undefined)?.[key]
    if (node === undefined) throw new Error(`Unbekannter Token-Alias: ${text}`)
  }
  return resolveValue((node as TokenEntry).$value, depth + 1)
}

/** Die Farb-Tokens eines Themes als Name → Eintrag. */
function themeEntries(theme: ThemeName): Record<string, TokenEntry> {
  const color = tokens.color as unknown as Record<string, Record<string, TokenEntry>>
  return color[theme] ?? {}
}

/**
 * Farbwert eines Tokens für ein Theme, z. B. colorToken('dark', '--accent-primary') → '#c9984d'.
 * @param name CSS-Variablenname inklusive `--`
 */
export function colorToken(theme: ThemeName, name: string): string {
  const entry = themeEntries(theme)[name]
  if (!entry) throw new Error(`Unbekanntes Farb-Token: ${name} (${theme})`)
  return resolveValue(entry.$value)
}

/**
 * Flache Farbkarte eines Themes, Schlüssel sind die CSS-Variablennamen.
 */
export function themeColors(theme: ThemeName): Readonly<Record<string, string>> {
  const result: Record<string, string> = {}
  for (const name of Object.keys(themeEntries(theme))) {
    if (name.startsWith('--')) result[name] = colorToken(theme, name)
  }
  return result
}

/**
 * var()-Ausdruck für ein Token, z. B. cssVar('--text-primary') → 'var(--text-primary)'.
 */
export function cssVar(name: string, fallback?: string): string {
  return fallback === undefined ? `var(${name})` : `var(${name}, ${fallback})`
}

/**
 * Aktueller Wert eines Tokens im Dokument (nach Theme und Kontrastmodus).
 */
export function readCssVar(name: string, element: Element = document.documentElement): string {
  return getComputedStyle(element).getPropertyValue(name).trim()
}
