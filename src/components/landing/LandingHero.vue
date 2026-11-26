<template>
  <section class="lp-hero">
    <div class="lp-wrap lp-hero-grid">
      <div class="lp-hero-head">
        <p class="lp-eyebrow">{{ t.lp_eyebrow }}</p>
        <h1 class="lp-title">
          <span class="lp-title-accent">{{ titleParts.lead }}</span
          ><span v-if="titleParts.rest" class="lp-title-blue">{{ titleParts.rest }}</span>
        </h1>
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
  import { computed } from 'vue'
  import AppIcon from '../AppIcon.vue'
  import HeroEqualizer from './HeroEqualizer.vue'
  import { injectI18n } from '../../composables/useI18n'
  import { UiButton } from '../ui'

  const { t } = injectI18n()

  /**
   * The title is coloured in two parts, split after the first comma
   * ("Professioneller Klang," / " direkt im Browser"). The space after the comma
   * stays at the start of the second part, so the spans need no whitespace
   * between them in the template. Without a comma the whole title takes the
   * first colour.
   */
  const titleParts = computed(() => {
    const title = t.value.lp_title
    const cut = title.indexOf(',') + 1
    return cut > 0
      ? { lead: title.slice(0, cut), rest: title.slice(cut) }
      : { lead: title, rest: '' }
  })

  const trust = ['uploads', 'account', 'browsers'] as const
</script>

<style scoped src="./landing.css"></style>

<style scoped src="./hero-layout.css"></style>
