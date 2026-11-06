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
      @update:model-value="onFormat"
    />

    <!-- WAV bit depth (only for WAV, changeable while idle) -->
    <UiSegmentedControl
      v-if="idle && format === 'wav'"
      :model-value="bitDepth"
      :options="bitDepthOptions"
      :label="t.rec_bit_depth"
      size="sm"
      @update:model-value="onBitDepth"
    />

    <!-- Start delay (countdown before recording starts) -->
    <label v-if="idle && !hasRecording" class="delay" :title="t.rec_delay">
      <AppIcon name="timer" />
      <select
        class="delay-select"
        :value="startDelay"
        :aria-label="t.rec_delay"
        @change="onStartDelay"
      >
        <option v-for="d in START_DELAYS" :key="d" :value="d">
          {{ d === 0 ? t.rec_delay_none : t.rec_delay_s.replace('{n}', String(d)) }}
        </option>
      </select>
    </label>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import AppIcon from '../AppIcon.vue'
  import { START_DELAYS } from '../../composables/useCountdown'
  import { injectI18n } from '../../composables/useI18n'
  import { UiSegmentedControl, type UiSegmentedOption } from '../ui'

  /**
   * Aufnahme-Einstellungen in der Leiste: Format, WAV-Bit-Tiefe, Startverzögerung.
   * Sichtbar nur im Leerlauf (`idle` = weder Aufnahme noch Countdown).
   */
  const props = withDefaults(
    defineProps<{
      format: string
      bitDepth: number
      bitDepths: readonly number[]
      startDelay: number
      idle?: boolean
      hasRecording?: boolean
    }>(),
    { idle: true, hasRecording: false }
  )

  const emit = defineEmits<{
    'update:format': [value: string]
    'update:bitDepth': [value: number]
    'update:startDelay': [value: number]
  }>()

  const { t } = injectI18n()

  const formatOptions = computed<UiSegmentedOption<string>[]>(() => [
    { value: 'wav', label: 'WAV', title: t.value.rec_format_wav },
    { value: 'webm', label: 'WebM', title: t.value.rec_format_webm },
  ])

  const bitDepthOptions = computed<UiSegmentedOption<number>[]>(() =>
    props.bitDepths.map((depth) => ({
      value: depth,
      label: depth === 32 ? '32f' : String(depth),
      title: t.value[`rec_bit_${depth}`] || `${depth} Bit`,
    }))
  )

  // UiSegmentedControl meldet string | number; die Optionen oben sind je Gruppe einheitlich
  const onFormat = (value: string | number): void => emit('update:format', String(value))
  const onBitDepth = (value: string | number): void => emit('update:bitDepth', Number(value))

  function onStartDelay(event: Event): void {
    emit('update:startDelay', parseInt((event.target as HTMLSelectElement).value, 10))
  }
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
