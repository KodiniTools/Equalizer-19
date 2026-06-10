<template>
  <div class="playlist">
    <div class="playlist-header">
      <h3>
        <i class="fas fa-list"></i>
        {{ t('playlist.title') || 'Playlist' }}
      </h3>
      <span v-if="playlist && playlist.length > 0" class="track-count">
        {{ playlist.length }} {{ playlist.length === 1 ? 'Track' : 'Tracks' }}
      </span>
    </div>

    <div v-if="!playlist || playlist.length === 0" class="empty-state">
      <i class="fas fa-music"></i>
      <p>{{ t('playlist.empty') || 'Keine Tracks in der Playlist' }}</p>
    </div>

    <div
      v-else
      class="playlist-items"
      @dragover.prevent
      @drop.prevent
    >
      <div
        v-for="(track, index) in playlist"
        :key="track.id"
        :class="[
          'playlist-item',
          {
            active: currentTrackIndex === index,
            dragging: dragIndex === index,
            'drop-before': dropIndex === index && dropIndex !== dragIndex,
            'drop-after': dropIndex === index + 1 && dropIndex !== dragIndex + 1,
          },
        ]"
        draggable="true"
        @dragstart="onDragStart(index, $event)"
        @dragover.prevent="onDragOver(index)"
        @drop.prevent="onDrop(index)"
        @dragend="onDragEnd"
        @click="handlePlayTrack(index)"
      >
        <!-- Drag handle -->
        <span class="drag-handle" title="Ziehen zum Sortieren" @click.stop>
          <i class="fas fa-grip-vertical"></i>
        </span>

        <div class="track-number">{{ index + 1 }}</div>
        <div class="track-info">
          <div class="track-name">{{ track.name }}</div>
          <div class="track-meta">{{ formatFileSize(track.size) }}</div>
        </div>
        <button
          @click.stop="handleRemoveTrack(index)"
          class="btn-remove"
          :title="t('playlist.remove') || 'Entfernen'"
        >
          <i class="fas fa-times"></i>
        </button>
      </div>
    </div>

    <!-- Keyboard shortcuts hint -->
    <div class="shortcuts-hint">
      <span><kbd>Space</kbd> Play/Pause</span>
      <span><kbd>←</kbd><kbd>→</kbd> ±5s</span>
      <span><kbd>↑</kbd><kbd>↓</kbd> Lautstärke</span>
      <span><kbd>N</kbd> / <kbd>P</kbd> Track</span>
      <span><kbd>M</kbd> Mute</span>
    </div>
  </div>
</template>

<script setup>
  import { ref, inject, computed } from 'vue'

  const i18n = inject('i18n', { t: (key) => key })
  const audioPlayer = inject('audioPlayer', {
    playlist: { value: [] },
    currentTrackIndex: { value: -1 },
    playTrack: () => {},
    removeTrack: () => {},
    reorderTracks: () => {},
  })
  const notify = inject('notify', () => {})

  const t = (key) => {
    if (i18n && typeof i18n.t === 'function') return i18n.t(key)
    const fallback = {
      'playlist.title': 'Playlist',
      'playlist.empty': 'Keine Tracks in der Playlist',
      'playlist.remove': 'Entfernen',
      'playlist.removed': 'Track entfernt',
    }
    return fallback[key] || key
  }

  const playlist = computed(() => audioPlayer.playlist?.value || [])
  const currentTrackIndex = computed(() => audioPlayer.currentTrackIndex?.value ?? -1)

  // Drag state
  const dragIndex = ref(null)
  const dropIndex = ref(null)

  function onDragStart(index, event) {
    dragIndex.value = index
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', String(index))
  }

  function onDragOver(index) {
    dropIndex.value = index
  }

  function onDrop(index) {
    if (dragIndex.value !== null && dragIndex.value !== index) {
      audioPlayer.reorderTracks(dragIndex.value, index)
    }
    dragIndex.value = null
    dropIndex.value = null
  }

  function onDragEnd() {
    dragIndex.value = null
    dropIndex.value = null
  }

  function handlePlayTrack(index) {
    if (audioPlayer.playTrack) audioPlayer.playTrack(index)
  }

  function handleRemoveTrack(index) {
    if (audioPlayer.removeTrack) {
      audioPlayer.removeTrack(index)
      notify(t('playlist.removed') || 'Track entfernt', 'info')
    }
  }

  function formatFileSize(bytes) {
    if (!bytes) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }
</script>

<style scoped>
  .playlist {
    background: var(--card-bg, #252530);
    border: 1px solid var(--border-color, #3a3a48);
    border-radius: 12px;
    padding: 12px;
  }

  .playlist-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
  }

  .playlist-header h3 {
    margin: 0;
    font-size: 0.8em;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--text-primary, #fff);
  }

  .track-count {
    background: var(--accent-primary, #00d9ff);
    color: #000;
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 0.7em;
    font-weight: 600;
  }

  .empty-state {
    text-align: center;
    padding: 20px 10px;
    color: var(--text-muted, #8b8b9a);
  }

  .empty-state i {
    font-size: 1.5em;
    margin-bottom: 8px;
    display: block;
    opacity: 0.5;
  }

  .empty-state p {
    margin: 0;
    font-size: 0.75em;
  }

  .playlist-items {
    display: flex;
    flex-direction: column;
    gap: 4px;
    max-height: 200px;
    overflow-y: auto;
  }

  .playlist-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px;
    background: var(--secondary-bg, #1a1a22);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.15s ease;
    border: 2px solid transparent;
    user-select: none;
  }

  .playlist-item:hover {
    background: var(--hover-bg, #323240);
  }

  .playlist-item.active {
    background: var(--accent-primary, #00d9ff);
    color: #000;
  }

  .playlist-item.dragging {
    opacity: 0.4;
    border-color: var(--accent-primary, #00d9ff);
  }

  .playlist-item.drop-before {
    border-top-color: var(--accent-primary, #00d9ff);
  }

  .playlist-item.drop-after {
    border-bottom-color: var(--accent-primary, #00d9ff);
  }

  .drag-handle {
    color: var(--text-muted, #8b8b9a);
    font-size: 0.65em;
    cursor: grab;
    padding: 2px 1px;
    opacity: 0.4;
    transition: opacity 0.15s;
    flex-shrink: 0;
  }

  .playlist-item:hover .drag-handle {
    opacity: 1;
  }

  .drag-handle:active {
    cursor: grabbing;
  }

  .playlist-item.active .drag-handle {
    color: rgba(0, 0, 0, 0.5);
    opacity: 0.6;
  }

  .track-number {
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 217, 255, 0.2);
    border-radius: 50%;
    font-weight: 600;
    font-size: 0.65em;
    color: var(--text-secondary, #c8c8d5);
    flex-shrink: 0;
  }

  .playlist-item.active .track-number {
    background: rgba(0, 0, 0, 0.2);
    color: #000;
  }

  .track-info {
    flex: 1;
    min-width: 0;
  }

  .track-name {
    font-weight: 500;
    font-size: 0.7em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: var(--text-primary, #fff);
  }

  .playlist-item.active .track-name {
    color: #000;
  }

  .track-meta {
    font-size: 0.6em;
    color: var(--text-muted, #8b8b9a);
  }

  .playlist-item.active .track-meta {
    color: rgba(0, 0, 0, 0.6);
  }

  .btn-remove {
    width: 20px;
    height: 20px;
    border: none;
    border-radius: 50%;
    background: rgba(239, 68, 68, 0.2);
    color: #ef4444;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    font-size: 0.6em;
    flex-shrink: 0;
  }

  .btn-remove:hover {
    background: #ef4444;
    color: white;
  }

  .playlist-item.active .btn-remove {
    background: rgba(0, 0, 0, 0.2);
    color: #000;
  }

  .playlist-item.active .btn-remove:hover {
    background: rgba(0, 0, 0, 0.3);
  }

  /* Keyboard shortcuts hint */
  .shortcuts-hint {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 12px;
    margin-top: 10px;
    padding-top: 8px;
    border-top: 1px solid var(--border-color, #3a3a48);
  }

  .shortcuts-hint span {
    display: flex;
    align-items: center;
    gap: 3px;
    font-size: 0.6em;
    color: var(--text-muted, #8b8b9a);
    white-space: nowrap;
  }

  kbd {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: var(--secondary-bg, #1a1a22);
    border: 1px solid var(--border-color, #3a3a48);
    border-radius: 4px;
    padding: 1px 5px;
    font-family: 'SF Mono', 'Courier New', monospace;
    font-size: 0.95em;
    color: var(--accent-primary, #00d9ff);
    line-height: 1.4;
  }

  /* Scrollbar */
  .playlist-items::-webkit-scrollbar {
    width: 4px;
  }

  .playlist-items::-webkit-scrollbar-track {
    background: var(--secondary-bg, #1a1a22);
    border-radius: 4px;
  }

  .playlist-items::-webkit-scrollbar-thumb {
    background: var(--accent-primary, #00d9ff);
    border-radius: 4px;
  }

  .playlist-items::-webkit-scrollbar-thumb:hover {
    background: #00c4e6;
  }

  @media (max-width: 600px) {
    .playlist {
      padding: 10px;
    }

    .playlist-header h3 {
      font-size: 0.75em;
    }

    .playlist-item {
      padding: 6px;
      gap: 6px;
    }

    .track-name {
      font-size: 0.65em;
    }

    .track-meta {
      font-size: 0.55em;
    }

    .btn-remove {
      width: 24px;
      height: 24px;
      font-size: 0.65em;
    }

    .playlist-items {
      max-height: 160px;
    }

    .shortcuts-hint {
      gap: 4px 8px;
    }
  }

  @media (max-width: 400px) {
    .playlist {
      padding: 8px;
    }

    .playlist-item {
      padding: 5px;
    }

    .track-number {
      width: 18px;
      height: 18px;
      font-size: 0.6em;
    }

    .playlist-items {
      max-height: 140px;
    }

    .shortcuts-hint {
      display: none;
    }
  }
</style>
