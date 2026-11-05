<template>
  <section class="lp-hero">
    <div class="lp-wrap lp-hero-grid">
      <div class="lp-hero-text">
        <p class="lp-eyebrow">{{ t.lp_eyebrow }}</p>
        <h1 class="lp-title">{{ t.lp_title }}</h1>
        <p class="lp-lead">{{ t.lp_subtitle }}</p>
        <div class="lp-actions">
          <UiButton to="/app" variant="primary" size="lg">
            {{ t.lp_cta_start }} <span aria-hidden="true">→</span>
          </UiButton>
          <UiButton href="#features" variant="outline" size="lg">{{ t.lp_cta_learn }}</UiButton>
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
</template>

<script setup>
  import { inject } from 'vue'
  import AppIcon from '../AppIcon.vue'
  import HeroEqualizer from './HeroEqualizer.vue'
  import { UiButton } from '../ui'

  const { t } = inject('i18n')

  const trust = ['uploads', 'account', 'browsers']
</script>

<style scoped src="./landing.css"></style>

<style scoped>
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

  @media (max-width: 960px) {
    .lp-hero {
      padding: 56px 0 48px;
    }

    .lp-hero-grid {
      grid-template-columns: 1fr;
      gap: 40px;
    }
  }

  @media (max-width: 600px) {
    .lp-lead {
      font-size: 16px;
    }

    .lp-actions .ui-button {
      flex: 1 1 auto;
      justify-content: center;
    }
  }
</style>
