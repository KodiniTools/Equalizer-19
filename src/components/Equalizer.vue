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

<script setup>
  import { ref, inject, watch, computed, onMounted } from 'vue'
  import { EQ_PRESETS, EQ_BAND_FREQUENCIES } from '../utils/presets'
  import { useCustomPresets, isCustomPresetId } from '../composables/useCustomPresets'
  import EqPresetControls from './equalizer/EqPresetControls.vue'
  import EqPresetForm from './equalizer/EqPresetForm.vue'
  import EqBands from './equalizer/EqBands.vue'
  import { useAudioEngineStore } from '../stores/audioEngine'
  import { useToastStore } from '../stores/toast'

  /**
   * Container des 19-Band-Equalizers: hält Bänder, Preset-Auswahl und das
   * Speichern-Formular und spricht mit dem Engine-Store. Die Darstellung liegt
   * in components/equalizer/.
   */
  const { t } = inject('i18n')

  const audioEngine = useAudioEngineStore()
  const { notify } = useToastStore()

  const localBands = ref(EQ_BAND_FREQUENCIES.map((frequency) => ({ frequency, gain: 0 })))

  const selectedPreset = ref('')
  // Mirrors the engine so external changes (undo/redo) are reflected as well
  const isEqBypassed = computed(() => audioEngine.eqBypass)

  // Custom presets
  const { customPresets, loadCustomPresets, findPreset, addPreset, removePreset } =
    useCustomPresets()
  const showSaveForm = ref(false)

  const isCustomSelected = computed(() => isCustomPresetId(selectedPreset.value))

  function confirmSavePreset(name) {
    const gains = localBands.value.map((b) => b.gain)
    selectedPreset.value = addPreset(name, gains).id
    showSaveForm.value = false
    notify(t.value.eq_preset_saved.replace('{name}', name), 'success')
  }

  function cancelSavePreset() {
    showSaveForm.value = false
  }

  function deleteSelectedCustomPreset() {
    const preset = removePreset(selectedPreset.value)
    if (!preset) return
    selectedPreset.value = ''
    notify(t.value.eq_preset_deleted.replace('{name}', preset.name), 'info')
  }

  // Gains of the preset currently shown in the dropdown (built-in or custom)
  function selectedPresetGains() {
    if (!selectedPreset.value) return null
    if (isCustomSelected.value) return findPreset(selectedPreset.value)?.gains ?? null
    return EQ_PRESETS[selectedPreset.value] ?? null
  }

  // Sync with audioEngine (sliders, presets, undo/redo all end up here)
  if (audioEngine && audioEngine.eqBands) {
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
  }

  function handleGainChange(index, value) {
    if (localBands.value && localBands.value[index]) {
      localBands.value[index].gain = value
    }
    if (audioEngine && audioEngine.updateEqBand) {
      audioEngine.updateEqBand(index, value)
    }
    selectedPreset.value = ''
  }

  function handlePresetChange() {
    if (!selectedPreset.value) return

    if (isCustomSelected.value) {
      const preset = findPreset(selectedPreset.value)
      if (preset) {
        applyGains(preset.gains)
        notify(t.value.eq_preset_applied.replace('{name}', preset.name), 'success')
      }
      return
    }

    if (audioEngine && audioEngine.applyEqPreset) {
      audioEngine.applyEqPreset(selectedPreset.value)
      if (audioEngine.eqBands) {
        localBands.value = audioEngine.eqBands.map((band) => ({
          frequency: band.frequency,
          gain: band.gain,
        }))
      }
      notify(t.value.eq_preset_applied.replace('{name}', selectedPreset.value), 'success')
    }
  }

  function applyGains(gains) {
    gains.forEach((gain, index) => {
      if (localBands.value[index]) localBands.value[index].gain = gain
      if (audioEngine && audioEngine.updateEqBand) audioEngine.updateEqBand(index, gain)
    })
  }

  function toggleBypass() {
    if (audioEngine && audioEngine.toggleEqBypass) {
      audioEngine.toggleEqBypass()
      notify(isEqBypassed.value ? t.value.eq_bypassed : t.value.eq_active, 'info')
    }
  }

  function resetEqualizer() {
    if (audioEngine && audioEngine.resetEq) {
      audioEngine.resetEq()
      localBands.value.forEach((band) => {
        band.gain = 0
      })
      selectedPreset.value = ''
      notify(t.value.eq_reset_done, 'info')
    }
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
