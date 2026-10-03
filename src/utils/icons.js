/**
 * Inline icon set (24×24 grid), drawn as strokes unless `fill` is set.
 * Replaces the Font Awesome classes previously used in the components.
 * Add an icon here and use it with <AppIcon name="…" />.
 */
const SPEAKER = 'M4 9v6h4l5 4V5L8 9H4z'

export const ICONS = {
  alert: { d: 'M12 4v10M12 19h.01' },
  check: { d: 'M4 12.5l5 5L20 6.5' },
  'chevron-down': { d: 'M6 9l6 6 6-6' },
  close: { d: 'M6 6l12 12M18 6 6 18' },
  convert: { d: 'M4 12a8 8 0 0 1 14-5.3L20 9M20 4v5h-5M20 12a8 8 0 0 1-14 5.3L4 15M4 20v-5h5' },
  download: { d: 'M12 4v12m-5-5 5 5 5-5M4 20h16' },
  error: { d: 'M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18zM12 8v4M12 16h.01' },
  external: { d: 'M14 4h6v6M20 4l-9 9M18 13v6H5V6h6' },
  'file-audio': {
    d: 'M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9zM14 3v6h6M10 17v-4l4-1v4',
  },
  folder: { d: 'M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z' },
  grip: { d: 'M9 6h.01M9 12h.01M9 18h.01M15 6h.01M15 12h.01M15 18h.01', width: 3 },
  info: { d: 'M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18zM12 11v5M12 8h.01' },
  keyboard: {
    d: 'M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2zM6 10h.01M10 10h.01M14 10h.01M18 10h.01M8 14h8',
  },
  list: { d: 'M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01' },
  meter: { d: 'M4 18v-3M9 18v-7M14 18V7M19 18V4' },
  microphone: {
    d: 'M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3zM5 11a7 7 0 0 0 14 0M12 18v3M8 21h8',
  },
  music: {
    d: 'M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM21 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z',
  },
  next: { d: 'M6 5v14l10-7zM18 5h2v14h-2z', fill: true },
  pause: { d: 'M6 4h4v16H6zM14 4h4v16h-4z', fill: true },
  play: { d: 'M7 4.5v15l12-7.5z', fill: true },
  power: { d: 'M12 3v9M6.3 6.3a8 8 0 1 0 11.4 0' },
  prev: { d: 'M18 5v14L8 12zM4 5h2v14H4z', fill: true },
  record: { d: 'M12 5a7 7 0 1 1 0 14 7 7 0 0 1 0-14z', fill: true },
  redo: { d: 'M15 14l5-5-5-5M20 9H10a6 6 0 0 0 0 12h3' },
  repeat: { d: 'M17 1l4 4-4 4M3 11V9a4 4 0 0 1 4-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 0 1-4 4H3' },
  save: { d: 'M5 4h11l3 3v13H5zM8 4v5h7V4M8 20v-6h8v6' },
  scissors: {
    d: 'M6 3a3 3 0 1 1 0 6 3 3 0 0 1 0-6zM6 15a3 3 0 1 1 0 6 3 3 0 0 1 0-6zM20 4 8.1 15.9M14.5 14.5 20 20M8.1 8.1 12 12',
  },
  shuffle: { d: 'M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5' },
  sliders: { d: 'M4 6h8M16 6h4M4 12h3M11 12h9M4 18h12M20 18h.01M14 3v6M9 9v6M16 15v6' },
  spinner: { d: 'M12 3a9 9 0 0 1 9 9' },
  stop: { d: 'M6 6h12v12H6z', fill: true },
  success: { d: 'M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18zM8 12l3 3 5-6' },
  timer: { d: 'M12 5a8 8 0 1 1 0 16 8 8 0 0 1 0-16zM12 9v4l2 2M9 3h6' },
  trash: { d: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v5M14 11v5' },
  undo: { d: 'M9 14 4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3' },
  upload: { d: 'M12 16V4m-5 5 5-5 5 5M4 20h16' },
  'volume-high': { d: `${SPEAKER}M16 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12` },
  'volume-low': { d: `${SPEAKER}M16 9a4 4 0 0 1 0 6` },
  'volume-mute': { d: `${SPEAKER}M17 9l4 6M21 9l-4 6` },
  warning: { d: 'M12 3 2 21h20zM12 10v4M12 18h.01' },
  wave: { d: 'M3 12h3l2-6 3 12 3-9 2 6 2-3h3' },
}

export const ICON_NAMES = Object.keys(ICONS)
