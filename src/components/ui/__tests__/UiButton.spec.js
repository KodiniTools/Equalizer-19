import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import UiButton from '../UiButton.vue'

describe('UiButton', () => {
  it('rendert einen type=button mit Standardvariante und reicht Attribute durch', async () => {
    let clicks = 0
    const wrapper = mount(UiButton, {
      attrs: { title: 'Speichern', disabled: true, onClick: () => clicks++ },
      slots: { default: 'Speichern' },
    })
    const button = wrapper.get('button')
    expect(button.attributes('type')).toBe('button')
    expect(button.attributes('title')).toBe('Speichern')
    expect(button.attributes('disabled')).toBeDefined()
    expect(button.classes()).toContain('ui-button--secondary')
    expect(button.classes()).toContain('ui-button--md')
    expect(button.attributes('aria-pressed')).toBeUndefined()
    await button.trigger('click')
    expect(clicks).toBe(0)
  })

  it('setzt Variante, Größe und den Zustand „an“', () => {
    const wrapper = mount(UiButton, {
      props: { variant: 'ghost', size: 'sm', pressed: true, round: true },
    })
    const button = wrapper.get('button')
    expect(button.classes()).toEqual(
      expect.arrayContaining(['ui-button--ghost', 'ui-button--sm', 'ui-button--round', 'is-on'])
    )
    expect(button.attributes('aria-pressed')).toBe('true')
  })

  it('pressed=false setzt aria-pressed ohne is-on', () => {
    const button = mount(UiButton, { props: { pressed: false } }).get('button')
    expect(button.attributes('aria-pressed')).toBe('false')
    expect(button.classes()).not.toContain('is-on')
  })

  it('rendert mit href als Link', () => {
    const wrapper = mount(UiButton, { props: { href: '#features' } })
    const a = wrapper.get('a')
    expect(a.attributes('href')).toBe('#features')
    expect(a.attributes('type')).toBeUndefined()
  })

  it('rendert mit to als RouterLink', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: { template: '<div />' } },
        { path: '/app', component: { template: '<div />' } },
      ],
    })
    await router.push('/')
    const wrapper = mount(UiButton, { props: { to: '/app' }, global: { plugins: [router] } })
    expect(wrapper.get('a').attributes('href')).toBe('/app')
  })
})
