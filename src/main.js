import { createApp } from 'vue'
import App from './App.vue'
import './assets/style.css'

const app = createApp(App)

// Global error handler
app.config.errorHandler = (err, instance, info) => {
  console.error('Global error:', err)
  console.log('Error info:', info)
}

app.mount('#app')

console.log(
  '%cEQUALIZER 19 // Vue 3 Edition',
  'background:linear-gradient(45deg,#00F5FF,#FF3366);color:#fff;padding:6px 12px;border-radius:4px;font-weight:bold'
)
