import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import UiToast from '../UiToast.vue'

describe('UiToast', () => {
  it('rendert die Meldung als Status mit Typ-Klasse', () => {
    const wrapper = mount(UiToast, { props: { message: 'Preset gespeichert', type: 'success' } })
    expect(wrapper.text()).toBe('Preset gespeichert')
    expect(wrapper.attributes('role')).toBe('status')
    expect(wrapper.classes()).toContain('ui-toast--success')
  })

  it('meldet Fehler als Alert', () => {
    const wrapper = mount(UiToast, { props: { message: 'Fehler', type: 'error' } })
    expect(wrapper.attributes('role')).toBe('alert')
    expect(wrapper.classes()).toContain('ui-toast--error')
  })
})
