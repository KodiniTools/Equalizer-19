import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import SliderField from '../SliderField.vue'

describe('SliderField', () => {
  it('verknüpft Label und Regler, zeigt den Wert und setzt aria-valuetext', () => {
    const wrapper = mount(SliderField, {
      props: { modelValue: -30, label: 'Schwelle', valueText: '-30 dB', min: -60, max: 0 },
    })
    const input = wrapper.get('input[type="range"]')
    const label = wrapper.get('label')
    expect(label.text()).toBe('Schwelle')
    expect(label.attributes('for')).toBe(input.attributes('id'))
    expect(input.attributes('aria-label')).toBe('Schwelle')
    expect(input.attributes('aria-valuetext')).toBe('-30 dB')
    expect(input.attributes('min')).toBe('-60')
    expect(input.element.value).toBe('-30')
    expect(wrapper.get('.slider-field__value').text()).toBe('-30 dB')
  })

  it('emittiert Zahlen bei input und change', async () => {
    const wrapper = mount(SliderField, { props: { modelValue: 4, label: 'Ratio', max: 20 } })
    const input = wrapper.get('input')
    input.element.value = '6.5'
    await input.trigger('input')
    await input.trigger('change')
    expect(wrapper.emitted('update:modelValue')).toEqual([[6.5]])
    expect(wrapper.emitted('input')).toEqual([[6.5]])
    expect(wrapper.emitted('change')).toEqual([[6.5]])
  })

  it('übernimmt id, disabled und eigene aria-Texte', () => {
    const input = mount(SliderField, {
      props: {
        modelValue: 0.003,
        label: 'Attack',
        valueText: '3 ms',
        id: 'dyn-attack',
        disabled: true,
        ariaLabel: 'Attack 3 ms',
        ariaValueText: '3 Millisekunden',
      },
    }).get('input')
    expect(input.attributes('id')).toBe('dyn-attack')
    expect(input.attributes('disabled')).toBeDefined()
    expect(input.attributes('aria-label')).toBe('Attack 3 ms')
    expect(input.attributes('aria-valuetext')).toBe('3 Millisekunden')
  })
})
