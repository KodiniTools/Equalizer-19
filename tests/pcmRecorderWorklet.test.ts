// @vitest-environment node
import { test, vi } from 'vitest'
import assert from 'node:assert/strict'

/**
 * Runs the pcm-recorder AudioWorklet processor outside a real AudioWorklet:
 * the globals it expects (AudioWorkletProcessor, registerProcessor) are stubbed
 * and the registered class is driven by hand.
 */
interface Processor {
  port: {
    onmessage: ((event: { data: unknown }) => void) | null
    postMessage: (msg: unknown) => void
  }
  process(inputs: Float32Array[][]): boolean
}

async function loadProcessor(): Promise<{ create: () => Processor; posted: unknown[] }> {
  const posted: unknown[] = []
  let registered: (new (options: unknown) => Processor) | null = null
  class FakeAudioWorkletProcessor {
    port = {
      onmessage: null as Processor['port']['onmessage'],
      postMessage: (msg: unknown) => posted.push(msg),
    }
  }
  vi.stubGlobal('AudioWorkletProcessor', FakeAudioWorkletProcessor)
  vi.stubGlobal('registerProcessor', (_name: string, cls: typeof registered) => {
    registered = cls
  })
  vi.resetModules()
  // Plain JS module without types: it only registers the processor as a side effect
  // @ts-expect-error – no declaration file for the worklet
  await import('../src/worklets/pcm-recorder.worklet.js')
  vi.unstubAllGlobals()
  assert.ok(registered, 'worklet registered its processor')
  const cls = registered as new (options: unknown) => Processor
  return { create: () => new cls({ processorOptions: { channelCount: 1 } }), posted }
}

const recordedFrames = (posted: unknown[]) =>
  posted
    .filter(
      (m): m is { type: 'data'; channels: Float32Array[] } =>
        typeof m === 'object' && m !== null && (m as { type?: string }).type === 'data'
    )
    .reduce((n, m) => n + m.channels[0].length, 0)

test('paused: samples are dropped, resume continues in the same buffer', async () => {
  const { create, posted } = await loadProcessor()
  const p = create()
  const block = (value: number) => [[new Float32Array(128).fill(value)]]

  assert.equal(p.process(block(0.1)), true)
  p.port.onmessage?.({ data: 'pause' })
  assert.equal(p.process(block(0.9)), true, 'the node stays alive while paused')
  assert.equal(p.process(block(0.9)), true)
  p.port.onmessage?.({ data: 'resume' })
  assert.equal(p.process(block(0.2)), true)
  p.port.onmessage?.({ data: 'stop' })

  assert.equal(recordedFrames(posted), 256, 'only the two unpaused blocks were recorded')
  const data = posted.find((m) => (m as { type: string }).type === 'data') as {
    channels: Float32Array[]
  }
  assert.equal(data.channels[0][0], Float32Array.from([0.1])[0])
  assert.equal(data.channels[0][128], Float32Array.from([0.2])[0], 'no gap between the blocks')
  assert.deepEqual(posted.at(-1), { type: 'done' })
  assert.equal(p.process(block(0.3)), false, 'stopped')
})
