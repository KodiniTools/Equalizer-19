import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useToastStore } from '../toast'

describe('toast store', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('zeigt eine Meldung und blendet sie nach der Dauer aus', () => {
    const toast = useToastStore()
    expect(toast.current).toBeNull()
    toast.notify('Preset gespeichert', 'success')
    expect(toast.current).toMatchObject({ message: 'Preset gespeichert', type: 'success' })
    vi.advanceTimersByTime(2999)
    expect(toast.current).not.toBeNull()
    vi.advanceTimersByTime(1)
    expect(toast.current).toBeNull()
  })

  it('ersetzt die laufende Meldung und startet die Dauer neu', () => {
    const toast = useToastStore()
    const first = toast.notify('Eins')
    vi.advanceTimersByTime(2000)
    const second = toast.notify('Zwei', 'warning')
    expect(second).not.toBe(first)
    vi.advanceTimersByTime(2000)
    expect(toast.current).toMatchObject({ id: second, message: 'Zwei', type: 'warning' })
    vi.advanceTimersByTime(1000)
    expect(toast.current).toBeNull()
  })

  it('fällt bei unbekanntem Typ auf info zurück und lässt sich schließen', () => {
    const toast = useToastStore()
    toast.notify('Hallo', 'fatal')
    expect(toast.current?.type).toBe('info')
    toast.dismiss()
    expect(toast.current).toBeNull()
  })
})
