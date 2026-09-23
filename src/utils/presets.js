/**
 * Center frequencies of the 19 EQ bands (Hz), logarithmically spaced in
 * roughly half-octave steps from 20 Hz to 20 kHz.
 * Single source of truth for the audio engine, the UI and the presets below.
 */
export const EQ_BAND_FREQUENCIES = [
  20, 30, 45, 63, 90, 135, 200, 300, 450, 630,
  900, 1350, 2000, 3000, 4500, 6300, 9000, 13500, 20000,
]

/**
 * Default Q (quality factor) of every EQ band. Matches the ~half-octave band
 * spacing above so adjacent bands overlap only moderately (Q ≈ 2.5 ≙ ~0.57 oct).
 */
export const EQ_BAND_Q = 2.5

/**
 * Default dynamics compressor settings (moderate, to prevent clipping).
 * attack / release in seconds.
 */
export const DEFAULT_DYNAMICS = Object.freeze({
  threshold: -30, // dB (higher = less compression)
  knee: 20, // dB (smoother transition)
  ratio: 4, // ratio (gentler compression)
  attack: 0.003, // seconds
  release: 0.25, // seconds
})

// Gains in dB, one value per band in EQ_BAND_FREQUENCIES:
//  20  30  45  63  90 135 200 300 450 630 900 1.35k 2k 3k 4.5k 6.3k 9k 13.5k 20k
export const EQ_PRESETS = {
  Flat:           [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  Rock:           [4, 4, 3, 2, 1, 0, -1, -1, -1, 0, 0, 1, 2, 3, 3, 3, 2, 2, 1],
  Pop:            [-1, 0, 1, 2, 2, 1, 0, 0, 1, 2, 2, 2, 2, 1, 1, 0, -1, -1, -1],
  Jazz:           [3, 3, 2, 1, 0, 0, -1, -1, 0, 0, 0, 1, 1, 2, 2, 2, 2, 1, 1],
  Classical:      [3, 3, 2, 1, 0, 0, 0, -1, -1, -1, 0, 0, 1, 2, 2, 3, 3, 3, 2],
  Electronic:     [5, 5, 4, 2, 0, -1, -2, -2, -1, 0, 1, 1, 2, 2, 3, 4, 4, 3, 2],
  Vocal:          [-3, -3, -2, -1, 0, 0, 1, 1, 2, 2, 2, 3, 3, 2, 2, 1, 0, -1, -2],
  'Bass Boost':   [8, 7, 6, 4, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  'Treble Boost': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 3, 4, 4, 4, 4],
  'V-Shape':      [5, 4, 3, 2, 1, 0, -1, -2, -3, -3, -2, -1, 0, 1, 2, 3, 4, 4, 3],
}

export const COMP_PRESETS = {
  // Basic
  Gentle:    { th: -18, kn: 8,  ra: 2,   at: 10, re: 100 },
  Medium:    { th: -24, kn: 15, ra: 4,   at: 5,  re: 50  },
  Heavy:     { th: -30, kn: 20, ra: 8,   at: 2,  re: 25  },

  // Genre
  Rock:      { th: -22, kn: 10, ra: 5,   at: 5,  re: 60  },
  Pop:       { th: -20, kn: 12, ra: 3.5, at: 8,  re: 80  },
  Electro:   { th: -28, kn: 6,  ra: 6,   at: 1,  re: 30  },
  Jazz:      { th: -16, kn: 15, ra: 2,   at: 15, re: 120 },
  'Hip-Hop': { th: -26, kn: 8,  ra: 5,   at: 10, re: 40  },
  Classical: { th: -14, kn: 20, ra: 1.5, at: 20, re: 150 },

  // Instrument / Voice
  Vocal:     { th: -20, kn: 12, ra: 3,   at: 8,  re: 80  },
  Drums:     { th: -24, kn: 6,  ra: 6,   at: 2,  re: 35  },
  Bass:      { th: -22, kn: 10, ra: 4,   at: 12, re: 100 },
  Podcast:   { th: -18, kn: 14, ra: 3,   at: 10, re: 90  },

  // Mastering
  Master:    { th: -16, kn: 10, ra: 2.5, at: 3,  re: 40  },
  Limiter:   { th: -6,  kn: 0,  ra: 20,  at: 0.5, re: 10 },
}

/**
 * Compressor preset groups (label = translation key) in display order.
 */
export const COMP_PRESET_GROUPS = [
  { labelKey: 'comp_cat_basic', presets: ['Gentle', 'Medium', 'Heavy'] },
  { labelKey: 'comp_cat_genre', presets: ['Rock', 'Pop', 'Electro', 'Jazz', 'Hip-Hop', 'Classical'] },
  { labelKey: 'comp_cat_instrument', presets: ['Vocal', 'Drums', 'Bass', 'Podcast'] },
  { labelKey: 'comp_cat_mastering', presets: ['Master', 'Limiter'] },
]

/**
 * Convert a COMP_PRESETS entry (attack / release in ms) to engine dynamics
 * settings (attack / release in seconds).
 */
export function compPresetToDynamics(preset) {
  return {
    threshold: preset.th,
    ratio: preset.ra,
    knee: preset.kn,
    attack: preset.at / 1000,
    release: preset.re / 1000,
  }
}

/**
 * Name of the compressor preset whose values equal the given dynamics
 * settings, or '' when they match none (e.g. after manual adjustments).
 */
export function findCompPreset(dynamics) {
  if (!dynamics) return ''
  const same = (a, b) => Math.abs(a - b) < 1e-9
  for (const [name, preset] of Object.entries(COMP_PRESETS)) {
    const target = compPresetToDynamics(preset)
    if (Object.keys(target).every((key) => same(target[key], dynamics[key]))) return name
  }
  return ''
}
