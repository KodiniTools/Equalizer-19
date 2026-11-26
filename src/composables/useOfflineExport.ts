import { ref } from 'vue'
import type { Track } from '../stores/playlist'
import {
  exportProcessedWav,
  FALLBACK_SAMPLE_RATE,
  OfflineExportError,
  type OfflineExportErrorCode,
  type OfflineSettings,
} from '../utils/offlineRender'
import { DEFAULT_DYNAMICS, type DynamicsKey, type DynamicsSettings } from '../utils/presets'
import { saveBlobAs } from '../utils/saveFile'
import { WAV_BIT_DEPTHS, type WavBitDepth } from '../utils/wavEncoder'
import { loadBitDepth, storeBitDepth } from '../utils/wavSettings'

/** The part of the audio engine store the export reads. */
export interface ExportEngine {
  audioContext: { sampleRate: number } | null
  eqBands: ReadonlyArray<{ frequency: number; gain: number; q: number }>
  eqBypass: boolean
  dynamics: DynamicsSettings
  dynamicsEnabled: boolean
  masterGain: number
}

export type OfflineExportResult =
  | { ok: true }
  /** `aborted`: the user dismissed the save dialog; `error`: why the export failed */
  | { ok: false; aborted?: boolean; error?: OfflineExportErrorCode | 'save' }

/** Snapshot of the current processing settings (plain values, safe to hand to a render). */
export function captureOfflineSettings(engine: ExportEngine): OfflineSettings {
  const dynamics = {} as DynamicsSettings
  for (const key of Object.keys(DEFAULT_DYNAMICS) as DynamicsKey[]) {
    dynamics[key] = engine.dynamics[key]
  }
  return {
    bands: engine.eqBands.map(({ frequency, gain, q }) => ({ frequency, gain, q })),
    eqBypass: !!engine.eqBypass,
    dynamics,
    dynamicsEnabled: !!engine.dynamicsEnabled,
    masterGain: engine.masterGain,
  }
}

async function readTrackBytes(track: Track): Promise<ArrayBuffer> {
  if (track.file) return track.file.arrayBuffer()
  const response = await fetch(track.url)
  return response.arrayBuffer()
}

/**
 * Offline export of a playlist track: the current EQ, compressor and master
 * gain settings are applied to the file faster than real time and the result
 * is saved as WAV. Playback and live recording are not touched.
 */
export function useOfflineExport(engine: ExportEngine) {
  const isExporting = ref(false)
  const bitDepth = ref<WavBitDepth>(loadBitDepth())

  /** Same stored depth as the recorder's WAV setting. */
  function setBitDepth(depth: number): void {
    if (isExporting.value) return
    if (!WAV_BIT_DEPTHS.includes(depth as WavBitDepth)) return
    bitDepth.value = depth as WavBitDepth
    storeBitDepth(bitDepth.value)
  }

  async function exportTrack(track: Track, filename: string): Promise<OfflineExportResult> {
    if (isExporting.value) return { ok: false }
    isExporting.value = true
    // The settings are fixed at the click: moving a slider during the render
    // does not change the file.
    const settings = captureOfflineSettings(engine)
    const depth = bitDepth.value
    let failure: OfflineExportErrorCode | null = null
    try {
      const result = await saveBlobAs(
        async () => {
          try {
            const data = await readTrackBytes(track).catch((error) => {
              throw new OfflineExportError('decode', error)
            })
            return await exportProcessedWav(data, {
              settings,
              bitDepth: depth,
              sampleRate: engine.audioContext?.sampleRate ?? FALLBACK_SAMPLE_RATE,
              knownDuration: track.duration,
            })
          } catch (error) {
            failure = error instanceof OfflineExportError ? error.code : 'render'
            if (!(error instanceof OfflineExportError) || error.code !== 'too-long') {
              console.error('Offline export failed:', error)
            }
            return null
          }
        },
        filename,
        'wav',
        'audio/wav'
      )
      if (result.ok) return { ok: true }
      if (result.aborted) return { ok: false, aborted: true }
      return { ok: false, error: failure ?? 'save' }
    } finally {
      isExporting.value = false
    }
  }

  return { isExporting, bitDepth, bitDepths: WAV_BIT_DEPTHS, setBitDepth, exportTrack }
}
