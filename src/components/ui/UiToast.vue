<template>
  <div class="ui-toast" :class="`ui-toast--${type}`" :role="type === 'error' ? 'alert' : 'status'">
    {{ message }}
  </div>
</template>

<script setup>
  /**
   * Eine Benachrichtigung: Kartenfläche mit Statusfarbe als linker Linie.
   * Fehler sind role=alert, alles andere role=status. Position und Ein-/Ausblenden
   * übernimmt der Aufrufer (components/Notification.vue).
   */
  defineProps({
    message: { type: String, required: true },
    type: {
      type: String,
      default: 'info',
      validator: (v) => ['info', 'success', 'warning', 'error'].includes(v),
    },
  })
</script>

<style scoped>
  .ui-toast {
    max-width: 280px;
    padding: 14px 18px;
    border: 1px solid var(--border-color);
    border-left: 3px solid var(--accent-primary);
    border-radius: 10px;
    background: var(--card-bg);
    color: var(--text-primary);
    font-size: 12px;
    box-shadow: 0 6px 20px var(--shadow-medium);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
  }

  .ui-toast--success {
    border-left-color: var(--success);
  }

  .ui-toast--warning {
    border-left-color: var(--warning);
  }

  .ui-toast--error {
    border-left-color: var(--error);
  }
</style>
