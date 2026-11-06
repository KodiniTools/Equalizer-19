# EQUALIZER 19 - Vue 3 Edition

Eine moderne, professionelle 19-Band-Audio-Equalizer-Anwendung, die mit Vue 3 und der Composition API erstellt wurde. Die gesamte Verarbeitung läuft im Browser; es gibt kein Backend und keine Uploads.

## Features

- **19-Band Parametrischer Equalizer** (20 Hz bis 20 kHz, Peaking-Filter) mit Frequenzkurve
- **Dynamics Processor** (Kompressor) mit Echtzeit-Pegelanzeige
- **Audio-Eingang**: Line-In, Mikrofon, Stereomix oder der Ton des PCs live durch EQ und Kompressor
- **Audio-Recording** in WebM (Opus) und verlustfreiem WAV (16 / 24 Bit PCM oder 32 Bit Float, per AudioWorklet direkt als PCM mitgeschnitten), mit Countdown und Dateidialog
- **Echtzeit-Visualisierung** mit Spektrum-Analyzer und Ein-/Ausgangspegel
- **Preset-Management** für EQ (eingebaut + eigene, localStorage) und Kompressor
- **Undo/Redo** für alle Klangeinstellungen (EQ-Bänder, Bypass, Kompressor) – per Buttons oder Strg+Z / Strg+Y
- **Playlist-Management** mit Drag & Drop, Shuffle und Repeat; Übergabe vom Audio-Konverter
- **Internationalisierung** (Deutsch/Englisch)
- **Theme-Switching** (Dark/Light) über Design-Tokens
- **Landing-Page und FAQ** mit interaktiver EQ-Demo

## Technologie-Stack

- **Vue 3** (Composition API, `<script setup>`) mit **Vue Router**
- **Pinia** für den globalen Zustand (Audio-Engine, Playlist, Player, Verlauf, Toasts)
- **Vite 7** als Build-Tool
- **Web Audio API** (BiquadFilter, DynamicsCompressor, Analyser, AudioWorklet) und MediaRecorder API
- **Design-Tokens** als CSS Custom Properties (`src/design-system/`) und ein eigener Satz **Ui-Komponenten** (`src/components/ui/`)
- **Inline-SVG-Icons** (`AppIcon.vue`, `src/utils/icons.ts`), keine Icon-Font
- **TypeScript** für die Übersetzungen (`src/i18n/`), Typprüfung per `vue-tsc` auch für JS-Dateien (`allowJs`)
- **Tests**: Vitest für alles, Vue Test Utils (jsdom) für Komponenten und Stores, Node-Umgebung für reine Logik
- **ESLint + Prettier**, GitHub-Actions-CI

## Installation

Voraussetzung: Node.js 20.19+ oder 22.12+ (siehe `engines` in `package.json`).

```bash
# Dependencies installieren
npm install

# Entwicklungsserver starten (http://localhost:3000)
npm run dev

# Production Build erstellen (dist/, Base-URL /equaliser19/)
npm run build

# Preview des Production Builds
npm run preview
```

## Qualitätssicherung

```bash
npm test               # Vitest: Logik-Tests (tests/) und Komponenten-/Store-Tests (src/**/__tests__)
npm run test:watch     # Vitest im Watch-Modus

npm run lint           # ESLint (JS, TS, Vue)
npm run format:check   # Prettier
npm run type-check     # vue-tsc: TypeScript und JS (allowJs), inkl. en.ts gegen de.ts
```

Die CI (`.github/workflows/ci.yml`) führt Lint, Format, Type-Check, Tests und Build bei jedem Pull Request aus.

Besondere Tests:

- `src/design-system/__tests__/designTokens.spec.js` sorgt dafür, dass Styles nur Design-Tokens verwenden. Die Liste der verbliebenen Farb-Literale ist eingefroren und darf nur kleiner werden.
- `src/i18n/__tests__/translations.spec.js` prüft, dass `en` dieselben Schlüssel und Platzhalter hat wie `de`; `en.ts` ist zusätzlich als `Record<TranslationKey, string>` typisiert.
- Komponententests bekommen die Übersetzungen über `src/__tests__/i18nStub.js` (jeder Schlüssel liefert sich selbst).

## Projektstruktur

```
Equalizer-19/
├── index.html                  # Entry-Point, bindet die SSI-Partials der Hauptseite ein
├── package.json
├── vite.config.js              # Base /equaliser19/, Alias @ → src, Worklet nicht inlinen
├── vitest.config.js            # Komponententests (jsdom), setup in src/__tests__/setup.js
├── tsconfig.json               # strict, allowJs; Grundlage für vue-tsc
├── eslint.config.js
├── .github/workflows/ci.yml    # Lint, Format, Type-Check, Tests, Build
├── src/
│   ├── main.js                 # Entry Point: Pinia, Router
│   ├── App.vue                 # Root: stellt i18n und Theme bereit, Tastaturkürzel
│   ├── assets/
│   │   └── style.css           # Globale Styles; importiert design-system/tokens.css
│   ├── design-system/          # Tokens: tokens.css (Laufzeit), tokens.json, tokens.ts, Tests, README
│   ├── components/
│   │   ├── ui/                 # Design-System-Komponenten: UiButton, UiIconButton, UiSwitch, SliderField,
│   │   │                       #   UiSegmentedControl, UiPanel, UiDialog, UiToast (+ range.css, README, Tests)
│   │   ├── landing/            # Abschnitte der Landing-Page (Hero, Facts, Signalkette, Schritte, Details,
│   │   │                       #   Blog, CTA), HeroNav, HeroEqualizer, landing.css
│   │   ├── equalizer/          # Teile des Equalizers: EqPresetControls, EqPresetForm, EqBands
│   │   ├── recorder/           # Teile der Aufnahme: RecorderTime, RecorderSettings, RecorderButtons,
│   │   │                       #   CountdownOverlay, DownloadDialog
│   │   ├── AppIcon.vue         # Inline-SVG-Icon (Namen aus utils/icons.ts)
│   │   ├── AudioMeter.vue      # Ein-/Ausgangspegel
│   │   ├── CompressorPresets.vue # Kompressor-Preset-Dropdown (in DynamicsProcessor)
│   │   ├── DynamicsProcessor.vue # Kompressor-UI
│   │   ├── Equalizer.vue       # Equalizer: Container für components/equalizer/
│   │   ├── HistoryControls.vue # Undo/Redo-Buttons (Kopfzeile der App)
│   │   ├── InputSource.vue     # Eingangsquelle: Playlist oder Audio-Eingang
│   │   ├── Notification.vue    # Toast-Host für UiToast
│   │   ├── PlayerTransport.vue # Wiedergabe-Buttons (Teil der Player-Leiste)
│   │   ├── Playlist.vue        # Playlist-Verwaltung
│   │   ├── RecorderControls.vue # Aufnahme & Download: Container für components/recorder/
│   │   ├── RelatedTools.vue    # Links zu Konverter, Cutter, Normalisierer
│   │   ├── StickyPlayerBar.vue # Player-Leiste: Upload, Fortschritt, Layout
│   │   ├── VolumeControl.vue   # Lautstärke (Teil der Player-Leiste)
│   │   └── Visualization.vue   # Spektrum-Analyzer
│   ├── stores/                 # Pinia-Stores (Setup-Stores)
│   │   ├── audioEngine.js      # Audio-Verarbeitungskette (AudioNodes shallowRef + markRaw)
│   │   ├── playlist.js         # Playlist: Tracks, Reihenfolge, Shuffle/Repeat
│   │   ├── player.js           # Wiedergabe: Audio-Element, Position, Lautstärke
│   │   ├── history.ts          # Undo/Redo
│   │   └── toast.js            # Benachrichtigungen
│   ├── composables/
│   │   ├── useCountdown.ts     # Countdown vor der Aufnahme
│   │   ├── useCustomPresets.ts # Eigene EQ-Presets (localStorage)
│   │   ├── useFileDrop.ts      # Dateiauswahl & Drag & Drop (inkl. Ordner)
│   │   ├── useI18n.ts          # Sprache, <html lang>, Meta-Tags, SSI-Sync
│   │   ├── useInputSource.ts   # Live-Eingang (Line-In, Stereomix, PC-Ton)
│   │   ├── useKeyboardShortcuts.ts # Tastaturkürzel
│   │   ├── useOutputRecorder.ts # Aufnahme des bearbeiteten Signals
│   │   ├── useTheme.ts         # Theme-Management
│   │   └── useUndoRedo.ts      # Undo/Redo der Klangeinstellungen (beobachtet die Engine)
│   ├── i18n/                   # de.ts (Referenz, TranslationKey), en.ts (typgeprüft gegen de), index.ts
│   ├── data/
│   │   └── blogArticles.ts     # Blog-Beiträge (kodinitools.com/blog) für die Landing-Page
│   ├── pages/                  # LandingPage, AppPage, FaqPage
│   ├── router/                 # Vue Router (Meta-Tags je Route)
│   ├── worklets/               # AudioWorklet (PCM-Aufnahme)
│   ├── utils/
│   │   ├── audioBlob.ts        # Blob-Prüfung für übergebene Dateien
│   │   ├── audioChain.ts       # Routing der Verarbeitungskette (reine Funktionen)
│   │   ├── blogCards.ts        # Blog-Karten: Datum/Sprache (reine Funktionen)
│   │   ├── eqCurve.ts          # Frequenzkurve als SVG-Pfad (reine Funktionen)
│   │   ├── history.ts          # Generischer Undo/Redo-Stack (reine Funktionen)
│   │   ├── icons.ts            # Inline-SVG-Icon-Set
│   │   ├── playbackOrder.ts    # Playlist-Navigation (reine Funktionen)
│   │   ├── presets.ts          # EQ/Comp Presets, Bandfrequenzen
│   │   ├── processingState.ts  # Snapshot/Diff der Klangeinstellungen für Undo/Redo
│   │   ├── seoMeta.ts          # Titel/Description je Route und Sprache
│   │   ├── sharedFileRepository.ts # Übergabe vom Audio-Konverter (IndexedDB)
│   │   ├── wavEncoder.ts       # WAV-Export (16/24/32 Bit)
│   │   └── workletLoader.ts    # AudioWorklet laden (mit Timeout/Fallback)
│   └── __tests__/              # Vitest-Setup und i18n-Stub für Komponententests
└── tests/                      # Logik-Tests (Vitest, Node-Umgebung); Komponenten-/Store-Tests liegen in src/**/__tests__
```

Weitere Dokumente: `CONTEXT.md` (Architektur, Datenmodelle, Stores), `INSTALLATION.md`, `DEPLOY.md`, `LIESMICH.txt`.

## Verwendung

1. **Audio-Dateien laden**: Dateien oder einen Ordner wählen oder in die Player-Leiste ziehen
2. **Equalizer anpassen**: Die 19 Frequenzbänder ziehen oder ein Preset wählen; eigene Presets speichern
3. **Kompressor einstellen**: Threshold, Knee, Ratio, Attack und Release anpassen oder ein Preset wählen
4. **Audio-Eingang nutzen**: Unter „Quelle“ auf den Audio-Eingang wechseln (Line-In, Mikrofon, PC-Ton)
5. **Aufnehmen**: Format (WAV/WebM), Bit-Tiefe und Startverzögerung wählen, aufnehmen, herunterladen
6. **Visualisierung**: Spektrum und Pegel in Echtzeit verfolgen
7. **Playlist verwalten**: Reihenfolge per Drag & Drop, Shuffle und Repeat

## Tastenkombinationen

- **Leertaste**: Play/Pause
- **←/→**: ±5 Sekunden springen
- **↑/↓**: Lautstärke
- **N / P**: Nächster / vorheriger Track
- **M**: Mute/Unmute
- **Strg+Z** (Mac: Cmd+Z): Rückgängig
- **Strg+Y** oder **Strg+Shift+Z**: Wiederholen

## Undo/Redo

Jede Änderung an den Klangeinstellungen ist ein Schritt im Verlauf: EQ-Bänder, EQ-Bypass, Kompressor-Parameter, Kompressor an/aus sowie Presets und Reset. Ein Slider-Zug zählt als ein Schritt, ein Preset mit 19 Bändern ebenfalls. Bis zu 100 Schritte lassen sich über die Buttons in der Kopfzeile oder per Tastatur zurücknehmen und wiederholen; Tooltips und Hinweise nennen den jeweiligen Schritt. Wiedergabe-Einstellungen (Lautstärke, Position, Playlist) gehören bewusst nicht zum Verlauf.

## Browser-Kompatibilität

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

Benötigt einen modernen Browser mit Web Audio API-Unterstützung. Der Ton des PCs als Eingang (Bildschirmfreigabe mit Audio) ist in Chrome und Edge verfügbar.

## Lizenz

MIT License - Erstellt von KodiniTools

## Credits

- Original JavaScript-Version: EQUALIZER 19
- Vue 3 Migration: 2025
- Icons: eigenes Inline-SVG-Set (`src/utils/icons.ts`)

  Author: Dinko Ramić - Kodini Tools - kodinitools.com
