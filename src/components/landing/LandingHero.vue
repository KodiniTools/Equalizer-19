<template>
  <section class="lp-hero">
    <div class="lp-wrap lp-hero-grid">
      <div class="lp-hero-head">
        <p class="lp-eyebrow">{{ t.lp_eyebrow }}</p>
        <h1 class="lp-title">{{ t.lp_title }}</h1>
      </div>

      <!-- Interactive product demo: the same presets the app ships with.
           On narrow screens it moves directly under the title (grid areas). -->
      <HeroEqualizer class="lp-demo" />

      <div class="lp-hero-body">
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
    </div>
  </section>
</template>

<script setup lang="ts">
  import AppIcon from '../AppIcon.vue'
  import HeroEqualizer from './HeroEqualizer.vue'
  import { injectI18n } from '../../composables/useI18n'
  import { UiButton } from '../ui'

  const { t } = injectI18n()

  const trust = ['uploads', 'account', 'browsers'] as const
</script>

<style scoped src="./landing.css"></style>

<style scoped src="./hero-layout.css"></style>
