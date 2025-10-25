import { ref, computed } from 'vue'

export function useRecorder() {
  const isRecording = ref(false)
  const recordedChunks = ref([])
  const mediaRecorder = ref(null)
  const recordingFormat = ref('webm') // 'webm' or 'wav'
  const recordingTime = ref(0) // Timer in Sekunden
  const audioContext = ref(null)
  const destination = ref(null)
  const input = ref(null)
  let timerInterval = null

  const mimeType = computed(() => {
    return recordingFormat.value === 'webm' 
      ? 'audio/webm;codecs=opus' 
      : 'audio/wav'
  })

  const hasRecording = computed(() => recordedChunks.value.length > 0)

  // WAV-Konvertierung
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

  async function startRecording() {
    try {
      recordedChunks.value = []
      recordingTime.value = 0
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      })

      if (recordingFormat.value === 'wav') {
        // WAV-Recording mit Web Audio API
        audioContext.value = new (window.AudioContext || window.webkitAudioContext)()
        input.value = audioContext.value.createMediaStreamSource(stream)
        destination.value = audioContext.value.createMediaStreamDestination()
        input.value.connect(destination.value)

        const options = {
          mimeType: 'audio/webm;codecs=opus',
          audioBitsPerSecond: 128000
        }

        mediaRecorder.value = new MediaRecorder(destination.value.stream, options)
      } else {
        // WebM-Recording
        const options = {
          mimeType: mimeType.value,
          audioBitsPerSecond: 128000
        }

        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          options.mimeType = 'audio/webm'
        }

        mediaRecorder.value = new MediaRecorder(stream, options)
      }

      mediaRecorder.value.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunks.value.push(event.data)
        }
      }

      mediaRecorder.value.onstop = async () => {
        // Timer stoppen
        if (timerInterval) {
          clearInterval(timerInterval)
          timerInterval = null
        }

        if (recordingFormat.value === 'wav') {
          await convertToWAV()
        }
        
        // Stream tracks stoppen
        stream.getTracks().forEach(track => track.stop())
        
        if (audioContext.value) {
          await audioContext.value.close()
          audioContext.value = null
        }
      }

      mediaRecorder.value.start(100) // Chunks alle 100ms
      isRecording.value = true
      
      // Timer starten
      timerInterval = setInterval(() => {
        recordingTime.value++
      }, 1000)
      
      return true
    } catch (error) {
      console.error('Fehler beim Starten der Aufnahme:', error)
      
      // Timer aufräumen falls vorhanden
      if (timerInterval) {
        clearInterval(timerInterval)
        timerInterval = null
      }
      
      return false
    }
  }

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
    } catch (error) {
      console.error('Fehler bei WAV-Konvertierung:', error)
      // Bei Fehler WebM behalten
    }
  }

  function stopRecording() {
    if (mediaRecorder.value && isRecording.value) {
      mediaRecorder.value.stop()
      isRecording.value = false
      
      // Timer wird in onstop callback gestoppt
    }
  }

  function downloadRecording() {
    if (recordedChunks.value.length === 0) {
      console.warn('Keine Aufnahme zum Download verfügbar')
      return
    }

    const blob = new Blob(recordedChunks.value, {
      type: recordingFormat.value === 'wav' ? 'audio/wav' : 'audio/webm'
    })

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.style.display = 'none'
    a.href = url
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
    a.download = `recording_${timestamp}.${recordingFormat.value}`
    
    document.body.appendChild(a)
    a.click()
    
    setTimeout(() => {
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }, 100)
  }

  function setFormat(format) {
    if (!isRecording.value) {
      recordingFormat.value = format
      // Reset recording wenn Format geändert wird
      recordedChunks.value = []
      recordingTime.value = 0
    }
  }

  function discardRecording() {
    recordedChunks.value = []
    recordingTime.value = 0
  }

  // Cleanup bei Component unmount
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
    startRecording,
    stopRecording,
    downloadRecording,
    setFormat,
    discardRecording,
    cleanup
  }
}
