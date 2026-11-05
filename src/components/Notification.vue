<template>
  <div class="app-toast">
    <Transition name="app-toast">
      <UiToast v-if="isVisible" :message="message" :type="type" />
    </Transition>
  </div>
</template>

<script setup>
  import { onBeforeUnmount, ref } from 'vue'
  import { UiToast } from './ui'

  /**
   * Toast-Host der App-Seite: unten rechts fest positioniert, zeigt jeweils eine
   * Meldung für drei Sekunden. `show(message, type)` wird von AppPage als `notify`
   * bereitgestellt.
   */
  const isVisible = ref(false)
  const message = ref('')
  const type = ref('info')
  let timeout = null

  const show = (msg, notifType = 'info') => {
    if (timeout) clearTimeout(timeout)

    message.value = msg
    type.value = notifType
    isVisible.value = true

    timeout = setTimeout(() => {
      isVisible.value = false
      timeout = null
    }, 3000)
  }

  onBeforeUnmount(() => {
    if (timeout) clearTimeout(timeout)
  })

  defineExpose({ show })
</script>

<style scoped>
  /* Über der Sticky-Leiste, deren Höhe StickyPlayerBar als --sticky-player-h setzt */
  .app-toast {
    position: fixed;
    bottom: calc(var(--sticky-player-h, 0px) + 18px);
    right: 18px;
    z-index: 1500;
  }

  .app-toast-enter-active,
  .app-toast-leave-active {
    transition:
      transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
      opacity 0.3s ease;
  }

  .app-toast-enter-from,
  .app-toast-leave-to {
    transform: translateX(calc(100% + 18px));
    opacity: 0;
  }

  @media (max-width: 600px) {
    .app-toast {
      left: 10px;
      right: 10px;
      bottom: calc(var(--sticky-player-h, 0px) + 12px);
    }

    .app-toast :deep(.ui-toast) {
      max-width: none;
    }
  }
</style>
