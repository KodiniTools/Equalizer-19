import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import UiPanel from '../UiPanel.vue'

describe('UiPanel', () => {
  it('rendert Titel, Body und verknüpft die Überschrift per aria-labelledby', () => {
    const wrapper = mount(UiPanel, {
      props: { title: 'Equalizer' },
      slots: { default: '<p class="body">Inhalt</p>' },
    })

    const section = wrapper.get('section.ui-panel')
    const heading = wrapper.get('h3.ui-panel__title')
    expect(heading.text()).toBe('Equalizer')
    expect(heading.attributes('id')).toBeTruthy()
    expect(section.attributes('aria-labelledby')).toBe(heading.attributes('id'))
    expect(wrapper.get('.ui-panel__body .body').text()).toBe('Inhalt')
  })

  it('zeigt Aktionen und Footer nur, wenn die Slots belegt sind', () => {
    const plain = mount(UiPanel, { props: { title: 'A' } })
    expect(plain.find('.ui-panel__actions').exists()).toBe(false)
    expect(plain.find('.ui-panel__footer').exists()).toBe(false)

    const full = mount(UiPanel, {
      props: { title: 'B' },
      slots: { actions: '<button>x</button>', footer: '<span>f</span>' },
    })
    expect(full.get('.ui-panel__actions button').text()).toBe('x')
    expect(full.get('.ui-panel__footer').text()).toBe('f')
  })

  it('zeigt das Icon nur mit gesetztem icon-Prop', () => {
    const without = mount(UiPanel, { props: { title: 'A' } })
    expect(without.find('.ui-panel__title svg').exists()).toBe(false)

    const withIcon = mount(UiPanel, { props: { title: 'A', icon: 'sliders' } })
    expect(withIcon.find('.ui-panel__title svg').exists()).toBe(true)
  })
})
