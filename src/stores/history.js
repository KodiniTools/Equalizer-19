import { defineStore } from 'pinia'
import { useUndoRedo } from '../composables/useUndoRedo.js'
import { useAudioEngineStore } from './audioEngine.js'

/**
 * Undo/Redo-Verlauf der Verarbeitungseinstellungen (EQ, Kompressor), beobachtet
 * den Audio-Engine-Store. Siehe composables/useUndoRedo.js.
 */
export const useHistoryStore = defineStore('history', () => useUndoRedo(useAudioEngineStore()))
