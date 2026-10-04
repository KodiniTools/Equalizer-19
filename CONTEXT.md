# CONTEXT.md - Equalizer 19 Vue Edition

## Projektübersicht

**Equalizer 19** ist eine professionelle Browser-basierte Audio-Equalizer-Anwendung mit 19-Band parametrischem EQ, Dynamics-Processor und Echtzeit-Visualisierung. Die Anwendung läuft komplett clientseitig ohne Backend.

---

## Tech-Stack

### Frontend Framework
| Technologie | Version | Zweck |
|-------------|---------|-------|
| **Vue 3** | ^3.4.0 | UI-Framework mit Composition API |
| **Vite** | ^5.0.0 | Build-Tool und Dev-Server |
| **@vitejs/plugin-vue** | ^5.0.0 | Vue-Integration für Vite |

### Audio Processing
| Technologie | Zweck |
|-------------|-------|
| **Web Audio API** | Echtzeit-Audio-Processing (BiquadFilter, DynamicsCompressor, AnalyserNode) |
| **MediaRecorder API** | Audio-Aufnahme in WebM (Opus) |
| **AudioWorklet** | Verlustfreie WAV-Aufnahme: PCM-Mitschnitt hinter dem Master-Gain (`src/worklets/pcm-recorder.worklet.js`), Encoder in `src/utils/wavEncoder.js` (16/24 Bit PCM, 32 Bit Float). Lädt das Worklet-Modul nicht innerhalb von 2 s, nutzt die Aufnahme den ScriptProcessor-Fallback (`src/utils/workletLoader.js`) |

### Styling & Icons
| Technologie | Version | Zweck |
|-------------|---------|-------|
| **CSS Variables** | - | Theme-System (Dark/Light Mode) |
| **Font Awesome** | 6.5.1 | Icon-Library (CDN) |

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
│
├── src/                    # Quellcode
│   ├── main.js             # Vue App Entry Point
│   ├── App.vue             # Root-Komponente
│   │
│   ├── assets/
│   │   └── style.css       # Globale Styles (~20KB)
│   │
│   ├── components/         # Vue-Komponenten
│   │   ├── RelatedTools.vue           # Links zu Konverter, Cutter, Normalisierer
│   │   ├── AudioMeter.vue             # Ein-/Ausgangspegel
│   │   ├── BasePanel.vue              # Karten-Rahmen der Sidebars (Kopfzeile, Aktionen, Footer)
│   │   ├── CompressorPresets.vue      # Kompressor-Preset-Dropdown (in DynamicsProcessor)
│   │   ├── DownloadDialog.vue         # Dateiname/Speicherort für Aufnahmen
│   │   ├── DynamicsProcessor.vue      # Kompressor-UI mit Reglern
│   │   ├── Equalizer.vue              # 19-Band EQ-Interface
│   │   ├── HeroNav.vue                # Lokale Navigation der Landing-Page (sticky unter der globalen Nav)
│   │   ├── Notification.vue           # Toast-Benachrichtigungen
│   │   ├── PlayerTransport.vue        # Wiedergabe-Buttons (in StickyPlayerBar)
│   │   ├── Playlist.vue               # Track-Playlist
│   │   ├── RecorderControls.vue       # Aufnahme & Download (in StickyPlayerBar)
│   │   ├── StickyPlayerBar.vue        # Player-Leiste: Upload, Fortschritt, Layout
│   │   ├── VolumeControl.vue          # Lautstärke (in StickyPlayerBar)
│   │   └── Visualization.vue          # Spektrum-Analyzer
│   │
│   ├── data/
│   │   └── blogArticles.js            # Blog-Beiträge (kodinitools.com/blog) für die Landing-Page
│   │
│   ├── composables/        # Vue Composition API Logik
│   │   ├── useAudioEngine.js          # Audio-Verarbeitungskette
│   │   ├── useAudioPlayer.js          # Playback-Steuerung
│   │   ├── useCustomPresets.js        # Eigene EQ-Presets (localStorage)
│   │   ├── useFileDrop.js             # Dateiauswahl & Drag & Drop (inkl. Ordner)
│   │   ├── useI18n.js                 # Internationalisierung
│   │   ├── useKeyboardShortcuts.js    # Tastaturkürzel
│   │   ├── useOutputRecorder.js       # Output-Stream-Recording
│   │   └── useTheme.js                # Dark/Light Mode
│   │
│   └── utils/              # Hilfsfunktionen & Konstanten
│       ├── audioBlob.js            # Blob-Prüfung für übergebene Dateien
│       ├── audioChain.js           # Routing der Verarbeitungskette (reine Funktionen)
│       ├── blogCards.js            # Blog-Karten: Datum/Sprache (reine Funktionen)
│       ├── playbackOrder.js        # Playlist-Navigation (reine Funktionen)
│       ├── presets.js              # EQ- und Kompressor-Presets
│       ├── sharedFileRepository.js # Übergabe vom Audio-Konverter
│       ├── translations.js         # DE/EN Übersetzungen
│       ├── wavEncoder.js           # WAV-Export (16/24/32 Bit)
│       └── workletLoader.js        # AudioWorklet laden (mit Timeout/Fallback)
│
├── tests/                  # Unit-Tests (npm test, node:test)
│
├── node_modules/           # Dependencies
│
├── README.md               # Projekt-Dokumentation
├── INSTALLATION.md         # Installationsanleitung
├── LICENSE                 # MIT-Lizenz
├── LIESMICH.txt            # Deutsche Beschreibung
├── PROJEKTSTRUKTUR.txt     # Strukturübersicht
├── START.bat               # Windows-Startskript
└── start.sh                # Unix-Startskript
```

---

## Datenmodelle (In-Memory)

> **Hinweis**: Diese Anwendung verwendet KEINE persistente Datenbank. Alle Daten werden zur Laufzeit im Browser-Speicher gehalten (Vue Refs/Reactive Objects).

### Track-Modell (Playlist)

```javascript
// Definiert in: src/composables/useAudioPlayer.js
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
// Definiert in: src/composables/useAudioEngine.js
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
// Definiert in: src/composables/useAudioEngine.js
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

```javascript
// Definiert in: src/utils/translations.js
// Unterstützte Sprachen: 'de' (Deutsch), 'en' (English)
translations = {
  de: { /* 63 Übersetzungsschlüssel */ },
  en: { /* 63 Übersetzungsschlüssel */ }
}
```

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

### Provide/Inject Pattern

Die App verwendet Vue's Dependency Injection für globalen State:

```javascript
// In App.vue (provide)
provide('i18n', { t, currentLanguage, setLanguage })
provide('theme', { currentTheme, setTheme })
provide('audioEngine', audioEngine)
provide('audioPlayer', audioPlayer)
provide('history', history) // useUndoRedo(audioEngine)
provide('notify', notifyFunction) // AppPage.vue ersetzt den Stub durch echte Toasts

// In Komponenten (inject)
const { t } = inject('i18n')
const audioEngine = inject('audioEngine')
```

### Undo/Redo

`useUndoRedo(audioEngine)` (in `App.vue`) beobachtet die Klangeinstellungen der Engine – EQ-Gains, EQ-Bypass, Kompressor-Parameter, Kompressor an/aus – und legt bei jeder Änderung einen Snapshot im Verlauf ab (`src/utils/history.js`, max. 100 Schritte). Die Engine bleibt Single Source of Truth: egal ob Slider, Preset, Reset oder Bypass-Button, alle synchronen Mutationen eines Ticks werden zu einem Schritt; aufeinanderfolgende Bewegungen desselben Sliders innerhalb von 1 s verschmelzen (`canMergeProcessingChanges`). `undo()`/`redo()` schreiben den Nachbar-Snapshot per `applyProcessingState` zurück; der Zustand entspricht danach dem Verlaufseintrag, sodass der Beobachter nichts aufzeichnet. Die Komponenten (`Equalizer.vue`, `DynamicsProcessor.vue`, `CompressorPresets.vue`) leiten ihre Anzeige aus der Engine ab und folgen damit auch externen Änderungen. Tastenkürzel: Strg/Cmd+Z, Strg/Cmd+Shift+Z, Strg+Y (`useKeyboardShortcuts.js`, ausgewertet über `e.key`, damit QWERTZ nicht vertauscht; in Textfeldern bleibt das native Undo). Wiedergabe-Einstellungen (Lautstärke, Position, Playlist) sind bewusst nicht Teil des Verlaufs.

### Browser-Kompatibilität

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

Benötigt Web Audio API und MediaRecorder API Support.

---

## NPM Scripts

```bash
npm run dev      # Startet Vite Dev-Server auf Port 3000
npm run build    # Production Build nach /dist
npm run preview  # Preview des Production Builds
```

---

## Autor

**KodiniTools** - [kodinitools.com](https://kodinitools.com)

Lizenz: MIT
