import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import BasePanel from '../BasePanel.vue'

describe('BasePanel', () => {
  it('rendert Titel, Body und verknüpft die Überschrift per aria-labelledby', () => {
    const wrapper = mount(BasePanel, {
      props: { title: 'Equalizer' },
      slots: { default: '<p class="body">Inhalt</p>' },
    })

    const section = wrapper.get('section.panel')
    const heading = wrapper.get('h3.panel-title')
    expect(heading.text()).toBe('Equalizer')
    expect(heading.attributes('id')).toBeTruthy()
    expect(section.attributes('aria-labelledby')).toBe(heading.attributes('id'))
    expect(wrapper.get('.panel-body .body').text()).toBe('Inhalt')
  })

  it('zeigt Aktionen und Footer nur, wenn die Slots belegt sind', () => {
    const plain = mount(BasePanel, { props: { title: 'A' } })
    expect(plain.find('.panel-actions').exists()).toBe(false)
    expect(plain.find('.panel-footer').exists()).toBe(false)

    const full = mount(BasePanel, {
      props: { title: 'B' },
      slots: { actions: '<button>x</button>', footer: '<span>f</span>' },
    })
    expect(full.get('.panel-actions button').text()).toBe('x')
    expect(full.get('.panel-footer').text()).toBe('f')
  })

  it('zeigt das Icon nur mit gesetztem icon-Prop', () => {
    const without = mount(BasePanel, { props: { title: 'A' } })
    expect(without.find('.panel-title svg').exists()).toBe(false)

    const withIcon = mount(BasePanel, { props: { title: 'A', icon: 'sliders' } })
    expect(withIcon.find('.panel-title svg').exists()).toBe(true)
  })
})
