<template>
  <UiButton
    size="sm"
    block
    class="offline-export-btn"
    :disabled="!track"
    :title="t.export_open_title"
    @click="open"
  >
    <AppIcon name="download" />
    {{ t.export_open }}
  </UiButton>

  <DownloadDialog
    :show="showDialog"
    :title="t.export_title"
    :default-name="defaultName"
    format="wav"
    :folder-supported="supportsFolderPicker"
    :saving="isExporting"
    @close="close"
    @confirm="onConfirm"
  >
    <template #intro>
      <p class="export-intro">{{ t.export_intro }}</p>
      <p v-if="track" class="export-track">
        <AppIcon name="music" />
        <span>{{ track.name }}</span>
      </p>
    </template>

    <template #options>
      <div class="export-option">
        <span class="export-option__label">{{ t.rec_bit_depth }}</span>
        <UiSegmentedControl
          :model-value="bitDepth"
          :options="bitDepthOptions"
          :label="t.rec_bit_depth"
          size="sm"
          @update:model-value="onBitDepth"
        />
      </div>

      <p v-if="isExporting" class="export-status" role="status">
        <AppIcon name="spinner" spin />
        {{ t.export_running }}
      </p>
      <p v-else-if="errorText" class="export-error" role="alert">
        <AppIcon name="alert" />
        {{ errorText }}
      </p>
    </template>
  </DownloadDialog>
</template>

<script setup lang="ts">
  import { computed, ref } from 'vue'
  import AppIcon from './AppIcon.vue'
  import DownloadDialog from './recorder/DownloadDialog.vue'
  import { UiButton, UiSegmentedControl, type UiSegmentedOption } from './ui'
  import { useOfflineExport, type OfflineExportResult } from '../composables/useOfflineExport'
  import { injectI18n } from '../composables/useI18n'
  import { useAudioEngineStore } from '../stores/audioEngine'
  import { usePlaylistStore } from '../stores/playlist'
  import { useToastStore } from '../stores/toast'
  import { MAX_EXPORT_SECONDS } from '../utils/offlineRender'
  import { savePicker } from '../utils/saveFile'

  /**
   * Offline-Export des gewählten Playlist-Titels: Button in der Playlist-Karte
   * und Dialog (Dateiname, Bit-Tiefe). Rechnet die aktuellen Einstellungen von
   * Equalizer, Kompressor und Master-Lautstärke schneller als in Echtzeit in
   * eine WAV-Datei; Wiedergabe und Live-Aufnahme bleiben unberührt.
   */
  const { t } = injectI18n()
  const audioEngine = useAudioEngineStore()
  const playlist = usePlaylistStore()
  const { notify } = useToastStore()
  const { isExporting, bitDepth, bitDepths, setBitDepth, exportTrack } =
    useOfflineExport(audioEngine)

  const supportsFolderPicker = savePicker() !== undefined
  const track = computed(() => playlist.currentTrack)
  const showDialog = ref(false)
  const errorText = ref('')

  /** "Titel.mp3" → "Titel-bearbeitet" */
  const defaultName = computed(() => {
    const base = (track.value?.name ?? '').replace(/\.[A-Za-z0-9]{1,5}$/, '').trim()
    return `${base || 'audio-export'}-${t.value.export_suffix}`
  })

  const bitDepthOptions = computed<UiSegmentedOption<number>[]>(() =>
    bitDepths.map((depth) => ({
      value: depth,
      label: depth === 32 ? '32f' : String(depth),
      title: t.value[`rec_bit_${depth}`] || `${depth} Bit`,
      disabled: isExporting.value,
    }))
  )
  const onBitDepth = (value: string | number): void => setBitDepth(Number(value))

  function open(): void {
    if (!track.value) return
    errorText.value = ''
    showDialog.value = true
  }

  function close(): void {
    if (isExporting.value) return
    showDialog.value = false
  }

  function errorMessage(result: Extract<OfflineExportResult, { ok: false }>): string {
    switch (result.error) {
      case 'too-long':
        return t.value.export_error_too_long.replace('{n}', String(MAX_EXPORT_SECONDS / 60))
      case 'decode':
        return t.value.export_error_decode
      case 'render':
        return t.value.export_error_render
      default:
        return t.value.export_error_save
    }
  }

  async function onConfirm({ filename }: { filename: string }): Promise<void> {
    if (!track.value) return
    errorText.value = ''
    const result = await exportTrack(track.value, filename)
    if (result.ok) {
      showDialog.value = false
      notify(t.value.dl_success, 'success')
    } else if (result.aborted) {
      // Native save dialog dismissed: nothing was rendered
      showDialog.value = false
    } else {
      errorText.value = errorMessage(result)
    }
  }
</script>

<style scoped>
  .export-intro {
    margin: 0 0 12px;
    font-size: 13px;
    line-height: 1.5;
    color: var(--text-secondary);
  }

  .export-track {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 0 16px;
    padding: 8px 12px;
    background: var(--secondary-bg);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    font-size: 13px;
    color: var(--text-primary);
    min-width: 0;
  }

  .export-track .icon {
    flex-shrink: 0;
    color: var(--accent-primary);
  }

  .export-track span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .export-option {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-top: 16px;
  }

  .export-option__label {
    font-size: 13px;
    color: var(--text-secondary);
  }

  .export-status,
  .export-error {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 16px 0 0;
    font-size: 13px;
  }

  .export-status {
    color: var(--accent-secondary);
  }

  .export-error {
    color: var(--error);
  }
</style>
