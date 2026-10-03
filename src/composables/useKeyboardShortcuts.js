import { onMounted, onUnmounted } from 'vue'

const SEEK_STEP = 5 // seconds
const VOLUME_STEP = 0.05

const TEXT_INPUT_TYPES = new Set(['text', 'search', 'email', 'url', 'number', 'password', 'tel'])

function isInputFocused() {
  const tag = document.activeElement?.tagName?.toLowerCase()
  return tag === 'input' || tag === 'textarea' || tag === 'select'
}

// Text fields own Ctrl+Z natively (undoing typed text); sliders, selects and
// buttons do not, so the app-wide undo/redo may act while they have focus.
function isTextEditingFocused() {
  const el = document.activeElement
  if (!el) return false
  if (el.isContentEditable) return true
  const tag = el.tagName?.toLowerCase()
  if (tag === 'textarea') return true
  return tag === 'input' && TEXT_INPUT_TYPES.has((el.type || 'text').toLowerCase())
}

/**
 * Undo/redo chords: Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z, Ctrl+Y.
 * Uses `key` (the printed letter), not `code`: on QWERTZ keyboards the key
 * labelled Z sits where US layouts have Y, and `code` would swap undo and redo.
 * Returns 'undo', 'redo' or null.
 */
export function historyActionForKey(e) {
  const mod = e.ctrlKey || e.metaKey
  if (!mod || e.altKey) return null
  const key = typeof e.key === 'string' ? e.key.toLowerCase() : ''
  if (key === 'z') return e.shiftKey ? 'redo' : 'undo'
  if (key === 'y' && !e.shiftKey) return 'redo'
  return null
}

/**
 * @param audioPlayer player composable (transport shortcuts)
 * @param {object} [options]
 * @param {{ undo: Function, redo: Function }} [options.history] processing history (undo/redo)
 */
export function useKeyboardShortcuts(audioPlayer, { history = null } = {}) {
  function onKeydown(e) {
    // Undo / redo first: they also work while a slider has focus
    const historyAction = history ? historyActionForKey(e) : null
    if (historyAction) {
      if (isTextEditingFocused()) return
      e.preventDefault()
      history[historyAction]()
      return
    }

    if (isInputFocused()) return

    const {
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
