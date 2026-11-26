/**
 * Saving a generated file: native "Save As" dialog where the browser has one
 * (File System Access API), otherwise a plain download. Shared by the output
 * recorder and the offline export.
 */

/** Result of saveBlobAs(). */
export interface SaveResult {
  ok: boolean
  /** the user dismissed the native save dialog */
  aborted?: boolean
}

/** File System Access API (not in lib.dom yet). */
interface SaveFilePickerOptions {
  suggestedName?: string
  types?: Array<{ description?: string; accept: Record<string, string[]> }>
}
type ShowSaveFilePicker = (options?: SaveFilePickerOptions) => Promise<FileSystemFileHandle>

export function savePicker(): ShowSaveFilePicker | undefined {
  if (typeof window === 'undefined') return undefined
  const picker = (window as Window & { showSaveFilePicker?: ShowSaveFilePicker }).showSaveFilePicker
  return typeof picker === 'function' ? picker.bind(window) : undefined
}

/**
 * Remove characters that are invalid in file names and strip a redundant
 * audio extension the user may have typed.
 */
export function sanitizeFilename(name: unknown): string {
  return String(name || '')
    .replace(/[\\/:*?"<>|]+/g, '_')
    .replace(/\.(wav|webm)$/i, '')
    .replace(/\.+$/, '')
    .trim()
    .slice(0, 120)
}

/** Trigger a plain browser download to the default download folder. */
function anchorDownload(blob: Blob, ext: string, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.style.display = 'none'
  a.href = url
  a.download = `${filename}.${ext}`

  document.body.appendChild(a)
  a.click()

  setTimeout(() => {
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, 100)
}

/**
 * Save a file under a user-chosen name. With the File System Access API a
 * native dialog lets the user pick the target folder too; otherwise it falls
 * back to a normal download.
 *
 * `getBlob` is called only after the dialog has returned, so producing the
 * file may take a while (offline render) without losing the click's user
 * activation, which the dialog needs. It returns null when there is nothing
 * to save; that gives { ok: false }.
 *
 * Returns { ok, aborted } so callers can react to a cancelled dialog.
 */
export async function saveBlobAs(
  getBlob: () => Promise<Blob | null> | Blob | null,
  filename: string,
  ext: string,
  mime: string
): Promise<SaveResult> {
  const safeName = sanitizeFilename(filename) || 'audio-export'
  const showSaveFilePicker = savePicker()

  // Preferred path: native "Save As" dialog with folder selection.
  if (showSaveFilePicker) {
    let handle: FileSystemFileHandle | null = null
    try {
      // Request the handle first, while the click's user activation is fresh.
      handle = await showSaveFilePicker({
        suggestedName: `${safeName}.${ext}`,
        types: [
          {
            description: `${ext.toUpperCase()} Audio`,
            accept: { [mime]: [`.${ext}`] },
          },
        ],
      })
    } catch (error) {
      // User dismissed the picker — do not fall back to an unwanted download.
      if (error instanceof Error && error.name === 'AbortError') return { ok: false, aborted: true }
      console.warn('Save picker unavailable, falling back to download:', error)
    }

    if (handle) {
      try {
        const blob = await getBlob()
        if (!blob) return { ok: false }
        const writable = await handle.createWritable()
        await writable.write(blob)
        await writable.close()
        return { ok: true }
      } catch (error) {
        console.error('Saving file failed:', error)
        return { ok: false }
      }
    }
  }

  // Fallback: standard download to the browser's default folder.
  try {
    const blob = await getBlob()
    if (!blob) return { ok: false }
    anchorDownload(blob, ext, safeName)
    return { ok: true }
  } catch (error) {
    console.error('Download failed:', error)
    return { ok: false }
  }
}
