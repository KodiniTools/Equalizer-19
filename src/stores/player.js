import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { formatTime } from '../utils/playbackOrder'
import { analyzeBlob, recordToBlob } from '../utils/audioBlob'
import { useAudioEngineStore } from './audioEngine.js'
import { usePlaylistStore, createTrack } from './playlist.js'

/**
 * Player: Wiedergabe (HTMLAudioElement), Position und Lautstärke. Hängt sich
 * über den Audio-Engine-Store in die Verarbeitungskette ein. Die Liste selbst
 * liegt im Playlist-Store; die Listenoperationen hier (addFiles, removeTrack,
 * clearPlaylist, handleSharedFiles) halten die Wiedergabe dazu konsistent.
 */
export const usePlayerStore = defineStore('player', () => {
  const playlist = usePlaylistStore()
  const audioEngineRef = useAudioEngineStore()

  // State
  const isPlaying = ref(false)
  const isPaused = ref(false)
  const currentTime = ref(0)
  const duration = ref(0)
  const volume = ref(0.8)
  const isMuted = ref(false)
  const isLoading = ref(false)
  const error = ref(null)

  // Audio Elements
  const audioElement = ref(null)
  let mediaElementSource = null
  let isSourceConnected = false
  // Set while an external source (live audio input) owns the processing chain:
  // the function that releases it again. Playback never steals the chain then.
  let externalSourceRelease = null

  // Computed
  const progress = computed(() => {
    if (duration.value === 0) return 0
    return (currentTime.value / duration.value) * 100
  })

  const formattedCurrentTime = computed(() => formatTime(currentTime.value))
  const formattedDuration = computed(() => formatTime(duration.value))

  // Initialize audio element
  function initAudio() {
    if (!audioElement.value) {
      audioElement.value = new Audio()
      audioElement.value.crossOrigin = 'anonymous'

      for (const [event, handler] of mediaEventHandlers) {
        audioElement.value.addEventListener(event, handler)
      }
    }
  }

  /**
   * Hand the processing chain to an external source (e.g. a live audio input).
   * Playback pauses; `release` is called when the user starts playback again.
   */
  function setExternalSource(release) {
    pause()
    externalSourceRelease = release
    isSourceConnected = false
  }

  /**
   * Called after the external source disconnected itself: reattach playback.
   */
  function clearExternalSource() {
    externalSourceRelease = null
    if (audioElement.value) connectToAudioEngine()
  }

  // Connect audio to processing chain
  function connectToAudioEngine() {
    if (externalSourceRelease) return false

    if (!audioEngineRef || !audioElement.value) {
      console.warn('⚠️ AudioEngine or Audio Element not available')
      return false
    }

    // Initialize AudioEngine if needed
    if (!audioEngineRef.isInitialized) {
      audioEngineRef.initAudioContext()
    }

    // Create MediaElementSource only once
    if (!mediaElementSource && audioEngineRef.audioContext) {
      try {
        mediaElementSource = audioEngineRef.audioContext.createMediaElementSource(
          audioElement.value
        )
      } catch (e) {
        console.error('❌ Failed to create MediaElementSource:', e)
        return false
      }
    }

    // Connect source to processing chain
    if (mediaElementSource && !isSourceConnected) {
      audioEngineRef.connectAudioSource(mediaElementSource)
      isSourceConnected = true
      return true
    } else if (isSourceConnected) {
      return true
    }

    return false
  }

  // Event handlers
  function handleLoadedMetadata() {
    duration.value = audioElement.value.duration || 0
    isLoading.value = false
  }

  function handleTimeUpdate() {
    currentTime.value = audioElement.value.currentTime || 0
  }

  function handleEnded() {
    isPlaying.value = false
    isPaused.value = false
    currentTime.value = 0

    // Repeat the current track
    if (playlist.repeatMode === 'one') {
      seek(0)
      play()
      return
    }

    // Otherwise advance to the next track (shuffle / repeat-all aware)
    const nextIndex = playlist.getNextIndex()
    if (nextIndex >= 0) {
      if (playlist.isShuffle) playlist.rememberShuffleStep()
      playTrack(nextIndex)
    }
  }

  function handleError(e) {
    console.error('Audio playback error:', e)
    error.value = 'Fehler beim Abspielen der Datei'
    isLoading.value = false
    isPlaying.value = false
  }

  function handleCanPlay() {
    isLoading.value = false
  }

  function handleWaiting() {
    isLoading.value = true
  }

  function handlePlaying() {
    isLoading.value = false
    isPlaying.value = true
  }

  // Media element events handled by the player (added in initAudio, removed in cleanup)
  const mediaEventHandlers = [
    ['loadedmetadata', handleLoadedMetadata],
    ['timeupdate', handleTimeUpdate],
    ['ended', handleEnded],
    ['error', handleError],
    ['canplay', handleCanPlay],
    ['waiting', handleWaiting],
    ['playing', handlePlaying],
  ]

  // Watch volume changes
  watch(volume, (newVolume) => {
    if (audioElement.value) {
      audioElement.value.volume = isMuted.value ? 0 : newVolume
    }
  })

  watch(isMuted, (muted) => {
    if (audioElement.value) {
      audioElement.value.volume = muted ? 0 : volume.value
    }
  })

  // ---- Playlist operations that touch playback ----
  function addFiles(files) {
    const hadTrack = playlist.hasTrack
    const newTracks = playlist.addFiles(files)

    // If no track was selected, the first new one is loaded
    if (!hadTrack && playlist.hasTrack) {
      loadTrack(0)
    }

    return newTracks
  }

  function removeTrack(index) {
    const { removedCurrent, nextIndex } = playlist.removeTrack(index)
    if (removedCurrent) {
      stop()
      if (nextIndex >= 0) loadTrack(nextIndex)
    }
  }

  function clearPlaylist() {
    stop()
    playlist.clear()
  }

  // Playback control
  async function loadTrack(index) {
    if (index < 0 || index >= playlist.tracks.length) {
      return false
    }

    initAudio()

    error.value = null
    isLoading.value = true
    playlist.currentTrackIndex = index

    try {
      const track = playlist.tracks[index]

      // Load new audio
      audioElement.value.src = track.url
      await audioElement.value.load()

      // Connect to AudioEngine
      connectToAudioEngine()

      return true
    } catch (err) {
      console.error('Error loading track:', err)
      error.value = 'Fehler beim Laden der Datei'
      isLoading.value = false
      return false
    }
  }

  async function play() {
    // Starting playback switches back from a live input to the playlist
    if (externalSourceRelease) {
      const release = externalSourceRelease
      externalSourceRelease = null
      release()
    }

    if (!audioElement.value || !playlist.hasTrack) {
      // If no track loaded, try to load first track
      if (playlist.hasPlaylist) {
        await loadTrack(0)
      } else {
        return
      }
    }

    initAudio()

    try {
      // Ensure AudioEngine connection
      connectToAudioEngine()

      // Resume audio context if suspended
      if (audioEngineRef && audioEngineRef.audioContext) {
        if (audioEngineRef.audioContext.state === 'suspended') {
          await audioEngineRef.audioContext.resume()
        }
      }

      await audioElement.value.play()
      isPlaying.value = true
      isPaused.value = false
      error.value = null
    } catch (err) {
      console.error('Error playing audio:', err)
      error.value = 'Fehler beim Abspielen'
      isPlaying.value = false
    }
  }

  function pause() {
    if (audioElement.value && isPlaying.value) {
      audioElement.value.pause()
      isPlaying.value = false
      isPaused.value = true
    }
  }

  function stop() {
    if (audioElement.value) {
      audioElement.value.pause()
      audioElement.value.currentTime = 0
      currentTime.value = 0
      isPlaying.value = false
      isPaused.value = false
    }
  }

  function togglePlayPause() {
    if (isPlaying.value) {
      pause()
    } else {
      play()
    }
  }

  async function playNext() {
    const nextIndex = playlist.getNextIndex()
    if (nextIndex < 0) return
    if (playlist.isShuffle) playlist.rememberShuffleStep()
    await playTrack(nextIndex)
  }

  async function playPrevious() {
    // If more than 3 seconds played, restart the current track
    if (currentTime.value > 3) {
      seek(0)
      return
    }

    let prevIndex
    if (playlist.isShuffle) {
      prevIndex = playlist.popShuffleStep()
      if (prevIndex < 0) prevIndex = playlist.getNextIndex()
    } else {
      prevIndex = playlist.getPrevIndex()
    }
    await playTrack(prevIndex)
  }

  async function playTrack(index) {
    const success = await loadTrack(index)
    if (success) await play()
  }

  // Seek
  function seek(time) {
    if (audioElement.value && duration.value > 0) {
      const seekTime = Math.max(0, Math.min(time, duration.value))
      audioElement.value.currentTime = seekTime
      currentTime.value = seekTime
    }
  }

  function seekToPercent(percent) {
    if (duration.value > 0) {
      const time = (percent / 100) * duration.value
      seek(time)
    }
  }

  // Volume
  function setVolume(val) {
    volume.value = Math.max(0, Math.min(1, val))
  }

  function toggleMute() {
    isMuted.value = !isMuted.value
  }

  // Handle shared files from IndexedDB (Audio Konverter handoff)
  async function handleSharedFiles(sharedRecords) {
    let processed = 0

    for (const record of sharedRecords) {
      const blob = recordToBlob(record)

      if (blob.size === 0) continue

      try {
        await analyzeBlob(blob, record.name)

        const track = createTrack(
          Date.now() + processed,
          record.name,
          blob,
          null,
          record.mimeType || blob.type || 'audio/wav'
        )

        const becameCurrent = playlist.addTrack(track)
        processed++

        if (becameCurrent) loadTrack(0)
      } catch (err) {
        console.error('Error processing shared file:', record.name, err)
      }
    }

    return { processed }
  }

  // Cleanup
  function cleanup() {
    if (audioElement.value) {
      audioElement.value.pause()
      for (const [event, handler] of mediaEventHandlers) {
        audioElement.value.removeEventListener(event, handler)
      }
      audioElement.value.src = ''
      audioElement.value = null
    }

    if (mediaElementSource) {
      try {
        mediaElementSource.disconnect()
      } catch {
        // Ignore
      }
      mediaElementSource = null
    }

    isSourceConnected = false
    clearPlaylist()
  }

  return {
    // State
    isPlaying,
    isPaused,
    isLoading,
    currentTime,
    duration,
    volume,
    isMuted,
    error,

    // Computed
    progress,
    formattedCurrentTime,
    formattedDuration,

    // Audio element
    audioElement,

    // Methods
    setExternalSource,
    clearExternalSource,
    initAudio,
    connectToAudioEngine,
    addFiles,
    removeTrack,
    clearPlaylist,
    loadTrack,
    play,
    pause,
    stop,
    togglePlayPause,
    playNext,
    playPrevious,
    playTrack,
    seek,
    seekToPercent,
    setVolume,
    toggleMute,
    handleSharedFiles,
    cleanup,
  }
})
