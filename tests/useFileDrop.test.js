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
