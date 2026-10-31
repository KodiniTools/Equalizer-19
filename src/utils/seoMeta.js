// Title, description and canonical per route and language.
// One shared index.html serves every route, so these tags are set at runtime.
export const SITE_BASE = 'https://kodinitools.com/equaliser19'
const BASE_PATH = '/equaliser19'

const META = {
  de: {
    '/': {
      title: 'Equalizer online – 19-Band-EQ mit Kompressor | KodiniTools',
      description:
        'Kostenloser 19-Band-Equalizer im Browser: Frequenzen anpassen, Kompressor, Effekte und Aufnahme in Echtzeit. Ohne Installation und ohne Registrierung.',
    },
    '/app': {
      title: 'Equalizer 19 – Audio bearbeiten im Browser | KodiniTools',
      description:
        'Audio direkt im Browser bearbeiten: 19 Frequenzbänder, Kompressor, Effekte und Aufnahme in Echtzeit. Kostenlos, ohne Installation.',
    },
    '/faq': {
      title: 'Equalizer 19 – Häufige Fragen | KodiniTools',
      description:
        'Antworten zum Equalizer 19: Bänder und Presets, Kompressor, Aufnahme, Browser-Unterstützung und Datenschutz.',
    },
  },
  en: {
    '/': {
      title: 'Online Equalizer – 19-Band EQ with Compressor | KodiniTools',
      description:
        'Free 19-band equalizer in your browser: shape frequencies, add compression and effects, and record in real time. No installation, no sign-up.',
    },
    '/app': {
      title: 'Equalizer 19 – Edit Audio in Your Browser | KodiniTools',
      description:
        'Edit audio right in your browser: 19 frequency bands, compressor, effects and real-time recording. Free, no installation.',
    },
    '/faq': {
      title: 'Equalizer 19 – FAQ | KodiniTools',
      description:
        'Answers about Equalizer 19: bands and presets, compressor, recording, browser support and privacy.',
    },
  },
}

/** Router path ('/', '/app/', '') → known key, unknown paths fall back to '/'. */
function routeKey(path) {
  const trimmed = (path || '/').replace(/\/+$/, '') || '/'
  return Object.hasOwn(META.de, trimmed) ? trimmed : '/'
}

/** Router path from a full pathname such as '/equaliser19/faq'. */
export function routePathFromLocation(pathname) {
  const p = pathname || '/'
  return p.startsWith(BASE_PATH) ? p.slice(BASE_PATH.length) || '/' : p
}

/** Absolute canonical URL for a router path. */
export function canonicalFor(path) {
  const key = routeKey(path)
  return key === '/' ? `${SITE_BASE}/` : `${SITE_BASE}${key}`
}

/** Title, description and canonical for a router path and language. */
export function pageMeta(path, lang) {
  const key = routeKey(path)
  const texts = META[lang === 'en' ? 'en' : 'de'][key]
  return { ...texts, canonical: canonicalFor(key) }
}

function setAttr(doc, selector, attr, value) {
  doc.querySelector(selector)?.setAttribute(attr, value)
}

/** Write the page meta into the document head. */
export function applyPageMeta(path, lang, doc = globalThis.document) {
  if (!doc) return
  const meta = pageMeta(path, lang)
  doc.title = meta.title
  setAttr(doc, 'meta[name="description"]', 'content', meta.description)
  setAttr(doc, 'meta[property="og:title"]', 'content', meta.title)
  setAttr(doc, 'meta[property="og:description"]', 'content', meta.description)
  setAttr(doc, 'meta[property="og:url"]', 'content', meta.canonical)

  let link = doc.querySelector('link[rel="canonical"]')
  if (!link) {
    link = doc.createElement('link')
    link.setAttribute('rel', 'canonical')
    doc.head.appendChild(link)
  }
  link.setAttribute('href', meta.canonical)
}
