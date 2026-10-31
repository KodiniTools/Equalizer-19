import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  SITE_BASE,
  applyPageMeta,
  canonicalFor,
  pageMeta,
  routePathFromLocation,
} from '../src/utils/seoMeta.js'

// Minimal head: only what applyPageMeta touches.
function fakeDocument({ withCanonical = false } = {}) {
  const el = () => {
    const attrs = {}
    return { setAttribute: (k, v) => (attrs[k] = v), getAttribute: (k) => attrs[k] }
  }
  const nodes = {
    'meta[name="description"]': el(),
    'meta[property="og:title"]': el(),
    'meta[property="og:description"]': el(),
    'meta[property="og:url"]': el(),
  }
  if (withCanonical) nodes['link[rel="canonical"]'] = el()
  return {
    title: '',
    nodes,
    querySelector: (sel) => nodes[sel] ?? null,
    createElement: () => el(),
    head: {
      appendChild: (node) => {
        nodes['link[rel="canonical"]'] = node
      },
    },
  }
}

test('canonicalFor maps router paths to absolute URLs', () => {
  assert.equal(canonicalFor('/'), `${SITE_BASE}/`)
  assert.equal(canonicalFor(''), `${SITE_BASE}/`)
  assert.equal(canonicalFor('/app'), `${SITE_BASE}/app`)
  assert.equal(canonicalFor('/faq/'), `${SITE_BASE}/faq`)
  assert.equal(canonicalFor('/unknown'), `${SITE_BASE}/`)
})

test('pageMeta returns German by default and English for en', () => {
  assert.match(pageMeta('/', 'de').title, /^Equalizer online/)
  assert.match(pageMeta('/', 'en').title, /^Online Equalizer/)
  assert.match(pageMeta('/', 'fr').title, /^Equalizer online/)
  assert.equal(pageMeta('/faq', 'en').canonical, `${SITE_BASE}/faq`)
})

test('every page has a title of at most 70 and a description of at most 160 characters', () => {
  for (const lang of ['de', 'en']) {
    for (const path of ['/', '/app', '/faq']) {
      const { title, description } = pageMeta(path, lang)
      assert.ok(title.length <= 70, `${lang}${path} title ${title.length}`)
      assert.ok(description.length <= 160, `${lang}${path} description ${description.length}`)
    }
  }
})

test('routePathFromLocation strips the deploy base', () => {
  assert.equal(routePathFromLocation('/equaliser19/'), '/')
  assert.equal(routePathFromLocation('/equaliser19'), '/')
  assert.equal(routePathFromLocation('/equaliser19/faq'), '/faq')
  assert.equal(routePathFromLocation('/app'), '/app')
})

test('applyPageMeta updates title, meta tags and an existing canonical', () => {
  const doc = fakeDocument({ withCanonical: true })
  applyPageMeta('/faq', 'de', doc)
  assert.equal(doc.title, pageMeta('/faq', 'de').title)
  assert.equal(
    doc.nodes['meta[name="description"]'].getAttribute('content'),
    pageMeta('/faq', 'de').description
  )
  assert.equal(doc.nodes['meta[property="og:url"]'].getAttribute('content'), `${SITE_BASE}/faq`)
  assert.equal(doc.nodes['link[rel="canonical"]'].getAttribute('href'), `${SITE_BASE}/faq`)
})

test('applyPageMeta creates the canonical link when missing', () => {
  const doc = fakeDocument()
  applyPageMeta('/app', 'en', doc)
  assert.equal(doc.nodes['link[rel="canonical"]'].getAttribute('rel'), 'canonical')
  assert.equal(doc.nodes['link[rel="canonical"]'].getAttribute('href'), `${SITE_BASE}/app`)
})
