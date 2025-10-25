import { ref, computed, watch } from 'vue'

export function useAudioPlayer() {
  // State
  const playlist = ref([])
  const currentTrackIndex = ref(-1)
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
  let audioEngineRef = null
  let mediaElementSource = null
  let isSourceConnected = false

  // Computed
  const currentTrack = computed(() => {
    if (currentTrackIndex.value >= 0 && currentTrackIndex.value < playlist.value.length) {
      return playlist.value[currentTrackIndex.value]
    }
    return null
  })

  const hasTrack = computed(() => currentTrack.value !== null)
  const hasPlaylist = computed(() => playlist.value.length > 0)
  const canPlayNext = computed(() => currentTrackIndex.value < playlist.value.length - 1)
  const canPlayPrevious = computed(() => currentTrackIndex.value > 0)

  const progress = computed(() => {
    if (duration.value === 0) return 0
    return (currentTime.value / duration.value) * 100
  })

  const formattedCurrentTime = computed(() => formatTime(currentTime.value))
  const formattedDuration = computed(() => formatTime(duration.value))

  // Set audio engine reference
  function setAudioEngine(engine) {
    audioEngineRef = engine
    console.log('✅ AudioEngine reference set in AudioPlayer')
  }

  // Initialize audio element
  function initAudio() {
    if (!audioElement.value) {
      audioElement.value = new Audio()
      audioElement.value.crossOrigin = 'anonymous'
      
      // Event listeners
      audioElement.value.addEventListener('loadedmetadata', handleLoadedMetadata)
      audioElement.value.addEventListener('timeupdate', handleTimeUpdate)
      audioElement.value.addEventListener('ended', handleEnded)
      audioElement.value.addEventListener('error', handleError)
      audioElement.value.addEventListener('canplay', handleCanPlay)
      audioElement.value.addEventListener('waiting', handleWaiting)
      audioElement.value.addEventListener('playing', handlePlaying)
      
      console.log('✅ Audio element initialized')
    }
  }

  // Connect audio to processing chain
  function connectToAudioEngine() {
    if (!audioEngineRef || !audioElement.value) {
      console.warn('⚠️ AudioEngine or Audio Element not available')
      console.log('   AudioEngine:', !!audioEngineRef)
      console.log('   AudioElement:', !!audioElement.value)
      return false
    }

    // Initialize AudioEngine if needed
    if (!audioEngineRef.isInitialized.value) {
      console.log('🎛️ Initializing AudioEngine...')
      audioEngineRef.initAudioContext()
    }

    // Create MediaElementSource only once
    if (!mediaElementSource && audioEngineRef.audioContext.value) {
      try {
        console.log('🎵 Creating MediaElementSource from audio element...')
        mediaElementSource = audioEngineRef.audioContext.value.createMediaElementSource(audioElement.value)
        console.log('✅ MediaElementSource created:', mediaElementSource)
      } catch (e) {
        console.error('❌ Failed to create MediaElementSource:', e)
        return false
      }
    }

    // Connect source to processing chain
    if (mediaElementSource && !isSourceConnected) {
      console.log('🔗 Connecting MediaElementSource to processing chain...')
      audioEngineRef.connectAudioSource(mediaElementSource)
      isSourceConnected = true
      console.log('✅ Audio connected to processing chain (EQ + Dynamics active)')
      return true
    } else if (isSourceConnected) {
      console.log('ℹ️ Audio already connected')
      return true
    }

    return false
  }

  // Event handlers
  function handleLoadedMetadata() {
    duration.value = audioElement.value.duration || 0
    isLoading.value = false
    console.log('✅ Track loaded, duration:', duration.value)
  }

  function handleTimeUpdate() {
    currentTime.value = audioElement.value.currentTime || 0
  }

  function handleEnded() {
    isPlaying.value = false
    isPaused.value = false
    currentTime.value = 0
    
    // Auto-play next track if available
    if (canPlayNext.value) {
      playNext()
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

  // Playlist management
  function addFiles(files) {
    const newTracks = Array.from(files).map((file, index) => ({
      id: Date.now() + index,
      name: file.name,
      file: file,
      url: URL.createObjectURL(file),
      size: file.size,
      type: file.type,
      duration: 0
    }))

    playlist.value.push(...newTracks)

    // If no track is selected, select the first one
    if (currentTrackIndex.value === -1 && playlist.value.length > 0) {
      currentTrackIndex.value = 0
      loadTrack(0)
    }

    return newTracks
  }

  function removeTrack(index) {
    const track = playlist.value[index]
    if (track && track.url) {
      URL.revokeObjectURL(track.url)
    }

    playlist.value.splice(index, 1)

    // Adjust current index if needed
    if (currentTrackIndex.value === index) {
      stop()
      currentTrackIndex.value = -1
      if (playlist.value.length > 0) {
        const newIndex = Math.min(index, playlist.value.length - 1)
        loadTrack(newIndex)
      }
    } else if (currentTrackIndex.value > index) {
      currentTrackIndex.value--
    }
  }

  function clearPlaylist() {
    // Clean up URLs
    playlist.value.forEach(track => {
      if (track.url) {
        URL.revokeObjectURL(track.url)
      }
    })

    stop()
    playlist.value = []
    currentTrackIndex.value = -1
  }

  // Playback control
  async function loadTrack(index) {
    if (index < 0 || index >= playlist.value.length) {
      return false
    }

    initAudio()
    
    error.value = null
    isLoading.value = true
    currentTrackIndex.value = index

    try {
      const track = playlist.value[index]
      
      // Load new audio
      audioElement.value.src = track.url
      await audioElement.value.load()

      // Connect to AudioEngine
      connectToAudioEngine()

      console.log('✅ Track loaded:', track.name)
      return true
    } catch (err) {
      console.error('Error loading track:', err)
      error.value = 'Fehler beim Laden der Datei'
      isLoading.value = false
      return false
    }
  }

  async function play() {
    if (!audioElement.value || !hasTrack.value) {
      // If no track loaded, try to load first track
      if (playlist.value.length > 0) {
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
      if (audioEngineRef && audioEngineRef.audioContext.value) {
        if (audioEngineRef.audioContext.value.state === 'suspended') {
          await audioEngineRef.audioContext.value.resume()
          console.log('✅ AudioContext resumed')
        }
      }

      await audioElement.value.play()
      isPlaying.value = true
      isPaused.value = false
      error.value = null
      console.log('✅ Playing:', currentTrack.value?.name)
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
      console.log('⏸️ Paused')
    }
  }

  function stop() {
    if (audioElement.value) {
      audioElement.value.pause()
      audioElement.value.currentTime = 0
      currentTime.value = 0
      isPlaying.value = false
      isPaused.value = false
      console.log('⏹️ Stopped')
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
    if (canPlayNext.value) {
      const success = await loadTrack(currentTrackIndex.value + 1)
      if (success) {
        await play()
      }
    }
  }

  async function playPrevious() {
    if (currentTime.value > 3) {
      // If more than 3 seconds played, restart current track
      seek(0)
    } else if (canPlayPrevious.value) {
      const success = await loadTrack(currentTrackIndex.value - 1)
      if (success) {
        await play()
      }
    }
  }

  async function playTrack(index) {
    const success = await loadTrack(index)
    if (success) {
      await play()
    }
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

  // Utility
  function formatTime(seconds) {
    if (!isFinite(seconds) || isNaN(seconds)) {
      return '0:00'
    }
    
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Cleanup
  function cleanup() {
    if (audioElement.value) {
      audioElement.value.pause()
      audioElement.value.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audioElement.value.removeEventListener('timeupdate', handleTimeUpdate)
      audioElement.value.removeEventListener('ended', handleEnded)
      audioElement.value.removeEventListener('error', handleError)
      audioElement.value.removeEventListener('canplay', handleCanPlay)
      audioElement.value.removeEventListener('waiting', handleWaiting)
      audioElement.value.removeEventListener('playing', handlePlaying)
      audioElement.value.src = ''
      audioElement.value = null
    }

    if (mediaElementSource) {
      try {
        mediaElementSource.disconnect()
      } catch (e) {
        // Ignore
      }
      mediaElementSource = null
    }

    isSourceConnected = false
    clearPlaylist()
  }

  return {
    // State
    playlist,
    currentTrackIndex,
    currentTrack,
    isPlaying,
    isPaused,
    isLoading,
    currentTime,
    duration,
    volume,
    isMuted,
    error,
    
    // Computed
    hasTrack,
    hasPlaylist,
    canPlayNext,
    canPlayPrevious,
    progress,
    formattedCurrentTime,
    formattedDuration,
    
    // Audio element
    audioElement,
    
    // Methods
    setAudioEngine,
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
    cleanup
  }
}
