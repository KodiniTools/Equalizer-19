<template>
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
</template>

<script setup>
  import { inject } from 'vue'
  import { EQ_BAND_FREQUENCIES, EQ_PRESETS, COMP_PRESETS } from '../../utils/presets'

  const { t } = inject('i18n')

  // Facts derived from the actual configuration, so they never go stale
  const bandCount = EQ_BAND_FREQUENCIES.length
  const presetCount = Object.keys(EQ_PRESETS).length + Object.keys(COMP_PRESETS).length
</script>

<style scoped src="./landing.css"></style>

<style scoped>
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

  @media (max-width: 960px) {
    .lp-facts-grid {
      grid-template-columns: repeat(2, 1fr);
    }

    .lp-fact:nth-child(3) {
      border-left: none;
    }

    .lp-fact:nth-child(n + 3) {
      border-top: 1px solid var(--border-color);
    }
  }

  @media (max-width: 600px) {
    .lp-fact {
      padding: 14px 12px;
    }

    .lp-fact dt {
      font-size: 20px;
    }
  }
</style>
