<template>
  <BasePanel icon="list" :title="t.playlist_title">
    <template v-if="playlist.length > 0" #actions>
      <span class="panel-badge">
        {{ playlist.length }} {{ playlist.length === 1 ? 'Track' : 'Tracks' }}
      </span>
    </template>

    <div v-if="playlist.length === 0" class="empty-state">
      <AppIcon name="music" />
      <p>{{ t.playlist_empty }}</p>
    </div>

    <ol
      v-else
      class="playlist-items"
      :aria-label="t.playlist_title"
      @dragover.prevent
      @drop.prevent
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
        :aria-current="currentTrackIndex === index ? 'true' : undefined"
        :aria-label="track.name"
        @dragstart="onDragStart(index, $event)"
        @dragover.prevent="onDragOver(index)"
        @drop.prevent="onDrop(index)"
        @dragend="onDragEnd"
        @click="handlePlayTrack(index)"
      >
        <!-- Drag handle -->
        <span
          class="drag-handle"
          :title="t.playlist_drag_hint"
          :aria-label="t.playlist_drag_hint"
          @click.stop
        >
          <AppIcon name="grip" />
        </span>

        <div class="track-number" aria-hidden="true">
          <AppIcon
            v-if="currentTrackIndex === index && isPlaying"
            name="volume-high"
            :title="t.playlist_now_playing"
          />
          <template v-else>{{ index + 1 }}</template>
        </div>
        <div class="track-info">
          <div class="track-name">{{ track.name }}</div>
          <div class="track-meta">{{ formatFileSize(track.size) }}</div>
        </div>
        <UiIconButton
          variant="ghost"
          class="btn-remove"
          :label="t.playlist_remove + ' ' + track.name"
          :title="t.playlist_remove"
          @click.stop="handleRemoveTrack(index)"
        >
          <AppIcon name="close" />
        </UiIconButton>
      </li>
    </ol>

    <!-- Keyboard shortcuts (collapsed by default) -->
    <template #footer>
      <details class="shortcuts">
        <summary>
          <AppIcon name="keyboard" />
          <span>{{ t.shortcuts_title }}</span>
          <AppIcon name="chevron-down" class="chevron" />
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
          <dt>
            <kbd>{{ t.key_ctrl }}</kbd>
            <kbd>Z</kbd>
          </dt>
          <dd>{{ t.history_undo }}</dd>
          <dt>
            <kbd>{{ t.key_ctrl }}</kbd>
            <kbd>Y</kbd>
          </dt>
          <dd>{{ t.history_redo }}</dd>
        </dl>
      </details>
    </template>
  </BasePanel>
</template>

<script setup>
  import { ref, inject, computed } from 'vue'
  import AppIcon from './AppIcon.vue'
  import BasePanel from './BasePanel.vue'
  import { UiIconButton } from './ui'

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
    border: 1px dashed var(--border-color);
    border-radius: 10px;
    color: var(--text-muted);
  }

  .empty-state .icon {
    width: 22px;
    height: 22px;
    margin-bottom: 8px;
    display: block;
    margin-inline: auto;
    opacity: 0.6;
  }

  .empty-state p {
    margin: 0;
    font-size: 12px;
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
    background: var(--secondary-bg);
  }

  /* Active track: tinted row with an accent bar on the left */
  .playlist-item.active {
    background: color-mix(in srgb, var(--accent-primary) 14%, transparent);
  }

  .playlist-item.active::before {
    content: '';
    position: absolute;
    left: 0;
    top: 6px;
    bottom: 6px;
    width: 3px;
    border-radius: 2px;
    background: var(--accent-primary);
  }

  .playlist-item.dragging {
    opacity: 0.4;
  }

  .playlist-item.drop-before {
    border-top-color: var(--accent-primary);
  }

  .playlist-item.drop-after {
    border-bottom-color: var(--accent-primary);
  }

  .drag-handle {
    color: var(--text-muted);
    font-size: 11px;
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
    font-size: 11px;
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
    font-variant-numeric: tabular-nums;
    color: var(--text-muted);
    flex-shrink: 0;
  }

  .playlist-item.active .track-number {
    color: var(--accent-primary);
    font-weight: 600;
  }

  .track-info {
    flex: 1;
    min-width: 0;
  }

  .track-name {
    font-weight: 500;
    font-size: 12px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: var(--text-primary);
  }

  .playlist-item.active .track-name {
    font-weight: 600;
  }

  .track-meta {
    font-size: 10.5px;
    color: var(--text-muted);
  }

  /* Remove button: UiIconButton ghost, faded until the row is hovered */
  .btn-remove {
    color: var(--text-muted);
    opacity: 0.6;
    transition:
      background-color 0.15s,
      color 0.15s,
      opacity 0.15s;
  }

  .playlist-item:hover .btn-remove,
  .btn-remove:focus-visible {
    opacity: 1;
  }

  .ui-button.btn-remove:hover:not(:disabled) {
    background: color-mix(in srgb, var(--error) 15%, transparent);
    color: var(--error);
  }

  /* ---- Keyboard shortcuts ---- */
  .shortcuts summary {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    list-style: none;
    font-size: 11px;
    font-weight: 500;
    color: var(--text-muted);
    border-radius: 6px;
    transition: color 0.15s;
  }

  .shortcuts summary::-webkit-details-marker {
    display: none;
  }

  .shortcuts summary:hover {
    color: var(--text-primary);
  }

  .shortcuts summary:focus-visible {
    outline: 2px solid var(--accent-primary);
    outline-offset: 2px;
  }

  .shortcuts .chevron {
    margin-left: auto;
    font-size: 14px;
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
    font-size: 11px;
    color: var(--text-secondary);
  }

  kbd {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 20px;
    background: var(--secondary-bg);
    border: 1px solid var(--border-color);
    border-bottom-width: 2px;
    border-radius: 4px;
    padding: 1px 5px;
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
    font-size: 10.5px;
    color: var(--text-primary);
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
    background: var(--border-color);
    border-radius: 4px;
  }

  .playlist-items::-webkit-scrollbar-thumb:hover {
    background: var(--accent-primary);
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
  }
</style>
