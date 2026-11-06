// @vitest-environment node
/** Gemeinsame Helfer der Token-Tests: CSS-Blöcke parsen, Style-Blöcke sammeln. */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'

export const SRC = resolve(__dirname, '../..')
export const DESIGN_SYSTEM = resolve(__dirname, '..')

/** Deklarationen `--name: value` des ersten Top-Level-Blocks mit genau diesem Selektor. */
export function cssBlock(source: string, selector: string): Map<string, string> {
  const escaped = selector.replace(/[[\]'.()*+?:]/g, '\\$&')
  const match = source.match(new RegExp(`(?:^|\\n)[ \\t]*${escaped}\\s*\\{([^}]*)\\}`))
  const result = new Map<string, string>()
  if (!match) return result
  for (const [, name, value] of match[1].matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    result.set(name, value.trim())
  }
  return result
}

/** Inhalt eines @media-Blocks als Quelltext (für verschachtelte Selektoren). */
export function mediaBlock(source: string, query: string): string {
  const start = source.indexOf(`@media ${query}`)
  if (start < 0) return ''
  let depth = 0
  for (let i = source.indexOf('{', start); i < source.length; i++) {
    if (source[i] === '{') depth++
    else if (source[i] === '}' && --depth === 0) return source.slice(start, i + 1)
  }
  return ''
}

/** Normalisiert einen Token-Wert für den Vergleich JSON ↔ CSS. */
export function normalizeValue(value: unknown): string {
  const text = Array.isArray(value) ? value.join(', ') : String(value)
  return text
    .replace(/\{[\w.-]+?\.(--[\w-]+)\}/g, 'var($1)')
    .replace(/['"]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function collect(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      if (!['design-system', '__tests__', 'worklets'].includes(entry)) collect(full, out)
    } else if (entry.endsWith('.vue') || entry.endsWith('.css')) out.push(full)
  }
  return out
}

/**
 * Alle Style-Blöcke unter src/ außer design-system als [datei, css];
 * Kommentare und @font-face ausgeblendet.
 */
/** [datei, css] je Style-Block */
export type StyleBlock = [file: string, css: string]

export function styleSheets(): StyleBlock[] {
  return collect(SRC).flatMap((file) => {
    const source = readFileSync(file, 'utf8')
    const blocks = file.endsWith('.vue')
      ? [...source.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1] ?? '')
      : [source]
    return blocks.map(
      (css): StyleBlock => [
        relative(SRC, file),
        css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/@font-face\s*\{[^}]*\}/g, ''),
      ]
    )
  })
}

/** Treffer `datei: fund` eines Musters (g-Flag) in allen Style-Blöcken. */
export function findInStyles(
  pattern: RegExp,
  keep: (match: RegExpMatchArray) => boolean = () => true
): string[] {
  const hits: string[] = []
  for (const [file, css] of styleSheets()) {
    for (const m of css.matchAll(pattern)) {
      if (keep(m)) hits.push(`${file}: ${m[0].trim().replace(/\s+/g, ' ').slice(0, 80)}`)
    }
  }
  return hits
}
