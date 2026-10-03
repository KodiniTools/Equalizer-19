<template>
  <div class="heq" role="group" :aria-label="t.lp_demo_title">
    <div class="heq-head">
      <b>{{ t.lp_demo_title }}</b>
      <span class="heq-name mono" aria-live="polite">{{ presetLabel }}</span>
    </div>

    <div class="heq-presets" role="toolbar" :aria-label="t.lp_demo_presets">
      <button
        v-for="name in presetNames"
        :key="name"
        type="button"
        class="btn btn-sm heq-chip"
        :class="{ 'is-on': name === activePreset }"
        :aria-pressed="name === activePreset"
        @click="loadPreset(name)"
      >
        {{ name }}
      </button>
    </div>

    <div class="heq-stage">
      <svg
        class="heq-curve"
        :viewBox="`0 0 ${W} ${H}`"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <clipPath :id="`${uid}-up`">
            <rect x="0" y="0" :width="W" :height="curve.mid" />
          </clipPath>
          <clipPath :id="`${uid}-dn`">
            <rect x="0" :y="curve.mid" :width="W" :height="H - curve.mid" />
          </clipPath>
        </defs>
        <line
          v-for="g in curve.grid"
          :key="g.db"
          class="heq-grid"
          x1="0"
          :x2="W"
          :y1="g.y"
          :y2="g.y"
        />
        <line class="heq-zero" x1="0" :x2="W" :y1="curve.mid" :y2="curve.mid" />
        <path class="heq-fill boost" :d="curve.area" :clip-path="`url(#${uid}-up)`" />
        <path class="heq-fill cut" :d="curve.area" :clip-path="`url(#${uid}-dn)`" />
        <path class="heq-line boost" :d="curve.line" :clip-path="`url(#${uid}-up)`" />
        <path class="heq-line cut" :d="curve.line" :clip-path="`url(#${uid}-dn)`" />
      </svg>

      <div class="heq-bands">
        <input
          v-for="(freq, i) in EQ_BAND_FREQUENCIES"
          :key="freq"
          type="range"
          class="heq-slider"
          :class="{ boost: gains[i] > 0, cut: gains[i] < 0 }"
          min="-12"
          max="12"
          step="0.5"
          :value="gains[i]"
          :aria-label="`${formatFrequency(freq)} Hz`"
          :aria-valuetext="`${formatGain(gains[i])} dB`"
          @input="setGain(i, $event.target.value)"
        />
      </div>
    </div>

    <div class="heq-foot mono">
      <span>20 Hz</span>
      <span>±12 dB</span>
      <span>20 kHz</span>
    </div>
  </div>
</template>

<script setup>
  import { computed, inject, ref } from 'vue'
  import { EQ_BAND_FREQUENCIES, EQ_PRESETS, formatFrequency } from '../utils/presets.js'
  import { buildEqCurve, formatGain } from '../utils/eqCurve.js'

  /**
   * Interactive 19-band demo for the landing page. Uses the real preset data
   * from presets.js, so what the visitor sees here is what the app does.
   * Purely visual: nothing here touches the audio engine.
   */
  const props = defineProps({
    /** Preset shown on first paint. */
    initialPreset: { type: String, default: 'V-Shape' },
  })

  const { t } = inject('i18n')

  const W = 380
  const H = 110
  // Unique ids keep the SVG clip paths from colliding if the demo renders twice.
  const uid = `heq-${Math.random().toString(36).slice(2, 8)}`

  const presetNames = Object.keys(EQ_PRESETS)
  const activePreset = ref(props.initialPreset)
  const gains = ref([...(EQ_PRESETS[props.initialPreset] || EQ_PRESETS.Flat)])

  const curve = computed(() => buildEqCurve(gains.value, { w: W, h: H }))
  const presetLabel = computed(() => activePreset.value || t.value.lp_demo_custom)

  function loadPreset(name) {
    gains.value = [...EQ_PRESETS[name]]
    activePreset.value = name
  }

  function setGain(i, value) {
    const next = [...gains.value]
    next[i] = Number(value)
    gains.value = next
    activePreset.value = null
  }
</script>

<style scoped>
  .heq {
    display: grid;
    gap: 12px;
    min-width: 0;
    padding: 16px;
    background: var(--card-bg);
    border: 1px solid var(--border-color);
    border-radius: 16px;
    box-shadow: 0 24px 60px var(--shadow-light);
  }

  .mono {
    font-family: var(--font-mono);
  }

  .heq-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    font-size: 13px;
    color: var(--text-muted);
  }

  .heq-head b {
    font-weight: 600;
    color: var(--text-primary);
  }

  .heq-name {
    font-size: 12px;
  }

  .heq-presets {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .heq-chip {
    height: 28px;
    padding: 0 10px;
    font-size: 12px;
  }

  .heq-stage {
    position: relative;
    height: 150px;
  }

  .heq-curve {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    display: block;
    pointer-events: none;
  }

  .heq-grid {
    stroke: var(--border-color);
    stroke-width: 1;
    opacity: 0.6;
  }

  .heq-zero {
    stroke: var(--text-muted);
    stroke-width: 1;
    stroke-dasharray: 3 4;
  }

  .heq-fill {
    opacity: 0.22;
  }

  .heq-fill.boost {
    fill: var(--eq-boost);
  }

  .heq-fill.cut {
    fill: var(--eq-cut);
  }

  .heq-line {
    fill: none;
    stroke-width: 2.5;
    stroke-linejoin: round;
    stroke-linecap: round;
  }

  .heq-line.boost {
    stroke: var(--eq-boost);
  }

  .heq-line.cut {
    stroke: var(--eq-cut);
  }

  .heq-bands {
    position: absolute;
    inset: 0;
    display: grid;
    grid-template-columns: repeat(19, 1fr);
    gap: 2px;
  }

  .heq-slider {
    -webkit-appearance: none;
    appearance: none;
    writing-mode: vertical-lr;
    direction: rtl;
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
    background: transparent;
    cursor: pointer;
  }

  .heq-slider:focus-visible {
    outline: 2px solid var(--accent-primary);
    outline-offset: 2px;
    border-radius: 4px;
  }

  .heq-slider::-webkit-slider-runnable-track {
    width: 3px;
    border-radius: 2px;
    background: var(--border-strong);
  }

  .heq-slider::-moz-range-track {
    width: 3px;
    border-radius: 2px;
    background: var(--border-strong);
  }

  .heq-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 12px;
    height: 12px;
    margin-left: -4.5px;
    border-radius: 50%;
    background: var(--card-bg);
    border: 2px solid var(--text-muted);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
  }

  .heq-slider::-moz-range-thumb {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--card-bg);
    border: 2px solid var(--text-muted);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
  }

  .heq-slider.boost::-webkit-slider-thumb {
    border-color: var(--eq-boost);
  }

  .heq-slider.boost::-moz-range-thumb {
    border-color: var(--eq-boost);
  }

  .heq-slider.cut::-webkit-slider-thumb {
    border-color: var(--eq-cut);
  }

  .heq-slider.cut::-moz-range-thumb {
    border-color: var(--eq-cut);
  }

  .heq-foot {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    color: var(--text-muted);
  }

  @media (max-width: 600px) {
    .heq {
      padding: 12px;
    }

    .heq-stage {
      height: 130px;
    }

    .heq-slider::-webkit-slider-thumb {
      width: 14px;
      height: 14px;
      margin-left: -5.5px;
    }
  }
</style>
