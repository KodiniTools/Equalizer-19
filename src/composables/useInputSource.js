import { ref, getCurrentInstance, onBeforeUnmount } from 'vue'

const DEVICE_STORAGE_KEY = 'eq19_input_device'

/**
 * getUserMedia constraints for music: the browser's voice processing is
 * switched off (it would pump, gate and colour the signal); stereo if possible.
 * An empty deviceId means the system default input.
 */
export function buildInputConstraints(deviceId) {
  return {
    audio: {
      ...(deviceId ? { deviceId: { exact: deviceId } } : {}),
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
      channelCount: { ideal: 2 },
    },
    video: false,
  }
}

// getUserMedia errors meaning "this device does not exist (any more)"
const DEVICE_MISSING = new Set(['NotFoundError', 'OverconstrainedError'])

/**
 * Map a getUserMedia / Web Audio error to a translation key.
 *
 * @param {Error} error
 * @param {{ specificDevice?: boolean }} [ctx] whether a particular device was requested
 *   (otherwise "not found" means the system offers no recording device at all)
 */
export function inputErrorKey(error, { specificDevice = false } = {}) {
  switch (error?.name) {
    case 'NotAllowedError':
    case 'SecurityError':
      // Chrome reports an OS-level block (privacy settings) as "Permission denied by system"
      return /system/i.test(error?.message || '') ? 'input_err_denied_system' : 'input_err_denied'
    case 'NotFoundError':
    case 'OverconstrainedError':
      return specificDevice ? 'input_err_not_found' : 'input_err_no_devices'
    case 'NotReadableError':
    case 'AbortError':
      return 'input_err_busy'
    // Firefox: input device and AudioContext run at different sample rates
    case 'NotSupportedError':
      return 'input_err_samplerate'
    default:
      return 'input_err_failed'
  }
}

/**
 * Live audio input (line-in, microphone, "Stereo Mix", virtual cable …) as an
 * alternative source for the processing chain.
 *
 * mode 'playlist' → file playback feeds EQ/compressor (default)
 * mode 'input'    → the selected input device feeds EQ/compressor
 *
 * While an input is active, the player cannot take over the chain; pressing
 * play releases the input and switches back to the playlist. Speaker
 * monitoring is off by default for inputs to prevent feedback loops.
 *
 * @param {object} audioEngine  useAudioEngine() instance
 * @param {object} audioPlayer  useAudioPlayer() instance
 * @param {{ mediaDevices?: MediaDevices, storage?: Storage }} [deps] injectable for tests
 */
export function useInputSource(audioEngine, audioPlayer, deps = {}) {
  const mediaDevices =
    'mediaDevices' in deps ? deps.mediaDevices : globalThis.navigator?.mediaDevices
  const storage = 'storage' in deps ? deps.storage : globalThis.localStorage

  const isSupported = typeof mediaDevices?.getUserMedia === 'function'
  const mode = ref('playlist')
  const devices = ref([]) // { deviceId, label } – labels are empty until access was granted
  const selectedDeviceId = ref(loadDevice())
  const isActive = ref(false)
  const isStarting = ref(false)
  const monitor = ref(false)
  const errorKey = ref('')
  const activeLabel = ref('')

  let stream = null
  let sourceNode = null

  function loadDevice() {
    try {
      return storage?.getItem(DEVICE_STORAGE_KEY) || ''
    } catch (_e) {
      return ''
    }
  }

  function saveDevice(id) {
    try {
      storage?.setItem(DEVICE_STORAGE_KEY, id)
    } catch (_e) {
      // storage unavailable
    }
  }

  async function refreshDevices() {
    if (typeof mediaDevices?.enumerateDevices !== 'function') return
    try {
      const list = await mediaDevices.enumerateDevices()
      devices.value = list
        .filter((d) => d.kind === 'audioinput' && d.deviceId !== 'default')
        .map((d) => ({ deviceId: d.deviceId, label: d.label || '' }))
    } catch (_e) {
      devices.value = []
    }
  }

  /** Stop the stream and detach it from the chain (no player hand-back). */
  function stopStream() {
    if (stream) {
      stream.getTracks().forEach((track) => {
        track.onended = null
        track.stop()
      })
      stream = null
    }
    if (sourceNode) {
      if (audioEngine.sourceNode?.value === sourceNode) {
        audioEngine.disconnectAudioSource()
      } else {
        try {
          sourceNode.disconnect()
        } catch (_e) {
          // already disconnected
        }
      }
      sourceNode = null
    }
    isActive.value = false
    activeLabel.value = ''
    audioEngine.setMonitorEnabled(true)
  }

  // Called by the player when the user starts playback while the input is live
  function releaseToPlaylist() {
    stopStream()
    mode.value = 'playlist'
  }

  /**
   * Start (or restart, e.g. after a device change) the selected input.
   * Resolves true on success; on failure errorKey holds a translation key.
   */
  async function start() {
    if (!isSupported) {
      errorKey.value = 'input_err_unsupported'
      return false
    }
    if (isStarting.value) return false

    const wasActive = isActive.value
    errorKey.value = ''
    isStarting.value = true
    try {
      let newStream
      try {
        newStream = await mediaDevices.getUserMedia(buildInputConstraints(selectedDeviceId.value))
      } catch (error) {
        // The remembered device is gone (unplugged, disabled): fall back to the default input
        if (!selectedDeviceId.value || !DEVICE_MISSING.has(error?.name)) throw error
        selectedDeviceId.value = ''
        saveDevice('')
        newStream = await mediaDevices.getUserMedia(buildInputConstraints(''))
      }

      if (!audioEngine.isInitialized.value) audioEngine.initAudioContext()
      const ctx = audioEngine.audioContext.value
      if (!ctx) {
        newStream.getTracks().forEach((track) => track.stop())
        throw new Error('AudioContext unavailable')
      }
      if (ctx.state === 'suspended') await ctx.resume()

      let node
      try {
        node = ctx.createMediaStreamSource(newStream)
      } catch (error) {
        newStream.getTracks().forEach((track) => track.stop())
        throw error
      }

      // Replace a running input (device switch) without handing back to the player
      if (wasActive) stopStream()

      stream = newStream
      sourceNode = node
      audioPlayer.setExternalSource(releaseToPlaylist)
      audioEngine.setMonitorEnabled(monitor.value)
      audioEngine.connectAudioSource(node)

      const track = newStream.getAudioTracks()[0]
      activeLabel.value = track?.label || ''
      if (track) {
        // Device unplugged or access revoked
        track.onended = () => {
          stop()
          errorKey.value = 'input_err_ended'
        }
      }

      isActive.value = true
      mode.value = 'input'
      await refreshDevices() // labels become available after the permission prompt
      return true
    } catch (error) {
      // A running input is only replaced after success, so on a failed device
      // switch the previous input simply keeps running.
      console.error('Audio input could not be started:', error)
      errorKey.value = inputErrorKey(error, { specificDevice: !!selectedDeviceId.value })
      refreshDevices()
      return false
    } finally {
      isStarting.value = false
    }
  }

  /** Stop the input and give the chain back to the playlist. */
  function stop() {
    const hadInput = isActive.value || stream !== null
    stopStream()
    if (hadInput) audioPlayer.clearExternalSource()
  }

  /** Switch between 'playlist' and 'input'. Leaving 'input' stops a live input. */
  function setMode(next) {
    if (next !== 'playlist' && next !== 'input') return
    if (next === 'playlist') stop()
    errorKey.value = ''
    mode.value = next
  }

  function selectDevice(deviceId) {
    selectedDeviceId.value = deviceId || ''
    saveDevice(selectedDeviceId.value)
    if (isActive.value) start()
  }

  /** Speaker monitoring for the live input (recording is unaffected). */
  function setMonitor(enabled) {
    monitor.value = !!enabled
    if (isActive.value) audioEngine.setMonitorEnabled(monitor.value)
  }

  mediaDevices?.addEventListener?.('devicechange', refreshDevices)
  refreshDevices()

  function dispose() {
    mediaDevices?.removeEventListener?.('devicechange', refreshDevices)
    stop()
  }

  if (getCurrentInstance()) onBeforeUnmount(dispose)

  return {
    isSupported,
    mode,
    devices,
    selectedDeviceId,
    isActive,
    isStarting,
    monitor,
    errorKey,
    activeLabel,
    refreshDevices,
    start,
    stop,
    setMode,
    selectDevice,
    setMonitor,
    dispose,
  }
}
