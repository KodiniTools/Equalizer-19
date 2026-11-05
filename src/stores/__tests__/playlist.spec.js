import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { usePlaylistStore } from '../playlist'

const revoke = vi.fn()
let urlCounter = 0

function files(n) {
  return Array.from({ length: n }, (_, i) => ({
    name: `track${i}.mp3`,
    size: 10,
    type: 'audio/mpeg',
  }))
}

describe('Playlist-Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    revoke.mockClear()
    urlCounter = 0
    vi.stubGlobal('URL', { createObjectURL: () => `blob:${urlCounter++}`, revokeObjectURL: revoke })
  })

  it('addFiles hängt Tracks an und wählt den ersten, wenn keiner gewählt war', () => {
    const playlist = usePlaylistStore()
    expect(playlist.hasPlaylist).toBe(false)
    const added = playlist.addFiles(files(2))
    expect(added).toHaveLength(2)
    expect(playlist.tracks.map((t) => t.name)).toEqual(['track0.mp3', 'track1.mp3'])
    expect(playlist.currentTrackIndex).toBe(0)
    expect(playlist.currentTrack.name).toBe('track0.mp3')
    expect(playlist.addTrack({ id: 9, name: 'x', url: 'blob:x' })).toBe(false)
    expect(playlist.currentTrackIndex).toBe(0)
  })

  it('removeTrack gibt die URL frei und hält den Index konsistent', () => {
    const playlist = usePlaylistStore()
    playlist.addFiles(files(3))
    playlist.currentTrackIndex = 2

    // Track vor dem aktuellen: Index rückt nach
    expect(playlist.removeTrack(0)).toEqual({ removedCurrent: false, nextIndex: 1 })
    expect(revoke).toHaveBeenCalledWith('blob:0')
    expect(playlist.currentTrackIndex).toBe(1)

    // Der aktuelle Track: Index -1, Nachfolger an gleicher Stelle
    expect(playlist.removeTrack(1)).toEqual({ removedCurrent: true, nextIndex: 0 })
    expect(playlist.currentTrackIndex).toBe(-1)

    expect(playlist.removeTrack(0)).toEqual({ removedCurrent: false, nextIndex: -1 })
    expect(playlist.hasPlaylist).toBe(false)
  })

  it('reorderTracks verschiebt und folgt dem aktuellen Track', () => {
    const playlist = usePlaylistStore()
    playlist.addFiles(files(3))
    playlist.reorderTracks(0, 2)
    expect(playlist.tracks.map((t) => t.name)).toEqual(['track1.mp3', 'track2.mp3', 'track0.mp3'])
    expect(playlist.currentTrackIndex).toBe(2)
  })

  it('Navigation: sequentiell, repeat-all und Shuffle-Verlauf', () => {
    const playlist = usePlaylistStore()
    playlist.addFiles(files(3))
    expect(playlist.canPlayPrevious).toBe(false)
    expect(playlist.getNextIndex()).toBe(1)
    playlist.currentTrackIndex = 2
    expect(playlist.canPlayNext).toBe(false)
    expect(playlist.getNextIndex()).toBe(-1)

    expect(playlist.cycleRepeat()).toBe('all')
    expect(playlist.canPlayNext).toBe(true)
    expect(playlist.getNextIndex()).toBe(0)

    expect(playlist.toggleShuffle()).toBe(true)
    expect(playlist.popShuffleStep()).toBe(-1)
    playlist.rememberShuffleStep()
    expect(playlist.popShuffleStep()).toBe(2)
    const next = playlist.getNextIndex()
    expect(next).not.toBe(2)
    expect([0, 1]).toContain(next)
  })

  it('clear leert die Liste und gibt alle URLs frei', () => {
    const playlist = usePlaylistStore()
    playlist.addFiles(files(2))
    playlist.clear()
    expect(revoke).toHaveBeenCalledTimes(2)
    expect(playlist.tracks).toEqual([])
    expect(playlist.currentTrackIndex).toBe(-1)
  })
})
