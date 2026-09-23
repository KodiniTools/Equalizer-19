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
│   │   ├── AudioConverter.vue  # Audio-Konverter Promo
│   │   ├── AudioMeter.vue      # Ein-/Ausgangspegel
│   │   ├── CompressorPresets.vue # Kompressor-Presets
│   │   ├── DownloadDialog.vue  # Dateiname/Speicherort für Aufnahmen
│   │   ├── DynamicsProcessor.vue # Kompressor-UI
│   │   ├── Equalizer.vue       # Equalizer-UI
│   │   ├── Notification.vue    # Toast-Notifications
│   │   ├── PlayerTransport.vue # Wiedergabe-Buttons (Teil der Player-Leiste)
│   │   ├── Playlist.vue        # Playlist-Verwaltung
│   │   ├── RecorderControls.vue # Aufnahme & Download (Teil der Player-Leiste)
│   │   ├── StickyPlayerBar.vue # Player-Leiste: Upload, Fortschritt, Layout
│   │   ├── VolumeControl.vue   # Lautstärke (Teil der Player-Leiste)
│   │   └── Visualization.vue   # Spektrum-Analyzer
│   ├── composables/
│   │   ├── useAudioEngine.js   # Audio-Engine-Management
│   │   ├── useAudioPlayer.js   # Player-Logik
│   │   ├── useCustomPresets.js # Eigene EQ-Presets (localStorage)
│   │   ├── useFileDrop.js      # Dateiauswahl & Drag & Drop (inkl. Ordner)
│   │   ├── useI18n.js          # Internationalisierung
│   │   ├── useKeyboardShortcuts.js # Tastaturkürzel
│   │   ├── useOutputRecorder.js # Aufnahme des bearbeiteten Signals
│   │   └── useTheme.js         # Theme-Management
│   ├── pages/                  # Landing, App, FAQ
│   ├── router/                 # Vue Router
│   ├── worklets/               # AudioWorklet (PCM-Aufnahme)
│   └── utils/
│       ├── audioBlob.js        # Blob-Prüfung für übergebene Dateien
│       ├── playbackOrder.js    # Playlist-Navigation (reine Funktionen)
│       ├── presets.js          # EQ/Comp Presets
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
- **←/→**: ±10 Sekunden springen
- **M**: Mute/Unmute
- **Strg+L**: Sprache wechseln
- **Strg+D**: Theme wechseln

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
