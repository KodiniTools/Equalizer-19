<template>
  <div class="app-toast">
    <Transition name="app-toast">
      <UiToast v-if="toast.current" :message="toast.current.message" :type="toast.current.type" />
    </Transition>
  </div>
</template>

<script setup lang="ts">
  import { UiToast } from './ui'
  import { useToastStore } from '../stores/toast'

  /**
   * Toast-Host der App-Seite: unten rechts fest positioniert, zeigt die aktuelle
   * Meldung des Toast-Stores (`useToastStore().notify(message, type)`).
   */
  const toast = useToastStore()
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
