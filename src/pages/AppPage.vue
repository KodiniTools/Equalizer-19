<template>
  <div class="app-page">
    <!-- Notification System -->
    <Notification ref="notificationRef" />

    <!-- Shared Files Banner -->
    <div v-if="sharedBanner" class="shared-banner" :class="'shared-banner-' + sharedBanner.type">
      <AppIcon :name="bannerIcon" size="18" />
      <span>{{ sharedBanner.message }}</span>
    </div>

    <!-- Main Content -->
    <main class="app-main">
      <div class="container main-layout">
        <!-- Way back to the landing page, undo/redo, help -->
        <div class="app-topbar">
          <nav :aria-label="t.app_back_home">
            <router-link to="/" class="page-link page-link-strong">
              <span aria-hidden="true">←</span> {{ t.app_back_home }}
            </router-link>
          </nav>
          <div class="app-topbar-tools">
            <HistoryControls />
            <router-link to="/faq" class="page-link">{{ t.app_help }}</router-link>
          </div>
        </div>

        <!-- Narrow screens: one section at a time instead of three stacked columns -->
        <div class="app-tabs" role="group" :aria-label="t.app_tabs_label">
          <button
            v-for="tab in TABS"
            :key="tab.key"
            type="button"
            :class="{ active: activeTab === tab.key }"
            :aria-pressed="activeTab === tab.key"
            @click="activeTab = tab.key"
          >
            {{ t[tab.label] }}
          </button>
        </div>

        <div class="grid-three-column">
          <!-- Left Column: Playlist -->
          <div class="column-left" :class="{ 'is-active': activeTab === 'source' }">
            <!-- Input source: playlist or live audio input -->
            <InputSource />

            <!-- Playlist -->
            <Playlist />
          </div>

          <!-- Center Column: Equalizer & Visualizer -->
          <div class="column-center" :class="{ 'is-active': activeTab === 'eq' }">
            <!-- Equalizer -->
            <Equalizer />

            <!-- Input / Output Level Meter -->
            <AudioMeter />

            <!-- Visualization -->
            <Visualization />
          </div>

          <!-- Right Column: Dynamics Processor (incl. presets) -->
          <div class="column-right" :class="{ 'is-active': activeTab === 'dynamics' }">
            <DynamicsProcessor />
          </div>
        </div>
      </div>

      <!-- Links to the other KodiniTools audio tools -->
      <RelatedTools />
    </main>

    <!-- Persistent sticky player bar (playback + recording + download) -->
    <StickyPlayerBar @files-selected="handleFilesSelected" />
  </div>
</template>

<script setup>
  import { ref, computed, watch, inject, provide, onMounted } from 'vue'
  import AppIcon from '../components/AppIcon.vue'
  import { useRoute, useRouter } from 'vue-router'
  import { getSharedFiles, clearSharedFiles } from '../utils/sharedFileRepository'

  import Notification from '../components/Notification.vue'
  import StickyPlayerBar from '../components/StickyPlayerBar.vue'
  import Equalizer from '../components/Equalizer.vue'
  import AudioMeter from '../components/AudioMeter.vue'
  import DynamicsProcessor from '../components/DynamicsProcessor.vue'
  import Visualization from '../components/Visualization.vue'
  import Playlist from '../components/Playlist.vue'
  import InputSource from '../components/InputSource.vue'
  import HistoryControls from '../components/HistoryControls.vue'
  import { useInputSource } from '../composables/useInputSource'
  import RelatedTools from '../components/RelatedTools.vue'

  const route = useRoute()
  const router = useRouter()

  const { t } = inject('i18n')
  const audioEngine = inject('audioEngine')
  const audioPlayer = inject('audioPlayer')

  // Live audio input as alternative source; stopped automatically when leaving the app
  const inputSource = useInputSource(audioEngine, audioPlayer)
  provide('inputSource', inputSource)

  const notificationRef = ref(null)
  const sharedBanner = ref(null)

  // Section shown on narrow screens (< 900px); all three are visible otherwise.
  // Components stay mounted, so audio and keyboard shortcuts keep working.
  const TABS = [
    { key: 'source', label: 'app_tab_source' },
    { key: 'eq', label: 'app_tab_eq' },
    { key: 'dynamics', label: 'app_tab_dynamics' },
  ]
  const activeTab = ref('eq')
  let sharedFilesHandled = false

  // Toasts for the components on this page (presets, bypass, undo/redo, …).
  // Overrides the console-only fallback provided by App.vue.
  provide('notify', (message, type = 'info') => {
    notificationRef.value?.show(message, type)
  })

  const bannerIcon = computed(() => {
    const icons = { success: 'success', error: 'error', warning: 'warning', info: 'info' }
    return icons[sharedBanner.value?.type] || 'info'
  })

  const handleFilesSelected = (files) => {
    if (notificationRef.value) {
      const message = t.value.player_tracks_added.replace('{count}', files.length)
      notificationRef.value.show(message, 'success')
    }
  }

  const BANNER_HIDE_MS = 5000

  // Show the shared-files banner; autoHide removes it after BANNER_HIDE_MS
  function showBanner(type, message, autoHide = true) {
    sharedBanner.value = { type, message }
    if (autoHide) {
      setTimeout(() => {
        sharedBanner.value = null
      }, BANNER_HIDE_MS)
    }
  }

  async function loadSharedFiles() {
    if (sharedFilesHandled) return
    sharedFilesHandled = true

    try {
      const records = await getSharedFiles()

      if (!records?.length) {
        showBanner('warning', t.value.sharedFilesEmpty)
        return
      }

      showBanner('info', t.value.sharedFilesLoading.replace('{count}', records.length), false)

      const { processed } = await audioPlayer.handleSharedFiles(records)

      if (processed > 0) {
        sharedBanner.value = {
          type: 'success',
          message: t.value.sharedFilesLoaded.replace('{count}', processed),
        }
        await clearSharedFiles()
        setTimeout(() => {
          sharedBanner.value = null
        }, BANNER_HIDE_MS)
      } else {
        showBanner('warning', t.value.sharedFilesEmpty)
      }
    } catch (err) {
      console.error('Error loading shared files:', err)
      showBanner('error', t.value.sharedFilesError)
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
  watch(
    () => route.query.source,
    (s) => {
      if (s === 'audiokonverter') loadSharedFiles()
    }
  )
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
    /* Space below the fixed player bar is reserved on <body> (has-sticky-player) */
    padding-bottom: 32px;
  }

  /* Top bar: back to landing page / undo-redo / help */
  .app-topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 12px;
  }

  .app-topbar-tools {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  /* Segment control: hidden on wide screens where all columns fit */
  .app-tabs {
    display: none;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 2px;
    padding: 3px;
    margin-bottom: 12px;
    border: 1px solid var(--border-color);
    border-radius: 10px;
    background: var(--secondary-bg);
  }

  .app-tabs button {
    height: 32px;
    min-width: 0;
    padding: 0 8px;
    border: none;
    border-radius: 7px;
    background: transparent;
    color: var(--text-secondary);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    transition:
      background 0.2s,
      color 0.2s;
  }

  .app-tabs button.active {
    background: var(--card-bg);
    color: var(--text-primary);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  }

  .app-tabs button:focus-visible {
    outline: 2px solid var(--accent-primary);
    outline-offset: 1px;
  }

  @media (max-width: 900px) {
    .app-tabs {
      display: grid;
    }

    .grid-three-column > :not(.is-active) {
      display: none;
    }
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

  .shared-banner .icon {
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
