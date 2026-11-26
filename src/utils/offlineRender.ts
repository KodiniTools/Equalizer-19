import { processingChainOrder, connectProcessingChain, type ChainNode } from './audioChain'
import { DEFAULT_DYNAMICS, type DynamicsKey, type DynamicsSettings } from './presets'
import { audioBufferToWav, type WavBitDepth } from './wavEncoder'

/**
 * Offline export: runs a decoded audio file through the same processing chain
 * as live playback (19 peaking EQ filters → compressor → master gain), but in
 * an OfflineAudioContext, so it renders as fast as the device can compute and
 * nothing is played.
 */

/** Longest file the export accepts; decoded, rendered and encoded copies all sit in memory. */
export const MAX_EXPORT_SECONDS = 20 * 60

/** Sample rate used when no live audio context tells the device rate. */
export const FALLBACK_SAMPLE_RATE = 48000

/** The processing settings a render needs (a snapshot of the audio engine). */
export interface OfflineSettings {
  bands: ReadonlyArray<{ frequency: number; gain: number; q: number }>
  eqBypass: boolean
  dynamics: DynamicsSettings
  dynamicsEnabled: boolean
  masterGain: number
}

export type OfflineExportErrorCode = 'too-long' | 'decode' | 'render'

export class OfflineExportError extends Error {
  readonly code: OfflineExportErrorCode
  constructor(code: OfflineExportErrorCode, cause?: unknown) {
    super(`Offline export failed: ${code}`)
    this.name = 'OfflineExportError'
    this.code = code
    if (cause !== undefined) (this as { cause?: unknown }).cause = cause
  }
}

/** The part of OfflineAudioContext the render uses (tests pass a fake). */
export interface OfflineContextLike {
  readonly destination: ChainNode
  createBufferSource(): ChainNode & { buffer: AudioBuffer | null; start(when?: number): void }
  createBiquadFilter(): ChainNode & {
    type: BiquadFilterType
    frequency: { value: number }
    gain: { value: number }
    Q: { value: number }
  }
  createDynamicsCompressor(): ChainNode & Record<DynamicsKey, { value: number }>
  createGain(): ChainNode & { gain: { value: number } }
  startRendering(): Promise<AudioBuffer>
  decodeAudioData(data: ArrayBuffer): Promise<AudioBuffer>
}

export type OfflineContextFactory = (
  channels: number,
  length: number,
  sampleRate: number
) => OfflineContextLike

export const createOfflineContext: OfflineContextFactory = (channels, length, sampleRate) => {
  const w = window as Window & {
    webkitOfflineAudioContext?: typeof OfflineAudioContext
  }
  const Ctor = window.OfflineAudioContext || w.webkitOfflineAudioContext
  if (!Ctor) throw new Error('OfflineAudioContext is not available')
  return new Ctor(channels, length, sampleRate) as unknown as OfflineContextLike
}

/**
 * Decode an audio file at the given sample rate (decodeAudioData resamples to
 * the rate of the context it runs on, as the live path does).
 */
export async function decodeAudio(
  data: ArrayBuffer,
  sampleRate: number,
  createContext: OfflineContextFactory = createOfflineContext
): Promise<AudioBuffer> {
  try {
    return await createContext(1, 1, sampleRate).decodeAudioData(data)
  } catch (error) {
    throw new OfflineExportError('decode', error)
  }
}

/**
 * Run a decoded buffer through the processing chain and return the result.
 * Stereo or mono is kept; files with more channels are mixed down to stereo,
 * which is what the compressor does in the live chain as well.
 */
export async function renderProcessed(
  input: AudioBuffer,
  settings: OfflineSettings,
  createContext: OfflineContextFactory = createOfflineContext
): Promise<AudioBuffer> {
  try {
    const channels = Math.min(2, input.numberOfChannels)
    const ctx = createContext(channels, input.length, input.sampleRate)

    const source = ctx.createBufferSource()
    source.buffer = input

    const eqFilters = settings.bands.map((band) => {
      const filter = ctx.createBiquadFilter()
      filter.type = 'peaking'
      filter.frequency.value = band.frequency
      filter.gain.value = band.gain
      filter.Q.value = band.q
      return filter
    })

    const dynamicsNode = ctx.createDynamicsCompressor()
    for (const key of Object.keys(DEFAULT_DYNAMICS) as DynamicsKey[]) {
      dynamicsNode[key].value = settings.dynamics[key]
    }

    const gainNode = ctx.createGain()
    gainNode.gain.value = settings.masterGain

    // Same routing helper as the live engine: bypassed parts stay out of the chain
    const order = processingChainOrder<ChainNode>({
      source,
      eqFilters,
      dynamicsNode,
      gainNode,
      eqBypass: settings.eqBypass,
      dynamicsEnabled: settings.dynamicsEnabled,
    })
    connectProcessingChain(order)
    gainNode.connect(ctx.destination)

    source.start(0)
    return await ctx.startRendering()
  } catch (error) {
    throw new OfflineExportError('render', error)
  }
}

export interface OfflineExportOptions {
  settings: OfflineSettings
  bitDepth: WavBitDepth
  /** device sample rate (the live audio context's), default 48 kHz */
  sampleRate?: number
  /** known duration of the track in seconds, checked before decoding (0 = unknown) */
  knownDuration?: number
  maxSeconds?: number
  createContext?: OfflineContextFactory
}

/**
 * The whole export: decode → process → WAV.
 *
 * @throws OfflineExportError with code 'too-long', 'decode' or 'render'
 */
export async function exportProcessedWav(
  data: ArrayBuffer,
  {
    settings,
    bitDepth,
    sampleRate = FALLBACK_SAMPLE_RATE,
    knownDuration = 0,
    maxSeconds = MAX_EXPORT_SECONDS,
    createContext = createOfflineContext,
  }: OfflineExportOptions
): Promise<Blob> {
  if (knownDuration > maxSeconds) throw new OfflineExportError('too-long')
  const decoded = await decodeAudio(data, sampleRate, createContext)
  if (decoded.duration > maxSeconds) throw new OfflineExportError('too-long')
  const rendered = await renderProcessed(decoded, settings, createContext)
  return audioBufferToWav(rendered, bitDepth)
}
