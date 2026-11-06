import { ref, computed } from 'vue'
import {
  encodeWavFromChunks,
  WAV_BIT_DEPTHS,
  DEFAULT_WAV_BIT_DEPTH,
  type SampleChunk,
  type WavBitDepth,
} from '../utils/wavEncoder'
import { loadWorkletModule } from '../utils/workletLoader'

const PCM_WORKLET_URL = new URL('../worklets/pcm-recorder.worklet.js', import.meta.url)
const BIT_DEPTH_STORAGE_KEY = 'eq19_wav_bit_depth'
const SCRIPT_PROCESSOR_BUFFER = 4096
// Max. wait for the worklet module before recording falls back to ScriptProcessor
const WORKLET_LOAD_TIMEOUT_MS = 2000

export type RecordingFormat = 'wav' | 'webm'

/** The part of the audio engine store the recorder taps. */
export interface RecorderEngine {
  audioContext: AudioContext | null
  /** master gain; the recorder captures behind it */
  gainNode: AudioNode | null
}

/** Result of saveRecordingAs(). */
export interface SaveResult {
  ok: boolean
  /** the user dismissed the native save dialog */
  aborted?: boolean
}

interface PcmNodes {
  source: AudioNode
  capture: AudioNode & { port?: MessagePort }
  silent: GainNode
  stop: () => Promise<void>
}

/** Messages the pcm-recorder worklet posts back. */
type WorkletMessage = { type: 'data'; channels: Float32Array[] } | { type: 'done' }

/** File System Access API (not in lib.dom yet). */
interface SaveFilePickerOptions {
  suggestedName?: string
  types?: Array<{ description?: string; accept: Record<string, string[]> }>
}
type ShowSaveFilePicker = (options?: SaveFilePickerOptions) => Promise<FileSystemFileHandle>

function savePicker(): ShowSaveFilePicker | undefined {
  if (typeof window === 'undefined') return undefined
  const picker = (window as Window & { showSaveFilePicker?: ShowSaveFilePicker }).showSaveFilePicker
  return typeof picker === 'function' ? picker.bind(window) : undefined
}

/**
 * Output Recorder - Records processed audio from AudioEngine
 *
 * WAV:  raw Float32 PCM is captured behind the master gain via an AudioWorklet
 *       (ScriptProcessor fallback) and written as 16/24-bit PCM or 32-bit float.
 *       No lossy intermediate step.
 * WebM: MediaRecorder (Opus), as before.
 */
export function useOutputRecorder() {
  const isRecording = ref(false)
  const recordedChunks = ref<Blob[]>([]) // WebM blobs
  const mediaRecorder = ref<MediaRecorder | null>(null)
  const recordingFormat = ref<RecordingFormat>('webm')
  const bitDepth = ref<WavBitDepth>(loadBitDepth())
  const recordingTime = ref(0)
  const pcmFrames = ref(0) // recorded PCM frames (reactive counter only)

  let timerInterval: ReturnType<typeof setInterval> | null = null
  let audioEngineRef: RecorderEngine | null = null

  // --- PCM capture state (kept non-reactive: large typed arrays) ---
  let pcmChunks: SampleChunk[] = [] // chunk[ch] = Float32Array
  let pcmSampleRate = 0
  let pcmChannels = 0
  let pcmNodes: PcmNodes | null = null
  let wavCache: { bitDepth: WavBitDepth; blob: Blob } | null = null

  // --- WebM state ---
  let webmDestination: MediaStreamAudioDestinationNode | null = null

  const hasRecording = computed(() => recordedChunks.value.length > 0 || pcmFrames.value > 0)

  function loadBitDepth(): WavBitDepth {
    try {
      const stored = parseInt(localStorage.getItem(BIT_DEPTH_STORAGE_KEY) ?? '', 10)
      if (WAV_BIT_DEPTHS.includes(stored as WavBitDepth)) return stored as WavBitDepth
    } catch {
      // storage unavailable
    }
    return DEFAULT_WAV_BIT_DEPTH
  }

  function setAudioEngine(engine: RecorderEngine | null): void {
    audioEngineRef = engine
  }

  function resetBuffers(): void {
    recordedChunks.value = []
    pcmChunks = []
    pcmFrames.value = 0
    pcmChannels = 0
    wavCache = null
    recordingTime.value = 0
  }

  function pushPcmChunk(channels: Float32Array[] | undefined): void {
    if (!channels || channels.length === 0 || channels[0].length === 0) return
    pcmChunks.push(channels)
    pcmChannels = Math.max(pcmChannels, channels.length)
    pcmFrames.value += channels[0].length
  }

  // ---------------------------------------------------------------------------
  // WAV: PCM capture
  // ---------------------------------------------------------------------------
  async function startPcmCapture(
    audioContext: AudioContext,
    sourceNode: AudioNode
  ): Promise<boolean> {
    pcmSampleRate = audioContext.sampleRate
    const channelCount = Math.max(1, Math.min(2, audioContext.destination.channelCount || 2))

    // Silent sink keeps the capture node pulled by the graph without doubling the output
    const silent = audioContext.createGain()
    silent.gain.value = 0
    silent.connect(audioContext.destination)

    if (await loadWorkletModule(audioContext, PCM_WORKLET_URL, WORKLET_LOAD_TIMEOUT_MS)) {
      const capture = new AudioWorkletNode(audioContext, 'pcm-recorder', {
        numberOfInputs: 1,
        numberOfOutputs: 1,
        processorOptions: { channelCount },
      })

      let resolveDone: (() => void) | null = null
      capture.port.onmessage = (event: MessageEvent<WorkletMessage>) => {
        const msg = event.data
        if (msg?.type === 'data') pushPcmChunk(msg.channels)
        else if (msg?.type === 'done' && resolveDone) resolveDone()
      }

      sourceNode.connect(capture)
      capture.connect(silent)

      pcmNodes = {
        source: sourceNode,
        capture,
        silent,
        stop: () =>
          new Promise<void>((resolve) => {
            resolveDone = resolve
            capture.port.postMessage('stop')
            setTimeout(resolve, 1000) // safety net if the processor never answers
          }),
      }
      return true
    }

    // Fallback: deprecated ScriptProcessorNode (still supported everywhere)
    if (typeof audioContext.createScriptProcessor !== 'function') return false
    const capture = audioContext.createScriptProcessor(
      SCRIPT_PROCESSOR_BUFFER,
      channelCount,
      channelCount
    )
    let capturing = true
    capture.onaudioprocess = (event: AudioProcessingEvent) => {
      if (!capturing) return
      const channels: Float32Array[] = []
      for (let ch = 0; ch < event.inputBuffer.numberOfChannels; ch++) {
        channels.push(new Float32Array(event.inputBuffer.getChannelData(ch)))
      }
      pushPcmChunk(channels)
    }
    sourceNode.connect(capture)
    capture.connect(silent)
    pcmNodes = {
      source: sourceNode,
      capture,
      silent,
      stop: () => {
        capturing = false
        return Promise.resolve()
      },
    }
    return true
  }

  async function stopPcmCapture(): Promise<void> {
    if (!pcmNodes) return
    const nodes = pcmNodes
    pcmNodes = null
    await nodes.stop()
    try {
      nodes.source.disconnect(nodes.capture)
    } catch {
      // already disconnected
    }
    try {
      nodes.capture.disconnect()
      nodes.silent.disconnect()
    } catch {
      // ignore
    }
    if (nodes.capture.port) nodes.capture.port.onmessage = null
  }

  function buildWavBlob(): Blob | null {
    if (pcmChunks.length === 0) return null
    if (wavCache && wavCache.bitDepth === bitDepth.value) return wavCache.blob
    const blob = encodeWavFromChunks(pcmChunks, pcmChannels, pcmSampleRate, bitDepth.value)
    wavCache = { bitDepth: bitDepth.value, blob }
    return blob
  }

  // ---------------------------------------------------------------------------
  // WebM: MediaRecorder
  // ---------------------------------------------------------------------------
  function startWebmCapture(audioContext: AudioContext, sourceNode: AudioNode): boolean {
    const mimeType = 'audio/webm;codecs=opus'
    if (typeof MediaRecorder === 'undefined' || !MediaRecorder.isTypeSupported(mimeType))
      return false

    webmDestination = audioContext.createMediaStreamDestination()
    sourceNode.connect(webmDestination)

    const recorder = new MediaRecorder(webmDestination.stream, { mimeType })
    recorder.ondataavailable = (event: BlobEvent) => {
      if (event.data.size > 0) recordedChunks.value.push(event.data)
    }
    recorder.start(100)
    mediaRecorder.value = recorder
    return true
  }

  function stopWebmCapture(): void {
    if (mediaRecorder.value && mediaRecorder.value.state !== 'inactive') {
      mediaRecorder.value.stop()
    }
    mediaRecorder.value = null
    if (webmDestination) {
      try {
        audioEngineRef?.gainNode?.disconnect(webmDestination)
      } catch {
        // ignore
      }
      webmDestination = null
    }
  }

  // ---------------------------------------------------------------------------
  // Public recording API
  // ---------------------------------------------------------------------------
  async function startRecording(): Promise<boolean> {
    if (isRecording.value) return false
    if (!audioEngineRef?.audioContext || !audioEngineRef.gainNode) return false

    const audioContext = audioEngineRef.audioContext
    const sourceNode = audioEngineRef.gainNode

    try {
      if (audioContext.state === 'suspended') await audioContext.resume()
      resetBuffers()

      const started =
        recordingFormat.value === 'wav'
          ? await startPcmCapture(audioContext, sourceNode)
          : startWebmCapture(audioContext, sourceNode)
      if (!started) return false

      isRecording.value = true
      timerInterval = setInterval(() => {
        recordingTime.value++
      }, 1000)
      return true
    } catch (error) {
      console.error('Failed to start recording:', error)
      await stopPcmCapture()
      stopWebmCapture()
      return false
    }
  }

  async function stopRecording(): Promise<boolean> {
    if (!isRecording.value) return false
    isRecording.value = false

    if (timerInterval) {
      clearInterval(timerInterval)
      timerInterval = null
    }

    if (pcmNodes) await stopPcmCapture()
    else stopWebmCapture()
    return true
  }

  /**
   * Build the final export blob. Returns { blob, ext } or null when empty.
   */
  async function buildBlob(): Promise<{ blob: Blob; ext: RecordingFormat } | null> {
    if (pcmChunks.length > 0) {
      const blob = buildWavBlob()
      return blob ? { blob, ext: 'wav' } : null
    }
    if (recordedChunks.value.length === 0) return null
    return { blob: new Blob(recordedChunks.value, { type: 'audio/webm' }), ext: 'webm' }
  }

  /**
   * Remove characters that are invalid in file names and strip a redundant
   * audio extension the user may have typed.
   */
  function sanitizeFilename(name: unknown): string {
    return String(name || '')
      .replace(/[\\/:*?"<>|]+/g, '_')
      .replace(/\.(wav|webm)$/i, '')
      .replace(/\.+$/, '')
      .trim()
      .slice(0, 120)
  }

  const showSaveFilePicker = savePicker()
  const supportsFolderPicker = showSaveFilePicker !== undefined

  /**
   * Trigger a plain browser download to the default download folder.
   */
  function anchorDownload(blob: Blob, ext: string, filename: string): void {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.style.display = 'none'
    a.href = url
    a.download = `${filename}.${ext}`

    document.body.appendChild(a)
    a.click()

    setTimeout(() => {
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }, 100)
  }

  /**
   * Save the recording with a user-chosen file name. When the browser supports
   * the File System Access API, a native dialog lets the user pick the target
   * folder as well; otherwise it falls back to a normal download.
   *
   * Returns { ok, aborted } so callers can react to a cancelled dialog.
   */
  async function saveRecordingAs(filename = 'audio-export'): Promise<SaveResult> {
    if (!hasRecording.value) return { ok: false }

    const safeName = sanitizeFilename(filename) || 'audio-export'
    const ext: RecordingFormat = pcmChunks.length > 0 ? 'wav' : 'webm'
    const mime = ext === 'wav' ? 'audio/wav' : 'audio/webm'

    // Preferred path: native "Save As" dialog with folder selection.
    if (showSaveFilePicker) {
      let handle: FileSystemFileHandle | null = null
      try {
        // Request the handle first, while the click's user activation is fresh.
        handle = await showSaveFilePicker({
          suggestedName: `${safeName}.${ext}`,
          types: [
            {
              description: `${ext.toUpperCase()} Audio`,
              accept: { [mime]: [`.${ext}`] },
            },
          ],
        })
      } catch (error) {
        // User dismissed the picker — do not fall back to an unwanted download.
        if (error instanceof Error && error.name === 'AbortError')
          return { ok: false, aborted: true }
        console.warn('Save picker unavailable, falling back to download:', error)
      }

      if (handle) {
        try {
          const built = await buildBlob()
          if (!built) return { ok: false }
          const writable = await handle.createWritable()
          await writable.write(built.blob)
          await writable.close()
          return { ok: true }
        } catch (error) {
          console.error('Saving file failed:', error)
          return { ok: false }
        }
      }
    }

    // Fallback: standard download to the browser's default folder.
    const built = await buildBlob()
    if (!built) return { ok: false }

    try {
      anchorDownload(built.blob, built.ext, safeName)
      return { ok: true }
    } catch (error) {
      console.error('Download failed:', error)
      return { ok: false }
    }
  }

  function setFormat(format: string): void {
    if (isRecording.value) return
    if (format !== 'wav' && format !== 'webm') return
    recordingFormat.value = format
    resetBuffers()
  }

  /**
   * Select the WAV bit depth (16 | 24 | 32). Allowed while not recording;
   * an existing PCM recording is simply re-encoded at the new depth on save.
   */
  function setBitDepth(depth: number): void {
    if (isRecording.value) return
    if (!WAV_BIT_DEPTHS.includes(depth as WavBitDepth)) return
    bitDepth.value = depth as WavBitDepth
    try {
      localStorage.setItem(BIT_DEPTH_STORAGE_KEY, String(depth))
    } catch {
      // storage unavailable
    }
  }

  function discardRecording(): void {
    if (isRecording.value) return
    resetBuffers()
  }

  function cleanup(): void {
    if (timerInterval) {
      clearInterval(timerInterval)
      timerInterval = null
    }
    if (isRecording.value) {
      stopRecording()
    }
  }

  return {
    isRecording,
    recordingFormat,
    bitDepth,
    bitDepths: WAV_BIT_DEPTHS,
    hasRecording,
    recordingTime,
    setAudioEngine,
    startRecording,
    stopRecording,
    saveRecordingAs,
    supportsFolderPicker,
    setFormat,
    setBitDepth,
    discardRecording,
    cleanup,
  }
}
