import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { localizeHtml } from './src/utils/localizeHtml'
import { DE_PAGES, EN_PAGES, alternatesFor, pageMeta } from './src/utils/seoMeta'

/**
 * Schreibt neben dist/index.html je Seite aus EN_PAGES eine englische Fassung mit
 * englischem <html lang>, Titel, Description, Canonical (?lang=en), hreflang sowie og:* und
 * twitter:*. nginx liefert sie für /equaliser19/?lang=en, /equaliser19/app?lang=en und
 * /equaliser19/faq?lang=en aus, damit Crawler ohne JavaScript schon im HTML Englisch sehen.
 * Laufzeit-i18n und die deutsche index.html bleiben unverändert.
 */
function localizedIndexHtml() {
  return {
    name: 'localized-index-html',
    apply: 'build',
    enforce: 'post',
    generateBundle(_options, bundle) {
      const index = bundle['index.html']
      if (!index || index.type !== 'asset') {
        this.error('localized-index-html: index.html fehlt im Bundle')
      }
      const html =
        typeof index.source === 'string' ? index.source : new TextDecoder().decode(index.source)
      const pages = [
        ...EN_PAGES.map((page) => ({ ...page, lang: 'en' })),
        // Deutsche Unterseiten (faq.html): eigener Kopf statt Startseite.
        ...DE_PAGES.map((page) => ({ ...page, lang: 'de' })),
      ]
      for (const { file, path, lang } of pages) {
        this.emitFile({
          type: 'asset',
          fileName: file,
          source: localizeHtml(html, {
            lang,
            ...pageMeta(path, lang),
            alternates: Object.fromEntries(
              alternatesFor(path).map(({ hreflang, href }) => [hreflang, href])
            ),
          }),
        })
      }
    },
  }
}

export default defineConfig({
  base: '/equaliser19/',
  plugins: [vue(), localizedIndexHtml()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
    // AudioWorklet modules must be loaded from a real URL, never inlined as data: URI
    assetsInlineLimit: (filePath) => (filePath.endsWith('.worklet.js') ? false : undefined),
  },
})
