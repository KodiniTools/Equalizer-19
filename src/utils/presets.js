export const EQ_PRESETS = {
  'Flat': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  'Rock': [-2, 0, 2, 4, 3, 1, -1, 0, 1, 2, 3, 4, 3, 2, 1, 0, -1, -2, -3],
  'Pop': [1, 2, 3, 2, 1, 0, -1, 0, 1, 2, 2, 1, 0, -1, -2, -1, 0, 1, 2],
  'Jazz': [2, 1, 0, -1, 0, 1, 2, 1, 0, -1, -2, -1, 0, 1, 2, 3, 2, 1, 0],
  'Classical': [3, 2, 1, 0, -1, -2, 0, 1, 2, 1, 0, -1, 0, 1, 2, 3, 2, 1, -1],
  'Electronic': [4, 3, 2, 1, 0, -1, -2, 0, 2, 4, 3, 2, 1, 3, 4, 3, 2, 1, 0],
  'Bass Boost': [8, 6, 4, 2, 1, 0, -1, -2, -1, 0, 1, 0, -1, -2, -1, 0, 1, 2, 1],
  'V-Shape': [4, 3, 2, 1, 0, -1, -2, -3, -2, -1, 0, 1, 2, 3, 4, 3, 2, 1, 0]
}

export const COMP_PRESETS = {
  // Basic Presets
  'Gentle': { th: -18, kn: 8, ra: 2, at: 10, re: 100 },
  'Medium': { th: -24, kn: 15, ra: 4, at: 5, re: 50 },
  'Heavy': { th: -30, kn: 20, ra: 8, at: 2, re: 25 },

  // Genre Presets
  'Rock': { th: -22, kn: 10, ra: 5, at: 5, re: 60 },
  'Pop': { th: -20, kn: 12, ra: 3.5, at: 8, re: 80 },
  'Electro': { th: -28, kn: 6, ra: 6, at: 1, re: 30 },
  'Jazz': { th: -16, kn: 15, ra: 2, at: 15, re: 120 },
  'Hip-Hop': { th: -26, kn: 8, ra: 5, at: 10, re: 40 },
  'Classical': { th: -14, kn: 20, ra: 1.5, at: 20, re: 150 },

  // Instrument/Voice Presets
  'Vocal': { th: -20, kn: 12, ra: 3, at: 8, re: 80 },
  'Drums': { th: -24, kn: 6, ra: 6, at: 2, re: 35 },
  'Bass': { th: -22, kn: 10, ra: 4, at: 12, re: 100 },
  'Podcast': { th: -18, kn: 14, ra: 3, at: 10, re: 90 },

  // Mastering Presets
  'Master': { th: -16, kn: 10, ra: 2.5, at: 3, re: 40 },
  'Limiter': { th: -6, kn: 0, ra: 20, at: 0.5, re: 10 }
}

export const EQ_FREQUENCIES = [
  25, 41, 65, 103, 164, 230, 413, 500, 657, 800,
  1000, 1600, 2700, 3000, 4200, 6600, 8000, 10500, 16700
]
