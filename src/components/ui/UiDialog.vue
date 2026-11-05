<template>
  <Teleport to="body">
    <div v-if="open" class="ui-dialog__backdrop" @click.self="requestClose">
      <div
        ref="panel"
        class="ui-dialog"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        tabindex="-1"
        @keydown.esc.prevent="requestClose"
      >
        <header class="ui-dialog__header">
          <AppIcon v-if="icon" :name="icon" />
          <h3 :id="titleId" class="ui-dialog__title">{{ title }}</h3>
          <UiIconButton variant="ghost" :label="closeLabel" @click="requestClose">
            <AppIcon name="close" />
          </UiIconButton>
        </header>

        <div class="ui-dialog__body">
          <slot />
        </div>

        <footer v-if="$slots.footer" class="ui-dialog__footer">
          <slot name="footer" />
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
  import { nextTick, onBeforeUnmount, ref, useId, watch } from 'vue'
  import AppIcon from '../AppIcon.vue'
  import UiIconButton from './UiIconButton.vue'

  /**
   * Modaler Dialog, teleportiert nach <body>. Schließt über Escape, Klick auf den
   * Hintergrund und den Schließen-Button, jeweils per `close`-Event; der Aufrufer
   * steuert `open` und entscheidet, ob er schließt. Beim Öffnen wandert der Fokus
   * in den Dialog (sofern der Aufrufer nicht selbst ein Element fokussiert), beim
   * Schließen zurück zum vorher fokussierten Element.
   */
  const props = defineProps({
    open: { type: Boolean, required: true },
    title: { type: String, required: true },
    closeLabel: { type: String, required: true },
    icon: { type: String, default: '' },
  })

  const emit = defineEmits(['close'])

  const titleId = useId()
  const panel = ref(null)
  let previouslyFocused = null

  function requestClose() {
    emit('close')
  }

  // Escape auch dann, wenn der Fokus den Dialog verlassen hat; innerhalb des
  // Dialogs greift bereits @keydown.esc.
  function onDocumentKeydown(event) {
    if (event.key !== 'Escape') return
    if (event.target instanceof Node && panel.value?.contains(event.target)) return
    event.preventDefault()
    requestClose()
  }

  watch(
    () => props.open,
    async (open) => {
      if (open) {
        document.addEventListener('keydown', onDocumentKeydown)
        previouslyFocused =
          document.activeElement instanceof HTMLElement ? document.activeElement : null
        await nextTick()
        if (panel.value && !panel.value.contains(document.activeElement)) panel.value.focus()
      } else {
        document.removeEventListener('keydown', onDocumentKeydown)
        previouslyFocused?.focus()
        previouslyFocused = null
      }
    },
    { immediate: true }
  )

  onBeforeUnmount(() => {
    document.removeEventListener('keydown', onDocumentKeydown)
    previouslyFocused = null
  })
</script>

<style scoped>
  .ui-dialog__backdrop {
    position: fixed;
    inset: 0;
    z-index: 2000;
    background: var(--overlay-backdrop);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    animation: ui-dialog-fade 0.15s ease-out;
  }

  @keyframes ui-dialog-fade {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .ui-dialog {
    width: 100%;
    max-width: 420px;
    background: var(--card-bg);
    border: 1px solid var(--border-color);
    border-radius: 14px;
    box-shadow: 0 20px 60px var(--shadow-overlay);
    overflow: hidden;
    animation: ui-dialog-pop 0.18s ease-out;
  }

  .ui-dialog:focus {
    outline: none;
  }

  @keyframes ui-dialog-pop {
    from {
      opacity: 0;
      transform: translateY(12px) scale(0.98);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  .ui-dialog__header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 16px;
    border-bottom: 1px solid var(--border-color);
  }

  .ui-dialog__header > .icon {
    color: var(--accent-primary);
    width: 16px;
    height: 16px;
  }

  .ui-dialog__title {
    margin: 0;
    font-size: 1em;
    font-weight: 600;
    color: var(--text-primary);
    flex: 1;
  }

  .ui-dialog__body {
    padding: 18px 16px;
  }

  .ui-dialog__footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding: 14px 16px;
    border-top: 1px solid var(--border-color);
  }

  @media (max-width: 480px) {
    .ui-dialog {
      max-width: 100%;
    }
  }
</style>
