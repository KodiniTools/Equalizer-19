import { ref } from 'vue'

const AUDIO_EXT_RE = /\.(mp3|wav|ogg|flac|aac|m4a|opus|webm)$/i

/**
 * Keep only audio files (by MIME type or known file extension).
 */
export function getAudioFiles(fileList: ArrayLike<File> | Iterable<File>): File[] {
  return Array.from(fileList).filter(
    (f) => f.type.startsWith('audio/') || AUDIO_EXT_RE.test(f.name)
  )
}

function traverseEntry(entry: FileSystemEntry, files: File[]): Promise<void> {
  return new Promise((resolve) => {
    if (entry.isFile) {
      ;(entry as FileSystemFileEntry).file(
        (file) => {
          files.push(file)
          resolve()
        },
        () => resolve()
      )
    } else if (entry.isDirectory) {
      const reader = (entry as FileSystemDirectoryEntry).createReader()
      const readAll = (): void => {
        reader.readEntries(
          async (entries) => {
            if (entries.length === 0) return resolve()
            await Promise.all(entries.map((e) => traverseEntry(e, files)))
            readAll()
          },
          () => resolve()
        )
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
async function extractFilesFromItems(items: DataTransferItemList): Promise<File[]> {
  const files: File[] = []
  const promises: Promise<void>[] = []

  for (const item of Array.from(items)) {
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
 * @param onFiles called with the accepted audio files
 */
export function useFileDrop(onFiles: (files: File[]) => void) {
  const isDragOver = ref(false)

  function onDragOver(): void {
    isDragOver.value = true
  }

  function onDragLeave(): void {
    isDragOver.value = false
  }

  // <input type="file"> change handler; resets the input so the same file can be picked again
  function handleFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement
    const files = getAudioFiles(input.files || [])
    if (files.length > 0) onFiles(files)
    input.value = ''
  }

  async function handleDrop(event: DragEvent): Promise<void> {
    isDragOver.value = false
    const transfer = event.dataTransfer
    const files = getAudioFiles(transfer?.files || [])

    // Also handle directory entries via DataTransferItemList
    if (files.length === 0 && transfer?.items) {
      const extracted = await extractFilesFromItems(transfer.items)
      if (extracted.length > 0) {
        onFiles(extracted)
        return
      }
    }

    if (files.length > 0) onFiles(files)
  }

  return { isDragOver, onDragOver, onDragLeave, handleFileSelect, handleDrop }
}
