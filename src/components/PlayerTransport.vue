<template>
  <div class="sp-section sp-center">
    <button
      @click="toggleShuffle"
      :class="['ctrl-btn', 'mode', { on: isShuffle }]"
      :title="t.player_shuffle"
      :aria-label="t.player_shuffle"
      :aria-pressed="isShuffle"
    >
      <i class="fas fa-shuffle" aria-hidden="true"></i>
    </button>

    <button
      @click="playPrevious"
      :disabled="!canPlayPrevious"
      class="ctrl-btn"
      :title="t.player_prev"
      :aria-label="t.player_prev"
    >
      <i class="fas fa-step-backward" aria-hidden="true"></i>
    </button>

    <button
      @click="togglePlayPause"
      class="ctrl-btn play"
      :title="isPlaying ? t.pause : t.play"
      :aria-label="isPlaying ? t.pause : t.play"
      :aria-pressed="isPlaying"
    >
      <i v-if="isLoading" class="fas fa-spinner fa-spin" aria-hidden="true"></i>
      <i v-else-if="isPlaying" class="fas fa-pause" aria-hidden="true"></i>
      <i v-else class="fas fa-play" aria-hidden="true"></i>
    </button>

    <button @click="stop" class="ctrl-btn" :title="t.stop" :aria-label="t.stop">
      <i class="fas fa-stop" aria-hidden="true"></i>
    </button>

    <button
      @click="playNext"
      :disabled="!canPlayNext"
      class="ctrl-btn"
      :title="t.player_next"
      :aria-label="t.player_next"
    >
      <i class="fas fa-step-forward" aria-hidden="true"></i>
    </button>

    <button
      @click="cycleRepeat"
      :class="['ctrl-btn', 'mode', { on: repeatMode !== 'off' }]"
      :title="repeatTitle"
      :aria-label="repeatTitle"
      :aria-pressed="repeatMode !== 'off'"
    >
      <i class="fas fa-repeat" aria-hidden="true"></i>
      <span v-if="repeatMode === 'one'" class="repeat-one" aria-hidden="true">1</span>
    </button>
  </div>
</template>

<script setup>
  import { inject, computed } from 'vue'

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
  /* ---- Transport controls ---- */
  .ctrl-btn {
    width: 30px;
    height: 30px;
    border: none;
    border-radius: 6px;
    background: var(--secondary-bg, #1a1a22);
    color: var(--text-secondary, #c8c8d5);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.72em;
    transition: all 0.2s;
  }

  .ctrl-btn:hover:not(:disabled) {
    background: var(--hover-bg, #323240);
    color: var(--text-primary, #fff);
  }

  .ctrl-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .ctrl-btn.play {
    width: 40px;
    height: 40px;
    background: var(--accent-primary, #00d9ff);
    color: var(--on-accent, #000);
    font-size: 0.9em;
  }

  .ctrl-btn.play:hover {
    background: var(--accent-hover, #00c4e6);
    transform: scale(1.05);
  }

  /* Shuffle / repeat mode buttons */
  .ctrl-btn.mode {
    position: relative;
  }

  .ctrl-btn.mode.on {
    color: var(--accent-primary, #00d9ff);
    background: color-mix(
      in srgb,
      var(--accent-primary, #00d9ff) 22%,
      var(--secondary-bg, #1a1a22)
    );
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--accent-primary, #00d9ff) 55%, transparent);
  }

  .ctrl-btn.mode.on:hover:not(:disabled) {
    color: var(--accent-primary, #00d9ff);
    background: color-mix(
      in srgb,
      var(--accent-primary, #00d9ff) 32%,
      var(--secondary-bg, #1a1a22)
    );
  }

  .repeat-one {
    position: absolute;
    top: 0;
    right: 1px;
    font-size: 0.68em;
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
    .ctrl-btn {
      width: 34px;
      height: 34px;
    }

    .ctrl-btn.play {
      width: 42px;
      height: 42px;
    }
  }
</style>
