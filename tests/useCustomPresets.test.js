import { test } from 'node:test'
import assert from 'node:assert/strict'
import { useCustomPresets, isCustomPresetId } from '../src/composables/useCustomPresets.js'

function memoryStorage(initial = {}) {
  const data = new Map(Object.entries(initial))
  return {
    getItem: (k) => (data.has(k) ? data.get(k) : null),
    setItem: (k, v) => data.set(k, String(v)),
    data,
  }
}

test('isCustomPresetId distinguishes custom ids from built-in names', () => {
  assert.equal(isCustomPresetId('__custom__123'), true)
  assert.equal(isCustomPresetId('Rock'), false)
  assert.equal(isCustomPresetId(''), false)
  assert.equal(isCustomPresetId(undefined), false)
})

test('add, find, remove and persist presets', () => {
  const storage = memoryStorage()
  const { customPresets, addPreset, findPreset, removePreset } = useCustomPresets(storage)

  const preset = addPreset('Mine', [1, 2, 3])
  assert.equal(isCustomPresetId(preset.id), true)
  assert.deepEqual(findPreset(preset.id), preset)
  assert.deepEqual(JSON.parse(storage.data.get('eq19_custom_presets')), [preset])

  assert.equal(removePreset('__custom__unknown'), null)
  assert.deepEqual(removePreset(preset.id), preset)
  assert.equal(customPresets.value.length, 0)
  assert.equal(storage.data.get('eq19_custom_presets'), '[]')
})

test('loadCustomPresets reads stored presets and tolerates corrupt data', () => {
  const stored = [{ id: '__custom__1', name: 'A', gains: [0] }]
  const ok = useCustomPresets(memoryStorage({ eq19_custom_presets: JSON.stringify(stored) }))
  ok.loadCustomPresets()
  assert.deepEqual(ok.customPresets.value, stored)

  const broken = useCustomPresets(memoryStorage({ eq19_custom_presets: '{not json' }))
  broken.loadCustomPresets()
  assert.deepEqual(broken.customPresets.value, [])

  const empty = useCustomPresets(memoryStorage())
  empty.loadCustomPresets()
  assert.deepEqual(empty.customPresets.value, [])
})
