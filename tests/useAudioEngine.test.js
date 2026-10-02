import { test, mock } from 'node:test'
import assert from 'node:assert/strict'

mock.method(console, 'log', () => {})
mock.method(console, 'error', () => {})

// ---- Fake Web Audio ----------------------------------------------------------
function param(value) {
  return { value, setTargetAtTime() {} }
}

// __v_skip: like real AudioNodes, the fakes must not be wrapped by Vue's reactivity
function fakeNode(name) {
  return {
    __v_skip: true,
    name,
    outputs: new Set(),
    connect(target) {
      this.outputs.add(target)
      return target
    },
    disconnect(target) {
      if (target) this.outputs.delete(target)
      else this.outputs.clear()
    },
  }
}

class FakeAudioContext {
  constructor() {
    this.__v_skip = true
    this.state = 'running'
    this.sampleRate = 48000
    this.destination = fakeNode('destination')
    this.resumed = 0
  }
  resume() {
    this.resumed++
    this.state = 'running'
    return Promise.resolve()
  }
  close() {
    this.state = 'closed'
    return Promise.resolve()
  }
  createAnalyser() {
    return Object.assign(fakeNode('analyser'), { fftSize: 2048, smoothingTimeConstant: 0 })
  }
  createDynamicsCompressor() {
    return Object.assign(fakeNode('dynamics'), {
      threshold: param(-24),
      knee: param(30),
      ratio: param(12),
      attack: param(0.003),
      release: param(0.25),
    })
  }
  createBiquadFilter() {
    return Object.assign(fakeNode('filter'), {
      type: 'peaking',
      frequency: param(0),
      gain: param(0),
      Q: param(1),
    })
  }
  createGain() {
    return Object.assign(fakeNode('gain'), { gain: param(1) })
  }
}

globalThis.window = { AudioContext: FakeAudioContext }
const { useAudioEngine } = await import('../src/composables/useAudioEngine.js')

const outs = (n) => [...n.outputs].map((t) => t.name)

function engineWithSource(name = 'source') {
  const engine = useAudioEngine()
  engine.initAudioContext()
  const source = fakeNode(name)
  engine.connectAudioSource(source)
  return { engine, source }
}

// Follow the single signal path from the source up to the master gain
function pathToGain(engine, source) {
  const path = []
  let node = source
  const inputAnalyser = engine.inputAnalyserNode.value
  for (let i = 0; i < 30 && node !== engine.gainNode.value; i++) {
    const next = [...node.outputs].filter((n) => n !== inputAnalyser)
    assert.equal(next.length, 1, `${node.name} must have exactly one chain output`)
    node = next[0]
    path.push(node)
  }
  return path
}

test('live input is routed source → 19 EQ filters → compressor → master gain', () => {
  const { engine, source } = engineWithSource('mediaStreamSource')
  const path = pathToGain(engine, source)
  assert.equal(path.length, 19 + 1 + 1)
  assert.deepEqual(
    path.slice(0, 19),
    engine.eqFilters.value,
    'all EQ filters in order, lowest band first'
  )
  assert.equal(path[19], engine.dynamicsNode.value)
  assert.equal(path[20], engine.gainNode.value)
  assert.ok(source.outputs.has(engine.inputAnalyserNode.value), 'input meter tap')
})

test('EQ gain changes reach the filters live (what the recorder captures)', () => {
  const { engine } = engineWithSource()
  engine.updateEqBand(16, -12)
  assert.equal(engine.eqFilters.value[16].gain.value, -12)
  assert.equal(engine.eqBands[16].gain, -12)
})

test('toggling the compressor off and on does not leave a second (dry) path', () => {
  const { engine, source } = engineWithSource()
  const lastFilter = engine.eqFilters.value.at(-1)

  engine.toggleDynamics() // off
  assert.deepEqual(pathToGain(engine, source).length, 19 + 1)
  assert.deepEqual(outs(lastFilter), ['gain'])
  assert.deepEqual(outs(engine.dynamicsNode.value), [], 'bypassed compressor detached')

  engine.toggleDynamics() // on again
  assert.deepEqual(pathToGain(engine, source).length, 19 + 1 + 1)
  assert.deepEqual(outs(lastFilter), ['dynamics'])
  assert.deepEqual(outs(engine.dynamicsNode.value), ['gain'])
})

test('EQ bypass detaches the filters and re-enabling restores them', () => {
  const { engine, source } = engineWithSource()
  engine.toggleEqBypass()
  assert.equal(pathToGain(engine, source).length, 1 + 1)
  engine.eqFilters.value.forEach((f) => assert.deepEqual(outs(f), []))

  engine.toggleEqBypass()
  assert.equal(pathToGain(engine, source).length, 19 + 1 + 1)
})

test('recorder tap on the master gain survives routing changes and source switches', () => {
  const { engine, source } = engineWithSource('player')
  const capture = fakeNode('recorder')
  engine.gainNode.value.connect(capture)

  engine.toggleDynamics()
  engine.toggleEqBypass()
  const live = fakeNode('mediaStreamSource')
  engine.connectAudioSource(live)
  engine.toggleEqBypass()
  engine.toggleDynamics()

  assert.ok(engine.gainNode.value.outputs.has(capture), 'recorder still attached')
  assert.deepEqual(outs(source), [], 'previous source fully detached')
  assert.equal(pathToGain(engine, live).length, 19 + 1 + 1)
})
