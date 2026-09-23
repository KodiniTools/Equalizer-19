import { test } from 'node:test'
import assert from 'node:assert/strict'
import { getAudioFiles, useFileDrop } from '../src/composables/useFileDrop.js'

const file = (name, type = '') => ({ name, type })

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
  const received = []
  const { handleFileSelect } = useFileDrop((files) => received.push(files))
  const target = { files: [file('a.wav'), file('b.doc')], value: 'C:\\fake\\a.wav' }
  handleFileSelect({ target })
  assert.deepEqual(received, [[target.files[0]]])
  assert.equal(target.value, '')

  handleFileSelect({ target: { files: [file('x.doc')], value: 'x' } })
  assert.equal(received.length, 1)
})

test('handleDrop resets the drag state and forwards dropped files', async () => {
  const received = []
  const { isDragOver, onDragOver, handleDrop } = useFileDrop((files) => received.push(files))
  onDragOver()
  assert.equal(isDragOver.value, true)
  await handleDrop({ dataTransfer: { files: [file('a.m4a')], items: [] } })
  assert.equal(isDragOver.value, false)
  assert.equal(received[0][0].name, 'a.m4a')
})

// Minimal FileSystemEntry mocks (webkitGetAsEntry API)
const fileEntry = (f) => ({ isFile: true, isDirectory: false, file: (ok) => ok(f) })
function dirEntry(children, batchSize = 2) {
  return {
    isFile: false,
    isDirectory: true,
    createReader() {
      let pos = 0
      // readEntries returns batches until an empty array signals the end
      return {
        readEntries(ok) {
          const batch = children.slice(pos, pos + batchSize)
          pos += batch.length
          ok(batch)
        },
      }
    },
  }
}

test('handleDrop descends into dropped folders and keeps only audio files', async () => {
  const received = []
  const { handleDrop } = useFileDrop((files) => received.push(files))
  const tree = dirEntry([
    fileEntry(file('1.mp3')),
    fileEntry(file('cover.jpg', 'image/jpeg')),
    dirEntry([fileEntry(file('2.flac')), fileEntry(file('notes.txt'))]),
    fileEntry(file('3.wav')),
  ])
  await handleDrop({
    dataTransfer: { files: [], items: [{ webkitGetAsEntry: () => tree }] },
  })
  assert.equal(received.length, 1)
  assert.deepEqual(received[0].map((f) => f.name).sort(), ['1.mp3', '2.flac', '3.wav'])
})

test('handleDrop ignores drops without audio files', async () => {
  const received = []
  const { handleDrop } = useFileDrop((files) => received.push(files))
  await handleDrop({
    dataTransfer: {
      files: [],
      items: [{ webkitGetAsEntry: () => dirEntry([fileEntry(file('a.txt'))]) }],
    },
  })
  assert.equal(received.length, 0)
})
