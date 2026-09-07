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
