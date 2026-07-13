// Coordinates encrypted quick-backups triggered from the sidebar button.
// No scheduling — every backup is user-initiated. On Chromium, if the user has
// chosen a backup folder, the encrypted file is written straight to it; otherwise
// we fall back to the save picker or a plain download.
import { createBackup, createPlainBackup, backupFilename } from '@/lib/backup';
import { getBackupDir, setBackupDir, supportsDirectorySave, setLastBackupAt, getLastBackupAt } from '@/lib/backupTarget';
const OVERDUE_MS = 7 * 24 * 60 * 60 * 1000; // a week

// Backup passphrase held in memory for the session only (never persisted), so
// after the first backup the sidebar flow is effectively one click. Cleared on
// reload and on vault lock.
let sessionPassphrase = '';
export const getSessionPassphrase = () => sessionPassphrase;
export const setSessionPassphrase = (p) => { sessionPassphrase = p || ''; };
export const clearSessionPassphrase = () => { sessionPassphrase = ''; };

export function backupStatus() {
  const last = getLastBackupAt();
  return { last, overdue: !last || (Date.now() - last) > OVERDUE_MS };
}

async function ensurePermission(handle) {
  const opts = { mode: 'readwrite' };
  if ((await handle.queryPermission(opts)) === 'granted') return true;
  return (await handle.requestPermission(opts)) === 'granted';
}

// Lets the user pick (and remember) a backup folder. Chromium only. Returns the
// folder name, or null if cancelled/unsupported.
export async function chooseBackupFolder() {
  if (!supportsDirectorySave()) return null;
  // Start in Downloads, not Documents: on OneDrive "Known Folder Move" setups the
  // browser blocks Documents/Desktop (and other cloud-synced folders) as
  // "system files". Downloads is normally a plain local folder.
  const handle = await window.showDirectoryPicker({ mode: 'readwrite', startIn: 'downloads' });
  await setBackupDir(handle);
  return handle.name;
}

// Writes a backup. Encrypted by default; when opts.plain is true, writes an
// UNENCRYPTED file (readable by anyone) — the passphrase is ignored. Prefers a
// remembered folder (silent, one action); otherwise the save picker (Chromium)
// or a download (other browsers). Returns { target: 'folder' | 'file', name,
// plain }. Throws AbortError if the user cancels a picker.
export async function performBackup(passphrase, opts = {}) {
  const plain = !!opts.plain;
  const content = plain ? await createPlainBackup() : await createBackup(passphrase);
  const filename = backupFilename(plain);

  const dir = await getBackupDir();
  if (dir && (await ensurePermission(dir))) {
    const fileHandle = await dir.getFileHandle(filename, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(content);
    await writable.close();
    setLastBackupAt(Date.now());
    return { target: 'folder', name: dir.name, plain };
  }

  if (supportsDirectorySave()) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: filename,
        startIn: 'downloads',
        types: [{ description: 'QCR Workbench backup', accept: { 'application/json': ['.json'] } }],
      });
      const writable = await handle.createWritable();
      await writable.write(content);
      await writable.close();
      setLastBackupAt(Date.now());
      return { target: 'file', name: handle.name, plain };
    } catch (e) {
      // Respect an explicit cancel; for anything else (e.g. a blocked/OneDrive
      // folder), fall through to a plain download so the backup still happens.
      if (e?.name === 'AbortError') throw e;
    }
  }

  // Fallback: download (goes to the browser's Downloads folder, never blocked).
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
  setLastBackupAt(Date.now());
  return { target: 'file', name: filename, plain };
}
