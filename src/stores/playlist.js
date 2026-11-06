import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  getNextIndex as nextIndexFor,
  getPrevIndex as prevIndexFor,
  nextRepeatMode,
  moveItem,
  indexAfterMove,
} from '../utils/playbackOrder'

/**
 * Track-Modell der Playlist. Die Blob-URL gehört dem Store und wird beim
 * Entfernen des Tracks wieder freigegeben.
 */
export function createTrack(id, name, blob, file, type) {
  return {
    id,
    name,
    file,
    url: URL.createObjectURL(blob),
    size: blob.size,
    type,
    duration: 0,
  }
}

/**
 * Playlist: Tracks, aktueller Index, Shuffle/Repeat und die Navigation darin.
 * Kennt keine Wiedergabe – der Player-Store (stores/player.js) lädt und
 * spielt Tracks und ruft hier nur die reinen Listenoperationen auf.
 */
export const usePlaylistStore = defineStore('playlist', () => {
  const tracks = ref([])
  const currentTrackIndex = ref(-1)

  // Playback modes
  const isShuffle = ref(false)
  const repeatMode = ref('off') // 'off' | 'all' | 'one'
  const shuffleHistory = ref([]) // visited indices, for shuffle "previous"

  const currentTrack = computed(() => {
    if (currentTrackIndex.value >= 0 && currentTrackIndex.value < tracks.value.length) {
      return tracks.value[currentTrackIndex.value]
    }
    return null
  })

  const hasTrack = computed(() => currentTrack.value !== null)
  const hasPlaylist = computed(() => tracks.value.length > 0)
  const canPlayNext = computed(() => {
    if (!hasPlaylist.value) return false
    // Shuffle or repeat-all makes navigation wrap around the playlist
    if (isShuffle.value || repeatMode.value === 'all') return tracks.value.length > 1
    return currentTrackIndex.value < tracks.value.length - 1
  })
  const canPlayPrevious = computed(() => {
    if (!hasPlaylist.value) return false
    if (isShuffle.value || repeatMode.value === 'all') return tracks.value.length > 1
    return currentTrackIndex.value > 0
  })

  /**
   * Hängt einen Track an. Ist noch keiner gewählt, wird er der aktuelle.
   * @returns {boolean} true, wenn der Track zum aktuellen wurde
   */
  function addTrack(track) {
    tracks.value.push(track)
    if (currentTrackIndex.value === -1) {
      currentTrackIndex.value = 0
      return true
    }
    return false
  }

  /** Dateien (FileList oder Array) als Tracks anhängen. */
  function addFiles(files) {
    const newTracks = Array.from(files).map((file, index) =>
      createTrack(Date.now() + index, file.name, file, file, file.type)
    )
    newTracks.forEach(addTrack)
    return newTracks
  }

  /**
   * Entfernt einen Track und gibt seine URL frei.
   * @returns {{ removedCurrent: boolean, nextIndex: number }} removedCurrent:
   *   der aktuelle Track wurde entfernt (der Index ist dann -1); nextIndex: der
   *   Track, der an seine Stelle rücken sollte, oder -1
   */
  function removeTrack(index) {
    const track = tracks.value[index]
    if (track && track.url) {
      URL.revokeObjectURL(track.url)
    }

    tracks.value.splice(index, 1)
    shuffleHistory.value = []

    if (currentTrackIndex.value === index) {
      currentTrackIndex.value = -1
      const nextIndex = tracks.value.length > 0 ? Math.min(index, tracks.value.length - 1) : -1
      return { removedCurrent: true, nextIndex }
    }
    if (currentTrackIndex.value > index) {
      currentTrackIndex.value--
    }
    return { removedCurrent: false, nextIndex: currentTrackIndex.value }
  }

  function reorderTracks(fromIndex, toIndex) {
    if (fromIndex === toIndex) return
    tracks.value = moveItem(tracks.value, fromIndex, toIndex)
    currentTrackIndex.value = indexAfterMove(currentTrackIndex.value, fromIndex, toIndex)
  }

  function revokeAll() {
    tracks.value.forEach((track) => {
      if (track.url) URL.revokeObjectURL(track.url)
    })
  }

  /** Leert die Playlist und gibt alle URLs frei. */
  function clear() {
    revokeAll()
    tracks.value = []
    currentTrackIndex.value = -1
    shuffleHistory.value = []
  }

  // Navigation for the current playlist state
  function getNextIndex() {
    return nextIndexFor(
      tracks.value.length,
      currentTrackIndex.value,
      isShuffle.value,
      repeatMode.value
    )
  }

  function getPrevIndex() {
    return prevIndexFor(tracks.value.length, currentTrackIndex.value, repeatMode.value)
  }

  /** Merkt sich den aktuellen Index, damit "zurück" im Shuffle dorthin führt. */
  function rememberShuffleStep() {
    shuffleHistory.value.push(currentTrackIndex.value)
  }

  /** Letzter gemerkter Shuffle-Index oder -1, wenn es keinen gibt. */
  function popShuffleStep() {
    return shuffleHistory.value.length > 0 ? shuffleHistory.value.pop() : -1
  }

  function toggleShuffle() {
    isShuffle.value = !isShuffle.value
    shuffleHistory.value = []
    return isShuffle.value
  }

  function cycleRepeat() {
    repeatMode.value = nextRepeatMode(repeatMode.value)
    return repeatMode.value
  }

  // Revoke all Object URLs when the page is unloaded to free browser memory
  if (typeof window !== 'undefined') {
    window.addEventListener('pagehide', revokeAll)
  }

  return {
    // State
    tracks,
    currentTrackIndex,
    isShuffle,
    repeatMode,

    // Computed
    currentTrack,
    hasTrack,
    hasPlaylist,
    canPlayNext,
    canPlayPrevious,

    // Methods
    addTrack,
    addFiles,
    removeTrack,
    reorderTracks,
    clear,
    getNextIndex,
    getPrevIndex,
    rememberShuffleStep,
    popShuffleStep,
    toggleShuffle,
    cycleRepeat,
  }
})
