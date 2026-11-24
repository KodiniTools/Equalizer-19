<template>
  <div class="gr-meter">
    <div class="gr-head">
      <span class="panel-section-label gr-label">{{ t.comp_gain_reduction }}</span>
      <span class="gr-value" :class="{ idle: reductionDb === 0 }" aria-hidden="true">
        {{ valueText }}
      </span>
    </div>
    <div
      class="gr-track"
      role="meter"
      :aria-label="t.a11y_gain_reduction.replace('{val}', valueText)"
      :aria-valuenow="reductionDb"
      :aria-valuemin="-MAX_DB"
      aria-valuemax="0"
    >
      <!-- Fills from the right: the more the compressor works, the longer the bar -->
      <div class="gr-fill" :style="{ width: fillPct + '%' }"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted, onUnmounted, ref } from 'vue'
  import { useAudioEngineStore } from '../../stores/audioEngine'
  import { injectI18n } from '../../composables/useI18n'

  /**
   * Zeigt die aktuelle Pegelabsenkung des Kompressors (Gain Reduction) als
   * Balken, der von rechts her wächst; liest je Frame den Engine-Store.
   */
  const { t } = injectI18n()
  const audioEngine = useAudioEngineStore()

  const MAX_DB = 24
  const reductionDb = ref(0)
  let rafId: number | null = null

  const fillPct = computed(() => Math.min(100, (-reductionDb.value / MAX_DB) * 100))
  const valueText = computed(() =>
    reductionDb.value === 0 ? '0 dB' : `−${(-reductionDb.value).toFixed(1)} dB`
  )

  function tick(): void {
    if (!document.hidden) {
      // One decimal is enough for the display and avoids needless re-renders
      reductionDb.value = Math.round(audioEngine.getGainReduction() * 10) / 10
    }
    rafId = requestAnimationFrame(tick)
  }

  onMounted(() => {
    if (typeof requestAnimationFrame === 'function') rafId = requestAnimationFrame(tick)
  })
  onUnmounted(() => {
    if (rafId !== null) cancelAnimationFrame(rafId)
  })
</script>

<style scoped>
  .gr-meter {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .gr-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px;
  }

  .gr-label {
    font-size: 10.5px;
    font-weight: 400;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    color: var(--text-muted);
  }

  .gr-value {
    font-family: var(--font-mono);
    font-size: 11px;
    font-variant-numeric: tabular-nums;
    color: var(--eq-cut);
  }

  .gr-value.idle {
    color: var(--text-muted);
  }

  .gr-track {
    position: relative;
    height: 8px;
    border-radius: 4px;
    background: var(--secondary-bg);
    border: 1px solid var(--border-color);
    overflow: hidden;
  }

  .gr-fill {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    border-radius: 4px;
    background: var(--eq-cut);
    transition: width 60ms linear;
  }

  @media (prefers-reduced-motion: reduce) {
    .gr-fill {
      transition: none;
    }
  }
</style>
