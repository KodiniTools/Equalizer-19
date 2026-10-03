<template>
  <Teleport to="body">
    <div v-if="show" class="dl-overlay" @click.self="onCancel">
      <div class="dl-dialog" role="dialog" aria-modal="true" :aria-label="t.dl_title">
        <div class="dl-header">
          <AppIcon name="download" />
          <h3>{{ t.dl_title }}</h3>
          <button
            class="btn btn-icon btn-ghost btn-sm"
            @click="onCancel"
            :title="t.dl_cancel"
            :aria-label="t.dl_cancel"
          >
            <AppIcon name="close" />
          </button>
        </div>

        <div class="dl-body">
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
              @keydown.esc.prevent="onCancel"
            />
            <span class="dl-ext">.{{ ext }}</span>
          </div>

          <p class="dl-hint">
            <AppIcon :name="folderSupported ? 'folder' : 'info'" />
            <span>{{
              folderSupported ? t.dl_folder_hint_supported : t.dl_folder_hint_unsupported
            }}</span>
          </p>
        </div>

        <div class="dl-footer">
          <button class="btn" @click="onCancel">{{ t.dl_cancel }}</button>
          <button class="btn btn-primary" :disabled="!trimmedName || saving" @click="onConfirm">
            <AppIcon v-if="saving" name="spinner" spin />
            <AppIcon v-else name="save" />
            {{ t.dl_save }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
  import { ref, computed, watch, inject, nextTick } from 'vue'
  import AppIcon from './AppIcon.vue'

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
  .dl-overlay {
    position: fixed;
    inset: 0;
    z-index: 2000;
    background: rgba(0, 0, 0, 0.55);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    animation: dl-fade 0.15s ease-out;
  }

  @keyframes dl-fade {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .dl-dialog {
    width: 100%;
    max-width: 420px;
    background: var(--card-bg, #252530);
    border: 1px solid var(--border-color, #3a3a48);
    border-radius: 14px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.45);
    overflow: hidden;
    animation: dl-pop 0.18s ease-out;
  }

  @keyframes dl-pop {
    from {
      opacity: 0;
      transform: translateY(12px) scale(0.98);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  .dl-header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 16px;
    border-bottom: 1px solid var(--border-color, #3a3a48);
  }

  .dl-header .icon {
    color: var(--accent-primary, #00d9ff);
    width: 16px;
    height: 16px;
  }

  .dl-header h3 {
    margin: 0;
    font-size: 1em;
    font-weight: 600;
    color: var(--text-primary, #fff);
    flex: 1;
  }

  .dl-body {
    padding: 18px 16px;
  }

  .dl-label {
    display: block;
    font-size: 13px;
    font-weight: 600;
    color: var(--text-secondary, #c8c8d5);
    margin-bottom: 8px;
  }

  .dl-input-wrap {
    display: flex;
    align-items: center;
    background: var(--secondary-bg, #1a1a22);
    border: 1px solid var(--border-color, #3a3a48);
    border-radius: 8px;
    padding: 0 12px;
    transition: border-color 0.2s;
  }

  .dl-input-wrap:focus-within {
    border-color: var(--accent-primary, #00d9ff);
  }

  .dl-input {
    flex: 1;
    min-width: 0;
    border: none;
    background: transparent;
    color: var(--text-primary, #fff);
    font-size: 14px;
    padding: 10px 0;
    outline: none;
  }

  .dl-ext {
    color: var(--text-muted, #8b8b9a);
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
    color: var(--text-muted, #8b8b9a);
  }

  .dl-hint .icon {
    margin-top: 1px;
    width: 14px;
    height: 14px;
    color: var(--accent-primary, #00d9ff);
  }

  .dl-footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding: 14px 16px;
    border-top: 1px solid var(--border-color, #3a3a48);
  }

  @media (max-width: 480px) {
    .dl-dialog {
      max-width: 100%;
    }
  }
</style>
