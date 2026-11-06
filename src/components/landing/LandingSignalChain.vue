<template>
  <section id="features" class="lp-section">
    <div class="lp-wrap">
      <header class="lp-section-head">
        <h2>{{ t.lp_modules_title }}</h2>
        <p>{{ t.lp_modules_subtitle }}</p>
      </header>

      <div class="lp-chain">
        <article v-for="mod in modules" :key="mod.key" class="lp-module">
          <div class="lp-module-art" aria-hidden="true">
            <!-- Audio input: live waveform -->
            <svg
              v-if="mod.key === 'input'"
              :viewBox="`0 0 ${ART.w} ${ART.h}`"
              preserveAspectRatio="none"
            >
              <line class="art-zero" x1="0" :y1="ART.h / 2" :x2="ART.w" :y2="ART.h / 2" />
              <path class="art-line" :d="inputWave" />
              <circle class="art-rec" :cx="ART.w - 10" cy="10" r="5" />
            </svg>
            <!-- Equalizer: real "Rock" preset curve -->
            <svg
              v-else-if="mod.key === 'eq'"
              :viewBox="`0 0 ${ART.w} ${ART.h}`"
              preserveAspectRatio="none"
            >
              <line class="art-zero" x1="0" :x2="ART.w" :y1="artCurve.mid" :y2="artCurve.mid" />
              <path class="art-fill boost" :d="artCurve.area" clip-path="url(#lp-art-up)" />
              <path class="art-fill cut" :d="artCurve.area" clip-path="url(#lp-art-dn)" />
              <path class="art-line" :d="artCurve.line" />
              <defs>
                <clipPath id="lp-art-up">
                  <rect x="0" y="0" :width="ART.w" :height="artCurve.mid" />
                </clipPath>
                <clipPath id="lp-art-dn">
                  <rect x="0" :y="artCurve.mid" :width="ART.w" :height="artCurve.mid" />
                </clipPath>
              </defs>
            </svg>
            <!-- Compressor: input/output transfer curve with soft knee -->
            <svg
              v-else-if="mod.key === 'comp'"
              :viewBox="`0 0 ${ART.w} ${ART.h}`"
              preserveAspectRatio="none"
            >
              <line class="art-zero" x1="0" :y1="ART.h" :x2="ART.w" y2="0" />
              <path class="art-fill boost" :d="compArea" />
              <path class="art-line" :d="compLine" />
            </svg>
            <!-- Recorder: level meter with peak hold -->
            <svg v-else :viewBox="`0 0 ${ART.w} ${ART.h}`" preserveAspectRatio="none">
              <template v-for="(bar, i) in meterBars" :key="i">
                <rect
                  class="art-meter-track"
                  :x="bar.x"
                  y="0"
                  :width="bar.w"
                  :height="ART.h"
                  rx="2"
                />
                <rect
                  class="art-meter"
                  :x="bar.x"
                  :y="ART.h - bar.h"
                  :width="bar.w"
                  :height="bar.h"
                  rx="2"
                />
                <rect class="art-peak" :x="bar.x" :y="ART.h - bar.peak" :width="bar.w" height="2" />
              </template>
              <circle class="art-rec" :cx="ART.w - 10" cy="10" r="5" />
            </svg>
          </div>
          <h3>{{ t[`lp_mod_${mod.key}_title`] }}</h3>
          <p>{{ t[`lp_mod_${mod.key}_desc`] }}</p>
          <ul>
            <li v-for="n in 3" :key="n">{{ t[`lp_mod_${mod.key}_${n}`] }}</li>
          </ul>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
  import { EQ_PRESETS } from '../../utils/presets'
  import { buildEqCurve, smoothPath, type Point } from '../../utils/eqCurve'
  import { injectI18n } from '../../composables/useI18n'

  const { t } = injectI18n()

  const modules = [{ key: 'input' }, { key: 'eq' }, { key: 'comp' }, { key: 'rec' }] as const

  // Small illustrations in the signal-chain cards (SVG user units)
  const ART = { w: 160, h: 56 }
  const artCurve = buildEqCurve(EQ_PRESETS.Rock, { w: ART.w, h: ART.h, range: ART.h * 0.4 })

  // Live input: a waveform whose envelope swells and fades across the card.
  const inputWave = smoothPath(
    Array.from({ length: 33 }, (_, i): Point => {
      const x = (i / 32) * ART.w
      const env = Math.sin((i / 32) * Math.PI)
      const y = ART.h / 2 - Math.sin(i * 1.9) * env * (ART.h * 0.42)
      return [x, y]
    })
  )

  // Compressor transfer curve: unity below the threshold, 4:1 above, soft knee.
  const compPoints: Point[] = [
    [0, ART.h],
    [ART.w * 0.42, ART.h * 0.58],
    [ART.w * 0.58, ART.h * 0.47],
    [ART.w, ART.h * 0.36],
  ]
  const compLine = smoothPath(compPoints)
  const compArea = `${compLine} L${ART.w},${ART.h} Z`

  // Static level-meter bars (fraction of full scale) with a peak-hold mark.
  const meterBars = [0.55, 0.72, 0.64, 0.86, 0.48].map((level, i, all) => {
    const gap = 6
    const w = (ART.w - 24 - gap * (all.length - 1)) / all.length
    return {
      x: i * (w + gap),
      w,
      h: level * ART.h,
      peak: Math.min(ART.h, level * ART.h + 8),
    }
  })
</script>

<style scoped src="./landing.css"></style>

<style scoped>
  /* ---- Modules as a signal chain ---- */
  .lp-chain {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 16px;
    align-items: start;
  }

  .lp-module {
    position: relative;
    padding: 20px 24px 24px;
    background: var(--card-bg);
    border: 1px solid var(--border-color);
    border-radius: 16px;
  }

  /* Connector between consecutive stages */
  .lp-module + .lp-module::before {
    content: '';
    position: absolute;
    top: 48px;
    left: -16px;
    width: 16px;
    height: 2px;
    background: var(--border-strong);
  }

  .lp-module + .lp-module::after {
    content: '';
    position: absolute;
    top: 45px;
    left: -6px;
    width: 6px;
    height: 6px;
    border-top: 2px solid var(--border-strong);
    border-right: 2px solid var(--border-strong);
    transform: rotate(45deg);
  }

  .lp-module-art {
    height: 56px;
    margin-bottom: 18px;
  }

  .lp-module-art svg {
    display: block;
    width: 100%;
    height: 100%;
    overflow: visible;
  }

  .art-zero {
    stroke: var(--text-muted);
    stroke-width: 1;
    stroke-dasharray: 3 4;
    vector-effect: non-scaling-stroke;
  }

  .art-fill {
    opacity: 0.2;
  }

  .art-fill.boost {
    fill: var(--eq-boost);
  }

  .art-fill.cut {
    fill: var(--eq-cut);
  }

  .art-line {
    fill: none;
    stroke: var(--accent-primary);
    stroke-width: 2.5;
    stroke-linejoin: round;
    stroke-linecap: round;
    vector-effect: non-scaling-stroke;
  }

  .art-meter-track {
    fill: var(--border-color);
    opacity: 0.6;
  }

  .art-meter {
    fill: var(--eq-cut);
  }

  .art-peak {
    fill: var(--accent-primary);
  }

  .art-rec {
    fill: var(--error);
  }

  .lp-module h3 {
    margin: 0 0 8px;
    font-size: 21px;
    font-weight: 700;
    color: var(--text-primary);
  }

  .lp-module p {
    margin: 0 0 20px;
    font-size: 15px;
    line-height: 1.6;
    color: var(--text-secondary);
  }

  .lp-module ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .lp-module li {
    position: relative;
    padding: 10px 0 10px 18px;
    border-top: 1px solid var(--border-color);
    font-size: 14px;
    color: var(--text-primary);
  }

  .lp-module li::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    width: 8px;
    height: 2px;
    border-radius: 1px;
    background: var(--accent-primary);
  }

  @media (max-width: 960px) {
    .lp-chain {
      grid-template-columns: 1fr;
      gap: 12px;
    }

    /* Stacked: connector points down instead of right */
    .lp-module + .lp-module::before {
      top: -12px;
      left: 32px;
      width: 2px;
      height: 12px;
    }

    .lp-module + .lp-module::after {
      top: -7px;
      left: 29px;
      transform: rotate(135deg);
    }
  }

  @media (max-width: 600px) {
    .lp-module {
      padding: 22px;
    }
  }
</style>
