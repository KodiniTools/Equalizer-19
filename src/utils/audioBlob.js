/**
 * Helpers for audio handed over as Blobs (Audio Konverter → IndexedDB → Equalizer).
 */

/**
 * Normalize a shared-file record to a Blob (IndexedDB may return raw data).
 */
export function recordToBlob(record) {
  return record.blob instanceof Blob
    ? record.blob
    : new Blob([record.blob], { type: record.mimeType || 'audio/wav' })
}

/**
 * Decode a Blob via the Web Audio API to validate it and read its properties.
 * Rejects when the data is not decodable audio; the temporary context is
 * closed in either case.
 */
export async function analyzeBlob(blob, name) {
  const arrayBuffer = await blob.arrayBuffer()
  const audioContext = new (window.AudioContext || window.webkitAudioContext)()
  try {
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
    return {
      name: name,
      duration: audioBuffer.duration,
      sampleRate: audioBuffer.sampleRate,
      numberOfChannels: audioBuffer.numberOfChannels,
      length: audioBuffer.length,
    }
  } finally {
    // Also release the context when decoding fails (browsers limit open contexts)
    audioContext.close()
  }
}
