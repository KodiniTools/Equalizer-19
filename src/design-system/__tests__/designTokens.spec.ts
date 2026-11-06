// @vitest-environment node
/**
 * Regressionsschutz für die Design-Tokens über alle Styles in src/ außer
 * src/design-system/: Komponenten und style.css laufen auf var(--token), ohne
 * Literal-Fallbacks und ohne eigene Farbwerte. Die noch vorhandenen Literale
 * sind unten eingefroren; die Liste darf nur kleiner werden (Schritt 2:
 * Ui-Komponenten).
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { DESIGN_SYSTEM, cssBlock, findInStyles, styleSheets } from './tokenTestUtils'

const tokensCss = readFileSync(join(DESIGN_SYSTEM, 'tokens.css'), 'utf8')
const tokenNames = new Set([
  ...cssBlock(tokensCss, ':root').keys(),
  ...cssBlock(tokensCss, "[data-theme='light']").keys(),
])

/** Variablen, die außerhalb von tokens.css definiert werden dürfen, je mit Grund. */
const LOCAL_VARIABLES: Readonly<Record<string, string>> = {
  // Layout-Maße des EQ, je Breakpoint neu gesetzt
  '--eq-pad-x': 'components/equalizer/EqBands.vue',
  '--eq-pad-y': 'components/equalizer/EqBands.vue',
  '--eq-stage-h': 'components/equalizer/EqBands.vue',
  // Anker-Offset unter globaler Nav + HeroNav
  '--lp-anchor-offset': 'pages/LandingPage.vue',
  // Light-Palette des externen Nav-Partials (siehe tokens.json color.nav-light);
  // --nav-bg wird dort bewusst für .global-nav neu aufgebaut
  '--nav-bg': 'assets/style.css',
  '--nav-text': 'assets/style.css',
  '--nav-text-hover': 'assets/style.css',
  '--nav-bg-hover': 'assets/style.css',
  '--nav-border': 'assets/style.css',
  '--nav-shadow': 'assets/style.css',
  '--dropdown-bg': 'assets/style.css',
  '--dropdown-border': 'assets/style.css',
  '--dropdown-shadow': 'assets/style.css',
  '--accent-color': 'assets/style.css',
}

/** Zur Laufzeit per JS gesetzt (StickyPlayerBar), deshalb mit Fallback erlaubt. */
const RUNTIME_VARIABLES = new Set(['--sticky-player-h'])

/**
 * Eingefrorene Farb-Literale (Stand Schritt 1), Format `datei: literal` → Anzahl.
 * Überwiegend Overlays, Schatten und Meter-Farben; sie werden in Schritt 2 auf
 * Tokens umgestellt. Ein neuer Eintrag oder eine höhere Anzahl lässt den Test fehlschlagen.
 */
const FROZEN_LITERALS: Readonly<Record<string, number>> = {
  'assets/style.css: #001d3d': 1,
  'assets/style.css: #003971': 1,
  'assets/style.css: #014f99': 1,
  'assets/style.css: rgba(0, 57, 113, 0.08)': 1,
  'assets/style.css: rgba(0, 57, 113, 0.12)': 1,
  'assets/style.css: rgba(1, 79, 153, 0.06)': 1,
  'assets/style.css: rgba(1, 79, 153, 0.08)': 1,
  'assets/style.css: rgba(1, 79, 153, 0.1)': 1,
  'assets/style.css: rgba(255, 255, 255, 0.97)': 1,
  'components/AudioMeter.vue: #1db954': 2,
  'components/AudioMeter.vue: #ef4444': 3,
  'components/AudioMeter.vue: #f59e0b': 2,
  'components/AudioMeter.vue: #fff': 1,
  'components/RecorderControls.vue: #ef4444': 1,
  'components/RecorderControls.vue: rgba(239, 68, 68, 0.2)': 1,
  'components/equalizer/EqBands.vue: #ffffff': 2,
  'components/equalizer/EqBands.vue: rgba(0, 0, 0, 0.35)': 2,
  'components/equalizer/EqBands.vue: rgba(127, 127, 140, 0.08)': 1,
  'components/equalizer/EqPresetControls.vue: #ffffff': 1,
  'components/equalizer/EqPresetForm.vue: #ffffff': 2,
  'components/landing/HeroEqualizer.vue: rgba(0, 0, 0, 0.3)': 2,
  'components/recorder/CountdownOverlay.vue: rgba(0, 0, 0, 0.35)': 1,
  'components/recorder/RecorderButtons.vue: #000': 6,
  'components/recorder/RecorderButtons.vue: #ffffff': 3,
  'components/recorder/RecorderButtons.vue: rgba(239, 68, 68, 0.25)': 1,
  'components/recorder/RecorderTime.vue: #ef4444': 1,
  'components/recorder/RecorderTime.vue: rgba(239, 68, 68, 0.15)': 1,
  'components/StickyPlayerBar.vue: rgba(0, 0, 0, 0.12)': 1,
  'components/StickyPlayerBar.vue: rgba(0, 217, 255, 0.12)': 1,
  'pages/AppPage.vue: rgba(1, 79, 153, 0.12)': 1,
  'pages/AppPage.vue: rgba(1, 79, 153, 0.3)': 1,
  'pages/AppPage.vue: rgba(239, 68, 68, 0.12)': 1,
  'pages/AppPage.vue: rgba(239, 68, 68, 0.3)': 1,
  'pages/AppPage.vue: rgba(245, 158, 11, 0.12)': 1,
  'pages/AppPage.vue: rgba(245, 158, 11, 0.3)': 1,
  'pages/AppPage.vue: rgba(74, 222, 128, 0.12)': 1,
  'pages/AppPage.vue: rgba(74, 222, 128, 0.3)': 1,
}

describe('Styles außerhalb von src/design-system', () => {
  it('nutzen var() ohne Literal-Fallback', () => {
    const hits = findInStyles(/var\((--[\w-]+)\s*,/g, (m) => !RUNTIME_VARIABLES.has(m[1]))
    expect(hits).toEqual([])
  })

  it('verwenden nur Variablen, die in tokens.css oder lokal definiert sind', () => {
    const unknown = findInStyles(
      /var\((--[\w-]+)/g,
      (m) => !tokenNames.has(m[1]) && !(m[1] in LOCAL_VARIABLES) && !RUNTIME_VARIABLES.has(m[1])
    )
    expect(unknown).toEqual([])
  })

  it('definieren keine eigenen Variablen außer den dokumentierten', () => {
    const hits: string[] = []
    for (const [file, css] of styleSheets()) {
      // Nur Deklarationen am Zeilenanfang; BEM-Modifier wie .ui-button--primary: sind keine
      for (const [, name] of css.matchAll(/^\s*(--[\w-]+)\s*:/gm)) {
        if (LOCAL_VARIABLES[name] === file) continue
        hits.push(
          tokenNames.has(name)
            ? `${file}: ${name} überschreibt ein Token`
            : `${file}: ${name} ist nicht in LOCAL_VARIABLES`
        )
      }
    }
    expect(hits).toEqual([])
  })

  it('bringen keine neuen Farb-Literale mit (eingefrorene Liste darf nur schrumpfen)', () => {
    const counts: Record<string, number> = {}
    for (const hit of findInStyles(/#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\)/g)) {
      counts[hit] = (counts[hit] ?? 0) + 1
    }
    const violations = Object.entries(counts)
      .filter(([key, n]) => n > (FROZEN_LITERALS[key] ?? 0))
      .map(([key, n]) => `${key} (${n}×, erlaubt ${FROZEN_LITERALS[key] ?? 0})`)
    expect(violations).toEqual([])
  })

  it('FROZEN_LITERALS enthält keine Einträge mehr, die es nicht mehr gibt', () => {
    const current = new Set(findInStyles(/#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\)/g))
    const stale = Object.keys(FROZEN_LITERALS).filter((key) => !current.has(key))
    expect(stale, 'aus FROZEN_LITERALS entfernen').toEqual([])
  })
})
