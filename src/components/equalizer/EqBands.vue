<template>
  <div class="eq-bands" :class="{ disabled }">
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

    <div v-for="(band, index) in bands" :key="band.frequency" class="band">
      <div class="slider-wrapper" :class="{ active: band.gain !== 0, negative: band.gain < 0 }">
        <input
          type="range"
          min="-12"
          max="12"
          step="0.5"
          :value="band.gain"
          :disabled="disabled"
          class="slider-v"
          :class="{ active: band.gain !== 0, negative: band.gain < 0 }"
          :aria-label="
            t.a11y_eq_band
              .replace('{freq}', formatFrequency(band.frequency))
              .replace('{gain}', band.gain)
          "
          :aria-valuenow="band.gain"
          aria-valuemin="-12"
          aria-valuemax="12"
          @input="emit('change', index, parseFloat($event.target.value))"
        />
      </div>
      <span class="val">{{ band.gain > 0 ? '+' : '' }}{{ band.gain }}</span>
      <span class="freq">{{ formatFrequency(band.frequency) }}</span>
    </div>
  </div>
</template>

<script setup>
  import { computed, inject } from 'vue'
  import { formatFrequency } from '../../utils/presets'
  import { buildEqCurve } from '../../utils/eqCurve'

  /**
   * Die 19 Band-Regler mit der Frequenzkurve dahinter. Rein darstellend:
   * `bands` kommt vom Container, jede Reglerbewegung wird als
   * change(index, gain) gemeldet.
   */
  const props = defineProps({
    /** [{ frequency, gain }] in Band-Reihenfolge */
    bands: { type: Array, required: true },
    disabled: { type: Boolean, default: false },
  })

  const emit = defineEmits(['change'])

  const { t } = inject('i18n')

  // Curve geometry (SVG user units, stretched to the slider area). The ±12 dB
  // range maps to 43 % of the height, which is where the slider thumbs travel.
  const CURVE = { w: 380, h: 100 }
  const curve = computed(() =>
    buildEqCurve(
      props.bands.map((b) => b.gain),
      { w: CURVE.w, h: CURVE.h, range: CURVE.h * 0.43 }
    )
  )
</script>

<style scoped>
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
    background: var(--secondary-bg);
    border: 1px solid var(--border-color);
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
    stroke: var(--text-muted);
    stroke-width: 1;
    stroke-dasharray: 3 4;
    vector-effect: non-scaling-stroke;
  }

  .eq-curve-fill {
    opacity: 0.2;
  }

  .eq-curve-fill.boost {
    fill: var(--eq-boost);
  }

  .eq-curve-fill.cut {
    fill: var(--eq-cut);
  }

  .eq-curve-line {
    fill: none;
    stroke-width: 2;
    stroke-linejoin: round;
    stroke-linecap: round;
    vector-effect: non-scaling-stroke;
  }

  .eq-curve-line.boost {
    stroke: var(--eq-boost);
  }

  .eq-curve-line.cut {
    stroke: var(--eq-cut);
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
    background: var(--border-strong);
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
    border: 2px solid var(--text-muted);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.35);
    transition:
      transform 0.15s ease,
      border-color 0.2s ease,
      box-shadow 0.2s ease;
  }

  .slider-v.active::-webkit-slider-thumb {
    border-color: var(--eq-boost);
    box-shadow: 0 1px 6px color-mix(in srgb, var(--eq-boost) 45%, transparent);
  }

  .slider-v.active.negative::-webkit-slider-thumb {
    border-color: var(--eq-cut);
    box-shadow: 0 1px 6px color-mix(in srgb, var(--eq-cut) 45%, transparent);
  }

  .slider-v::-webkit-slider-thumb:hover {
    transform: scale(1.18);
  }

  .slider-v::-moz-range-track {
    width: 3px;
    background: var(--border-strong);
    border-radius: 3px;
    border: none;
  }

  .slider-v::-moz-range-thumb {
    width: 13px;
    height: 13px;
    border-radius: 50%;
    background: #ffffff;
    cursor: pointer;
    border: 2px solid var(--text-muted);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.35);
    transition:
      transform 0.15s ease,
      border-color 0.2s ease,
      box-shadow 0.2s ease;
  }

  .slider-v.active::-moz-range-thumb {
    border-color: var(--eq-boost);
    box-shadow: 0 1px 6px color-mix(in srgb, var(--eq-boost) 45%, transparent);
  }

  .slider-v.active.negative::-moz-range-thumb {
    border-color: var(--eq-cut);
    box-shadow: 0 1px 6px color-mix(in srgb, var(--eq-cut) 45%, transparent);
  }

  .slider-v::-moz-range-thumb:hover {
    transform: scale(1.18);
  }

  .val {
    font-size: 10.5px;
    font-weight: 600;
    color: var(--accent-primary);
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
    min-width: 24px;
    text-align: center;
    white-space: nowrap;
  }

  /* Value colour follows the band state (boost / cut) */
  .slider-wrapper.active + .val {
    color: var(--eq-boost);
  }

  .slider-wrapper.active.negative + .val {
    color: var(--eq-cut);
  }

  .freq {
    font-size: 10.5px;
    color: var(--text-secondary);
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
