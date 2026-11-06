import { onMounted, onUnmounted } from 'vue'

const SEEK_STEP = 5 // seconds
const VOLUME_STEP = 0.05

const TEXT_INPUT_TYPES = new Set(['text', 'search', 'email', 'url', 'number', 'password', 'tel'])

export type HistoryAction = 'undo' | 'redo'

/** The part of the player store the shortcuts drive. */
export interface ShortcutPlayer {
  currentTime: number
  duration: number
  volume: number
  togglePlayPause(): void
  seek(time: number): void
  setVolume(value: number): void
  toggleMute(): void
  playNext(): void
  playPrevious(): void
}

/** The part of the playlist store the shortcuts read. */
export interface ShortcutPlaylist {
  hasPlaylist: boolean
  hasTrack: boolean
  canPlayNext: boolean
  canPlayPrevious: boolean
}

/** Processing history (undo/redo). */
export interface ShortcutHistory {
  undo(): unknown
  redo(): unknown
}

export interface KeyboardShortcutOptions {
  playlist: ShortcutPlaylist
  history?: ShortcutHistory | null
}

/** The key properties historyActionForKey() looks at (a KeyboardEvent or a test stub). */
export type KeyLike = Pick<KeyboardEvent, 'ctrlKey' | 'metaKey' | 'altKey' | 'shiftKey'> & {
  key?: unknown
}

function isInputFocused(): boolean {
  const tag = document.activeElement?.tagName?.toLowerCase()
  return tag === 'input' || tag === 'textarea' || tag === 'select'
}

// Text fields own Ctrl+Z natively (undoing typed text); sliders, selects and
// buttons do not, so the app-wide undo/redo may act while they have focus.
function isTextEditingFocused(): boolean {
  const el = document.activeElement as HTMLElement | null
  if (!el) return false
  if (el.isContentEditable) return true
  const tag = el.tagName?.toLowerCase()
  if (tag === 'textarea') return true
  return (
    tag === 'input' && TEXT_INPUT_TYPES.has(((el as HTMLInputElement).type || 'text').toLowerCase())
  )
}

/**
 * Undo/redo chords: Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z, Ctrl+Y.
 * Uses `key` (the printed letter), not `code`: on QWERTZ keyboards the key
 * labelled Z sits where US layouts have Y, and `code` would swap undo and redo.
 * Returns 'undo', 'redo' or null.
 */
export function historyActionForKey(e: KeyLike): HistoryAction | null {
  const mod = e.ctrlKey || e.metaKey
  if (!mod || e.altKey) return null
  const key = typeof e.key === 'string' ? e.key.toLowerCase() : ''
  if (key === 'z') return e.shiftKey ? 'redo' : 'undo'
  if (key === 'y' && !e.shiftKey) return 'redo'
  return null
}

/**
 * @param audioPlayer Player-Store (Transport, Position, Lautstärke)
 * @param options.playlist Playlist-Store (hasPlaylist, hasTrack, canPlayNext, canPlayPrevious)
 * @param options.history processing history (undo/redo)
 */
export function useKeyboardShortcuts(
  audioPlayer: ShortcutPlayer,
  { playlist, history = null }: KeyboardShortcutOptions
): void {
  function onKeydown(e: KeyboardEvent): void {
    // Undo / redo first: they also work while a slider has focus
    const historyAction = history ? historyActionForKey(e) : null
    if (historyAction && history) {
      if (isTextEditingFocused()) return
      e.preventDefault()
      history[historyAction]()
      return
    }

    if (isInputFocused()) return

    const { togglePlayPause, seek, setVolume, toggleMute, playNext, playPrevious } = audioPlayer

    switch (e.code) {
      case 'Space':
        if (!playlist.hasPlaylist) return
        e.preventDefault()
        togglePlayPause()
        break

      case 'ArrowLeft':
        if (!playlist.hasTrack) return
        e.preventDefault()
        seek(Math.max(0, audioPlayer.currentTime - SEEK_STEP))
        break

      case 'ArrowRight':
        if (!playlist.hasTrack) return
        e.preventDefault()
        seek(Math.min(audioPlayer.duration, audioPlayer.currentTime + SEEK_STEP))
        break

      case 'ArrowUp':
        e.preventDefault()
        setVolume(Math.min(1, audioPlayer.volume + VOLUME_STEP))
        break

      case 'ArrowDown':
        e.preventDefault()
        setVolume(Math.max(0, audioPlayer.volume - VOLUME_STEP))
        break

      case 'KeyM':
        toggleMute()
        break

      case 'KeyN':
        if (playlist.canPlayNext) playNext()
        break

      case 'KeyP':
        if (playlist.canPlayPrevious) playPrevious()
        break
    }
  }

  onMounted(() => window.addEventListener('keydown', onKeydown))
  onUnmounted(() => window.removeEventListener('keydown', onKeydown))
}
