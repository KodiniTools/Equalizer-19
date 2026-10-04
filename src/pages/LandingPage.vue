<template>
  <div class="landing-page">
    <!-- Local navigation: home, sections, FAQ, app (sticky under the global nav) -->
    <HeroNav />

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
          <ul class="lp-trust">
            <li v-for="key in trust" :key="key">
              <AppIcon name="check" size="14" />
              {{ t[`lp_trust_${key}`] }}
            </li>
          </ul>
        </div>

        <!-- Interactive product demo: the same presets the app ships with -->
        <HeroEqualizer class="lp-demo" />
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
                  <rect
                    class="art-peak"
                    :x="bar.x"
                    :y="ART.h - bar.peak"
                    :width="bar.w"
                    height="2"
                  />
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

    <!-- Blog: posts about Equalizer 19 on kodinitools.com (src/data/blogArticles.js) -->
    <section id="blog" class="lp-section lp-section-alt">
      <div class="lp-wrap">
        <header class="lp-section-head">
          <h2>{{ t.lp_blog_title }}</h2>
          <p>{{ t.lp_blog_subtitle }}</p>
        </header>
        <div class="lp-blog-grid">
          <a
            v-for="article in blogCards"
            :key="article.id"
            :href="article.url"
            class="lp-blog-card"
            target="_blank"
            rel="noopener noreferrer"
          >
            <div class="lp-blog-media">
              <img :src="article.image" alt="" width="640" height="360" loading="lazy" />
            </div>
            <div class="lp-blog-body">
              <div class="lp-blog-head">
                <span class="lp-blog-tag">{{ article.tag }}</span>
                <span class="lp-blog-meta">{{ article.meta }}</span>
              </div>
              <h3>{{ article.title }}</h3>
              <p>{{ article.description }}</p>
              <span class="lp-blog-link">
                {{ t.lp_blog_read_more }} <span aria-hidden="true">→</span>
              </span>
            </div>
          </a>
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
  import { inject, computed } from 'vue'
  import AppIcon from '../components/AppIcon.vue'
  import HeroEqualizer from '../components/HeroEqualizer.vue'
  import HeroNav from '../components/HeroNav.vue'
  import { getBlogArticlesNewestFirst } from '../data/blogArticles.js'
  import { buildBlogCards } from '../utils/blogCards.js'
  import { EQ_BAND_FREQUENCIES, EQ_PRESETS, COMP_PRESETS } from '../utils/presets.js'
  import { buildEqCurve, smoothPath } from '../utils/eqCurve.js'

  const { t, currentLanguage } = inject('i18n')

  // Blog cards in the active language, newest post first (src/data/blogArticles.js)
  const blogCards = computed(() =>
    buildBlogCards(getBlogArticlesNewestFirst(), currentLanguage.value, t.value.lp_blog_minutes)
  )

  // Facts derived from the actual configuration, so they never go stale
  const bandCount = EQ_BAND_FREQUENCIES.length
  const presetCount = Object.keys(EQ_PRESETS).length + Object.keys(COMP_PRESETS).length

  const trust = ['uploads', 'account', 'browsers']
  const modules = [{ key: 'input' }, { key: 'eq' }, { key: 'comp' }, { key: 'rec' }]
  const details = ['privacy', 'realtime', 'viz', 'playlist', 'keys', 'devices']

  // Small illustrations in the signal-chain cards (SVG user units)
  const ART = { w: 160, h: 56 }
  const artCurve = buildEqCurve(EQ_PRESETS.Rock, { w: ART.w, h: ART.h, range: ART.h * 0.4 })

  // Live input: a waveform whose envelope swells and fades across the card.
  const inputWave = smoothPath(
    Array.from({ length: 33 }, (_, i) => {
      const x = (i / 32) * ART.w
      const env = Math.sin((i / 32) * Math.PI)
      const y = ART.h / 2 - Math.sin(i * 1.9) * env * (ART.h * 0.42)
      return [x, y]
    })
  )

  // Compressor transfer curve: unity below the threshold, 4:1 above, soft knee.
  const compPoints = [
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

<style scoped>
  .landing-page {
    color: var(--text-primary);
    /* Anchor targets must clear both sticky bars: global nav (70px) + HeroNav (56px) */
    --lp-anchor-offset: 148px;
  }

  .lp-wrap {
    max-width: 1160px;
    margin: 0 auto;
    padding: 0 24px;
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

  .lp-trust {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 18px;
    margin: 20px 0 0;
    padding: 0;
    list-style: none;
    font-size: 13px;
    color: var(--text-muted);
  }

  .lp-trust li {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .lp-trust .icon {
    color: var(--success);
  }

  .lp-demo {
    min-width: 0;
  }

  /* ---- Facts: a narrow strip under the hero ---- */
  .lp-facts {
    border-top: 1px solid var(--border-color);
    border-bottom: 1px solid var(--border-color);
    background: var(--secondary-bg);
  }

  .lp-facts-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    margin: 0 auto;
  }

  .lp-fact {
    display: grid;
    gap: 2px;
    padding: 18px 20px;
  }

  .lp-fact + .lp-fact {
    border-left: 1px solid var(--border-color);
  }

  .lp-fact dt {
    font-family: var(--font-mono);
    font-size: 24px;
    font-weight: 600;
    line-height: 1.1;
    color: var(--text-primary);
  }

  .lp-fact dd {
    margin: 0;
    font-size: 12.5px;
    line-height: 1.4;
    color: var(--text-muted);
  }

  /* ---- Sections ---- */
  .lp-section {
    padding: 88px 0;
  }

  /* Keep anchored sections clear of the sticky navigation bars */
  #features,
  #blog {
    scroll-margin-top: var(--lp-anchor-offset);
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

  /* ---- Modules as a signal chain ---- */
  .mono {
    font-family: var(--font-mono);
  }

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

  /* ---- Blog cards (posts on kodinitools.com) ---- */
  .lp-blog-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
  }

  .lp-blog-card {
    display: flex;
    flex-direction: column;
    background: var(--secondary-bg);
    border: 1px solid var(--border-color);
    border-radius: 16px;
    overflow: hidden;
    color: inherit;
    text-decoration: none;
    transition:
      border-color 0.2s,
      transform 0.2s,
      box-shadow 0.2s;
  }

  .lp-blog-card:hover,
  .lp-blog-card:focus-visible {
    border-color: var(--accent-primary);
    transform: translateY(-2px);
    box-shadow: 0 12px 28px var(--shadow-light);
  }

  .lp-blog-card:focus-visible {
    outline: 2px solid var(--accent-primary);
    outline-offset: 2px;
  }

  .lp-blog-media {
    aspect-ratio: 16 / 9;
    background: var(--primary-bg);
    border-bottom: 1px solid var(--border-color);
    overflow: hidden;
  }

  .lp-blog-media img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.4s ease;
  }

  .lp-blog-card:hover .lp-blog-media img {
    transform: scale(1.03);
  }

  .lp-blog-body {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 10px;
    padding: 20px 24px 24px;
  }

  .lp-blog-head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }

  .lp-blog-tag {
    padding: 3px 9px;
    border-radius: 999px;
    background: var(--accent-primary);
    color: var(--on-accent);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .lp-blog-meta {
    font-size: 13px;
    color: var(--text-muted);
  }

  .lp-blog-body h3 {
    margin: 0;
    font-size: 18px;
    line-height: 1.35;
    font-weight: 700;
    color: var(--text-primary);
  }

  .lp-blog-body p {
    flex: 1;
    margin: 0;
    font-size: 14.5px;
    line-height: 1.6;
    color: var(--text-secondary);
  }

  .lp-blog-link {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-top: 4px;
    font-size: 14px;
    font-weight: 600;
    color: var(--accent-primary);
  }

  /* ---- Final CTA ---- */
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
  @media (max-width: 768px) {
    .landing-page {
      --lp-anchor-offset: 130px;
    }
  }

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

    .lp-steps {
      grid-template-columns: 1fr;
    }

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

    .lp-details {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .lp-section {
      padding: 64px 0;
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

    .lp-fact {
      padding: 14px 12px;
    }

    .lp-fact dt {
      font-size: 20px;
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
    .lp-btn-primary:hover,
    .lp-blog-card:hover,
    .lp-blog-card:hover .lp-blog-media img {
      transform: none;
    }
  }
</style>
