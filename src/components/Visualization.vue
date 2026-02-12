<template>
  <div class="visualization">
    <canvas
      ref="canvasRef"
      class="visualization-canvas"
      :width="canvasWidth"
      :height="canvasHeight"
    ></canvas>
  </div>
</template>

<script setup>
import { ref, inject, onMounted, onUnmounted } from 'vue'

const audioEngine = inject('audioEngine')

const canvasRef = ref(null)
const canvasWidth = ref(800)
const canvasHeight = ref(200)
let animationId = null

function drawVisualization() {
  if (!canvasRef.value || !audioEngine) {
    requestAnimationFrame(drawVisualization)
    return
  }

  const canvas = canvasRef.value
  const ctx = canvas.getContext('2d')
  
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
    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    ctx.fillStyle = 'rgba(102, 126, 234, 0.3)'
    ctx.font = '16px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('Keine Audio-Daten', canvas.width / 2, canvas.height / 2)
    
    requestAnimationFrame(drawVisualization)
    return
  }

  // Clear canvas
  ctx.fillStyle = '#1a1a2e'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // Draw bars
  const barWidth = (canvas.width / dataArray.length) * 2
  let x = 0

  for (let i = 0; i < dataArray.length; i++) {
    const barHeight = (dataArray[i] / 255) * canvas.height

    // Gradient
    const gradient = ctx.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height)
    gradient.addColorStop(0, '#667eea')
    gradient.addColorStop(1, '#764ba2')

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
