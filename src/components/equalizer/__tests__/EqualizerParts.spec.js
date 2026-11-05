import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { i18nStub } from '../../../__tests__/i18nStub'
import EqBands from '../EqBands.vue'
import EqPresetControls from '../EqPresetControls.vue'
import EqPresetForm from '../EqPresetForm.vue'
import { EQ_BAND_FREQUENCIES, EQ_PRESETS } from '../../../utils/presets.js'

const global = { provide: i18nStub() }
const bands = EQ_BAND_FREQUENCIES.map((frequency, i) => ({ frequency, gain: i === 0 ? -3 : 0 }))

describe('Equalizer-Teile', () => {
  it('EqBands rendert 19 Regler und meldet Änderungen als Zahl', async () => {
    const wrapper = mount(EqBands, { props: { bands }, global })
    const sliders = wrapper.findAll('input[type="range"]')
    expect(sliders).toHaveLength(19)
    expect(sliders[0].classes()).toContain('negative')
    expect(wrapper.findAll('.val')[0].text()).toBe('-3')
    expect(wrapper.find('.eq-curve path.boost').exists()).toBe(true)

    sliders[3].element.value = '4.5'
    await sliders[3].trigger('input')
    expect(wrapper.emitted('change')).toEqual([[3, 4.5]])
  })

  it('EqBands sperrt die Regler im Bypass', () => {
    const wrapper = mount(EqBands, { props: { bands, disabled: true }, global })
    expect(wrapper.classes()).toContain('disabled')
    expect(wrapper.find('input[type="range"]').attributes('disabled')).toBeDefined()
  })

  it('EqPresetControls listet Presets und meldet die Auswahl nach dem Wert', async () => {
    const wrapper = mount(EqPresetControls, {
      props: { modelValue: '', customPresets: [{ id: '__custom__1', name: 'Mein Preset' }] },
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
