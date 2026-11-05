<template>
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
</template>

<script setup>
  import { inject } from 'vue'

  const { t } = inject('i18n')
</script>

<style scoped src="./landing.css"></style>

<style scoped>
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

  @media (max-width: 960px) {
    .lp-steps {
      grid-template-columns: 1fr;
    }
  }
</style>
