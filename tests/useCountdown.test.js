import { test, mock } from 'node:test'
import assert from 'node:assert/strict'
import { useCountdown, START_DELAYS } from '../src/composables/useCountdown.js'

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
  mock.timers.enable({ apis: ['setInterval'] })
  try {
    const c = useCountdown()
    let done = 0
    c.start(3, () => done++)
    assert.equal(c.remaining.value, 3)
    assert.equal(c.total.value, 3)
    assert.equal(c.isCounting.value, true)
    mock.timers.tick(1000)
    assert.equal(c.remaining.value, 2)
    mock.timers.tick(1000)
    assert.equal(c.remaining.value, 1)
    assert.equal(done, 0)
    mock.timers.tick(1000)
    assert.equal(c.remaining.value, 0)
    assert.equal(done, 1)
    mock.timers.tick(5000)
    assert.equal(done, 1)
  } finally {
    mock.timers.reset()
  }
})

test('cancel stops the countdown without firing', () => {
  mock.timers.enable({ apis: ['setInterval'] })
  try {
    const c = useCountdown()
    let done = 0
    c.start(5, () => done++)
    mock.timers.tick(2000)
    c.cancel()
    assert.equal(c.isCounting.value, false)
    mock.timers.tick(10000)
    assert.equal(done, 0)
  } finally {
    mock.timers.reset()
  }
})

test('restarting replaces a running countdown', () => {
  mock.timers.enable({ apis: ['setInterval'] })
  try {
    const c = useCountdown()
    const fired = []
    c.start(10, () => fired.push('first'))
    mock.timers.tick(1000)
    c.start(3, () => fired.push('second'))
    mock.timers.tick(10000)
    assert.deepEqual(fired, ['second'])
  } finally {
    mock.timers.reset()
  }
})
