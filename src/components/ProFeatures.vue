<template>
  <div class="pro-features">
    <div class="pro-header">
      <h3>
        <i class="fas fa-crown"></i>
        {{ t('pro.title') || 'Pro Features' }}
      </h3>
    </div>
    
    <div class="pro-content">
      <p class="pro-description">
        {{ t('pro.description') || 'Upgrade für erweiterte Funktionen' }}
      </p>
      
      <div class="pro-badge">
        <i class="fas fa-star"></i>
        <span>{{ t('pro.badge') || 'Pro Version' }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { inject } from 'vue'

// Get dependencies
const i18n = inject('i18n', { t: (key) => key })

// Make t function available in template
const t = (key) => {
  if (i18n && typeof i18n.t === 'function') {
    return i18n.t(key)
  }
  // Fallback translations
  const translations = {
    'pro.title': 'Pro Features',
    'pro.description': 'Upgrade für erweiterte Funktionen',
    'pro.badge': 'Pro Version'
  }
  return translations[key] || key
}
</script>

<style scoped>
.pro-features {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  border-radius: 20px;
  padding: 25px;
  margin-bottom: 25px;
  color: white;
  box-shadow: 0 10px 40px rgba(240, 147, 251, 0.3);
}

.pro-header h3 {
  margin: 0 0 15px 0;
  font-size: 1.4em;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;
}

.pro-content {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.pro-description {
  margin: 0;
  font-size: 1em;
  opacity: 0.9;
}

.pro-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.2);
  padding: 10px 20px;
  border-radius: 25px;
  font-weight: 600;
  backdrop-filter: blur(10px);
  align-self: flex-start;
}

.pro-badge i {
  font-size: 1.2em;
  color: #ffd700;
}
</style>
