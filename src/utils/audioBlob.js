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
 * Rejects when the data is not decodable audio.
 */
export async function analyzeBlob(blob, name) {
  const arrayBuffer = await blob.arrayBuffer()
  const audioContext = new (window.AudioContext || window.webkitAudioContext)()
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
  audioContext.close()

  return {
    name: name,
    duration: audioBuffer.duration,
    sampleRate: audioBuffer.sampleRate,
    numberOfChannels: audioBuffer.numberOfChannels,
    length: audioBuffer.length,
  }
}
