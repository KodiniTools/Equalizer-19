<template>
  <div class="audio-meter-wrap">
    <div class="meter-header">
      <span class="meter-title"><AppIcon name="meter" /> {{ t.meter_title }}</span>
      <span class="meter-hint" aria-hidden="true">dBFS</span>
    </div>

    <div class="meters-row" role="group" :aria-label="t.meter_title">
      <div
        v-for="(m, i) in meters"
        :key="m.label"
        class="meter-block"
        role="meter"
        :aria-label="(i === 0 ? t.a11y_meter_in : t.a11y_meter_out).replace('{val}', m.dbText)"
        :aria-valuenow="isFinite(m.db) ? m.db : -60"
        aria-valuemin="-60"
        aria-valuemax="0"
      >
        <span class="meter-label" aria-hidden="true">{{ m.label }}</span>

        <div ref="tracks" class="meter-track" aria-hidden="true">
          <!-- Gradient background: green → yellow → red -->
          <!-- Dark mask covers the empty (top) part of the bar -->
          <div class="meter-mask" :style="{ height: 100 - m.fillPct + '%' }"></div>
          <!-- Peak hold marker -->
          <div v-if="m.peakPct > 0" class="meter-peak" :style="{ bottom: m.peakPct + '%' }"></div>
        </div>

        <span class="meter-db" :class="{ clipping: m.db >= -0.5 }" aria-hidden="true">
          {{ m.dbText }}
        </span>
      </div>
    </div>

    <!-- Scale marks -->
    <div class="meter-scale" aria-hidden="true">
      <span>0</span>
      <span>-6</span>
      <span>-12</span>
      <span>-24</span>
      <span>-40</span>
      <span>-60</span>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { reactive, onMounted, onUnmounted } from 'vue'
  import AppIcon from './AppIcon.vue'
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
    background: var(--card-bg);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: 10px 12px 8px;
  }

  .meter-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  .meter-title {
    font-size: 12px;
    font-weight: 600;
    color: var(--text-primary);
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .meter-title .icon {
    width: 14px;
    height: 14px;
    color: var(--accent-primary);
  }

  .meter-hint {
    font-size: 10.5px;
    color: var(--text-muted);
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
  }

  .meters-row {
    display: flex;
    gap: 6px;
    height: 80px;
    align-items: flex-end;
  }

  .meter-block {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    height: 100%;
  }

  .meter-label {
    font-size: 10.5px;
    font-weight: 700;
    color: var(--text-muted);
    letter-spacing: 0.05em;
  }

  .meter-track {
    flex: 1;
    width: 100%;
    border-radius: 3px;
    position: relative;
    overflow: hidden;
    /* gradient: green bottom → yellow → red top */
    background: linear-gradient(
      to top,
      #1db954 0%,
      #1db954 65%,
      #f59e0b 65%,
      #f59e0b 85%,
      #ef4444 85%,
      #ef4444 100%
    );
  }

  /* Dark overlay covering the empty (un-filled) top portion */
  .meter-mask {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    background: var(--secondary-bg);
    transition: height 40ms linear;
    min-height: 0;
    border-radius: 3px 3px 0 0;
  }

  /* Peak hold marker */
  .meter-peak {
    position: absolute;
    left: 0;
    right: 0;
    height: 2px;
    background: #fff;
    opacity: 0.85;
    border-radius: 1px;
    transition: bottom 80ms ease-out;
  }

  .meter-db {
    font-size: 10.5px;
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
    color: var(--text-muted);
    min-width: 28px;
    text-align: center;
  }

  .meter-db.clipping {
    color: #ef4444;
    font-weight: 700;
  }

  /* Scale: right side tick marks */
  .meter-scale {
    display: flex;
    justify-content: space-between;
    margin-top: 4px;
    padding: 0 2px;
  }

  .meter-scale span {
    font-size: 10.5px;
    color: var(--text-muted);
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
    opacity: 0.6;
  }

  @media (max-width: 600px) {
    .meters-row {
      height: 60px;
    }
  }
</style>
