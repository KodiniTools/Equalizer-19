import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { i18nStub } from '../../../__tests__/i18nStub'
import EqCurveEditor from '../EqCurveEditor.vue'
import EqPresetControls from '../EqPresetControls.vue'
import EqPresetForm from '../EqPresetForm.vue'
import { EQ_BAND_FREQUENCIES, EQ_PRESETS } from '../../../utils/presets'

const global = { provide: i18nStub() }
const bands = EQ_BAND_FREQUENCIES.map((frequency, i) => ({ frequency, gain: i === 0 ? -3 : 0 }))

describe('Equalizer-Teile', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('EqCurveEditor rendert 19 Slider-Punkte und die Kurve', () => {
    const wrapper = mount(EqCurveEditor, { props: { bands }, global })
    const nodes = wrapper.findAll('[role="slider"]')
    expect(nodes).toHaveLength(19)
    expect(nodes[0].classes()).toContain('cut')
    expect(nodes[0].attributes('aria-valuenow')).toBe('-3')
    expect(nodes[0].attributes('aria-valuetext')).toBe('−3 dB')
    expect(wrapper.findAll('.eq-band .val')[0].text()).toBe('−3')
    expect(wrapper.find('path.eq-line.boost').exists()).toBe(true)
    expect(wrapper.find('.eq-spectrum').exists()).toBe(false)
  })

  it('EqCurveEditor meldet Tastatur-Änderungen in 0,5-dB-Schritten, begrenzt auf ±12 dB', async () => {
    // Props stay fixed (no v-model here), so every step starts from the initial gain
    const wrapper = mount(EqCurveEditor, { props: { bands }, global })
    const nodes = wrapper.findAll('[role="slider"]')
    await nodes[3].trigger('keydown', { key: 'ArrowUp' })
    await nodes[3].trigger('keydown', { key: 'PageDown' })
    await nodes[3].trigger('keydown', { key: 'End' })
    await nodes[0].trigger('keydown', { key: 'Home' })
    await nodes[0].trigger('keydown', { key: 'ArrowDown' })
    await nodes[0].trigger('keydown', { key: '0' })
    expect(wrapper.emitted('change')).toEqual([
      [3, 0.5],
      [3, -3],
      [3, 12],
      [0, -12],
      [0, -3.5],
      [0, 0],
    ])
  })

  it('EqCurveEditor zeichnet das Spektrum aus getSpectrum als Fläche auf der Frequenzachse', async () => {
    // One synchronous animation frame, later requests are ignored (no loop in the test)
    let frames = 0
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      if (frames++ === 0) cb(0)
      return frames
    })
    vi.stubGlobal('cancelAnimationFrame', () => {})
    const data = new Uint8Array(1024).fill(128)
    const wrapper = mount(EqCurveEditor, {
      props: { bands, getSpectrum: () => data, sampleRate: 48000 },
      global,
    })
    await wrapper.vm.$nextTick()
    const d = wrapper.get('.eq-spectrum').attributes('d') ?? ''
    expect(d.startsWith('M')).toBe(true)
    expect(d.endsWith('Z')).toBe(true)
    // jsdom measures nothing, so the stage falls back to its 320 px minimum (~92 steps of 3 px)
    expect((d.match(/ L/g) || []).length).toBeGreaterThan(80)

    await wrapper.setProps({ getSpectrum: null })
    expect(wrapper.find('.eq-spectrum').exists()).toBe(false)
    wrapper.unmount()
  })

  it('EqCurveEditor sperrt die Punkte im Bypass', async () => {
    const wrapper = mount(EqCurveEditor, { props: { bands, disabled: true }, global })
    expect(wrapper.classes()).toContain('disabled')
    const node = wrapper.find('[role="slider"]')
    expect(node.attributes('tabindex')).toBe('-1')
    expect(node.attributes('aria-disabled')).toBe('true')
    await node.trigger('keydown', { key: 'ArrowUp' })
    expect(wrapper.emitted('change')).toBeUndefined()
  })

  it('EqPresetControls listet Presets und meldet die Auswahl nach dem Wert', async () => {
    const wrapper = mount(EqPresetControls, {
      props: {
        modelValue: '',
        customPresets: [{ id: '__custom__1', name: 'Mein Preset', gains: [] }],
      },
      global,
    })
    const options = wrapper.findAll('option').map((o) => o.attributes('value'))
    expect(options).toEqual(['', ...Object.keys(EQ_PRESETS), '__custom__1'])
    expect(wrapper.find('.delete-btn').exists()).toBe(false)

    const select = wrapper.find('select')
    select.element.value = 'Rock'
    await select.trigger('change')
    expect(wrapper.emitted('update:modelValue')).toEqual([['Rock']])
    expect(wrapper.emitted('change')).toEqual([['Rock']])

    await wrapper.setProps({ modelValue: '__custom__1' })
    expect(wrapper.find('.delete-btn').exists()).toBe(true)
    await wrapper.find('.delete-btn').trigger('click')
    expect(wrapper.emitted('delete')).toHaveLength(1)
  })

  it('EqPresetControls blendet den Speichern-Button aus, solange das Formular offen ist', () => {
    expect(mount(EqPresetControls, { global }).find('.save-btn').exists()).toBe(true)
    expect(
      mount(EqPresetControls, { props: { saving: true }, global })
        .find('.save-btn')
        .exists()
    ).toBe(false)
  })

  it('EqPresetForm speichert nur einen nicht-leeren, getrimmten Namen', async () => {
    const wrapper = mount(EqPresetForm, { global, attachTo: document.body })
    const input = wrapper.find('input')
    expect(document.activeElement).toBe(input.element)
    expect(wrapper.find('.save-confirm-btn').attributes('disabled')).toBeDefined()

    await input.setValue('   ')
    await input.trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('save')).toBeUndefined()

    await input.setValue('  Warm  ')
    await input.trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('save')).toEqual([['Warm']])

    await input.trigger('keydown', { key: 'Escape' })
    expect(wrapper.emitted('cancel')).toHaveLength(1)
    wrapper.unmount()
  })
})
