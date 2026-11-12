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

// ---- Pause / resume ---------------------------------------------------------

test('WAV pause drops samples while paused and resume records again seamlessly', async () => {
  const engine = fakeEngine()
  const rec = useOutputRecorder()
  rec.setAudioEngine(asEngine(engine))
  rec.setFormat('wav')
  assert.equal(await rec.startRecording(), true)
  const [capture] = engine.audioContext.processors

  // Pause is a no-op outside a running take
  assert.equal(rec.isPaused.value, false)
  assert.equal(rec.resumeRecording(), false)

  feed(capture, [new Float32Array([0.1, 0.2])])
  assert.equal(rec.pauseRecording(), true)
  assert.equal(rec.isPaused.value, true)
  assert.equal(rec.pauseRecording(), false, 'already paused')

  // Samples arriving while paused never reach the recording
  feed(capture, [new Float32Array([0.9, 0.9, 0.9, 0.9])])
  assert.ok(engine.gainNode.outputs.has(capture), 'capture stays connected while paused')

  assert.equal(rec.resumeRecording(), true)
  assert.equal(rec.isPaused.value, false)
  feed(capture, [new Float32Array([0.3, 0.4])])
  await rec.stopRecording()
  assert.equal(rec.hasRecording.value, true)
})

test('WAV pause/resume: only the recorded frames end up in the file', async () => {
  const engine = fakeEngine()
  const rec = useOutputRecorder()
  rec.setAudioEngine(asEngine(engine))
  rec.setFormat('wav')
  rec.setBitDepth(16)
  await rec.startRecording()
  const [capture] = engine.audioContext.processors

  feed(capture, [new Float32Array([0.1, 0.2])])
  rec.pauseRecording()
  feed(capture, [new Float32Array([0.9, 0.9, 0.9, 0.9])])
  rec.resumeRecording()
  feed(capture, [new Float32Array([0.3, 0.4])])
  await rec.stopRecording()

  const blob = await captureDownloadBlob(rec)
  // 44-byte WAV header + 4 frames × 1 channel × 2 bytes
  assert.equal(blob.size, 44 + 4 * 2)
})

test('stopping a paused WAV take ends the recording and clears the pause', async () => {
  const engine = fakeEngine()
  const rec = useOutputRecorder()
  rec.setAudioEngine(asEngine(engine))
  rec.setFormat('wav')
  await rec.startRecording()
  const [capture] = engine.audioContext.processors
  feed(capture, [new Float32Array([0.1])])
  rec.pauseRecording()

  assert.equal(await rec.stopRecording(), true)
  assert.equal(rec.isRecording.value, false)
  assert.equal(rec.isPaused.value, false)
  assert.equal(rec.hasRecording.value, true)
  assert.ok(!engine.gainNode.outputs.has(capture), 'capture detached after stop')
})

test('the recording clock freezes while paused and continues on resume', async () => {
  vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date'] })
  try {
    const engine = fakeEngine()
    const rec = useOutputRecorder()
    rec.setAudioEngine(asEngine(engine))
    rec.setFormat('wav')
    await rec.startRecording()

    vi.advanceTimersByTime(2500)
    assert.equal(rec.recordingTime.value, 2)

    rec.pauseRecording()
    vi.advanceTimersByTime(10_000)
    assert.equal(rec.recordingTime.value, 2, 'no progress while paused')

    rec.resumeRecording()
    vi.advanceTimersByTime(500)
    assert.equal(rec.recordingTime.value, 3, '2.5 s + 0.5 s = 3 s, the half second is kept')
    vi.advanceTimersByTime(1000)
    assert.equal(rec.recordingTime.value, 4)

    await rec.stopRecording()
    vi.advanceTimersByTime(5000)
    assert.equal(rec.recordingTime.value, 4, 'clock stops with the take')
  } finally {
    vi.useRealTimers()
  }
})

test('WebM pause/resume maps to MediaRecorder.pause()/resume()', async () => {
  const calls: string[] = []
  class FakeMediaRecorder {
    static isTypeSupported = () => true
    state: 'inactive' | 'recording' | 'paused' = 'inactive'
    ondataavailable: ((event: { data: { size: number } }) => void) | null = null
    constructor(public stream: unknown) {}
    start() {
      this.state = 'recording'
      calls.push('start')
    }
    pause() {
      this.state = 'paused'
      calls.push('pause')
    }
    resume() {
      this.state = 'recording'
      calls.push('resume')
    }
    stop() {
      this.state = 'inactive'
      calls.push('stop')
    }
  }
  vi.stubGlobal('MediaRecorder', FakeMediaRecorder)
  try {
    const engine = fakeEngine()
    const destination = Object.assign(fakeNode('mediaStreamDestination'), { stream: {} })
    Object.assign(engine.audioContext, { createMediaStreamDestination: () => destination })
    const rec = useOutputRecorder()
    rec.setAudioEngine(asEngine(engine))
    rec.setFormat('webm')

    assert.equal(await rec.startRecording(), true)
    assert.equal(rec.pauseRecording(), true)
    assert.equal(rec.pauseRecording(), false)
    assert.equal(rec.resumeRecording(), true)
    assert.equal(rec.resumeRecording(), false)
    rec.pauseRecording()
    await rec.stopRecording()
    assert.deepEqual(calls, ['start', 'pause', 'resume', 'pause', 'stop'])
    assert.equal(rec.isPaused.value, false)
  } finally {
    vi.unstubAllGlobals()
  }
})

/** Run saveRecordingAs() against a stubbed DOM and return the blob it downloads. */
async function captureDownloadBlob(rec: ReturnType<typeof useOutputRecorder>): Promise<Blob> {
  let blob: Blob | null = null
  vi.stubGlobal('URL', {
    createObjectURL: (b: Blob) => {
      blob = b
      return 'blob:fake'
    },
    revokeObjectURL: () => {},
  })
  vi.stubGlobal('document', {
    createElement: () => ({ style: {}, click() {} }),
    body: { appendChild() {}, removeChild() {} },
  })
  try {
    const result = await rec.saveRecordingAs('take')
    assert.equal(result.ok, true)
  } finally {
    vi.unstubAllGlobals()
  }
  assert.ok(blob, 'download produced a blob')
  return blob
}
