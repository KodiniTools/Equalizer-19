<template>
  <div class="app-page">
    <!-- Notification System -->
    <Notification ref="notificationRef" />

    <!-- Shared Files Banner -->
    <div v-if="sharedBanner" class="shared-banner"
         :class="'shared-banner-' + sharedBanner.type">
      <i :class="bannerIcon"></i>
      <span>{{ sharedBanner.message }}</span>
    </div>

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
import { ref, computed, watch, inject, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getSharedFiles, clearSharedFiles } from '../utils/sharedFileRepository'

import Notification from '../components/Notification.vue'
import OutputRecordingControls from '../components/OutputRecordingControls.vue'
import PlayerControls from '../components/PlayerControls.vue'
import Equalizer from '../components/Equalizer.vue'
import DynamicsProcessor from '../components/DynamicsProcessor.vue'
import CompressorPresets from '../components/CompressorPresets.vue'
import Visualization from '../components/Visualization.vue'
import Playlist from '../components/Playlist.vue'
import AudioConverter from '../components/AudioConverter.vue'

const route = useRoute()
const router = useRouter()

const { t, currentLanguage } = inject('i18n')
const audioEngine = inject('audioEngine')
const audioPlayer = inject('audioPlayer')
const notify = inject('notify')

const notificationRef = ref(null)
const sharedBanner = ref(null)
let sharedFilesHandled = false

const bannerIcon = computed(() => {
  const icons = {
    success: 'fas fa-check-circle',
    error: 'fas fa-exclamation-circle',
    warning: 'fas fa-exclamation-triangle',
    info: 'fas fa-info-circle'
  }
  return icons[sharedBanner.value?.type] || 'fas fa-info-circle'
})

const handleFilesSelected = (files) => {
  if (notificationRef.value) {
    const message = currentLanguage.value === 'de'
      ? `${files.length} Datei(en) hinzugefugt`
      : `${files.length} file(s) added`
    notificationRef.value.show(message, 'success')
  }
}

async function loadSharedFiles() {
  if (sharedFilesHandled) return
  sharedFilesHandled = true

  try {
    const records = await getSharedFiles()

    if (!records?.length) {
      sharedBanner.value = {
        type: 'warning',
        message: t.value.sharedFilesEmpty
      }
      setTimeout(() => { sharedBanner.value = null }, 5000)
      return
    }

    sharedBanner.value = {
      type: 'info',
      message: t.value.sharedFilesLoading.replace('{count}', records.length)
    }

    const { processed } = await audioPlayer.handleSharedFiles(records)

    if (processed > 0) {
      sharedBanner.value = {
        type: 'success',
        message: t.value.sharedFilesLoaded.replace('{count}', processed)
      }
      await clearSharedFiles()
      setTimeout(() => { sharedBanner.value = null }, 5000)
    } else {
      sharedBanner.value = {
        type: 'warning',
        message: t.value.sharedFilesEmpty
      }
      setTimeout(() => { sharedBanner.value = null }, 5000)
    }
  } catch (err) {
    console.error('Error loading shared files:', err)
    sharedBanner.value = {
      type: 'error',
      message: t.value.sharedFilesError
    }
    setTimeout(() => { sharedBanner.value = null }, 5000)
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

// Primary: after router is ready
router.isReady().then(() => {
  if (route.query.source === 'audiokonverter') loadSharedFiles()
})

// Fallback: route watcher
watch(() => route.query.source, (s) => {
  if (s === 'audiokonverter') loadSharedFiles()
})
</script>

<style scoped>
.app-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Main Content */
.app-main {
  flex: 1;
  padding-top: 16px;
}

/* Shared Files Banner */
.shared-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 18px;
  margin: 12px 16px 0;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  animation: slideIn 0.3s ease-out;
}

.shared-banner i {
  font-size: 18px;
  flex-shrink: 0;
}

.shared-banner-success {
  background: rgba(74, 222, 128, 0.12);
  border: 1px solid rgba(74, 222, 128, 0.3);
  color: var(--success);
}

.shared-banner-error {
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: var(--error);
}

.shared-banner-warning {
  background: rgba(245, 158, 11, 0.12);
  border: 1px solid rgba(245, 158, 11, 0.3);
  color: var(--warning);
}

.shared-banner-info {
  background: rgba(1, 79, 153, 0.12);
  border: 1px solid rgba(1, 79, 153, 0.3);
  color: var(--accent-secondary);
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
