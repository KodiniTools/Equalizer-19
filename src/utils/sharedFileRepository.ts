/**
 * Shared File Repository – IndexedDB bridge between KodiniTools apps.
 *
 * The converter and the audio cutter write audio blobs here; receiving
 * tools (Visualizer, Normalisierer, Equalizer) read from the same store
 * when opened with ?source=<tool>.
 */

const DB_NAME = 'kodinitools-shared-files'
const STORE_NAME = 'audio-files'
const DB_VERSION = 1

/** Tools whose hand-over (?source=<tool>) the Equalizer accepts. */
export const RECEIVABLE_SOURCES: readonly string[] = ['audiokonverter', 'audio-cutter']

/** A file to hand over to another tool. */
export interface ShareableFile {
  name: string
  blob: Blob
}

/** An entry of the shared store as written by shareFiles(). */
export interface SharedFileEntry {
  id?: number
  name: string
  blob: Blob
  mimeType: string
  source: string
  sharedAt: number
}

export function isReceivableSource(value: unknown): value is string {
  return typeof value === 'string' && RECEIVABLE_SOURCES.includes(value)
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function settle(db: IDBDatabase, tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => {
      db.close()
      resolve()
    }
    tx.onerror = () => {
      db.close()
      reject(tx.error)
    }
  })
}

/**
 * Store converted files for handoff to another tool.
 * Clears any previous entries first.
 */
export async function shareFiles(files: readonly ShareableFile[]): Promise<void> {
  const db = await openDB()
  const tx = db.transaction(STORE_NAME, 'readwrite')
  const store = tx.objectStore(STORE_NAME)

  store.clear()

  for (const file of files) {
    const entry: SharedFileEntry = {
      name: file.name,
      blob: file.blob,
      mimeType: file.blob.type,
      source: 'audiokonverter',
      sharedAt: Date.now(),
    }
    store.put(entry)
  }

  return settle(db, tx)
}

/**
 * Read shared files (used by the receiving tool).
 */
export async function getSharedFiles(): Promise<SharedFileEntry[]> {
  const db = await openDB()
  const tx = db.transaction(STORE_NAME, 'readonly')
  const request = tx.objectStore(STORE_NAME).getAll()

  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      db.close()
      resolve(request.result as SharedFileEntry[])
    }
    request.onerror = () => {
      db.close()
      reject(request.error)
    }
  })
}

/**
 * Clear shared files after the receiving tool has consumed them.
 */
export async function clearSharedFiles(): Promise<void> {
  const db = await openDB()
  const tx = db.transaction(STORE_NAME, 'readwrite')
  tx.objectStore(STORE_NAME).clear()

  return settle(db, tx)
}
