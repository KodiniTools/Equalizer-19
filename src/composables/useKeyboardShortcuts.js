import { onMounted, onUnmounted } from 'vue'

const SEEK_STEP = 5 // seconds
const VOLUME_STEP = 0.05

function isInputFocused() {
  const tag = document.activeElement?.tagName?.toLowerCase()
  return tag === 'input' || tag === 'textarea' || tag === 'select'
}

export function useKeyboardShortcuts(audioPlayer) {
  function onKeydown(e) {
    if (isInputFocused()) return

    const {
      isPlaying,
      hasTrack,
      hasPlaylist,
      canPlayNext,
      canPlayPrevious,
      currentTime,
      duration,
      volume,
      togglePlayPause,
      seek,
      setVolume,
      toggleMute,
      playNext,
      playPrevious,
    } = audioPlayer

    switch (e.code) {
      case 'Space':
        if (!hasPlaylist.value) return
        e.preventDefault()
        togglePlayPause()
        break

      case 'ArrowLeft':
        if (!hasTrack.value) return
        e.preventDefault()
        seek(Math.max(0, currentTime.value - SEEK_STEP))
        break

      case 'ArrowRight':
        if (!hasTrack.value) return
        e.preventDefault()
        seek(Math.min(duration.value, currentTime.value + SEEK_STEP))
        break

      case 'ArrowUp':
        e.preventDefault()
        setVolume(Math.min(1, volume.value + VOLUME_STEP))
        break

      case 'ArrowDown':
        e.preventDefault()
        setVolume(Math.max(0, volume.value - VOLUME_STEP))
        break

      case 'KeyM':
        toggleMute()
        break

      case 'KeyN':
        if (canPlayNext.value) playNext()
        break

      case 'KeyP':
        if (canPlayPrevious.value) playPrevious()
        break
    }
  }

  onMounted(() => window.addEventListener('keydown', onKeydown))
  onUnmounted(() => window.removeEventListener('keydown', onKeydown))
}
