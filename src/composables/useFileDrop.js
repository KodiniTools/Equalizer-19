import { ref } from 'vue'

const AUDIO_EXT_RE = /\.(mp3|wav|ogg|flac|aac|m4a|opus|webm)$/i

/**
 * Keep only audio files (by MIME type or known file extension).
 */
export function getAudioFiles(fileList) {
  return Array.from(fileList).filter(
    (f) => f.type.startsWith('audio/') || AUDIO_EXT_RE.test(f.name)
  )
}

function traverseEntry(entry, files) {
  return new Promise((resolve) => {
    if (entry.isFile) {
      entry.file((file) => {
        files.push(file)
        resolve()
      }, resolve)
    } else if (entry.isDirectory) {
      const reader = entry.createReader()
      const readAll = () => {
        reader.readEntries(async (entries) => {
          if (entries.length === 0) return resolve()
          await Promise.all(entries.map((e) => traverseEntry(e, files)))
          readAll()
        }, resolve)
      }
      readAll()
    } else {
      resolve()
    }
  })
}

/**
 * Collect audio files from dropped items, descending into dropped folders.
 */
async function extractFilesFromItems(items) {
  const files = []
  const promises = []

  for (const item of items) {
    const entry = item.webkitGetAsEntry?.()
    if (entry) {
      promises.push(traverseEntry(entry, files))
    }
  }

  await Promise.all(promises)
  return files.filter((f) => AUDIO_EXT_RE.test(f.name))
}

/**
 * File input + drag & drop handling (including dropped folders).
 *
 * @param {(files: File[]) => void} onFiles called with the accepted audio files
 */
export function useFileDrop(onFiles) {
  const isDragOver = ref(false)

  function onDragOver() {
    isDragOver.value = true
  }

  function onDragLeave() {
    isDragOver.value = false
  }

  // <input type="file"> change handler; resets the input so the same file can be picked again
  function handleFileSelect(event) {
    const files = getAudioFiles(event.target.files || [])
    if (files.length > 0) onFiles(files)
    event.target.value = ''
  }

  async function handleDrop(event) {
    isDragOver.value = false
    const files = getAudioFiles(event.dataTransfer.files || [])

    // Also handle directory entries via DataTransferItemList
    if (files.length === 0 && event.dataTransfer.items) {
      const extracted = await extractFilesFromItems(event.dataTransfer.items)
      if (extracted.length > 0) {
        onFiles(extracted)
        return
      }
    }

    if (files.length > 0) onFiles(files)
  }

  return { isDragOver, onDragOver, onDragLeave, handleFileSelect, handleDrop }
}
