<template>
  <div
    class="sticky-player"
    :class="{ 'drop-active': isDragOver }"
    @dragover.prevent="onDragOver"
    @dragleave.prevent="onDragLeave"
    @drop.prevent="handleDrop"
    role="region"
    :aria-label="currentLanguage === 'de' ? 'Player-Leiste' : 'Player bar'"
  >
    <!-- Hidden file inputs -->
    <input
      type="file"
      ref="fileInput"
      @change="handleFileSelect"
      accept="audio/*"
      multiple
      style="display: none"
    />
    <input
      type="file"
      ref="folderInput"
      @change="handleFileSelect"
      accept="audio/*"
      webkitdirectory
      mozdirectory
      style="display: none"
    />

    <!-- Full-width progress bar at the top edge of the bar -->
    <div
      class="sp-progress"
      :class="{ disabled: !hasTrack }"
      @click="hasTrack && handleProgressClick($event)"
      :title="hasTrack ? t.player_vol_hint : ''"
    >
      <div class="sp-progress-bar">
        <div class="sp-progress-fill" :style="{ width: (hasTrack ? progress : 0) + '%' }"></div>
      </div>
    </div>

    <div class="sp-body">
      <!-- LEFT: Upload + track info -->
      <div class="sp-section sp-left">
        <div class="upload-group">
          <button
            @click="triggerFileSelect"
            class="btn-upload"
            :title="t.player_select_files"
            :aria-label="t.player_select_files"
          >
            <i class="fas fa-file-audio" aria-hidden="true"></i>
          </button>
          <button
            @click="triggerFolderSelect"
            class="btn-upload"
            :title="t.player_select_folder"
            :aria-label="t.player_select_folder"
          >
            <i class="fas fa-folder-open" aria-hidden="true"></i>
          </button>
        </div>

        <div class="track-info" v-if="currentTrack">
          <span class="track-name">{{ currentTrack.name }}</span>
          <span class="track-time">{{ formattedCurrentTime }} / {{ formattedDuration }}</span>
        </div>
        <div class="track-info empty" v-else>
          <span class="track-name">{{
            hasPlaylist ? playlist.length + ' Tracks' : t.player_no_file
          }}</span>
        </div>
      </div>

      <!-- CENTER: Transport controls -->
      <PlayerTransport />

      <!-- RIGHT: Volume + Recording / Download -->
      <div class="sp-section sp-right">
        <!-- Volume -->
        <VolumeControl />

        <div class="sp-divider" aria-hidden="true"></div>

        <!-- Recording & Download -->
        <RecorderControls />
      </div>
    </div>

    <!-- Drop overlay hint -->
    <div v-if="isDragOver" class="drop-hint" aria-live="polite">
      <i class="fas fa-cloud-upload-alt" aria-hidden="true"></i>
      <span>{{ t.player_drop_hint }}</span>
    </div>
  </div>
</template>

<script setup>
  import { ref, inject } from 'vue'
  import { useFileDrop } from '../composables/useFileDrop'
  import PlayerTransport from './PlayerTransport.vue'
  import VolumeControl from './VolumeControl.vue'
  import RecorderControls from './RecorderControls.vue'

  const emit = defineEmits(['files-selected'])

  const { t, currentLanguage } = inject('i18n')
  const audioPlayer = inject('audioPlayer')
  const notify = inject('notify', () => {})

  const fileInput = ref(null)
  const folderInput = ref(null)

  const {
    playlist,
    currentTrack,
    hasTrack,
    hasPlaylist,
    progress,
    formattedCurrentTime,
    formattedDuration,
    addFiles,
    play,
    seekToPercent,
  } = audioPlayer

  // ---- File selection / drag & drop ----
  // Add files to the playlist, start playback and announce the new tracks
  function addAndPlay(files) {
    const tracks = addFiles(files)
    emit('files-selected', files)
    if (tracks.length > 0) setTimeout(() => play(), 100)
    notify(t.value.player_tracks_added.replace('{count}', files.length), 'success')
  }

  const { isDragOver, onDragOver, onDragLeave, handleFileSelect, handleDrop } =
    useFileDrop(addAndPlay)

  function triggerFileSelect() {
    fileInput.value?.click()
  }

  function triggerFolderSelect() {
    folderInput.value?.click()
  }

  function handleProgressClick(event) {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - rect.left
    const percent = (x / rect.width) * 100
    seekToPercent(percent)
  }
</script>

<style scoped>
  .sticky-player {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1000;
    background: var(--card-bg, #252530);
    border-top: 1px solid var(--border-color, #3a3a48);
    box-shadow: 0 -6px 24px var(--shadow-light, rgba(0, 0, 0, 0.35));
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    transition: border-color 0.2s;
  }

  .sticky-player.drop-active {
    border-top-color: var(--accent-primary, #00d9ff);
    background: color-mix(in srgb, var(--card-bg, #252530) 85%, var(--accent-primary, #00d9ff));
  }

  /* Progress bar spans the full width along the top edge */
  .sp-progress {
    width: 100%;
    padding: 5px 0 3px;
    cursor: pointer;
  }

  .sp-progress.disabled {
    cursor: default;
  }

  .sp-progress-bar {
    height: 4px;
    background: var(--secondary-bg, #1a1a22);
    overflow: hidden;
  }

  .sp-progress-fill {
    height: 100%;
    background: var(--accent-primary, #00d9ff);
    border-radius: 0 2px 2px 0;
    transition: width 0.1s;
  }

  .sp-body {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 8px 16px 10px;
    max-width: 1600px;
    margin: 0 auto;
  }

  .sp-section {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .sp-left {
    flex: 1 1 0;
    min-width: 0;
  }

  .sp-center {
    flex: 0 0 auto;
    justify-content: center;
    gap: 6px;
  }

  .sp-right {
    flex: 1 1 0;
    min-width: 0;
    justify-content: flex-end;
  }

  /* ---- Upload buttons ---- */
  .upload-group {
    display: flex;
    gap: 4px;
    flex-shrink: 0;
  }

  .btn-upload {
    width: 32px;
    height: 32px;
    border: 1px solid var(--border-color, #3a3a48);
    background: var(--secondary-bg, #1a1a22);
    border-radius: 8px;
    color: var(--text-secondary, #c8c8d5);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.85em;
    transition: all 0.2s;
  }

  .btn-upload:hover {
    background: var(--accent-primary, #00d9ff);
    color: var(--on-accent, #000);
    border-color: var(--accent-primary, #00d9ff);
  }

  /* ---- Track info ---- */
  .track-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    overflow: hidden;
    min-width: 0;
  }

  .track-name {
    font-size: 0.78em;
    font-weight: 500;
    color: var(--text-primary, #fff);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .track-time {
    font-size: 0.68em;
    color: var(--text-muted, #8b8b9a);
    font-family: 'SF Mono', 'Courier New', monospace;
  }

  .track-info.empty .track-name {
    color: var(--text-muted, #8b8b9a);
  }

  /* ---- Divider ---- */
  .sp-divider {
    width: 1px;
    height: 26px;
    background: var(--border-color, #3a3a48);
    flex-shrink: 0;
  }

  /* ---- Drop hint overlay ---- */
  .drop-hint {
    position: absolute;
    inset: 0;
    background: rgba(0, 217, 255, 0.12);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    color: var(--accent-primary, #00d9ff);
    font-size: 0.9em;
    font-weight: 600;
    pointer-events: none;
    z-index: 5;
  }

  .drop-hint i {
    font-size: 1.4em;
  }

  /* ===== Responsive ===== */
  @media (max-width: 900px) {
    .sp-body {
      flex-wrap: wrap;
      gap: 10px 12px;
    }

    .sp-left {
      order: 1;
      flex: 1 1 100%;
    }

    .sp-center {
      order: 2;
      flex: 0 0 auto;
    }

    .sp-right {
      order: 3;
      flex: 1 1 auto;
    }
  }

  @media (max-width: 600px) {
    .sp-body {
      padding: 8px 10px 10px;
    }

    .sp-right {
      flex-wrap: wrap;
      justify-content: center;
      gap: 8px;
    }

    .sp-divider {
      display: none;
    }

    .btn-upload {
      width: 34px;
      height: 34px;
    }
  }

  @media (max-width: 400px) {
    .sp-body {
      gap: 8px;
    }

    .sp-center {
      gap: 4px;
    }
  }

  /* Light theme shadow tweak */
  @media (prefers-color-scheme: light) {
    .sticky-player {
      box-shadow: 0 -4px 18px rgba(0, 0, 0, 0.12);
    }
  }
</style>
