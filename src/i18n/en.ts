import type { TranslationKey } from './de'

// Record<TranslationKey, string> macht fehlende oder überzählige EN-Schlüssel zum Compile-Fehler.
const en: Record<TranslationKey, string> = {
  // Brand & Navigation
  nav_start_app: 'Start App',
  app_back_home: 'Back to home',
  app_help: 'Help & FAQ',
  app_tabs_label: 'Section',
  app_tab_source: 'Source',
  app_tab_eq: 'Equalizer',
  app_tab_dynamics: 'Dynamics',
  language: 'Language',
  theme: 'Theme',

  // Landing page
  lp_eyebrow: 'Free · In your browser · No installation',
  lp_title: 'Professional sound, right in your browser',
  lp_subtitle:
    '19-band equalizer, compressor and lossless recording – all processing happens on your device. No uploads, no sign-up.',
  lp_cta_start: 'Launch app',
  lp_cta_learn: 'See features',
  lp_trust_uploads: '0 uploads',
  lp_trust_account: 'No account needed',
  lp_trust_browsers: 'Chrome · Firefox · Safari',
  lp_demo_title: 'Try it out',
  lp_demo_presets: 'Choose a preset',
  lp_demo_custom: 'Custom curve',
  lp_fact_bands: 'EQ bands from 20 Hz to 20 kHz',
  lp_fact_presets: 'Presets for equalizer and compressor',
  lp_fact_bits_value: '32-bit',
  lp_fact_bits: 'Float WAV, recorded losslessly',
  lp_fact_uploads: 'Uploads – everything stays local',
  lp_modules_title: 'Four tools, one signal chain',
  lp_modules_subtitle:
    'Audio input, equalizer, compressor and recorder work together in real time – you hear every change instantly.',
  lp_mod_input_title: 'Audio input',
  lp_mod_input_desc:
    "Connect a live source and process it in real time – including your PC's own sound.",
  lp_mod_input_1: 'PC sound: YouTube, Spotify and more live through EQ and compressor',
  lp_mod_input_2: 'Line-in, microphone or audio interface',
  lp_mod_input_3: 'Record the processed version straight to WAV or WebM',
  lp_mod_eq_title: 'Equalizer',
  lp_mod_eq_desc: 'Shape your sound with 19 finely spaced bands.',
  lp_mod_eq_1: '±12 dB per band',
  lp_mod_eq_2: '10 presets plus your own',
  lp_mod_eq_3: 'Bypass for instant A/B comparison',
  lp_mod_comp_title: 'Compressor',
  lp_mod_comp_desc: 'Tames peaks for a dense, even sound.',
  lp_mod_comp_1: 'Threshold, ratio, knee, attack, release',
  lp_mod_comp_2: '15 presets from podcast to limiter',
  lp_mod_comp_3: 'Input and output level meters',
  lp_mod_rec_title: 'Recording & export',
  lp_mod_rec_desc: 'Records the processed signal – with every effect applied.',
  lp_mod_rec_1: 'WAV at 16, 24 or 32 bit',
  lp_mod_rec_2: 'WebM (Opus) for small files',
  lp_mod_rec_3: 'Choose your own file name',
  lp_steps_title: 'Three steps to the result',
  lp_step1_title: 'Load audio',
  lp_step1_desc: 'Add files or whole folders by click or drag & drop – or start the audio input.',
  lp_step2_title: 'Shape the sound',
  lp_step2_desc: 'Adjust equalizer and compressor or pick a preset.',
  lp_step3_title: 'Record & save',
  lp_step3_desc: 'Record the result and save it as WAV or WebM.',
  lp_details_title: 'Thought through to the details',
  lp_det_privacy_title: 'Private',
  lp_det_privacy_desc: 'Your files never leave your device – there is no server processing them.',
  lp_det_realtime_title: 'Real time',
  lp_det_realtime_desc:
    'Web Audio API and AudioWorklet process the sound right in the browser, no plugins.',
  lp_det_viz_title: 'Visualization',
  lp_det_viz_desc: 'Spectrum analyzer and level meters show what happens in the signal.',
  lp_det_playlist_title: 'Playlist',
  lp_det_playlist_desc: 'Multiple tracks, shuffle, repeat and drag & drop reordering.',
  lp_det_keys_title: 'Keyboard shortcuts',
  lp_det_keys_desc: 'Play, seek, volume, track changes and undo/redo straight from the keyboard.',
  lp_det_devices_title: 'Works everywhere',
  lp_det_devices_desc: 'Desktop, tablet and phone – with light and dark themes.',
  lp_final_title: 'Ready to start?',
  lp_final_desc: 'Start now – free and without sign-up.',
  // Landing page: local navigation + blog cards
  lp_nav_label: 'Page navigation',
  lp_nav_home: 'Home',
  lp_nav_features: 'Features',
  lp_nav_blog: 'Blog',
  lp_nav_faq: 'FAQ',
  lp_blog_title: 'From the Blog',
  lp_blog_subtitle: 'Guides and background articles about Equalizer 19 on kodinitools.com.',
  lp_blog_read_more: 'Read article',
  lp_blog_minutes: 'min',

  // FAQ Page
  faq_title: 'Frequently Asked Questions',
  faq_subtitle: 'Everything you need to know about Equalizer 19',
  faq_eyebrow: 'Help & answers',
  faq_nav_label: 'Topics',
  faq_cat_general: 'General Questions',
  faq_cat_equalizer: 'Equalizer',
  faq_cat_compressor: 'Compressor',
  faq_cat_recording: 'Recording',
  faq_cat_technical: 'Technical',
  faq_cat_input: 'Input source',

  // General FAQ
  faq_q1: 'What is Equalizer 19?',
  faq_a1:
    'Equalizer 19 is a professional audio processing application that runs entirely in your browser. It offers a 19-band parametric equalizer, a dynamics processor, and recording capabilities - all without installation or plugins.',
  faq_q2: 'Is it free to use?',
  faq_a2:
    'Yes, Equalizer 19 is completely free to use. There are no hidden costs, no registration required, and no advertisements.',
  faq_q3: 'Are my audio files uploaded to a server?',
  faq_a3:
    'No! All audio processing happens entirely locally in your browser. No data is sent to external servers. Your privacy is guaranteed.',

  // Equalizer FAQ
  faq_eq_q1: 'What do the 19 bands mean?',
  faq_eq_a1:
    'The 19 bands are spaced logarithmically in roughly half-octave steps and cover the full audible range from 20 Hz to 20 kHz. Each band can be adjusted from -12 to +12 dB to precisely shape the sound character.',
  faq_eq_q2: 'What do the different presets do?',
  faq_eq_a2:
    "The presets are preconfigured EQ curves for different music genres. 'Rock' emphasizes mids and highs, 'Bass Boost' enhances low frequencies, 'V-Shape' boosts bass and treble while cutting mids. You can save your own settings as a preset via the save icon; they are kept in your browser.",
  faq_eq_q3: 'What does the Bypass button do?',
  faq_eq_a3:
    'The Bypass button temporarily bypasses the equalizer, allowing you to hear the difference between processed and unprocessed audio. This is useful for checking your settings.',

  // Compressor FAQ
  faq_comp_q1: 'Why do I need a compressor?',
  faq_comp_a1:
    'A compressor reduces the dynamic range of audio by attenuating loud signals. This makes the overall sound more consistent and can make music sound more powerful.',
  faq_comp_q2: 'What do Threshold and Ratio mean?',
  faq_comp_a2:
    'Threshold determines at what volume level compression begins. Ratio indicates how much compression is applied - at 4:1, 4 dB above the threshold becomes 1 dB at the output.',
  faq_comp_q3: 'Which preset should I use?',
  faq_comp_a3:
    "It depends on your material: 'Gentle' for subtle compression, 'Vocal' for voice recordings, 'Drums' for punchy sound, 'Master' for gentle overall compression, or 'Limiter' to prevent clipping.",

  // Recording FAQ
  faq_rec_q1: 'What formats can I record in?',
  faq_rec_a1:
    'You can choose: WAV is lossless and available at 16-bit (CD quality), 24-bit (studio quality) or 32-bit float (no clipping). WebM with the Opus codec produces much smaller files at very good quality. For MP3 and other formats you can use our Audio Converter.',
  faq_rec_q2: 'Are all my EQ settings recorded?',
  faq_rec_a2:
    'Yes! Recording happens after the complete audio processing chain - all your EQ adjustments and compressor settings will be included in the recorded audio. This applies to the playlist as well as to the audio input (line-in, microphone, PC audio): whatever you change on the equalizer while recording is captured from that moment on.',
  faq_rec_q3: "Why don't I hear anything during recording?",
  faq_rec_a3:
    'Make sure an audio file is loaded and playing. The recording captures the audio output - if nothing is playing, nothing will be recorded.',
  faq_rec_q4: 'Where is my recording saved?',
  faq_rec_a4:
    'When saving, you choose a file name. In browsers that support it (e.g. Chrome and Edge on desktop) you can also pick the target folder; otherwise the file goes to your browser’s default download folder.',
  faq_rec_q5: 'Can I start recording with a delay?',
  faq_rec_a5:
    'Yes. Next to WAV/WebM in the player bar you choose the start delay: instant, 3, 5 or 10 seconds. After clicking the record button a clearly visible countdown runs in the middle of the screen; the app stays usable, so you can still start playback, for example. Cancel with “Cancel countdown”, a click on the seconds display in the bar or the Esc key. Your choice is remembered.',

  // Technical FAQ
  faq_tech_q1: 'Which browsers are supported?',
  faq_tech_a1:
    'Equalizer 19 works in all modern browsers: Chrome 90+, Firefox 88+, Safari 14.1+, Edge 90+, and Opera 76+. For best performance, we recommend Chrome or Firefox.',
  faq_tech_q2: 'Why do I need to click before audio works?',
  faq_tech_a2:
    'This is a security measure in modern browsers (Autoplay Policy). Audio can only be played after user interaction to prevent unwanted sounds.',
  faq_tech_q3: 'Can I use Equalizer 19 offline?',
  faq_tech_a3:
    'Currently, an internet connection is required to load the application. Once loaded, however, all processing happens locally and requires no further server connection.',
  faq_in_q1: 'How do I process and record my PC’s audio?',
  faq_in_a1:
    'In the “Input source” card choose “Audio input” and select “PC audio (system audio)” as device. After clicking “Start input” the browser’s share dialog opens: choose “Entire screen” and tick “Share system audio”. The app only uses the sound, not the picture. Everything playing through your default output device (e.g. YouTube or Spotify) then runs live through equalizer and compressor and can be recorded as WAV or WebM as usual. This works in Chrome and Edge on Windows; on macOS and Linux the browser can usually only share a single tab’s sound. If you share a browser tab (e.g. YouTube) instead of the entire screen, the browser mutes that tab’s original sound and you hear only the processed version; the app stays in front. Stop it with “Stop input” or “Stop sharing” in the browser bar.',
  faq_in_q2: 'Which inputs can I use?',
  faq_in_a2:
    'All recording devices your system offers to the browser: line-in, microphone, audio interface or “Stereo Mix”. On Windows Stereo Mix is often hidden: Control Panel → Sound → “Recording” tab → right-click the list → “Show Disabled Devices” → right-click “Stereo Mix” → Enable. Alternatively a virtual audio cable (e.g. VB-CABLE for Windows or BlackHole for macOS) passes your PC’s playback on as an input. Device names appear once you have allowed access. The app switches off the browser’s voice filters (echo and noise suppression, automatic gain) so music stays unaltered.',
  faq_in_q3: 'What does “Monitor” do?',
  faq_in_a3:
    'With “Monitor” you hear the processed sound through your speakers. It is off by default: with a microphone or Stereo Mix over speakers the sound would be captured again and cause feedback – only enable it with headphones or a virtual cable there. With PC audio it depends on what you share: with a browser tab the app turns monitoring on automatically and the browser mutes the tab’s original sound – you hear only the processed version. With the entire screen the original keeps playing through your speakers; with monitoring you hear original and processed sound at the same time. Hearing only the processed version then requires a virtual audio cable. If the browser cannot exclude its own sound from the capture, monitoring is locked for PC audio. Recording and level meters always work, even without monitoring.',
  faq_in_q4: 'Why is no device found?',
  faq_in_a4:
    'Browsers can only open recording devices – not speakers or other output devices (e.g. “High Definition Audio Device”). If your system offers no recording device, the app preselects “PC audio (system audio)”, which uses your PC’s sound via sharing. To use Stereo Mix, enable it as described under “Which inputs can I use?”. If the app reports that your operating system blocks access, allow it: on Windows under Settings → Privacy & security → Microphone (including desktop apps), on macOS under System Settings → Privacy & Security → Microphone.',

  // FAQ CTA
  faq_cta_title: 'Still have questions?',
  faq_cta_desc: 'Just try Equalizer 19 yourself – free and without sign-up.',

  // App UI translations
  promo_subtitle: 'Experience professional audio processing directly in your browser',
  main_title: 'EQUALIZER 19 – Vue 3 Edition',
  rec: 'Rec',
  stop: 'Stop',
  download: 'Download',
  equalizer: 'Equalizer',
  reset: 'Reset',
  dynamics: 'Dynamics Processor',
  threshold: 'Threshold',
  knee: 'Knee',
  ratio: 'Ratio',
  attack: 'Attack',
  release: 'Release',
  target: 'Target',
  playlist: 'Playlist',
  clear: 'Clear',
  tools_title: 'More audio tools',
  tools_subtitle:
    'Keep working on your recordings – free, right in your browser. Tools open in a new tab.',
  tools_open: 'Open',
  tools_new_tab: 'opens in a new tab',
  tool_converter_title: 'Audio Converter',
  tool_converter_desc: 'Convert recordings to other formats such as MP3, WAV, FLAC, AAC or OGG.',
  tool_cutter_title: 'Audio Cutter',
  tool_cutter_desc: 'Trim recordings and keep just the part you need.',
  tool_normalizer_title: 'Audio Normalizer',
  tool_normalizer_desc: 'Bring recordings to a consistent loudness level.',
  sharedFilesLoading: 'Importing {count} file(s) from Audio Converter\u2026',
  sharedFilesLoaded: '{count} file(s) successfully imported',
  sharedFilesEmpty: 'No files found from Audio Converter',
  sharedFilesError: 'Error importing files',
  play: 'Play',
  pause: 'Pause',
  volume: 'Volume',

  // Player controls
  player_select_files: 'Select files',
  player_select_folder: 'Add folder',
  player_drop_hint: 'Drop files / folder here',
  player_no_file: 'Drop files or folder here',
  player_prev: 'Previous',
  player_next: 'Next',
  player_mute: 'Mute',
  player_vol_hint: 'Volume',
  player_tracks_added: '{count} track(s) added',
  player_shuffle: 'Shuffle',
  player_repeat_off: 'Repeat off',
  player_repeat_all: 'Repeat all',
  player_repeat_one: 'Repeat one',

  // Recording
  rec_format_label: 'Recording format',
  rec_format_wav: 'WAV (Uncompressed, lossless)',
  rec_format_webm: 'WebM (Compressed, Opus)',
  rec_bit_depth: 'WAV bit depth',
  rec_bit_16: '16-bit PCM (CD quality)',
  rec_bit_24: '24-bit PCM (studio quality)',
  rec_bit_32: '32-bit float (lossless, no clipping)',
  rec_start: 'Start recording',
  rec_new: 'New recording',
  rec_delay: 'Recording start delay',
  rec_delay_none: 'Instant',
  rec_delay_s: '{n} s',
  rec_countdown_title: 'Recording starts in',
  rec_countdown_cancel: 'Cancel countdown',
  rec_countdown_hint: 'Press Esc to cancel',
  rec_error_engine: 'Audio engine unavailable',
  rec_error_start: 'Failed to start',
  rec_error_start_long: 'Failed to start recording',
  rec_download_failed: 'Download failed',

  // Download dialog
  dl_title: 'Download recording',
  dl_filename_label: 'File name',
  dl_name_placeholder: 'audio-export',
  dl_folder_hint_supported: 'You can choose the target folder when saving.',
  dl_folder_hint_unsupported: "The file will be saved to your browser's default download folder.",
  dl_save: 'Save',
  dl_cancel: 'Cancel',
  dl_success: 'File saved',

  // Equalizer
  eq_builtin_group: 'Built-in',
  eq_custom_group: 'My Presets',
  eq_preset_delete: 'Delete preset',
  eq_preset_save_title: 'Save as preset',
  eq_save: 'Save',
  eq_cancel: 'Cancel',
  eq_preset_name_placeholder: 'Enter preset name …',
  eq_preset_saved: '"{name}" saved',
  eq_preset_deleted: '"{name}" deleted',
  eq_preset_applied: '"{name}" applied',
  eq_bypassed: 'Equalizer bypassed',
  eq_active: 'Equalizer enabled',
  eq_reset_done: 'Equalizer reset',

  // Dynamics Processor
  comp_toggle_off: 'Disable',
  comp_toggle_on: 'Enable',
  comp_cat_basic: 'Basic',
  comp_cat_genre: 'Genre',
  comp_cat_instrument: 'Instrument',
  comp_cat_mastering: 'Mastering',
  comp_preset_label: 'Preset',
  comp_preset_custom: 'Custom',
  comp_params: 'Parameters',
  a11y_comp_preset: 'Choose compressor preset',

  // Playlist
  playlist_title: 'Playlist',
  playlist_empty: 'No tracks in playlist',
  playlist_remove: 'Remove',
  playlist_removed: 'Track removed',
  playlist_drag_hint: 'Drag to reorder',
  shortcuts_title: 'Keyboard shortcuts',
  shortcut_seek: 'Seek ±5 s',
  shortcut_track: 'Next/previous track',
  playlist_now_playing: 'Now playing',

  // Input source
  input_title: 'Input source',
  input_mode_playlist: 'Playlist',
  input_mode_live: 'Audio input',
  input_device_label: 'Device',
  input_default: 'System default input',
  input_device_n: 'Input {n}',
  input_group_inputs: 'Inputs',
  input_group_playback: 'PC playback',
  input_system_option: 'PC audio (system audio)',
  input_start: 'Start input',
  input_stop: 'Stop input',
  input_starting: 'Starting …',
  input_live_badge: 'Live',
  input_active: 'Active: {name}',
  input_monitor: 'Monitor',
  input_monitor_locked: 'Not available for PC audio in this browser (endless loop)',
  input_hint_tab_monitor: 'The shared tab is muted – you hear only the processed version.',
  input_hint_tab_original:
    'Monitoring is off: you hear the tab’s original sound, not the processed version.',
  input_hint_tab_echo:
    'Your browser does not mute the shared tab: you hear the original and the processed version at the same time (echo). Turn monitoring off or use a virtual audio cable.',
  input_hint_screen:
    'With the entire screen the original keeps playing through your speakers. To hear only the processed version, share a browser tab instead or use a virtual audio cable.',
  input_help_link: 'Guide & help',
  input_err_unsupported: 'Your browser does not support audio inputs.',
  input_err_denied:
    'Access to the audio input was denied. Allow it in the browser settings for this site.',
  input_err_denied_system:
    'Your operating system blocks access. Windows: Settings → Privacy & security → Microphone → turn on “Microphone access” and access for desktop apps. macOS: System Settings → Privacy & Security → Microphone → allow your browser.',
  input_err_not_found: 'The selected input was not found. Choose another device.',
  input_err_no_devices:
    'Your system offers no recording device. Windows: Control Panel → Sound → “Recording” → right-click → “Show Disabled Devices” → enable “Stereo Mix” – or install a virtual audio cable (e.g. VB-CABLE). Then click “Start input” again.',
  input_err_busy: 'The input is not available – it may be in use by another program.',
  input_err_samplerate:
    'The input’s sample rate does not match the audio output. Set both to the same value in your sound settings (e.g. 48 kHz).',
  input_err_failed: 'The input could not be started.',
  input_err_ended: 'The connection to the input was lost.',
  input_err_share_cancelled:
    'Sharing was cancelled. Click “Start input” again, choose “Entire screen” and tick “Share system audio”.',
  input_err_no_system_audio:
    'No sound was shared. In the share dialog choose “Entire screen” and tick “Share system audio”. On macOS and Linux the browser can usually only share a single tab’s sound.',
  input_err_system_unsupported:
    'Your browser cannot share the PC’s sound. Use Chrome or Edge on Windows.',
  input_err_no_devices_system:
    'Your system offers no recording device (microphone, line-in). You can still use your PC’s audio: “PC audio (system audio)” is now selected. Click “Start input” again, choose “Entire screen” and tick “Share system audio”.',
  player_live_input: 'Live input',

  // Level Meter
  meter_title: 'Level Meter',

  // Undo / redo (processing history)
  history_title: 'History',
  history_undo: 'Undo',
  history_redo: 'Redo',
  history_undo_hint: 'Undo: {action}',
  history_redo_hint: 'Redo: {action}',
  history_nothing_undo: 'Nothing to undo',
  history_nothing_redo: 'Nothing to redo',
  history_undone: 'Undone: {action}',
  history_redone: 'Redone: {action}',
  history_eq_band: 'EQ band {freq} Hz',
  history_eq_curve: 'EQ curve',
  history_dyn_param: 'Compressor: {param}',
  history_dyn_params: 'Compressor settings',
  history_dyn_on: 'Compressor enabled',
  history_dyn_off: 'Compressor disabled',
  history_mixed: 'Several settings',
  key_ctrl: 'Ctrl',

  // Accessibility labels
  a11y_eq_bypass: 'Toggle equalizer',
  a11y_eq_band: '{freq} Hz band, {gain} dB',
  a11y_eq_select_preset: 'Select EQ preset',
  a11y_eq_save_name: 'New preset name',
  a11y_dynamics_toggle: 'Toggle dynamics processor',
  a11y_threshold: 'Threshold: {val} dB',
  a11y_ratio: 'Ratio: {val}:1',
  a11y_knee: 'Knee: {val} dB',
  a11y_attack: 'Attack: {val} ms',
  a11y_release: 'Release: {val} ms',
  a11y_volume: 'Volume: {val}%',
  a11y_visualization: 'Frequency spectrum visualization',
  a11y_meter_in: 'Input level: {val} dBFS',
  a11y_meter_out: 'Output level: {val} dBFS',
}

export default en
