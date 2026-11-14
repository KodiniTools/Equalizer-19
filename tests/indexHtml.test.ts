// @vitest-environment node
import { test } from 'vitest'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

/**
 * Guards the critical-path parts of index.html that PageSpeed flagged:
 * the SSI footer must not jump when the app mounts (CLS) and the webfonts
 * must start loading before the CSS bundle is parsed.
 */
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8')
const head = html.slice(0, html.indexOf('</head>'))

test('reserves a full viewport for #app before Vue mounts', () => {
  const inline = head.match(/<style>([\s\S]*?)<\/style>/)?.[1] ?? ''
  assert.match(inline, /#app\s*\{[^}]*min-height:\s*100vh/)
  assert.match(inline, /#app\s*\{[^}]*min-height:\s*100dvh/)
})

test('preloads both Supreme webfont cuts with crossorigin', () => {
  for (const file of ['Supreme-Regular.woff2', 'Supreme-Bold.woff2']) {
    const tag = head.match(new RegExp(`<link[^>]*href="/fonts/${file}"[^>]*>`))?.[0]
    assert.ok(tag, `${file} is preloaded`)
    assert.match(tag, /rel="preload"/)
    assert.match(tag, /as="font"/)
    assert.match(tag, /crossorigin/)
  }
})

test('the app container stays between the SSI nav and footer', () => {
  const nav = html.indexOf('/partials/nav.html')
  const app = html.indexOf('<div id="app">')
  const footer = html.indexOf('/partials/footer.html')
  assert.ok(nav > -1 && nav < app && app < footer)
})
