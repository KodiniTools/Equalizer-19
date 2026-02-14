<template>
  <div class="container">
    <div class="promo-section">
      <div class="promo-header">
        <h1 class="promo-title">{{ t.promo_title }}</h1>
        <p class="promo-subtitle">{{ t.promo_subtitle }}</p>
      </div>
      
      <div class="promo-features">
        <div class="feature-card">
          <h2 class="feature-title">{{ t.feature_eq_title }}</h2>
          <p class="feature-desc">{{ t.feature_eq_desc }}</p>
        </div>

        <div class="feature-card">
          <h2 class="feature-title">{{ t.feature_comp_title }}</h2>
          <p class="feature-desc">{{ t.feature_comp_desc }}</p>
        </div>

        <div class="feature-card">
          <h2 class="feature-title">{{ t.feature_rec_title }}</h2>
          <p class="feature-desc">{{ t.feature_rec_desc }}</p>
        </div>

        <div class="feature-card">
          <h2 class="feature-title">{{ t.feature_viz_title }}</h2>
          <p class="feature-desc">{{ t.feature_viz_desc }}</p>
        </div>
      </div>
      
      <div class="promo-stats">
        <div class="stat-item">
          <span class="stat-number">19</span>
          <span class="stat-label">{{ t.stat_bands }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">96kHz</span>
          <span class="stat-label">{{ t.stat_quality }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">&lt;5ms</span>
          <span class="stat-label">{{ t.stat_latency }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">8+</span>
          <span class="stat-label">{{ t.stat_presets }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { inject } from 'vue'

const { t } = inject('i18n')
</script>
