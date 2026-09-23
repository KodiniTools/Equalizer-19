<template>
  <BasePanel icon="fas fa-list" :title="t.playlist_title">
    <template v-if="playlist.length > 0" #actions>
      <span class="panel-badge">
        {{ playlist.length }} {{ playlist.length === 1 ? 'Track' : 'Tracks' }}
      </span>
    </template>

    <div v-if="playlist.length === 0" class="empty-state">
      <i class="fas fa-music" aria-hidden="true"></i>
      <p>{{ t.playlist_empty }}</p>
    </div>

    <ol
      v-else
      class="playlist-items"
      @dragover.prevent
      @drop.prevent
      :aria-label="t.playlist_title"
    >
      <li
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
        :aria-current="currentTrackIndex === index ? 'true' : undefined"
        :aria-label="track.name"
      >
        <!-- Drag handle -->
        <span
          class="drag-handle"
          :title="t.playlist_drag_hint"
          :aria-label="t.playlist_drag_hint"
          @click.stop
        >
          <i class="fas fa-grip-vertical" aria-hidden="true"></i>
        </span>

        <div class="track-number" aria-hidden="true">
          <i
            v-if="currentTrackIndex === index && isPlaying"
            class="fas fa-volume-up"
            :title="t.playlist_now_playing"
          ></i>
          <template v-else>{{ index + 1 }}</template>
        </div>
        <div class="track-info">
          <div class="track-name">{{ track.name }}</div>
          <div class="track-meta">{{ formatFileSize(track.size) }}</div>
        </div>
        <button
          @click.stop="handleRemoveTrack(index)"
          class="btn-remove"
          :title="t.playlist_remove"
          :aria-label="t.playlist_remove + ' ' + track.name"
        >
          <i class="fas fa-times" aria-hidden="true"></i>
        </button>
      </li>
    </ol>

    <!-- Keyboard shortcuts (collapsed by default) -->
    <template #footer>
      <details class="shortcuts">
        <summary>
          <i class="fas fa-keyboard" aria-hidden="true"></i>
          <span>{{ t.shortcuts_title }}</span>
          <i class="fas fa-chevron-down chevron" aria-hidden="true"></i>
        </summary>
        <dl class="shortcut-list">
          <dt><kbd>Space</kbd></dt>
          <dd>{{ t.play }} / {{ t.pause }}</dd>
          <dt><kbd>←</kbd><kbd>→</kbd></dt>
          <dd>{{ t.shortcut_seek }}</dd>
          <dt><kbd>↑</kbd><kbd>↓</kbd></dt>
          <dd>{{ t.volume }}</dd>
          <dt><kbd>N</kbd><kbd>P</kbd></dt>
          <dd>{{ t.shortcut_track }}</dd>
          <dt><kbd>M</kbd></dt>
          <dd>{{ t.player_mute }}</dd>
        </dl>
      </details>
    </template>
  </BasePanel>
</template>

<script setup>
  import { ref, inject, computed } from 'vue'
  import BasePanel from './BasePanel.vue'

  const { t } = inject('i18n')
  const audioPlayer = inject('audioPlayer', {
    playlist: { value: [] },
    currentTrackIndex: { value: -1 },
    playTrack: () => {},
    removeTrack: () => {},
    reorderTracks: () => {},
  })
  const notify = inject('notify', () => {})

  const playlist = computed(() => audioPlayer.playlist?.value || [])
  const currentTrackIndex = computed(() => audioPlayer.currentTrackIndex?.value ?? -1)
  const isPlaying = computed(() => audioPlayer.isPlaying?.value ?? false)

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
      notify(t.value.playlist_removed, 'info')
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
  .empty-state {
    text-align: center;
    padding: 22px 12px;
    border: 1px dashed var(--border-color, #3a3a48);
    border-radius: 10px;
    color: var(--text-muted, #8b8b9a);
  }

  .empty-state i {
    font-size: 1.4em;
    margin-bottom: 8px;
    display: block;
    opacity: 0.6;
  }

  .empty-state p {
    margin: 0;
    font-size: 0.72em;
  }

  .playlist-items {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
    max-height: 320px;
    overflow-y: auto;
  }

  .playlist-item {
    position: relative;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 7px 8px;
    border-radius: 8px;
    border-top: 2px solid transparent;
    border-bottom: 2px solid transparent;
    cursor: pointer;
    user-select: none;
    transition: background 0.15s ease;
  }

  .playlist-item:hover {
    background: var(--secondary-bg, #1a1a22);
  }

  /* Active track: tinted row with an accent bar on the left */
  .playlist-item.active {
    background: color-mix(in srgb, var(--accent-primary, #00d9ff) 14%, transparent);
  }

  .playlist-item.active::before {
    content: '';
    position: absolute;
    left: 0;
    top: 6px;
    bottom: 6px;
    width: 3px;
    border-radius: 2px;
    background: var(--accent-primary, #00d9ff);
  }

  .playlist-item.dragging {
    opacity: 0.4;
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
    opacity: 0;
    transition: opacity 0.15s;
    flex-shrink: 0;
  }

  .playlist-item:hover .drag-handle,
  .playlist-item:focus-within .drag-handle {
    opacity: 0.8;
  }

  .drag-handle:active {
    cursor: grabbing;
  }

  .track-number {
    width: 18px;
    text-align: center;
    font-size: 0.65em;
    font-family: 'SF Mono', 'Courier New', monospace;
    font-variant-numeric: tabular-nums;
    color: var(--text-muted, #8b8b9a);
    flex-shrink: 0;
  }

  .playlist-item.active .track-number {
    color: var(--accent-primary, #00d9ff);
    font-weight: 600;
  }

  .track-info {
    flex: 1;
    min-width: 0;
  }

  .track-name {
    font-weight: 500;
    font-size: 0.72em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: var(--text-primary, #fff);
  }

  .playlist-item.active .track-name {
    font-weight: 600;
  }

  .track-meta {
    font-size: 0.6em;
    color: var(--text-muted, #8b8b9a);
  }

  .btn-remove {
    width: 24px;
    height: 24px;
    border: none;
    border-radius: 6px;
    background: transparent;
    color: var(--text-muted, #8b8b9a);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.65em;
    flex-shrink: 0;
    opacity: 0.6;
    transition:
      background 0.15s,
      color 0.15s,
      opacity 0.15s;
  }

  .playlist-item:hover .btn-remove,
  .btn-remove:focus-visible {
    opacity: 1;
  }

  .btn-remove:hover {
    background: color-mix(in srgb, var(--error, #ef4444) 15%, transparent);
    color: var(--error, #ef4444);
  }

  /* ---- Keyboard shortcuts ---- */
  .shortcuts summary {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    list-style: none;
    font-size: 0.68em;
    font-weight: 500;
    color: var(--text-muted, #8b8b9a);
    border-radius: 6px;
    transition: color 0.15s;
  }

  .shortcuts summary::-webkit-details-marker {
    display: none;
  }

  .shortcuts summary:hover {
    color: var(--text-primary, #fff);
  }

  .shortcuts summary:focus-visible {
    outline: 2px solid var(--accent-primary, #00d9ff);
    outline-offset: 2px;
  }

  .shortcuts .chevron {
    margin-left: auto;
    font-size: 0.85em;
    transition: transform 0.2s;
  }

  .shortcuts[open] .chevron {
    transform: rotate(180deg);
  }

  .shortcut-list {
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: center;
    gap: 6px 10px;
    margin: 10px 0 0;
  }

  .shortcut-list dt {
    display: flex;
    gap: 3px;
  }

  .shortcut-list dd {
    margin: 0;
    font-size: 0.65em;
    color: var(--text-secondary, #c8c8d5);
  }

  kbd {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 20px;
    background: var(--secondary-bg, #1a1a22);
    border: 1px solid var(--border-color, #3a3a48);
    border-bottom-width: 2px;
    border-radius: 4px;
    padding: 1px 5px;
    font-family: 'SF Mono', 'Courier New', monospace;
    font-size: 0.6em;
    color: var(--text-primary, #fff);
    line-height: 1.4;
  }

  /* Scrollbar */
  .playlist-items::-webkit-scrollbar {
    width: 4px;
  }

  .playlist-items::-webkit-scrollbar-track {
    background: transparent;
  }

  .playlist-items::-webkit-scrollbar-thumb {
    background: var(--border-color, #3a3a48);
    border-radius: 4px;
  }

  .playlist-items::-webkit-scrollbar-thumb:hover {
    background: var(--accent-primary, #00d9ff);
  }

  @media (hover: none) {
    /* Touch devices: no hover, keep handle and remove button visible */
    .drag-handle {
      opacity: 0.6;
    }

    .btn-remove {
      opacity: 1;
    }
  }

  @media (max-width: 600px) {
    .playlist-items {
      max-height: 220px;
    }

    .btn-remove {
      width: 32px;
      height: 32px;
    }
  }
</style>
