import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import UiSegmentedControl from '../UiSegmentedControl.vue'

const options = [
  { value: 'wav', label: 'WAV', title: 'WAV (verlustfrei)' },
  { value: 'webm', label: 'WebM' },
  { value: 'ogg', label: 'OGG', disabled: true },
]

function mountControl(props = {}) {
  return mount(UiSegmentedControl, {
    props: { options, modelValue: 'wav', label: 'Format', ...props },
    attachTo: document.body,
  })
}

describe('UiSegmentedControl', () => {
  it('rendert eine Radiogroup mit gewählter Option und Roving-Tabindex', () => {
    const wrapper = mountControl({ variant: 'surface', size: 'lg', block: true })
    const root = wrapper.get('[role="radiogroup"]')
    expect(root.attributes('aria-label')).toBe('Format')
    expect(root.classes()).toEqual(
      expect.arrayContaining(['ui-segmented--surface', 'ui-segmented--lg', 'ui-segmented--block'])
    )
    expect(root.attributes('style')).toContain('repeat(3, minmax(0, 1fr))')
    const radios = wrapper.findAll('[role="radio"]')
    expect(radios.map((r) => r.attributes('aria-checked'))).toEqual(['true', 'false', 'false'])
    expect(radios.map((r) => r.attributes('tabindex'))).toEqual(['0', '-1', '-1'])
    expect(radios[0].classes()).toContain('is-active')
    expect(radios[0].attributes('title')).toBe('WAV (verlustfrei)')
    expect(radios[0].attributes('aria-label')).toBe('WAV (verlustfrei)')
    expect(radios[2].attributes('disabled')).toBeDefined()
    wrapper.unmount()
  })

  it('emittiert den Wert beim Klick, nicht aber für die gewählte oder gesperrte Option', async () => {
    const wrapper = mountControl()
    const radios = wrapper.findAll('[role="radio"]')
    await radios[0].trigger('click')
    await radios[2].trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    await radios[1].trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([['webm']])
    wrapper.unmount()
  })

  it('wechselt mit Pfeiltasten, überspringt gesperrte Optionen und unterstützt Zahlen', async () => {
    const wrapper = mount(UiSegmentedControl, {
      props: {
        options: [
          { value: 16, label: '16' },
          { value: 24, label: '24', disabled: true },
          { value: 32, label: '32f' },
        ],
        modelValue: 16,
      },
      attachTo: document.body,
    })
    const radios = wrapper.findAll('[role="radio"]')
    await radios[0].trigger('keydown', { key: 'ArrowRight' })
    expect(wrapper.emitted('update:modelValue')).toEqual([[32]])
    expect(document.activeElement).toBe(radios[2].element)
    await radios[0].trigger('keydown', { key: 'End' })
    expect(wrapper.emitted('update:modelValue')).toEqual([[32], [32]])
    wrapper.unmount()
  })
})
