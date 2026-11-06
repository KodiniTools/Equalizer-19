import { defineStore } from 'pinia'
import { useUndoRedo } from '../composables/useUndoRedo'
import { useAudioEngineStore } from './audioEngine'

/**
 * Undo/Redo-Verlauf der Verarbeitungseinstellungen (EQ, Kompressor), beobachtet
 * den Audio-Engine-Store. Siehe composables/useUndoRedo.ts.
 */
export const useHistoryStore = defineStore('history', () => useUndoRedo(useAudioEngineStore()))
