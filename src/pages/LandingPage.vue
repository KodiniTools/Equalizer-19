<template>
  <div class="landing-page">
    <!-- Hero -->
    <section class="lp-hero">
      <div class="lp-wrap lp-hero-grid">
        <div class="lp-hero-text">
          <p class="lp-eyebrow">{{ t.lp_eyebrow }}</p>
          <h1 class="lp-title">{{ t.lp_title }}</h1>
          <p class="lp-lead">{{ t.lp_subtitle }}</p>
          <div class="lp-actions">
            <router-link to="/app" class="lp-btn lp-btn-primary">
              {{ t.lp_cta_start }} <span aria-hidden="true">→</span>
            </router-link>
            <a href="#features" class="lp-btn lp-btn-ghost">{{ t.lp_cta_learn }}</a>
          </div>
        </div>

        <!-- Product visual: the real "V-Shape" preset curve -->
        <figure class="lp-visual">
          <svg
            class="lp-curve"
            :viewBox="`0 0 ${CHART.w} ${CHART.h}`"
            role="img"
            :aria-label="t.lp_visual_label"
          >
            <line
              v-for="y in curve.grid"
              :key="y"
              class="lp-grid"
              x1="0"
              :y1="y"
              :x2="CHART.w"
              :y2="y"
            />
            <line class="lp-zero" x1="0" :y1="CHART.mid" :x2="CHART.w" :y2="CHART.mid" />
            <rect
              v-for="bar in curve.bars"
              :key="bar.x"
              class="lp-bar"
              :class="{ cut: bar.gain < 0 }"
              :x="bar.x"
              :y="bar.y"
              :width="CHART.barW"
              :height="bar.h"
              rx="3"
            />
            <polyline class="lp-line" :points="curve.points" />
          </svg>
          <figcaption class="lp-visual-caption">
            <span>20 Hz</span>
            <span>{{ t.lp_visual_label }}</span>
            <span>20 kHz</span>
          </figcaption>
        </figure>
      </div>
    </section>

    <!-- Key facts -->
    <section class="lp-facts">
      <dl class="lp-wrap lp-facts-grid">
        <div class="lp-fact">
          <dt>{{ bandCount }}</dt>
          <dd>{{ t.lp_fact_bands }}</dd>
        </div>
        <div class="lp-fact">
          <dt>{{ presetCount }}</dt>
          <dd>{{ t.lp_fact_presets }}</dd>
        </div>
        <div class="lp-fact">
          <dt>{{ t.lp_fact_bits_value }}</dt>
          <dd>{{ t.lp_fact_bits }}</dd>
        </div>
        <div class="lp-fact">
          <dt>0</dt>
          <dd>{{ t.lp_fact_uploads }}</dd>
        </div>
      </dl>
    </section>

    <!-- Modules -->
    <section id="features" class="lp-section">
      <div class="lp-wrap">
        <header class="lp-section-head">
          <h2>{{ t.lp_modules_title }}</h2>
          <p>{{ t.lp_modules_subtitle }}</p>
        </header>

        <div class="lp-modules">
          <article v-for="(mod, i) in modules" :key="mod.key" class="lp-module">
            <span class="lp-index" aria-hidden="true">{{ String(i + 1).padStart(2, '0') }}</span>
            <h3>{{ t[`lp_mod_${mod.key}_title`] }}</h3>
            <p>{{ t[`lp_mod_${mod.key}_desc`] }}</p>
            <ul>
              <li v-for="n in 3" :key="n">{{ t[`lp_mod_${mod.key}_${n}`] }}</li>
            </ul>
          </article>
        </div>
      </div>
    </section>

    <!-- Steps -->
    <section class="lp-section lp-section-alt">
      <div class="lp-wrap">
        <header class="lp-section-head">
          <h2>{{ t.lp_steps_title }}</h2>
        </header>
        <ol class="lp-steps">
          <li v-for="n in 3" :key="n" class="lp-step">
            <span class="lp-step-num" aria-hidden="true">{{ n }}</span>
            <h3>{{ t[`lp_step${n}_title`] }}</h3>
            <p>{{ t[`lp_step${n}_desc`] }}</p>
          </li>
        </ol>
      </div>
    </section>

    <!-- Details -->
    <section class="lp-section">
      <div class="lp-wrap">
        <header class="lp-section-head">
          <h2>{{ t.lp_details_title }}</h2>
        </header>
        <div class="lp-details">
          <div v-for="key in details" :key="key" class="lp-detail">
            <h3>{{ t[`lp_det_${key}_title`] }}</h3>
            <p>{{ t[`lp_det_${key}_desc`] }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Final call to action -->
    <section class="lp-section lp-final-wrap">
      <div class="lp-wrap">
        <div class="lp-final">
          <h2>{{ t.lp_final_title }}</h2>
          <p>{{ t.lp_final_desc }}</p>
          <router-link to="/app" class="lp-btn lp-btn-primary">
            {{ t.lp_cta_start }} <span aria-hidden="true">→</span>
          </router-link>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
  import { inject } from 'vue'
  import { EQ_BAND_FREQUENCIES, EQ_PRESETS, COMP_PRESETS } from '../utils/presets.js'

  const { t } = inject('i18n')

  // Facts derived from the actual configuration, so they never go stale
  const bandCount = EQ_BAND_FREQUENCIES.length
  const presetCount = Object.keys(EQ_PRESETS).length + Object.keys(COMP_PRESETS).length

  const modules = [{ key: 'eq' }, { key: 'comp' }, { key: 'rec' }]
  const details = ['privacy', 'realtime', 'viz', 'playlist', 'keys', 'devices']

  // Hero chart geometry (SVG user units). The curve is scaled to its own peak
  // (plus headroom) so it fills the card instead of using the full ±12 dB range.
  const CHART = { w: 380, h: 170, mid: 85, range: 72, barW: 12 }

  function buildCurve(gains) {
    const MAX_GAIN = Math.max(...gains.map(Math.abs), 1) * 1.15
    const step = CHART.w / gains.length
    const bars = gains.map((gain, i) => {
      const x = i * step + (step - CHART.barW) / 2
      const offset = (Math.abs(gain) / MAX_GAIN) * CHART.range
      const h = Math.max(offset, 2)
      const y = gain >= 0 ? CHART.mid - h : CHART.mid
      return { x, y, h, gain }
    })
    const points = gains
      .map((gain, i) => {
        const x = i * step + step / 2
        const y = CHART.mid - (gain / MAX_GAIN) * CHART.range
        return `${x.toFixed(1)},${y.toFixed(1)}`
      })
      .join(' ')
    // Faint helper lines at half and full scale above/below the 0 dB line
    const grid = [-1, -0.5, 0.5, 1].map((f) => CHART.mid - f * CHART.range)
    return { bars, points, grid }
  }

  const curve = buildCurve(EQ_PRESETS['V-Shape'])
</script>

<style scoped>
  .landing-page {
    color: var(--text-primary);
  }

  .lp-wrap {
    max-width: 1160px;
    margin: 0 auto;
    padding: 0 24px;
  }

  /* ---- Buttons ---- */
  .lp-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }

  .lp-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 12px 22px;
    border-radius: 10px;
    font-size: 15px;
    font-weight: 600;
    text-decoration: none;
    border: 1px solid transparent;
    transition:
      background 0.2s,
      border-color 0.2s,
      transform 0.2s;
  }

  .lp-btn-primary {
    background: var(--accent-primary);
    color: var(--on-accent);
  }

  .lp-btn-primary:hover {
    background: var(--accent-hover);
    transform: translateY(-1px);
  }

  .lp-btn-ghost {
    color: var(--text-primary);
    border-color: var(--border-color);
  }

  .lp-btn-ghost:hover {
    border-color: var(--accent-primary);
  }

  .lp-btn:focus-visible {
    outline: 2px solid var(--accent-primary);
    outline-offset: 3px;
  }

  /* ---- Hero ---- */
  .lp-hero {
    background: var(--gradient-primary);
    padding: 88px 0 72px;
  }

  .lp-hero-grid {
    display: grid;
    grid-template-columns: 1.1fr 0.9fr;
    gap: 56px;
    align-items: center;
  }

  .lp-eyebrow {
    margin: 0 0 16px;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.4px;
    color: var(--accent-primary);
  }

  .lp-title {
    margin: 0 0 20px;
    font-size: clamp(34px, 5vw, 54px);
    line-height: 1.08;
    font-weight: 800;
    letter-spacing: -0.5px;
    color: var(--text-primary);
  }

  .lp-lead {
    margin: 0 0 32px;
    max-width: 560px;
    font-size: 18px;
    line-height: 1.6;
    color: var(--text-secondary);
  }

  .lp-visual {
    margin: 0;
    padding: 24px 24px 16px;
    background: var(--card-bg);
    border: 1px solid var(--border-color);
    border-radius: 20px;
    box-shadow: 0 24px 60px var(--shadow-light);
  }

  .lp-curve {
    display: block;
    width: 100%;
    height: auto;
  }

  .lp-grid {
    stroke: var(--border-color);
    stroke-width: 1;
    opacity: 0.35;
  }

  .lp-zero {
    stroke: var(--border-color);
    stroke-width: 1;
    stroke-dasharray: 4 4;
  }

  .lp-bar {
    fill: var(--accent-primary);
    opacity: 0.85;
  }

  .lp-bar.cut {
    opacity: 0.35;
  }

  .lp-line {
    fill: none;
    stroke: var(--text-primary);
    stroke-width: 2;
    stroke-linejoin: round;
    stroke-linecap: round;
    opacity: 0.55;
  }

  .lp-visual-caption {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    margin-top: 12px;
    font-size: 12px;
    color: var(--text-muted);
  }

  .lp-visual-caption span:nth-child(2) {
    text-align: center;
  }

  /* ---- Facts ---- */
  .lp-facts {
    border-top: 1px solid var(--border-color);
    border-bottom: 1px solid var(--border-color);
    background: var(--card-bg);
  }

  .lp-facts-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    margin: 0 auto;
  }

  .lp-fact {
    padding: 28px 16px;
  }

  .lp-fact + .lp-fact {
    border-left: 1px solid var(--border-color);
  }

  .lp-fact dt {
    font-size: 34px;
    font-weight: 800;
    line-height: 1;
    color: var(--accent-primary);
    margin-bottom: 8px;
  }

  .lp-fact dd {
    margin: 0;
    font-size: 14px;
    line-height: 1.4;
    color: var(--text-secondary);
  }

  /* ---- Sections ---- */
  .lp-section {
    padding: 88px 0;
  }

  /* Keep the anchored heading clear of the fixed site navigation */
  #features {
    scroll-margin-top: 80px;
  }

  .lp-section-alt {
    background: var(--card-bg);
    border-top: 1px solid var(--border-color);
    border-bottom: 1px solid var(--border-color);
  }

  .lp-section-head {
    max-width: 640px;
    margin-bottom: 40px;
  }

  .lp-section-head h2 {
    margin: 0 0 12px;
    font-size: clamp(26px, 3.2vw, 36px);
    line-height: 1.2;
    font-weight: 800;
    letter-spacing: -0.3px;
    color: var(--text-primary);
  }

  .lp-section-head p {
    margin: 0;
    font-size: 17px;
    line-height: 1.6;
    color: var(--text-secondary);
  }

  /* ---- Modules ---- */
  .lp-modules {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 20px;
  }

  .lp-module {
    padding: 28px;
    background: var(--card-bg);
    border: 1px solid var(--border-color);
    border-radius: 16px;
  }

  .lp-index {
    display: block;
    margin-bottom: 18px;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 1px;
    color: var(--accent-primary);
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

  /* ---- Steps ---- */
  .lp-steps {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 32px;
    counter-reset: none;
  }

  .lp-step-num {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    margin-bottom: 16px;
    border-radius: 50%;
    border: 2px solid var(--accent-primary);
    font-size: 16px;
    font-weight: 800;
    color: var(--accent-primary);
  }

  .lp-step h3 {
    margin: 0 0 8px;
    font-size: 19px;
    font-weight: 700;
    color: var(--text-primary);
  }

  .lp-step p {
    margin: 0;
    font-size: 15px;
    line-height: 1.6;
    color: var(--text-secondary);
  }

  /* ---- Details ---- */
  .lp-details {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 36px 40px;
  }

  .lp-detail {
    padding-left: 16px;
    border-left: 2px solid var(--accent-primary);
  }

  .lp-detail h3 {
    margin: 0 0 6px;
    font-size: 17px;
    font-weight: 700;
    color: var(--text-primary);
  }

  .lp-detail p {
    margin: 0;
    font-size: 15px;
    line-height: 1.6;
    color: var(--text-secondary);
  }

  /* ---- Final CTA ---- */
  .lp-final-wrap {
    padding-top: 0;
  }

  .lp-final {
    padding: 56px 32px;
    text-align: center;
    border-radius: 24px;
    border: 1px solid var(--border-color);
    background: color-mix(in srgb, var(--accent-primary) 10%, var(--card-bg));
  }

  .lp-final h2 {
    margin: 0 0 10px;
    font-size: clamp(26px, 3.2vw, 36px);
    font-weight: 800;
    color: var(--text-primary);
  }

  .lp-final p {
    margin: 0 0 28px;
    font-size: 17px;
    color: var(--text-secondary);
  }

  /* ---- Responsive ---- */
  @media (max-width: 960px) {
    .lp-hero {
      padding: 56px 0 48px;
    }

    .lp-hero-grid {
      grid-template-columns: 1fr;
      gap: 40px;
    }

    .lp-facts-grid {
      grid-template-columns: repeat(2, 1fr);
    }

    .lp-fact:nth-child(3) {
      border-left: none;
    }

    .lp-fact:nth-child(n + 3) {
      border-top: 1px solid var(--border-color);
    }

    .lp-modules,
    .lp-steps {
      grid-template-columns: 1fr;
    }

    .lp-details {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .lp-section {
      padding: 64px 0;
    }

    .lp-final-wrap {
      padding-top: 0;
    }
  }

  @media (max-width: 600px) {
    .lp-wrap {
      padding: 0 16px;
    }

    .lp-lead {
      font-size: 16px;
    }

    .lp-btn {
      flex: 1 1 auto;
      justify-content: center;
    }

    .lp-visual {
      padding: 16px 16px 12px;
    }

    .lp-visual-caption {
      font-size: 11px;
    }

    .lp-fact {
      padding: 20px 12px;
    }

    .lp-fact dt {
      font-size: 28px;
    }

    .lp-details {
      grid-template-columns: 1fr;
      gap: 24px;
    }

    .lp-module {
      padding: 22px;
    }

    .lp-final {
      padding: 40px 20px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .lp-btn-primary:hover {
      transform: none;
    }
  }
</style>
