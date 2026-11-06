<template>
  <div class="visualization">
    <canvas
      ref="canvasRef"
      class="visualization-canvas"
      :width="canvasWidth"
      :height="canvasHeight"
      role="img"
      :aria-label="t.a11y_visualization"
    ></canvas>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted, onUnmounted } from 'vue'
  import { useAudioEngineStore } from '../stores/audioEngine'
  import { injectI18n } from '../composables/useI18n'

  const { t } = injectI18n()
  const audioEngine = useAudioEngineStore()

  const canvasRef = ref<HTMLCanvasElement | null>(null)
  const canvasWidth = ref(800)
  const canvasHeight = ref(200)
  let animationId: number | null = null

  function getThemeColors() {
    const style = getComputedStyle(document.documentElement)
    return {
      bg: style.getPropertyValue('--secondary-bg').trim() || '#1a1a22',
      accent: style.getPropertyValue('--accent-primary').trim() || '#c9984d',
      accentAlt: style.getPropertyValue('--accent-secondary').trim() || '#014f99',
      textMuted: style.getPropertyValue('--text-muted').trim() || '#7a8da0',
    }
  }

  function drawVisualization(): void {
    const canvas = canvasRef.value
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) {
      animationId = requestAnimationFrame(drawVisualization)
      return
    }

    const colors = getThemeColors()

    // Get audio data
    let dataArray: Uint8Array | null = null
    try {
      const nodes = audioEngine.getAudioNodes()
      if (!nodes || !nodes.analyserNode) {
        animationId = requestAnimationFrame(drawVisualization)
        return
      }

      dataArray = audioEngine.getFrequencyData()
    } catch {
      animationId = requestAnimationFrame(drawVisualization)
      return
    }

    if (!dataArray || dataArray.length === 0) {
      // Draw empty state
      ctx.fillStyle = colors.bg
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.fillStyle = colors.textMuted
      ctx.font = '14px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(t.value.player_no_file, canvas.width / 2, canvas.height / 2)

      animationId = requestAnimationFrame(drawVisualization)
      return
    }

    // Clear canvas
    ctx.fillStyle = colors.bg
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw bars
    const barWidth = (canvas.width / dataArray.length) * 2
    let x = 0

    for (let i = 0; i < dataArray.length; i++) {
      const barHeight = (dataArray[i] / 255) * canvas.height

      // Gradient using theme accent colors
      const gradient = ctx.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height)
      gradient.addColorStop(0, colors.accent)
      gradient.addColorStop(1, colors.accentAlt)

      ctx.fillStyle = gradient
      ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight)

      x += barWidth + 1
    }

    animationId = requestAnimationFrame(drawVisualization)
  }

  onMounted(() => {
    // Set canvas size based on container
    const container = canvasRef.value?.parentElement
    if (container) {
      canvasWidth.value = container.clientWidth - 50
      canvasHeight.value = 200
    }

    drawVisualization()
  })

  onUnmounted(() => {
    if (animationId) {
      cancelAnimationFrame(animationId)
    }
  })
</script>

<style scoped>
  .visualization {
    background: var(--card-bg);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: 12px;
  }

  .visualization-canvas {
    width: 100%;
    height: 180px;
    border-radius: 8px;
    background: var(--secondary-bg);
    display: block;
  }

  @media (max-width: 768px) {
    .visualization-canvas {
      height: 140px;
    }
  }

  @media (max-width: 600px) {
    .visualization {
      padding: 10px;
    }

    .visualization-canvas {
      height: 120px;
    }
  }

  @media (max-width: 400px) {
    .visualization {
      padding: 8px;
    }

    .visualization-canvas {
      height: 100px;
      border-radius: 6px;
    }
  }
</style>
