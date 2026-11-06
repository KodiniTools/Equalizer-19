/**
 * Helpers for audio handed over as Blobs (Audio Konverter → IndexedDB → Equalizer).
 */

/** A record as read from the shared IndexedDB store (see sharedFileRepository). */
export interface SharedFileRecord {
  name: string
  /** IndexedDB may hand back the raw data instead of a Blob. */
  blob: Blob | ArrayBuffer | ArrayBufferView
  mimeType?: string
}

export interface AudioBlobInfo {
  name: string
  duration: number
  sampleRate: number
  numberOfChannels: number
  length: number
}

/**
 * Normalize a shared-file record to a Blob (IndexedDB may return raw data).
 */
export function recordToBlob(record: SharedFileRecord): Blob {
  return record.blob instanceof Blob
    ? record.blob
    : new Blob([record.blob as BlobPart], { type: record.mimeType || 'audio/wav' })
}

/**
 * Decode a Blob via the Web Audio API to validate it and read its properties.
 * Rejects when the data is not decodable audio; the temporary context is
 * closed in either case.
 */
export async function analyzeBlob(blob: Blob, name: string): Promise<AudioBlobInfo> {
  const arrayBuffer = await blob.arrayBuffer()
  const AudioContextCtor =
    window.AudioContext ||
    (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  const audioContext = new AudioContextCtor()
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
