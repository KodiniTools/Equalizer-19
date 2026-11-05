<template>
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
</template>

<script setup>
  import { inject } from 'vue'

  const { t } = inject('i18n')

  const details = ['privacy', 'realtime', 'viz', 'playlist', 'keys', 'devices']
</script>

<style scoped src="./landing.css"></style>

<style scoped>
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

  @media (max-width: 960px) {
    .lp-details {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 600px) {
    .lp-details {
      grid-template-columns: 1fr;
      gap: 24px;
    }
  }
</style>
