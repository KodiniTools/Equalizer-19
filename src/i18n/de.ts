/**
 * Deutsche Texte; Referenz für alle Schlüssel. Neue Schlüssel zuerst hier
 * eintragen, `en.ts` meldet fehlende oder überzählige Schlüssel dann als Typfehler.
 * Platzhalter wie {name} oder {count} ersetzen die Komponenten per replace().
 */
const de = {
  // Brand & Navigation
  nav_start_app: 'App starten',
  app_back_home: 'Zur Startseite',
  app_help: 'Hilfe & FAQ',
  app_tabs_label: 'Bereich',
  app_tab_source: 'Quelle',
  app_tab_eq: 'Equalizer',
  app_tab_dynamics: 'Dynamik',
  language: 'Sprache',
  theme: 'Design',

  // Landing page
  lp_eyebrow: 'Kostenlos · Im Browser · Ohne Installation',
  lp_title: 'Professioneller Klang, direkt im Browser',
  lp_subtitle:
    '19-Band-Equalizer, Kompressor und verlustfreie Aufnahme – die Verarbeitung läuft vollständig auf deinem Gerät. Keine Uploads, keine Anmeldung.',
  lp_cta_start: 'App starten',
  lp_cta_learn: 'Funktionen ansehen',
  lp_trust_uploads: '0 Uploads',
  lp_trust_account: 'Kein Konto nötig',
  lp_trust_browsers: 'Chrome · Firefox · Safari',
  lp_demo_title: 'Probier es aus',
  lp_demo_presets: 'Preset wählen',
  lp_demo_custom: 'Eigene Kurve',
  lp_fact_bands: 'EQ-Bänder von 20 Hz bis 20 kHz',
  lp_fact_presets: 'Presets für Equalizer und Kompressor',
  lp_fact_bits_value: '32 Bit',
  lp_fact_bits: 'Float-WAV, verlustfrei aufgenommen',
  lp_fact_uploads: 'Uploads – alles bleibt lokal',
  lp_modules_title: 'Vier Werkzeuge, ein Signalweg',
  lp_modules_subtitle:
    'Audio-Eingang, Equalizer, Kompressor und Aufnahme arbeiten in Echtzeit zusammen – du hörst jede Änderung sofort.',
  lp_mod_input_title: 'Audio-Eingang',
  lp_mod_input_desc:
    'Verbinde eine Live-Quelle und bearbeite sie in Echtzeit – auch den Ton deines PCs.',
  lp_mod_input_1: 'PC-Ton: YouTube, Spotify und mehr live durch EQ und Kompressor',
  lp_mod_input_2: 'Line-In, Mikrofon oder Audio-Interface',
  lp_mod_input_3: 'Die bearbeitete Version direkt als WAV oder WebM aufnehmen',
  lp_mod_eq_title: 'Equalizer',
  lp_mod_eq_desc: 'Forme den Klang mit 19 fein abgestuften Bändern.',
  lp_mod_eq_1: '±12 dB pro Band',
  lp_mod_eq_2: '10 Presets und eigene Presets',
  lp_mod_eq_3: 'Bypass für den direkten A/B-Vergleich',
  lp_mod_comp_title: 'Kompressor',
  lp_mod_comp_desc: 'Bändigt Pegelspitzen und sorgt für einen dichten, gleichmäßigen Klang.',
  lp_mod_comp_1: 'Threshold, Ratio, Knee, Attack, Release',
  lp_mod_comp_2: '15 Presets von Podcast bis Limiter',
  lp_mod_comp_3: 'Pegel-Meter für Ein- und Ausgang',
  lp_mod_rec_title: 'Aufnahme & Export',
  lp_mod_rec_desc: 'Nimmt das bearbeitete Signal auf – mit allen Effekten.',
  lp_mod_rec_1: 'WAV mit 16, 24 oder 32 Bit',
  lp_mod_rec_2: 'WebM (Opus) für kleine Dateien',
  lp_mod_rec_3: 'Eigener Dateiname beim Speichern',
  lp_steps_title: 'In drei Schritten zum Ergebnis',
  lp_step1_title: 'Audio laden',
  lp_step1_desc:
    'Dateien oder ganze Ordner per Klick oder Drag & Drop hinzufügen – oder den Audio-Eingang starten.',
  lp_step2_title: 'Klang anpassen',
  lp_step2_desc: 'Equalizer und Kompressor einstellen oder ein Preset wählen.',
  lp_step3_title: 'Aufnehmen & speichern',
  lp_step3_desc: 'Das Ergebnis aufnehmen und als WAV oder WebM speichern.',
  lp_details_title: 'Durchdacht bis ins Detail',
  lp_det_privacy_title: 'Privat',
  lp_det_privacy_desc:
    'Deine Dateien verlassen nie das Gerät – es gibt keinen Server, der sie verarbeitet.',
  lp_det_realtime_title: 'Echtzeit',
  lp_det_realtime_desc:
    'Web Audio API und AudioWorklet verarbeiten den Klang direkt im Browser, ohne Plugins.',
  lp_det_viz_title: 'Visualisierung',
  lp_det_viz_desc: 'Spektrum-Analyzer und Pegel-Meter zeigen, was im Signal passiert.',
  lp_det_playlist_title: 'Playlist',
  lp_det_playlist_desc:
    'Mehrere Titel, Zufallswiedergabe, Wiederholung und Sortieren per Drag & Drop.',
  lp_det_keys_title: 'Tastenkürzel',
  lp_det_keys_desc:
    'Wiedergabe, Spulen, Lautstärke, Titelwechsel und Rückgängig/Wiederholen direkt über die Tastatur.',
  lp_det_devices_title: 'Überall nutzbar',
  lp_det_devices_desc: 'Für Desktop, Tablet und Smartphone – mit hellem und dunklem Design.',
  lp_final_title: 'Bereit zum Loslegen?',
  lp_final_desc: 'Starte jetzt – kostenlos und ohne Anmeldung.',
  // Landing page: local navigation + blog cards
  lp_nav_label: 'Seitennavigation',
  lp_nav_home: 'Start',
  lp_nav_features: 'Funktionen',
  lp_nav_blog: 'Blog',
  lp_nav_faq: 'FAQ',
  lp_blog_title: 'Aus dem Blog',
  lp_blog_subtitle: 'Anleitungen und Hintergründe zum Equalizer 19 auf kodinitools.com.',
  lp_blog_read_more: 'Artikel lesen',
  lp_blog_minutes: 'Min.',

  // FAQ Page
  faq_title: 'Häufig gestellte Fragen',
  faq_subtitle: 'Alles, was du über Equalizer 19 wissen musst',
  faq_eyebrow: 'Hilfe & Antworten',
  faq_nav_label: 'Themen',
  faq_cat_general: 'Allgemeine Fragen',
  faq_cat_equalizer: 'Equalizer',
  faq_cat_compressor: 'Kompressor',
  faq_cat_recording: 'Aufnahme',
  faq_cat_technical: 'Technisches',
  faq_cat_input: 'Eingangsquelle',

  // General FAQ
  faq_q1: 'Was ist Equalizer 19?',
  faq_a1:
    'Equalizer 19 ist eine professionelle Audio-Processing-Anwendung, die vollständig im Browser läuft. Sie bietet einen 19-Band parametrischen Equalizer, einen Dynamics Processor und Aufnahmefunktionen - alles ohne Installation oder Plugins.',
  faq_q2: 'Ist die Nutzung kostenlos?',
  faq_a2:
    'Ja, Equalizer 19 ist vollkommen kostenlos nutzbar. Es gibt keine versteckten Kosten, keine Registrierung erforderlich und keine Werbung.',
  faq_q3: 'Werden meine Audiodateien auf einen Server hochgeladen?',
  faq_a3:
    'Nein! Die gesamte Audio-Verarbeitung erfolgt lokal in deinem Browser. Es werden keine Daten an externe Server gesendet – deine Privatsphäre bleibt geschützt.',

  // Equalizer FAQ
  faq_eq_q1: 'Was bedeuten die 19 Bänder?',
  faq_eq_a1:
    'Die 19 Bänder sind logarithmisch in etwa Halboktav-Schritten verteilt und decken den gesamten Hörbereich von 20 Hz bis 20 kHz ab. Jedes Band kann um -12 bis +12 dB angepasst werden, um die Klangcharakteristik präzise zu formen.',
  faq_eq_q2: 'Was bewirken die verschiedenen Presets?',
  faq_eq_a2:
    "Die Presets sind vorkonfigurierte EQ-Kurven für verschiedene Musikgenres. 'Rock' betont Mitten und Höhen, 'Bass Boost' verstärkt tiefe Frequenzen, 'V-Shape' hebt Bässe und Höhen an, während Mitten abgesenkt werden. Eigene Einstellungen kannst du über das Speichern-Symbol als Preset sichern; sie bleiben im Browser erhalten.",
  faq_eq_q3: 'Was macht der Bypass-Button?',
  faq_eq_a3:
    'Der Bypass-Button umgeht den Equalizer vorübergehend, sodass du den Unterschied zwischen bearbeitetem und unbearbeitetem Audio hören kannst. Das ist nützlich, um deine Einstellungen zu überprüfen.',

  // Compressor FAQ
  faq_comp_q1: 'Wofür brauche ich einen Kompressor?',
  faq_comp_a1:
    'Ein Kompressor reduziert den Dynamikumfang von Audio, indem er laute Signale abschwächt. Das macht den Gesamtklang gleichmäßiger und kann Musik druckvoller klingen lassen.',
  faq_comp_q2: 'Was bedeuten Threshold und Ratio?',
  faq_comp_a2:
    'Threshold bestimmt, ab welchem Lautstärke-Pegel die Kompression einsetzt. Ratio gibt an, wie stark komprimiert wird - bei 4:1 werden 4 dB über dem Threshold zu 1 dB am Ausgang.',
  faq_comp_q3: 'Welches Preset sollte ich verwenden?',
  faq_comp_a3:
    "Das hängt von deinem Material ab: 'Gentle' für subtile Kompression, 'Vocal' für Sprachaufnahmen, 'Drums' für punchigen Sound, 'Master' für sanfte Gesamtkompression oder 'Limiter', um Übersteuerung zu verhindern.",

  // Recording FAQ
  faq_rec_q1: 'In welchen Formaten kann ich aufnehmen?',
  faq_rec_a1:
    'Du hast die Wahl: WAV ist verlustfrei und wahlweise mit 16 Bit (CD-Qualität), 24 Bit (Studio-Qualität) oder 32 Bit Float (ohne Clipping) verfügbar. WebM mit Opus-Codec erzeugt deutlich kleinere Dateien bei sehr guter Qualität. Für MP3 und weitere Formate kannst du unseren Audio-Konverter nutzen.',
  faq_rec_q2: 'Werden alle meine EQ-Einstellungen mit aufgenommen?',
  faq_rec_a2:
    'Ja! Die Aufnahme erfolgt am Ende der kompletten Verarbeitungskette – alle deine EQ-Anpassungen und Kompressor-Einstellungen sind im aufgenommenen Audio enthalten. Das gilt für die Playlist genauso wie für den Audio-Eingang (Line-In, Mikrofon, PC-Ton): Was du während der Aufnahme am Equalizer änderst, wird ab diesem Moment mit aufgenommen.',
  faq_rec_q3: 'Warum höre ich nichts während der Aufnahme?',
  faq_rec_a3:
    'Stell sicher, dass eine Audiodatei geladen ist und abgespielt wird. Die Aufnahme nimmt den Audio-Ausgang auf – wenn nichts abgespielt wird, wird auch nichts aufgenommen.',
  faq_rec_q4: 'Wo wird meine Aufnahme gespeichert?',
  faq_rec_a4:
    'Beim Speichern vergibst du einen Dateinamen. In Browsern, die es unterstützen (z. B. Chrome und Edge am Desktop), wählst du zusätzlich den Zielordner; sonst landet die Datei im Standard-Download-Ordner deines Browsers.',
  faq_rec_q5: 'Kann ich die Aufnahme verzögert starten?',
  faq_rec_a5:
    'Ja. Neben WAV/WebM in der Player-Leiste wählst du die Startverzögerung: sofort, 3, 5 oder 10 Sekunden. Nach einem Klick auf den Aufnahme-Knopf läuft ein gut sichtbarer Countdown in der Mitte des Bildschirms; die App bleibt dabei bedienbar, sodass du zum Beispiel noch die Wiedergabe starten kannst. Mit „Countdown abbrechen“, einem Klick auf die Sekundenanzeige in der Leiste oder der Esc-Taste brichst du ab. Deine Wahl bleibt gespeichert.',

  // Technical FAQ
  faq_tech_q1: 'Welche Browser werden unterstützt?',
  faq_tech_a1:
    'Equalizer 19 funktioniert in allen modernen Browsern: Chrome 90+, Firefox 88+, Safari 14.1+, Edge 90+ und Opera 76+. Für beste Performance empfehlen wir Chrome oder Firefox.',
  faq_tech_q2: 'Warum muss ich erst klicken, bevor Audio funktioniert?',
  faq_tech_a2:
    'Das ist eine Sicherheitsmaßnahme moderner Browser (Autoplay-Policy). Audio kann erst nach einer Benutzerinteraktion abgespielt werden, um ungewollte Geräusche zu verhindern.',
  faq_tech_q3: 'Kann ich Equalizer 19 offline nutzen?',
  faq_tech_a3:
    'Derzeit wird eine Internetverbindung zum Laden der Anwendung benötigt. Sobald geladen, erfolgt alle Verarbeitung jedoch lokal und benötigt keine weitere Serververbindung.',
  faq_in_q1: 'Wie bearbeite und nehme ich den Ton meines PCs auf?',
  faq_in_a1:
    'Wähle in der Karte „Eingangsquelle“ die Option „Audio-Eingang“ und als Gerät „PC-Ton (Systemaudio)“. Nach einem Klick auf „Eingang starten“ öffnet sich der Freigabe-Dialog des Browsers: „Gesamter Bildschirm“ wählen und den Haken „Systemaudio teilen“ setzen. Die App verwendet nur den Ton, nicht das Bild. Alles, was über dein Standard-Ausgabegerät läuft (z. B. YouTube oder Spotify), geht dann live durch Equalizer und Kompressor und lässt sich wie gewohnt als WAV oder WebM aufnehmen. Das funktioniert in Chrome und Edge unter Windows; unter macOS und Linux kann der Browser meist nur den Ton eines einzelnen Tabs teilen. Teilst du statt des ganzen Bildschirms einen Browser-Tab (z. B. YouTube), schaltet der Browser den Originalton dieses Tabs stumm und du hörst nur noch die bearbeitete Version; die App bleibt dabei im Vordergrund. Beenden kannst du mit „Eingang stoppen“ oder „Freigabe beenden“ in der Browser-Leiste.',
  faq_in_q2: 'Welche Eingänge kann ich verwenden?',
  faq_in_a2:
    'Alle Aufnahmegeräte, die dein System dem Browser bereitstellt: Line-In, Mikrofon, Audio-Interface oder „Stereomix“. Stereomix ist unter Windows oft ausgeblendet: Systemsteuerung → Sound → Registerkarte „Aufnahme“ → Rechtsklick in die Liste → „Deaktivierte Geräte anzeigen“ → „Stereomix“ per Rechtsklick aktivieren. Alternativ leitet ein virtuelles Audiokabel (z. B. VB-CABLE für Windows oder BlackHole für macOS) die Wiedergabe des PCs als Eingang weiter. Die Gerätenamen erscheinen, sobald du den Zugriff einmal erlaubt hast. Die Sprachfilter des Browsers (Echo- und Rauschunterdrückung, automatische Lautstärke) schaltet die App ab, damit Musik unverfälscht bleibt.',
  faq_in_q3: 'Was bewirkt „Mithören“?',
  faq_in_a3:
    'Mit „Mithören“ hörst du den bearbeiteten Ton über deine Lautsprecher. Der Schalter ist standardmäßig aus: Bei Mikrofon oder Stereomix über Lautsprecher würde der Ton erneut aufgenommen und es entsteht eine Rückkopplung – schalte ihn dort nur mit Kopfhörern oder einem virtuellen Kabel ein. Beim PC-Ton kommt es auf die Freigabe an: Teilst du einen Browser-Tab, schaltet die App Mithören automatisch ein und der Browser den Originalton des Tabs stumm – du hörst nur die bearbeitete Version. Teilst du den ganzen Bildschirm, läuft das Original weiter über deine Lautsprecher; mit Mithören hörst du Original und bearbeitete Version gleichzeitig. Nur die bearbeitete Version zu hören, geht dann mit einem virtuellen Audiokabel. Kann der Browser seinen eigenen Ton nicht aus der Freigabe ausschließen, ist Mithören beim PC-Ton gesperrt. Aufnahme und Pegel-Meter funktionieren immer, auch ohne Mithören.',
  faq_in_q4: 'Warum wird kein Gerät gefunden?',
  faq_in_a4:
    'Browser können nur Aufnahmegeräte öffnen – Lautsprecher und andere Ausgabegeräte (z. B. „High Definition Audio Device“) nicht. Stellt dein System kein Aufnahmegerät bereit, wählt die App automatisch „PC-Ton (Systemaudio)“ vor; damit nutzt du den Ton deines PCs über die Freigabe. Möchtest du Stereomix verwenden, aktiviere es wie unter „Welche Eingänge kann ich verwenden?“ beschrieben. Meldet die App, dass dein Betriebssystem den Zugriff blockiert, gib ihn frei: Windows unter Einstellungen → Datenschutz und Sicherheit → Mikrofon (auch für Desktop-Apps), macOS unter Systemeinstellungen → Datenschutz & Sicherheit → Mikrofon.',

  // FAQ CTA
  faq_cta_title: 'Noch Fragen?',
  faq_cta_desc: 'Probier Equalizer 19 einfach selbst aus – kostenlos und ohne Anmeldung.',

  // App UI translations
  promo_subtitle: 'Erlebe professionelle Audiobearbeitung direkt in deinem Browser',
  main_title: 'EQUALIZER 19 – Vue 3 Edition',
  rec: 'Aufn.',
  stop: 'Stop',
  download: 'Download',
  equalizer: 'Equalizer',
  reset: 'Zurücksetzen',
  dynamics: 'Dynamics Processor',
  threshold: 'Schwelle',
  knee: 'Knee',
  ratio: 'Verhältnis',
  attack: 'Attack',
  release: 'Release',
  target: 'Ziel',
  playlist: 'Playlist',
  clear: 'Löschen',
  tools_title: 'Weitere Audio-Tools',
  tools_subtitle:
    'Bearbeite deine Aufnahmen direkt weiter – kostenlos im Browser. Die Tools öffnen sich in einem neuen Tab.',
  tools_open: 'Öffnen',
  tools_new_tab: 'öffnet in neuem Tab',
  tool_converter_title: 'Audio-Konverter',
  tool_converter_desc: 'Aufnahmen in andere Formate umwandeln, z. B. MP3, WAV, FLAC, AAC oder OGG.',
  tool_cutter_title: 'Audio-Cutter',
  tool_cutter_desc: 'Aufnahmen zuschneiden und nur den gewünschten Ausschnitt behalten.',
  tool_normalizer_title: 'Audio-Normalisierer',
  tool_normalizer_desc: 'Lautstärke von Aufnahmen auf ein einheitliches Niveau bringen.',
  sharedFilesLoading: '{count} Datei(en) vom Audio Konverter werden importiert\u2026',
  sharedFilesLoaded: '{count} Datei(en) erfolgreich importiert',
  sharedFilesEmpty: 'Keine Dateien vom Audio Konverter gefunden',
  sharedFilesError: 'Fehler beim Importieren',
  play: 'Abspielen',
  pause: 'Pause',
  volume: 'Lautstärke',

  // Player controls
  player_select_files: 'Dateien auswählen',
  player_select_folder: 'Ordner hinzufügen',
  player_drop_hint: 'Dateien / Ordner ablegen',
  player_no_file: 'Dateien oder Ordner ablegen',
  player_prev: 'Zurück',
  player_next: 'Weiter',
  player_mute: 'Stummschalten',
  player_vol_hint: 'Lautstärke',
  player_tracks_added: '{count} Track(s) hinzugefügt',
  player_shuffle: 'Zufallswiedergabe',
  player_repeat_off: 'Wiederholung aus',
  player_repeat_all: 'Alle wiederholen',
  player_repeat_one: 'Titel wiederholen',

  // Recording
  rec_format_label: 'Aufnahmeformat',
  rec_format_wav: 'WAV (Unkomprimiert, verlustfrei)',
  rec_format_webm: 'WebM (Komprimiert, Opus)',
  rec_bit_depth: 'Bit-Tiefe der WAV-Datei',
  rec_bit_16: '16 Bit PCM (CD-Qualität)',
  rec_bit_24: '24 Bit PCM (Studio-Qualität)',
  rec_bit_32: '32 Bit Float (verlustfrei, kein Clipping)',
  rec_start: 'Aufnahme starten',
  rec_new: 'Neue Aufnahme',
  rec_pause: 'Aufnahme pausieren',
  rec_resume: 'Aufnahme fortsetzen',
  rec_paused: 'Pausiert',
  rec_delay: 'Startverzögerung der Aufnahme',
  rec_delay_none: 'Sofort',
  rec_delay_s: '{n} s',
  rec_countdown_title: 'Aufnahme startet in',
  rec_countdown_cancel: 'Countdown abbrechen',
  rec_countdown_hint: 'Esc bricht ab',
  rec_error_engine: 'AudioEngine nicht verfügbar',
  rec_error_start: 'Fehler beim Starten',
  rec_error_start_long: 'Fehler beim Starten der Aufnahme',
  rec_download_failed: 'Download fehlgeschlagen',

  // Download dialog
  dl_title: 'Aufnahme herunterladen',
  dl_filename_label: 'Dateiname',
  dl_name_placeholder: 'audio-export',
  dl_folder_hint_supported: 'Beim Speichern kannst du den Zielordner auswählen.',
  dl_folder_hint_unsupported:
    'Die Datei wird im Standard-Download-Ordner deines Browsers gespeichert.',
  dl_save: 'Speichern',
  dl_cancel: 'Abbrechen',
  dl_success: 'Datei gespeichert',

  // Equalizer
  eq_builtin_group: 'Integriert',
  eq_custom_group: 'Eigene Presets',
  eq_preset_delete: 'Preset löschen',
  eq_preset_save_title: 'Einstellung als Preset speichern',
  eq_save: 'Speichern',
  eq_cancel: 'Abbrechen',
  eq_preset_name_placeholder: 'Preset-Name eingeben …',
  eq_preset_saved: '"{name}" gespeichert',
  eq_preset_deleted: '"{name}" gelöscht',
  eq_preset_applied: '"{name}" angewendet',
  eq_bypassed: 'Equalizer deaktiviert',
  eq_active: 'Equalizer aktiviert',
  eq_reset_done: 'Equalizer zurückgesetzt',

  // Dynamics Processor
  comp_toggle_off: 'Deaktivieren',
  comp_toggle_on: 'Aktivieren',
  comp_cat_basic: 'Basis',
  comp_cat_genre: 'Genre',
  comp_cat_instrument: 'Instrument',
  comp_cat_mastering: 'Mastering',
  comp_preset_label: 'Preset',
  comp_preset_custom: 'Benutzerdefiniert',
  comp_params: 'Parameter',
  a11y_comp_preset: 'Kompressor-Preset wählen',

  // Playlist
  playlist_title: 'Playlist',
  playlist_empty: 'Keine Tracks in der Playlist',
  playlist_remove: 'Entfernen',
  playlist_removed: 'Track entfernt',
  playlist_drag_hint: 'Ziehen zum Sortieren',
  shortcuts_title: 'Tastenkürzel',
  shortcut_seek: '5 s vor/zurück',
  shortcut_track: 'Nächster/vorheriger Track',
  playlist_now_playing: 'Wird abgespielt',

  // Input source
  input_title: 'Eingangsquelle',
  input_mode_playlist: 'Playlist',
  input_mode_live: 'Audio-Eingang',
  input_device_label: 'Gerät',
  input_default: 'Standardeingang des Systems',
  input_device_n: 'Eingang {n}',
  input_group_inputs: 'Eingänge',
  input_group_playback: 'Wiedergabe des PCs',
  input_system_option: 'PC-Ton (Systemaudio)',
  input_start: 'Eingang starten',
  input_stop: 'Eingang stoppen',
  input_starting: 'Wird gestartet …',
  input_live_badge: 'Live',
  input_active: 'Aktiv: {name}',
  input_monitor: 'Mithören',
  input_monitor_locked: 'Beim PC-Ton in diesem Browser nicht verfügbar (Endlosschleife)',
  input_hint_tab_monitor:
    'Der geteilte Tab ist stummgeschaltet – du hörst nur die bearbeitete Version.',
  input_hint_tab_original:
    'Mithören ist aus: Du hörst den Originalton des Tabs, nicht die bearbeitete Version.',
  input_hint_tab_echo:
    'Dein Browser schaltet den geteilten Tab nicht stumm: Du hörst Original und bearbeitete Version gleichzeitig (Echo). Schalte Mithören aus oder nutze ein virtuelles Audiokabel.',
  input_hint_screen:
    'Beim ganzen Bildschirm läuft das Original weiter über die Lautsprecher. Nur die bearbeitete Version hörst du, wenn du stattdessen einen Browser-Tab teilst oder ein virtuelles Audiokabel nutzt.',
  input_help_link: 'Anleitung & Hilfe',
  input_err_unsupported: 'Dein Browser unterstützt keine Audio-Eingänge.',
  input_err_denied:
    'Der Zugriff auf den Audio-Eingang wurde verweigert. Erlaube ihn in den Browser-Einstellungen für diese Seite.',
  input_err_denied_system:
    'Dein Betriebssystem blockiert den Zugriff. Windows: Einstellungen → Datenschutz und Sicherheit → Mikrofon → „Mikrofonzugriff“ und den Zugriff für Desktop-Apps einschalten. macOS: Systemeinstellungen → Datenschutz & Sicherheit → Mikrofon → Browser erlauben.',
  input_err_not_found: 'Der gewählte Eingang wurde nicht gefunden. Wähle ein anderes Gerät.',
  input_err_no_devices:
    'Dein System stellt kein Aufnahmegerät bereit. Windows: Systemsteuerung → Sound → „Aufnahme“ → Rechtsklick → „Deaktivierte Geräte anzeigen“ → „Stereomix“ aktivieren – oder ein virtuelles Audiokabel (z. B. VB-CABLE) installieren. Danach erneut auf „Eingang starten“ klicken.',
  input_err_busy:
    'Der Eingang ist nicht verfügbar – eventuell wird er gerade von einem anderen Programm verwendet.',
  input_err_samplerate:
    'Die Abtastrate des Eingangs passt nicht zur Audio-Ausgabe. Stelle beide in den Soundeinstellungen auf denselben Wert (z. B. 48 kHz).',
  input_err_failed: 'Der Eingang konnte nicht gestartet werden.',
  input_err_ended: 'Die Verbindung zum Eingang wurde getrennt.',
  input_err_share_cancelled:
    'Die Freigabe wurde abgebrochen. Klicke erneut auf „Eingang starten“, wähle „Gesamter Bildschirm“ und setze den Haken „Systemaudio teilen“.',
  input_err_no_system_audio:
    'Es wurde kein Ton geteilt. Wähle im Freigabe-Dialog „Gesamter Bildschirm“ und setze den Haken „Systemaudio teilen“. Unter macOS und Linux kann der Browser meist nur den Ton eines einzelnen Tabs teilen.',
  input_err_system_unsupported:
    'Dein Browser kann den Ton des PCs nicht teilen. Nutze Chrome oder Edge unter Windows.',
  input_err_no_devices_system:
    'Dein System stellt kein Aufnahmegerät (Mikrofon, Line-In) bereit. Den Ton deines PCs kannst du trotzdem nutzen: „PC-Ton (Systemaudio)“ ist jetzt ausgewählt. Klicke erneut auf „Eingang starten“, wähle „Gesamter Bildschirm“ und setze den Haken „Systemaudio teilen“.',
  player_live_input: 'Live-Eingang',

  // Level Meter
  meter_title: 'Pegel-Meter',

  // Undo / redo (processing history)
  history_title: 'Verlauf',
  history_undo: 'Rückgängig',
  history_redo: 'Wiederholen',
  history_undo_hint: 'Rückgängig: {action}',
  history_redo_hint: 'Wiederholen: {action}',
  history_nothing_undo: 'Nichts rückgängig zu machen',
  history_nothing_redo: 'Nichts zu wiederholen',
  history_undone: 'Rückgängig gemacht: {action}',
  history_redone: 'Wiederholt: {action}',
  history_eq_band: 'EQ-Band {freq} Hz',
  history_eq_curve: 'EQ-Kurve',
  history_dyn_param: 'Kompressor: {param}',
  history_dyn_params: 'Kompressor-Einstellungen',
  history_dyn_on: 'Kompressor aktiviert',
  history_dyn_off: 'Kompressor deaktiviert',
  history_mixed: 'Mehrere Einstellungen',
  key_ctrl: 'Strg',

  // Accessibility labels
  a11y_eq_bypass: 'Equalizer umschalten',
  a11y_eq_band: '{freq} Hz Band, {gain} dB',
  a11y_eq_select_preset: 'EQ-Preset auswählen',
  a11y_eq_save_name: 'Name für neues Preset',
  a11y_dynamics_toggle: 'Dynamics Processor umschalten',
  a11y_threshold: 'Schwelle: {val} dB',
  a11y_ratio: 'Ratio: {val}:1',
  a11y_knee: 'Knee: {val} dB',
  a11y_attack: 'Attack: {val} ms',
  a11y_release: 'Release: {val} ms',
  a11y_volume: 'Lautstärke: {val}%',
  a11y_visualization: 'Frequenzspektrum-Visualisierung',
  a11y_meter_in: 'Eingangs-Pegel: {val} dBFS',
  a11y_meter_out: 'Ausgangs-Pegel: {val} dBFS',
}

/** Alle gültigen Übersetzungs-Schlüssel, abgeleitet aus der deutschen Tabelle. */
export type TranslationKey = keyof typeof de

export default de
