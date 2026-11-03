<template>
  <div class="sp-section sp-center">
    <button
      :class="['btn', 'btn-icon', 'btn-ghost', 'btn-sm', 'mode', { 'is-on': isShuffle }]"
      :title="t.player_shuffle"
      :aria-label="t.player_shuffle"
      :aria-pressed="isShuffle"
      @click="toggleShuffle"
    >
      <AppIcon name="shuffle" />
    </button>

    <button
      :disabled="!canPlayPrevious"
      class="btn btn-icon btn-ghost btn-sm"
      :title="t.player_prev"
      :aria-label="t.player_prev"
      @click="playPrevious"
    >
      <AppIcon name="prev" />
    </button>

    <button
      class="btn btn-icon btn-primary btn-round play"
      :title="isPlaying ? t.pause : t.play"
      :aria-label="isPlaying ? t.pause : t.play"
      :aria-pressed="isPlaying"
      @click="togglePlayPause"
    >
      <AppIcon v-if="isLoading" name="spinner" spin />
      <AppIcon v-else-if="isPlaying" name="pause" />
      <AppIcon v-else name="play" />
    </button>

    <button
      class="btn btn-icon btn-ghost btn-sm"
      :title="t.stop"
      :aria-label="t.stop"
      @click="stop"
    >
      <AppIcon name="stop" />
    </button>

    <button
      :disabled="!canPlayNext"
      class="btn btn-icon btn-ghost btn-sm"
      :title="t.player_next"
      :aria-label="t.player_next"
      @click="playNext"
    >
      <AppIcon name="next" />
    </button>

    <button
      :class="['btn', 'btn-icon', 'btn-ghost', 'btn-sm', 'mode', { 'is-on': repeatMode !== 'off' }]"
      :title="repeatTitle"
      :aria-label="repeatTitle"
      :aria-pressed="repeatMode !== 'off'"
      @click="cycleRepeat"
    >
      <AppIcon name="repeat" />
      <span v-if="repeatMode === 'one'" class="repeat-one" aria-hidden="true">1</span>
    </button>
  </div>
</template>

<script setup>
  import { inject, computed } from 'vue'
  import AppIcon from './AppIcon.vue'

  const { t } = inject('i18n')
  const {
    isPlaying,
    isLoading,
    canPlayNext,
    canPlayPrevious,
    isShuffle,
    repeatMode,
    stop,
    togglePlayPause,
    playNext,
    playPrevious,
    toggleShuffle,
    cycleRepeat,
  } = inject('audioPlayer')

  const repeatTitle = computed(() => {
    if (repeatMode.value === 'all') return t.value.player_repeat_all
    if (repeatMode.value === 'one') return t.value.player_repeat_one
    return t.value.player_repeat_off
  })
</script>

<style scoped>
  /* ---- Transport controls (buttons come from the global .btn system) ---- */
  .play {
    width: 40px;
    height: 40px;
  }

  .play .icon {
    width: 16px;
    height: 16px;
  }

  /* Shuffle / repeat mode buttons */
  .mode {
    position: relative;
  }

  .repeat-one {
    position: absolute;
    top: 0;
    right: 1px;
    font-size: 11px;
    font-weight: 700;
    line-height: 1;
    color: var(--accent-primary);
    background: var(--card-bg);
    border-radius: 50%;
    width: 11px;
    height: 11px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  @media (max-width: 600px) {
    .play {
      width: 42px;
      height: 42px;
    }
  }
</style>
