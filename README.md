# EQUALIZER 19 - Vue 3 Edition

Eine moderne, professionelle 19-Band-Audio-Equalizer-Anwendung, die mit Vue 3 und der Composition API erstellt wurde.

## Features

- **19-Band Parametrischer Equalizer** mit professionellen Filtern
- **Dynamics Processor** mit Echtzeit-Kompression
- **Audio-Recording** in WebM (Opus) und verlustfreiem WAV (16 / 24 Bit PCM oder 32 Bit Float, per AudioWorklet direkt als PCM mitgeschnitten)
- **Echtzeit-Visualisierung** mit Spektrum-Analyzer
- **LUFS Loudness-Normalisierung**
- **Sättigungseffekte** mit Oversampling
- **Linear-Phase-Processing**
- **Preset-Management** für EQ und Kompressor
- **Undo/Redo** für alle Klangeinstellungen (EQ-Bänder, Bypass, Kompressor) – per Buttons oder Strg+Z / Strg+Y
- **Internationalisierung** (Deutsch/Englisch)
- **Theme-Switching** (Dark/Light)
- **Playlist-Management**

## Technologie-Stack

- **Vue 3** mit Composition API
- **Vite** als Build-Tool
- **Web Audio API** für Audio-Processing
- **CSS Variables** für Theming
- **Font Awesome** für Icons

## Installation

```bash
# Dependencies installieren
npm install

# Entwicklungsserver starten
npm run dev

# Production Build erstellen
npm run build

# Unit-Tests (Node-Testrunner, keine Zusatzpakete)
npm test

# Preview des Production Builds
npm run preview
```

## Projektstruktur

```
equalizer19-vue/
├── index.html
├── package.json
├── vite.config.js
├── src/
│   ├── main.js                 # Entry Point
│   ├── App.vue                 # Haupt-Komponente
│   ├── assets/
│   │   └── style.css           # Globale Styles
│   ├── components/
│   │   ├── RelatedTools.vue    # Links zu Konverter, Cutter, Normalisierer
│   │   ├── AudioMeter.vue      # Ein-/Ausgangspegel
│   │   ├── BasePanel.vue       # Karten-Rahmen der Sidebars (Kopfzeile, Aktionen, Footer)
│   │   ├── CompressorPresets.vue # Kompressor-Preset-Dropdown (in DynamicsProcessor)
│   │   ├── DownloadDialog.vue  # Dateiname/Speicherort für Aufnahmen
│   │   ├── DynamicsProcessor.vue # Kompressor-UI
│   │   ├── Equalizer.vue       # Equalizer-UI
│   │   ├── HeroNav.vue         # Lokale Navigation der Landing-Page (Start, Funktionen, Blog, FAQ)
│   │   ├── HistoryControls.vue # Undo/Redo-Buttons (Kopfzeile der App)
│   │   ├── InputSource.vue     # Eingangsquelle: Playlist oder Audio-Eingang
│   │   ├── Notification.vue    # Toast-Notifications
│   │   ├── PlayerTransport.vue # Wiedergabe-Buttons (Teil der Player-Leiste)
│   │   ├── Playlist.vue        # Playlist-Verwaltung
│   │   ├── RecorderControls.vue # Aufnahme & Download (Teil der Player-Leiste)
│   │   ├── StickyPlayerBar.vue # Player-Leiste: Upload, Fortschritt, Layout
│   │   ├── VolumeControl.vue   # Lautstärke (Teil der Player-Leiste)
│   │   └── Visualization.vue   # Spektrum-Analyzer
│   ├── data/
│   │   └── blogArticles.js     # Blog-Beiträge (kodinitools.com/blog) für die Landing-Page
│   ├── composables/
│   │   ├── useAudioEngine.js   # Audio-Engine-Management
│   │   ├── useAudioPlayer.js   # Player-Logik
│   │   ├── useCustomPresets.js # Eigene EQ-Presets (localStorage)
│   │   ├── useFileDrop.js      # Dateiauswahl & Drag & Drop (inkl. Ordner)
│   │   ├── useInputSource.js   # Live-Eingang (Line-In, Stereomix, virtuelles Kabel)
│   │   ├── useI18n.js          # Internationalisierung
│   │   ├── useKeyboardShortcuts.js # Tastaturkürzel
│   │   ├── useOutputRecorder.js # Aufnahme des bearbeiteten Signals
│   │   ├── useTheme.js         # Theme-Management
│   │   └── useUndoRedo.js      # Undo/Redo der Klangeinstellungen (beobachtet die Engine)
│   ├── pages/                  # Landing (ohne Icon-Font, Kennzahlen aus presets.js), App, FAQ
│   ├── router/                 # Vue Router
│   ├── worklets/               # AudioWorklet (PCM-Aufnahme)
│   └── utils/
│       ├── audioBlob.js        # Blob-Prüfung für übergebene Dateien
│       ├── audioChain.js       # Routing der Verarbeitungskette (reine Funktionen)
│       ├── blogCards.js        # Blog-Karten: Datum/Sprache (reine Funktionen)
│       ├── history.js          # Generischer Undo/Redo-Stack (reine Funktionen)
│       ├── playbackOrder.js    # Playlist-Navigation (reine Funktionen)
│       ├── presets.js          # EQ/Comp Presets
│       ├── processingState.js  # Snapshot/Diff der Klangeinstellungen für Undo/Redo
│       ├── sharedFileRepository.js # Übergabe vom Audio-Konverter
│       ├── translations.js     # Übersetzungen
│       ├── wavEncoder.js       # WAV-Export (16/24/32 Bit)
│       └── workletLoader.js    # AudioWorklet laden (mit Timeout/Fallback)
└── tests/                      # Unit-Tests (npm test)
```

## Verwendung

1. **Audio-Dateien laden**: Klicken Sie auf "Audio-Dateien wählen" und wählen Sie Ihre Audiodateien
2. **Equalizer anpassen**: Verwenden Sie die 19 Frequenzbänder oder wählen Sie ein Preset
3. **Kompressor einstellen**: Passen Sie Threshold, Ratio, Attack und Release an
4. **Pro-Features aktivieren**: Aktivieren Sie Saturation, Linear-Phase oder LUFS-Normalisierung
5. **Visualisierung**: Sehen Sie die Echtzeit-Frequenzanalyse
6. **Playlist verwalten**: Navigieren Sie durch Ihre Tracks

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

Benötigt einen modernen Browser mit Web Audio API-Unterstützung.

## Lizenz

MIT License - Erstellt von KodiniTools

## Credits

- Original JavaScript-Version: EQUALIZER 19
- Vue 3 Migration: 2025
- Icons: Font Awesome

  Author: Dinko Ramić - Kodini Tools - kodinitools.com
