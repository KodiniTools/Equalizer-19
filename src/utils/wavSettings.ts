import { WAV_BIT_DEPTHS, DEFAULT_WAV_BIT_DEPTH, type WavBitDepth } from './wavEncoder'

/** localStorage key of the WAV bit depth, shared by recording and offline export. */
export const BIT_DEPTH_STORAGE_KEY = 'eq19_wav_bit_depth'

/** The stored WAV bit depth, or the default when nothing valid is stored. */
export function loadBitDepth(): WavBitDepth {
  try {
    const stored = parseInt(localStorage.getItem(BIT_DEPTH_STORAGE_KEY) ?? '', 10)
    if (WAV_BIT_DEPTHS.includes(stored as WavBitDepth)) return stored as WavBitDepth
  } catch {
    // storage unavailable
  }
  return DEFAULT_WAV_BIT_DEPTH
}

export function storeBitDepth(depth: WavBitDepth): void {
  try {
    localStorage.setItem(BIT_DEPTH_STORAGE_KEY, String(depth))
  } catch {
    // storage unavailable
  }
}
