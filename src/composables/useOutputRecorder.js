import { ref, computed } from 'vue'

/**
 * Output Recorder - Records processed audio from AudioEngine
 * This records what you HEAR (after EQ and Dynamics processing)
 */
export function useOutputRecorder() {
  const isRecording = ref(false)
  const recordedChunks = ref([])
  const mediaRecorder = ref(null)
  const recordingFormat = ref('webm') // 'webm' or 'wav'
  const recordingTime = ref(0)
  let timerInterval = null
  let audioEngineRef = null

  const hasRecording = computed(() => recordedChunks.value.length > 0)

  /**
   * Encode WAV file
   */
  function encodeWAV(samples, sampleRate) {
    const buffer = new ArrayBuffer(44 + samples.length * 2)
    const view = new DataView(buffer)

    // WAV-Header schreiben
    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i))
      }
    }

    writeString(0, 'RIFF')
    view.setUint32(4, 36 + samples.length * 2, true)
    writeString(8, 'WAVE')
    writeString(12, 'fmt ')
    view.setUint32(16, 16, true) // fmt chunk size
    view.setUint16(20, 1, true) // PCM format
    view.setUint16(22, 1, true) // mono
    view.setUint32(24, sampleRate, true)
    view.setUint32(28, sampleRate * 2, true) // byte rate
    view.setUint16(32, 2, true) // block align
    view.setUint16(34, 16, true) // bits per sample
    writeString(36, 'data')
    view.setUint32(40, samples.length * 2, true)

    // Audio-Daten schreiben
    let offset = 44
    for (let i = 0; i < samples.length; i++) {
      const s = Math.max(-1, Math.min(1, samples[i]))
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true)
      offset += 2
    }

    return new Blob([buffer], { type: 'audio/wav' })
  }

  /**
   * Convert recorded WebM to WAV
   */
  async function convertToWAV() {
    try {
      // WebM Blob erstellen
      const webmBlob = new Blob(recordedChunks.value, { type: 'audio/webm' })

      // Audio-Context für Dekodierung
      const arrayBuffer = await webmBlob.arrayBuffer()
      const tempContext = new (window.AudioContext || window.webkitAudioContext)()
      const audioBuffer = await tempContext.decodeAudioData(arrayBuffer)

      // Audio-Daten extrahieren
      const samples = audioBuffer.getChannelData(0)

      // WAV-Blob erstellen
      const wavBlob = encodeWAV(samples, audioBuffer.sampleRate)

      // Chunks durch WAV-Blob ersetzen
      recordedChunks.value = [wavBlob]

      await tempContext.close()
      console.log('✅ Converted to WAV')
    } catch (error) {
      console.error('❌ WAV conversion error:', error)
      // Bei Fehler WebM behalten
    }
  }

  /**
   * Set the audio engine reference
   */
  function setAudioEngine(engine) {
    audioEngineRef = engine
    console.log('✅ AudioEngine set for output recording')
  }

  /**
   * Start recording the processed audio output
   */
  async function startRecording() {
    if (!audioEngineRef) {
      console.error('❌ AudioEngine not set! Cannot record output.')
      return false
    }

    if (!audioEngineRef.audioContext?.value) {
      console.error('❌ AudioContext not available')
      return false
    }

    try {
      recordedChunks.value = []
      recordingTime.value = 0

      const audioContext = audioEngineRef.audioContext.value

      // Create MediaStreamDestination to capture the output
      const destination = audioContext.createMediaStreamDestination()
      
      // Connect the gain node (master output) to our recording destination
      if (audioEngineRef.gainNode?.value) {
        audioEngineRef.gainNode.value.connect(destination)
        console.log('✅ Connected gain node to recording destination')
      } else {
        console.error('❌ Gain node not available')
        return false
      }

      // Create MediaRecorder from the destination stream
      const mimeType = recordingFormat.value === 'webm' 
        ? 'audio/webm;codecs=opus'
        : 'audio/webm;codecs=opus' // We'll convert to WAV later if needed

      const options = { mimeType }
      
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        console.error('❌ MIME type not supported:', mimeType)
        return false
      }

      mediaRecorder.value = new MediaRecorder(destination.stream, options)

      mediaRecorder.value.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunks.value.push(event.data)
          console.log('📼 Recording chunk:', event.data.size, 'bytes')
        }
      }

      mediaRecorder.value.onstop = async () => {
        console.log('⏹️ Recording stopped, total chunks:', recordedChunks.value.length)
        if (timerInterval) {
          clearInterval(timerInterval)
          timerInterval = null
        }

        // Convert to WAV if needed
        if (recordingFormat.value === 'wav') {
          await convertToWAV()
        }
      }

      mediaRecorder.value.onerror = (error) => {
        console.error('❌ MediaRecorder error:', error)
      }

      // Start recording
      mediaRecorder.value.start(100) // Collect data every 100ms
      isRecording.value = true

      // Start timer
      timerInterval = setInterval(() => {
        recordingTime.value++
      }, 1000)

      console.log('🎙️ Output recording started')
      return true

    } catch (error) {
      console.error('❌ Failed to start output recording:', error)
      return false
    }
  }

  /**
   * Stop recording
   */
  function stopRecording() {
    if (mediaRecorder.value && isRecording.value) {
      mediaRecorder.value.stop()
      isRecording.value = false

      if (timerInterval) {
        clearInterval(timerInterval)
        timerInterval = null
      }

      console.log('⏹️ Output recording stopped')
      return true
    }
    return false
  }

  /**
   * Download the recorded audio
   */
  function downloadRecording(filename = 'processed-audio') {
    if (recordedChunks.value.length === 0) {
      console.warn('⚠️ No recording to download')
      return false
    }

    try {
      const mimeType = recordingFormat.value === 'wav'
        ? 'audio/wav'
        : 'audio/webm'

      const blob = new Blob(recordedChunks.value, { type: mimeType })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `${filename}.${recordingFormat.value}`

      document.body.appendChild(a)
      a.click()

      setTimeout(() => {
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }, 100)

      console.log('💾 Recording downloaded:', a.download)
      return true

    } catch (error) {
      console.error('❌ Failed to download recording:', error)
      return false
    }
  }

  /**
   * Set recording format
   */
  function setFormat(format) {
    if (!isRecording.value) {
      recordingFormat.value = format
      recordedChunks.value = []
      recordingTime.value = 0
      console.log('📝 Recording format set to:', format)
    }
  }

  /**
   * Discard current recording
   */
  function discardRecording() {
    recordedChunks.value = []
    recordingTime.value = 0
    console.log('🗑️ Recording discarded')
  }

  /**
   * Cleanup
   */
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
