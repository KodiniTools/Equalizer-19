import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { computed, ref } from 'vue'
import { i18nStub } from '../../../__tests__/i18nStub'
import ThemeToggle from '../ThemeToggle.vue'

function mountWith(theme: 'dark' | 'light') {
  const current = ref(theme)
  const setTheme = vi.fn((next: string) => {
    if (next === 'dark' || next === 'light') current.value = next
  })
  const wrapper = mount(ThemeToggle, {
    global: {
      provide: { ...i18nStub(), theme: { currentTheme: computed(() => current.value), setTheme } },
    },
  })
  return { wrapper, setTheme }
}

describe('ThemeToggle', () => {
  it('bietet im Dark-Theme das helle Design an und schaltet um', async () => {
    const { wrapper, setTheme } = mountWith('dark')
    expect(wrapper.text()).toBe('theme_light')
    await wrapper.find('button').trigger('click')
    expect(setTheme).toHaveBeenCalledWith('light')
    expect(wrapper.text()).toBe('theme_dark')
  })

  it('ist ein echter Button mit der Button-Optik der Seitenlinks', () => {
    const { wrapper } = mountWith('light')
    const button = wrapper.find('button')
    expect(button.attributes('type')).toBe('button')
    expect(button.classes()).toEqual(expect.arrayContaining(['page-link', 'theme-toggle']))
  })
})
