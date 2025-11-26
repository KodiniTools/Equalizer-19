import { ref, computed } from 'vue'

/**
 * Output Recorder - Records processed audio from AudioEngine
 * Supports WAV and WebM export formats
 */
export function useOutputRecorder() {
  const isRecording = ref(false)
  const recordedChunks = ref([])
  const mediaRecorder = ref(null)
  const recordingFormat = ref('webm')
  const recordingTime = ref(0)
  let timerInterval = null
  let audioEngineRef = null

  const hasRecording = computed(() => recordedChunks.value.length > 0)

  function setAudioEngine(engine) {
    audioEngineRef = engine
  }

  async function startRecording() {
    if (!audioEngineRef) return false
    if (!audioEngineRef.audioContext?.value) return false

    try {
      recordedChunks.value = []
      recordingTime.value = 0

      const audioContext = audioEngineRef.audioContext.value
      const destination = audioContext.createMediaStreamDestination()

      if (audioEngineRef.gainNode?.value) {
        audioEngineRef.gainNode.value.connect(destination)
      } else {
        return false
      }

      const mimeType = 'audio/webm;codecs=opus'

      if (!MediaRecorder.isTypeSupported(mimeType)) return false

      mediaRecorder.value = new MediaRecorder(destination.stream, { mimeType })

      mediaRecorder.value.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunks.value.push(event.data)
        }
      }

      mediaRecorder.value.onstop = () => {
        if (timerInterval) {
          clearInterval(timerInterval)
          timerInterval = null
        }
      }

      mediaRecorder.value.start(100)
      isRecording.value = true

      timerInterval = setInterval(() => {
        recordingTime.value++
      }, 1000)

      return true
    } catch (error) {
      console.error('Failed to start recording:', error)
      return false
    }
  }

  function stopRecording() {
    if (mediaRecorder.value && isRecording.value) {
      mediaRecorder.value.stop()
      isRecording.value = false

      if (timerInterval) {
        clearInterval(timerInterval)
        timerInterval = null
      }
      return true
    }
    return false
  }

  /**
   * Convert AudioBuffer to WAV format
   */
  function audioBufferToWav(buffer) {
    const numChannels = buffer.numberOfChannels
    const sampleRate = buffer.sampleRate
    const format = 1 // PCM
    const bitDepth = 16

    const bytesPerSample = bitDepth / 8
    const blockAlign = numChannels * bytesPerSample

    const samples = buffer.length
    const dataSize = samples * blockAlign
    const bufferSize = 44 + dataSize

    const arrayBuffer = new ArrayBuffer(bufferSize)
    const view = new DataView(arrayBuffer)

    // WAV header
    writeString(view, 0, 'RIFF')
    view.setUint32(4, bufferSize - 8, true)
    writeString(view, 8, 'WAVE')
    writeString(view, 12, 'fmt ')
    view.setUint32(16, 16, true)
    view.setUint16(20, format, true)
    view.setUint16(22, numChannels, true)
    view.setUint32(24, sampleRate, true)
    view.setUint32(28, sampleRate * blockAlign, true)
    view.setUint16(32, blockAlign, true)
    view.setUint16(34, bitDepth, true)
    writeString(view, 36, 'data')
    view.setUint32(40, dataSize, true)

    // Interleave channels and write samples
    const offset = 44
    const channelData = []
    for (let i = 0; i < numChannels; i++) {
      channelData.push(buffer.getChannelData(i))
    }

    for (let i = 0; i < samples; i++) {
      for (let ch = 0; ch < numChannels; ch++) {
        let sample = channelData[ch][i]
        sample = Math.max(-1, Math.min(1, sample))
        sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF
        view.setInt16(offset + (i * blockAlign) + (ch * bytesPerSample), sample, true)
      }
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' })
  }

  function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i))
    }
  }

  /**
   * Convert WebM blob to WAV using AudioContext
   */
  async function convertToWav(webmBlob) {
    try {
      const arrayBuffer = await webmBlob.arrayBuffer()
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
      audioContext.close()
      return audioBufferToWav(audioBuffer)
    } catch (error) {
      console.error('WAV conversion failed:', error)
      return null
    }
  }

  async function downloadRecording(filename = 'audio-export') {
    if (recordedChunks.value.length === 0) return false

    try {
      let blob = new Blob(recordedChunks.value, { type: 'audio/webm' })
      let ext = 'webm'

      if (recordingFormat.value === 'wav') {
        const wavBlob = await convertToWav(blob)
        if (wavBlob) {
          blob = wavBlob
          ext = 'wav'
        }
      }

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

      return true
    } catch (error) {
      console.error('Download failed:', error)
      return false
    }
  }

  function setFormat(format) {
    if (!isRecording.value) {
      recordingFormat.value = format
      recordedChunks.value = []
      recordingTime.value = 0
    }
  }

  function discardRecording() {
    recordedChunks.value = []
    recordingTime.value = 0
  }

  function cleanup() {
    if (timerInterval) {
      clearInterval(timerInterval)
      timerInterval = null
    }
    if (mediaRecorder.value && isRecording.value) {
      stopRecording()
    }
  }

  return {
    isRecording,
    recordingFormat,
    hasRecording,
    recordingTime,
    setAudioEngine,
    startRecording,
    stopRecording,
    downloadRecording,
    setFormat,
    discardRecording,
    cleanup
  }
}
