<template>
  <div class="visualization">
    <div class="visualization-header">
      <h3>
        <i class="fas fa-wave-square"></i>
        {{ t('visualization.title') || 'Visualisierung' }}
      </h3>
    </div>
    
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

// Get dependencies
const i18n = inject('i18n', { t: (key) => key })
const audioEngine = inject('audioEngine')

// Make t function available in template
const t = (key) => {
  if (i18n && typeof i18n.t === 'function') {
    return i18n.t(key)
  }
  // Fallback translations
  const translations = {
    'visualization.title': 'Visualisierung'
  }
  return translations[key] || key
}

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
  background: white;
  border-radius: 20px;
  padding: 25px;
  margin-bottom: 25px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.visualization-header h3 {
  margin: 0 0 20px 0;
  font-size: 1.4em;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #333;
}

.visualization-canvas {
  width: 100%;
  height: 200px;
  border-radius: 12px;
  background: #1a1a2e;
  display: block;
}

@media (max-width: 768px) {
  .visualization {
    padding: 20px;
  }
  
  .visualization-canvas {
    height: 150px;
  }
}
</style>
