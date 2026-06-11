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

<script setup>
  import { ref, inject, onMounted, onUnmounted } from 'vue'

  const { t } = inject('i18n')
  const audioEngine = inject('audioEngine')

  const canvasRef = ref(null)
  const canvasWidth = ref(800)
  const canvasHeight = ref(200)
  let animationId = null

  function getThemeColors() {
    const style = getComputedStyle(document.documentElement)
    return {
      bg: style.getPropertyValue('--secondary-bg').trim() || '#1a1a22',
      accent: style.getPropertyValue('--accent-primary').trim() || '#667eea',
      accentAlt: style.getPropertyValue('--accent-secondary').trim() || '#764ba2',
      textMuted: style.getPropertyValue('--text-muted').trim() || '#7a8da0',
    }
  }

  function drawVisualization() {
    if (!canvasRef.value || !audioEngine) {
      requestAnimationFrame(drawVisualization)
      return
    }

    const canvas = canvasRef.value
    const ctx = canvas.getContext('2d')
    const colors = getThemeColors()

    // Get audio data
    let dataArray
    try {
      const nodes = audioEngine.getAudioNodes()
      if (!nodes || !nodes.analyserNode) {
        requestAnimationFrame(drawVisualization)
        return
      }

      dataArray = audioEngine.getFrequencyData()
    } catch (e) {
      requestAnimationFrame(drawVisualization)
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

      requestAnimationFrame(drawVisualization)
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
    if (canvasRef.value) {
      const container = canvasRef.value.parentElement
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
    background: var(--card-bg, #252530);
    border: 1px solid var(--border-color, #3a3a48);
    border-radius: 12px;
    padding: 12px;
  }

  .visualization-canvas {
    width: 100%;
    height: 180px;
    border-radius: 8px;
    background: var(--secondary-bg, #1a1a22);
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
