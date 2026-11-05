<template>
  <div class="rec-settings">
    <!-- display: contents – die Einstellungen bleiben direkte Flex-Kinder der Leiste -->
    <!-- Format toggle (only when idle and nothing recorded yet) -->
    <UiSegmentedControl
      v-if="idle && !hasRecording"
      :model-value="format"
      :options="formatOptions"
      :label="t.rec_format_label"
      size="sm"
      @update:model-value="emit('update:format', $event)"
    />

    <!-- WAV bit depth (only for WAV, changeable while idle) -->
    <UiSegmentedControl
      v-if="idle && format === 'wav'"
      :model-value="bitDepth"
      :options="bitDepthOptions"
      :label="t.rec_bit_depth"
      size="sm"
      @update:model-value="emit('update:bitDepth', $event)"
    />

    <!-- Start delay (countdown before recording starts) -->
    <label v-if="idle && !hasRecording" class="delay" :title="t.rec_delay">
      <AppIcon name="timer" />
      <select
        class="delay-select"
        :value="startDelay"
        :aria-label="t.rec_delay"
        @change="emit('update:startDelay', parseInt($event.target.value, 10))"
      >
        <option v-for="d in START_DELAYS" :key="d" :value="d">
          {{ d === 0 ? t.rec_delay_none : t.rec_delay_s.replace('{n}', d) }}
        </option>
      </select>
    </label>
  </div>
</template>

<script setup>
  import { computed, inject } from 'vue'
  import AppIcon from '../AppIcon.vue'
  import { START_DELAYS } from '../../composables/useCountdown'
  import { UiSegmentedControl } from '../ui'

  /**
   * Aufnahme-Einstellungen in der Leiste: Format, WAV-Bit-Tiefe, Startverzögerung.
   * Sichtbar nur im Leerlauf (`idle` = weder Aufnahme noch Countdown).
   */
  const props = defineProps({
    format: { type: String, required: true },
    bitDepth: { type: Number, required: true },
    bitDepths: { type: Array, required: true },
    startDelay: { type: Number, required: true },
    idle: { type: Boolean, default: true },
    hasRecording: { type: Boolean, default: false },
  })

  const emit = defineEmits(['update:format', 'update:bitDepth', 'update:startDelay'])

  const { t } = inject('i18n')

  const formatOptions = computed(() => [
    { value: 'wav', label: 'WAV', title: t.value.rec_format_wav },
    { value: 'webm', label: 'WebM', title: t.value.rec_format_webm },
  ])

  const bitDepthOptions = computed(() =>
    props.bitDepths.map((depth) => ({
      value: depth,
      label: depth === 32 ? '32f' : String(depth),
      title: t.value[`rec_bit_${depth}`] || `${depth} Bit`,
    }))
  )
</script>

<style scoped>
  .rec-settings {
    display: contents;
  }

  /* Start delay select */
  .delay {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    height: 28px;
    padding: 0 4px 0 8px;
    border-radius: 6px;
    background: var(--secondary-bg);
    color: var(--text-muted);
    font-size: 11px;
  }

  .delay-select {
    border: none;
    background: transparent;
    color: var(--text-primary);
    font-size: 1em;
    font-weight: 600;
    cursor: pointer;
    padding: 2px 2px;
  }

  .delay-select:focus-visible {
    outline: 2px solid var(--accent-primary);
    outline-offset: 1px;
    border-radius: 4px;
  }

  .delay-select option {
    background: var(--card-bg);
    color: var(--text-primary);
  }
</style>
