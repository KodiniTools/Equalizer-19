# CONTEXT.md - Equalizer 19 Vue Edition

## Projektübersicht

**Equalizer 19** ist eine professionelle Browser-basierte Audio-Equalizer-Anwendung mit 19-Band parametrischem EQ, Dynamics-Processor und Echtzeit-Visualisierung. Die Anwendung läuft komplett clientseitig ohne Backend.

---

## Tech-Stack

### Frontend Framework
| Technologie | Version | Zweck |
|-------------|---------|-------|
| **Vue 3** | ^3.5.44 | UI-Framework mit Composition API |
| **Vue Router** | ^4.6.4 | Seiten `/`, `/app`, `/faq` (`src/router/index.js`, `src/pages/`) |
| **Pinia** | ^3.0.4 | Globaler Zustand (`src/stores/`) |
| **Vite** | ^7.3.7 | Build-Tool und Dev-Server |
| **@vitejs/plugin-vue** | ^6.0.10 | Vue-Integration für Vite |
| **Vitest + @vue/test-utils** | ^3.2.7 / ^2.5.1 | Komponententests (jsdom) unter `src/**/__tests__/*.spec.js` |
| **TypeScript + vue-tsc** | ~5.9.0 / ^3.3.14 | `npm run type-check` (`allowJs`; `.ts` bisher nur unter `src/i18n/`) |
| **ESLint + Prettier** | ^10.4.1 / ^3.8.4 | `npm run lint`, `npm run format:check` (`eslint.config.js` über `@vue/eslint-config-typescript`, lintet `.js`, `.ts` und `.vue`) |

### Audio Processing
| Technologie | Zweck |
|-------------|-------|
| **Web Audio API** | Echtzeit-Audio-Processing (BiquadFilter, DynamicsCompressor, AnalyserNode) |
| **MediaRecorder API** | Audio-Aufnahme in WebM (Opus) |
| **AudioWorklet** | Verlustfreie WAV-Aufnahme: PCM-Mitschnitt hinter dem Master-Gain (`src/worklets/pcm-recorder.worklet.js`), Encoder in `src/utils/wavEncoder.js` (16/24 Bit PCM, 32 Bit Float). Lädt das Worklet-Modul nicht innerhalb von 2 s, nutzt die Aufnahme den ScriptProcessor-Fallback (`src/utils/workletLoader.js`) |

### Styling & Icons
| Technologie | Version | Zweck |
|-------------|---------|-------|
| **Design-Tokens** | - | `src/design-system/tokens.css` (Dark/Light über `[data-theme]`), Quelle `tokens.json`; Komponenten nutzen nur `var(--token)` |
| **Ui-Komponenten** | - | `src/components/ui/` (UiButton, UiSwitch, UiDialog, …), siehe dortige README |
| **Inline-SVG-Icons** | - | `AppIcon.vue` + `src/utils/icons.js`, keine externe Icon-Library |

### Build & Bundling
| Technologie | Version | Zweck |
|-------------|---------|-------|
| **esbuild** | (via Vite) | JavaScript-Bundling |
| **Terser** | ^5.44.1 | Minification |

### Deployment
- **Base URL**: `/equaliser19/`
- **Output**: `dist/` Verzeichnis
- **Dev Server**: Port 3000

---

## Ordnerstruktur

```
Equalizer-19/
├── index.html              # HTML-Entry-Point
├── package.json            # NPM-Konfiguration
├── package-lock.json       # Dependency Lock-File
├── vite.config.js          # Vite Build-Konfiguration
├── vitest.config.js        # Vitest (jsdom, src/**/__tests__/*.spec.js, Setup src/__tests__/setup.js)
├── tsconfig.json           # TypeScript (strict, allowJs) für vue-tsc
├── env.d.ts                # Typen für .vue-Imports
├── eslint.config.js        # ESLint Flat Config
│
├── src/                    # Quellcode
│   ├── main.js             # Vue App Entry Point (Router, Pinia)
│   ├── App.vue             # Root-Komponente: globale Nav, provide i18n/theme, <router-view>
│   │
│   ├── pages/              # Seiten des Routers
│   │   ├── LandingPage.vue            # Startseite aus components/landing/
│   │   ├── AppPage.vue                # Die eigentliche App (EQ, Kompressor, Player)
│   │   └── FaqPage.vue                # FAQ
│   │
│   ├── router/
│   │   └── index.js                   # Routen /, /app, /faq; SEO-Meta je Route
│   │
│   ├── assets/
│   │   └── style.css       # Globale Styles; importiert design-system/tokens.css
│   │
│   ├── design-system/      # Design-Tokens: tokens.css (Laufzeit), tokens.json, tokens.js, Tests, README
│   │
│   ├── components/         # Vue-Komponenten
│   │   ├── ui/                        # Design-System-Komponenten (UiButton, UiIconButton, UiSwitch, SliderField, UiSegmentedControl, UiPanel, UiDialog, UiToast), README
│   │   ├── landing/                   # Abschnitte der Landing-Page (LandingHero, LandingFacts, LandingSignalChain, LandingSteps, LandingDetails, LandingBlog, LandingCta), HeroNav, HeroEqualizer, landing.css
│   │   ├── equalizer/                 # Teile des Equalizers: EqPresetControls (Kopfzeile), EqPresetForm (Preset speichern), EqBands (19 Regler + Kurve)
│   │   ├── recorder/                  # Teile der Aufnahme: RecorderTime, RecorderSettings, RecorderButtons, CountdownOverlay, DownloadDialog
│   │   ├── __tests__/                 # Komponententests (Vitest), auch in ui/, landing/, equalizer/, recorder/
│   │   ├── RelatedTools.vue           # Links zu Konverter, Cutter, Normalisierer
│   │   ├── AppIcon.vue                # Inline-SVG-Icon nach Name (utils/icons.js)
│   │   ├── AudioMeter.vue             # Ein-/Ausgangspegel
│   │   ├── CompressorPresets.vue      # Kompressor-Preset-Dropdown (in DynamicsProcessor)
│   │   ├── DynamicsProcessor.vue      # Kompressor-UI mit Reglern
│   │   ├── Equalizer.vue              # 19-Band EQ: Container (Bänder, Presets, Engine-Store) für components/equalizer/
│   │   ├── HistoryControls.vue        # Undo/Redo-Buttons (History-Store)
│   │   ├── InputSource.vue            # Audio-Eingang wählen (Line-In, Mikrofon, PC-Ton)
│   │   ├── Notification.vue           # Toast-Host (Position, Dauer) für UiToast
│   │   ├── PlayerTransport.vue        # Wiedergabe-Buttons (in StickyPlayerBar)
│   │   ├── Playlist.vue               # Track-Playlist
│   │   ├── RecorderControls.vue       # Aufnahme & Download: Container (Recorder, Countdown) für components/recorder/
│   │   ├── StickyPlayerBar.vue        # Player-Leiste: Upload, Fortschritt, Layout
│   │   ├── VolumeControl.vue          # Lautstärke (in StickyPlayerBar)
│   │   └── Visualization.vue          # Spektrum-Analyzer
│   │
│   ├── data/
│   │   └── blogArticles.js            # Blog-Beiträge (kodinitools.com/blog) für die Landing-Page
│   │
│   ├── stores/             # Pinia-Stores (globaler Zustand, src/main.js: app.use(createPinia()))
│   │   ├── audioEngine.js             # Audio-Verarbeitungskette: Parameter reaktiv, AudioNodes shallowRef + markRaw
│   │   ├── playlist.js                # Playlist: Tracks, aktueller Index, Shuffle/Repeat, Navigation
│   │   ├── player.js                  # Wiedergabe (HTMLAudioElement), Position, Lautstärke; Listenänderungen mit Wiedergabe-Folgen
│   │   ├── history.js                 # Undo/Redo (useUndoRedo auf dem Engine-Store)
│   │   └── toast.js                   # Benachrichtigungen: notify(message, type)
│   │
│   ├── i18n/               # Übersetzungen: de.ts (Referenz, TranslationKey), en.ts (Record<TranslationKey, string>), index.ts (translations, LANGUAGES)
│   │
│   ├── composables/        # Vue Composition API Logik
│   │   ├── useCountdown.js            # Startverzögerung der Aufnahme (Countdown)
│   │   ├── useCustomPresets.js        # Eigene EQ-Presets (localStorage)
│   │   ├── useFileDrop.js             # Dateiauswahl & Drag & Drop (inkl. Ordner)
│   │   ├── useI18n.js                 # Internationalisierung (liest src/i18n/)
│   │   ├── useInputSource.js          # Audio-Eingang (getUserMedia/getDisplayMedia) in die Kette hängen
│   │   ├── useKeyboardShortcuts.js    # Tastaturkürzel
│   │   ├── useOutputRecorder.js       # Output-Stream-Recording (WebM/WAV)
│   │   ├── useTheme.js                # Dark/Light Mode
│   │   └── useUndoRedo.js             # Verlauf der Klangeinstellungen (vom History-Store genutzt)
│   │
│   ├── utils/              # Hilfsfunktionen & Konstanten
│   │   ├── audioBlob.js            # Blob-Prüfung für übergebene Dateien
│   │   ├── audioChain.js           # Routing der Verarbeitungskette (reine Funktionen)
│   │   ├── blogCards.js            # Blog-Karten: Datum/Sprache (reine Funktionen)
│   │   ├── eqCurve.js              # Frequenzgang-Kurve aus den Band-Gains (reine Funktionen)
│   │   ├── history.js              # Verlaufsmodell für Undo/Redo (max. 100 Schritte)
│   │   ├── icons.js                # Inline-SVG-Pfade für AppIcon
│   │   ├── playbackOrder.js        # Playlist-Navigation (reine Funktionen)
│   │   ├── presets.js              # EQ- und Kompressor-Presets
│   │   ├── processingState.js      # Snapshot/Anwenden der Klangeinstellungen
│   │   ├── seoMeta.js              # Title/Description/Canonical je Route und Sprache
│   │   ├── sharedFileRepository.js # Übergabe vom Audio-Konverter
│   │   ├── wavEncoder.js           # WAV-Export (16/24/32 Bit)
│   │   └── workletLoader.js        # AudioWorklet laden (mit Timeout/Fallback)
│   │
│   ├── worklets/
│   │   └── pcm-recorder.worklet.js # AudioWorklet für die WAV-Aufnahme
│   │
│   └── __tests__/          # Vitest-Setup (setup.js) und Test-Helfer (i18nStub.js)
│
├── tests/                  # Logik-Tests (Vitest, Node-Umgebung); Komponententests: src/**/__tests__ (jsdom)
├── .github/workflows/ci.yml # CI: Lint, Format, Typecheck, Tests, Build
│
├── node_modules/           # Dependencies
│
├── README.md               # Projekt-Dokumentation
├── CONTEXT.md              # Diese Datei: Architektur und Datenmodelle
├── INSTALLATION.md         # Installationsanleitung
├── DEPLOY.md               # Deployment auf kodinitools.com (Nav-Partial, Base-URL)
├── BLOG_TECHNICAL_DEEP_DIVE.md # Technischer Blogartikel (historischer Stand)
├── LICENSE                 # MIT-Lizenz
├── LIESMICH.txt            # Deutsche Kurzbeschreibung
├── START.bat / start.sh    # Startskripte Windows/Unix
└── deploy.sh               # Build und Upload
```

---

## Datenmodelle (In-Memory)

> **Hinweis**: Diese Anwendung verwendet KEINE persistente Datenbank. Alle Daten werden zur Laufzeit im Browser-Speicher gehalten (Vue Refs/Reactive Objects).

### Track-Modell (Playlist)

```javascript
// Definiert in: src/stores/playlist.js (createTrack)
{
  id: Number,           // Eindeutige ID (timestamp + index)
  name: String,         // Dateiname
  file: File,           // Original File-Objekt
  url: String,          // Blob-URL (URL.createObjectURL)
  size: Number,         // Dateigröße in Bytes
  type: String,         // MIME-Type (z.B. "audio/mp3")
  duration: Number      // Dauer in Sekunden (wird nachgeladen)
}
```

### EQ-Band-Modell

```javascript
// Definiert in: src/stores/audioEngine.js
// Frequenzen: EQ_BAND_FREQUENCIES in src/utils/presets.js
// 19 Bänder von 20 Hz bis 20 kHz (logarithmisch, ca. Halboktav-Abstand), alle 'peaking'
{
  frequency: Number,    // Frequenz in Hz
  gain: Number,         // Verstärkung in dB (-12 bis +12)
  q: Number             // Q-Faktor (Bandbreite), Standard: 2.5 (EQ_BAND_Q)
}

// Standard-Frequenzen:
[20, 30, 45, 63, 90, 135, 200, 300, 450, 630,
 900, 1350, 2000, 3000, 4500, 6300, 9000, 13500, 20000]
```

### Dynamics/Kompressor-Einstellungen

```javascript
// Definiert in: src/stores/audioEngine.js
{
  threshold: Number,    // Schwellenwert in dB (-100 bis 0, Standard: -30)
  knee: Number,         // Knee in dB (0 bis 40, Standard: 20)
  ratio: Number,        // Kompressionsverhältnis (1 bis 20, Standard: 4)
  attack: Number,       // Attack in Sekunden (0 bis 1, Standard: 0.003)
  release: Number       // Release in Sekunden (0 bis 1, Standard: 0.25)
}
```

### EQ-Presets

```javascript
// Definiert in: src/utils/presets.js
EQ_PRESETS = {
  'Flat': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  'Rock': [-2, 0, 2, 4, 3, 1, -1, 0, 1, 2, 3, 4, 3, 2, 1, 0, -1, -2, -3],
  'Pop': [1, 2, 3, 2, 1, 0, -1, 0, 1, 2, 2, 1, 0, -1, -2, -1, 0, 1, 2],
  'Jazz': [2, 1, 0, -1, 0, 1, 2, 1, 0, -1, -2, -1, 0, 1, 2, 3, 2, 1, 0],
  'Classical': [3, 2, 1, 0, -1, -2, 0, 1, 2, 1, 0, -1, 0, 1, 2, 3, 2, 1, -1],
  'Electronic': [4, 3, 2, 1, 0, -1, -2, 0, 2, 4, 3, 2, 1, 3, 4, 3, 2, 1, 0],
  'Bass Boost': [8, 6, 4, 2, 1, 0, -1, -2, -1, 0, 1, 0, -1, -2, -1, 0, 1, 2, 1],
  'V-Shape': [4, 3, 2, 1, 0, -1, -2, -3, -2, -1, 0, 1, 2, 3, 4, 3, 2, 1, 0]
}
```

### Kompressor-Presets

```javascript
// Definiert in: src/utils/presets.js
// Format: { th: threshold, kn: knee, ra: ratio, at: attack(ms), re: release(ms) }
COMP_PRESETS = {
  // Basic
  'Gentle': { th: -18, kn: 8, ra: 2, at: 10, re: 100 },
  'Medium': { th: -24, kn: 15, ra: 4, at: 5, re: 50 },
  'Heavy': { th: -30, kn: 20, ra: 8, at: 2, re: 25 },

  // Genre
  'Rock': { th: -22, kn: 10, ra: 5, at: 5, re: 60 },
  'Pop': { th: -20, kn: 12, ra: 3.5, at: 8, re: 80 },
  'Electro': { th: -28, kn: 6, ra: 6, at: 1, re: 30 },
  'Jazz': { th: -16, kn: 15, ra: 2, at: 15, re: 120 },
  'Hip-Hop': { th: -26, kn: 8, ra: 5, at: 10, re: 40 },
  'Classical': { th: -14, kn: 20, ra: 1.5, at: 20, re: 150 },

  // Instrument/Voice
  'Vocal': { th: -20, kn: 12, ra: 3, at: 8, re: 80 },
  'Drums': { th: -24, kn: 6, ra: 6, at: 2, re: 35 },
  'Bass': { th: -22, kn: 10, ra: 4, at: 12, re: 100 },
  'Podcast': { th: -18, kn: 14, ra: 3, at: 10, re: 90 },

  // Mastering
  'Master': { th: -16, kn: 10, ra: 2.5, at: 3, re: 40 },
  'Limiter': { th: -6, kn: 0, ra: 20, at: 0.5, re: 10 }
}
```

### Übersetzungen (i18n)

```typescript
// src/i18n/de.ts – deutsche Texte, Referenz für alle Schlüssel
const de = { nav_start_app: 'App starten', /* … rund 380 Schlüssel */ }
export type TranslationKey = keyof typeof de

// src/i18n/en.ts – fehlende oder überzählige Schlüssel sind ein Typfehler (npm run type-check)
const en: Record<TranslationKey, string> = { nav_start_app: 'Start App', /* … */ }

// src/i18n/index.ts
export const translations = { de, en } // Language = 'de' | 'en'
```

Neue Texte zuerst in `de.ts` eintragen, dann in `en.ts`. `src/i18n/__tests__/translations.spec.js` prüft
zusätzlich zur Laufzeit: gleiche Schlüssel, keine leeren Texte, gleiche Platzhalter (`{name}`, `{count}`).
Die Komponenten lesen weiterhin `t.value.key` (bzw. `t.key` im Template) über `inject('i18n')`.

---

## Audio-Verarbeitungskette

```
┌──────────────┐
│ Audio Source │ (Datei oder Audio-Eingang: Line-In, Mikrofon, PC-Ton)
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│                    19-Band EQ Filter                      │
│  (BiquadFilter: 19x peaking, 20 Hz – 20 kHz)             │
└──────────────────────────┬───────────────────────────────┘
                           │ (bypass möglich)
                           ▼
┌──────────────────────────────────────────────────────────┐
│               DynamicsCompressorNode                      │
│         (Threshold, Knee, Ratio, Attack, Release)        │
└──────────────────────────┬───────────────────────────────┘
                           │ (bypass möglich)
                           ▼
┌──────────────────────────────────────────────────────────┐
│                      GainNode                             │
│                   (Master Volume)                         │
└──────────────────────────┬───────────────────────────────┘
                           │
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
    ┌────────────┐  ┌────────────┐  ┌────────────┐
    │ Analyser   │  │ Destination│  │ Recorder   │
    │ (FFT)      │  │ (Speakers) │  │ (Optional) │
    └────────────┘  └────────────┘  └────────────┘
```

Die Kette ist für Playlist und Audio-Eingang identisch. Der Recorder greift hinter dem Master-Gain ab, also immer das bearbeitete Signal – auch Änderungen an EQ und Kompressor während einer laufenden Aufnahme. `src/utils/audioChain.js` baut die Kette bei jedem Routing-Wechsel (Bypass, Gerätewechsel, Playlist ↔ Eingang) komplett neu auf: Alle Knoten vor dem Master-Gain werden erst getrennt und dann in Reihenfolge verbunden, damit keine Kante einer früheren Verschaltung (z. B. EQ → Kompressor bei umgangenem Kompressor) eine zweite Signalkopie in Ausgang und Aufnahme mischt. Die Ausgänge des Master-Gain (Analyser, Monitor, Recorder) bleiben dabei unangetastet.

---

## Wichtige APIs

### Pinia-Stores

Globaler Zustand liegt in Pinia-Stores unter `src/stores/` (Setup-Stores; Refs sind am Store
ausgepackt, `storeToRefs` liefert sie bei Bedarf als Refs zurück):

```javascript
import { storeToRefs } from 'pinia'
import { useAudioEngineStore } from '@/stores/audioEngine' // eqBands, dynamics, eqBypass, updateEqBand(), …
import { usePlaylistStore } from '@/stores/playlist' // tracks, currentTrack, canPlayNext, reorderTracks(), toggleShuffle(), …
import { usePlayerStore } from '@/stores/player' // isPlaying, volume, play(), playTrack(), addFiles(), removeTrack(), …
import { useHistoryStore } from '@/stores/history' // canUndo, undoChange, undo(), redo()
import { useToastStore } from '@/stores/toast' // current, notify(message, type)

const audioEngine = useAudioEngineStore()
audioEngine.eqBypass // Boolean, kein .value
const { isPlaying, volume } = storeToRefs(usePlayerStore()) // Refs für Templates/Watcher
const { notify } = useToastStore()
notify(t.value.eq_reset_done, 'info')
```

Die AudioNodes im Engine-Store sind `shallowRef` und `markRaw`: Vue darf sie nie in Proxies
wickeln, weil `connect()`/`disconnect()` auf einem Proxy fehlschlägt. Tests erzeugen die Stores
mit `setActivePinia(createPinia())`.

i18n und Theme laufen bewusst über provide/inject aus `App.vue` (`useI18n` liest `src/i18n/`):

```javascript
provide('i18n', { t, currentLanguage, setLanguage })
provide('theme', { currentTheme, setTheme })
const { t } = inject('i18n')
```

### Undo/Redo

`useUndoRedo(audioEngine)` (als Store `src/stores/history.js`) beobachtet die Klangeinstellungen der Engine – EQ-Gains, EQ-Bypass, Kompressor-Parameter, Kompressor an/aus – und legt bei jeder Änderung einen Snapshot im Verlauf ab (`src/utils/history.js`, max. 100 Schritte). Die Engine bleibt Single Source of Truth: egal ob Slider, Preset, Reset oder Bypass-Button, alle synchronen Mutationen eines Ticks werden zu einem Schritt; aufeinanderfolgende Bewegungen desselben Sliders innerhalb von 1 s verschmelzen (`canMergeProcessingChanges`). `undo()`/`redo()` schreiben den Nachbar-Snapshot per `applyProcessingState` zurück; der Zustand entspricht danach dem Verlaufseintrag, sodass der Beobachter nichts aufzeichnet. Die Komponenten (`Equalizer.vue`, `DynamicsProcessor.vue`, `CompressorPresets.vue`) leiten ihre Anzeige aus der Engine ab und folgen damit auch externen Änderungen. Tastenkürzel: Strg/Cmd+Z, Strg/Cmd+Shift+Z, Strg+Y (`useKeyboardShortcuts.js`, ausgewertet über `e.key`, damit QWERTZ nicht vertauscht; in Textfeldern bleibt das native Undo). Wiedergabe-Einstellungen (Lautstärke, Position, Playlist) sind bewusst nicht Teil des Verlaufs.

### Browser-Kompatibilität

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

Benötigt Web Audio API und MediaRecorder API Support.

---

## NPM Scripts

```bash
npm run dev           # Startet Vite Dev-Server auf Port 3000
npm run build         # Production Build nach /dist
npm run preview       # Preview des Production Builds
npm run lint          # ESLint (.js, .ts, .vue)
npm run format        # Prettier schreibt
npm run format:check  # Prettier prüft (CI)
npm run type-check    # vue-tsc --noEmit
npm test              # Vitest: tests/ (Node) und src/**/__tests__ (jsdom)
npm run test:watch    # Vitest im Watch-Modus
```

## Tests

- **`tests/*.test.js`** (Vitest, Kopfzeile `// @vitest-environment node`): reine Logik und Composables ohne
  DOM, z. B. `audioChain`, `history`, `useOutputRecorder`; Assertions über `node:assert/strict`, Stubs über
  `vi.spyOn`/`vi.useFakeTimers`. Stores werden mit `setActivePinia(createPinia())` erzeugt.
- **`src/**/__tests__/*.spec.js`** (Vitest + @vue/test-utils, jsdom): Komponenten; i18n per
  `global: { provide: i18nStub() }` aus `src/__tests__/i18nStub.js`.
- **Regressionsschutz:** `src/design-system/__tests__/` prüft Tokens (CSS = JSON = JS) und dass Styles
  außerhalb des Design-Systems nur `var(--token)` ohne Fallback nutzen; neue Farb-Literale lassen den
  Test fehlschlagen (`FROZEN_LITERALS` darf nur schrumpfen). `src/i18n/__tests__/` prüft de/en-Schlüssel.
- CI (`.github/workflows/ci.yml`, Node 22) führt Lint, Format-Check, Type-Check, Tests und Build aus.

---

## Autor

**KodiniTools** - [kodinitools.com](https://kodinitools.com)

Lizenz: MIT
