import { test, mock } from 'node:test'
import assert from 'node:assert/strict'
import { useOutputRecorder } from '../src/composables/useOutputRecorder.js'

mock.method(console, 'error', () => {})

// ---- Fake Web Audio (no AudioWorklet → ScriptProcessor path) -----------------
function fakeNode(name) {
  return {
    name,
    outputs: new Set(),
    connect(target) {
      this.outputs.add(target)
    },
    disconnect(target) {
      if (target) this.outputs.delete(target)
      else this.outputs.clear()
    },
  }
}

function fakeContext() {
  const processors = []
  return {
    processors,
    state: 'running',
    sampleRate: 48000,
    destination: Object.assign(fakeNode('destination'), { channelCount: 2 }),
    resume: () => Promise.resolve(),
    createGain: () => Object.assign(fakeNode('silent'), { gain: { value: 1 } }),
    createScriptProcessor(bufferSize, channels) {
      const p = Object.assign(fakeNode('scriptProcessor'), { bufferSize, channels })
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
  return { audioContext: { value: audioContext }, gainNode: { value: gainNode }, source }
}

function feed(processor, channels) {
  processor.onaudioprocess({
    inputBuffer: {
      numberOfChannels: channels.length,
      getChannelData: (ch) => channels[ch],
    },
  })
}

test('WAV recording taps the master gain – the end of the processing chain', async () => {
  const engine = fakeEngine()
  const rec = useOutputRecorder()
  rec.setAudioEngine(engine)
  rec.setFormat('wav')

  assert.equal(await rec.startRecording(), true)
  assert.equal(rec.isRecording.value, true)

  const [capture] = engine.audioContext.value.processors
  assert.ok(engine.gainNode.value.outputs.has(capture), 'capture hangs behind the master gain')
  assert.ok(!engine.source.outputs.has(capture), 'the raw source is never recorded')

  // Processed samples arrive at the capture node and end up in the WAV
  feed(capture, [new Float32Array([0.5, -0.5]), new Float32Array([0.25, -0.25])])
  await rec.stopRecording()

  assert.equal(rec.isRecording.value, false)
  assert.equal(rec.hasRecording.value, true)
  assert.ok(!engine.gainNode.value.outputs.has(capture), 'capture detached after stop')
  assert.equal(capture.outputs.size, 0)
})

test('startRecording fails cleanly without an initialised engine', async () => {
  const rec = useOutputRecorder()
  assert.equal(await rec.startRecording(), false)
  rec.setAudioEngine({ audioContext: { value: null }, gainNode: { value: null } })
  assert.equal(await rec.startRecording(), false)
  assert.equal(rec.isRecording.value, false)
})
