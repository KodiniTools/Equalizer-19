<template>
  <div class="save-form">
    <!-- Inline save form -->
    <input
      ref="presetNameInput"
      v-model="name"
      :placeholder="t.eq_preset_name_placeholder"
      :aria-label="t.a11y_eq_save_name"
      class="preset-name-input"
      maxlength="32"
      @keydown.enter="confirm"
      @keydown.escape="emit('cancel')"
    />
    <UiIconButton
      class="save-confirm-btn"
      :label="t.eq_save"
      :disabled="!name.trim()"
      @click="confirm"
    >
      <AppIcon name="check" />
    </UiIconButton>
    <UiIconButton class="cancel-btn" :label="t.eq_cancel" @click="emit('cancel')">
      <AppIcon name="close" />
    </UiIconButton>
  </div>
</template>

<script setup lang="ts">
  import { onMounted, ref } from 'vue'
  import AppIcon from '../AppIcon.vue'
  import { injectI18n } from '../../composables/useI18n'
  import { UiIconButton } from '../ui'

  /**
   * Namensfeld zum Speichern eines eigenen EQ-Presets. Wird per v-if
   * eingeblendet und fokussiert das Feld beim Einhängen.
   * Emits: save(name) mit dem getrimmten Namen, cancel.
   */
  const emit = defineEmits<{ save: [name: string]; cancel: [] }>()

  const { t } = injectI18n()

  const name = ref('')
  const presetNameInput = ref<HTMLInputElement | null>(null)

  function confirm(): void {
    const trimmed = name.value.trim()
    if (!trimmed) return
    emit('save', trimmed)
  }

  onMounted(() => presetNameInput.value?.focus())
</script>

<style scoped>
  .save-form {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 8px;
    animation: fadeIn 0.15s ease;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .preset-name-input {
    flex: 1;
    padding: 5px 10px;
    border: 1px solid var(--accent-primary);
    border-radius: 6px;
    background: var(--secondary-bg);
    color: var(--text-primary);
    font-size: 12px;
    outline: none;
  }

  .preset-name-input::placeholder {
    color: var(--text-muted);
  }

  .ui-button.save-confirm-btn:hover:not(:disabled) {
    background: var(--success);
    border-color: var(--success);
    color: #ffffff;
  }

  .ui-button.cancel-btn:hover:not(:disabled) {
    background: var(--error);
    border-color: var(--error);
    color: #ffffff;
  }
</style>
