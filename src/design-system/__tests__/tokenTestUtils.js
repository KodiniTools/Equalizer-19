// @vitest-environment node
/** Gemeinsame Helfer der Token-Tests: CSS-Blöcke parsen, Style-Blöcke sammeln. */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'

export const SRC = resolve(__dirname, '../..')
export const DESIGN_SYSTEM = resolve(__dirname, '..')

/** Deklarationen `--name: value` des ersten Top-Level-Blocks mit genau diesem Selektor. */
export function cssBlock(source, selector) {
  const escaped = selector.replace(/[[\]'.()*+?:]/g, '\\$&')
  const match = source.match(new RegExp(`(?:^|\\n)[ \\t]*${escaped}\\s*\\{([^}]*)\\}`))
  const result = new Map()
  if (!match) return result
  for (const [, name, value] of match[1].matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    result.set(name, value.trim())
  }
  return result
}

/** Inhalt eines @media-Blocks als Quelltext (für verschachtelte Selektoren). */
export function mediaBlock(source, query) {
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
export function normalizeValue(value) {
  const text = Array.isArray(value) ? value.join(', ') : String(value)
  return text
    .replace(/\{[\w.-]+?\.(--[\w-]+)\}/g, 'var($1)')
    .replace(/['"]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function collect(dir, out = []) {
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
export function styleSheets() {
  return collect(SRC).flatMap((file) => {
    const source = readFileSync(file, 'utf8')
    const blocks = file.endsWith('.vue')
      ? [...source.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1] ?? '')
      : [source]
    return blocks.map((css) => [
      relative(SRC, file),
      css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/@font-face\s*\{[^}]*\}/g, ''),
    ])
  })
}

/** Treffer `datei: fund` eines Musters (g-Flag) in allen Style-Blöcken. */
export function findInStyles(pattern, keep = () => true) {
  const hits = []
  for (const [file, css] of styleSheets()) {
    for (const m of css.matchAll(pattern)) {
      if (keep(m)) hits.push(`${file}: ${m[0].trim().replace(/\s+/g, ' ').slice(0, 80)}`)
    }
  }
  return hits
}
