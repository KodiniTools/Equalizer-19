<template>
  <div class="sp-section sp-center">
    <UiIconButton
      variant="ghost"
      :pressed="isShuffle"
      class="mode"
      :label="t.player_shuffle"
      @click="toggleShuffle"
    >
      <AppIcon name="shuffle" />
    </UiIconButton>

    <UiIconButton
      variant="ghost"
      :label="t.player_prev"
      :disabled="!canPlayPrevious"
      @click="playPrevious"
    >
      <AppIcon name="prev" />
    </UiIconButton>

    <UiIconButton
      variant="primary"
      size="md"
      round
      class="play"
      :label="isPlaying ? t.pause : t.play"
      :aria-pressed="isPlaying"
      @click="togglePlayPause"
    >
      <AppIcon v-if="isLoading" name="spinner" spin />
      <AppIcon v-else-if="isPlaying" name="pause" />
      <AppIcon v-else name="play" />
    </UiIconButton>

    <UiIconButton variant="ghost" :label="t.stop" @click="stop">
      <AppIcon name="stop" />
    </UiIconButton>

    <UiIconButton variant="ghost" :label="t.player_next" :disabled="!canPlayNext" @click="playNext">
      <AppIcon name="next" />
    </UiIconButton>

    <UiIconButton
      variant="ghost"
      :pressed="repeatMode !== 'off'"
      class="mode"
      :label="repeatTitle"
      @click="cycleRepeat"
    >
      <AppIcon name="repeat" />
      <span v-if="repeatMode === 'one'" class="repeat-one" aria-hidden="true">1</span>
    </UiIconButton>
  </div>
</template>

<script setup>
  import { inject, computed } from 'vue'
  import AppIcon from './AppIcon.vue'
  import { UiIconButton } from './ui'

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
  /* ---- Transport controls (UiIconButton) ---- */
  .ui-button.play {
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
    .ui-button.play {
      width: 42px;
      height: 42px;
    }
  }
</style>
