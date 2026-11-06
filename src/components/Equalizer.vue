<template>
  <div class="equalizer">
    <EqPresetControls
      v-model="selectedPreset"
      :custom-presets="customPresets"
      :bypassed="isEqBypassed"
      :saving="showSaveForm"
      @change="handlePresetChange"
      @toggle-bypass="toggleBypass"
      @delete="deleteSelectedCustomPreset"
      @save="showSaveForm = true"
      @reset="resetEqualizer"
    />

    <EqPresetForm v-if="showSaveForm" @save="confirmSavePreset" @cancel="cancelSavePreset" />

    <EqBands :bands="localBands" :disabled="isEqBypassed" @change="handleGainChange" />
  </div>
</template>

<script setup lang="ts">
  import { ref, watch, computed, onMounted } from 'vue'
  import { EQ_PRESETS, EQ_BAND_FREQUENCIES } from '../utils/presets'
  import { useCustomPresets, isCustomPresetId } from '../composables/useCustomPresets'
  import EqPresetControls from './equalizer/EqPresetControls.vue'
  import EqPresetForm from './equalizer/EqPresetForm.vue'
  import EqBands, { type EqBandView } from './equalizer/EqBands.vue'
  import { useAudioEngineStore } from '../stores/audioEngine'
  import { useToastStore } from '../stores/toast'
  import { injectI18n } from '../composables/useI18n'

  /**
   * Container des 19-Band-Equalizers: hält Bänder, Preset-Auswahl und das
   * Speichern-Formular und spricht mit dem Engine-Store. Die Darstellung liegt
   * in components/equalizer/.
   */
  const { t } = injectI18n()

  const audioEngine = useAudioEngineStore()
  const { notify } = useToastStore()

  const localBands = ref<EqBandView[]>(
    EQ_BAND_FREQUENCIES.map((frequency) => ({ frequency, gain: 0 }))
  )

  const selectedPreset = ref('')
  // Mirrors the engine so external changes (undo/redo) are reflected as well
  const isEqBypassed = computed(() => audioEngine.eqBypass)

  // Custom presets
  const { customPresets, loadCustomPresets, findPreset, addPreset, removePreset } =
    useCustomPresets()
  const showSaveForm = ref(false)

  const isCustomSelected = computed(() => isCustomPresetId(selectedPreset.value))

  function confirmSavePreset(name: string): void {
    const gains = localBands.value.map((b) => b.gain)
    selectedPreset.value = addPreset(name, gains).id
    showSaveForm.value = false
    notify(t.value.eq_preset_saved.replace('{name}', name), 'success')
  }

  function cancelSavePreset(): void {
    showSaveForm.value = false
  }

  function deleteSelectedCustomPreset(): void {
    const preset = removePreset(selectedPreset.value)
    if (!preset) return
    selectedPreset.value = ''
    notify(t.value.eq_preset_deleted.replace('{name}', preset.name), 'info')
  }

  // Gains of the preset currently shown in the dropdown (built-in or custom)
  function selectedPresetGains(): readonly number[] | null {
    if (!selectedPreset.value) return null
    if (isCustomSelected.value) return findPreset(selectedPreset.value)?.gains ?? null
    return EQ_PRESETS[selectedPreset.value] ?? null
  }

  // Sync with audioEngine (sliders, presets, undo/redo all end up here)
  watch(
    () => audioEngine.eqBands,
    (newBands) => {
      if (newBands && newBands.length === 19) {
        localBands.value = newBands.map((band) => ({
          frequency: band.frequency,
          gain: band.gain,
        }))
        // Drop the preset name once the curve no longer matches it
        const presetGains = selectedPresetGains()
        if (presetGains && !presetGains.every((gain, i) => gain === newBands[i].gain)) {
          selectedPreset.value = ''
        }
      }
    },
    { deep: true, immediate: true }
  )

  function handleGainChange(index: number, value: number): void {
    if (localBands.value[index]) {
      localBands.value[index].gain = value
    }
    audioEngine.updateEqBand(index, value)
    selectedPreset.value = ''
  }

  function handlePresetChange(): void {
    if (!selectedPreset.value) return

    if (isCustomSelected.value) {
      const preset = findPreset(selectedPreset.value)
      if (preset) {
        applyGains(preset.gains)
        notify(t.value.eq_preset_applied.replace('{name}', preset.name), 'success')
      }
      return
    }

    audioEngine.applyEqPreset(selectedPreset.value)
    localBands.value = audioEngine.eqBands.map((band) => ({
      frequency: band.frequency,
      gain: band.gain,
    }))
    notify(t.value.eq_preset_applied.replace('{name}', selectedPreset.value), 'success')
  }

  function applyGains(gains: readonly number[]): void {
    gains.forEach((gain, index) => {
      if (localBands.value[index]) localBands.value[index].gain = gain
      audioEngine.updateEqBand(index, gain)
    })
  }

  function toggleBypass(): void {
    audioEngine.toggleEqBypass()
    notify(isEqBypassed.value ? t.value.eq_bypassed : t.value.eq_active, 'info')
  }

  function resetEqualizer(): void {
    audioEngine.resetEq()
    localBands.value.forEach((band) => {
      band.gain = 0
    })
    selectedPreset.value = ''
    notify(t.value.eq_reset_done, 'info')
  }

  onMounted(() => {
    loadCustomPresets()
  })
</script>

<style scoped>
  .equalizer {
    background: var(--card-bg);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: 12px;
  }

  @media (max-width: 600px) {
    .equalizer {
      padding: 10px;
    }
  }

  @media (max-width: 400px) {
    .equalizer {
      padding: 8px;
    }
  }
</style>
