import { ref, computed, getCurrentInstance, onBeforeUnmount } from 'vue'

const DEVICE_STORAGE_KEY = 'eq19_input_device'

/**
 * Pseudo device id for "the PC's own playback" (system audio). Browsers cannot
 * open output devices with getUserMedia; system audio is only reachable via
 * screen sharing (getDisplayMedia) – Chrome/Edge on Windows share the sound of
 * the default output device when "Share system audio" is ticked.
 */
export const SYSTEM_AUDIO = '__system__'

/**
 * getDisplayMedia options for capturing system audio. Chrome requires video to
 * be requested; the video track is stopped right away.
 *
 * @param {CaptureController|null} [controller] lets the app stay in front
 *   instead of Chrome switching to the shared tab/window
 */
export function buildSystemAudioOptions(controller = null) {
  return {
    video: true,
    audio: {
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
      // Tab share: the browser mutes the shared tab locally, so only the
      // processed sound is heard (no echo). Ignored for screen/window shares.
      // Requested up front – changing it later is not reliable everywhere.
      suppressLocalAudioPlayback: true,
      // Where supported: leave this tab's own output out of the capture (no loop)
      restrictOwnAudio: true,
    },
    systemAudio: 'include',
    selfBrowserSurface: 'exclude',
    surfaceSwitching: 'exclude',
    monitorTypeSurfaces: 'include',
    ...(controller ? { controller } : {}),
  }
}

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
 * @param {{ specificDevice?: boolean, systemAudio?: boolean }} [ctx]
 *   specificDevice: a particular device was requested (otherwise "not found"
 *   means the system offers no recording device at all);
 *   systemAudio: the error came from sharing system audio
 */
export function inputErrorKey(error, { specificDevice = false, systemAudio = false } = {}) {
  switch (error?.name) {
    case 'NotAllowedError':
    case 'SecurityError':
      // Chrome reports an OS-level block (privacy settings) as "Permission denied by system"
      if (/system/i.test(error?.message || '')) return 'input_err_denied_system'
      // For screen sharing this simply means the share dialog was cancelled
      return systemAudio ? 'input_err_share_cancelled' : 'input_err_denied'
    case 'NoAudioTrackError':
      return 'input_err_no_system_audio'
    case 'SystemAudioUnsupportedError':
      return 'input_err_system_unsupported'
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
 * Live audio input (line-in, microphone, "Stereo Mix", virtual cable …) or the
 * PC's own playback (SYSTEM_AUDIO, via screen sharing) as an alternative
 * source for the processing chain.
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
  const systemAudioSupported = typeof mediaDevices?.getDisplayMedia === 'function'
  // Can the capture exclude this tab's own output? Only then is monitoring
  // system audio safe (otherwise the processed sound is captured again → loop).
  const ownAudioExcludable = !!mediaDevices?.getSupportedConstraints?.()?.restrictOwnAudio
  const mode = ref('playlist')
  const devices = ref([]) // { deviceId, label } – labels are empty until access was granted
  const selectedDeviceId = ref(loadDevice())
  const isActive = ref(false)
  const isStarting = ref(false)
  const monitor = ref(false)
  const errorKey = ref('')
  const activeLabel = ref('')
  const activeIsSystem = ref(false)
  // What the system-audio share covers: 'browser' (a tab), 'window', 'monitor' or ''
  const activeSurface = ref('')
  // Tab share: is the shared tab muted locally by the browser right now?
  const tabMuted = ref(false)
  const outputs = ref([]) // detected output devices (information only)

  const isSystemSelected = computed(() => selectedDeviceId.value === SYSTEM_AUDIO)
  // A shared tab is never this one (selfBrowserSurface: 'exclude'), so its
  // capture cannot contain the app's own output – monitoring is safe there.
  const isTabShare = computed(() => activeIsSystem.value && activeSurface.value === 'browser')
  const monitorAllowed = computed(
    () => !isSystemSelected.value || ownAudioExcludable || isTabShare.value
  )

  let stream = null
  let sourceNode = null
  let monitorTouched = false // the user set the monitor switch themselves

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
      // Without permission some browsers report placeholder entries without id
      const real = (d) => d.deviceId && d.deviceId !== 'default'
      devices.value = list
        .filter((d) => d.kind === 'audioinput' && real(d))
        .map((d) => ({ deviceId: d.deviceId, label: d.label || '' }))
      outputs.value = list
        .filter((d) => d.kind === 'audiooutput' && d.label)
        .map((d) => ({ deviceId: d.deviceId, label: d.label }))
    } catch (_e) {
      devices.value = []
      outputs.value = []
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
    activeIsSystem.value = false
    activeSurface.value = ''
    tabMuted.value = false
    audioEngine.setMonitorEnabled(true)
  }

  /**
   * Open the stream for a device id (real input or SYSTEM_AUDIO).
   * Resolves { stream, surface }; surface is the shared display surface
   * ('browser' | 'window' | 'monitor') for system audio, '' otherwise.
   */
  async function acquireStream(deviceId) {
    if (deviceId === SYSTEM_AUDIO) {
      if (!systemAudioSupported) {
        throw Object.assign(new Error('getDisplayMedia unsupported'), {
          name: 'SystemAudioUnsupportedError',
        })
      }
      const controller =
        typeof globalThis.CaptureController === 'function'
          ? new globalThis.CaptureController()
          : null
      const display = await mediaDevices.getDisplayMedia(buildSystemAudioOptions(controller))
      // Keep this page in front: Chrome would otherwise switch to the shared tab/window
      try {
        controller?.setFocusBehavior('no-focus-change')
      } catch (_e) {
        // too late or unsupported – only the focus is affected
      }
      const video = display.getVideoTracks()[0]
      const surface = video?.getSettings?.()?.displaySurface || ''
      // Only the sound is used; ending the picture also removes the capture overhead
      display.getVideoTracks().forEach((track) => track.stop())
      if (display.getAudioTracks().length === 0) {
        display.getTracks().forEach((track) => track.stop())
        throw Object.assign(new Error('No audio was shared'), { name: 'NoAudioTrackError' })
      }
      return { stream: display, surface }
    }

    try {
      return {
        stream: await mediaDevices.getUserMedia(buildInputConstraints(deviceId)),
        surface: '',
      }
    } catch (error) {
      // The remembered device is gone (unplugged, disabled): fall back to the default input
      if (!deviceId || !DEVICE_MISSING.has(error?.name)) throw error
      selectedDeviceId.value = ''
      saveDevice('')
      return { stream: await mediaDevices.getUserMedia(buildInputConstraints('')), surface: '' }
    }
  }

  /**
   * Tab share: while monitoring, the processed sound replaces the tab's own
   * (the browser mutes the tab locally); without monitoring the tab should
   * play as usual. The browser may ignore the request (older versions, or no
   * runtime change) – tabMuted always reflects what it actually does, and the
   * user is never left with silence: a muted tab keeps monitoring on.
   */
  async function syncTabPlayback() {
    const track = stream?.getAudioTracks?.()[0]
    if (!track || !isTabShare.value) {
      tabMuted.value = false
      return
    }
    const isMuted = () => track.getSettings?.()?.suppressLocalAudioPlayback === true
    const wantMuted = monitorAllowed.value && monitor.value
    if (isMuted() !== wantMuted && typeof track.applyConstraints === 'function') {
      try {
        await track.applyConstraints({ suppressLocalAudioPlayback: wantMuted })
      } catch (_e) {
        // not supported – fall through and report the real state
      }
    }
    tabMuted.value = isMuted()
    if (tabMuted.value && !wantMuted) {
      monitor.value = true
      audioEngine.setMonitorEnabled(monitorAllowed.value)
    }
  }

  /** Create/resume the AudioContext synchronously (no await: keeps user activation). */
  function wakeEngine() {
    try {
      if (!audioEngine.isInitialized.value) audioEngine.initAudioContext()
      const ctx = audioEngine.audioContext.value
      if (ctx?.state === 'suspended' && typeof ctx.resume === 'function') {
        ctx.resume().catch(() => {})
      }
    } catch (_e) {
      // engine unavailable – start() reports it after the stream was acquired
    }
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
    const system = selectedDeviceId.value === SYSTEM_AUDIO
    if (!isSupported && !(system && systemAudioSupported)) {
      errorKey.value = 'input_err_unsupported'
      return false
    }
    if (isStarting.value) return false

    const wasActive = isActive.value
    errorKey.value = ''
    isStarting.value = true
    try {
      // Wake the engine while the click's user activation is fresh: the permission
      // or share dialog can outlive it, and a context that stays suspended would
      // feed silence to EQ, meters and recorder.
      wakeEngine()

      // No await before this call: the share dialog needs the click's user activation
      const { stream: newStream, surface } = await acquireStream(selectedDeviceId.value)

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
      activeIsSystem.value = system
      activeSurface.value = surface
      // A shared tab is muted by the browser while monitoring, so the user hears
      // the processed version instead of the original – unless they opted out.
      if (isTabShare.value && !monitorTouched) monitor.value = true
      audioPlayer.setExternalSource(releaseToPlaylist)
      audioEngine.setMonitorEnabled(monitorAllowed.value && monitor.value)
      audioEngine.connectAudioSource(node)
      await syncTabPlayback()

      const track = newStream.getAudioTracks()[0]
      activeLabel.value = system ? '' : track?.label || ''
      if (track) {
        // Device unplugged / access revoked – or "Stop sharing" clicked for system audio
        track.onended = () => {
          stop()
          if (!system) errorKey.value = 'input_err_ended'
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
      let key = inputErrorKey(error, {
        specificDevice: !!selectedDeviceId.value && !system,
        systemAudio: system,
      })
      // No recording device at all: offer the PC's own playback instead
      if (key === 'input_err_no_devices' && systemAudioSupported) {
        selectedDeviceId.value = SYSTEM_AUDIO
        saveDevice(SYSTEM_AUDIO)
        key = 'input_err_no_devices_system'
      }
      errorKey.value = key
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
    monitorTouched = true
    if (isActive.value) {
      audioEngine.setMonitorEnabled(monitorAllowed.value && monitor.value)
      syncTabPlayback()
    }
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
    systemAudioSupported,
    ownAudioExcludable,
    mode,
    devices,
    selectedDeviceId,
    isActive,
    isStarting,
    monitor,
    errorKey,
    activeLabel,
    activeIsSystem,
    activeSurface,
    isTabShare,
    tabMuted,
    outputs,
    isSystemSelected,
    monitorAllowed,
    refreshDevices,
    start,
    stop,
    setMode,
    selectDevice,
    setMonitor,
    dispose,
  }
}
