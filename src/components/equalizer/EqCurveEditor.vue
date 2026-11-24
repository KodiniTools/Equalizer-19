<template>
  <div class="eq-editor" :class="{ disabled }">
    <div ref="stageRef" class="eq-stage">
      <svg
        ref="svgRef"
        class="eq-svg"
        :viewBox="`0 0 ${size.w} ${size.h}`"
        :aria-label="t.a11y_eq_curve"
        role="group"
        @pointerdown="onStagePointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp"
        @dblclick="onDblClick"
      >
        <defs>
          <clipPath :id="ids.up">
            <rect :x="plot.left" :y="plot.top" :width="plot.w" :height="curve.mid - plot.top" />
          </clipPath>
          <clipPath :id="ids.dn">
            <rect :x="plot.left" :y="curve.mid" :width="plot.w" :height="plot.bottom - curve.mid" />
          </clipPath>
        </defs>

        <!-- Grid: dB lines with labels on the left, frequency lines with labels below -->
        <g class="eq-grid" aria-hidden="true">
          <template v-for="g in dbGrid" :key="g.db">
            <line
              :x1="plot.left"
              :x2="plot.right"
              :y1="g.y"
              :y2="g.y"
              :class="{ zero: g.db === 0 }"
            />
            <text :x="plot.left - 6" :y="g.y + 3.5" text-anchor="end">{{ g.label }}</text>
          </template>
          <template v-for="f in freqGrid" :key="f.freq">
            <line :x1="f.x" :x2="f.x" :y1="plot.top" :y2="plot.bottom" />
            <text :x="f.x" :y="size.h - 5" text-anchor="middle">{{ f.label }}</text>
          </template>
        </g>

        <!-- Live spectrum behind the curve (empty path when no audio is running) -->
        <path v-if="spectrumPath" class="eq-spectrum" :d="spectrumPath" aria-hidden="true" />

        <!-- The curve: boost above the 0 dB line in the boost colour, cut below in the cut colour -->
        <g aria-hidden="true">
          <path class="eq-fill boost" :d="curve.area" :clip-path="`url(#${ids.up})`" />
          <path class="eq-fill cut" :d="curve.area" :clip-path="`url(#${ids.dn})`" />
          <path class="eq-line boost" :d="curve.line" :clip-path="`url(#${ids.up})`" />
          <path class="eq-line cut" :d="curve.line" :clip-path="`url(#${ids.dn})`" />
        </g>

        <!-- One draggable node per band; also a keyboard slider -->
        <g
          v-for="(band, index) in bands"
          :key="band.frequency"
          class="eq-node"
          :class="{ boost: band.gain > 0, cut: band.gain < 0, active: index === dragIndex }"
          role="slider"
          :tabindex="disabled ? -1 : 0"
          :aria-label="nodeLabel(band)"
          :aria-valuemin="-MAX_GAIN"
          :aria-valuemax="MAX_GAIN"
          :aria-valuenow="band.gain"
          :aria-valuetext="`${formatGain(band.gain)} dB`"
          :aria-disabled="disabled || undefined"
          :data-index="index"
          @keydown="onKeyDown(index, $event)"
          @focus="focusIndex = index"
          @blur="focusIndex = -1"
        >
          <circle
            class="eq-node-hit"
            :cx="curve.points[index][0]"
            :cy="curve.points[index][1]"
            r="12"
          />
          <circle
            class="eq-node-dot"
            :cx="curve.points[index][0]"
            :cy="curve.points[index][1]"
            r="5"
          />
        </g>

        <!-- Value bubble for the band being dragged or focused -->
        <g v-if="shownIndex >= 0" class="eq-bubble" aria-hidden="true">
          <rect :x="bubble.x" :y="bubble.y" :width="bubble.w" height="20" rx="5" />
          <text :x="bubble.x + bubble.w / 2" :y="bubble.y + 14" text-anchor="middle">
            {{ bubble.text }}
          </text>
        </g>
      </svg>
    </div>

    <!-- Compact band row: value, boost/cut bar, frequency. Clicking focuses the node. -->
    <div class="eq-band-row" aria-hidden="true">
      <button
        v-for="(band, index) in bands"
        :key="band.frequency"
        type="button"
        class="eq-band"
        :class="{ boost: band.gain > 0, cut: band.gain < 0 }"
        tabindex="-1"
        :disabled="disabled"
        @click="focusNode(index)"
      >
        <span class="val">{{ formatGain(band.gain) }}</span>
        <span class="bar"><i :style="barStyle(band.gain)"></i></span>
        <span class="freq">{{ formatFrequency(band.frequency) }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'
  import { formatFrequency } from '../../utils/presets'
  import { buildEqCurve, formatGain, logFrequencyX } from '../../utils/eqCurve'
  import { injectI18n } from '../../composables/useI18n'

  /** What the editor needs of a band (stores/audioEngine EqBand fits). */
  export interface EqBandView {
    frequency: number
    gain: number
  }

  /**
   * Die 19 Bänder als eine Kurve auf einer logarithmischen Frequenzachse:
   * jeder Punkt lässt sich mit Maus/Finger ziehen und ist per Tastatur ein
   * Slider (Pfeile ±0,5 dB, Bild auf/ab ±3 dB, Pos1/Ende = −12/+12 dB,
   * Doppelklick = 0 dB). Hinter der Kurve läuft das Live-Spektrum aus
   * `getSpectrum`. Rein darstellend: jede Änderung wird als change(index, gain)
   * gemeldet, der Container schreibt sie in den Engine-Store.
   */
  const props = withDefaults(
    defineProps<{
      /** in Band-Reihenfolge */
      bands: readonly EqBandView[]
      disabled?: boolean
      /** Liefert die Byte-Frequenzdaten des Analysers (leer = kein Signal) */
      getSpectrum?: (() => Uint8Array) | null
      /** Abtastrate des AudioContexts, bestimmt die Frequenz je FFT-Bin */
      sampleRate?: number
    }>(),
    { disabled: false, getSpectrum: null, sampleRate: 48000 }
  )

  const emit = defineEmits<{ change: [index: number, gain: number] }>()

  const { t } = injectI18n()

  const MAX_GAIN = 12
  const STEP = 0.5
  const F_MIN = 20
  const F_MAX = 20000
  // Padding around the plot area: dB labels left, frequency labels below
  const PAD = { left: 34, right: 14, top: 12, bottom: 22 }
  // The outer bands sit at the axis ends; this keeps their nodes inside the plot
  const NODE_INSET = 10

  const uid = useId()
  const ids = { up: `${uid}-up`, dn: `${uid}-dn` }

  const stageRef = ref<HTMLElement | null>(null)
  const svgRef = ref<SVGSVGElement | null>(null)
  const size = ref({ w: 760, h: 280 })

  const plot = computed(() => {
    const left = PAD.left
    const right = size.value.w - PAD.right
    const top = PAD.top
    const bottom = size.value.h - PAD.bottom
    return { left, right, top, bottom, w: right - left, h: bottom - top }
  })

  // Band x positions on the log axis, nodes kept NODE_INSET inside the plot
  const bandXs = computed(() =>
    logFrequencyX(
      props.bands.map((b) => b.frequency),
      plot.value.left + NODE_INSET,
      plot.value.right - NODE_INSET,
      F_MIN,
      F_MAX
    )
  )

  const curve = computed(() =>
    buildEqCurve(
      props.bands.map((b) => b.gain),
      {
        w: size.value.w,
        h: size.value.h,
        maxGain: MAX_GAIN,
        range: plot.value.h / 2 - 8,
        xs: bandXs.value,
        smoothing: 'monotone',
      }
    )
  )

  // Vertical centre of the plot differs from h / 2 because the paddings differ;
  // buildEqCurve works around h / 2, so the plot is kept symmetric around it.
  const dbGrid = computed(() =>
    [-12, -6, 0, 6, 12].map((db) => ({
      db,
      y: curve.value.mid - (db / MAX_GAIN) * (plot.value.h / 2 - 8),
      label: db > 0 ? `+${db}` : String(db),
    }))
  )

  const FREQ_GRID = [20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000]
  const freqGrid = computed(() =>
    logFrequencyX(FREQ_GRID, plot.value.left + NODE_INSET, plot.value.right - NODE_INSET).map(
      (x, i) => ({ freq: FREQ_GRID[i], x, label: formatFrequency(FREQ_GRID[i]) })
    )
  )

  function yToGain(y: number): number {
    const raw = ((curve.value.mid - y) / (plot.value.h / 2 - 8)) * MAX_GAIN
    const snapped = Math.round(raw / STEP) * STEP
    return Math.max(-MAX_GAIN, Math.min(MAX_GAIN, snapped))
  }

  function nodeLabel(band: EqBandView): string {
    return t.value.a11y_eq_band
      .replace('{freq}', formatFrequency(band.frequency))
      .replace('{gain}', formatGain(band.gain))
  }

  function barStyle(gain: number): Record<string, string> {
    const w = (Math.abs(gain) / MAX_GAIN) * 50
    return gain < 0 ? { left: `${50 - w}%`, width: `${w}%` } : { left: '50%', width: `${w}%` }
  }

  // ---- Pointer interaction ----
  const dragIndex = ref(-1)
  const focusIndex = ref(-1)
  const shownIndex = computed(() => (dragIndex.value >= 0 ? dragIndex.value : focusIndex.value))

  const bubble = computed(() => {
    const i = shownIndex.value
    if (i < 0 || !props.bands[i]) return { x: 0, y: 0, w: 0, text: '' }
    const [px, py] = curve.value.points[i]
    const text = `${formatGain(props.bands[i].gain)} dB · ${formatFrequency(props.bands[i].frequency)} Hz`
    const w = 10 + text.length * 6.2
    const x = Math.max(plot.value.left, Math.min(plot.value.right - w, px - w / 2))
    const y = py - 32 < plot.value.top ? py + 14 : py - 32
    return { x, y, w, text }
  })

  /** Pointer position in SVG user units. */
  function svgPoint(event: PointerEvent | MouseEvent): { x: number; y: number } {
    const svg = svgRef.value
    if (!svg) return { x: 0, y: 0 }
    const rect = svg.getBoundingClientRect()
    const sx = rect.width ? size.value.w / rect.width : 1
    const sy = rect.height ? size.value.h / rect.height : 1
    return { x: (event.clientX - rect.left) * sx, y: (event.clientY - rect.top) * sy }
  }

  /** Band whose column contains x (nearest band centre). */
  function nearestBand(x: number): number {
    let best = -1
    let bestDist = Infinity
    bandXs.value.forEach((bx, i) => {
      const d = Math.abs(bx - x)
      if (d < bestDist) {
        bestDist = d
        best = i
      }
    })
    return best
  }

  function onStagePointerDown(event: PointerEvent): void {
    if (props.disabled || event.button !== 0) return
    const p = svgPoint(event)
    if (p.x < plot.value.left || p.x > plot.value.right) return
    const index = nearestBand(p.x)
    if (index < 0) return
    dragIndex.value = index
    svgRef.value?.setPointerCapture(event.pointerId)
    applyGain(index, yToGain(p.y))
    event.preventDefault()
  }

  function onPointerMove(event: PointerEvent): void {
    if (dragIndex.value < 0) return
    applyGain(dragIndex.value, yToGain(svgPoint(event).y))
  }

  function onPointerUp(event: PointerEvent): void {
    if (dragIndex.value < 0) return
    if (svgRef.value?.hasPointerCapture(event.pointerId)) {
      svgRef.value.releasePointerCapture(event.pointerId)
    }
    focusNode(dragIndex.value)
    dragIndex.value = -1
  }

  function onDblClick(event: MouseEvent): void {
    if (props.disabled) return
    const p = svgPoint(event)
    if (p.x < plot.value.left || p.x > plot.value.right) return
    const index = nearestBand(p.x)
    if (index >= 0) applyGain(index, 0)
  }

  // ---- Keyboard interaction (role="slider") ----
  function onKeyDown(index: number, event: KeyboardEvent): void {
    if (props.disabled) return
    const gain = props.bands[index]?.gain ?? 0
    const big = STEP * 6
    let next: number | null = null
    switch (event.key) {
      case 'ArrowUp':
      case 'ArrowRight':
        next = gain + (event.shiftKey ? big : STEP)
        break
      case 'ArrowDown':
      case 'ArrowLeft':
        next = gain - (event.shiftKey ? big : STEP)
        break
      case 'PageUp':
        next = gain + big
        break
      case 'PageDown':
        next = gain - big
        break
      case 'Home':
        next = -MAX_GAIN
        break
      case 'End':
        next = MAX_GAIN
        break
      case '0':
      case 'Backspace':
      case 'Delete':
        next = 0
        break
      default:
        return
    }
    event.preventDefault()
    applyGain(index, Math.max(-MAX_GAIN, Math.min(MAX_GAIN, next)))
  }

  function applyGain(index: number, gain: number): void {
    const current = props.bands[index]
    if (!current || current.gain === gain) return
    emit('change', index, gain)
  }

  function focusNode(index: number): void {
    const node = svgRef.value?.querySelector<SVGGElement>(`.eq-node[data-index="${index}"]`)
    node?.focus({ preventScroll: true })
  }

  // ---- Live spectrum ----
  const spectrumPath = ref('')
  let rafId: number | null = null

  /** Byte frequency data → path along the log axis (linear interpolation between bins). */
  function buildSpectrumPath(data: Uint8Array): string {
    const { left, right, top, bottom, w, h } = plot.value
    const bins = data.length
    if (!bins || w <= 0) return ''
    const nyquist = props.sampleRate / 2
    const stepPx = 3
    let d = `M${left.toFixed(1)},${bottom.toFixed(1)}`
    let any = false
    for (let px = 0; px <= w; px += stepPx) {
      const f = F_MIN * Math.pow(F_MAX / F_MIN, px / w)
      const pos = (f / nyquist) * bins
      const i0 = Math.min(bins - 1, Math.floor(pos))
      const i1 = Math.min(bins - 1, i0 + 1)
      const frac = pos - i0
      const v = (data[i0] * (1 - frac) + data[i1] * frac) / 255
      if (v > 0) any = true
      const y = bottom - v * h
      d += ` L${(left + px).toFixed(1)},${Math.max(top, y).toFixed(1)}`
    }
    d += ` L${right.toFixed(1)},${bottom.toFixed(1)} Z`
    return any ? d : ''
  }

  function tick(): void {
    rafId = null
    if (!props.getSpectrum) return
    if (!document.hidden) {
      let data: Uint8Array | null = null
      try {
        data = props.getSpectrum()
      } catch {
        data = null
      }
      spectrumPath.value = data ? buildSpectrumPath(data) : ''
    }
    rafId = requestAnimationFrame(tick)
  }

  function startSpectrum(): void {
    if (rafId === null && props.getSpectrum && typeof requestAnimationFrame === 'function') {
      rafId = requestAnimationFrame(tick)
    }
  }

  function stopSpectrum(): void {
    if (rafId !== null) cancelAnimationFrame(rafId)
    rafId = null
    spectrumPath.value = ''
  }

  watch(
    () => props.getSpectrum,
    (fn) => (fn ? startSpectrum() : stopSpectrum())
  )

  // ---- Size follows the container so nodes stay round and labels legible ----
  let resizeObserver: ResizeObserver | null = null

  function measure(): void {
    const el = stageRef.value
    if (!el) return
    const w = Math.max(320, Math.round(el.clientWidth))
    const h = Math.max(180, Math.round(el.clientHeight))
    if (w !== size.value.w || h !== size.value.h) size.value = { w, h }
  }

  onMounted(() => {
    measure()
    if (typeof ResizeObserver !== 'undefined' && stageRef.value) {
      resizeObserver = new ResizeObserver(measure)
      resizeObserver.observe(stageRef.value)
    }
    startSpectrum()
  })

  onBeforeUnmount(() => {
    resizeObserver?.disconnect()
    resizeObserver = null
    stopSpectrum()
  })
</script>

<style scoped>
  .eq-editor {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .eq-editor.disabled {
    opacity: 0.45;
  }

  .eq-editor.disabled .eq-svg {
    pointer-events: none;
  }

  .eq-stage {
    position: relative;
    /* Feste Ersatzhöhe für Browser ohne Container-Einheiten; cqw bezieht
       sich auf .equalizer (container-type: inline-size) */
    height: 240px;
    height: clamp(190px, 42cqw, 340px);
    background:
      radial-gradient(
        ellipse at 75% 0%,
        color-mix(in srgb, var(--accent-secondary) 12%, transparent),
        transparent 72%
      ),
      var(--primary-bg);
    border: 1px solid var(--border-strong);
    border-radius: 12px;
    overflow: hidden;
  }

  .eq-svg {
    display: block;
    width: 100%;
    height: 100%;
    touch-action: none;
    cursor: crosshair;
    user-select: none;
    -webkit-user-select: none;
  }

  .eq-svg:focus-visible {
    outline: none;
  }

  /* ---- Grid ---- */
  .eq-grid line {
    stroke: var(--border-color);
    stroke-width: 1;
  }

  .eq-grid line.zero {
    stroke: var(--border-strong);
    stroke-dasharray: 3 4;
  }

  .eq-grid text {
    fill: var(--text-muted);
    font-family: var(--font-mono);
    font-size: 10px;
    font-variant-numeric: tabular-nums;
  }

  /* ---- Spectrum ---- */
  .eq-spectrum {
    fill: var(--accent-secondary);
    opacity: 0.25;
    pointer-events: none;
  }

  /* ---- Curve ---- */
  .eq-fill {
    opacity: 0.17;
    pointer-events: none;
  }

  .eq-fill.boost {
    fill: var(--eq-boost);
  }

  .eq-fill.cut {
    fill: var(--eq-cut);
  }

  .eq-line {
    fill: none;
    stroke-width: 3;
    stroke-linejoin: round;
    stroke-linecap: round;
    pointer-events: none;
  }

  .eq-line.boost {
    stroke: var(--eq-boost);
  }

  .eq-line.cut {
    stroke: var(--eq-cut);
  }

  /* ---- Nodes ---- */
  .eq-node {
    cursor: grab;
    outline: none;
  }

  .eq-node-hit {
    fill: transparent;
  }

  .eq-node-dot {
    fill: var(--card-bg);
    stroke: var(--text-muted);
    stroke-width: 2;
    transition:
      r 0.12s ease,
      stroke 0.2s ease;
  }

  .eq-node.boost .eq-node-dot {
    fill: var(--eq-boost);
    stroke: var(--secondary-bg);
  }

  .eq-node.cut .eq-node-dot {
    fill: var(--eq-cut);
    stroke: var(--secondary-bg);
  }

  .eq-node:hover .eq-node-dot,
  .eq-node.active .eq-node-dot {
    r: 7;
  }

  .eq-node.active {
    cursor: grabbing;
  }

  .eq-node:focus-visible .eq-node-dot {
    stroke: var(--accent-primary);
    stroke-width: 3;
    r: 7;
  }

  /* ---- Value bubble ---- */
  .eq-bubble rect {
    fill: var(--card-bg);
    stroke: var(--border-strong);
    stroke-width: 1;
  }

  .eq-bubble text {
    fill: var(--text-primary);
    font-family: var(--font-mono);
    font-size: 11px;
    font-variant-numeric: tabular-nums;
  }

  /* ---- Band row ---- */
  .eq-band-row {
    display: grid;
    grid-template-columns: repeat(19, minmax(0, 1fr));
    gap: 4px;
  }

  .eq-band {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    min-width: 0;
    padding: 6px 2px 5px;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    background: var(--secondary-bg);
    color: inherit;
    font: inherit;
    cursor: pointer;
  }

  .eq-band:hover:not(:disabled) {
    background: var(--hover-bg);
  }

  .eq-band:disabled {
    cursor: default;
  }

  .eq-band .val {
    font-family: var(--font-mono);
    font-size: 10.5px;
    font-variant-numeric: tabular-nums;
    color: var(--text-secondary);
    white-space: nowrap;
  }

  .eq-band.boost .val {
    color: var(--eq-boost);
  }

  .eq-band.cut .val {
    color: var(--eq-cut);
  }

  .eq-band .bar {
    position: relative;
    display: block;
    width: 100%;
    height: 4px;
    border-radius: 2px;
    background: var(--secondary-bg);
    overflow: hidden;
  }

  .eq-band .bar i {
    position: absolute;
    top: 0;
    bottom: 0;
    border-radius: 2px;
    background: var(--eq-boost);
  }

  .eq-band.cut .bar i {
    background: var(--eq-cut);
  }

  .eq-band .freq {
    font-size: 10px;
    color: var(--text-muted);
    white-space: nowrap;
  }

  /* Bandzeilen nach Panelbreite (Container-Query auf .equalizer), denn das
     Panel kann auch auf dem Desktop in der Drei-Spalten-Ansicht schmal sein:
     eine Zeile (19), zwei Zeilen (10 + 9) oder drei Zeilen (7 + 7 + 5). */
  @container (max-width: 760px) {
    .eq-band-row {
      grid-template-columns: repeat(10, minmax(0, 1fr));
    }
  }

  @container (max-width: 400px) {
    /* 19 nodes on a narrow axis: smaller dots so neighbours stay apart */
    .eq-node-dot {
      r: 4;
    }

    .eq-band-row {
      grid-template-columns: repeat(7, minmax(0, 1fr));
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .eq-node-dot {
      transition: none;
    }
  }
</style>
