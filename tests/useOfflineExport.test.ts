import { beforeEach, describe, expect, it, vi } from 'vitest'
import { reactive } from 'vue'
import { captureOfflineSettings, useOfflineExport } from '../src/composables/useOfflineExport'
import { OfflineExportError } from '../src/utils/offlineRender'
import { DEFAULT_DYNAMICS, EQ_BAND_FREQUENCIES, EQ_BAND_Q } from '../src/utils/presets'
import type { Track } from '../src/stores/playlist'

const exportProcessedWav = vi.fn()
const saveBlobAs = vi.fn()

vi.mock('../src/utils/offlineRender', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../src/utils/offlineRender')>()),
  exportProcessedWav: (...args: unknown[]) => exportProcessedWav(...args),
}))
vi.mock('../src/utils/saveFile', () => ({
  saveBlobAs: (...args: unknown[]) => saveBlobAs(...args),
}))

function makeEngine() {
  return reactive({
    audioContext: { sampleRate: 44100 },
    eqBands: EQ_BAND_FREQUENCIES.map((frequency) => ({ frequency, gain: 0, q: EQ_BAND_Q })),
    eqBypass: false,
    dynamics: { ...DEFAULT_DYNAMICS },
    dynamicsEnabled: true,
    masterGain: 0.7,
  })
}

const track = {
  id: 1,
  name: 'song.mp3',
  file: { arrayBuffer: async () => new ArrayBuffer(4) } as unknown as File,
  url: 'blob:x',
  size: 4,
  type: 'audio/mpeg',
  duration: 12,
} as Track

/** saveBlobAs stand-in that, like the real one, calls getBlob once and reports its result. */
function runGetBlob(): void {
  saveBlobAs.mockImplementation(async (getBlob: () => Promise<Blob | null>) => {
    const blob = await getBlob()
    return blob ? { ok: true } : { ok: false }
  })
}

describe('useOfflineExport', () => {
  beforeEach(() => {
    exportProcessedWav.mockReset()
    saveBlobAs.mockReset()
  })

  it('captureOfflineSettings copies plain values out of the engine', () => {
    const engine = makeEngine()
    engine.eqBands[2].gain = 4
    const settings = captureOfflineSettings(engine)
    engine.eqBands[2].gain = -9
    expect(settings.bands[2]).toEqual({ frequency: EQ_BAND_FREQUENCIES[2], gain: 4, q: EQ_BAND_Q })
    expect(settings.dynamics).toEqual(DEFAULT_DYNAMICS)
    expect(settings.masterGain).toBe(0.7)
  })

  it('renders with the settings of the click, the engine sample rate and the track duration', async () => {
    const engine = makeEngine()
    engine.eqBands[0].gain = 5
    exportProcessedWav.mockImplementation(async () => {
      // moving a slider while the render runs must not change the file
      engine.eqBands[0].gain = -12
      return new Blob(['x'])
    })
    runGetBlob()
    const { exportTrack, isExporting } = useOfflineExport(engine)
    const result = await exportTrack(track, 'out')

    expect(result).toEqual({ ok: true })
    expect(isExporting.value).toBe(false)
    const [data, options] = exportProcessedWav.mock.calls[0]
    expect(data).toBeInstanceOf(ArrayBuffer)
    expect(options.settings.bands[0].gain).toBe(5)
    expect(options.sampleRate).toBe(44100)
    expect(options.knownDuration).toBe(12)
    expect(saveBlobAs.mock.calls[0].slice(1)).toEqual(['out', 'wav', 'audio/wav'])
  })

  it('reports the error code of a failed render and resets the busy state', async () => {
    exportProcessedWav.mockRejectedValue(new OfflineExportError('too-long'))
    runGetBlob()
    const { exportTrack, isExporting } = useOfflineExport(makeEngine())
    expect(await exportTrack(track, 'out')).toEqual({ ok: false, error: 'too-long' })
    expect(isExporting.value).toBe(false)
  })

  it('maps unexpected failures to render and unreadable files to decode', async () => {
    runGetBlob()
    exportProcessedWav.mockRejectedValue(new Error('boom'))
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { exportTrack } = useOfflineExport(makeEngine())
    expect(await exportTrack(track, 'out')).toEqual({ ok: false, error: 'render' })

    const unreadable = {
      ...track,
      file: {
        arrayBuffer: async () => {
          throw new Error('gone')
        },
      } as unknown as File,
    } as Track
    expect(await exportTrack(unreadable, 'out')).toEqual({ ok: false, error: 'decode' })
    spy.mockRestore()
  })

  it('passes a dismissed save dialog on as aborted and ignores a second start while busy', async () => {
    saveBlobAs.mockResolvedValue({ ok: false, aborted: true })
    const { exportTrack } = useOfflineExport(makeEngine())
    expect(await exportTrack(track, 'out')).toEqual({ ok: false, aborted: true })

    let release: (value: { ok: boolean }) => void = () => {}
    saveBlobAs.mockReturnValue(new Promise((resolve) => (release = resolve)))
    const first = exportTrack(track, 'a')
    expect(await exportTrack(track, 'b')).toEqual({ ok: false })
    release({ ok: true })
    expect(await first).toEqual({ ok: true })
    expect(saveBlobAs).toHaveBeenCalledTimes(2)
  })
})
