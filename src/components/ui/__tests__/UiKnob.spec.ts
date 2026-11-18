import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import UiKnob from '../UiKnob.vue'

describe('UiKnob', () => {
  it('ist ein Slider mit Label, Wertanzeige und aria-valuetext', () => {
    const wrapper = mount(UiKnob, {
      props: { modelValue: 20, label: 'Knee', valueText: '20 dB', min: 0, max: 40 },
    })
    const dial = wrapper.get('[role="slider"]')
    expect(wrapper.get('label').attributes('for')).toBe(dial.attributes('id'))
    expect(dial.attributes('aria-label')).toBe('Knee')
    expect(dial.attributes('aria-valuenow')).toBe('20')
    expect(dial.attributes('aria-valuemax')).toBe('40')
    expect(dial.attributes('aria-valuetext')).toBe('20 dB')
    expect(wrapper.get('.ui-knob__readout').text()).toBe('20 dB')
  })

  it('Tastatur: Schritt, großer Schritt, Pos1/Ende, begrenzt und gerundet', async () => {
    const wrapper = mount(UiKnob, {
      props: { modelValue: 0.25, label: 'Release', min: 0, max: 1, step: 0.01 },
    })
    const dial = wrapper.get('[role="slider"]')
    await dial.trigger('keydown', { key: 'ArrowUp' })
    await dial.trigger('keydown', { key: 'PageUp' })
    await dial.trigger('keydown', { key: 'ArrowDown', shiftKey: true })
    await dial.trigger('keydown', { key: 'End' })
    await dial.trigger('keydown', { key: 'Home' })
    await dial.trigger('keydown', { key: 'ArrowDown' })
    // Props stay at 0.25 (no v-model here), so every step starts from there
    expect(wrapper.emitted('update:modelValue')).toEqual([[0.26], [0.35], [0.15], [1], [0], [0.24]])
    expect(wrapper.emitted('change')).toHaveLength(6)
  })

  it('Ziehen nach oben erhöht den Wert um den Bereich je dragRange Pixel', async () => {
    const wrapper = mount(UiKnob, {
      props: { modelValue: 10, label: 'Knee', min: 0, max: 40, step: 1, dragRange: 100 },
    })
    const dial = wrapper.get('[role="slider"]')
    const el = dial.element as HTMLElement & {
      setPointerCapture: (id: number) => void
      hasPointerCapture: (id: number) => boolean
    }
    el.setPointerCapture = () => {}
    el.hasPointerCapture = () => false
    // jsdom has no PointerEvent; MouseEvent carries button/clientY and the handlers need no more
    const pointer = (type: string, init: MouseEventInit) =>
      el.dispatchEvent(new MouseEvent(type, { bubbles: true, ...init }))
    pointer('pointerdown', { button: 0, clientY: 200 })
    pointer('pointermove', { clientY: 150 })
    pointer('pointerup', {})
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('update:modelValue')).toEqual([[30]])
    expect(wrapper.emitted('change')).toEqual([[10]])
  })

  it('Doppelklick setzt defaultValue, deaktiviert reagiert nicht', async () => {
    const wrapper = mount(UiKnob, {
      props: { modelValue: 7, label: 'Knee', min: 0, max: 40, defaultValue: 30 },
    })
    await wrapper.get('[role="slider"]').trigger('dblclick')
    expect(wrapper.emitted('update:modelValue')).toEqual([[30]])

    const off = mount(UiKnob, { props: { modelValue: 7, label: 'Knee', disabled: true } })
    const dial = off.get('[role="slider"]')
    expect(dial.attributes('tabindex')).toBe('-1')
    await dial.trigger('keydown', { key: 'ArrowUp' })
    expect(off.emitted('update:modelValue')).toBeUndefined()
  })
})
