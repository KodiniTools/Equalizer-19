import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  getNextIndex,
  getPrevIndex,
  nextRepeatMode,
  moveItem,
  indexAfterMove,
  formatTime,
} from '../src/utils/playbackOrder.js'

test('getNextIndex: sequential, end of list', () => {
  assert.equal(getNextIndex(3, 0, false, 'off'), 1)
  assert.equal(getNextIndex(3, 2, false, 'off'), -1)
  assert.equal(getNextIndex(3, 2, false, 'all'), 0)
  assert.equal(getNextIndex(3, -1, false, 'off'), 0)
  assert.equal(getNextIndex(0, -1, false, 'all'), -1)
})

test('getNextIndex: shuffle never repeats the current track', () => {
  const values = [0.1, 0.1, 0.9] // → 0, 0, 2 with length 3
  let i = 0
  const random = () => values[i++]
  assert.equal(getNextIndex(3, 0, true, 'off', random), 2)
})

test('getNextIndex: shuffle with a single track depends on repeat', () => {
  assert.equal(getNextIndex(1, 0, true, 'off'), -1)
  assert.equal(getNextIndex(1, 0, true, 'all'), 0)
  assert.equal(getNextIndex(1, 0, true, 'one'), 0)
})

test('getPrevIndex: start of list wraps only with repeat all', () => {
  assert.equal(getPrevIndex(3, 2, 'off'), 1)
  assert.equal(getPrevIndex(3, 0, 'off'), -1)
  assert.equal(getPrevIndex(3, 0, 'all'), 2)
  assert.equal(getPrevIndex(0, -1, 'all'), -1)
})

test('nextRepeatMode cycles off → all → one → off', () => {
  assert.equal(nextRepeatMode('off'), 'all')
  assert.equal(nextRepeatMode('all'), 'one')
  assert.equal(nextRepeatMode('one'), 'off')
})

test('moveItem returns a reordered copy', () => {
  const items = ['a', 'b', 'c', 'd']
  assert.deepEqual(moveItem(items, 0, 2), ['b', 'c', 'a', 'd'])
  assert.deepEqual(moveItem(items, 3, 1), ['a', 'd', 'b', 'c'])
  assert.deepEqual(items, ['a', 'b', 'c', 'd'])
})

test('indexAfterMove keeps the current track selected', () => {
  const items = ['a', 'b', 'c', 'd']
  for (let current = 0; current < items.length; current++) {
    for (let from = 0; from < items.length; from++) {
      for (let to = 0; to < items.length; to++) {
        if (from === to) continue
        const moved = moveItem(items, from, to)
        assert.equal(moved[indexAfterMove(current, from, to)], items[current])
      }
    }
  }
  assert.equal(indexAfterMove(-1, 0, 2), -1)
})

test('formatTime', () => {
  assert.equal(formatTime(0), '0:00')
  assert.equal(formatTime(61.9), '1:01')
  assert.equal(formatTime(600), '10:00')
  assert.equal(formatTime(NaN), '0:00')
  assert.equal(formatTime(Infinity), '0:00')
})
