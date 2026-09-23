/**
 * Pure playlist navigation helpers (no Vue, no DOM) used by useAudioPlayer.
 *
 * repeat: 'off' | 'all' | 'one'
 */

export const REPEAT_MODES = ['off', 'all', 'one']

/**
 * Index of the next track, or -1 when playback should stop.
 * Shuffle picks a random track other than the current one.
 *
 * @param {number} length   playlist length
 * @param {number} current  current track index (-1 = none)
 * @param {boolean} shuffle
 * @param {string} repeat
 * @param {() => number} [random] random source in [0, 1), injectable for tests
 */
export function getNextIndex(length, current, shuffle, repeat, random = Math.random) {
  if (length === 0) return -1

  if (shuffle) {
    if (length === 1) return repeat === 'off' ? -1 : 0
    let idx
    do {
      idx = Math.floor(random() * length)
    } while (idx === current)
    return idx
  }

  const next = current + 1
  if (next < length) return next
  if (repeat === 'all') return 0
  return -1
}

/**
 * Index of the previous track in sequential order, or -1 at the start
 * (wraps to the last track with repeat 'all').
 */
export function getPrevIndex(length, current, repeat) {
  if (length === 0) return -1

  const prev = current - 1
  if (prev >= 0) return prev
  if (repeat === 'all') return length - 1
  return -1
}

/**
 * Next repeat mode in the cycle off → all → one → off.
 */
export function nextRepeatMode(mode) {
  const idx = REPEAT_MODES.indexOf(mode)
  return REPEAT_MODES[(idx + 1) % REPEAT_MODES.length]
}

/**
 * Return a copy of items with the element at fromIndex moved to toIndex.
 */
export function moveItem(items, fromIndex, toIndex) {
  const result = [...items]
  const [moved] = result.splice(fromIndex, 1)
  result.splice(toIndex, 0, moved)
  return result
}

/**
 * Where the current track ends up after moveItem(fromIndex, toIndex).
 */
export function indexAfterMove(current, fromIndex, toIndex) {
  if (current === fromIndex) return toIndex
  if (fromIndex < current && toIndex >= current) return current - 1
  if (fromIndex > current && toIndex <= current) return current + 1
  return current
}

/**
 * Format seconds as m:ss ('0:00' for NaN / Infinity).
 */
export function formatTime(seconds) {
  if (!isFinite(seconds) || isNaN(seconds)) {
    return '0:00'
  }

  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
