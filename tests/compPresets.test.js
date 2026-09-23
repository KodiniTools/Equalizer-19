import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  COMP_PRESETS,
  COMP_PRESET_GROUPS,
  DEFAULT_DYNAMICS,
  compPresetToDynamics,
  findCompPreset,
} from '../src/utils/presets.js'

test('every compressor preset is listed in exactly one group', () => {
  const grouped = COMP_PRESET_GROUPS.flatMap((g) => g.presets)
  assert.deepEqual([...grouped].sort(), Object.keys(COMP_PRESETS).sort())
  assert.equal(new Set(grouped).size, grouped.length)
})

test('compPresetToDynamics converts ms to seconds', () => {
  assert.deepEqual(compPresetToDynamics(COMP_PRESETS.Limiter), {
    threshold: -6,
    ratio: 20,
    knee: 0,
    attack: 0.0005,
    release: 0.01,
  })
})

test('findCompPreset recognises every preset uniquely', () => {
  for (const name of Object.keys(COMP_PRESETS)) {
    assert.equal(findCompPreset(compPresetToDynamics(COMP_PRESETS[name])), name)
  }
})

test('findCompPreset returns "" for defaults and manual changes', () => {
  assert.equal(findCompPreset(DEFAULT_DYNAMICS), '')
  assert.equal(findCompPreset({ ...compPresetToDynamics(COMP_PRESETS.Rock), threshold: -21 }), '')
  assert.equal(findCompPreset(null), '')
})
