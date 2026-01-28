<template>
  <div class="app-page">
    <!-- App Header/Navigation -->
    <header class="app-header">
      <div class="header-container">
        <router-link to="/" class="header-logo">
          <i class="fas fa-sliders-h"></i>
          <span>EQUALIZER 19</span>
        </router-link>

        <nav class="header-nav">
          <router-link to="/" class="header-link">
            <i class="fas fa-home"></i>
            <span>{{ t('nav_home') }}</span>
          </router-link>
          <router-link to="/faq" class="header-link">
            <i class="fas fa-question-circle"></i>
            <span>{{ t('nav_faq') }}</span>
          </router-link>
        </nav>

        <div class="header-controls">
          <div class="control-group">
            <button
              @click="setLanguage('de')"
              :class="['control-btn', { active: currentLanguage === 'de' }]"
            >
              DE
            </button>
            <button
              @click="setLanguage('en')"
              :class="['control-btn', { active: currentLanguage === 'en' }]"
            >
              EN
            </button>
          </div>
          <div class="control-group">
            <button
              @click="setTheme('dark')"
              :class="['control-btn', { active: currentTheme === 'dark' }]"
              :title="t('dark_theme')"
            >
              <i class="fas fa-moon"></i>
            </button>
            <button
              @click="setTheme('light')"
              :class="['control-btn', { active: currentTheme === 'light' }]"
              :title="t('light_theme')"
            >
              <i class="fas fa-sun"></i>
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Notification System -->
    <Notification ref="notificationRef" />

    <!-- Main Content -->
    <main class="app-main">
      <div class="container main-layout">
        <div class="grid-three-column">
          <!-- Left Column: Recorder & Player -->
          <div class="column-left">
            <!-- OUTPUT RECORDING -->
            <OutputRecordingControls />

            <!-- File Upload & Player Controls -->
            <PlayerControls
              @files-selected="handleFilesSelected"
            />

            <!-- Playlist -->
            <Playlist />
          </div>

          <!-- Center Column: Equalizer & Visualizer -->
          <div class="column-center">
            <!-- Equalizer -->
            <Equalizer />

            <!-- Visualization -->
            <Visualization />
          </div>

          <!-- Right Column: Dynamics Processor -->
          <div class="column-right">
            <!-- Dynamics Processor -->
            <DynamicsProcessor />

            <!-- Compressor Presets -->
            <CompressorPresets />
          </div>
        </div>
      </div>

      <!-- Audio Converter Promo -->
      <AudioConverter />
    </main>
  </div>
</template>

<script setup>
import { ref, inject, onMounted } from 'vue'

import Notification from '../components/Notification.vue'
import OutputRecordingControls from '../components/OutputRecordingControls.vue'
import PlayerControls from '../components/PlayerControls.vue'
import Equalizer from '../components/Equalizer.vue'
import DynamicsProcessor from '../components/DynamicsProcessor.vue'
import CompressorPresets from '../components/CompressorPresets.vue'
import Visualization from '../components/Visualization.vue'
import Playlist from '../components/Playlist.vue'
import AudioConverter from '../components/AudioConverter.vue'

const { t, currentLanguage, setLanguage } = inject('i18n')
const { currentTheme, setTheme } = inject('theme')
const audioEngine = inject('audioEngine')
const notify = inject('notify')

const notificationRef = ref(null)

const handleFilesSelected = (files) => {
  if (notificationRef.value) {
    const message = currentLanguage.value === 'de'
      ? `${files.length} Datei(en) hinzugefugt`
      : `${files.length} file(s) added`
    notificationRef.value.show(message, 'success')
  }
}

onMounted(() => {
  // Initialize audio context on first user interaction
  const init = () => {
    console.log('Initializing AudioEngine on user interaction...')
    audioEngine.initAudioContext()
    console.log('AudioEngine AudioContext initialized')
    document.removeEventListener('click', init)
  }
  document.addEventListener('click', init, { once: true })
})
</script>

<style scoped>
.app-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* App Header */
.app-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--nav-bg);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border-color);
}

.header-container {
  max-width: 1600px;
  margin: 0 auto;
  padding: 12px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.header-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  text-decoration: none;
  transition: all 0.2s ease;
}

.header-logo i {
  color: var(--accent-primary);
  font-size: 22px;
}

.header-logo:hover {
  color: var(--accent-primary);
}

.header-nav {
  display: flex;
  gap: 8px;
}

.header-link {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 8px;
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.header-link:hover {
  color: var(--text-primary);
  background: var(--hover-bg);
}

.header-link.router-link-active {
  color: var(--accent-primary);
  background: var(--hover-bg);
}

.header-controls {
  display: flex;
  gap: 16px;
}

.control-group {
  display: flex;
  background: var(--secondary-bg);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 2px;
  gap: 2px;
}

.control-btn {
  padding: 6px 12px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 4px;
}

.control-btn:hover {
  color: var(--text-primary);
  background: var(--hover-bg);
}

.control-btn.active {
  background: var(--accent-primary);
  color: #fff;
}

.control-btn i {
  font-size: 14px;
}

/* Main Content */
.app-main {
  flex: 1;
  padding-top: 16px;
}

/* Responsive */
@media (max-width: 768px) {
  .header-container {
    padding: 10px 16px;
    flex-wrap: wrap;
  }

  .header-link span {
    display: none;
  }

  .header-controls {
    gap: 8px;
  }

  .control-btn {
    padding: 6px 10px;
  }
}

@media (max-width: 480px) {
  .header-logo span {
    display: none;
  }

  .header-nav {
    order: 1;
    width: 100%;
    justify-content: center;
    margin-top: 8px;
  }
}
</style>
