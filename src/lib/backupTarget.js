// Remembers WHERE encrypted backups go so Chromium can re-save to the same
// folder without a picker each time. A FileSystemDirectoryHandle is structured-
// cloneable but NOT JSON-serializable, so it lives in its own tiny IndexedDB
// database, separate from the encrypted vault DB. The last-backup timestamp is
// non-secret and kept in localStorage. Nothing here writes on a schedule — the
// user always triggers a backup explicitly.

const DB_NAME = 'qcr-backup-target';
const STORE = 'handles';
const HANDLE_KEY = 'dir';
const LAST_KEY = 'qcr-last-backup-at';

export const supportsDirectorySave = () =>
  typeof window !== 'undefined' && typeof window.showDirectoryPicker === 'function';

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function getBackupDir() {
  try {
    const db = await openDb();
    return await new Promise((resolve, reject) => {
      const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(HANDLE_KEY);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

export async function setBackupDir(handle) {
  const db = await openDb();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(handle, HANDLE_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function clearBackupDir() {
  try {
    const db = await openDb();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete(HANDLE_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch { /* ignore */ }
}

export function getLastBackupAt() {
  const v = localStorage.getItem(LAST_KEY);
  return v ? Number(v) : 0;
}

export function setLastBackupAt(ts) {
  try { localStorage.setItem(LAST_KEY, String(ts)); } catch { /* storage unavailable */ }
}
