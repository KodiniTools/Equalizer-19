import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  SITE_BASE,
  alternatesFor,
  applyPageMeta,
  canonicalFor,
  pageMeta,
  resolveInitialLanguage,
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
  const selectorOf = (node) => {
    const hreflang = node.getAttribute('hreflang')
    return hreflang
      ? `link[rel="alternate"][hreflang="${hreflang}"]`
      : `link[rel="${node.getAttribute('rel')}"]`
  }
  const appended = []
  return {
    title: '',
    nodes,
    documentElement: el(),
    querySelector: (sel) => nodes[sel] ?? null,
    createElement: () => el(),
    head: {
      // Attributes are set after appendChild, so resolve the selector lazily.
      appendChild: (node) => appended.push(node),
    },
    flush() {
      for (const node of appended.splice(0)) nodes[selectorOf(node)] = node
      return this
    },
  }
}

test('canonicalFor maps router paths to absolute URLs', () => {
  assert.equal(canonicalFor('/'), `${SITE_BASE}/`)
  assert.equal(canonicalFor(''), `${SITE_BASE}/`)
  assert.equal(canonicalFor('/app'), `${SITE_BASE}/app`)
  assert.equal(canonicalFor('/faq/'), `${SITE_BASE}/faq`)
  assert.equal(canonicalFor('/unknown'), `${SITE_BASE}/`)
  assert.equal(canonicalFor('/', 'en'), `${SITE_BASE}/?lang=en`)
  assert.equal(canonicalFor('/faq', 'en'), `${SITE_BASE}/faq?lang=en`)
})

test('resolveInitialLanguage: ?lang first, then stored values, else German', () => {
  assert.equal(resolveInitialLanguage('?lang=en', 'de'), 'en')
  assert.equal(resolveInitialLanguage('?x=1&lang=de', 'en'), 'de')
  assert.equal(resolveInitialLanguage('?lang=fr', null, 'en'), 'en')
  assert.equal(resolveInitialLanguage('', null, null), 'de')
  assert.equal(resolveInitialLanguage(undefined, 'xx'), 'de')
})

test('alternatesFor lists de, en (?lang=en) and x-default', () => {
  assert.deepEqual(alternatesFor('/faq'), [
    { hreflang: 'de', href: `${SITE_BASE}/faq` },
    { hreflang: 'en', href: `${SITE_BASE}/faq?lang=en` },
    { hreflang: 'x-default', href: `${SITE_BASE}/faq` },
  ])
})

test('pageMeta returns German by default and English for en', () => {
  assert.match(pageMeta('/', 'de').title, /^Equalizer online/)
  assert.match(pageMeta('/', 'en').title, /^Online Equalizer/)
  assert.match(pageMeta('/', 'fr').title, /^Equalizer online/)
  assert.equal(pageMeta('/faq', 'en').canonical, `${SITE_BASE}/faq?lang=en`)
  assert.equal(pageMeta('/faq', 'de').canonical, `${SITE_BASE}/faq`)
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

test('applyPageMeta creates canonical and hreflang links when missing', () => {
  const doc = fakeDocument()
  applyPageMeta('/app', 'en', doc)
  doc.flush()
  assert.equal(doc.documentElement.getAttribute('lang'), 'en')
  assert.equal(doc.nodes['link[rel="canonical"]'].getAttribute('href'), `${SITE_BASE}/app?lang=en`)
  assert.equal(
    doc.nodes['link[rel="alternate"][hreflang="en"]'].getAttribute('href'),
    `${SITE_BASE}/app?lang=en`
  )
  assert.equal(
    doc.nodes['link[rel="alternate"][hreflang="x-default"]'].getAttribute('href'),
    `${SITE_BASE}/app`
  )
  // A second call reuses the links instead of adding duplicates.
  applyPageMeta('/app', 'de', doc)
  assert.equal(doc.flush().nodes['link[rel="canonical"]'].getAttribute('href'), `${SITE_BASE}/app`)
})
