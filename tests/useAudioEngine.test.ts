// @vitest-environment node
import { test, vi } from 'vitest'
import assert from 'node:assert/strict'

vi.spyOn(console, 'log').mockImplementation(() => {})
vi.spyOn(console, 'error').mockImplementation(() => {})

// ---- Fake Web Audio ----------------------------------------------------------
function param(value: number) {
  return { value, setTargetAtTime() {} }
}

interface FakeNode {
  __v_skip: true
  name: string
  outputs: Set<FakeNode>
  connect(target: FakeNode): FakeNode
  disconnect(target?: FakeNode): void
}

// __v_skip: like real AudioNodes, the fakes must not be wrapped by Vue's reactivity
function fakeNode(name: string): FakeNode {
  return {
    __v_skip: true,
    name,
    outputs: new Set<FakeNode>(),
    connect(target: FakeNode) {
      this.outputs.add(target)
      return target
    },
    disconnect(target?: FakeNode) {
      if (target) this.outputs.delete(target)
      else this.outputs.clear()
    },
  }
}

class FakeAudioContext {
  __v_skip = true
  state = 'running'
  sampleRate = 48000
  destination = fakeNode('destination')
  resumed = 0
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

// The store reads window.AudioContext; the fake replaces it before the store is loaded.
Object.assign(globalThis, { window: { AudioContext: FakeAudioContext } })
const { createPinia, setActivePinia } = await import('pinia')
const { useAudioEngineStore } = await import('../src/stores/audioEngine')

type Engine = ReturnType<typeof useAudioEngineStore>

// Each test gets its own Pinia, so the store starts from scratch
function useAudioEngine(): Engine {
  setActivePinia(createPinia())
  return useAudioEngineStore()
}

// The store types its nodes as Web Audio classes; here they are the fakes above.
const fake = (node: unknown) => node as FakeNode
const asAudioNode = (node: FakeNode) => node as unknown as AudioNode

const outs = (n: FakeNode) => [...n.outputs].map((t) => t.name)

function engineWithSource(name = 'source') {
  const engine = useAudioEngine()
  engine.initAudioContext()
  const source = fakeNode(name)
  engine.connectAudioSource(asAudioNode(source))
  return { engine, source }
}

// Follow the single signal path from the source up to the master gain
function pathToGain(engine: Engine, source: FakeNode): FakeNode[] {
  const path: FakeNode[] = []
  let node = source
  const inputAnalyser = fake(engine.inputAnalyserNode)
  const gainNode = fake(engine.gainNode)
  for (let i = 0; i < 30 && node !== gainNode; i++) {
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
    engine.eqFilters,
    'all EQ filters in order, lowest band first'
  )
  assert.equal(path[19], engine.dynamicsNode)
  assert.equal(path[20], engine.gainNode)
  assert.ok(source.outputs.has(fake(engine.inputAnalyserNode)), 'input meter tap')
})

test('EQ gain changes reach the filters live (what the recorder captures)', () => {
  const { engine } = engineWithSource()
  engine.updateEqBand(16, -12)
  assert.equal(engine.eqFilters[16].gain.value, -12)
  assert.equal(engine.eqBands[16].gain, -12)
})

test('toggling the compressor off and on does not leave a second (dry) path', () => {
  const { engine, source } = engineWithSource()
  const lastFilter = fake(engine.eqFilters[engine.eqFilters.length - 1])

  engine.toggleDynamics() // off
  assert.deepEqual(pathToGain(engine, source).length, 19 + 1)
  assert.deepEqual(outs(lastFilter), ['gain'])
  assert.deepEqual(outs(fake(engine.dynamicsNode)), [], 'bypassed compressor detached')

  engine.toggleDynamics() // on again
  assert.deepEqual(pathToGain(engine, source).length, 19 + 1 + 1)
  assert.deepEqual(outs(lastFilter), ['dynamics'])
  assert.deepEqual(outs(fake(engine.dynamicsNode)), ['gain'])
})

test('EQ bypass detaches the filters and re-enabling restores them', () => {
  const { engine, source } = engineWithSource()
  engine.toggleEqBypass()
  assert.equal(pathToGain(engine, source).length, 1 + 1)
  engine.eqFilters.forEach((f) => assert.deepEqual(outs(fake(f)), []))

  engine.toggleEqBypass()
  assert.equal(pathToGain(engine, source).length, 19 + 1 + 1)
})

test('recorder tap on the master gain survives routing changes and source switches', () => {
  const { engine, source } = engineWithSource('player')
  const capture = fakeNode('recorder')
  fake(engine.gainNode).connect(capture)

  engine.toggleDynamics()
  engine.toggleEqBypass()
  const live = fakeNode('mediaStreamSource')
  engine.connectAudioSource(asAudioNode(live))
  engine.toggleEqBypass()
  engine.toggleDynamics()

  assert.ok(fake(engine.gainNode).outputs.has(capture), 'recorder still attached')
  assert.deepEqual(outs(source), [], 'previous source fully detached')
  assert.equal(pathToGain(engine, live).length, 19 + 1 + 1)
})
