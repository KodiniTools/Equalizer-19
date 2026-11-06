import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { i18nStub } from '../../../__tests__/i18nStub'
import LandingFacts from '../LandingFacts.vue'
import LandingSignalChain from '../LandingSignalChain.vue'
import LandingSteps from '../LandingSteps.vue'
import LandingDetails from '../LandingDetails.vue'
import LandingBlog from '../LandingBlog.vue'
import LandingCta from '../LandingCta.vue'
import { EQ_BAND_FREQUENCIES, EQ_PRESETS, COMP_PRESETS } from '../../../utils/presets'
import { getBlogArticlesNewestFirst } from '../../../data/blogArticles'

const global = { provide: i18nStub(), stubs: { RouterLink: true } }

describe('Landing-Abschnitte', () => {
  it('LandingFacts leitet die Kennzahlen aus presets.js ab', () => {
    const values = mount(LandingFacts, { global })
      .findAll('dt')
      .map((dt) => dt.text())
    expect(values).toEqual([
      String(EQ_BAND_FREQUENCIES.length),
      String(Object.keys(EQ_PRESETS).length + Object.keys(COMP_PRESETS).length),
      'lp_fact_bits_value',
      '0',
    ])
  })

  it('LandingSignalChain zeigt die vier Stufen mit je einer Illustration', () => {
    const wrapper = mount(LandingSignalChain, { global })
    expect(wrapper.attributes('id')).toBe('features')
    const modules = wrapper.findAll('.lp-module')
    expect(modules).toHaveLength(4)
    expect(modules.map((m) => m.find('h3').text())).toEqual([
      'lp_mod_input_title',
      'lp_mod_eq_title',
      'lp_mod_comp_title',
      'lp_mod_rec_title',
    ])
    for (const m of modules) expect(m.find('.lp-module-art svg').exists()).toBe(true)
    // EQ-Karte: echte Kurve des Rock-Presets mit Boost/Cut-Flächen
    expect(modules[1].findAll('.art-fill')).toHaveLength(2)
  })

  it('LandingSteps nummeriert drei Schritte', () => {
    const steps = mount(LandingSteps, { global }).findAll('.lp-step')
    expect(steps.map((s) => s.find('.lp-step-num').text())).toEqual(['1', '2', '3'])
    expect(steps[2].find('h3').text()).toBe('lp_step3_title')
  })

  it('LandingDetails listet die sechs Detailpunkte', () => {
    const titles = mount(LandingDetails, { global })
      .findAll('.lp-detail h3')
      .map((h) => h.text())
    expect(titles).toEqual([
      'lp_det_privacy_title',
      'lp_det_realtime_title',
      'lp_det_viz_title',
      'lp_det_playlist_title',
      'lp_det_keys_title',
      'lp_det_devices_title',
    ])
  })

  it('LandingBlog rendert pro Beitrag eine Karte, neuester zuerst', () => {
    const wrapper = mount(LandingBlog, { global })
    expect(wrapper.attributes('id')).toBe('blog')
    const cards = wrapper.findAll('.lp-blog-card')
    const articles = getBlogArticlesNewestFirst()
    expect(cards).toHaveLength(articles.length)
    expect(cards[0].attributes('href')).toBe(articles[0].url.de)
    expect(cards[0].attributes('rel')).toBe('noopener noreferrer')
  })

  it('LandingCta führt zur App', () => {
    const wrapper = mount(LandingCta, { global })
    expect(wrapper.find('h2').text()).toBe('lp_final_title')
    expect(wrapper.findComponent({ name: 'UiButton' }).props('to')).toBe('/app')
  })
})
