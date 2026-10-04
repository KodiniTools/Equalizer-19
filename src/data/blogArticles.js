// ==========================================================================
// Blog-Beiträge zum Equalizer 19 auf kodinitools.com/blog
//
// Werden auf der Landing-Page (LandingPage.vue, Abschnitt „Blog“) als Karten
// angezeigt. Ein neuer Beitrag ist ein weiteres Objekt in `blogArticles`; die
// Reihenfolge im Array ist egal, angezeigt wird immer der neueste zuerst
// (getBlogArticlesNewestFirst). Bilder und URLs zeigen auf die Kodinitools-
// Home-Seite, damit die Landing-Page keine eigenen Kopien der Vorschaubilder
// braucht.
// ==========================================================================

/**
 * @typedef {{ de: string, en: string }} LocalizedText
 *
 * @typedef {Object} BlogArticle
 * @property {string} id            Eindeutige Kennung (wird als Vue-Key genutzt)
 * @property {string} date          Veröffentlichungsdatum als ISO-Datum (YYYY-MM-DD)
 * @property {number} minutes       Lesezeit in Minuten
 * @property {LocalizedText} tag    Kategorie-Badge
 * @property {LocalizedText} url    Vollständige URL des Beitrags je Sprache
 * @property {LocalizedText} image  Vollständige URL des Vorschaubilds je Sprache
 * @property {LocalizedText} title
 * @property {LocalizedText} description
 */

/** @type {BlogArticle[]} */
export const blogArticles = [
  {
    id: 'equalizer-19-aufnahme',
    date: '2026-10-04',
    minutes: 7,
    tag: { de: 'Audio', en: 'Audio' },
    url: {
      de: 'https://kodinitools.com/blog/equalizer-19-aufnahme/',
      en: 'https://kodinitools.com/en/blog/equalizer-19-recording/',
    },
    image: {
      de: 'https://kodinitools.com/image/equalizer19-aufnahme-blog-de.webp',
      en: 'https://kodinitools.com/image/equalizer19-recording-blog-en.webp',
    },
    title: {
      de: 'Audio aufnehmen im Equalizer: Aufnahmequelle, Einstellungen & Download im 19-Band EQ Pro',
      en: 'Record Audio in the Equalizer: Recording Source, Settings & Download in the 19-Band EQ Pro',
    },
    description: {
      de: 'Playlist, Mikrofon, Line-In oder PC-Ton als Aufnahmequelle, WAV mit 16, 24 oder 32 Bit Float oder WebM (Opus), Startverzögerung mit Countdown und Download mit eigenem Dateinamen und Zielordner – ohne Upload.',
      en: 'Playlist, microphone, line-in or PC audio as the recording source, WAV at 16, 24 or 32-bit float or WebM (Opus), start delay with countdown and download with your own file name and target folder — no upload.',
    },
  },
  {
    id: 'equalizer-19-band',
    date: '2026-09-16',
    minutes: 6,
    tag: { de: 'Audio', en: 'Audio' },
    url: {
      de: 'https://kodinitools.com/blog/equalizer-19-band/',
      en: 'https://kodinitools.com/en/blog/19-band-equalizer/',
    },
    image: {
      de: 'https://kodinitools.com/image/audio-equalizer19-blog-de.png',
      en: 'https://kodinitools.com/image/audio-equalizer19-blog-en.png',
    },
    title: {
      de: 'Equalizer online: 19-Band EQ mit Kompressor kostenlos im Browser nutzen',
      en: 'Online Equalizer: Use a 19-Band EQ with Compressor Free in Your Browser',
    },
    description: {
      de: '19 Frequenzbänder von 20 Hz bis 20 kHz, Presets für Rock, Pop und Podcast, dynamischer Kompressor, Pegelmeter und Export als WAV oder WebM – ohne Upload.',
      en: '19 frequency bands from 20 Hz to 20 kHz, presets for rock, pop and podcast, dynamic compressor, level meter and export as WAV or WebM — no upload.',
    },
  },
]

/**
 * Liefert die Beiträge nach Datum absteigend (neuester zuerst), unabhängig
 * von der Reihenfolge im Array. Das Array selbst bleibt unverändert.
 * @returns {BlogArticle[]}
 */
export function getBlogArticlesNewestFirst() {
  return [...blogArticles].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
}
