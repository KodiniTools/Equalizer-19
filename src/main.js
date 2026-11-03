import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './assets/style.css'

const app = createApp(App)

app.use(router)

// Global error handler
app.config.errorHandler = (err, _instance, info) => {
  console.error('Global error:', err, info)
}

app.mount('#app')
