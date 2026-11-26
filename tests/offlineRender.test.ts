import { describe, expect, it } from 'vitest'
import {
  exportProcessedWav,
  OfflineExportError,
  renderProcessed,
  type OfflineContextLike,
  type OfflineSettings,
} from '../src/utils/offlineRender'
import { DEFAULT_DYNAMICS, EQ_BAND_FREQUENCIES, EQ_BAND_Q } from '../src/utils/presets'

/** Records the wiring so the tests can follow the signal path. */
class FakeNode {
  readonly outputs: FakeNode[] = []
  constructor(readonly kind: string) {}
  connect(dest: FakeNode): FakeNode {
    this.outputs.push(dest)
    return dest
  }
  disconnect(): void {
    this.outputs.length = 0
  }
}

function fakeBuffer(channels: number, frames: number, rate = 48000): AudioBuffer {
  const data = Array.from({ length: channels }, () => new Float32Array(frames).fill(0.25))
  return {
    numberOfChannels: channels,
    length: frames,
    sampleRate: rate,
    duration: frames / rate,
    getChannelData: (ch: number) => data[ch],
  } as unknown as AudioBuffer
}

function makeFactory(decoded: AudioBuffer = fakeBuffer(2, 480)) {
  const created: {
    source?: FakeNode & { buffer: unknown }
    filters: FakeNode[]
    dynamics?: FakeNode
    gain?: FakeNode
    log: unknown[]
  } = { filters: [], log: [] }
  const factory = (channels: number, length: number, sampleRate: number): OfflineContextLike => {
    created.log.push({ channels, length, sampleRate })
    const destination = new FakeNode('destination')
    const dynamics = new FakeNode('dynamics') as FakeNode &
      Record<keyof typeof DEFAULT_DYNAMICS, { value: number }>
    for (const key of Object.keys(DEFAULT_DYNAMICS)) {
      ;(dynamics as unknown as Record<string, { value: number }>)[key] = { value: NaN }
    }
    created.dynamics = dynamics
    return {
      destination,
      createBufferSource: () => {
        const n = Object.assign(new FakeNode('source'), { buffer: null as unknown, start() {} })
        created.source = n
        return n
      },
      createBiquadFilter: () => {
        const n = Object.assign(new FakeNode('filter'), {
          type: 'lowpass',
          frequency: { value: 0 },
          gain: { value: 0 },
          Q: { value: 0 },
        })
        created.filters.push(n)
        return n
      },
      createDynamicsCompressor: () => dynamics,
      createGain: () => {
        const n = Object.assign(new FakeNode('gain'), { gain: { value: 1 } })
        created.gain = n
        return n
      },
      startRendering: async () => fakeBuffer(channels, length, sampleRate),
      decodeAudioData: async () => decoded,
    } as unknown as OfflineContextLike
  }
  return { factory, created }
}

const settings = (patch: Partial<OfflineSettings> = {}): OfflineSettings => ({
  bands: EQ_BAND_FREQUENCIES.map((frequency, i) => ({
    frequency,
    gain: i === 3 ? 6 : 0,
    q: EQ_BAND_Q,
  })),
  eqBypass: false,
  dynamics: { ...DEFAULT_DYNAMICS, threshold: -18 },
  dynamicsEnabled: true,
  masterGain: 0.5,
  ...patch,
})

/** Kinds along the path from the source to the destination. */
function path(source: FakeNode): string[] {
  const kinds: string[] = []
  let node: FakeNode | undefined = source
  while (node) {
    kinds.push(node.kind)
    node = node.outputs[0]
  }
  return kinds
}

describe('offlineRender', () => {
  it('routes source → 19 EQ filters → compressor → master gain → destination', async () => {
    const { factory, created } = makeFactory()
    await renderProcessed(fakeBuffer(2, 480), settings(), factory)
    expect(path(created.source!)).toEqual([
      'source',
      ...Array(19).fill('filter'),
      'dynamics',
      'gain',
      'destination',
    ])
    expect(created.filters).toHaveLength(19)
  })

  it('applies band, compressor and master gain values to the nodes', async () => {
    const { factory, created } = makeFactory()
    await renderProcessed(fakeBuffer(2, 480), settings(), factory)
    const f = created.filters[3] as unknown as {
      type: string
      frequency: { value: number }
      gain: { value: number }
      Q: { value: number }
    }
    expect(f.type).toBe('peaking')
    expect(f.frequency.value).toBe(EQ_BAND_FREQUENCIES[3])
    expect(f.gain.value).toBe(6)
    expect(f.Q.value).toBe(EQ_BAND_Q)
    const dyn = created.dynamics as unknown as Record<string, { value: number }>
    expect(dyn.threshold.value).toBe(-18)
    expect(dyn.ratio.value).toBe(DEFAULT_DYNAMICS.ratio)
    expect((created.gain as unknown as { gain: { value: number } }).gain.value).toBe(0.5)
  })

  it('leaves out bypassed EQ and compressor, like the live chain', async () => {
    const { factory, created } = makeFactory()
    await renderProcessed(
      fakeBuffer(2, 480),
      settings({ eqBypass: true, dynamicsEnabled: false }),
      factory
    )
    expect(path(created.source!)).toEqual(['source', 'gain', 'destination'])
  })

  it('keeps mono, mixes more than two channels down to stereo, and keeps length and rate', async () => {
    const mono = makeFactory()
    await renderProcessed(fakeBuffer(1, 1000, 44100), settings(), mono.factory)
    expect(mono.created.log[0]).toEqual({ channels: 1, length: 1000, sampleRate: 44100 })
    const surround = makeFactory()
    await renderProcessed(fakeBuffer(6, 1000), settings(), surround.factory)
    expect(surround.created.log[0]).toMatchObject({ channels: 2, length: 1000 })
  })

  it('exports a WAV of the rendered length at the chosen bit depth', async () => {
    const { factory } = makeFactory(fakeBuffer(2, 480))
    const blob = await exportProcessedWav(new ArrayBuffer(8), {
      settings: settings(),
      bitDepth: 24,
      createContext: factory,
    })
    // 44-byte header + 480 frames × 2 channels × 3 bytes
    expect(blob.type).toBe('audio/wav')
    expect(blob.size).toBe(44 + 480 * 2 * 3)
  })

  it('refuses files that are too long, before and after decoding', async () => {
    const { factory } = makeFactory(fakeBuffer(2, 48000 * 3))
    await expect(
      exportProcessedWav(new ArrayBuffer(8), {
        settings: settings(),
        bitDepth: 16,
        knownDuration: 100,
        maxSeconds: 10,
        createContext: factory,
      })
    ).rejects.toMatchObject({ code: 'too-long' })
    await expect(
      exportProcessedWav(new ArrayBuffer(8), {
        settings: settings(),
        bitDepth: 16,
        maxSeconds: 2,
        createContext: factory,
      })
    ).rejects.toMatchObject({ code: 'too-long' })
  })

  it('reports unreadable files and render failures with their own codes', async () => {
    const decodeFails = (): OfflineContextLike =>
      ({
        decodeAudioData: async () => {
          throw new Error('bad data')
        },
      }) as unknown as OfflineContextLike
    await expect(
      exportProcessedWav(new ArrayBuffer(8), {
        settings: settings(),
        bitDepth: 16,
        createContext: decodeFails,
      })
    ).rejects.toMatchObject({ code: 'decode' })

    const renderFails = (): OfflineContextLike => {
      throw new Error('no OfflineAudioContext')
    }
    const error = await renderProcessed(fakeBuffer(2, 10), settings(), renderFails).catch((e) => e)
    expect(error).toBeInstanceOf(OfflineExportError)
    expect(error.code).toBe('render')
  })
})
