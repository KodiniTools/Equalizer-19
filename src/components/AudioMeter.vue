<template>
  <div class="audio-meter-wrap">
    <div class="meters" role="group" :aria-label="t.meter_title">
      <div
        v-for="(m, i) in meters"
        :key="m.label"
        class="meter-row"
        role="meter"
        :aria-label="(i === 0 ? t.a11y_meter_in : t.a11y_meter_out).replace('{val}', m.dbText)"
        :aria-valuenow="isFinite(m.db) ? m.db : -60"
        aria-valuemin="-60"
        aria-valuemax="0"
      >
        <span class="meter-label" aria-hidden="true">{{ m.label }}</span>

        <div class="meter-track" aria-hidden="true">
          <!-- Gradient background: green → yellow → red; the mask covers the empty right part -->
          <div class="meter-mask" :style="{ width: 100 - m.fillPct + '%' }"></div>
          <!-- Peak hold marker -->
          <div v-if="m.peakPct > 0" class="meter-peak" :style="{ left: m.peakPct + '%' }"></div>
        </div>

        <span class="meter-db" :class="{ clipping: m.db >= -0.5 }" aria-hidden="true">
          {{ m.dbText }}
        </span>
      </div>
    </div>

    <!-- Scale marks under the tracks (−60 … 0 dBFS, left to right) -->
    <div class="meter-scale" aria-hidden="true">
      <span
        v-for="mark in SCALE"
        :key="mark.label"
        class="meter-scale-mark"
        :style="{ left: mark.pct + '%' }"
      >
        {{ mark.label }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { reactive, onMounted, onUnmounted } from 'vue'
  import { useAudioEngineStore } from '../stores/audioEngine'
  import { injectI18n } from '../composables/useI18n'

  const { t } = injectI18n()
  const audioEngine = useAudioEngineStore()

  const DB_MIN = -60
  const DB_MAX = 0
  const DB_RANGE = DB_MAX - DB_MIN
  const PEAK_HOLD_MS = 2000
  const PEAK_DECAY_DB_PER_FRAME = 0.15

  interface MeterState {
    label: string
    fillPct: number
    peakPct: number
    db: number
    dbText: string
    _peakDb: number
    _peakTime: number
  }

  function createMeter(label: string): MeterState {
    return {
      label,
      fillPct: 0,
      peakPct: 0,
      db: -Infinity,
      dbText: '—',
      _peakDb: -Infinity,
      _peakTime: 0,
    }
  }

  const meters = reactive<MeterState[]>([createMeter('IN'), createMeter('OUT')])

  // Scale labels as percent of the track width (−60 dB left, 0 dB right)
  const SCALE = [-60, -40, -24, -12, -6, 0].map((db) => ({
    label: String(db),
    pct: ((db - DB_MIN) / DB_RANGE) * 100,
  }))

  let rafId: number | null = null

  function dbToPercent(db: number): number {
    if (!isFinite(db)) return 0
    return Math.max(0, Math.min(100, ((db - DB_MIN) / DB_RANGE) * 100))
  }

  function updateMeter(m: MeterState, rawDb: number): void {
    const db = Math.max(DB_MIN, Math.min(0, rawDb))
    const isActive = isFinite(rawDb) && rawDb > DB_MIN + 2

    m.db = isActive ? db : -Infinity
    m.fillPct = isActive ? dbToPercent(db) : 0
    m.dbText = isActive ? (db >= 0 ? '0.0' : db.toFixed(1)) : '—'

    // Peak hold
    const now = performance.now()
    if (isActive && db >= m._peakDb) {
      m._peakDb = db
      m._peakTime = now
    } else if (now - m._peakTime > PEAK_HOLD_MS) {
      m._peakDb -= PEAK_DECAY_DB_PER_FRAME
      if (m._peakDb < DB_MIN) m._peakDb = -Infinity
    }
    m.peakPct = isFinite(m._peakDb) ? dbToPercent(m._peakDb) : 0
  }

  function tick(): void {
    if (audioEngine.isInitialized) {
      updateMeter(meters[0], audioEngine.getInputLevel())
      updateMeter(meters[1], audioEngine.getOutputLevel())
    } else {
      meters[0].fillPct = 0
      meters[1].fillPct = 0
    }
    rafId = requestAnimationFrame(tick)
  }

  onMounted(() => {
    rafId = requestAnimationFrame(tick)
  })
  onUnmounted(() => {
    if (rafId) cancelAnimationFrame(rafId)
  })
</script>

<style scoped>
  .audio-meter-wrap {
    background: linear-gradient(155deg, var(--card-bg), var(--secondary-bg));
    border: 1px solid var(--border-color);
    border-radius: 16px;
    padding: 10px 12px 8px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .meters {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  /* Label | track | value, the labels share one column width in both rows */
  .meter-row {
    display: grid;
    grid-template-columns: 32px minmax(0, 1fr) 44px;
    align-items: center;
    gap: 8px;
  }

  .meter-label {
    font-size: 10.5px;
    font-weight: 400;
    color: var(--text-secondary);
    letter-spacing: 0.05em;
  }

  .meter-track {
    position: relative;
    height: 12px;
    border-radius: 999px;
    overflow: hidden;
    border: 1px solid var(--border-strong);
    /* gradient: green left → yellow → red right */
    background: linear-gradient(
      to right,
      var(--success) 0%,
      var(--success) 65%,
      var(--warning) 65%,
      var(--warning) 85%,
      var(--error) 85%,
      var(--error) 100%
    );
  }

  /* Overlay covering the empty (un-filled) right portion */
  .meter-mask {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    background: var(--secondary-bg);
    transition: width 40ms linear;
  }

  /* Peak hold marker */
  .meter-peak {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 2px;
    margin-left: -1px;
    background: var(--text-primary);
    opacity: 0.9;
    transition: left 80ms ease-out;
  }

  .meter-db {
    font-size: 10.5px;
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
    color: var(--text-muted);
    text-align: right;
  }

  .meter-db.clipping {
    color: var(--error);
    font-weight: 400;
  }

  /* Scale: positioned under the track column */
  .meter-scale {
    position: relative;
    height: 14px;
    margin: 0 52px 0 40px;
  }

  .meter-scale-mark {
    position: absolute;
    top: 0;
    font-size: 10px;
    color: var(--text-muted);
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
  }

  .meter-scale-mark {
    transform: translateX(-50%);
  }

  .meter-scale-mark:first-of-type {
    transform: none;
  }

  .meter-scale-mark:last-of-type {
    transform: translateX(-100%);
  }

  @media (prefers-reduced-motion: reduce) {
    .meter-mask,
    .meter-peak {
      transition: none;
    }
  }
</style>
