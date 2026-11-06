import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import UiIconButton from '../UiIconButton.vue'

describe('UiIconButton', () => {
  it('macht label zu aria-label und title', () => {
    const button = mount(UiIconButton, { props: { label: 'Zurücksetzen' } }).get('button')
    expect(button.attributes('aria-label')).toBe('Zurücksetzen')
    expect(button.attributes('title')).toBe('Zurücksetzen')
    expect(button.classes()).toContain('ui-icon-button--sm')
    expect(button.classes()).toContain('ui-button--sm')
  })

  it('ein eigenes title-Attribut überschreibt nur den Tooltip', () => {
    const button = mount(UiIconButton, {
      props: { label: 'Kompressor', pressed: true },
      attrs: { title: 'Kompressor ausschalten' },
    }).get('button')
    expect(button.attributes('aria-label')).toBe('Kompressor')
    expect(button.attributes('title')).toBe('Kompressor ausschalten')
    expect(button.attributes('aria-pressed')).toBe('true')
  })
})
