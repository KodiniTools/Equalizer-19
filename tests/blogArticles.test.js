import { test } from 'node:test'
import assert from 'node:assert/strict'
import { blogArticles, getBlogArticlesNewestFirst } from '../src/data/blogArticles.js'
import { formatBlogDate, buildBlogCards } from '../src/utils/blogCards.js'

const LOCALIZED_FIELDS = ['tag', 'url', 'image', 'title', 'description']

test('blogArticles: jeder Beitrag ist vollständig und zweisprachig', () => {
  assert.ok(blogArticles.length >= 2)
  const ids = new Set()
  for (const article of blogArticles) {
    assert.ok(!ids.has(article.id), `doppelte id ${article.id}`)
    ids.add(article.id)
    assert.match(article.date, /^\d{4}-\d{2}-\d{2}$/)
    assert.ok(Number.isInteger(article.minutes) && article.minutes > 0)
    for (const field of LOCALIZED_FIELDS) {
      for (const lang of ['de', 'en']) {
        assert.equal(typeof article[field][lang], 'string', `${article.id}.${field}.${lang}`)
        assert.ok(article[field][lang].length > 0, `${article.id}.${field}.${lang} ist leer`)
      }
    }
    assert.match(article.url.de, /^https:\/\/kodinitools\.com\/blog\/[a-z0-9-]+\/$/)
    assert.match(article.url.en, /^https:\/\/kodinitools\.com\/en\/blog\/[a-z0-9-]+\/$/)
    assert.match(article.image.de, /^https:\/\/kodinitools\.com\/image\//)
    assert.match(article.image.en, /^https:\/\/kodinitools\.com\/image\//)
  }
})

test('getBlogArticlesNewestFirst: neuester zuerst, Quell-Array bleibt unverändert', () => {
  const before = blogArticles.map((a) => a.id)
  const sorted = getBlogArticlesNewestFirst()
  for (let i = 1; i < sorted.length; i++) {
    assert.ok(sorted[i - 1].date >= sorted[i].date, 'nicht absteigend sortiert')
  }
  assert.equal(sorted[0].id, 'equalizer-19-aufnahme')
  assert.deepEqual(
    blogArticles.map((a) => a.id),
    before
  )
  assert.notEqual(sorted, blogArticles)
})

test('formatBlogDate: Sprache, Fallback und ungültige Werte', () => {
  assert.equal(formatBlogDate('2026-09-16', 'de'), '16. September 2026')
  assert.equal(formatBlogDate('2026-10-04', 'en'), 'October 4, 2026')
  // unbekannte Sprache → Deutsch
  assert.equal(formatBlogDate('2026-10-04', 'xx'), '4. Oktober 2026')
  // ungültig → unverändert, kein Throw
  assert.equal(formatBlogDate('kein-datum', 'de'), 'kein-datum')
  assert.equal(formatBlogDate('2026-13-40', 'de'), '2026-13-40')
  assert.equal(formatBlogDate(undefined, 'de'), '')
})

test('buildBlogCards: aktive Sprache, Fallback auf Deutsch, Meta-Zeile', () => {
  const articles = [
    {
      id: 'x',
      date: '2026-10-04',
      minutes: 7,
      tag: { de: 'Audio', en: 'Audio' },
      url: { de: 'u-de', en: 'u-en' },
      image: { de: 'i-de' }, // keine EN-Übersetzung → Deutsch
      title: { de: 'T de', en: 'T en' },
      description: { de: 'D de', en: 'D en' },
    },
  ]
  const [en] = buildBlogCards(articles, 'en', 'min')
  assert.deepEqual(en, {
    id: 'x',
    url: 'u-en',
    image: 'i-de',
    tag: 'Audio',
    title: 'T en',
    description: 'D en',
    meta: 'October 4, 2026 · 7 min',
  })
  const [de] = buildBlogCards(articles, 'de', 'Min.')
  assert.equal(de.url, 'u-de')
  assert.equal(de.meta, '4. Oktober 2026 · 7 Min.')
  assert.deepEqual(buildBlogCards([], 'de', 'Min.'), [])
})

test('buildBlogCards: echte Beiträge liefern für beide Sprachen vollständige Karten', () => {
  for (const lang of ['de', 'en']) {
    for (const card of buildBlogCards(getBlogArticlesNewestFirst(), lang, 'x')) {
      for (const key of ['id', 'url', 'image', 'tag', 'title', 'description', 'meta']) {
        assert.ok(card[key], `${card.id}.${key} (${lang}) fehlt`)
      }
    }
  }
})
