/**
 * WAV (RIFF) encoder for Float32 PCM data.
 *
 * Supported bit depths:
 *   16 → PCM integer (WAVE_FORMAT_PCM), CD quality
 *   24 → PCM integer (WAVE_FORMAT_PCM), studio quality
 *   32 → IEEE float (WAVE_FORMAT_IEEE_FLOAT), lossless copy of the Float32 samples
 */
export const WAV_BIT_DEPTHS = [16, 24, 32]
export const DEFAULT_WAV_BIT_DEPTH = 16

const FORMAT_PCM = 1
const FORMAT_IEEE_FLOAT = 3

function writeString(view, offset, str) {
  for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i))
}

/**
 * Encode a list of sample chunks into a WAV Blob.
 *
 * @param {Float32Array[][]} chunks   chunks[i][ch] = Float32Array of frames for channel ch.
 *                                    Chunks with fewer channels are up-mixed from channel 0.
 * @param {number} numChannels        channel count of the output file
 * @param {number} sampleRate         sample rate in Hz
 * @param {number} bitDepth           16 | 24 | 32
 * @returns {Blob}
 */
export function encodeWavFromChunks(
  chunks,
  numChannels,
  sampleRate,
  bitDepth = DEFAULT_WAV_BIT_DEPTH
) {
  if (!WAV_BIT_DEPTHS.includes(bitDepth)) {
    throw new Error(`Unsupported WAV bit depth: ${bitDepth}`)
  }
  if (!Number.isInteger(numChannels) || numChannels < 1) {
    throw new Error(`Invalid channel count: ${numChannels}`)
  }

  const isFloat = bitDepth === 32
  const formatTag = isFloat ? FORMAT_IEEE_FLOAT : FORMAT_PCM
  const bytesPerSample = bitDepth / 8
  const blockAlign = numChannels * bytesPerSample

  const totalFrames = chunks.reduce((sum, chunk) => sum + (chunk[0] ? chunk[0].length : 0), 0)
  const dataSize = totalFrames * blockAlign

  // fmt chunk: 16 bytes for PCM, 18 bytes (cbSize = 0) + a "fact" chunk for float
  const fmtSize = isFloat ? 18 : 16
  const factSize = isFloat ? 8 + 4 : 0
  const headerSize = 12 + (8 + fmtSize) + factSize + 8

  const buffer = new ArrayBuffer(headerSize + dataSize)
  const view = new DataView(buffer)
  let p = 0

  writeString(view, p, 'RIFF')
  p += 4
  view.setUint32(p, headerSize + dataSize - 8, true)
  p += 4
  writeString(view, p, 'WAVE')
  p += 4

  writeString(view, p, 'fmt ')
  p += 4
  view.setUint32(p, fmtSize, true)
  p += 4
  view.setUint16(p, formatTag, true)
  p += 2
  view.setUint16(p, numChannels, true)
  p += 2
  view.setUint32(p, sampleRate, true)
  p += 4
  view.setUint32(p, sampleRate * blockAlign, true)
  p += 4
  view.setUint16(p, blockAlign, true)
  p += 2
  view.setUint16(p, bitDepth, true)
  p += 2
  if (isFloat) {
    view.setUint16(p, 0, true)
    p += 2 // cbSize
    writeString(view, p, 'fact')
    p += 4
    view.setUint32(p, 4, true)
    p += 4
    view.setUint32(p, totalFrames, true)
    p += 4
  }

  writeString(view, p, 'data')
  p += 4
  view.setUint32(p, dataSize, true)
  p += 4

  for (const chunk of chunks) {
    const frames = chunk[0] ? chunk[0].length : 0
    for (let i = 0; i < frames; i++) {
      for (let ch = 0; ch < numChannels; ch++) {
        const samples = chunk[ch] || chunk[0]
        const s = samples[i]
        if (isFloat) {
          view.setFloat32(p, s, true)
        } else if (bitDepth === 24) {
          const v = Math.max(-8388608, Math.min(8388607, Math.round(s * 8388607)))
          view.setUint8(p, v & 0xff)
          view.setUint8(p + 1, (v >> 8) & 0xff)
          view.setUint8(p + 2, (v >> 16) & 0xff)
        } else {
          const c = Math.max(-1, Math.min(1, s))
          view.setInt16(p, c < 0 ? c * 0x8000 : c * 0x7fff, true)
        }
        p += bytesPerSample
      }
    }
  }

  return new Blob([buffer], { type: 'audio/wav' })
}

/**
 * Convenience wrapper for a decoded AudioBuffer.
 */
export function audioBufferToWav(audioBuffer, bitDepth = DEFAULT_WAV_BIT_DEPTH) {
  const channels = []
  for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) {
    channels.push(audioBuffer.getChannelData(ch))
  }
  return encodeWavFromChunks(
    [channels],
    audioBuffer.numberOfChannels,
    audioBuffer.sampleRate,
    bitDepth
  )
}
