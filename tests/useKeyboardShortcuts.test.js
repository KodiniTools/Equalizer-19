import { test } from 'node:test'
import assert from 'node:assert/strict'
import { historyActionForKey } from '../src/composables/useKeyboardShortcuts.js'

const ev = (key, mods = {}) => ({
  key,
  ctrlKey: false,
  metaKey: false,
  shiftKey: false,
  altKey: false,
  ...mods,
})

test('Ctrl+Z / Cmd+Z undo, Ctrl+Shift+Z / Cmd+Shift+Z and Ctrl+Y redo', () => {
  assert.equal(historyActionForKey(ev('z', { ctrlKey: true })), 'undo')
  assert.equal(historyActionForKey(ev('z', { metaKey: true })), 'undo')
  assert.equal(historyActionForKey(ev('Z', { ctrlKey: true, shiftKey: true })), 'redo')
  assert.equal(historyActionForKey(ev('Z', { metaKey: true, shiftKey: true })), 'redo')
  assert.equal(historyActionForKey(ev('y', { ctrlKey: true })), 'redo')
})

test('plain letters, Alt chords and other keys are ignored', () => {
  assert.equal(historyActionForKey(ev('z')), null)
  assert.equal(historyActionForKey(ev('y')), null)
  assert.equal(historyActionForKey(ev('z', { ctrlKey: true, altKey: true })), null)
  assert.equal(historyActionForKey(ev('Y', { ctrlKey: true, shiftKey: true })), null)
  assert.equal(historyActionForKey(ev('s', { ctrlKey: true })), null)
  assert.equal(historyActionForKey(ev(undefined, { ctrlKey: true })), null)
})

test('relies on the printed key, so QWERTZ layouts are not swapped', () => {
  // On a German keyboard the key labelled Z reports code "KeyY" but key "z"
  assert.equal(historyActionForKey({ ...ev('z', { ctrlKey: true }), code: 'KeyY' }), 'undo')
  assert.equal(historyActionForKey({ ...ev('y', { ctrlKey: true }), code: 'KeyZ' }), 'redo')
})
