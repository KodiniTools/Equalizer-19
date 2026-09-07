/* global AudioWorkletProcessor, registerProcessor */
/**
 * PCM recorder AudioWorklet.
 *
 * Copies the raw Float32 samples that flow through the node and posts them to
 * the main thread in batches of BATCH_FRAMES frames per channel. Nothing is
 * encoded here, so the captured audio is bit-identical to the processing
 * chain's output (after EQ, compressor and master gain).
 *
 * Messages to the processor:  'stop'  → flush remaining samples, reply 'done'
 * Messages from the processor: { type: 'data', channels: Float32Array[] }
 *                              { type: 'done' }
 */
const BATCH_FRAMES = 4096

class PcmRecorderProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super()
    this._active = true
    this._fallbackChannels = Math.max(1, options?.processorOptions?.channelCount || 2)
    this._buffers = null
    this._filled = 0

    this.port.onmessage = (event) => {
      if (event.data === 'stop') {
        this._active = false
        this._flush()
        this.port.postMessage({ type: 'done' })
      }
    }
  }

  _allocate(channelCount) {
    this._buffers = Array.from({ length: channelCount }, () => new Float32Array(BATCH_FRAMES))
    this._filled = 0
  }

  _flush() {
    if (!this._buffers || this._filled === 0) return
    const channels = this._buffers.map((buf) => buf.slice(0, this._filled))
    this.port.postMessage(
      { type: 'data', channels },
      channels.map((c) => c.buffer)
    )
    this._allocate(this._buffers.length)
  }

  process(inputs) {
    if (!this._active) return false

    const input = inputs[0] || []
    // A connected but currently silent input may arrive with zero channels
    // (e.g. playback paused). Record silence so the timeline stays intact.
    const channelCount = input.length > 0 ? input.length : this._fallbackChannels
    const frames = input.length > 0 ? input[0].length : 128

    if (!this._buffers || this._buffers.length !== channelCount) {
      this._flush()
      this._allocate(channelCount)
    }

    let offset = 0
    while (offset < frames) {
      const n = Math.min(frames - offset, BATCH_FRAMES - this._filled)
      for (let ch = 0; ch < channelCount; ch++) {
        if (input.length > 0) {
          this._buffers[ch].set(input[ch].subarray(offset, offset + n), this._filled)
        } else {
          this._buffers[ch].fill(0, this._filled, this._filled + n)
        }
      }
      this._filled += n
      offset += n
      if (this._filled === BATCH_FRAMES) this._flush()
    }
    return true
  }
}

registerProcessor('pcm-recorder', PcmRecorderProcessor)
