import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { localizeHtml } from './src/utils/localizeHtml'
import { SITE_BASE, pageMeta } from './src/utils/seoMeta'

/**
 * Schreibt neben dist/index.html eine englische Fassung dist/index.en.html mit
 * englischem <html lang>, Titel, Description, Canonical (?lang=en) sowie og:* und twitter:*.
 * nginx liefert sie für /equaliser19/?lang=en aus, damit Crawler ohne JavaScript schon im
 * HTML Englisch sehen. Laufzeit-i18n und die deutsche index.html bleiben unverändert.
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
      this.emitFile({
        type: 'asset',
        fileName: 'index.en.html',
        source: localizeHtml(html, {
          lang: 'en',
          ...pageMeta('/', 'en'),
          canonical: `${SITE_BASE}/?lang=en`,
        }),
      })
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
