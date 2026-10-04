/**
 * Blog-Karten der Landing-Page: reine Funktionen ohne Vue, damit sie mit
 * node:test prüfbar sind. Die Beiträge selbst stehen in src/data/blogArticles.js.
 */

const DATE_LOCALES = { de: 'de-DE', en: 'en-US' }
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

/**
 * ISO-Datum (YYYY-MM-DD) sprachabhängig formatieren:
 * de → „16. September 2026“, en → „September 16, 2026“.
 * Unbekannte Sprachen fallen auf Deutsch zurück, ungültige Werte werden
 * unverändert zurückgegeben.
 *
 * @param {string} isoDate
 * @param {string} [lang='de']
 * @returns {string}
 */
export function formatBlogDate(isoDate, lang = 'de') {
  const value = String(isoDate ?? '')
  if (!ISO_DATE.test(value)) return value
  // UTC, damit das Datum nicht von der Zeitzone des Geräts verschoben wird
  const date = new Date(`${value}T00:00:00Z`)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString(DATE_LOCALES[lang] || DATE_LOCALES.de, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

/**
 * Beiträge in Kartendaten der aktiven Sprache umwandeln. Fehlt eine
 * Übersetzung, fällt der Text auf Deutsch zurück.
 *
 * @param {import('../data/blogArticles.js').BlogArticle[]} articles
 * @param {string} lang           'de' | 'en'
 * @param {string} minutesLabel   Einheit der Lesezeit, z. B. „Min.“ oder „min“
 * @returns {{ id: string, url: string, image: string, tag: string, title: string, description: string, meta: string }[]}
 */
export function buildBlogCards(articles, lang, minutesLabel) {
  const pick = (field) => field?.[lang] ?? field?.de ?? ''
  return articles.map((article) => ({
    id: article.id,
    url: pick(article.url),
    image: pick(article.image),
    tag: pick(article.tag),
    title: pick(article.title),
    description: pick(article.description),
    meta: `${formatBlogDate(article.date, lang)} · ${article.minutes} ${minutesLabel}`,
  }))
}
