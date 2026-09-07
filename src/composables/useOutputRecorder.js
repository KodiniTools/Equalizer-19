import { ref, computed } from 'vue'
import { encodeWavFromChunks, WAV_BIT_DEPTHS, DEFAULT_WAV_BIT_DEPTH } from '../utils/wavEncoder.js'

const PCM_WORKLET_URL = new URL('../worklets/pcm-recorder.worklet.js', import.meta.url)
const BIT_DEPTH_STORAGE_KEY = 'eq19_wav_bit_depth'
const SCRIPT_PROCESSOR_BUFFER = 4096

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
  const recordedChunks = ref([]) // WebM blobs
  const mediaRecorder = ref(null)
  const recordingFormat = ref('webm')
  const bitDepth = ref(loadBitDepth())
  const recordingTime = ref(0)
  const pcmFrames = ref(0) // recorded PCM frames (reactive counter only)

  let timerInterval = null
  let audioEngineRef = null

  // --- PCM capture state (kept non-reactive: large typed arrays) ---
  let pcmChunks = [] // Float32Array[][]  → chunk[ch]
  let pcmSampleRate = 0
  let pcmChannels = 0
  let pcmNodes = null // { source, capture, silent, stop: () => Promise }
  let wavCache = null // { bitDepth, blob }

  // --- WebM state ---
  let webmDestination = null

  const hasRecording = computed(() => recordedChunks.value.length > 0 || pcmFrames.value > 0)

  function loadBitDepth() {
    try {
      const stored = parseInt(localStorage.getItem(BIT_DEPTH_STORAGE_KEY), 10)
      if (WAV_BIT_DEPTHS.includes(stored)) return stored
    } catch (_e) {
      // storage unavailable
    }
    return DEFAULT_WAV_BIT_DEPTH
  }

  function setAudioEngine(engine) {
    audioEngineRef = engine
  }

  function resetBuffers() {
    recordedChunks.value = []
    pcmChunks = []
    pcmFrames.value = 0
    pcmChannels = 0
    wavCache = null
    recordingTime.value = 0
  }

  function pushPcmChunk(channels) {
    if (!channels || channels.length === 0 || channels[0].length === 0) return
    pcmChunks.push(channels)
    pcmChannels = Math.max(pcmChannels, channels.length)
    pcmFrames.value += channels[0].length
  }

  // ---------------------------------------------------------------------------
  // WAV: PCM capture
  // ---------------------------------------------------------------------------
  async function ensureWorklet(audioContext) {
    if (!audioContext.audioWorklet) return false
    if (audioContext.__eq19PcmWorkletLoaded) return true
    try {
      await audioContext.audioWorklet.addModule(PCM_WORKLET_URL)
      audioContext.__eq19PcmWorkletLoaded = true
      return true
    } catch (error) {
      console.warn('AudioWorklet unavailable, falling back to ScriptProcessor:', error)
      return false
    }
  }

  async function startPcmCapture(audioContext, sourceNode) {
    pcmSampleRate = audioContext.sampleRate
    const channelCount = Math.max(1, Math.min(2, audioContext.destination.channelCount || 2))

    // Silent sink keeps the capture node pulled by the graph without doubling the output
    const silent = audioContext.createGain()
    silent.gain.value = 0
    silent.connect(audioContext.destination)

    if (await ensureWorklet(audioContext)) {
      const capture = new AudioWorkletNode(audioContext, 'pcm-recorder', {
        numberOfInputs: 1,
        numberOfOutputs: 1,
        processorOptions: { channelCount },
      })

      let resolveDone = null
      capture.port.onmessage = (event) => {
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
          new Promise((resolve) => {
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
    capture.onaudioprocess = (event) => {
      if (!capturing) return
      const channels = []
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

  async function stopPcmCapture() {
    if (!pcmNodes) return
    const nodes = pcmNodes
    pcmNodes = null
    await nodes.stop()
    try {
      nodes.source.disconnect(nodes.capture)
    } catch (_e) {
      // already disconnected
    }
    try {
      nodes.capture.disconnect()
      nodes.silent.disconnect()
    } catch (_e) {
      // ignore
    }
    if (nodes.capture.port) nodes.capture.port.onmessage = null
  }

  function buildWavBlob() {
    if (pcmChunks.length === 0) return null
    if (wavCache && wavCache.bitDepth === bitDepth.value) return wavCache.blob
    const blob = encodeWavFromChunks(pcmChunks, pcmChannels, pcmSampleRate, bitDepth.value)
    wavCache = { bitDepth: bitDepth.value, blob }
    return blob
  }

  // ---------------------------------------------------------------------------
  // WebM: MediaRecorder
  // ---------------------------------------------------------------------------
  function startWebmCapture(audioContext, sourceNode) {
    const mimeType = 'audio/webm;codecs=opus'
    if (typeof MediaRecorder === 'undefined' || !MediaRecorder.isTypeSupported(mimeType))
      return false

    webmDestination = audioContext.createMediaStreamDestination()
    sourceNode.connect(webmDestination)

    mediaRecorder.value = new MediaRecorder(webmDestination.stream, { mimeType })
    mediaRecorder.value.ondataavailable = (event) => {
      if (event.data.size > 0) recordedChunks.value.push(event.data)
    }
    mediaRecorder.value.start(100)
    return true
  }

  function stopWebmCapture() {
    if (mediaRecorder.value && mediaRecorder.value.state !== 'inactive') {
      mediaRecorder.value.stop()
    }
    mediaRecorder.value = null
    if (webmDestination) {
      try {
        audioEngineRef?.gainNode?.value?.disconnect(webmDestination)
      } catch (_e) {
        // ignore
      }
      webmDestination = null
    }
  }

  // ---------------------------------------------------------------------------
  // Public recording API
  // ---------------------------------------------------------------------------
  async function startRecording() {
    if (isRecording.value) return false
    if (!audioEngineRef?.audioContext?.value || !audioEngineRef.gainNode?.value) return false

    const audioContext = audioEngineRef.audioContext.value
    const sourceNode = audioEngineRef.gainNode.value

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

  async function stopRecording() {
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
  async function buildBlob() {
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
  function sanitizeFilename(name) {
    return String(name || '')
      .replace(/[\\/:*?"<>|]+/g, '_')
      .replace(/\.(wav|webm)$/i, '')
      .replace(/\.+$/, '')
      .trim()
      .slice(0, 120)
  }

  const supportsFolderPicker =
    typeof window !== 'undefined' && typeof window.showSaveFilePicker === 'function'

  /**
   * Trigger a plain browser download to the default download folder.
   */
  function anchorDownload(blob, ext, filename) {
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

  async function downloadRecording(filename = 'audio-export') {
    const built = await buildBlob()
    if (!built) return false

    try {
      anchorDownload(built.blob, built.ext, sanitizeFilename(filename) || 'audio-export')
      return true
    } catch (error) {
      console.error('Download failed:', error)
      return false
    }
  }

  /**
   * Save the recording with a user-chosen file name. When the browser supports
   * the File System Access API, a native dialog lets the user pick the target
   * folder as well; otherwise it falls back to a normal download.
   *
   * Returns { ok, aborted } so callers can react to a cancelled dialog.
   */
  async function saveRecordingAs(filename = 'audio-export') {
    if (!hasRecording.value) return { ok: false }

    const safeName = sanitizeFilename(filename) || 'audio-export'
    const ext = pcmChunks.length > 0 ? 'wav' : 'webm'
    const mime = ext === 'wav' ? 'audio/wav' : 'audio/webm'

    // Preferred path: native "Save As" dialog with folder selection.
    if (supportsFolderPicker) {
      let handle = null
      try {
        // Request the handle first, while the click's user activation is fresh.
        handle = await window.showSaveFilePicker({
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
        if (error && error.name === 'AbortError') return { ok: false, aborted: true }
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

  function setFormat(format) {
    if (isRecording.value) return
    if (format !== 'wav' && format !== 'webm') return
    recordingFormat.value = format
    resetBuffers()
  }

  /**
   * Select the WAV bit depth (16 | 24 | 32). Allowed while not recording;
   * an existing PCM recording is simply re-encoded at the new depth on save.
   */
  function setBitDepth(depth) {
    if (isRecording.value) return
    if (!WAV_BIT_DEPTHS.includes(depth)) return
    bitDepth.value = depth
    try {
      localStorage.setItem(BIT_DEPTH_STORAGE_KEY, String(depth))
    } catch (_e) {
      // storage unavailable
    }
  }

  function discardRecording() {
    if (isRecording.value) return
    resetBuffers()
  }

  function cleanup() {
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
    downloadRecording,
    saveRecordingAs,
    supportsFolderPicker,
    setFormat,
    setBitDepth,
    discardRecording,
    cleanup,
  }
}
