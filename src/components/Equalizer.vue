<template>
  <div class="equalizer">
    <div class="eq-header">
      <button
        @click="toggleBypass"
        :class="['btn', 'btn-icon', 'btn-sm', { 'is-on': !isEqBypassed }]"
        :aria-label="t.a11y_eq_bypass"
        :aria-pressed="!isEqBypassed"
      >
        <AppIcon name="power" />
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
        class="btn btn-icon btn-sm delete-btn"
        :title="t.eq_preset_delete"
        :aria-label="t.eq_preset_delete"
      >
        <AppIcon name="trash" />
      </button>

      <!-- Save preset button -->
      <button
        v-if="!showSaveForm"
        @click="showSaveForm = true"
        class="btn btn-icon btn-sm save-btn"
        :title="t.eq_preset_save_title"
        :aria-label="t.eq_preset_save_title"
      >
        <AppIcon name="save" />
      </button>

      <button @click="resetEqualizer" class="btn btn-icon btn-sm reset-btn" :title="t.reset" :aria-label="t.reset">
        <AppIcon name="undo" />
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
        class="btn btn-icon btn-sm save-confirm-btn"
        :disabled="!newPresetName.trim()"
        :title="t.eq_save"
        :aria-label="t.eq_save"
      >
        <AppIcon name="check" />
      </button>
      <button @click="cancelSavePreset" class="btn btn-icon btn-sm cancel-btn" :title="t.eq_cancel" :aria-label="t.eq_cancel">
        <AppIcon name="close" />
      </button>
    </div>

    <div class="eq-bands" :class="{ disabled: isEqBypassed }">
      <!-- Frequency curve behind the sliders: boost above, cut below the 0 dB line -->
      <svg
        class="eq-curve"
        :viewBox="`0 0 ${CURVE.w} ${CURVE.h}`"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <clipPath id="eq-curve-up">
            <rect x="0" y="0" :width="CURVE.w" :height="curve.mid" />
          </clipPath>
          <clipPath id="eq-curve-dn">
            <rect x="0" :y="curve.mid" :width="CURVE.w" :height="curve.mid" />
          </clipPath>
        </defs>
        <line class="eq-curve-zero" x1="0" :x2="CURVE.w" :y1="curve.mid" :y2="curve.mid" />
        <path class="eq-curve-fill boost" :d="curve.area" clip-path="url(#eq-curve-up)" />
        <path class="eq-curve-fill cut" :d="curve.area" clip-path="url(#eq-curve-dn)" />
        <path class="eq-curve-line boost" :d="curve.line" clip-path="url(#eq-curve-up)" />
        <path class="eq-curve-line cut" :d="curve.line" clip-path="url(#eq-curve-dn)" />
      </svg>

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
  import AppIcon from './AppIcon.vue'
  import { EQ_PRESETS, EQ_BAND_FREQUENCIES, formatFrequency } from '../utils/presets.js'
  import { useCustomPresets, isCustomPresetId } from '../composables/useCustomPresets.js'
  import { buildEqCurve } from '../utils/eqCurve.js'

  const { t } = inject('i18n')

  const audioEngine = inject('audioEngine')
  const notify = inject('notify', () => {})

  const localBands = ref(EQ_BAND_FREQUENCIES.map((frequency) => ({ frequency, gain: 0 })))

  // Curve geometry (SVG user units, stretched to the slider area). The ±12 dB
  // range maps to 43 % of the height, which is where the slider thumbs travel.
  const CURVE = { w: 380, h: 100 }
  const curve = computed(() =>
    buildEqCurve(
      localBands.value.map((b) => b.gain),
      { w: CURVE.w, h: CURVE.h, range: CURVE.h * 0.43 }
    )
  )

  const selectedPreset = ref('')
  // Mirrors the engine so external changes (undo/redo) are reflected as well
  const isEqBypassed = computed(() => audioEngine?.eqBypass?.value ?? false)

  // Custom presets
  const { customPresets, loadCustomPresets, findPreset, addPreset, removePreset } =
    useCustomPresets()
  const showSaveForm = ref(false)
  const newPresetName = ref('')
  const presetNameInput = ref(null)

  const isCustomSelected = computed(() => isCustomPresetId(selectedPreset.value))

  function confirmSavePreset() {
    const name = newPresetName.value.trim()
    if (!name) return

    const gains = localBands.value.map((b) => b.gain)
    selectedPreset.value = addPreset(name, gains).id
    showSaveForm.value = false
    newPresetName.value = ''
    notify(t.value.eq_preset_saved.replace('{name}', name), 'success')
  }

  function cancelSavePreset() {
    showSaveForm.value = false
    newPresetName.value = ''
  }

  function deleteSelectedCustomPreset() {
    const preset = removePreset(selectedPreset.value)
    if (!preset) return
    selectedPreset.value = ''
    notify(t.value.eq_preset_deleted.replace('{name}', preset.name), 'info')
  }

  // Focus input when save form opens
  watch(showSaveForm, (v) => {
    if (v) nextTick(() => presetNameInput.value?.focus())
  })

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
      localBands.value.forEach((band) => { band.gain = 0 })
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

  .preset-select {
    flex: 1;
    padding: 5px 8px;
    border: 1px solid var(--border-color, #3a3a48);
    border-radius: 6px;
    font-size: 11px;
    cursor: pointer;
    background: var(--secondary-bg, #1a1a22);
    color: var(--text-secondary, #c8c8d5);
    transition: all 0.2s ease;
    min-width: 0;
  }

  .preset-select:hover,
  .preset-select:focus {
    border-color: var(--accent-primary, #00d9ff);
    outline: none;
  }

  /* Header buttons use the global .btn system; hover colours hint at the action */
  .btn.save-btn:hover:not(:disabled),
  .btn.reset-btn:hover:not(:disabled) {
    background: var(--accent-primary, #00d9ff);
    border-color: var(--accent-primary, #00d9ff);
    color: var(--on-accent, #000);
  }

  .btn.save-confirm-btn:hover:not(:disabled) {
    background: var(--success, #1db954);
    border-color: var(--success, #1db954);
    color: #ffffff;
  }

  .btn.cancel-btn:hover:not(:disabled),
  .btn.delete-btn:hover:not(:disabled) {
    background: var(--error, #ef4444);
    border-color: var(--error, #ef4444);
    color: #ffffff;
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
    border: 1px solid var(--accent-primary, #00d9ff);
    border-radius: 6px;
    background: var(--secondary-bg, #1a1a22);
    color: var(--text-primary, #fff);
    font-size: 12px;
    outline: none;
  }

  .preset-name-input::placeholder {
    color: var(--text-muted, #8b8b9a);
  }

  /* EQ bands: one grid column per band so the curve's band centres line up
     with the slider thumbs. The custom properties feed the curve overlay. */
  .eq-bands {
    --eq-pad-x: 8px;
    --eq-pad-y: 12px;
    --eq-stage-h: 160px;
    position: relative;
    display: grid;
    grid-template-columns: repeat(19, minmax(0, 1fr));
    justify-items: center;
    align-items: end;
    padding: var(--eq-pad-y) var(--eq-pad-x);
    background: var(--secondary-bg, #1a1a22);
    border: 1px solid var(--border-color, #3a3a48);
    border-radius: 8px;
    min-height: 220px;
  }

  .eq-curve {
    position: absolute;
    top: var(--eq-pad-y);
    left: var(--eq-pad-x);
    width: calc(100% - 2 * var(--eq-pad-x));
    height: var(--eq-stage-h);
    pointer-events: none;
  }

  .eq-curve-zero {
    stroke: var(--text-muted, #7a8da0);
    stroke-width: 1;
    stroke-dasharray: 3 4;
    vector-effect: non-scaling-stroke;
  }

  .eq-curve-fill {
    opacity: 0.2;
  }

  .eq-curve-fill.boost {
    fill: var(--eq-boost, #c9984d);
  }

  .eq-curve-fill.cut {
    fill: var(--eq-cut, #4a90d9);
  }

  .eq-curve-line {
    fill: none;
    stroke-width: 2;
    stroke-linejoin: round;
    stroke-linecap: round;
    vector-effect: non-scaling-stroke;
  }

  .eq-curve-line.boost {
    stroke: var(--eq-boost, #c9984d);
  }

  .eq-curve-line.cut {
    stroke: var(--eq-cut, #4a90d9);
  }

  .eq-bands.disabled {
    opacity: 0.4;
    pointer-events: none;
  }

  .band {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    width: 100%;
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
    width: 3px;
    height: 152px;
    padding: 0;
    margin: 0;
    cursor: pointer;
    background: var(--border-strong, #2f4a70);
    border-radius: 3px;
    outline: none;
    border: none;
    transition:
      background 0.2s ease,
      box-shadow 0.2s ease;
  }

  .slider-v::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 13px;
    height: 13px;
    border-radius: 50%;
    background: #ffffff;
    cursor: pointer;
    border: 2px solid var(--text-muted, #7a8da0);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.35);
    transition:
      transform 0.15s ease,
      border-color 0.2s ease,
      box-shadow 0.2s ease;
  }

  .slider-v.active::-webkit-slider-thumb {
    border-color: var(--eq-boost, #c9984d);
    box-shadow: 0 1px 6px color-mix(in srgb, var(--eq-boost, #c9984d) 45%, transparent);
  }

  .slider-v.active.negative::-webkit-slider-thumb {
    border-color: var(--eq-cut, #4a90d9);
    box-shadow: 0 1px 6px color-mix(in srgb, var(--eq-cut, #4a90d9) 45%, transparent);
  }

  .slider-v::-webkit-slider-thumb:hover {
    transform: scale(1.18);
  }

  .slider-v::-moz-range-track {
    width: 3px;
    background: var(--border-strong, #2f4a70);
    border-radius: 3px;
    border: none;
  }

  .slider-v::-moz-range-thumb {
    width: 13px;
    height: 13px;
    border-radius: 50%;
    background: #ffffff;
    cursor: pointer;
    border: 2px solid var(--text-muted, #7a8da0);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.35);
    transition:
      transform 0.15s ease,
      border-color 0.2s ease,
      box-shadow 0.2s ease;
  }

  .slider-v.active::-moz-range-thumb {
    border-color: var(--eq-boost, #c9984d);
    box-shadow: 0 1px 6px color-mix(in srgb, var(--eq-boost, #c9984d) 45%, transparent);
  }

  .slider-v.active.negative::-moz-range-thumb {
    border-color: var(--eq-cut, #4a90d9);
    box-shadow: 0 1px 6px color-mix(in srgb, var(--eq-cut, #4a90d9) 45%, transparent);
  }

  .slider-v::-moz-range-thumb:hover {
    transform: scale(1.18);
  }

  .val {
    font-size: 10.5px;
    font-weight: 600;
    color: var(--accent-primary, #c9984d);
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
    min-width: 24px;
    text-align: center;
    white-space: nowrap;
  }

  /* Value colour follows the band state (boost / cut) */
  .slider-wrapper.active + .val {
    color: var(--eq-boost, #c9984d);
  }

  .slider-wrapper.active.negative + .val {
    color: var(--eq-cut, #4a90d9);
  }

  .freq {
    font-size: 10.5px;
    color: var(--text-secondary, #8a8a9a);
    font-weight: 500;
    text-align: center;
    white-space: nowrap;
  }

  @media (max-width: 900px) {
    .eq-bands {
      --eq-pad-x: 4px;
      --eq-pad-y: 10px;
      --eq-stage-h: 130px;
    }

    .slider-wrapper {
      height: 130px;
      width: 16px;
    }

    .slider-v {
      height: 120px;
    }

    .val {
      font-size: 10.5px;
    }

    .freq {
      font-size: 10.5px;
    }
  }

  @media (max-width: 600px) {
    .equalizer {
      padding: 10px;
    }

    .eq-header {
      gap: 5px;
    }

    .preset-select {
      font-size: 12px;
      padding: 6px 8px;
    }

    .eq-bands {
      --eq-pad-x: 2px;
      --eq-pad-y: 8px;
      --eq-stage-h: 110px;
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
      max-width: 28px;
    }

    .val {
      font-size: 10px;
    }

    .freq {
      font-size: 10px;
    }

    /* 19 labels at >= 10px do not fit side by side: show every second one */
    .band:nth-child(even) .freq {
      visibility: hidden;
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
      --eq-pad-y: 6px;
      --eq-stage-h: 95px;
      min-height: 160px;
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
      max-width: 24px;
    }

    .val {
      font-size: 10px;
    }

    .freq {
      font-size: 10px;
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
