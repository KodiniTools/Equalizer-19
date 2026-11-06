/**
 * Load an AudioWorklet module once per AudioContext, with a timeout.
 *
 * Resolves false when the module fails to load or takes longer than timeoutMs,
 * so callers can fall back (e.g. to ScriptProcessor) instead of hanging.
 * A load that is still pending after a timeout is not waited for again
 * (resolves false right away), but once it completes the module counts as
 * loaded and later calls resolve true.
 *
 * State is kept per context and per module URL.
 */

interface WorkletLoadState {
  loaded: boolean
  loading: Promise<boolean> | null
  timedOut: boolean
}

/** The part of BaseAudioContext used here, plus the per-context load registry. */
export interface WorkletHost {
  audioWorklet?: { addModule(url: string | URL): Promise<void> }
  __eq19Worklets?: Record<string, WorkletLoadState>
}

export async function loadWorkletModule(
  audioContext: WorkletHost,
  url: string | URL,
  timeoutMs: number
): Promise<boolean> {
  if (!audioContext.audioWorklet) return false

  const key = String(url)
  if (!audioContext.__eq19Worklets) audioContext.__eq19Worklets = {}
  const state = (audioContext.__eq19Worklets[key] ||= {
    loaded: false,
    loading: null,
    timedOut: false,
  })

  if (state.loaded) return true
  if (state.loading && state.timedOut) return false

  if (!state.loading) {
    state.timedOut = false
    state.loading = audioContext.audioWorklet
      .addModule(url)
      .then(
        () => {
          state.loaded = true
          return true
        },
        (error: unknown) => {
          console.warn('AudioWorklet unavailable, falling back to ScriptProcessor:', error)
          return false
        }
      )
      .finally(() => {
        state.loading = null
        state.timedOut = false
      })
  }

  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<null>((resolve) => {
    timer = setTimeout(() => resolve(null), timeoutMs)
  })
  const loaded = await Promise.race([state.loading, timeout])
  clearTimeout(timer)

  if (loaded === null) {
    state.timedOut = true
    console.warn('AudioWorklet load timed out, falling back to ScriptProcessor')
    return false
  }
  return loaded
}
