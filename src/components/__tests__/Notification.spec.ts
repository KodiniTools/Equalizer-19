import { beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import Notification from '../Notification.vue'
import { useToastStore } from '../../stores/toast'

describe('Notification', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('zeigt die aktuelle Meldung des Toast-Stores als UiToast', async () => {
    const wrapper = mount(Notification, { global: { stubs: { Transition: false } } })
    expect(wrapper.find('.ui-toast').exists()).toBe(false)
    useToastStore().notify('Equalizer deaktiviert', 'info', 0)
    await nextTick()
    const toast = wrapper.get('.ui-toast')
    expect(toast.text()).toBe('Equalizer deaktiviert')
    expect(toast.classes()).toContain('ui-toast--info')
  })
})
