<template>
  <UiDialog
    :open="show"
    :title="t.dl_title"
    icon="download"
    :close-label="t.dl_cancel"
    @close="onCancel"
  >
    <label class="dl-label" for="dl-filename">{{ t.dl_filename_label }}</label>
    <div class="dl-input-wrap">
      <input
        id="dl-filename"
        ref="nameInput"
        v-model="name"
        type="text"
        class="dl-input"
        :placeholder="t.dl_name_placeholder"
        spellcheck="false"
        autocomplete="off"
        @keydown.enter.prevent="onConfirm"
      />
      <span class="dl-ext">.{{ ext }}</span>
    </div>

    <p class="dl-hint">
      <AppIcon :name="folderSupported ? 'folder' : 'info'" />
      <span>{{ folderSupported ? t.dl_folder_hint_supported : t.dl_folder_hint_unsupported }}</span>
    </p>

    <template #footer>
      <UiButton @click="onCancel">{{ t.dl_cancel }}</UiButton>
      <UiButton variant="primary" :disabled="!trimmedName || saving" @click="onConfirm">
        <AppIcon v-if="saving" name="spinner" spin />
        <AppIcon v-else name="save" />
        {{ t.dl_save }}
      </UiButton>
    </template>
  </UiDialog>
</template>

<script setup>
  import { ref, computed, watch, inject, nextTick } from 'vue'
  import AppIcon from './AppIcon.vue'
  import { UiButton, UiDialog } from './ui'

  const props = defineProps({
    show: { type: Boolean, default: false },
    defaultName: { type: String, default: 'audio-export' },
    format: { type: String, default: 'webm' },
    folderSupported: { type: Boolean, default: false },
    saving: { type: Boolean, default: false },
  })

  const emit = defineEmits(['close', 'confirm'])

  const { t } = inject('i18n')

  const name = ref(props.defaultName)
  const nameInput = ref(null)

  const ext = computed(() => (props.format === 'wav' ? 'wav' : 'webm'))
  const trimmedName = computed(() => name.value.trim())

  watch(
    () => props.show,
    (visible) => {
      if (visible) {
        name.value = props.defaultName
        nextTick(() => {
          nameInput.value?.focus()
          nameInput.value?.select()
        })
      }
    }
  )

  function onCancel() {
    if (props.saving) return
    emit('close')
  }

  function onConfirm() {
    if (!trimmedName.value || props.saving) return
    emit('confirm', { filename: trimmedName.value })
  }
</script>

<style scoped>
  .dl-label {
    display: block;
    font-size: 13px;
    font-weight: 600;
    color: var(--text-secondary);
    margin-bottom: 8px;
  }

  .dl-input-wrap {
    display: flex;
    align-items: center;
    background: var(--secondary-bg);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 0 12px;
    transition: border-color 0.2s;
  }

  .dl-input-wrap:focus-within {
    border-color: var(--accent-primary);
  }

  .dl-input {
    flex: 1;
    min-width: 0;
    border: none;
    background: transparent;
    color: var(--text-primary);
    font-size: 14px;
    padding: 10px 0;
    outline: none;
  }

  .dl-ext {
    color: var(--text-muted);
    font-size: 14px;
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
    flex-shrink: 0;
    padding-left: 6px;
  }

  .dl-hint {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    margin: 12px 0 0;
    font-size: 12px;
    line-height: 1.4;
    color: var(--text-muted);
  }

  .dl-hint .icon {
    margin-top: 1px;
    width: 14px;
    height: 14px;
    color: var(--accent-primary);
  }
</style>
