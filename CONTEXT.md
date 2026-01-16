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
| **MediaRecorder API** | Audio-Aufnahme in WebM/WAV |

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
│   │   ├── AudioConverter.vue         # Audio-Konverter Promo
│   │   ├── CompressorPresets.vue      # Kompressor-Preset-Auswahl
│   │   ├── DynamicsProcessor.vue      # Kompressor-UI mit Reglern
│   │   ├── Equalizer.vue              # 19-Band EQ-Interface
│   │   ├── LanguageThemeSwitcher.vue  # Sprach-/Theme-Toggle
│   │   ├── Notification.vue           # Toast-Benachrichtigungen
│   │   ├── OutputRecordingControls.vue# Output-Recording-Steuerung
│   │   ├── PlayerControls.vue         # Playback-Steuerung
│   │   ├── Playlist.vue               # Track-Playlist
│   │   ├── ProFeatures.vue            # Pro-Feature-Toggles
│   │   ├── PromoSection.vue           # Header/Promo-Bereich
│   │   ├── RecordingControls.vue      # Mikrofon-Recording
│   │   └── Visualization.vue          # Spektrum-Analyzer
│   │
│   ├── composables/        # Vue Composition API Logik
│   │   ├── useAudioEngine.js          # Audio-Verarbeitungskette
│   │   ├── useAudioPlayer.js          # Playback-Steuerung
│   │   ├── useAudioPlayer_updated.js  # (Backup/Alternative)
│   │   ├── useI18n.js                 # Internationalisierung
│   │   ├── useOutputRecorder.js       # Output-Stream-Recording
│   │   ├── useRecorder.js             # Mikrofon-Recording
│   │   └── useTheme.js                # Dark/Light Mode
│   │
│   └── utils/              # Hilfsfunktionen & Konstanten
│       ├── presets.js      # EQ- und Kompressor-Presets
│       └── translations.js # DE/EN Übersetzungen
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
// 19 Bänder von 20Hz bis 1250Hz (erweitert in der UI bis 16.7kHz)
{
  frequency: Number,    // Frequenz in Hz
  gain: Number,         // Verstärkung in dB (-12 bis +12)
  q: Number             // Q-Faktor (Bandbreite), Standard: 1.0
}

// Standard-Frequenzen:
[20, 25, 31.5, 40, 50, 63, 80, 100, 125, 160,
 200, 250, 315, 400, 500, 630, 800, 1000, 1250]
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
│ Audio Source │ (File oder Mikrofon)
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│                    19-Band EQ Filter                      │
│  (BiquadFilter: lowshelf → 17x peaking → highshelf)      │
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
provide('notify', notifyFunction)

// In Komponenten (inject)
const { t } = inject('i18n')
const audioEngine = inject('audioEngine')
```

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
