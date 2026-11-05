<template>
  <section class="lp-section lp-final-wrap">
    <!-- Final call to action -->
    <div class="lp-wrap">
      <div class="lp-final">
        <h2>{{ t.lp_final_title }}</h2>
        <p>{{ t.lp_final_desc }}</p>
        <UiButton to="/app" variant="primary" size="lg">
          {{ t.lp_cta_start }} <span aria-hidden="true">→</span>
        </UiButton>
      </div>
    </div>
  </section>
</template>

<script setup>
  import { inject } from 'vue'
  import { UiButton } from '../ui'

  const { t } = inject('i18n')
</script>

<style scoped src="./landing.css"></style>

<style scoped>
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

  @media (max-width: 600px) {
    .lp-final {
      padding: 40px 20px;
    }
  }
</style>
