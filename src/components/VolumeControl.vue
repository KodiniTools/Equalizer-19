<template>
  <div class="volume">
    <UiIconButton
      variant="ghost"
      :label="t.player_mute"
      :aria-pressed="isMuted"
      @click="toggleMute"
    >
      <AppIcon v-if="isMuted" name="volume-mute" />
      <AppIcon v-else-if="volume > 0.5" name="volume-high" />
      <AppIcon v-else name="volume-low" />
    </UiIconButton>
    <input
      type="range"
      min="0"
      max="100"
      :value="volume * 100"
      class="ui-range vol-slider"
      :title="t.player_vol_hint"
      :aria-label="t.a11y_volume.replace('{val}', Math.round(volume * 100))"
      :aria-valuenow="Math.round(volume * 100)"
      aria-valuemin="0"
      aria-valuemax="100"
      @input="handleVolumeChange"
    />
  </div>
</template>

<script setup>
  import { inject } from 'vue'
  import AppIcon from './AppIcon.vue'
  import { UiIconButton } from './ui'
  import { storeToRefs } from 'pinia'
  import { usePlayerStore } from '../stores/player'

  const { t } = inject('i18n')
  const audioPlayer = usePlayerStore()
  const { volume, isMuted } = storeToRefs(audioPlayer)
  const { setVolume, toggleMute } = audioPlayer

  function handleVolumeChange(event) {
    const value = parseInt(event.target.value) / 100
    setVolume(value)
  }
</script>

<style scoped src="./ui/range.css"></style>

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
    margin: 2px;
  }

  @media (max-width: 600px) {
    .vol-slider {
      width: 60px;
    }

    /* Bleibt in der Sticky-Leiste auch auf Smartphones bei 12 px */
    .vol-slider::-webkit-slider-thumb {
      width: 12px;
      height: 12px;
    }

    .vol-slider::-moz-range-thumb {
      width: 12px;
      height: 12px;
    }
  }
</style>
