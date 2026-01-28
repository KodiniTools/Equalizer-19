# Equalizer 19: Ein technischer Deep Dive

> Eine umfassende Entwickler-Dokumentation zur Web Audio API, Vue.js 3 Composition API und modernen Browser-Audio-Technologien

---

## Inhaltsverzeichnis

1. [Einführung](#einführung)
2. [Architekturübersicht](#architekturübersicht)
3. [Web Audio API Grundlagen](#web-audio-api-grundlagen)
4. [Die Audio-Verarbeitungskette](#die-audio-verarbeitungskette)
5. [Vue.js 3 Composition API Patterns](#vuejs-3-composition-api-patterns)
6. [State Management ohne Vuex](#state-management-ohne-vuex)
7. [DSP-Konzepte: Equalizer & Kompressor](#dsp-konzepte-equalizer--kompressor)
8. [Echtzeit-Visualisierung mit Canvas](#echtzeit-visualisierung-mit-canvas)
9. [Recording & Export](#recording--export)
10. [Performance-Optimierungen](#performance-optimierungen)
11. [Komponentenarchitektur](#komponentenarchitektur)
12. [Preset-System](#preset-system)
13. [Internationalisierung & Theming](#internationalisierung--theming)
14. [Browser-Kompatibilität](#browser-kompatibilität)
15. [Best Practices & Lessons Learned](#best-practices--lessons-learned)

---

## Einführung

Equalizer 19 ist eine professionelle Audio-Processing-Anwendung, die vollständig im Browser läuft. Sie demonstriert die Mächtigkeit moderner Web-APIs für Echtzeit-Audioverarbeitung ohne Server-Backend oder native Plugins.

### Was Sie in diesem Deep Dive lernen

- **Web Audio API**: AudioContext, Nodes, Filter und deren Verkettung
- **Vue.js 3**: Composition API, Reactive State, Provide/Inject Pattern
- **DSP-Grundlagen**: Wie parametrische Equalizer und Kompressoren funktionieren
- **Performance**: Optimierungen für 60 FPS Visualisierung bei minimaler Latenz
- **Recording**: MediaRecorder API für Audio-Capture und Export

### Technologie-Stack

| Technologie | Version | Verwendungszweck |
|-------------|---------|------------------|
| Vue.js | 3.4+ | UI-Framework mit Composition API |
| Vite | 5.0+ | Build-Tool und Dev-Server |
| Web Audio API | Level 1 | Audio-Verarbeitung |
| MediaRecorder API | - | Audio-Aufnahme |
| Canvas API | 2D | FFT-Visualisierung |

---

## Architekturübersicht

### Projektstruktur

```
Equalizer-19/
├── src/
│   ├── main.js                    # App-Initialisierung
│   ├── App.vue                    # Root-Komponente mit DI-Setup
│   │
│   ├── components/                # 14 Vue Single-File-Components
│   │   ├── Equalizer.vue          # 19-Band EQ-Interface
│   │   ├── DynamicsProcessor.vue  # Kompressor-Steuerung
│   │   ├── Visualization.vue      # FFT-Spektrum-Analyzer
│   │   ├── PlayerControls.vue     # Playback-Steuerung
│   │   ├── OutputRecordingControls.vue
│   │   ├── CompressorPresets.vue
│   │   ├── Playlist.vue
│   │   └── ...
│   │
│   ├── composables/               # Wiederverwendbare Logik
│   │   ├── useAudioEngine.js      # Kern: Audio-Verarbeitung
│   │   ├── useAudioPlayer.js      # Playback & Playlist
│   │   ├── useOutputRecorder.js   # Output-Recording
│   │   ├── useRecorder.js         # Mikrofon-Recording
│   │   ├── useI18n.js             # Übersetzungen
│   │   └── useTheme.js            # Dark/Light Theme
│   │
│   ├── utils/
│   │   ├── presets.js             # EQ- & Kompressor-Presets
│   │   └── translations.js        # DE/EN Übersetzungen
│   │
│   └── assets/
│       └── style.css              # CSS-Variablen & Themes
│
├── index.html
├── vite.config.js
└── package.json
```

### Schichtenarchitektur

```
┌─────────────────────────────────────────────────────────────┐
│                    Präsentationsschicht                      │
│         Vue-Komponenten (Equalizer, Visualization, ...)     │
└─────────────────────────────┬───────────────────────────────┘
                              │ inject / emit
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Logikschicht (Composables)               │
│   useAudioEngine │ useAudioPlayer │ useTheme │ useI18n     │
└─────────────────────────────┬───────────────────────────────┘
                              │ API-Aufrufe
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Browser-API-Schicht                       │
│     Web Audio API │ MediaRecorder │ Canvas │ LocalStorage  │
└─────────────────────────────────────────────────────────────┘
```

---

## Web Audio API Grundlagen

### Was ist die Web Audio API?

Die Web Audio API ist eine hochperformante JavaScript-API für Audio-Processing und -Synthese im Browser. Sie basiert auf einem **modularen Routing-System**, bei dem Audio-Nodes miteinander verbunden werden.

### AudioContext: Das Herzstück

Der `AudioContext` ist der zentrale Hub für alle Audio-Operationen:

```javascript
// Lazy Initialization (erst bei User-Interaktion)
const audioContext = new (window.AudioContext || window.webkitAudioContext)()

// Wichtige Eigenschaften:
audioContext.sampleRate     // z.B. 44100 Hz oder 48000 Hz
audioContext.currentTime    // Hochpräziser Zeitstempel in Sekunden
audioContext.state          // "suspended" | "running" | "closed"
audioContext.destination    // Der finale Output (Lautsprecher)
```

**Wichtig**: Browser blockieren AudioContext bis zur ersten User-Interaktion (Autoplay-Policy):

```javascript
// In useAudioEngine.js
document.addEventListener('click', () => {
  if (audioContext.state === 'suspended') {
    audioContext.resume()
  }
}, { once: true })
```

### Audio Node Graph

Die Web Audio API arbeitet mit einem **gerichteten azyklischen Graphen (DAG)**. Jeder Node hat:

- **Inputs**: Eingehende Audio-Signale
- **Outputs**: Ausgehende Audio-Signale
- **Parameters**: Steuerbare Eigenschaften (Gain, Frequenz, etc.)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Source    │────▶│  Processor  │────▶│ Destination │
│   Node      │     │   Node      │     │   Node      │
└─────────────┘     └─────────────┘     └─────────────┘

Beispiele:
- Source: MediaElementSource, OscillatorNode, AudioBufferSource
- Processor: GainNode, BiquadFilterNode, DynamicsCompressorNode
- Destination: AudioContext.destination (Lautsprecher)
```

### Node-Typen in Equalizer 19

| Node-Typ | Zweck | Instanzen |
|----------|-------|-----------|
| `MediaElementSourceNode` | HTML5 `<audio>` einbinden | 1 |
| `BiquadFilterNode` | Parametrischer EQ | 19 |
| `DynamicsCompressorNode` | Dynamik-Kompression | 1 |
| `GainNode` | Master-Lautstärke | 1 |
| `AnalyserNode` | FFT-Daten für Visualisierung | 1 |
| `MediaStreamDestinationNode` | Recording-Output | 1 |

---

## Die Audio-Verarbeitungskette

### Signalfluss-Diagramm

```
                        ┌─────────────────────────────────────┐
                        │         Audio-Quelle                │
                        │  (Datei oder Mikrofon)              │
                        └───────────────┬─────────────────────┘
                                        │
                                        ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                         EQ-FILTER-KETTE (19 Bänder)                       │
│                                                                           │
│  ┌─────────┐   ┌─────────┐   ┌─────────┐         ┌─────────┐   ┌─────────┐│
│  │ 20 Hz   │──▶│ 25 Hz   │──▶│ 31.5 Hz │──▶ ... ▶│ 1000 Hz │──▶│ 1250 Hz ││
│  │lowshelf │   │ peaking │   │ peaking │         │ peaking │   │highshelf││
│  └─────────┘   └─────────┘   └─────────┘         └─────────┘   └─────────┘│
│                                                                           │
│  Jeder Filter: frequency, gain (-12 bis +12 dB), Q (Bandbreite)          │
└───────────────────────────────────────┬───────────────────────────────────┘
                                        │
                                        ▼
                        ┌─────────────────────────────────────┐
                        │      DynamicsCompressorNode         │
                        │                                     │
                        │  threshold: -30 dB                  │
                        │  ratio: 4:1                         │
                        │  knee: 20 dB                        │
                        │  attack: 3 ms                       │
                        │  release: 250 ms                    │
                        └───────────────┬─────────────────────┘
                                        │
                                        ▼
                        ┌─────────────────────────────────────┐
                        │           GainNode                  │
                        │      (Master Volume: 0.7)           │
                        └───────────────┬─────────────────────┘
                                        │
                        ┌───────────────┴───────────────┐
                        │                               │
                        ▼                               ▼
          ┌─────────────────────────┐   ┌─────────────────────────┐
          │      AnalyserNode       │   │   MediaStreamDest.      │
          │   (FFT-Visualisierung)  │   │   (für Recording)       │
          └───────────┬─────────────┘   └─────────────────────────┘
                      │
                      ▼
          ┌─────────────────────────┐
          │  AudioContext.dest.     │
          │    (Lautsprecher)       │
          └─────────────────────────┘
```

### Implementierung der Verkettung

```javascript
// Aus useAudioEngine.js - Vereinfachte Version

function connectAudioSource(source) {
  let currentNode = source

  // 1. EQ-Filter-Kette (wenn nicht bypassed)
  if (!eqBypass.value && eqFilters.value.length > 0) {
    eqFilters.value.forEach(filter => {
      currentNode.connect(filter)
      currentNode = filter
    })
  }

  // 2. Dynamics Processor (wenn aktiviert)
  if (dynamicsEnabled.value && dynamicsNode.value) {
    currentNode.connect(dynamicsNode.value)
    currentNode = dynamicsNode.value
  }

  // 3. Master Gain
  if (gainNode.value) {
    currentNode.connect(gainNode.value)
    currentNode = gainNode.value
  }

  // 4. Analyser für Visualisierung
  currentNode.connect(analyserNode.value)

  // 5. Finale Destination (Lautsprecher)
  analyserNode.value.connect(audioContext.value.destination)
}
```

### BiquadFilter konfigurieren

```javascript
function createEqFilters() {
  // ISO 1/3-Oktav Frequenzen
  const frequencies = [
    20, 25, 31.5, 40, 50, 63, 80, 100, 125, 160,
    200, 250, 315, 400, 500, 630, 800, 1000, 1250
  ]

  eqFilters.value = frequencies.map((freq, index) => {
    const filter = audioContext.value.createBiquadFilter()

    // Filter-Typ basierend auf Position
    if (index === 0) {
      filter.type = 'lowshelf'     // Tiefbässe
    } else if (index === frequencies.length - 1) {
      filter.type = 'highshelf'    // Höhen
    } else {
      filter.type = 'peaking'      // Mitten (Bell-Kurve)
    }

    filter.frequency.value = freq
    filter.gain.value = 0          // Initial: keine Änderung
    filter.Q.value = 1.0           // Moderate Bandbreite

    return filter
  })
}
```

### MediaElementSource: HTML5 Audio einbinden

```javascript
// Nur EINMAL pro Audio-Element erstellen!
let mediaElementSource = null
let isSourceConnected = false

function connectToAudioEngine() {
  if (!mediaElementSource && audioEngineRef.audioContext.value) {
    // Erstellen (einmalig)
    mediaElementSource = audioEngineRef.audioContext.value
      .createMediaElementSource(audioElement.value)
  }

  if (mediaElementSource && !isSourceConnected) {
    // Verbinden mit Audio-Kette
    audioEngineRef.connectAudioSource(mediaElementSource)
    isSourceConnected = true
  }
}
```

**Wichtig**: `createMediaElementSource()` kann nur **einmal** pro `<audio>`-Element aufgerufen werden. Ein zweiter Aufruf wirft einen Fehler!

---

## Vue.js 3 Composition API Patterns

### Warum Composition API?

Die Composition API bietet gegenüber der Options API:

1. **Bessere Code-Organisation**: Zusammengehörige Logik in einem Block
2. **Wiederverwendbarkeit**: Composables statt Mixins
3. **TypeScript-Support**: Bessere Type-Inference
4. **Testbarkeit**: Logik außerhalb von Komponenten testbar

### Composable-Struktur

Ein Composable ist eine Funktion, die Vue's Reactivity-System nutzt:

```javascript
// src/composables/useAudioEngine.js

import { ref, reactive, computed, watch, onUnmounted } from 'vue'

export function useAudioEngine() {
  // ═══════════════════════════════════════════════════════════
  // REAKTIVER STATE
  // ═══════════════════════════════════════════════════════════

  // ref() für primitive Werte und Arrays
  const audioContext = ref(null)
  const isInitialized = ref(false)
  const masterGain = ref(0.7)
  const eqBypass = ref(false)
  const dynamicsEnabled = ref(true)

  // reactive() für Objekte mit mehreren Properties
  const dynamics = reactive({
    threshold: -30,
    knee: 20,
    ratio: 4,
    attack: 0.003,
    release: 0.25
  })

  // reactive() für Arrays von Objekten
  const eqBands = reactive(
    EQ_FREQUENCIES.map(freq => ({
      frequency: freq,
      gain: 0,
      q: 1.0
    }))
  )

  // ═══════════════════════════════════════════════════════════
  // COMPUTED PROPERTIES
  // ═══════════════════════════════════════════════════════════

  const isReady = computed(() =>
    isInitialized.value && audioContext.value !== null
  )

  // ═══════════════════════════════════════════════════════════
  // WATCHERS FÜR SIDE-EFFECTS
  // ═══════════════════════════════════════════════════════════

  // Automatische Synchronisation mit Web Audio API
  watch(masterGain, (newValue) => {
    if (gainNode.value) {
      gainNode.value.gain.value = newValue
    }
  })

  watch(
    () => dynamics.threshold,
    (newValue) => {
      if (dynamicsNode.value) {
        dynamicsNode.value.threshold.value = newValue
      }
    }
  )

  // ═══════════════════════════════════════════════════════════
  // METHODEN
  // ═══════════════════════════════════════════════════════════

  function initAudioContext() {
    if (audioContext.value) return

    audioContext.value = new (window.AudioContext || window.webkitAudioContext)()
    createEqFilters()
    createDynamicsNode()
    createGainNode()
    createAnalyserNode()

    isInitialized.value = true
  }

  function updateEqBand(index, gain) {
    // State aktualisieren
    eqBands[index].gain = gain

    // Web Audio API aktualisieren
    if (eqFilters.value[index]) {
      eqFilters.value[index].gain.value = gain
    }
  }

  function updateDynamics(settings) {
    Object.assign(dynamics, settings)

    if (dynamicsNode.value) {
      if (settings.threshold !== undefined) {
        dynamicsNode.value.threshold.value = settings.threshold
      }
      if (settings.ratio !== undefined) {
        dynamicsNode.value.ratio.value = settings.ratio
      }
      // ... weitere Parameter
    }
  }

  // ═══════════════════════════════════════════════════════════
  // CLEANUP
  // ═══════════════════════════════════════════════════════════

  function cleanup() {
    if (audioContext.value) {
      audioContext.value.close()
      audioContext.value = null
    }
    isInitialized.value = false
  }

  // ═══════════════════════════════════════════════════════════
  // PUBLIC API
  // ═══════════════════════════════════════════════════════════

  return {
    // State (readonly nach außen empfohlen)
    audioContext,
    isInitialized,
    isReady,
    eqBands,
    dynamics,
    masterGain,
    eqBypass,
    dynamicsEnabled,

    // Methoden
    initAudioContext,
    updateEqBand,
    updateDynamics,
    cleanup,
    // ... weitere Methoden
  }
}
```

### Provide/Inject Pattern

In `App.vue` werden alle Composables bereitgestellt:

```javascript
// App.vue - Setup
import { provide, ref } from 'vue'
import { useAudioEngine } from './composables/useAudioEngine'
import { useAudioPlayer } from './composables/useAudioPlayer'
import { useI18n } from './composables/useI18n'
import { useTheme } from './composables/useTheme'

export default {
  setup() {
    // Composables instanziieren
    const audioEngine = useAudioEngine()
    const audioPlayer = useAudioPlayer()
    const { t, currentLanguage, setLanguage } = useI18n()
    const { currentTheme, setTheme } = useTheme()

    // Notification-Referenz
    const notificationRef = ref(null)

    // Verbindung zwischen Player und Engine
    audioPlayer.setAudioEngine(audioEngine)

    // ═══════════════════════════════════════════════════════
    // DEPENDENCY INJECTION
    // ═══════════════════════════════════════════════════════

    provide('audioEngine', audioEngine)
    provide('audioPlayer', audioPlayer)
    provide('i18n', { t, currentLanguage, setLanguage })
    provide('theme', { currentTheme, setTheme })

    // Utility-Funktion als Injection
    provide('notify', (message, type = 'info') => {
      notificationRef.value?.show(message, type)
    })

    return {
      notificationRef,
      t,
      currentLanguage
    }
  }
}
```

In Kind-Komponenten:

```javascript
// Equalizer.vue
import { inject, ref, watch } from 'vue'

export default {
  setup() {
    // Injections empfangen
    const audioEngine = inject('audioEngine')
    const notify = inject('notify')
    const { t } = inject('i18n')

    // Lokaler State
    const selectedPreset = ref('')
    const localBands = ref([])

    // ═══════════════════════════════════════════════════════
    // STATE-SYNCHRONISATION
    // ═══════════════════════════════════════════════════════

    // Watcher für bidirektionale Synchronisation
    watch(
      () => audioEngine.eqBands,
      (newBands) => {
        localBands.value = newBands.map(band => ({
          frequency: band.frequency,
          gain: band.gain
        }))
      },
      { deep: true, immediate: true }
    )

    // ═══════════════════════════════════════════════════════
    // EVENT HANDLERS
    // ═══════════════════════════════════════════════════════

    function handleGainChange(event, index) {
      const value = parseFloat(event.target.value)

      // Lokalen State aktualisieren
      localBands.value[index].gain = value

      // Audio Engine aktualisieren
      audioEngine.updateEqBand(index, value)

      // Preset zurücksetzen
      selectedPreset.value = ''
    }

    function handlePresetChange() {
      if (selectedPreset.value) {
        audioEngine.applyEqPreset(selectedPreset.value)
        notify(t('preset_applied'), 'success')
      }
    }

    return {
      localBands,
      selectedPreset,
      handleGainChange,
      handlePresetChange,
      t
    }
  }
}
```

### ref() vs reactive() - Wann was?

```javascript
// ref() für:
// - Primitive Werte
// - Werte die komplett ersetzt werden
// - Template-Refs

const count = ref(0)
const audioContext = ref(null)
const isPlaying = ref(false)

// Zugriff mit .value in JS
count.value++
audioContext.value = new AudioContext()

// Im Template ohne .value
// <span>{{ count }}</span>


// reactive() für:
// - Objekte mit fester Struktur
// - Arrays von Objekten
// - Wenn Properties einzeln aktualisiert werden

const dynamics = reactive({
  threshold: -30,
  knee: 20,
  ratio: 4
})

// Direkter Zugriff (kein .value)
dynamics.threshold = -24
dynamics.ratio = 6

// Achtung: Nicht das ganze Objekt ersetzen!
// FALSCH: dynamics = { threshold: -20, ... }
// RICHTIG: Object.assign(dynamics, newSettings)
```

---

## State Management ohne Vuex

### Warum kein Vuex/Pinia?

Für diese Anwendung bietet Vue's eingebautes Reactivity-System alle nötigen Features:

1. **Überschaubarer State**: Keine komplexe Multi-Page-App
2. **Klare Datenflüsse**: Audio Engine → Player → UI
3. **Weniger Boilerplate**: Kein Actions/Mutations/Getters
4. **Direkte Web Audio API Integration**: Immediate Updates nötig

### State-Management-Architektur

```
┌─────────────────────────────────────────────────────────────────┐
│                        Globaler State                            │
│  (Composables als Singletons über Provide/Inject)               │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │ audioEngine  │  │ audioPlayer  │  │   i18n       │           │
│  │              │  │              │  │              │           │
│  │ - eqBands    │  │ - playlist   │  │ - language   │           │
│  │ - dynamics   │  │ - isPlaying  │  │ - t()        │           │
│  │ - masterGain │  │ - volume     │  │              │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ provide / inject
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Komponenten-Layer                           │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │ Equalizer    │  │ PlayerCtrl   │  │ Visualization│           │
│  │              │  │              │  │              │           │
│  │ localBands   │  │ (kein local  │  │ animationId  │           │
│  │ selectedPreset│ │  state)      │  │              │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
│                                                                  │
│  Lokaler State: Nur für UI-spezifische Daten                    │
└─────────────────────────────────────────────────────────────────┘
```

### Datenfluss-Beispiel: EQ-Änderung

```
1. User zieht Slider
        ↓
2. @input Event in Equalizer.vue
        ↓
3. handleGainChange(event, 5)  // Band 5
        ↓
4. audioEngine.updateEqBand(5, +6)
        ↓
    ┌───────────────────────────────────────┐
    │ updateEqBand(index, gain) {           │
    │   eqBands[index].gain = gain          │ ← Reactive State
    │   eqFilters[index].gain.value = gain  │ ← Web Audio API
    │ }                                     │
    └───────────────────────────────────────┘
        ↓
5. Vue Reactivity detectiert Änderung
        ↓
6. Watcher in Equalizer.vue triggert (deep: true)
        ↓
7. localBands.value wird aktualisiert
        ↓
8. DOM re-rendert (Slider-Position)
        ↓
9. User hört Klangänderung (Web Audio API)
```

### LocalStorage-Persistenz

```javascript
// useTheme.js
export function useTheme() {
  // Initial aus localStorage oder System-Präferenz
  const currentTheme = ref(
    localStorage.getItem('equalizer-theme') || detectSystemTheme()
  )

  function setTheme(theme) {
    currentTheme.value = theme

    // Persistieren
    localStorage.setItem('equalizer-theme', theme)

    // DOM aktualisieren
    document.documentElement.setAttribute('data-theme', theme)
  }

  function detectSystemTheme() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
  }

  return { currentTheme, setTheme }
}
```

---

## DSP-Konzepte: Equalizer & Kompressor

### Parametrischer Equalizer

Ein parametrischer EQ verwendet **IIR-Filter** (Infinite Impulse Response) für frequenzspezifische Gain-Anpassungen.

#### Filter-Typen

```
┌─────────────────────────────────────────────────────────────────┐
│                        LOWSHELF (20 Hz)                         │
│                                                                 │
│     Gain │                                                      │
│      +6  │ ████                                                 │
│       0  │─────████████████████████████████████────────────     │
│      -6  │                                                      │
│          └─────────────────────────────────────────────────     │
│            20    100    500    2k    10k   20k  Hz              │
│                                                                 │
│  Hebt/senkt alle Frequenzen UNTERHALB der Grenzfrequenz        │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      PEAKING (25-1000 Hz)                       │
│                                                                 │
│     Gain │                                                      │
│      +6  │            ███                                       │
│       0  │─────────██───██─────────────────────────────────     │
│      -6  │                                                      │
│          └─────────────────────────────────────────────────     │
│            20    100    500    2k    10k   20k  Hz              │
│                                                                 │
│  Glockenförmige Kurve um die Zentralfrequenz                   │
│  Q bestimmt Breite: niedriges Q = breit, hohes Q = schmal      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      HIGHSHELF (1250 Hz)                        │
│                                                                 │
│     Gain │                                                      │
│      +6  │                                           ████████   │
│       0  │─────────────────────────────────████████────────     │
│      -6  │                                                      │
│          └─────────────────────────────────────────────────     │
│            20    100    500    2k    10k   20k  Hz              │
│                                                                 │
│  Hebt/senkt alle Frequenzen OBERHALB der Grenzfrequenz         │
└─────────────────────────────────────────────────────────────────┘
```

#### Frequenzverteilung (ISO 1/3-Oktav)

```javascript
const EQ_FREQUENCIES = [
  20,    // Sub-Bass (unhörbar für viele)
  25,    // Sub-Bass
  31.5,  // Sub-Bass
  40,    // Bass
  50,    // Bass
  63,    // Bass
  80,    // Bass
  100,   // Oberer Bass
  125,   // Tiefe Mitten
  160,   // Tiefe Mitten
  200,   // Mitten
  250,   // Mitten
  315,   // Mitten
  400,   // Mitten
  500,   // Mitten
  630,   // Obere Mitten
  800,   // Obere Mitten
  1000,  // Präsenz
  1250   // Präsenz / Höhen
]

// Hinweis: Die Web Audio API geht bis Nyquist (halbe Sample-Rate)
// Bei 44.1 kHz sind das ~22 kHz
```

#### Gain-Bereich

```javascript
// Typische Grenzen
const MIN_GAIN = -12  // dB - Absenkung
const MAX_GAIN = +12  // dB - Anhebung

// dB-Skala ist logarithmisch:
// +6 dB ≈ doppelte Lautstärke
// -6 dB ≈ halbe Lautstärke
// +12 dB ≈ 4x Lautstärke

// Umrechnung:
// Linear → dB: dB = 20 * log10(linear)
// dB → Linear: linear = 10^(dB/20)
```

### Dynamics Compressor

Ein Kompressor reduziert den Dynamikumfang, indem laute Signale abgesenkt werden.

#### Funktionsprinzip

```
                           Input Level
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      GAIN COMPUTER                              │
│                                                                 │
│  Input │                                                        │
│   (dB) │                            ╱╱╱ Hard Knee              │
│    0   │                        ╱╱╱╱                           │
│        │                    ╱╱╱╱    Ratio 4:1                  │
│  -10   │                ╱╱╱╱        (4 dB rein → 1 dB raus)    │
│        │            ╱╱╱╱                                        │
│  -20   │        ╱╱╱╱                                            │
│        │    ╱╱╱╱  ← Knee Region                                 │
│  -30   │──╱╱─────────────────────────────────────────── Threshold│
│        │╱╱                                                      │
│        │ 1:1 (keine Kompression unter Threshold)               │
│        └────────────────────────────────────────────────────    │
│         -30  -20  -10   0   Output (dB)                        │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
                      ┌─────────────────┐
                      │ Attack/Release  │
                      │   Envelope      │
                      └─────────────────┘
                               │
                               ▼
                         Gain Reduction
                         (auf Signal anwenden)
```

#### Parameter erklärt

```javascript
const dynamics = reactive({
  // Threshold: Ab welchem Pegel komprimiert wird
  // -100 dB = sehr leise Signale schon komprimieren
  // 0 dB = nur bei maximaler Lautstärke
  threshold: -30,  // Moderate Einstellung

  // Knee: Übergang zwischen unkomprimiert und komprimiert
  // 0 dB = harter Übergang (abrupt)
  // 40 dB = weicher Übergang (sanft, musikalischer)
  knee: 20,  // Moderate Weichheit

  // Ratio: Wie stark komprimiert wird
  // 2:1 = leichte Kompression
  // 4:1 = moderate Kompression
  // 10:1+ = starke Kompression / Limiter
  ratio: 4,  // 4 dB über Threshold → 1 dB Output

  // Attack: Wie schnell reagiert der Kompressor?
  // 0.001s (1ms) = sehr schnell, fängt Transienten
  // 0.100s (100ms) = langsam, lässt Transienten durch
  attack: 0.003,  // 3ms - schnell

  // Release: Wie schnell erholt sich der Kompressor?
  // 0.025s (25ms) = sehr schnell (kann pumpen)
  // 0.500s (500ms) = langsam (natürlicher)
  release: 0.25  // 250ms - moderate Geschwindigkeit
})
```

#### Typische Anwendungen

```
┌─────────────────────────────────────────────────────────────────┐
│ DRUMS/PERCUSSION                                                │
│                                                                 │
│ Threshold: -24 dB      Schneller Attack fängt Transienten      │
│ Ratio: 6:1             Hohes Ratio für starke Kontrolle        │
│ Knee: 6 dB             Harter Knee für Definition              │
│ Attack: 2ms            Schnell!                                │
│ Release: 35ms          Schnell für nächsten Schlag             │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ VOCALS                                                          │
│                                                                 │
│ Threshold: -20 dB      Moderate Kompression                    │
│ Ratio: 3:1             Sanft für natürlichen Klang             │
│ Knee: 12 dB            Weich für Transparenz                   │
│ Attack: 8ms            Lässt Konsonanten durch                 │
│ Release: 80ms          Mittel für gleichmäßigen Pegel          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ MASTERING (Limiter)                                             │
│                                                                 │
│ Threshold: -6 dB       Nur extreme Peaks                       │
│ Ratio: 20:1            Fast unendlich (Brick-Wall)             │
│ Knee: 0 dB             Hart für präzise Kontrolle              │
│ Attack: 0.5ms          Extrem schnell                          │
│ Release: 10ms          Schnell für Transparenz                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Echtzeit-Visualisierung mit Canvas

### AnalyserNode und FFT

Der `AnalyserNode` führt eine **Fast Fourier Transform (FFT)** durch und konvertiert das Zeitsignal in Frequenzdaten:

```javascript
// Konfiguration
analyserNode.value = audioContext.value.createAnalyser()
analyserNode.value.fftSize = 2048        // Muss Potenz von 2 sein
analyserNode.value.smoothingTimeConstant = 0.8  // 0-1, höher = glatter

// Verfügbare Daten:
// - frequencyBinCount = fftSize / 2 = 1024 Frequenz-Bins
// - Jeder Bin repräsentiert: (sampleRate / fftSize) Hz
// - Bei 44100 Hz und fftSize 2048: ~21.5 Hz pro Bin

// Frequenz-Daten holen (für Spektrum-Anzeige)
const frequencyData = new Uint8Array(analyserNode.frequencyBinCount)
analyserNode.getByteFrequencyData(frequencyData)
// Werte: 0-255 (logarithmische dB-Skala, normalisiert)

// Zeit-Daten holen (für Waveform-Anzeige)
const timeDomainData = new Uint8Array(analyserNode.fftSize)
analyserNode.getByteTimeDomainData(timeDomainData)
// Werte: 0-255 (128 = Nulllinie)
```

### Visualization.vue Implementierung

```javascript
// Visualization.vue - Setup

import { ref, inject, onMounted, onUnmounted } from 'vue'

export default {
  setup() {
    const audioEngine = inject('audioEngine')
    const canvasRef = ref(null)
    let animationId = null

    // ═══════════════════════════════════════════════════════
    // ANIMATION LOOP
    // ═══════════════════════════════════════════════════════

    function drawVisualization() {
      // Nächsten Frame anfordern
      animationId = requestAnimationFrame(drawVisualization)

      const canvas = canvasRef.value
      if (!canvas || !audioEngine?.isInitialized?.value) return

      const ctx = canvas.getContext('2d')
      const { width, height } = canvas

      // FFT-Daten holen
      const dataArray = audioEngine.getFrequencyData()
      const bufferLength = dataArray.length

      // Canvas löschen
      ctx.fillStyle = 'rgb(10, 10, 13)'  // Hintergrundfarbe
      ctx.fillRect(0, 0, width, height)

      // ═══════════════════════════════════════════════════════
      // BALKEN ZEICHNEN
      // ═══════════════════════════════════════════════════════

      // Nicht alle Bins zeichnen (zu viele) - nur Auswahl
      const barCount = 64
      const barWidth = width / barCount
      const step = Math.floor(bufferLength / barCount)

      ctx.fillStyle = '#00D9FF'  // Akzentfarbe

      for (let i = 0; i < barCount; i++) {
        // Durchschnitt über mehrere Bins für genaueren Wert
        let sum = 0
        for (let j = 0; j < step; j++) {
          sum += dataArray[i * step + j]
        }
        const value = sum / step

        // Höhe berechnen (0-255 → 0-canvas.height)
        const barHeight = (value / 255) * height

        // Balken zeichnen (von unten nach oben)
        const x = i * barWidth
        const y = height - barHeight

        ctx.fillRect(x, y, barWidth - 1, barHeight)
      }
    }

    // ═══════════════════════════════════════════════════════
    // LIFECYCLE
    // ═══════════════════════════════════════════════════════

    onMounted(() => {
      // Canvas-Größe setzen
      const canvas = canvasRef.value
      if (canvas) {
        canvas.width = canvas.offsetWidth
        canvas.height = canvas.offsetHeight
      }

      // Animation starten
      drawVisualization()
    })

    onUnmounted(() => {
      // WICHTIG: Animation stoppen um Memory-Leaks zu verhindern
      if (animationId) {
        cancelAnimationFrame(animationId)
        animationId = null
      }
    })

    return { canvasRef }
  }
}
```

```vue
<!-- Template -->
<template>
  <div class="visualization-container">
    <canvas ref="canvasRef" class="visualization-canvas"></canvas>
  </div>
</template>

<style scoped>
.visualization-container {
  width: 100%;
  height: 200px;
  background: var(--surface-bg);
  border-radius: 8px;
  overflow: hidden;
}

.visualization-canvas {
  width: 100%;
  height: 100%;
}
</style>
```

### Performance-Tipps für Canvas

```javascript
// 1. Context nicht in jedem Frame neu holen
// SCHLECHT:
function draw() {
  const ctx = canvas.getContext('2d')  // Overhead!
  // ...
}

// GUT:
let ctx = null
onMounted(() => {
  ctx = canvas.getContext('2d')  // Einmal
})

// 2. Typed Arrays wiederverwenden
// SCHLECHT:
function getFrequencyData() {
  const dataArray = new Uint8Array(bufferLength)  // Allocation!
  analyser.getByteFrequencyData(dataArray)
  return dataArray
}

// GUT:
const dataArray = new Uint8Array(bufferLength)  // Einmal
function getFrequencyData() {
  analyser.getByteFrequencyData(dataArray)  // Wiederverwendung
  return dataArray
}

// 3. Nicht alle Bins zeichnen
const bufferLength = 1024  // Zu viele Balken!
const visibleBars = 64     // Reicht für gute Visualisierung

// 4. smoothingTimeConstant nutzen
analyser.smoothingTimeConstant = 0.8  // Verhindert Flackern
```

---

## Recording & Export

### MediaRecorder API Grundlagen

Die MediaRecorder API ermöglicht das Aufnehmen von MediaStreams:

```javascript
// Stream aus Web Audio API erstellen
const destination = audioContext.createMediaStreamDestination()
gainNode.connect(destination)  // Aufnahme nach dem Processing

// MediaRecorder erstellen
const mediaRecorder = new MediaRecorder(destination.stream, {
  mimeType: 'audio/webm;codecs=opus'  // Gute Qualität, kompakt
})

// Events
mediaRecorder.ondataavailable = (event) => {
  if (event.data.size > 0) {
    recordedChunks.push(event.data)
  }
}

mediaRecorder.onstop = () => {
  const blob = new Blob(recordedChunks, { type: 'audio/webm' })
  // Download oder weitere Verarbeitung
}

// Steuerung
mediaRecorder.start(100)  // Chunk alle 100ms
mediaRecorder.stop()
```

### useOutputRecorder.js

```javascript
// src/composables/useOutputRecorder.js

import { ref } from 'vue'

export function useOutputRecorder() {
  const isRecording = ref(false)
  const recordedChunks = ref([])
  const recordingTime = ref(0)
  const recordingFormat = ref('webm')  // oder 'wav'

  let mediaRecorder = null
  let mediaStreamDestination = null
  let timerInterval = null

  // ═══════════════════════════════════════════════════════
  // RECORDING STARTEN
  // ═══════════════════════════════════════════════════════

  function startRecording(audioEngine) {
    if (!audioEngine?.audioContext?.value) {
      throw new Error('AudioContext nicht initialisiert')
    }

    const ctx = audioEngine.audioContext.value

    // MediaStreamDestination erstellen
    mediaStreamDestination = ctx.createMediaStreamDestination()

    // Mit dem letzten Node der Kette verbinden
    const nodes = audioEngine.getAudioNodes()
    if (nodes.gainNode) {
      nodes.gainNode.connect(mediaStreamDestination)
    }

    // MediaRecorder konfigurieren
    const mimeType = recordingFormat.value === 'wav'
      ? 'audio/wav'
      : 'audio/webm;codecs=opus'

    // Fallback wenn Format nicht unterstützt
    const actualMimeType = MediaRecorder.isTypeSupported(mimeType)
      ? mimeType
      : 'audio/webm'

    mediaRecorder = new MediaRecorder(
      mediaStreamDestination.stream,
      { mimeType: actualMimeType }
    )

    // Chunks sammeln
    recordedChunks.value = []
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunks.value.push(event.data)
      }
    }

    // Timer für Anzeige
    recordingTime.value = 0
    timerInterval = setInterval(() => {
      recordingTime.value++
    }, 1000)

    // Aufnahme starten
    mediaRecorder.start(100)  // Chunk alle 100ms
    isRecording.value = true
  }

  // ═══════════════════════════════════════════════════════
  // RECORDING STOPPEN
  // ═══════════════════════════════════════════════════════

  function stopRecording() {
    return new Promise((resolve) => {
      if (!mediaRecorder || mediaRecorder.state === 'inactive') {
        resolve(null)
        return
      }

      mediaRecorder.onstop = () => {
        // Timer stoppen
        clearInterval(timerInterval)

        // Blob erstellen
        const blob = new Blob(recordedChunks.value, {
          type: mediaRecorder.mimeType
        })

        isRecording.value = false
        resolve(blob)
      }

      mediaRecorder.stop()
    })
  }

  // ═══════════════════════════════════════════════════════
  // DOWNLOAD
  // ═══════════════════════════════════════════════════════

  async function downloadRecording() {
    const blob = await stopRecording()
    if (!blob) return

    // Download-Link erstellen
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `recording_${Date.now()}.${recordingFormat.value}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)

    // URL freigeben
    URL.revokeObjectURL(url)
  }

  return {
    isRecording,
    recordingTime,
    recordingFormat,
    startRecording,
    stopRecording,
    downloadRecording
  }
}
```

### WAV-Export (PCM-Konvertierung)

WebM/Opus ist komprimiert. Für unkomprimiertes WAV:

```javascript
async function convertToWav(webmBlob, audioContext) {
  // 1. Blob zu ArrayBuffer
  const arrayBuffer = await webmBlob.arrayBuffer()

  // 2. Dekodieren zu AudioBuffer
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

  // 3. WAV-Header erstellen
  const wavBuffer = audioBufferToWav(audioBuffer)

  return new Blob([wavBuffer], { type: 'audio/wav' })
}

function audioBufferToWav(audioBuffer) {
  const numChannels = audioBuffer.numberOfChannels
  const sampleRate = audioBuffer.sampleRate
  const format = 1  // PCM
  const bitDepth = 16

  // Interleave Channels
  const samples = interleave(audioBuffer)

  // WAV-Header (44 Bytes)
  const buffer = new ArrayBuffer(44 + samples.length * 2)
  const view = new DataView(buffer)

  // RIFF Header
  writeString(view, 0, 'RIFF')
  view.setUint32(4, 36 + samples.length * 2, true)
  writeString(view, 8, 'WAVE')

  // fmt Chunk
  writeString(view, 12, 'fmt ')
  view.setUint32(16, 16, true)  // Chunk Size
  view.setUint16(20, format, true)
  view.setUint16(22, numChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * numChannels * bitDepth / 8, true)
  view.setUint16(32, numChannels * bitDepth / 8, true)
  view.setUint16(34, bitDepth, true)

  // data Chunk
  writeString(view, 36, 'data')
  view.setUint32(40, samples.length * 2, true)

  // Audio-Daten (16-bit PCM)
  let offset = 44
  for (let i = 0; i < samples.length; i++) {
    const sample = Math.max(-1, Math.min(1, samples[i]))
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true)
    offset += 2
  }

  return buffer
}
```

---

## Performance-Optimierungen

### 1. Lazy AudioContext Initialization

```javascript
// Browser blockieren AudioContext bis User-Interaktion
// SCHLECHT: Sofort beim App-Start erstellen
const audioContext = new AudioContext()  // Wird suspended!

// GUT: Bei erster Interaktion
let audioContext = null

function initOnInteraction() {
  if (!audioContext) {
    audioContext = new AudioContext()
  }
  // Event-Listener entfernen
  document.removeEventListener('click', initOnInteraction)
}

document.addEventListener('click', initOnInteraction, { once: true })
```

### 2. requestAnimationFrame für Visualisierung

```javascript
// SCHLECHT: setInterval
setInterval(() => {
  drawVisualization()
}, 16)  // ~60fps, aber ungenau und batteriefressend

// GUT: requestAnimationFrame
function draw() {
  requestAnimationFrame(draw)  // Nächsten Frame anfordern

  // Nur zeichnen wenn Tab sichtbar
  drawVisualization()
}

// Bei Verlassen der Komponente stoppen!
onUnmounted(() => {
  cancelAnimationFrame(animationId)
})
```

### 3. TypedArrays wiederverwenden

```javascript
// SCHLECHT: Jedes Frame neue Allocation
function getFrequencyData() {
  const data = new Uint8Array(1024)  // GC-Overhead!
  analyser.getByteFrequencyData(data)
  return data
}

// GUT: Einmal allokieren, wiederverwenden
const frequencyData = new Uint8Array(1024)  // Einmal

function getFrequencyData() {
  analyser.getByteFrequencyData(frequencyData)  // In-place
  return frequencyData
}
```

### 4. Reactive State Batching

```javascript
// SCHLECHT: Viele einzelne Updates
eqBands[0].gain = 6
eqBands[1].gain = 4
eqBands[2].gain = 2
// → 3 Reaktivitäts-Zyklen

// GUT: Ein Update
function updateAllEqBands(gains) {
  gains.forEach((gain, index) => {
    eqBands[index].gain = gain
    eqFilters[index].gain.value = gain
  })
}
// → 1 Reaktivitäts-Zyklus (Vue batcht automatisch)
```

### 5. CSS-Variablen für Theme-Switch

```css
/* Theme-Wechsel ohne Component Re-render */

:root {
  --primary-bg: #0A0A0D;
  --accent-primary: #00D9FF;
  --text-primary: #FFFFFF;
}

[data-theme="light"] {
  --primary-bg: #F8F9FA;
  --accent-primary: #0066CC;
  --text-primary: #1A1A1A;
}

/* Komponenten nutzen nur Variablen */
.card {
  background: var(--primary-bg);
  color: var(--text-primary);
}
```

```javascript
// Theme-Wechsel: Nur Attribut ändern
function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme)
  // Kein Vue Re-render nötig!
}
```

### 6. Audio Node Caching

```javascript
// SCHLECHT: Nodes bei jedem Play erstellen/verbinden
function play() {
  const source = audioContext.createMediaElementSource(audio)
  source.connect(filter)
  filter.connect(destination)
}

// GUT: Einmal erstellen, Flag für Status
let mediaElementSource = null
let isSourceConnected = false

function connectToAudioEngine() {
  if (!mediaElementSource) {
    mediaElementSource = audioContext.createMediaElementSource(audio)
  }

  if (!isSourceConnected) {
    audioEngine.connectAudioSource(mediaElementSource)
    isSourceConnected = true
  }
}
```

### 7. Computed Properties statt Methods

```javascript
// SCHLECHT: Berechnung bei jedem Render
function getProgress() {
  return (currentTime.value / duration.value) * 100
}

// GUT: Computed cacht Ergebnis
const progress = computed(() => {
  if (duration.value === 0) return 0
  return (currentTime.value / duration.value) * 100
})
// Nur neu berechnet wenn currentTime oder duration sich ändern
```

---

## Komponentenarchitektur

### Komponenten-Hierarchie

```
App.vue
│
├── Notification.vue ─────────────────── Toast-System (expose: show)
│
├── LanguageThemeSwitcher.vue ────────── Sprache & Theme Controls
│
├── PromoSection.vue ─────────────────── Header/Branding
│
├── [Main Grid Layout]
│   │
│   ├── Column: Left (Recorder & Player)
│   │   │
│   │   ├── OutputRecordingControls.vue
│   │   │   └── useOutputRecorder composable
│   │   │
│   │   ├── PlayerControls.vue
│   │   │   └── useAudioPlayer composable
│   │   │
│   │   └── Playlist.vue
│   │       └── Track-Liste mit Drag/Drop (optional)
│   │
│   ├── Column: Center (EQ & Visualization)
│   │   │
│   │   ├── Equalizer.vue
│   │   │   ├── 19 vertikale Slider
│   │   │   ├── Preset-Dropdown
│   │   │   └── Reset/Bypass Buttons
│   │   │
│   │   └── Visualization.vue
│   │       └── Canvas FFT-Spektrum
│   │
│   └── Column: Right (Dynamics)
│       │
│       ├── DynamicsProcessor.vue
│       │   ├── 5 Parameter-Slider
│       │   └── Enable/Disable Toggle
│       │
│       └── CompressorPresets.vue
│           └── Quick-Preset Buttons
│
└── AudioConverter.vue ───────────────── Promo/Info Section
```

### Kommunikationsmuster

#### 1. Props (Parent → Child)

```vue
<!-- Parent -->
<ChildComponent :title="pageTitle" :items="listItems" />

<!-- Child -->
<script>
export default {
  props: {
    title: { type: String, required: true },
    items: { type: Array, default: () => [] }
  }
}
</script>
```

#### 2. Emit (Child → Parent)

```vue
<!-- Child -->
<template>
  <input @change="$emit('files-selected', $event.target.files)" />
</template>

<!-- Parent -->
<PlayerControls @files-selected="handleFiles" />
```

#### 3. Provide/Inject (Ancestor → Descendants)

```javascript
// App.vue (Ancestor)
provide('audioEngine', useAudioEngine())

// Any Descendant
const audioEngine = inject('audioEngine')
```

#### 4. Template Refs (Parent → Child Methods)

```vue
<!-- Parent -->
<template>
  <Notification ref="notificationRef" />
</template>

<script>
const notificationRef = ref(null)

// Methode des Kindes aufrufen
function showToast(message) {
  notificationRef.value?.show(message, 'success')
}
</script>
```

### Equalizer.vue Deep Dive

```vue
<template>
  <div class="equalizer-container">
    <!-- Header mit Preset-Auswahl -->
    <div class="eq-header">
      <h3>{{ t('equalizer') }}</h3>

      <select v-model="selectedPreset" @change="handlePresetChange">
        <option value="">{{ t('custom') }}</option>
        <option v-for="(_, name) in EQ_PRESETS" :key="name" :value="name">
          {{ name }}
        </option>
      </select>

      <button @click="resetEq">{{ t('reset') }}</button>
      <button @click="toggleBypass">
        {{ eqBypass ? t('enable') : t('bypass') }}
      </button>
    </div>

    <!-- 19 EQ-Bänder -->
    <div class="eq-bands">
      <div
        v-for="(band, index) in localBands"
        :key="band.frequency"
        class="eq-band"
      >
        <!-- Vertikaler Slider -->
        <input
          type="range"
          class="eq-slider"
          min="-12"
          max="12"
          step="0.5"
          :value="band.gain"
          @input="handleGainChange($event, index)"
          orient="vertical"
        />

        <!-- Gain-Anzeige -->
        <span class="gain-value">
          {{ band.gain > 0 ? '+' : '' }}{{ band.gain.toFixed(1) }}
        </span>

        <!-- Frequenz-Label -->
        <span class="freq-label">
          {{ formatFrequency(band.frequency) }}
        </span>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, inject, watch, onMounted } from 'vue'
import { EQ_PRESETS, EQ_FREQUENCIES } from '../utils/presets'

export default {
  setup() {
    // Dependency Injection
    const audioEngine = inject('audioEngine')
    const notify = inject('notify')
    const { t } = inject('i18n')

    // Lokaler State
    const selectedPreset = ref('')
    const localBands = ref([])
    const eqBypass = ref(false)

    // ═══════════════════════════════════════════════════════
    // STATE SYNCHRONISATION
    // ═══════════════════════════════════════════════════════

    // Von audioEngine zu lokalen Bändern
    watch(
      () => audioEngine?.eqBands,
      (newBands) => {
        if (newBands?.length === 19) {
          localBands.value = newBands.map(b => ({
            frequency: b.frequency,
            gain: b.gain
          }))
        }
      },
      { deep: true, immediate: true }
    )

    // Bypass-Status synchronisieren
    watch(
      () => audioEngine?.eqBypass?.value,
      (newValue) => { eqBypass.value = newValue },
      { immediate: true }
    )

    // ═══════════════════════════════════════════════════════
    // EVENT HANDLERS
    // ═══════════════════════════════════════════════════════

    function handleGainChange(event, index) {
      const gain = parseFloat(event.target.value)

      // Lokal aktualisieren
      localBands.value[index].gain = gain

      // Audio Engine aktualisieren
      audioEngine?.updateEqBand(index, gain)

      // Preset zurücksetzen (Custom)
      selectedPreset.value = ''
    }

    function handlePresetChange() {
      if (!selectedPreset.value) return

      const presetGains = EQ_PRESETS[selectedPreset.value]
      if (!presetGains) return

      // Alle Bänder aktualisieren
      presetGains.forEach((gain, index) => {
        audioEngine?.updateEqBand(index, gain)
      })

      notify?.(t('preset_applied'), 'success')
    }

    function resetEq() {
      EQ_FREQUENCIES.forEach((_, index) => {
        audioEngine?.updateEqBand(index, 0)
      })
      selectedPreset.value = ''
      notify?.(t('eq_reset'), 'info')
    }

    function toggleBypass() {
      audioEngine?.toggleEqBypass()
      notify?.(
        eqBypass.value ? t('eq_enabled') : t('eq_bypassed'),
        'info'
      )
    }

    // ═══════════════════════════════════════════════════════
    // HILFSFUNKTIONEN
    // ═══════════════════════════════════════════════════════

    function formatFrequency(freq) {
      if (freq >= 1000) {
        return `${(freq / 1000).toFixed(1)}k`
      }
      return `${freq}`
    }

    return {
      // State
      localBands,
      selectedPreset,
      eqBypass,

      // Constants
      EQ_PRESETS,

      // Methods
      handleGainChange,
      handlePresetChange,
      resetEq,
      toggleBypass,
      formatFrequency,

      // i18n
      t
    }
  }
}
</script>

<style scoped>
.equalizer-container {
  background: var(--surface-bg);
  border-radius: 12px;
  padding: 20px;
}

.eq-bands {
  display: flex;
  gap: 8px;
  justify-content: space-between;
}

.eq-band {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

/* Vertikaler Slider */
.eq-slider {
  writing-mode: vertical-lr;
  direction: rtl;
  height: 150px;
  width: 24px;
  cursor: pointer;
}

.gain-value {
  font-size: 10px;
  color: var(--text-secondary);
  font-family: monospace;
}

.freq-label {
  font-size: 9px;
  color: var(--text-muted);
}
</style>
```

---

## Preset-System

### Dateistruktur

```javascript
// src/utils/presets.js

// ═══════════════════════════════════════════════════════════
// EQ-FREQUENZEN (ISO 1/3-Oktav Standard)
// ═══════════════════════════════════════════════════════════

export const EQ_FREQUENCIES = [
  20, 25, 31.5, 40, 50, 63, 80, 100, 125, 160,
  200, 250, 315, 400, 500, 630, 800, 1000, 1250
]

// ═══════════════════════════════════════════════════════════
// EQ-PRESETS (8 Genre-basierte Kurven)
// ═══════════════════════════════════════════════════════════

export const EQ_PRESETS = {
  // Index:     0    1    2    3    4    5    6    7    8    9   10   11   12   13   14   15   16   17   18
  // Freq (Hz): 20   25  31.5  40   50   63   80  100  125  160  200  250  315  400  500  630  800 1000 1250

  'Flat':       [  0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0],
  'Rock':       [ -2,   0,   2,   4,   3,   1,  -1,   0,   1,   2,   3,   4,   3,   2,   1,   0,  -1,  -2,  -3],
  'Pop':        [  1,   2,   3,   2,   1,   0,  -1,   0,   1,   2,   2,   1,   0,  -1,  -2,  -1,   0,   1,   2],
  'Jazz':       [  2,   1,   0,  -1,   0,   1,   2,   1,   0,  -1,  -2,  -1,   0,   1,   2,   3,   2,   1,   0],
  'Classical':  [  3,   2,   1,   0,  -1,  -2,   0,   1,   2,   1,   0,  -1,   0,   1,   2,   3,   2,   1,  -1],
  'Electronic': [  4,   3,   2,   1,   0,  -1,  -2,   0,   2,   4,   3,   2,   1,   3,   4,   3,   2,   1,   0],
  'Bass Boost': [  8,   6,   4,   2,   1,   0,  -1,  -2,  -1,   0,   1,   0,  -1,  -2,  -1,   0,   1,   2,   1],
  'V-Shape':    [  4,   3,   2,   1,   0,  -1,  -2,  -3,  -2,  -1,   0,   1,   2,   3,   4,   3,   2,   1,   0]
}

// ═══════════════════════════════════════════════════════════
// KOMPRESSOR-PRESETS (14 Anwendungsfälle)
// ═══════════════════════════════════════════════════════════

export const COMP_PRESETS = {
  // Basis-Intensitäten
  'Gentle':    { th: -18, kn:  8, ra: 2.0, at: 10, re: 100 },
  'Medium':    { th: -24, kn: 15, ra: 4.0, at:  5, re:  50 },
  'Heavy':     { th: -30, kn: 20, ra: 8.0, at:  2, re:  25 },

  // Genre-spezifisch
  'Rock':      { th: -22, kn: 10, ra: 5.0, at:  5, re:  60 },
  'Pop':       { th: -20, kn: 12, ra: 3.5, at:  8, re:  80 },
  'Electro':   { th: -28, kn:  6, ra: 6.0, at:  1, re:  30 },
  'Jazz':      { th: -16, kn: 15, ra: 2.0, at: 15, re: 120 },
  'Hip-Hop':   { th: -26, kn:  8, ra: 5.0, at: 10, re:  40 },
  'Classical': { th: -14, kn: 20, ra: 1.5, at: 20, re: 150 },

  // Instrument/Stimme
  'Vocal':     { th: -20, kn: 12, ra: 3.0, at:  8, re:  80 },
  'Drums':     { th: -24, kn:  6, ra: 6.0, at:  2, re:  35 },
  'Bass':      { th: -22, kn: 10, ra: 4.0, at: 12, re: 100 },
  'Podcast':   { th: -18, kn: 14, ra: 3.0, at: 10, re:  90 },

  // Mastering
  'Master':    { th: -16, kn: 10, ra: 2.5, at:  3, re:  40 },
  'Limiter':   { th:  -6, kn:  0, ra: 20,  at:  0.5, re: 10 }
}

// Legende:
// th = threshold (dB)
// kn = knee (dB)
// ra = ratio (X:1)
// at = attack (ms)
// re = release (ms)
```

### Preset-Anwendung

```javascript
// EQ-Preset anwenden
function applyEqPreset(presetName) {
  const gains = EQ_PRESETS[presetName]
  if (!gains) return

  gains.forEach((gain, index) => {
    updateEqBand(index, gain)
  })
}

// Kompressor-Preset anwenden
function applyCompressorPreset(presetName) {
  const preset = COMP_PRESETS[presetName]
  if (!preset) return

  updateDynamics({
    threshold: preset.th,
    knee: preset.kn,
    ratio: preset.ra,
    attack: preset.at / 1000,   // ms → s
    release: preset.re / 1000   // ms → s
  })
}
```

### Preset-Visualisierung

```
EQ Presets Visualisiert:

ROCK                          BASS BOOST
+12│      ████                +12│████
   │    ██    ██                 │  ████
 0 ├──██────────██────────    0 ├────██████████████████
   │██            ████████       │
-12│                          -12│
   20Hz          1250Hz          20Hz          1250Hz


V-SHAPE                       ELECTRONIC
+12│████            ████      +12│████            ████
   │    ██        ██             │    ██    ████
 0 ├──────██────██────────     0 ├──────████──────────
   │        ████                 │
-12│                          -12│
   20Hz          1250Hz          20Hz          1250Hz
```

---

## Internationalisierung & Theming

### i18n Implementierung

```javascript
// src/utils/translations.js

export const translations = {
  de: {
    // Navigation
    equalizer: 'Equalizer',
    dynamics: 'Dynamik',
    player: 'Player',
    recording: 'Aufnahme',

    // EQ
    preset: 'Voreinstellung',
    custom: 'Benutzerdefiniert',
    reset: 'Zurücksetzen',
    bypass: 'Bypass',
    enable: 'Aktivieren',

    // Player
    play: 'Abspielen',
    pause: 'Pause',
    stop: 'Stopp',
    next: 'Weiter',
    previous: 'Zurück',
    volume: 'Lautstärke',

    // Kompressor
    threshold: 'Schwellwert',
    ratio: 'Verhältnis',
    knee: 'Knie',
    attack: 'Anstieg',
    release: 'Abfall',

    // Aufnahme
    start_recording: 'Aufnahme starten',
    stop_recording: 'Aufnahme stoppen',
    download: 'Herunterladen',

    // Benachrichtigungen
    file_loaded: 'Datei geladen',
    preset_applied: 'Voreinstellung angewendet',
    recording_started: 'Aufnahme gestartet',
    recording_stopped: 'Aufnahme gestoppt',

    // ... 50+ weitere Keys
  },

  en: {
    // Navigation
    equalizer: 'Equalizer',
    dynamics: 'Dynamics',
    player: 'Player',
    recording: 'Recording',

    // EQ
    preset: 'Preset',
    custom: 'Custom',
    reset: 'Reset',
    bypass: 'Bypass',
    enable: 'Enable',

    // Player
    play: 'Play',
    pause: 'Pause',
    stop: 'Stop',
    next: 'Next',
    previous: 'Previous',
    volume: 'Volume',

    // Kompressor
    threshold: 'Threshold',
    ratio: 'Ratio',
    knee: 'Knee',
    attack: 'Attack',
    release: 'Release',

    // Recording
    start_recording: 'Start Recording',
    stop_recording: 'Stop Recording',
    download: 'Download',

    // Notifications
    file_loaded: 'File loaded',
    preset_applied: 'Preset applied',
    recording_started: 'Recording started',
    recording_stopped: 'Recording stopped',

    // ... weitere Keys
  }
}
```

### useI18n Composable

```javascript
// src/composables/useI18n.js

import { ref } from 'vue'
import { translations } from '../utils/translations'

export function useI18n() {
  // Sprache aus localStorage oder Browser-Einstellung
  const currentLanguage = ref(
    localStorage.getItem('equalizer-language') || detectBrowserLanguage()
  )

  function detectBrowserLanguage() {
    const browserLang = navigator.language.slice(0, 2).toLowerCase()
    return ['de', 'en'].includes(browserLang) ? browserLang : 'en'
  }

  // Übersetzungsfunktion
  function t(key) {
    const lang = currentLanguage.value
    const translation = translations[lang]?.[key]

    if (!translation) {
      console.warn(`Missing translation: ${key} (${lang})`)
      return key  // Fallback: Key selbst anzeigen
    }

    return translation
  }

  function setLanguage(lang) {
    if (!['de', 'en'].includes(lang)) return

    currentLanguage.value = lang
    localStorage.setItem('equalizer-language', lang)

    // Optional: HTML lang-Attribut aktualisieren
    document.documentElement.setAttribute('lang', lang)
  }

  return {
    t,
    currentLanguage,
    setLanguage
  }
}
```

### Theme-System

```css
/* src/assets/style.css */

/* ═══════════════════════════════════════════════════════════
   CSS CUSTOM PROPERTIES (Variables)
   ═══════════════════════════════════════════════════════════ */

:root {
  /* Dark Theme (Standard) */
  --primary-bg: #0A0A0D;
  --secondary-bg: #121218;
  --surface-bg: #1A1A24;
  --surface-hover: #252532;

  --accent-primary: #00D9FF;
  --accent-secondary: #00A3CC;
  --accent-glow: rgba(0, 217, 255, 0.3);

  --text-primary: #FFFFFF;
  --text-secondary: #B0B0B8;
  --text-muted: #6B6B78;

  --border-color: #2A2A38;
  --success: #00FF88;
  --warning: #FFAA00;
  --error: #FF4466;

  --gradient-primary: linear-gradient(135deg, #00D9FF 0%, #00A3CC 100%);
  --gradient-bg: linear-gradient(180deg, #0A0A0D 0%, #121218 100%);

  --shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.5);
  --shadow-glow: 0 0 20px var(--accent-glow);

  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;

  --transition-fast: 150ms ease;
  --transition-normal: 250ms ease;
  --transition-slow: 400ms ease;
}

/* Light Theme */
[data-theme="light"] {
  --primary-bg: #F8F9FA;
  --secondary-bg: #FFFFFF;
  --surface-bg: #FFFFFF;
  --surface-hover: #F0F2F5;

  --accent-primary: #0066CC;
  --accent-secondary: #0055AA;
  --accent-glow: rgba(0, 102, 204, 0.2);

  --text-primary: #1A1A1A;
  --text-secondary: #4A4A5A;
  --text-muted: #8A8A98;

  --border-color: #E0E2E8;
  --success: #00AA55;
  --warning: #CC8800;
  --error: #CC2244;

  --gradient-primary: linear-gradient(135deg, #0066CC 0%, #0055AA 100%);
  --gradient-bg: linear-gradient(180deg, #F8F9FA 0%, #FFFFFF 100%);

  --shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.08);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.12);
  --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.16);
  --shadow-glow: 0 0 20px var(--accent-glow);
}

/* ═══════════════════════════════════════════════════════════
   BASE STYLES
   ═══════════════════════════════════════════════════════════ */

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: var(--primary-bg);
  color: var(--text-primary);
  line-height: 1.5;
  transition: background var(--transition-normal), color var(--transition-normal);
}

/* ═══════════════════════════════════════════════════════════
   COMPONENT STYLES (Beispiele)
   ═══════════════════════════════════════════════════════════ */

.card {
  background: var(--surface-bg);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 20px;
  box-shadow: var(--shadow-md);
  transition: all var(--transition-normal);
}

.card:hover {
  background: var(--surface-hover);
  box-shadow: var(--shadow-lg);
}

.btn-primary {
  background: var(--gradient-primary);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-primary:hover {
  box-shadow: var(--shadow-glow);
  transform: translateY(-1px);
}

/* Slider/Range Input Styling */
input[type="range"] {
  -webkit-appearance: none;
  background: var(--border-color);
  border-radius: var(--radius-sm);
  height: 6px;
}

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  background: var(--accent-primary);
  border-radius: 50%;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
}

input[type="range"]::-webkit-slider-thumb:hover {
  box-shadow: var(--shadow-glow);
}
```

### useTheme Composable

```javascript
// src/composables/useTheme.js

import { ref, watchEffect } from 'vue'

export function useTheme() {
  const currentTheme = ref(
    localStorage.getItem('equalizer-theme') || detectSystemTheme()
  )

  function detectSystemTheme() {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark'
    }
    return 'light'
  }

  function setTheme(theme) {
    if (!['dark', 'light'].includes(theme)) return

    currentTheme.value = theme
    localStorage.setItem('equalizer-theme', theme)

    // DOM aktualisieren (CSS Cascade übernimmt den Rest)
    document.documentElement.setAttribute('data-theme', theme)
  }

  // Initial anwenden
  watchEffect(() => {
    document.documentElement.setAttribute('data-theme', currentTheme.value)
  })

  // System-Präferenz-Änderungen beobachten
  if (typeof window !== 'undefined') {
    window.matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', (e) => {
        if (!localStorage.getItem('equalizer-theme')) {
          setTheme(e.matches ? 'dark' : 'light')
        }
      })
  }

  return {
    currentTheme,
    setTheme
  }
}
```

---

## Browser-Kompatibilität

### Unterstützte Browser

| Browser | Minimum Version | Web Audio API | MediaRecorder |
|---------|-----------------|---------------|---------------|
| Chrome  | 90+             | ✅            | ✅            |
| Edge    | 90+             | ✅            | ✅            |
| Firefox | 88+             | ✅            | ✅            |
| Safari  | 14.1+           | ✅ (webkit)   | ✅            |
| Opera   | 76+             | ✅            | ✅            |

### Safari-Besonderheiten

```javascript
// AudioContext Prefix
const AudioContext = window.AudioContext || window.webkitAudioContext

// MediaRecorder Codec-Support prüfen
function getSupportedMimeType() {
  const types = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus'
  ]

  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type
    }
  }

  return 'audio/webm'  // Fallback
}
```

### Feature Detection

```javascript
// Web Audio API verfügbar?
function isWebAudioSupported() {
  return !!(window.AudioContext || window.webkitAudioContext)
}

// MediaRecorder verfügbar?
function isMediaRecorderSupported() {
  return typeof MediaRecorder !== 'undefined'
}

// getUserMedia verfügbar? (für Mikrofon)
function isGetUserMediaSupported() {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
}

// Alle Features prüfen
function checkBrowserSupport() {
  const support = {
    webAudio: isWebAudioSupported(),
    mediaRecorder: isMediaRecorderSupported(),
    getUserMedia: isGetUserMediaSupported(),
    localStorage: typeof localStorage !== 'undefined'
  }

  const missing = Object.entries(support)
    .filter(([, supported]) => !supported)
    .map(([feature]) => feature)

  if (missing.length > 0) {
    console.warn('Missing browser features:', missing)
  }

  return support
}
```

### Polyfills & Fallbacks

```javascript
// AudioContext resume() für Autoplay-Policy
async function ensureAudioContextResumed(audioContext) {
  if (audioContext.state === 'suspended') {
    await audioContext.resume()
  }
}

// User-Interaktion abwarten
function waitForUserInteraction() {
  return new Promise((resolve) => {
    const events = ['click', 'touchstart', 'keydown']

    const handler = () => {
      events.forEach(e => document.removeEventListener(e, handler))
      resolve()
    }

    events.forEach(e => document.addEventListener(e, handler, { once: true }))
  })
}
```

---

## Best Practices & Lessons Learned

### 1. AudioContext Lifecycle Management

```javascript
// LESSON: AudioContext nur einmal erstellen, sauber aufräumen

let audioContext = null

function getAudioContext() {
  if (!audioContext) {
    audioContext = new AudioContext()
  }
  return audioContext
}

function cleanup() {
  if (audioContext) {
    audioContext.close()
    audioContext = null
  }
}

// Bei Component Unmount
onUnmounted(() => {
  cleanup()
})
```

### 2. MediaElementSource Einmaligkeit

```javascript
// LESSON: createMediaElementSource() nur EINMAL pro Element!

let mediaElementSource = null

function connectAudio(audioElement) {
  // FALSCH: Jedes Mal neu erstellen
  // const source = audioContext.createMediaElementSource(audioElement)

  // RICHTIG: Einmal erstellen, merken
  if (!mediaElementSource) {
    mediaElementSource = audioContext.createMediaElementSource(audioElement)
  }

  return mediaElementSource
}
```

### 3. Node Disconnection vor Reconnection

```javascript
// LESSON: Vor dem Neu-Verbinden alte Verbindungen trennen

function reconnectAudioChain() {
  // Alte Verbindungen trennen
  if (sourceNode) {
    sourceNode.disconnect()
  }

  // Neu verbinden
  let currentNode = sourceNode

  eqFilters.forEach(filter => {
    currentNode.connect(filter)
    currentNode = filter
  })

  currentNode.connect(destination)
}
```

### 4. Reactivity Pitfalls vermeiden

```javascript
// LESSON: reactive() nicht ersetzen, Object.assign verwenden

const dynamics = reactive({
  threshold: -30,
  ratio: 4
})

// FALSCH: Ersetzt das Objekt, bricht Reactivity
// dynamics = { threshold: -24, ratio: 6 }

// RICHTIG: Properties aktualisieren
Object.assign(dynamics, { threshold: -24, ratio: 6 })

// Oder einzeln:
dynamics.threshold = -24
dynamics.ratio = 6
```

### 5. Memory Leaks bei Animation verhindern

```javascript
// LESSON: requestAnimationFrame IMMER aufräumen

let animationId = null

function startAnimation() {
  function animate() {
    animationId = requestAnimationFrame(animate)
    draw()
  }
  animate()
}

// KRITISCH: Bei Unmount stoppen!
onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId)
    animationId = null
  }
})
```

### 6. Async/Await für Audio-Operationen

```javascript
// LESSON: Audio-Operationen sind oft asynchron

async function loadAndPlay(url) {
  try {
    // AudioContext muss "running" sein
    await audioContext.resume()

    // Datei laden
    const response = await fetch(url)
    const arrayBuffer = await response.arrayBuffer()

    // Dekodieren
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

    // Abspielen
    const source = audioContext.createBufferSource()
    source.buffer = audioBuffer
    source.connect(audioContext.destination)
    source.start()

  } catch (error) {
    console.error('Audio loading failed:', error)
  }
}
```

### 7. Graceful Degradation

```javascript
// LESSON: Nicht alle Features sind überall verfügbar

function initAudioProcessing() {
  // Web Audio API prüfen
  if (!isWebAudioSupported()) {
    showFallbackUI()
    return
  }

  // DynamicsCompressor prüfen (sollte überall sein, aber sicher ist sicher)
  try {
    const testCompressor = audioContext.createDynamicsCompressor()
    testCompressor.disconnect()
  } catch {
    console.warn('DynamicsCompressor not supported')
    disableDynamicsUI()
  }

  // MediaRecorder für Recording
  if (!isMediaRecorderSupported()) {
    disableRecordingUI()
  }
}
```

### 8. Debugging Audio-Probleme

```javascript
// LESSON: Audio-Debugging Tools

// 1. Node-Graph visualisieren
function logAudioGraph(startNode, depth = 0) {
  const indent = '  '.repeat(depth)
  console.log(`${indent}${startNode.constructor.name}`)

  if (startNode.numberOfOutputs > 0 && startNode._connections) {
    startNode._connections.forEach(node => {
      logAudioGraph(node, depth + 1)
    })
  }
}

// 2. AnalyserNode für Pegel-Monitoring
function getAudioLevel(analyser) {
  const data = new Uint8Array(analyser.frequencyBinCount)
  analyser.getByteFrequencyData(data)

  // RMS berechnen
  let sum = 0
  for (let i = 0; i < data.length; i++) {
    sum += data[i] * data[i]
  }
  const rms = Math.sqrt(sum / data.length)

  // In dB konvertieren
  const db = 20 * Math.log10(rms / 255)
  return db
}

// 3. AudioContext State überwachen
audioContext.onstatechange = () => {
  console.log('AudioContext state:', audioContext.state)
}
```

---

## Fazit

Equalizer 19 demonstriert, wie moderne Web-Technologien professionelle Audio-Verarbeitung direkt im Browser ermöglichen:

- **Web Audio API**: Echtzeit-Audio-Processing mit BiquadFilter und DynamicsCompressor
- **Vue 3 Composition API**: Modulare, wiederverwendbare Logik mit Composables
- **Reaktives State Management**: Ohne externe Libraries, nur mit Vue's eingebauter Reactivity
- **Canvas Visualization**: 60 FPS FFT-Spektrum mit requestAnimationFrame
- **MediaRecorder**: Browser-natives Recording mit Export

Die Kombination dieser Technologien ermöglicht Audio-Anwendungen, die früher native Software erforderten, nun vollständig im Browser laufen - plattformunabhängig und ohne Installation.

---

## Weiterführende Ressourcen

### Web Audio API
- [MDN Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [Web Audio API Specification](https://www.w3.org/TR/webaudio/)
- [Audio Worklet](https://developer.mozilla.org/en-US/docs/Web/API/AudioWorklet) (für komplexere DSP)

### Vue.js 3
- [Vue 3 Composition API Docs](https://vuejs.org/guide/extras/composition-api-faq.html)
- [VueUse](https://vueuse.org/) - Collection of Vue Composables

### DSP & Audio Engineering
- [Digital Signal Processing Guide](https://www.dspguide.com/)
- [Audio EQ Cookbook](https://www.w3.org/2011/audio/audio-eq-cookbook.html) (Biquad Filter Formeln)

---

*Diese Dokumentation wurde für Equalizer 19 erstellt. Stand: Januar 2026*
