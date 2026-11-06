// @vitest-environment node
import { test, vi } from 'vitest'
import assert from 'node:assert/strict'
import { useCountdown, START_DELAYS } from '../src/composables/useCountdown'

test('offers 0, 3, 5 and 10 seconds', () => {
  assert.deepEqual(START_DELAYS, [0, 3, 5, 10])
})

test('delay 0 starts immediately', () => {
  const c = useCountdown()
  let done = 0
  c.start(0, () => done++)
  assert.equal(done, 1)
  assert.equal(c.isCounting.value, false)
})

test('counts down whole seconds and fires once at zero', () => {
  vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] })
  try {
    const c = useCountdown()
    let done = 0
    c.start(3, () => done++)
    assert.equal(c.remaining.value, 3)
    assert.equal(c.total.value, 3)
    assert.equal(c.isCounting.value, true)
    vi.advanceTimersByTime(1000)
    assert.equal(c.remaining.value, 2)
    vi.advanceTimersByTime(1000)
    assert.equal(c.remaining.value, 1)
    assert.equal(done, 0)
    vi.advanceTimersByTime(1000)
    assert.equal(c.remaining.value, 0)
    assert.equal(done, 1)
    vi.advanceTimersByTime(5000)
    assert.equal(done, 1)
  } finally {
    vi.useRealTimers()
  }
})

test('cancel stops the countdown without firing', () => {
  vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] })
  try {
    const c = useCountdown()
    let done = 0
    c.start(5, () => done++)
    vi.advanceTimersByTime(2000)
    c.cancel()
    assert.equal(c.isCounting.value, false)
    vi.advanceTimersByTime(10000)
    assert.equal(done, 0)
  } finally {
    vi.useRealTimers()
  }
})

test('restarting replaces a running countdown', () => {
  vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] })
  try {
    const c = useCountdown()
    const fired = []
    c.start(10, () => fired.push('first'))
    vi.advanceTimersByTime(1000)
    c.start(3, () => fired.push('second'))
    vi.advanceTimersByTime(10000)
    assert.deepEqual(fired, ['second'])
  } finally {
    vi.useRealTimers()
  }
})
