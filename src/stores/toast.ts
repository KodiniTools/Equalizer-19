import { defineStore } from 'pinia'
import { ref } from 'vue'

export type ToastType = 'info' | 'success' | 'warning' | 'error'

export const TOAST_TYPES: readonly ToastType[] = ['info', 'success', 'warning', 'error']
const DEFAULT_DURATION = 3000

const isToastType = (value: string): value is ToastType =>
  (TOAST_TYPES as readonly string[]).includes(value)

export interface Toast {
  id: number
  message: string
  type: ToastType
}

/**
 * Benachrichtigungen: jeweils eine Meldung, die nach `duration` ms wieder
 * verschwindet. `notify(message, type)` ist die API für alle Komponenten;
 * components/Notification.vue zeigt `current` an.
 */
export const useToastStore = defineStore('toast', () => {
  const current = ref<Toast | null>(null)
  let nextId = 0
  let timer: ReturnType<typeof setTimeout> | null = null

  function dismiss(): void {
    if (timer) clearTimeout(timer)
    timer = null
    current.value = null
  }

  /** Unknown `type` values fall back to 'info'. Returns the toast's id. */
  function notify(message: string, type: string = 'info', duration = DEFAULT_DURATION): number {
    if (timer) clearTimeout(timer)
    const id = ++nextId
    current.value = { id, message, type: isToastType(type) ? type : 'info' }
    timer = duration > 0 ? setTimeout(dismiss, duration) : null
    return id
  }

  return { current, notify, dismiss }
})
