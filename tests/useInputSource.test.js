import { test, mock } from 'node:test'
import assert from 'node:assert/strict'
import {
  useInputSource,
  buildInputConstraints,
  inputErrorKey,
  SYSTEM_AUDIO,
} from '../src/composables/useInputSource.js'

mock.method(console, 'error', () => {})

// ---- Fakes -----------------------------------------------------------------
function fakeTrack(label = 'Stereomix (Realtek)') {
  return {
    label,
    stopped: false,
    onended: null,
    stop() {
      this.stopped = true
    },
  }
}

function fakeStream(label) {
  const track = fakeTrack(label)
  return { track, getTracks: () => [track], getAudioTracks: () => [track] }
}

function fakeMediaDevices({ fail = null, devices } = {}) {
  const calls = []
  let listener = null
  return {
    calls,
    fail,
    get listener() {
      return listener
    },
    missing: new Set(),
    async getUserMedia(constraints) {
      calls.push(constraints)
      if (this.fail) throw Object.assign(new Error(this.fail), { name: this.fail })
      const id = constraints.audio.deviceId?.exact
      if (id && this.missing.has(id)) {
        throw Object.assign(new Error('Requested device not found'), { name: 'NotFoundError' })
      }
      return fakeStream(constraints.audio.deviceId ? 'Line-In' : 'Stereomix (Realtek)')
    },
    async enumerateDevices() {
      return (
        devices || [
          { kind: 'audioinput', deviceId: 'default', label: 'Default' },
          { kind: 'audioinput', deviceId: 'mix', label: 'Stereomix (Realtek)' },
          { kind: 'audioinput', deviceId: 'line', label: 'Line-In' },
          { kind: 'audiooutput', deviceId: 'spk', label: 'Speakers' },
        ]
      )
    },
    addEventListener(type, fn) {
      if (type === 'devicechange') listener = fn
    },
    removeEventListener(type, fn) {
      if (listener === fn) listener = null
    },
  }
}

function fakeEngine() {
  const engine = {
    connected: [],
    monitor: [],
    isInitialized: { value: true },
    sourceNode: { value: null },
    audioContext: {
      value: {
        state: 'running',
        createMediaStreamSource: (stream) => ({
          stream,
          disconnected: false,
          disconnect() {
            this.disconnected = true
          },
        }),
      },
    },
    initAudioContext() {},
    connectAudioSource(node) {
      engine.sourceNode.value = node
      engine.connected.push(node)
    },
    disconnectAudioSource() {
      engine.sourceNode.value?.disconnect()
      engine.sourceNode.value = null
    },
    setMonitorEnabled(on) {
      engine.monitor.push(on)
    },
  }
  return engine
}

function fakePlayer() {
  return {
    release: null,
    cleared: 0,
    setExternalSource(fn) {
      this.release = fn
    },
    clearExternalSource() {
      this.release = null
      this.cleared++
    },
  }
}

function memoryStorage() {
  const data = new Map()
  return { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => data.set(k, v), data }
}

const tick = () => new Promise((r) => setTimeout(r, 0))

function setup(opts = {}) {
  const md = fakeMediaDevices(opts)
  const engine = fakeEngine()
  const player = fakePlayer()
  const storage = memoryStorage()
  const input = useInputSource(engine, player, { mediaDevices: md, storage })
  return { md, engine, player, storage, input }
}

// ---- Pure helpers --------------------------------------------------------------
test('buildInputConstraints disables voice processing and pins the device', () => {
  assert.deepEqual(buildInputConstraints('line').audio, {
    deviceId: { exact: 'line' },
    echoCancellation: false,
    noiseSuppression: false,
    autoGainControl: false,
    channelCount: { ideal: 2 },
  })
  assert.equal('deviceId' in buildInputConstraints('').audio, false)
})

test('inputErrorKey maps browser errors to messages', () => {
  assert.equal(inputErrorKey({ name: 'NotAllowedError' }), 'input_err_denied')
  assert.equal(inputErrorKey({ name: 'NotFoundError' }), 'input_err_no_devices')
  assert.equal(
    inputErrorKey({ name: 'NotFoundError' }, { specificDevice: true }),
    'input_err_not_found'
  )
  assert.equal(
    inputErrorKey({ name: 'NotAllowedError', message: 'Permission denied by system' }),
    'input_err_denied_system'
  )
  assert.equal(inputErrorKey({ name: 'NotReadableError' }), 'input_err_busy')
  assert.equal(inputErrorKey({ name: 'NotSupportedError' }), 'input_err_samplerate')
  assert.equal(inputErrorKey(new Error('x')), 'input_err_failed')
})

// ---- Composable ----------------------------------------------------------------
test('lists audio inputs only (without the "default" alias)', async () => {
  const { input } = setup()
  await tick()
  assert.deepEqual(
    input.devices.value.map((d) => d.deviceId),
    ['mix', 'line']
  )
})

test('start connects the input, mutes monitoring and locks out the player', async () => {
  const { input, engine, player } = setup()
  assert.equal(await input.start(), true)
  assert.equal(input.isActive.value, true)
  assert.equal(input.mode.value, 'input')
  assert.equal(input.activeLabel.value, 'Stereomix (Realtek)')
  assert.equal(engine.connected.length, 1)
  assert.equal(engine.monitor.at(-1), false)
  assert.equal(typeof player.release, 'function')
})

test('stop releases the device and hands the chain back to the playlist', async () => {
  const { input, engine, player } = setup()
  await input.start()
  const node = engine.connected[0]
  input.stop()
  assert.equal(node.stream.track.stopped, true)
  assert.equal(node.disconnected, true)
  assert.equal(input.isActive.value, false)
  assert.equal(player.cleared, 1)
  assert.equal(engine.monitor.at(-1), true)
})

test('pressing play (player release) switches back to playlist mode', async () => {
  const { input, engine, player } = setup()
  await input.start()
  player.release()
  assert.equal(input.isActive.value, false)
  assert.equal(input.mode.value, 'playlist')
  assert.equal(engine.connected[0].stream.track.stopped, true)
})

test('monitor toggle only reaches the engine while live', async () => {
  const { input, engine } = setup()
  input.setMonitor(true)
  assert.equal(engine.monitor.length, 0)
  await input.start()
  assert.equal(engine.monitor.at(-1), true)
  input.setMonitor(false)
  assert.equal(engine.monitor.at(-1), false)
})

test('device choice is persisted and restarts a running input', async () => {
  const { input, md, storage, engine } = setup()
  await input.start()
  input.selectDevice('line')
  await tick()
  await tick()
  assert.equal(storage.data.get('eq19_input_device'), 'line')
  assert.deepEqual(md.calls.at(-1).audio.deviceId, { exact: 'line' })
  assert.equal(engine.connected.length, 2)
  assert.equal(engine.connected[0].stream.track.stopped, true)
  assert.equal(input.activeLabel.value, 'Line-In')
})

test('denied permission reports an error and leaves the playlist untouched', async () => {
  const { input, player } = setup({ fail: 'NotAllowedError' })
  assert.equal(await input.start(), false)
  assert.equal(input.errorKey.value, 'input_err_denied')
  assert.equal(input.isActive.value, false)
  assert.equal(player.release, null)
})

test('a failed device switch keeps the running input', async () => {
  const { input, md, engine } = setup()
  await input.start()
  md.fail = 'NotReadableError'
  input.selectDevice('line')
  await tick()
  assert.equal(input.isActive.value, true)
  assert.equal(input.errorKey.value, 'input_err_busy')
  assert.equal(engine.connected[0].stream.track.stopped, false)
})

test('unplugging the device stops the input with a message', async () => {
  const { input, engine, player } = setup()
  await input.start()
  engine.connected[0].stream.track.onended()
  assert.equal(input.isActive.value, false)
  assert.equal(input.errorKey.value, 'input_err_ended')
  assert.equal(player.cleared, 1)
})

test('setMode(playlist) stops a live input; unsupported browsers get a message', async () => {
  const { input } = setup()
  await input.start()
  input.setMode('playlist')
  assert.equal(input.isActive.value, false)
  assert.equal(input.mode.value, 'playlist')

  const none = useInputSource(fakeEngine(), fakePlayer(), {
    mediaDevices: undefined,
    storage: null,
  })
  assert.equal(none.isSupported, false)
  assert.equal(await none.start(), false)
  assert.equal(none.errorKey.value, 'input_err_unsupported')
})

test('no recording device at all → dedicated message', async () => {
  const { input } = setup({ fail: 'NotFoundError' })
  assert.equal(await input.start(), false)
  assert.equal(input.errorKey.value, 'input_err_no_devices')
})

test('a remembered device that is gone falls back to the default input', async () => {
  const { input, md, storage } = setup()
  md.missing.add('old')
  input.selectDevice('old')
  assert.equal(await input.start(), true)
  assert.equal(input.selectedDeviceId.value, '')
  assert.equal(storage.data.get('eq19_input_device'), '')
  assert.deepEqual(md.calls.at(-2).audio.deviceId, { exact: 'old' })
  assert.equal('deviceId' in md.calls.at(-1).audio, false)
})

test('OS privacy block is reported separately', async () => {
  const { input, md } = setup()
  md.getUserMedia = async () => {
    throw Object.assign(new Error('Permission denied by system'), { name: 'NotAllowedError' })
  }
  assert.equal(await input.start(), false)
  assert.equal(input.errorKey.value, 'input_err_denied_system')
})

// ---- System audio (screen share) ------------------------------------------------
function withDisplayMedia(md, { audio = true, fail = null, restrictOwnAudio = false } = {}) {
  md.displayCalls = []
  md.getDisplayMedia = async (options) => {
    md.displayCalls.push(options)
    if (fail) throw Object.assign(new Error(fail.message || fail.name), { name: fail.name })
    const video = {
      kind: 'video',
      stopped: false,
      stop() {
        this.stopped = true
      },
    }
    const audioTrack = {
      kind: 'audio',
      label: 'System Audio',
      stopped: false,
      onended: null,
      stop() {
        this.stopped = true
      },
    }
    md.lastVideo = video
    md.lastAudio = audioTrack
    const tracks = audio ? [video, audioTrack] : [video]
    return {
      getTracks: () => tracks,
      getVideoTracks: () => [video],
      getAudioTracks: () => (audio ? [audioTrack] : []),
    }
  }
  md.getSupportedConstraints = () => ({ restrictOwnAudio })
  return md
}

function setupSystem(opts = {}, mdOpts = {}) {
  const md = withDisplayMedia(fakeMediaDevices(mdOpts), opts)
  const engine = fakeEngine()
  const player = fakePlayer()
  const storage = memoryStorage()
  const input = useInputSource(engine, player, { mediaDevices: md, storage })
  return { md, engine, player, storage, input }
}

test('system audio: shares the PC playback, drops the picture', async () => {
  const { input, md, engine } = setupSystem()
  assert.equal(input.systemAudioSupported, true)
  input.selectDevice(SYSTEM_AUDIO)
  assert.equal(await input.start(), true)
  assert.equal(md.displayCalls[0].systemAudio, 'include')
  assert.equal(md.displayCalls[0].audio.echoCancellation, false)
  assert.equal(md.lastVideo.stopped, true)
  assert.equal(md.lastAudio.stopped, false)
  assert.equal(input.activeIsSystem.value, true)
  assert.equal(engine.connected.length, 1)
  assert.equal(md.calls.length, 0) // getUserMedia not used
})

test('system audio without "share system audio" ticked → hint', async () => {
  const { input, md } = setupSystem({ audio: false })
  input.selectDevice(SYSTEM_AUDIO)
  assert.equal(await input.start(), false)
  assert.equal(input.errorKey.value, 'input_err_no_system_audio')
  assert.equal(md.lastVideo.stopped, true)
})

test('cancelling the share dialog is not reported as "access denied"', async () => {
  const { input } = setupSystem({ fail: { name: 'NotAllowedError', message: 'Permission denied' } })
  input.selectDevice(SYSTEM_AUDIO)
  assert.equal(await input.start(), false)
  assert.equal(input.errorKey.value, 'input_err_share_cancelled')
})

test('system audio: monitoring stays off unless own audio can be excluded', async () => {
  const blocked = setupSystem()
  blocked.input.selectDevice(SYSTEM_AUDIO)
  blocked.input.setMonitor(true)
  await blocked.input.start()
  assert.equal(blocked.input.monitorAllowed.value, false)
  assert.equal(blocked.engine.monitor.at(-1), false)

  const safe = setupSystem({ restrictOwnAudio: true })
  safe.input.selectDevice(SYSTEM_AUDIO)
  safe.input.setMonitor(true)
  await safe.input.start()
  assert.equal(safe.input.monitorAllowed.value, true)
  assert.equal(safe.engine.monitor.at(-1), true)
})

test('no recording device at all → PC audio is preselected', async () => {
  const { input, storage } = setupSystem({}, { fail: 'NotFoundError' })
  assert.equal(await input.start(), false)
  assert.equal(input.errorKey.value, 'input_err_no_devices_system')
  assert.equal(input.selectedDeviceId.value, SYSTEM_AUDIO)
  assert.equal(storage.data.get('eq19_input_device'), SYSTEM_AUDIO)
  assert.equal(await input.start(), true)
  assert.equal(input.activeIsSystem.value, true)
})

test('"Stop sharing" in the browser stops quietly', async () => {
  const { input, md, player } = setupSystem()
  input.selectDevice(SYSTEM_AUDIO)
  await input.start()
  md.lastAudio.onended()
  assert.equal(input.isActive.value, false)
  assert.equal(input.errorKey.value, '')
  assert.equal(player.cleared, 1)
})

test('output devices are listed for information, placeholder inputs are ignored', async () => {
  const md = fakeMediaDevices({
    devices: [
      { kind: 'audioinput', deviceId: '', label: '' },
      {
        kind: 'audiooutput',
        deviceId: 'default',
        label: 'Standard - Lautsprecher (High Definition Audio Device)',
      },
    ],
  })
  const input = useInputSource(fakeEngine(), fakePlayer(), {
    mediaDevices: md,
    storage: memoryStorage(),
  })
  await tick()
  assert.equal(input.devices.value.length, 0)
  assert.deepEqual(
    input.outputs.value.map((o) => o.label),
    ['Standard - Lautsprecher (High Definition Audio Device)']
  )
})
