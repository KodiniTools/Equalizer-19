<template>
  <div 
    id="notification" 
    :class="{ show: isVisible }"
    :style="{ borderLeftColor: borderColor }"
    role="alert"
    aria-live="polite"
  >
    {{ message }}
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const isVisible = ref(false)
const message = ref('')
const type = ref('info')
let timeout = null

const borderColor = computed(() => {
  switch (type.value) {
    case 'success': return 'var(--success)'
    case 'warning': return 'var(--warning)'
    case 'error': return 'var(--error)'
    default: return 'var(--accent-primary)'
  }
})

const show = (msg, notifType = 'info') => {
  if (timeout) {
    clearTimeout(timeout)
  }
  
  message.value = msg
  type.value = notifType
  isVisible.value = true
  
  timeout = setTimeout(() => {
    isVisible.value = false
  }, 3000)
}

defineExpose({ show })
</script>
