import { ref } from 'vue'

const STORAGE_KEY = 'eq19_custom_presets'
const CUSTOM_PREFIX = '__custom__'

/**
 * True for ids created by addPreset (distinguishes them from built-in preset names).
 */
export function isCustomPresetId(id) {
  return typeof id === 'string' && id.startsWith(CUSTOM_PREFIX)
}

/**
 * User-defined EQ presets ({ id, name, gains[] }) persisted in localStorage.
 *
 * @param {Storage} [storage] storage backend, injectable for tests
 */
export function useCustomPresets(storage = globalThis.localStorage) {
  const customPresets = ref([])

  function loadCustomPresets() {
    try {
      const raw = storage.getItem(STORAGE_KEY)
      if (raw) customPresets.value = JSON.parse(raw)
    } catch (_e) {
      customPresets.value = []
    }
  }

  function persist() {
    storage.setItem(STORAGE_KEY, JSON.stringify(customPresets.value))
  }

  function findPreset(id) {
    return customPresets.value.find((p) => p.id === id)
  }

  /**
   * Store a new preset and return it.
   */
  function addPreset(name, gains) {
    const preset = { id: `${CUSTOM_PREFIX}${Date.now()}`, name, gains }
    customPresets.value.push(preset)
    persist()
    return preset
  }

  /**
   * Remove a preset by id. Returns the removed preset, or null if unknown.
   */
  function removePreset(id) {
    const preset = findPreset(id)
    if (!preset) return null
    customPresets.value = customPresets.value.filter((p) => p.id !== id)
    persist()
    return preset
  }

  return { customPresets, loadCustomPresets, findPreset, addPreset, removePreset }
}
