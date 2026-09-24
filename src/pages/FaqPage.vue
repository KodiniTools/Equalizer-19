<template>
  <div class="faq-page">
    <!-- Header -->
    <header class="fq-hero">
      <div class="fq-wrap">
        <router-link to="/" class="page-link page-link-strong fq-back">
          <span aria-hidden="true">←</span> {{ t.app_back_home }}
        </router-link>
        <p class="fq-eyebrow">{{ t.faq_eyebrow }}</p>
        <h1 class="fq-title">{{ t.faq_title }}</h1>
        <p class="fq-lead">{{ t.faq_subtitle }}</p>
      </div>
    </header>

    <main class="fq-wrap fq-layout">
      <!-- Topic navigation -->
      <nav class="fq-nav" :aria-label="t.faq_nav_label">
        <p class="fq-nav-label">{{ t.faq_nav_label }}</p>
        <ul>
          <li v-for="cat in CATEGORIES" :key="cat.id">
            <a :href="`#${cat.id}`">{{ t[cat.titleKey] }}</a>
          </li>
        </ul>
      </nav>

      <!-- Questions -->
      <div class="fq-content">
        <section
          v-for="cat in CATEGORIES"
          :id="cat.id"
          :key="cat.id"
          class="fq-category"
          :aria-labelledby="`${cat.id}-title`"
        >
          <h2 :id="`${cat.id}-title`">{{ t[cat.titleKey] }}</h2>
          <details v-for="n in cat.count" :key="n" class="fq-item">
            <summary>
              <span>{{ t[`${cat.prefix}q${n}`] }}</span>
              <span class="fq-toggle" aria-hidden="true"></span>
            </summary>
            <p class="fq-answer">{{ t[`${cat.prefix}a${n}`] }}</p>
          </details>
        </section>
      </div>
    </main>

    <!-- Final call to action (same style as the landing page) -->
    <section class="fq-wrap fq-final-wrap">
      <div class="fq-final">
        <h2>{{ t.faq_cta_title }}</h2>
        <p>{{ t.faq_cta_desc }}</p>
        <router-link to="/app" class="lp-btn lp-btn-primary">
          {{ t.nav_start_app }} <span aria-hidden="true">→</span>
        </router-link>
      </div>
    </section>
  </div>
</template>

<script setup>
  import { inject } from 'vue'

  const { t } = inject('i18n')

  /**
   * FAQ structure: question/answer strings are `${prefix}q${n}` / `${prefix}a${n}`.
   * Add a question by adding both strings and increasing `count`.
   */
  const CATEGORIES = [
    { id: 'allgemein', titleKey: 'faq_cat_general', prefix: 'faq_', count: 3 },
    { id: 'equalizer', titleKey: 'faq_cat_equalizer', prefix: 'faq_eq_', count: 3 },
    { id: 'kompressor', titleKey: 'faq_cat_compressor', prefix: 'faq_comp_', count: 3 },
    { id: 'aufnahme', titleKey: 'faq_cat_recording', prefix: 'faq_rec_', count: 4 },
    { id: 'eingang', titleKey: 'faq_cat_input', prefix: 'faq_in_', count: 4 },
    { id: 'technik', titleKey: 'faq_cat_technical', prefix: 'faq_tech_', count: 3 },
  ]
</script>

<style scoped>
  .faq-page {
    color: var(--text-primary);
  }

  .fq-wrap {
    max-width: 1160px;
    margin: 0 auto;
    padding: 0 24px;
  }

  /* ---- Header ---- */
  .fq-hero {
    background: var(--gradient-primary);
    padding: 80px 0 56px;
    border-bottom: 1px solid var(--border-color);
  }

  .fq-back {
    margin-bottom: 28px;
  }

  .fq-eyebrow {
    margin: 0 0 14px;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.4px;
    color: var(--accent-primary);
  }

  .fq-title {
    margin: 0 0 14px;
    font-size: clamp(32px, 4.5vw, 48px);
    line-height: 1.1;
    font-weight: 800;
    letter-spacing: -0.5px;
    color: var(--text-primary);
  }

  .fq-lead {
    margin: 0;
    max-width: 600px;
    font-size: 18px;
    line-height: 1.6;
    color: var(--text-secondary);
  }

  /* ---- Layout: topic nav + questions ---- */
  .fq-layout {
    display: grid;
    grid-template-columns: 220px minmax(0, 1fr);
    gap: 56px;
    padding-top: 56px;
    padding-bottom: 72px;
  }

  .fq-nav {
    position: sticky;
    top: 96px;
    align-self: start;
  }

  .fq-nav-label {
    margin: 0 0 12px;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.8px;
    text-transform: uppercase;
    color: var(--text-muted);
  }

  .fq-nav ul {
    list-style: none;
    margin: 0;
    padding: 0;
    border-left: 1px solid var(--border-color);
  }

  .fq-nav a {
    display: block;
    margin-left: -1px;
    padding: 8px 0 8px 16px;
    border-left: 2px solid transparent;
    font-size: 15px;
    color: var(--text-secondary);
    text-decoration: none;
    transition:
      color 0.2s,
      border-color 0.2s;
  }

  .fq-nav a:hover {
    color: var(--text-primary);
    border-left-color: var(--accent-primary);
  }

  .fq-nav a:focus-visible {
    outline: 2px solid var(--accent-primary);
    outline-offset: 2px;
  }

  /* ---- Categories & questions ---- */
  .fq-content {
    display: flex;
    flex-direction: column;
    gap: 48px;
  }

  .fq-category {
    /* Keep headings clear of the fixed site navigation when jumping to a topic */
    scroll-margin-top: 96px;
  }

  .fq-category h2 {
    margin: 0 0 12px;
    font-size: 24px;
    font-weight: 800;
    letter-spacing: -0.2px;
    color: var(--text-primary);
  }

  .fq-item {
    border-bottom: 1px solid var(--border-color);
  }

  .fq-item:first-of-type {
    border-top: 1px solid var(--border-color);
  }

  .fq-item summary {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 18px 0;
    cursor: pointer;
    list-style: none;
    font-size: 17px;
    font-weight: 600;
    color: var(--text-primary);
    transition: color 0.2s;
  }

  .fq-item summary::-webkit-details-marker {
    display: none;
  }

  .fq-item summary:hover {
    color: var(--accent-primary);
  }

  .fq-item summary:focus-visible {
    outline: 2px solid var(--accent-primary);
    outline-offset: 4px;
    border-radius: 4px;
  }

  /* Plus/minus drawn with CSS (no icon font) */
  .fq-toggle {
    position: relative;
    flex-shrink: 0;
    width: 28px;
    height: 28px;
    border: 1px solid var(--border-color);
    border-radius: 50%;
  }

  .fq-toggle::before,
  .fq-toggle::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 11px;
    height: 2px;
    border-radius: 1px;
    background: var(--accent-primary);
    transform: translate(-50%, -50%);
    transition: transform 0.2s;
  }

  .fq-toggle::after {
    transform: translate(-50%, -50%) rotate(90deg);
  }

  .fq-item[open] .fq-toggle::after {
    transform: translate(-50%, -50%) rotate(0deg);
  }

  .fq-answer {
    margin: 0;
    padding: 0 44px 20px 0;
    font-size: 16px;
    line-height: 1.7;
    color: var(--text-secondary);
  }

  /* ---- Final CTA ---- */
  .fq-final-wrap {
    padding-bottom: 88px;
  }

  .fq-final {
    padding: 56px 32px;
    text-align: center;
    border-radius: 24px;
    border: 1px solid var(--border-color);
    background: color-mix(in srgb, var(--accent-primary) 10%, var(--card-bg));
  }

  .fq-final h2 {
    margin: 0 0 10px;
    font-size: clamp(26px, 3.2vw, 36px);
    font-weight: 800;
    color: var(--text-primary);
  }

  .fq-final p {
    margin: 0 0 28px;
    font-size: 17px;
    color: var(--text-secondary);
  }

  /* ---- Responsive ---- */
  @media (max-width: 900px) {
    .fq-hero {
      padding: 56px 0 40px;
    }

    .fq-layout {
      grid-template-columns: 1fr;
      gap: 32px;
      padding-top: 32px;
      padding-bottom: 56px;
    }

    /* Topics become a horizontal chip row */
    .fq-nav {
      position: static;
    }

    .fq-nav ul {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      border-left: none;
    }

    .fq-nav a {
      margin-left: 0;
      padding: 8px 14px;
      border: 1px solid var(--border-color);
      border-radius: 999px;
      font-size: 14px;
    }

    .fq-nav a:hover {
      border-color: var(--accent-primary);
    }
  }

  @media (max-width: 600px) {
    /* Only the side gutters: vertical paddings of .fq-layout / .fq-final-wrap stay */
    .fq-wrap {
      padding-left: 16px;
      padding-right: 16px;
    }

    .fq-lead {
      font-size: 16px;
    }

    .fq-item summary {
      font-size: 16px;
    }

    .fq-answer {
      padding-right: 0;
      font-size: 15px;
    }

    .fq-final {
      padding: 40px 20px;
    }
  }
</style>
