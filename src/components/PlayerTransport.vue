<template>
  <div class="sp-section sp-center">
    <button
      @click="toggleShuffle"
      :class="['btn', 'btn-icon', 'btn-ghost', 'btn-sm', 'mode', { 'is-on': isShuffle }]"
      :title="t.player_shuffle"
      :aria-label="t.player_shuffle"
      :aria-pressed="isShuffle"
    >
      <AppIcon name="shuffle" />
    </button>

    <button
      @click="playPrevious"
      :disabled="!canPlayPrevious"
      class="btn btn-icon btn-ghost btn-sm"
      :title="t.player_prev"
      :aria-label="t.player_prev"
    >
      <AppIcon name="prev" />
    </button>

    <button
      @click="togglePlayPause"
      class="btn btn-icon btn-primary btn-round play"
      :title="isPlaying ? t.pause : t.play"
      :aria-label="isPlaying ? t.pause : t.play"
      :aria-pressed="isPlaying"
    >
      <AppIcon v-if="isLoading" name="spinner" spin />
      <AppIcon v-else-if="isPlaying" name="pause" />
      <AppIcon v-else name="play" />
    </button>

    <button
      @click="stop"
      class="btn btn-icon btn-ghost btn-sm"
      :title="t.stop"
      :aria-label="t.stop"
    >
      <AppIcon name="stop" />
    </button>

    <button
      @click="playNext"
      :disabled="!canPlayNext"
      class="btn btn-icon btn-ghost btn-sm"
      :title="t.player_next"
      :aria-label="t.player_next"
    >
      <AppIcon name="next" />
    </button>

    <button
      @click="cycleRepeat"
      :class="['btn', 'btn-icon', 'btn-ghost', 'btn-sm', 'mode', { 'is-on': repeatMode !== 'off' }]"
      :title="repeatTitle"
      :aria-label="repeatTitle"
      :aria-pressed="repeatMode !== 'off'"
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
    color: var(--accent-primary, #00d9ff);
    background: var(--card-bg, #252530);
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
