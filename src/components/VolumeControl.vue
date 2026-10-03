<template>
  <div class="volume">
    <button
      @click="toggleMute"
      class="btn btn-icon btn-ghost btn-sm"
      :title="t.player_mute"
      :aria-label="t.player_mute"
      :aria-pressed="isMuted"
    >
      <AppIcon v-if="isMuted" name="volume-mute" />
      <AppIcon v-else-if="volume > 0.5" name="volume-high" />
      <AppIcon v-else name="volume-low" />
    </button>
    <input
      type="range"
      min="0"
      max="100"
      :value="volume * 100"
      @input="handleVolumeChange"
      class="vol-slider"
      :title="t.player_vol_hint"
      :aria-label="t.a11y_volume.replace('{val}', Math.round(volume * 100))"
      :aria-valuenow="Math.round(volume * 100)"
      aria-valuemin="0"
      aria-valuemax="100"
    />
  </div>
</template>

<script setup>
  import { inject } from 'vue'
  import AppIcon from './AppIcon.vue'

  const { t } = inject('i18n')
  const { volume, isMuted, setVolume, toggleMute } = inject('audioPlayer')

  function handleVolumeChange(event) {
    const value = parseInt(event.target.value) / 100
    setVolume(value)
  }
</script>

<style scoped>
  /* ---- Volume ---- */
  .volume {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
  }

  .vol-slider {
    width: 80px;
    height: 4px;
    -webkit-appearance: none;
    appearance: none;
    background: var(--secondary-bg, #1a1a22);
    border-radius: 2px;
    outline: none;
    cursor: pointer;
  }

  .vol-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--accent-primary, #00d9ff);
    cursor: pointer;
    transition: transform 0.2s;
  }

  .vol-slider::-webkit-slider-thumb:hover {
    transform: scale(1.2);
  }

  .vol-slider::-moz-range-thumb {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--accent-primary, #00d9ff);
    cursor: pointer;
    border: none;
  }

  @media (max-width: 600px) {
    .vol-slider {
      width: 60px;
    }
  }
</style>
