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
    
    <div v-else class="playlist-items">
      <div 
        v-for="(track, index) in playlist" 
        :key="track.id"
        :class="['playlist-item', { active: currentTrackIndex === index }]"
        @click="handlePlayTrack(index)"
      >
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
  </div>
</template>

<script setup>
import { inject, computed } from 'vue'

// Get dependencies
const i18n = inject('i18n', { t: (key) => key })

const audioPlayer = inject('audioPlayer', {
  playlist: { value: [] },
  currentTrackIndex: { value: -1 },
  playTrack: () => {},
  removeTrack: () => {}
})

const notify = inject('notify', () => {})

// Make t function available in template
const t = (key) => {
  if (i18n && typeof i18n.t === 'function') {
    return i18n.t(key)
  }
  // Fallback translations
  const translations = {
    'playlist.title': 'Playlist',
    'playlist.empty': 'Keine Tracks in der Playlist',
    'playlist.remove': 'Entfernen',
    'playlist.removed': 'Track entfernt'
  }
  return translations[key] || key
}

// Get player state
const playlist = computed(() => audioPlayer.playlist?.value || [])
const currentTrackIndex = computed(() => audioPlayer.currentTrackIndex?.value || -1)

// Methods
function handlePlayTrack(index) {
  if (audioPlayer.playTrack) {
    audioPlayer.playTrack(index)
  }
}

function handleRemoveTrack(index) {
  if (audioPlayer.removeTrack) {
    audioPlayer.removeTrack(index)
    notify(
      t('playlist.removed') || 'Track entfernt',
      'info'
    )
  }
}

function formatFileSize(bytes) {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}
</script>

<style scoped>
.playlist {
  background: white;
  border-radius: 20px;
  padding: 25px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.playlist-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.playlist-header h3 {
  margin: 0;
  font-size: 1.4em;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #333;
}

.track-count {
  background: #667eea;
  color: white;
  padding: 5px 12px;
  border-radius: 15px;
  font-size: 0.85em;
  font-weight: 600;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #999;
}

.empty-state i {
  font-size: 3em;
  margin-bottom: 15px;
  display: block;
  opacity: 0.5;
}

.empty-state p {
  margin: 0;
  font-size: 1.1em;
}

.playlist-items {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 400px;
  overflow-y: auto;
}

.playlist-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.playlist-item:hover {
  background: #e9ecef;
  transform: translateX(5px);
}

.playlist-item.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.track-number {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(102, 126, 234, 0.2);
  border-radius: 50%;
  font-weight: 600;
  font-size: 0.9em;
}

.playlist-item.active .track-number {
  background: rgba(255, 255, 255, 0.3);
}

.track-info {
  flex: 1;
  min-width: 0;
}

.track-name {
  font-weight: 600;
  font-size: 0.95em;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.track-meta {
  font-size: 0.8em;
  opacity: 0.7;
}

.btn-remove {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: rgba(220, 53, 69, 0.1);
  color: #dc3545;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  font-size: 0.9em;
}

.btn-remove:hover {
  background: #dc3545;
  color: white;
  transform: scale(1.1);
}

.playlist-item.active .btn-remove {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.playlist-item.active .btn-remove:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* Scrollbar styling */
.playlist-items::-webkit-scrollbar {
  width: 8px;
}

.playlist-items::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

.playlist-items::-webkit-scrollbar-thumb {
  background: #667eea;
  border-radius: 10px;
}

.playlist-items::-webkit-scrollbar-thumb:hover {
  background: #5568d3;
}

@media (max-width: 768px) {
  .playlist {
    padding: 20px;
  }
  
  .playlist-items {
    max-height: 300px;
  }
}
</style>
