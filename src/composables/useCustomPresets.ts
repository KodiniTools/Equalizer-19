import { ref } from 'vue'

const STORAGE_KEY = 'eq19_custom_presets'
const CUSTOM_PREFIX = '__custom__'

/** A user-defined EQ preset; `gains` holds one dB value per band. */
export interface CustomPreset {
  id: string
  name: string
  gains: number[]
}

/** The part of the Storage interface the composable uses (injectable for tests). */
export type PresetStorage = Pick<Storage, 'getItem' | 'setItem'>

/**
 * True for ids created by addPreset (distinguishes them from built-in preset names).
 */
export function isCustomPresetId(id: unknown): id is string {
  return typeof id === 'string' && id.startsWith(CUSTOM_PREFIX)
}

/**
 * User-defined EQ presets ({ id, name, gains[] }) persisted in localStorage.
 *
 * @param storage storage backend, injectable for tests
 */
export function useCustomPresets(storage: PresetStorage = globalThis.localStorage) {
  const customPresets = ref<CustomPreset[]>([])

  function loadCustomPresets(): void {
    try {
      const raw = storage.getItem(STORAGE_KEY)
      if (raw) customPresets.value = JSON.parse(raw) as CustomPreset[]
    } catch {
      customPresets.value = []
    }
  }

  function persist(): void {
    storage.setItem(STORAGE_KEY, JSON.stringify(customPresets.value))
  }

  function findPreset(id: string): CustomPreset | undefined {
    return customPresets.value.find((p) => p.id === id)
  }

  /**
   * Store a new preset and return it.
   */
  function addPreset(name: string, gains: number[]): CustomPreset {
    const preset: CustomPreset = { id: `${CUSTOM_PREFIX}${Date.now()}`, name, gains }
    customPresets.value.push(preset)
    persist()
    return preset
  }

  /**
   * Remove a preset by id. Returns the removed preset, or null if unknown.
   */
  function removePreset(id: string): CustomPreset | null {
    const preset = findPreset(id)
    if (!preset) return null
    customPresets.value = customPresets.value.filter((p) => p.id !== id)
    persist()
    return preset
  }

  return { customPresets, loadCustomPresets, findPreset, addPreset, removePreset }
}
