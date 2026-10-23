import { test } from 'node:test'
import assert from 'node:assert/strict'
import { RECEIVABLE_SOURCES, isReceivableSource } from '../src/utils/sharedFileRepository.js'

test('isReceivableSource accepts the converter and the audio cutter', () => {
  assert.deepEqual(RECEIVABLE_SOURCES, ['audiokonverter', 'audio-cutter'])
  assert.equal(isReceivableSource('audiokonverter'), true)
  assert.equal(isReceivableSource('audio-cutter'), true)
})

test('isReceivableSource rejects unknown, missing and non-string sources', () => {
  assert.equal(isReceivableSource('equalizer'), false)
  assert.equal(isReceivableSource(undefined), false)
  assert.equal(isReceivableSource(['audio-cutter']), false)
})
