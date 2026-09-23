import { test, mock } from 'node:test'
import assert from 'node:assert/strict'
import { loadWorkletModule } from '../src/utils/workletLoader.js'

mock.method(console, 'warn', () => {})

const URL_A = 'https://example.test/a.worklet.js'
const TIMEOUT = 20
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// Fake context whose addModule calls are resolved/rejected by the test
function fakeContext() {
  const calls = []
  return {
    calls,
    audioWorklet: {
      addModule: () =>
        new Promise((resolve, reject) => {
          calls.push({ resolve, reject })
        }),
    },
  }
}

test('no audioWorklet support → false', async () => {
  assert.equal(await loadWorkletModule({}, URL_A, TIMEOUT), false)
})

test('successful load is cached per context', async () => {
  const ctx = fakeContext()
  const first = loadWorkletModule(ctx, URL_A, TIMEOUT)
  ctx.calls[0].resolve()
  assert.equal(await first, true)
  assert.equal(await loadWorkletModule(ctx, URL_A, TIMEOUT), true)
  assert.equal(ctx.calls.length, 1)
})

test('failed load → false and is retried next time', async () => {
  const ctx = fakeContext()
  const first = loadWorkletModule(ctx, URL_A, TIMEOUT)
  ctx.calls[0].reject(new Error('404'))
  assert.equal(await first, false)

  const second = loadWorkletModule(ctx, URL_A, TIMEOUT)
  assert.equal(ctx.calls.length, 2)
  ctx.calls[1].resolve()
  assert.equal(await second, true)
})

test('hanging load times out, is not awaited again, and is used once it completes', async () => {
  const ctx = fakeContext()
  assert.equal(await loadWorkletModule(ctx, URL_A, TIMEOUT), false)

  // Still pending: immediate fallback without a second wait or second request
  const t0 = Date.now()
  assert.equal(await loadWorkletModule(ctx, URL_A, 1000), false)
  assert.ok(Date.now() - t0 < 100)
  assert.equal(ctx.calls.length, 1)

  // The late load finishes → worklet available from now on
  ctx.calls[0].resolve()
  await sleep(0)
  assert.equal(await loadWorkletModule(ctx, URL_A, TIMEOUT), true)
  assert.equal(ctx.calls.length, 1)
})

test('a slow but successful load within the timeout → true', async () => {
  const ctx = fakeContext()
  const pending = loadWorkletModule(ctx, URL_A, 200)
  await sleep(20)
  ctx.calls[0].resolve()
  assert.equal(await pending, true)
})
