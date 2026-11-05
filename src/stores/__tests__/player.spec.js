import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { usePlayerStore } from '../player'
import { usePlaylistStore } from '../playlist'

/** HTMLAudioElement-Ersatz: jsdom implementiert load/play nicht. */
class FakeAudio {
  constructor() {
    this.src = ''
    this.paused = true
    this.currentTime = 0
    this.volume = 1
    this.listeners = {}
    FakeAudio.instances.push(this)
  }
  addEventListener(event, handler) {
    this.listeners[event] = handler
  }
  removeEventListener(event) {
    delete this.listeners[event]
  }
  load() {}
  async play() {
    this.paused = false
  }
  pause() {
    this.paused = true
  }
}
FakeAudio.instances = []

function files(n) {
  return Array.from({ length: n }, (_, i) => ({ name: `t${i}.mp3`, size: 1, type: 'audio/mpeg' }))
}

describe('Player-Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    FakeAudio.instances = []
    vi.stubGlobal('Audio', FakeAudio)
    vi.stubGlobal('URL', { createObjectURL: (b) => `blob:${b.name}`, revokeObjectURL: () => {} })
    // Ohne Web Audio in jsdom meldet die Engine den fehlenden AudioContext
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('addFiles lädt den ersten Track in das Audio-Element', async () => {
    const player = usePlayerStore()
    const playlist = usePlaylistStore()
    player.addFiles(files(2))
    await Promise.resolve()
    expect(playlist.currentTrackIndex).toBe(0)
    expect(FakeAudio.instances[0].src).toBe('blob:t0.mp3')

    // Weitere Dateien ändern den geladenen Track nicht
    player.addFiles(files(1))
    expect(FakeAudio.instances[0].src).toBe('blob:t0.mp3')
    expect(playlist.tracks).toHaveLength(3)
  })

  it('play/pause/stop spiegeln den Zustand, removeTrack des aktuellen stoppt und lädt den Nachfolger', async () => {
    const player = usePlayerStore()
    const playlist = usePlaylistStore()
    player.addFiles(files(2))
    await player.play()
    const audio = FakeAudio.instances[0]
    expect(player.isPlaying).toBe(true)
    expect(audio.paused).toBe(false)

    player.pause()
    expect(player.isPlaying).toBe(false)
    expect(player.isPaused).toBe(true)

    player.removeTrack(0)
    await Promise.resolve()
    expect(audio.paused).toBe(true)
    expect(player.isPaused).toBe(false)
    expect(playlist.currentTrackIndex).toBe(0)
    expect(audio.src).toBe('blob:t1.mp3')
  })

  it('am Ende eines Tracks folgt der nächste, mit repeat-one derselbe', async () => {
    const player = usePlayerStore()
    const playlist = usePlaylistStore()
    player.addFiles(files(2))
    await player.play()
    const audio = FakeAudio.instances[0]

    audio.listeners.ended()
    await vi.waitFor(() => expect(audio.src).toBe('blob:t1.mp3'))
    expect(playlist.currentTrackIndex).toBe(1)

    playlist.repeatMode = 'one'
    audio.listeners.ended()
    await vi.waitFor(() => expect(player.isPlaying).toBe(true))
    expect(playlist.currentTrackIndex).toBe(1)
  })

  it('Lautstärke und Stummschaltung wirken auf das Audio-Element', async () => {
    const player = usePlayerStore()
    player.addFiles(files(1))
    const audio = FakeAudio.instances[0]
    player.setVolume(0.5)
    await Promise.resolve()
    expect(audio.volume).toBe(0.5)
    player.toggleMute()
    await Promise.resolve()
    expect(audio.volume).toBe(0)
    player.setVolume(2)
    expect(player.volume).toBe(1)
  })
})
