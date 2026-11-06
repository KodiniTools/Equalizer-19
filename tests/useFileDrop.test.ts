// @vitest-environment node
import { test } from 'vitest'
import assert from 'node:assert/strict'
import { getAudioFiles, useFileDrop } from '../src/composables/useFileDrop'

/** Datei-Attrappe: getAudioFiles liest nur name und type. */
const file = (name: string, type = '') => ({ name, type }) as File

/** Die Fakes decken ab, was useFileDrop liest; die Casts markieren diese Grenze. */
const asEvent = (event: object) => event as unknown as Event
const asDragEvent = (event: object) => event as unknown as DragEvent

test('getAudioFiles accepts audio MIME types and known extensions', () => {
  const files = [
    file('a.mp3'),
    file('b.txt', 'text/plain'),
    file('c', 'audio/ogg'),
    file('D.FLAC'),
    file('e.png', 'image/png'),
  ]
  assert.deepEqual(
    getAudioFiles(files).map((f) => f.name),
    ['a.mp3', 'c', 'D.FLAC']
  )
})

test('handleFileSelect forwards audio files and resets the input', () => {
  const received: File[][] = []
  const { handleFileSelect } = useFileDrop((files) => received.push(files))
  const target = { files: [file('a.wav'), file('b.doc')], value: 'C:\\fake\\a.wav' }
  handleFileSelect(asEvent({ target }))
  assert.deepEqual(received, [[target.files[0]]])
  assert.equal(target.value, '')

  handleFileSelect(asEvent({ target: { files: [file('x.doc')], value: 'x' } }))
  assert.equal(received.length, 1)
})

test('handleDrop resets the drag state and forwards dropped files', async () => {
  const received: File[][] = []
  const { isDragOver, onDragOver, handleDrop } = useFileDrop((files) => received.push(files))
  onDragOver()
  assert.equal(isDragOver.value, true)
  await handleDrop(asDragEvent({ dataTransfer: { files: [file('a.m4a')], items: [] } }))
  assert.equal(isDragOver.value, false)
  assert.equal(received[0][0].name, 'a.m4a')
})

// Minimal FileSystemEntry mocks (webkitGetAsEntry API)
interface FakeFileEntry {
  isFile: true
  isDirectory: false
  file(ok: (f: File) => void): void
}
interface FakeDirEntry {
  isFile: false
  isDirectory: true
  createReader(): { readEntries(ok: (entries: FakeEntry[]) => void): void }
}
type FakeEntry = FakeFileEntry | FakeDirEntry

const fileEntry = (f: File): FakeFileEntry => ({
  isFile: true,
  isDirectory: false,
  file: (ok) => ok(f),
})
function dirEntry(children: FakeEntry[], batchSize = 2): FakeDirEntry {
  return {
    isFile: false,
    isDirectory: true,
    createReader() {
      let pos = 0
      // readEntries returns batches until an empty array signals the end
      return {
        readEntries(ok: (entries: FakeEntry[]) => void) {
          const batch = children.slice(pos, pos + batchSize)
          pos += batch.length
          ok(batch)
        },
      }
    },
  }
}

test('handleDrop descends into dropped folders and keeps only audio files', async () => {
  const received: File[][] = []
  const { handleDrop } = useFileDrop((files) => received.push(files))
  const tree = dirEntry([
    fileEntry(file('1.mp3')),
    fileEntry(file('cover.jpg', 'image/jpeg')),
    dirEntry([fileEntry(file('2.flac')), fileEntry(file('notes.txt'))]),
    fileEntry(file('3.wav')),
  ])
  await handleDrop(
    asDragEvent({ dataTransfer: { files: [], items: [{ webkitGetAsEntry: () => tree }] } })
  )
  assert.equal(received.length, 1)
  assert.deepEqual(received[0].map((f) => f.name).sort(), ['1.mp3', '2.flac', '3.wav'])
})

test('handleDrop ignores drops without audio files', async () => {
  const received: File[][] = []
  const { handleDrop } = useFileDrop((files) => received.push(files))
  await handleDrop(
    asDragEvent({
      dataTransfer: {
        files: [],
        items: [{ webkitGetAsEntry: () => dirEntry([fileEntry(file('a.txt'))]) }],
      },
    })
  )
  assert.equal(received.length, 0)
})
