import { ref, computed, getCurrentInstance, onBeforeUnmount } from 'vue'

/** Selectable recording start delays in seconds (0 = start immediately). */
export const START_DELAYS = [0, 3, 5, 10]

/**
 * Whole-second countdown that runs a callback when it reaches zero.
 * A delay of 0 runs the callback immediately. Cancelled automatically when the
 * owning component unmounts.
 */
export function useCountdown() {
  const remaining = ref(0)
  const total = ref(0)
  const isCounting = computed(() => remaining.value > 0)
  let timer = null

  function clear() {
    if (timer !== null) {
      clearInterval(timer)
      timer = null
    }
  }

  /**
   * @param {number} seconds  delay; <= 0 runs onDone right away
   * @param {() => void} onDone
   */
  function start(seconds, onDone) {
    cancel()
    const delay = Math.max(0, Math.floor(Number(seconds) || 0))
    if (delay === 0) {
      onDone()
      return
    }
    total.value = delay
    remaining.value = delay
    timer = setInterval(() => {
      remaining.value -= 1
      if (remaining.value <= 0) {
        clear()
        remaining.value = 0
        onDone()
      }
    }, 1000)
  }

  function cancel() {
    clear()
    remaining.value = 0
  }

  if (getCurrentInstance()) onBeforeUnmount(cancel)

  return { remaining, total, isCounting, start, cancel }
}
