<template>
  <div class="equalizer">
    <div class="eq-header">
      <button
        @click="toggleBypass"
        :class="['toggle-btn', { active: !isEqBypassed }]"
        :aria-label="t.a11y_eq_bypass"
        :aria-pressed="!isEqBypassed"
      >
        <i :class="!isEqBypassed ? 'fas fa-toggle-on' : 'fas fa-toggle-off'" aria-hidden="true"></i>
      </button>

      <select
        @change="handlePresetChange"
        v-model="selectedPreset"
        class="preset-select"
        :aria-label="t.a11y_eq_select_preset"
      >
        <option value="">Custom</option>
        <optgroup :label="t.eq_builtin_group">
          <option v-for="(_, name) in EQ_PRESETS" :key="name" :value="name">{{ name }}</option>
        </optgroup>
        <optgroup v-if="customPresets.length" :label="t.eq_custom_group">
          <option v-for="p in customPresets" :key="p.id" :value="p.id">{{ p.name }}</option>
        </optgroup>
      </select>

      <!-- Delete custom preset -->
      <button
        v-if="isCustomSelected"
        @click="deleteSelectedCustomPreset"
        class="icon-btn delete-btn"
        :title="t.eq_preset_delete"
        :aria-label="t.eq_preset_delete"
      >
        <i class="fas fa-trash-alt" aria-hidden="true"></i>
      </button>

      <!-- Save preset button -->
      <button
        v-if="!showSaveForm"
        @click="showSaveForm = true"
        class="icon-btn save-btn"
        :title="t.eq_preset_save_title"
        :aria-label="t.eq_preset_save_title"
      >
        <i class="fas fa-floppy-disk" aria-hidden="true"></i>
      </button>

      <button @click="resetEqualizer" class="icon-btn reset-btn" :title="t.reset" :aria-label="t.reset">
        <i class="fas fa-undo" aria-hidden="true"></i>
      </button>
    </div>

    <!-- Inline save form -->
    <div v-if="showSaveForm" class="save-form">
      <input
        v-model="newPresetName"
        @keydown.enter="confirmSavePreset"
        @keydown.escape="cancelSavePreset"
        :placeholder="t.eq_preset_name_placeholder"
        :aria-label="t.a11y_eq_save_name"
        class="preset-name-input"
        maxlength="32"
        ref="presetNameInput"
      />
      <button
        @click="confirmSavePreset"
        class="icon-btn save-confirm-btn"
        :disabled="!newPresetName.trim()"
        :title="t.eq_save"
        :aria-label="t.eq_save"
      >
        <i class="fas fa-check" aria-hidden="true"></i>
      </button>
      <button @click="cancelSavePreset" class="icon-btn cancel-btn" :title="t.eq_cancel" :aria-label="t.eq_cancel">
        <i class="fas fa-times" aria-hidden="true"></i>
      </button>
    </div>

    <div class="eq-bands" :class="{ disabled: isEqBypassed }">
      <div v-for="(band, index) in localBands" :key="band.frequency" class="band">
        <div class="slider-wrapper" :class="{ active: band.gain !== 0, negative: band.gain < 0 }">
          <input
            type="range"
            min="-12"
            max="12"
            step="0.5"
            :value="band.gain"
            @input="handleGainChange($event, index)"
            :disabled="isEqBypassed"
            class="slider-v"
            :class="{ active: band.gain !== 0, negative: band.gain < 0 }"
            :aria-label="t.a11y_eq_band.replace('{freq}', formatFrequency(band.frequency)).replace('{gain}', band.gain)"
            :aria-valuenow="band.gain"
            aria-valuemin="-12"
            aria-valuemax="12"
          />
        </div>
        <span class="val">{{ band.gain > 0 ? '+' : '' }}{{ band.gain }}</span>
        <span class="freq">{{ formatFrequency(band.frequency) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref, inject, watch, computed, onMounted, nextTick } from 'vue'
  import { EQ_PRESETS } from '../utils/presets.js'

  const { t } = inject('i18n')

  const STORAGE_KEY = 'eq19_custom_presets'

  const audioEngine = inject('audioEngine')
  const notify = inject('notify', () => {})

  const localBands = ref([
    { frequency: 20, gain: 0 },
    { frequency: 25, gain: 0 },
    { frequency: 31.5, gain: 0 },
    { frequency: 40, gain: 0 },
    { frequency: 50, gain: 0 },
    { frequency: 63, gain: 0 },
    { frequency: 80, gain: 0 },
    { frequency: 100, gain: 0 },
    { frequency: 125, gain: 0 },
    { frequency: 160, gain: 0 },
    { frequency: 200, gain: 0 },
    { frequency: 250, gain: 0 },
    { frequency: 315, gain: 0 },
    { frequency: 400, gain: 0 },
    { frequency: 500, gain: 0 },
    { frequency: 630, gain: 0 },
    { frequency: 800, gain: 0 },
    { frequency: 1000, gain: 0 },
    { frequency: 1250, gain: 0 },
  ])

  const selectedPreset = ref('')
  const isEqBypassed = ref(false)

  // Custom presets
  const customPresets = ref([])
  const showSaveForm = ref(false)
  const newPresetName = ref('')
  const presetNameInput = ref(null)

  const isCustomSelected = computed(
    () => selectedPreset.value && selectedPreset.value.startsWith('__custom__')
  )

  // Load custom presets from localStorage
  function loadCustomPresets() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) customPresets.value = JSON.parse(raw)
    } catch (_e) {
      customPresets.value = []
    }
  }

  function persistCustomPresets() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customPresets.value))
  }

  function confirmSavePreset() {
    const name = newPresetName.value.trim()
    if (!name) return

    const gains = localBands.value.map((b) => b.gain)
    const id = `__custom__${Date.now()}`
    customPresets.value.push({ id, name, gains })
    persistCustomPresets()
    selectedPreset.value = id
    showSaveForm.value = false
    newPresetName.value = ''
    notify(t.value.eq_preset_saved.replace('{name}', name), 'success')
  }

  function cancelSavePreset() {
    showSaveForm.value = false
    newPresetName.value = ''
  }

  function deleteSelectedCustomPreset() {
    const preset = customPresets.value.find((p) => p.id === selectedPreset.value)
    if (!preset) return
    customPresets.value = customPresets.value.filter((p) => p.id !== selectedPreset.value)
    persistCustomPresets()
    selectedPreset.value = ''
    notify(t.value.eq_preset_deleted.replace('{name}', preset.name), 'info')
  }

  // Focus input when save form opens
  watch(showSaveForm, (v) => {
    if (v) nextTick(() => presetNameInput.value?.focus())
  })

  // Sync with audioEngine
  if (audioEngine && audioEngine.eqBands) {
    watch(
      () => audioEngine.eqBands,
      (newBands) => {
        if (newBands && newBands.length === 19) {
          localBands.value = newBands.map((band) => ({
            frequency: band.frequency,
            gain: band.gain,
          }))
        }
      },
      { deep: true, immediate: true }
    )

    if (audioEngine.eqBypass) {
      isEqBypassed.value = audioEngine.eqBypass.value
    }
  }

  function handleGainChange(event, index) {
    const value = parseFloat(event.target.value)
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
      const preset = customPresets.value.find((p) => p.id === selectedPreset.value)
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
      isEqBypassed.value = audioEngine.eqBypass?.value ?? false
      notify(isEqBypassed.value ? t.value.eq_bypassed : t.value.eq_active, 'info')
    }
  }

  function resetEqualizer() {
    if (audioEngine && audioEngine.resetEq) {
      audioEngine.resetEq()
      localBands.value.forEach((band) => { band.gain = 0 })
      selectedPreset.value = ''
      notify(t.value.eq_reset_done, 'info')
    }
  }

  function formatFrequency(freq) {
    if (freq >= 1000) return (freq / 1000).toFixed(1) + 'k'
    return freq.toString()
  }

  onMounted(() => {
    loadCustomPresets()
  })
</script>

<style scoped>
  .equalizer {
    background: var(--card-bg, #252530);
    border: 1px solid var(--border-color, #3a3a48);
    border-radius: 12px;
    padding: 12px;
  }

  .eq-header {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 8px;
  }

  .toggle-btn {
    width: 28px;
    height: 28px;
    border: 1px solid var(--border-color, #3a3a48);
    background: var(--secondary-bg, #1a1a22);
    border-radius: 6px;
    color: var(--text-secondary, #8a8a9a);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.85em;
    transition: all 0.2s ease;
    flex-shrink: 0;
  }

  .toggle-btn:hover {
    border-color: #667eea;
    color: #667eea;
  }

  .toggle-btn.active {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-color: transparent;
    color: white;
  }

  .preset-select {
    flex: 1;
    padding: 5px 8px;
    border: 1px solid var(--border-color, #3a3a48);
    border-radius: 6px;
    font-size: 0.7em;
    cursor: pointer;
    background: var(--secondary-bg, #1a1a22);
    color: var(--text-secondary, #c8c8d5);
    transition: all 0.2s ease;
    min-width: 0;
  }

  .preset-select:hover,
  .preset-select:focus {
    border-color: #667eea;
    outline: none;
  }

  .icon-btn {
    width: 28px;
    height: 28px;
    border: 1px solid var(--border-color, #3a3a48);
    background: var(--secondary-bg, #1a1a22);
    border-radius: 6px;
    color: var(--text-secondary, #8a8a9a);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.7em;
    transition: all 0.2s ease;
    flex-shrink: 0;
  }

  .icon-btn:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  .save-btn:hover {
    background: #667eea;
    border-color: transparent;
    color: white;
  }

  .save-confirm-btn:not(:disabled):hover {
    background: #1db954;
    border-color: transparent;
    color: white;
  }

  .cancel-btn:hover {
    background: #ef4444;
    border-color: transparent;
    color: white;
  }

  .delete-btn:hover {
    background: #ef4444;
    border-color: transparent;
    color: white;
  }

  .reset-btn:hover {
    background: #667eea;
    color: white;
    border-color: transparent;
  }

  /* Inline save form */
  .save-form {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 8px;
    animation: fadeIn 0.15s ease;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-4px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .preset-name-input {
    flex: 1;
    padding: 5px 10px;
    border: 1px solid #667eea;
    border-radius: 6px;
    background: var(--secondary-bg, #1a1a22);
    color: var(--text-primary, #fff);
    font-size: 0.75em;
    outline: none;
  }

  .preset-name-input::placeholder {
    color: var(--text-muted, #8b8b9a);
  }

  /* EQ bands */
  .eq-bands {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 2px;
    padding: 12px 8px;
    background: var(--secondary-bg, #1a1a22);
    border: 1px solid var(--border-color, #3a3a48);
    border-radius: 8px;
    min-height: 220px;
  }

  .eq-bands.disabled {
    opacity: 0.4;
    pointer-events: none;
  }

  .band {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    flex: 1;
    min-width: 22px;
    max-width: 36px;
  }

  .slider-wrapper {
    position: relative;
    width: 18px;
    height: 160px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    transition: background 0.25s ease;
  }

  /* Subtle hover highlight instead of a heavy neon capsule */
  .slider-wrapper:hover {
    background: rgba(127, 127, 140, 0.08);
  }

  .slider-v {
    -webkit-appearance: none;
    appearance: none;
    writing-mode: vertical-lr;
    direction: rtl;
    width: 5px;
    height: 152px;
    padding: 0;
    margin: 0;
    cursor: pointer;
    background: linear-gradient(to top, #34343f 0%, #40404d 100%);
    border-radius: 3px;
    outline: none;
    border: none;
    transition:
      background 0.2s ease,
      box-shadow 0.2s ease;
  }

  .slider-v.active {
    background: linear-gradient(to top, #2d8a3e 0%, #4cd964 100%);
    box-shadow: 0 0 5px rgba(76, 217, 100, 0.3);
  }

  .slider-v.active.negative {
    background: linear-gradient(to top, #b3271e 0%, #ff453a 100%);
    box-shadow: 0 0 5px rgba(255, 69, 58, 0.3);
  }

  .slider-v::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 13px;
    height: 13px;
    border-radius: 50%;
    background: #ffffff;
    cursor: pointer;
    border: 2px solid #8890a8;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.35);
    transition:
      transform 0.15s ease,
      border-color 0.2s ease,
      box-shadow 0.2s ease;
  }

  .slider-v.active::-webkit-slider-thumb {
    border-color: #4cd964;
    box-shadow: 0 1px 6px rgba(76, 217, 100, 0.45);
  }

  .slider-v.active.negative::-webkit-slider-thumb {
    border-color: #ff453a;
    box-shadow: 0 1px 6px rgba(255, 69, 58, 0.45);
  }

  .slider-v::-webkit-slider-thumb:hover {
    transform: scale(1.18);
  }

  .slider-v::-moz-range-track {
    width: 5px;
    background: linear-gradient(to top, #34343f 0%, #40404d 100%);
    border-radius: 3px;
    border: none;
  }

  .slider-v.active::-moz-range-track {
    background: linear-gradient(to top, #2d8a3e 0%, #4cd964 100%);
  }

  .slider-v.active.negative::-moz-range-track {
    background: linear-gradient(to top, #b3271e 0%, #ff453a 100%);
  }

  .slider-v::-moz-range-thumb {
    width: 13px;
    height: 13px;
    border-radius: 50%;
    background: #ffffff;
    cursor: pointer;
    border: 2px solid #8890a8;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.35);
    transition:
      transform 0.15s ease,
      border-color 0.2s ease,
      box-shadow 0.2s ease;
  }

  .slider-v.active::-moz-range-thumb {
    border-color: #4cd964;
    box-shadow: 0 1px 6px rgba(76, 217, 100, 0.45);
  }

  .slider-v.active.negative::-moz-range-thumb {
    border-color: #ff453a;
    box-shadow: 0 1px 6px rgba(255, 69, 58, 0.45);
  }

  .slider-v::-moz-range-thumb:hover {
    transform: scale(1.18);
  }

  .val {
    font-size: 0.6em;
    font-weight: 600;
    color: var(--accent-primary, #c9984d);
    font-family: 'SF Mono', 'Monaco', monospace;
    min-width: 24px;
    text-align: center;
    white-space: nowrap;
  }

  .freq {
    font-size: 0.55em;
    color: var(--text-secondary, #8a8a9a);
    font-weight: 500;
    text-align: center;
    white-space: nowrap;
  }

  @media (max-width: 900px) {
    .eq-bands {
      gap: 1px;
      padding: 10px 4px;
    }

    .slider-wrapper {
      height: 130px;
      width: 16px;
    }

    .slider-v {
      height: 120px;
    }

    .band {
      min-width: 18px;
    }

    .val {
      font-size: 0.55em;
    }

    .freq {
      font-size: 0.5em;
    }
  }

  @media (max-width: 600px) {
    .equalizer {
      padding: 10px;
    }

    .eq-header {
      gap: 5px;
    }

    .toggle-btn,
    .icon-btn {
      width: 32px;
      height: 32px;
    }

    .preset-select {
      font-size: 0.75em;
      padding: 6px 8px;
    }

    .eq-bands {
      gap: 1px;
      padding: 8px 2px;
      min-height: 180px;
    }

    .slider-wrapper {
      height: 110px;
      width: 14px;
    }

    .slider-v {
      height: 100px;
      width: 4px;
    }

    .band {
      min-width: 15px;
      max-width: 28px;
    }

    .val {
      font-size: 0.5em;
    }

    .freq {
      font-size: 0.45em;
    }

    .slider-v::-webkit-slider-thumb {
      width: 12px;
      height: 12px;
    }

    .slider-v::-moz-range-thumb {
      width: 12px;
      height: 12px;
    }
  }

  @media (max-width: 400px) {
    .equalizer {
      padding: 8px;
    }

    .eq-bands {
      padding: 6px 2px;
      min-height: 160px;
      overflow-x: auto;
      justify-content: flex-start;
    }

    .slider-wrapper {
      height: 95px;
      width: 13px;
    }

    .slider-v {
      height: 85px;
      width: 4px;
    }

    .band {
      min-width: 14px;
      max-width: 24px;
    }

    .val {
      font-size: 0.45em;
    }

    .freq {
      font-size: 0.4em;
    }

    .slider-v::-webkit-slider-thumb {
      width: 11px;
      height: 11px;
      border-width: 1.5px;
    }

    .slider-v::-moz-range-thumb {
      width: 11px;
      height: 11px;
      border-width: 1.5px;
    }
  }
</style>
