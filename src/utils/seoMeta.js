// Title, description, canonical and hreflang per route and language.
// One shared index.html serves every route, so these tags are set at runtime.
// Deutsch hat die URL ohne Parameter, Englisch dieselbe URL mit ?lang=en.
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

const isLang = (value) => value === 'de' || value === 'en'

/** Startsprache: ?lang=de|en, dann gespeicherte Wahl, sonst Deutsch. */
export function resolveInitialLanguage(search, ...stored) {
  const fromUrl = new URLSearchParams(search || '').get('lang')
  if (isLang(fromUrl)) return fromUrl
  return stored.find(isLang) ?? 'de'
}

/** Absolute canonical URL for a router path; English gets ?lang=en. */
export function canonicalFor(path, lang = 'de') {
  const key = routeKey(path)
  const url = key === '/' ? `${SITE_BASE}/` : `${SITE_BASE}${key}`
  return lang === 'en' ? `${url}?lang=en` : url
}

/** hreflang targets for a router path (identical for both languages). */
export function alternatesFor(path) {
  return [
    { hreflang: 'de', href: canonicalFor(path, 'de') },
    { hreflang: 'en', href: canonicalFor(path, 'en') },
    { hreflang: 'x-default', href: canonicalFor(path, 'de') },
  ]
}

/** Title, description and canonical for a router path and language. */
export function pageMeta(path, lang) {
  const key = routeKey(path)
  const language = lang === 'en' ? 'en' : 'de'
  return { ...META[language][key], canonical: canonicalFor(key, language) }
}

function setAttr(doc, selector, attr, value) {
  doc.querySelector(selector)?.setAttribute(attr, value)
}

function upsertLink(doc, selector, attrs) {
  let link = doc.querySelector(selector)
  if (!link) {
    link = doc.createElement('link')
    doc.head.appendChild(link)
  }
  for (const [name, value] of Object.entries(attrs)) link.setAttribute(name, value)
}

/** Write the page meta into the document head. */
export function applyPageMeta(path, lang, doc = globalThis.document) {
  if (!doc) return
  const meta = pageMeta(path, lang)
  doc.documentElement?.setAttribute('lang', lang === 'en' ? 'en' : 'de')
  doc.title = meta.title
  setAttr(doc, 'meta[name="description"]', 'content', meta.description)
  setAttr(doc, 'meta[property="og:title"]', 'content', meta.title)
  setAttr(doc, 'meta[property="og:description"]', 'content', meta.description)
  setAttr(doc, 'meta[property="og:url"]', 'content', meta.canonical)

  upsertLink(doc, 'link[rel="canonical"]', { rel: 'canonical', href: meta.canonical })
  for (const { hreflang, href } of alternatesFor(path)) {
    upsertLink(doc, `link[rel="alternate"][hreflang="${hreflang}"]`, {
      rel: 'alternate',
      hreflang,
      href,
    })
  }
}
