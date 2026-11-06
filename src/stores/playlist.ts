import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  getNextIndex as nextIndexFor,
  getPrevIndex as prevIndexFor,
  nextRepeatMode,
  moveItem,
  indexAfterMove,
  type RepeatMode,
} from '../utils/playbackOrder'

/** A playlist entry. */
export interface Track {
  id: number
  name: string
  /** the original File, or null for audio handed over as a Blob (shared files) */
  file: File | null
  /** Blob-URL, owned by the store and revoked when the track is removed */
  url: string
  size: number
  type: string
  duration: number
}

export interface RemoveResult {
  /** the current track was removed (the index is -1 then) */
  removedCurrent: boolean
  /** the track that should take its place, or -1 */
  nextIndex: number
}

/**
 * Track-Modell der Playlist. Die Blob-URL gehört dem Store und wird beim
 * Entfernen des Tracks wieder freigegeben.
 */
export function createTrack(
  id: number,
  name: string,
  blob: Blob,
  file: File | null,
  type: string
): Track {
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
 * Kennt keine Wiedergabe – der Player-Store (stores/player.ts) lädt und
 * spielt Tracks und ruft hier nur die reinen Listenoperationen auf.
 */
export const usePlaylistStore = defineStore('playlist', () => {
  const tracks = ref<Track[]>([])
  const currentTrackIndex = ref(-1)

  // Playback modes
  const isShuffle = ref(false)
  const repeatMode = ref<RepeatMode>('off')
  const shuffleHistory = ref<number[]>([]) // visited indices, for shuffle "previous"

  const currentTrack = computed<Track | null>(() => {
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
   * @returns true, wenn der Track zum aktuellen wurde
   */
  function addTrack(track: Track): boolean {
    tracks.value.push(track)
    if (currentTrackIndex.value === -1) {
      currentTrackIndex.value = 0
      return true
    }
    return false
  }

  /** Dateien (FileList oder Array) als Tracks anhängen. */
  function addFiles(files: Iterable<File> | ArrayLike<File>): Track[] {
    const newTracks = Array.from(files).map((file, index) =>
      createTrack(Date.now() + index, file.name, file, file, file.type)
    )
    newTracks.forEach(addTrack)
    return newTracks
  }

  /** Entfernt einen Track und gibt seine URL frei. */
  function removeTrack(index: number): RemoveResult {
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

  function reorderTracks(fromIndex: number, toIndex: number): void {
    if (fromIndex === toIndex) return
    tracks.value = moveItem(tracks.value, fromIndex, toIndex)
    currentTrackIndex.value = indexAfterMove(currentTrackIndex.value, fromIndex, toIndex)
  }

  function revokeAll(): void {
    tracks.value.forEach((track) => {
      if (track.url) URL.revokeObjectURL(track.url)
    })
  }

  /** Leert die Playlist und gibt alle URLs frei. */
  function clear(): void {
    revokeAll()
    tracks.value = []
    currentTrackIndex.value = -1
    shuffleHistory.value = []
  }

  // Navigation for the current playlist state
  function getNextIndex(): number {
    return nextIndexFor(
      tracks.value.length,
      currentTrackIndex.value,
      isShuffle.value,
      repeatMode.value
    )
  }

  function getPrevIndex(): number {
    return prevIndexFor(tracks.value.length, currentTrackIndex.value, repeatMode.value)
  }

  /** Merkt sich den aktuellen Index, damit "zurück" im Shuffle dorthin führt. */
  function rememberShuffleStep(): void {
    shuffleHistory.value.push(currentTrackIndex.value)
  }

  /** Letzter gemerkter Shuffle-Index oder -1, wenn es keinen gibt. */
  function popShuffleStep(): number {
    return shuffleHistory.value.length > 0 ? (shuffleHistory.value.pop() ?? -1) : -1
  }

  function toggleShuffle(): boolean {
    isShuffle.value = !isShuffle.value
    shuffleHistory.value = []
    return isShuffle.value
  }

  function cycleRepeat(): RepeatMode {
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
