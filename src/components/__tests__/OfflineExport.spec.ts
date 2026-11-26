import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { ref } from 'vue'
import { i18nStub } from '../../__tests__/i18nStub'
import OfflineExport from '../OfflineExport.vue'
import { usePlaylistStore, createTrack } from '../../stores/playlist'

const exportTrack = vi.fn()

vi.mock('../../composables/useOfflineExport', () => ({
  useOfflineExport: () => ({
    isExporting: ref(false),
    bitDepth: ref(16),
    bitDepths: [16, 24, 32],
    setBitDepth: vi.fn(),
    exportTrack: (...args: unknown[]) => exportTrack(...args),
  }),
}))

const global = { provide: i18nStub(), stubs: { Teleport: true } }

function addTrack(name: string): void {
  vi.stubGlobal('URL', { createObjectURL: () => 'blob:x', revokeObjectURL: () => {} })
  const file = new File(['x'], name, { type: 'audio/mpeg' })
  usePlaylistStore().addTrack(createTrack(1, name, file, file, file.type))
}

describe('OfflineExport', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    exportTrack.mockReset()
  })

  it('ist ohne gewählten Titel gesperrt', () => {
    const wrapper = mount(OfflineExport, { global })
    expect(wrapper.find('button.offline-export-btn').attributes('disabled')).toBeDefined()
  })

  it('öffnet den Dialog mit Titelname und Dateinamen ohne Endung, exportiert und schließt', async () => {
    addTrack('Mein Lied.mp3')
    exportTrack.mockResolvedValue({ ok: true })
    const wrapper = mount(OfflineExport, { global })

    await wrapper.find('button.offline-export-btn').trigger('click')
    expect(wrapper.find('.export-track').text()).toBe('Mein Lied.mp3')
    const input = wrapper.find<HTMLInputElement>('#dl-filename')
    expect(input.element.value).toBe('Mein Lied-export_suffix')

    await input.setValue('ergebnis')
    const save = wrapper.findAll('button').find((b) => b.text() === 'dl_save')!
    await save.trigger('click')
    await Promise.resolve()

    expect(exportTrack).toHaveBeenCalledTimes(1)
    expect(exportTrack.mock.calls[0][0].name).toBe('Mein Lied.mp3')
    expect(exportTrack.mock.calls[0][1]).toBe('ergebnis')
    expect(wrapper.find('#dl-filename').exists()).toBe(false)
  })

  it('zeigt den Fehler im Dialog und lässt ihn offen', async () => {
    addTrack('a.mp3')
    exportTrack.mockResolvedValue({ ok: false, error: 'decode' })
    const wrapper = mount(OfflineExport, { global })
    await wrapper.find('button.offline-export-btn').trigger('click')
    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'dl_save')!
      .trigger('click')
    await Promise.resolve()
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.export-error').text()).toBe('export_error_decode')
    expect(wrapper.find('#dl-filename').exists()).toBe(true)
  })
})
