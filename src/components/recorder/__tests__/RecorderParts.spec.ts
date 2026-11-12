import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { i18nStub } from '../../../__tests__/i18nStub'
import RecorderTime from '../RecorderTime.vue'
import RecorderSettings from '../RecorderSettings.vue'
import RecorderButtons from '../RecorderButtons.vue'

const global = { provide: i18nStub() }

describe('Recorder-Teile', () => {
  it('RecorderTime zeigt den Pause-Zustand an', async () => {
    const wrapper = mount(RecorderTime, { props: { seconds: 61 }, global })
    expect(wrapper.classes()).not.toContain('paused')
    expect(wrapper.find('.paused-label').exists()).toBe(false)

    await wrapper.setProps({ paused: true })
    expect(wrapper.classes()).toContain('paused')
    expect(wrapper.find('.paused-label').text()).toBe('rec_paused')
    expect(wrapper.find('.time').text()).toBe('01:01')
  })

  it('RecorderButtons: Pause-Button nur während der Aufnahme, wechselt zu Fortsetzen', async () => {
    const wrapper = mount(RecorderButtons, { global })
    expect(wrapper.find('.rec-btn.pause').exists()).toBe(false)

    await wrapper.setProps({ isRecording: true })
    const pause = wrapper.find('.rec-btn.pause')
    expect(pause.attributes('aria-label')).toBe('rec_pause')
    expect(pause.classes()).not.toContain('paused')
    await pause.trigger('click')
    expect(wrapper.emitted('pause')).toHaveLength(1)
    expect(wrapper.emitted('resume')).toBeUndefined()

    await wrapper.setProps({ isPaused: true })
    expect(pause.attributes('aria-label')).toBe('rec_resume')
    expect(pause.classes()).toContain('paused')
    await pause.trigger('click')
    expect(wrapper.emitted('resume')).toHaveLength(1)
    expect(wrapper.emitted('pause')).toHaveLength(1)
    // Stop bleibt auch in der Pause erreichbar
    expect(wrapper.find('.rec-btn.stop').exists()).toBe(true)

    await wrapper.setProps({ isRecording: false, isPaused: false })
    expect(wrapper.find('.rec-btn.pause').exists()).toBe(false)
  })

  it('RecorderTime formatiert Sekunden als mm:ss', () => {
    expect(
      mount(RecorderTime, { props: { seconds: 5 }, global })
        .find('.time')
        .text()
    ).toBe('00:05')
    expect(
      mount(RecorderTime, { props: { seconds: 754 }, global })
        .find('.time')
        .text()
    ).toBe('12:34')
  })

  it('RecorderSettings zeigt Format, Bit-Tiefe und Verzögerung nur im Leerlauf', async () => {
    const props = { format: 'wav', bitDepth: 24, bitDepths: [16, 24, 32], startDelay: 0 }
    const wrapper = mount(RecorderSettings, { props, global })
    const groups = () => wrapper.findAll('[role="radiogroup"]')
    expect(groups()).toHaveLength(2)
    expect(wrapper.find('.delay').exists()).toBe(true)

    // Bit-Tiefe nur für WAV
    await wrapper.setProps({ format: 'webm' })
    expect(groups()).toHaveLength(1)

    // Mit vorhandener Aufnahme bleibt nur die Bit-Tiefe änderbar
    await wrapper.setProps({ format: 'wav', hasRecording: true })
    expect(groups()).toHaveLength(1)
    expect(wrapper.find('.delay').exists()).toBe(false)

    // Während Aufnahme/Countdown nichts
    await wrapper.setProps({ hasRecording: false, idle: false })
    expect(groups()).toHaveLength(0)
    expect(wrapper.find('.delay').exists()).toBe(false)
  })

  it('RecorderSettings meldet Änderungen als Werte, Verzögerung als Zahl', async () => {
    const props = { format: 'wav', bitDepth: 24, bitDepths: [16, 24, 32], startDelay: 0 }
    const wrapper = mount(RecorderSettings, { props, global })
    const [format, depth] = wrapper.findAll('[role="radiogroup"]')
    await format.findAll('[role="radio"]')[1].trigger('click')
    expect(wrapper.emitted('update:format')).toEqual([['webm']])
    await depth.findAll('[role="radio"]')[2].trigger('click')
    expect(wrapper.emitted('update:bitDepth')).toEqual([[32]])

    const select = wrapper.find('select')
    select.element.value = '5'
    await select.trigger('change')
    expect(wrapper.emitted('update:startDelay')).toEqual([[5]])
  })

  it('RecorderButtons zeigt die Buttons zum Zustand und meldet Klicks', async () => {
    const wrapper = mount(RecorderButtons, { global })
    expect(wrapper.find('.rec-btn.rec').exists()).toBe(true)
    await wrapper.find('.rec-btn.rec').trigger('click')
    expect(wrapper.emitted('start')).toHaveLength(1)

    await wrapper.setProps({ isCounting: true, countdownRemaining: 3 })
    expect(wrapper.find('.rec-btn.rec').exists()).toBe(false)
    expect(wrapper.find('.rec-btn.countdown').text()).toBe('3')
    await wrapper.find('.rec-btn.countdown').trigger('click')
    expect(wrapper.emitted('cancel-countdown')).toHaveLength(1)

    await wrapper.setProps({ isCounting: false, isRecording: true })
    await wrapper.find('.rec-btn.stop').trigger('click')
    expect(wrapper.emitted('stop')).toHaveLength(1)
    expect(wrapper.find('.rec-btn.download').exists()).toBe(false)

    await wrapper.setProps({ isRecording: false, hasRecording: true })
    await wrapper.find('.rec-btn.download').trigger('click')
    await wrapper.find('.rec-btn.new').trigger('click')
    expect(wrapper.emitted('download')).toHaveLength(1)
    expect(wrapper.emitted('new')).toHaveLength(1)
  })
})
