<template>
  <div class="container">
    <div class="card promo-card">
      <div class="row" style="justify-content:space-between;align-items:center">
        <strong>{{ t.audio_converter }}</strong>
        <a 
          class="btn primary" 
          href="https://kodinitools.com/audiokonverter/" 
          target="_blank" 
          rel="noopener"
        >
          <i class="fas fa-wand-magic-sparkles"></i>
          <span>{{ t.convert_now }}</span>
        </a>
      </div>

      <div class="hint">
        <i class="fas fa-circle-info"></i>
        <div>
          <strong>{{ t.pro_tip }}</strong>
          <span>{{ t.converter_desc }}</span>
        </div>
      </div>

      <div class="meta">
        <span class="chip">{{ t.example_formats }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { inject } from 'vue'

const { t } = inject('i18n')
</script>
