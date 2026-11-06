import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import UiSwitch from '../UiSwitch.vue'

describe('UiSwitch', () => {
  it('rendert role=switch mit sichtbarem Label und Zustand', () => {
    const wrapper = mount(UiSwitch, { props: { modelValue: true, label: 'Mithören' } })
    const input = wrapper.get('input')
    expect(input.attributes('role')).toBe('switch')
    expect(input.attributes('aria-checked')).toBe('true')
    expect(input.element.checked).toBe(true)
    expect(wrapper.get('label').attributes('for')).toBe(input.attributes('id'))
    expect(wrapper.get('.ui-switch__label').text()).toBe('Mithören')
    expect(wrapper.get('.ui-switch__label').classes()).not.toContain('sr-only')
  })

  it('emittiert den neuen Wert und reicht title auf das Label durch', async () => {
    const wrapper = mount(UiSwitch, {
      props: { modelValue: false, label: 'Mithören' },
      attrs: { title: 'Nur mit Tab-Audio' },
    })
    expect(wrapper.get('label').attributes('title')).toBe('Nur mit Tab-Audio')
    await wrapper.get('input').setValue(true)
    expect(wrapper.emitted('update:modelValue')).toEqual([[true]])
  })

  it('disabled sperrt den Input und markiert das Label', () => {
    const wrapper = mount(UiSwitch, {
      props: { modelValue: false, label: 'Mithören', disabled: true, labelHidden: true },
    })
    expect(wrapper.get('input').attributes('disabled')).toBeDefined()
    expect(wrapper.get('label').classes()).toContain('ui-switch--disabled')
    expect(wrapper.get('.ui-switch__label').classes()).toContain('sr-only')
  })
})
