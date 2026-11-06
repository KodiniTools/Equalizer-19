// @vitest-environment node
import { test, vi } from 'vitest'
import assert from 'node:assert/strict'
import { useOutputRecorder, type RecorderEngine } from '../src/composables/useOutputRecorder'

vi.spyOn(console, 'error').mockImplementation(() => {})

// ---- Fake Web Audio (no AudioWorklet → ScriptProcessor path) -----------------
interface FakeNode {
  name: string
  outputs: Set<FakeNode>
  connect(target: FakeNode): void
  disconnect(target?: FakeNode): void
}

type FakeProcessor = FakeNode & {
  bufferSize: number
  channels: number
  onaudioprocess?: (event: { inputBuffer: FakeInputBuffer }) => void
}

interface FakeInputBuffer {
  numberOfChannels: number
  getChannelData(channel: number): Float32Array
}

function fakeNode(name: string): FakeNode {
  return {
    name,
    outputs: new Set<FakeNode>(),
    connect(target: FakeNode) {
      this.outputs.add(target)
    },
    disconnect(target?: FakeNode) {
      if (target) this.outputs.delete(target)
      else this.outputs.clear()
    },
  }
}

function fakeContext() {
  const processors: FakeProcessor[] = []
  return {
    processors,
    state: 'running',
    sampleRate: 48000,
    destination: Object.assign(fakeNode('destination'), { channelCount: 2 }),
    resume: () => Promise.resolve(),
    createGain: () => Object.assign(fakeNode('silent'), { gain: { value: 1 } }),
    createScriptProcessor(bufferSize: number, channels: number): FakeProcessor {
      const p: FakeProcessor = Object.assign(fakeNode('scriptProcessor'), { bufferSize, channels })
      processors.push(p)
      return p
    },
  }
}

function fakeEngine() {
  const audioContext = fakeContext()
  const source = fakeNode('mediaStreamSource')
  const gainNode = fakeNode('gain')
  source.connect(gainNode) // stands in for source → EQ → dynamics → gain
  return { audioContext, gainNode, source }
}

/** The fakes cover what the recorder touches; the cast marks that boundary. */
const asEngine = (engine: ReturnType<typeof fakeEngine>) => engine as unknown as RecorderEngine

function feed(processor: FakeProcessor, channels: Float32Array[]) {
  processor.onaudioprocess?.({
    inputBuffer: {
      numberOfChannels: channels.length,
      getChannelData: (ch: number) => channels[ch],
    },
  })
}

test('WAV recording taps the master gain – the end of the processing chain', async () => {
  const engine = fakeEngine()
  const rec = useOutputRecorder()
  rec.setAudioEngine(asEngine(engine))
  rec.setFormat('wav')

  assert.equal(await rec.startRecording(), true)
  assert.equal(rec.isRecording.value, true)

  const [capture] = engine.audioContext.processors
  assert.ok(engine.gainNode.outputs.has(capture), 'capture hangs behind the master gain')
  assert.ok(!engine.source.outputs.has(capture), 'the raw source is never recorded')

  // Processed samples arrive at the capture node and end up in the WAV
  feed(capture, [new Float32Array([0.5, -0.5]), new Float32Array([0.25, -0.25])])
  await rec.stopRecording()

  assert.equal(rec.isRecording.value, false)
  assert.equal(rec.hasRecording.value, true)
  assert.ok(!engine.gainNode.outputs.has(capture), 'capture detached after stop')
  assert.equal(capture.outputs.size, 0)
})

test('startRecording fails cleanly without an initialised engine', async () => {
  const rec = useOutputRecorder()
  assert.equal(await rec.startRecording(), false)
  rec.setAudioEngine({ audioContext: null, gainNode: null })
  assert.equal(await rec.startRecording(), false)
  assert.equal(rec.isRecording.value, false)
})
