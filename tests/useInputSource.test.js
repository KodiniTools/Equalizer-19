import { test, mock } from 'node:test'
import assert from 'node:assert/strict'
import {
  useInputSource,
  buildInputConstraints,
  inputErrorKey,
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
    async getUserMedia(constraints) {
      calls.push(constraints)
      if (this.fail) throw Object.assign(new Error(this.fail), { name: this.fail })
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
  assert.equal(inputErrorKey({ name: 'NotFoundError' }), 'input_err_not_found')
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
