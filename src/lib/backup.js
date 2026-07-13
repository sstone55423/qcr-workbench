import { db, importRecords, appSettings, getActiveStoreName } from '@/lib/localdb/store';
import { deriveKey, encryptJSON, decryptJSON, randomSalt } from '@/lib/localdb/crypto';

// Filename-safe version of a store name.
function sanitizeName(name) {
  return (name || 'workspace').replace(/[^a-z0-9-_ ]/gi, '').trim().replace(/\s+/g, '-').slice(0, 40) || 'workspace';
}

// Builds a self-describing backup filename: "<store>-backup-YYYY-MM-DD.json"
// (or "<store>-UNENCRYPTED-backup-YYYY-MM-DD.json"), so files are identifiable
// per store and per day.
export function backupFilename(plain) {
  const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const store = sanitizeName(getActiveStoreName());
  return `${store}-${plain ? 'UNENCRYPTED-backup' : 'backup'}-${date}.json`;
}

function bufToB64(buf) {
  const bytes = new Uint8Array(buf);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function b64ToBuf(b64) {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

// Creates an encrypted backup file (JSON string) of all data, protected by its own passphrase.
export async function createBackup(passphrase) {
  const dump = {
    Project: await db.entities.Project.list(),
    Scenario: await db.entities.Scenario.list(),
    Treatment: await db.entities.Treatment.list(),
    AppSettings: await appSettings.get(),
  };
  const salt = randomSalt();
  const key = await deriveKey(passphrase, salt);
  const { iv, data } = await encryptJSON(key, dump);
  return JSON.stringify({
    format: 'qcr-backup',
    version: 1,
    created: new Date().toISOString(),
    salt: bufToB64(salt),
    iv: bufToB64(iv),
    data: bufToB64(data),
  });
}

// Creates an UNENCRYPTED backup file (JSON string) of all data. It is protected
// by nothing — anyone who obtains the file can read every scenario, project, and
// saved API key. Offered only as an opt-in, last-resort safeguard against losing
// work to a forgotten passphrase. See DATA-PRIVACY.md.
export async function createPlainBackup() {
  const dump = {
    Project: await db.entities.Project.list(),
    Scenario: await db.entities.Scenario.list(),
    Treatment: await db.entities.Treatment.list(),
    AppSettings: await appSettings.get(),
  };
  return JSON.stringify({
    format: 'qcr-backup',
    version: 1,
    encrypted: false,
    created: new Date().toISOString(),
    data: dump,
  }, null, 2);
}

// Inspects a backup file and reports whether it is encrypted, without decrypting.
// Encrypted backups carry base64 `data`; unencrypted ones carry an object `data`
// and `encrypted: false`.
export function inspectBackup(fileText) {
  let parsed;
  try {
    parsed = JSON.parse(fileText);
  } catch {
    throw new Error('Not a valid backup file');
  }
  if (parsed.format !== 'qcr-backup') throw new Error('Not a QCR Workbench backup file');
  const encrypted = parsed.encrypted !== false && typeof parsed.data === 'string';
  return { encrypted, parsed };
}

// Returns the plain dump from a backup file. For encrypted backups the passphrase
// must be correct; for unencrypted backups the passphrase is ignored.
// Throws on bad format, wrong passphrase, or corruption.
export async function readBackupDump(fileText, passphrase) {
  const { encrypted, parsed } = inspectBackup(fileText);
  if (!encrypted) return parsed.data || {};
  const key = await deriveKey(passphrase, b64ToBuf(parsed.salt));
  try {
    return await decryptJSON(key, { iv: b64ToBuf(parsed.iv), data: b64ToBuf(parsed.data) });
  } catch {
    throw new Error('Wrong passphrase or corrupted backup file');
  }
}

// Parses and decrypts an ENCRYPTED backup file without touching the vault.
// Retained for callers that require an encrypted backup specifically.
export async function decryptBackup(fileText, passphrase) {
  const { encrypted } = inspectBackup(fileText);
  if (!encrypted) throw new Error('This backup is unencrypted; no passphrase is needed to read it.');
  return readBackupDump(fileText, passphrase);
}

// Writes a decrypted backup dump into the (unlocked) vault. Records keep their
// ids; existing records with the same id are overwritten (merge).
export async function importDump(dump) {
  for (const name of ['Project', 'Scenario', 'Treatment']) {
    await importRecords(name, dump[name] || []);
  }
  if (dump.AppSettings && Object.keys(dump.AppSettings).length > 0) {
    await appSettings.set(dump.AppSettings);
  }
  return {
    projects: (dump.Project || []).length,
    scenarios: (dump.Scenario || []).length,
    treatments: (dump.Treatment || []).length,
  };
}

// Restores a backup file into the local vault. Handles both encrypted and
// unencrypted backups; the passphrase is ignored for unencrypted files.
export async function restoreBackup(fileText, passphrase) {
  return importDump(await readBackupDump(fileText, passphrase));
}