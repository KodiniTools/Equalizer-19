import { defineStore } from 'pinia'
import { ref } from 'vue'

export const TOAST_TYPES = ['info', 'success', 'warning', 'error']
const DEFAULT_DURATION = 3000

/**
 * Benachrichtigungen: jeweils eine Meldung, die nach `duration` ms wieder
 * verschwindet. `notify(message, type)` ist die API für alle Komponenten;
 * components/Notification.vue zeigt `current` an.
 */
export const useToastStore = defineStore('toast', () => {
  /** @type {import('vue').Ref<null | { id: number, message: string, type: string }>} */
  const current = ref(null)
  let nextId = 0
  let timer = null

  function dismiss() {
    if (timer) clearTimeout(timer)
    timer = null
    current.value = null
  }

  function notify(message, type = 'info', duration = DEFAULT_DURATION) {
    if (timer) clearTimeout(timer)
    const id = ++nextId
    current.value = { id, message, type: TOAST_TYPES.includes(type) ? type : 'info' }
    timer = duration > 0 ? setTimeout(dismiss, duration) : null
    return id
  }

  return { current, notify, dismiss }
})
