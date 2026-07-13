import { deriveKey, encryptJSON, decryptJSON, randomSalt } from '@/lib/localdb/crypto';
import { idbGet, idbPut, idbDelete, idbGetRange, idbPutMany, idbDeleteMany, setActiveDbName, getActiveDbName } from '@/lib/localdb/idb';

let cryptoKey = null;
const CHECK_TEXT = 'qcr-vault-check';

// In-memory cache of decrypted records per collection. IndexedDB only holds
// ciphertext, so without this every list()/filter() re-decrypts the whole
// collection. Writes maintain the cache in place; lock/store-switch clears it.
// Reads hand out clones so callers can never mutate cached records.
const collectionCaches = new Map();

function clearCaches() {
  collectionCaches.clear();
}

export async function vaultStatus() {
  const meta = await idbGet('meta', 'vault');
  return meta ? 'locked' : 'new';
}

export async function createVault(passphrase) {
  // A vault may have been created in another tab since this tab loaded;
  // overwriting its salt would make every existing record undecryptable.
  const existing = await idbGet('meta', 'vault');
  if (existing) throw new Error('A vault already exists on this device. Reload the page and unlock it instead.');
  const salt = randomSalt();
  cryptoKey = await deriveKey(passphrase, salt);
  const check = await encryptJSON(cryptoKey, { check: CHECK_TEXT });
  await idbPut('meta', 'vault', { salt, check });
}

export async function unlockVault(passphrase) {
  const meta = await idbGet('meta', 'vault');
  if (!meta) throw new Error('No vault exists');
  const key = await deriveKey(passphrase, meta.salt);
  try {
    const obj = await decryptJSON(key, meta.check);
    if (obj.check !== CHECK_TEXT) return false;
  } catch {
    return false;
  }
  cryptoKey = key;
  return true;
}

export function lockVault() {
  cryptoKey = null;
  clearCaches();
}

// ---- Multiple stores ("libraries") -----------------------------------------
// Each store is a SEPARATE encrypted IndexedDB database, so creating or opening
// one never touches another. A non-secret registry in localStorage lists their
// names + database names for the picker; it holds NO passphrases and NO data.
const STORE_REGISTRY_KEY = 'qcr-stores';
const DEFAULT_DB_NAME = 'qcr-vault';

function readRegistry() {
  try {
    const r = JSON.parse(localStorage.getItem(STORE_REGISTRY_KEY));
    if (r && Array.isArray(r.stores)) return r;
  } catch { /* ignore */ }
  return { stores: [], lastStoreId: null };
}

function writeRegistry(reg) {
  try { localStorage.setItem(STORE_REGISTRY_KEY, JSON.stringify(reg)); } catch { /* storage unavailable */ }
}

export function getStores() {
  return readRegistry().stores;
}

export function getLastStoreId() {
  return readRegistry().lastStoreId;
}

// Display name of the currently-active store (matched by its database name).
export function getActiveStoreName() {
  const dbName = getActiveDbName();
  const s = readRegistry().stores.find(x => x.dbName === dbName);
  return s?.name || 'workspace';
}

// Points the database layer at a database name and locks (clears the in-memory
// key). Used when switching stores.
export function activateDbName(dbName) {
  setActiveDbName(dbName);
  lockVault();
}

// Activates a registered store by id; returns its descriptor or null.
export function activateStore(id) {
  const store = readRegistry().stores.find(s => s.id === id);
  if (!store) return null;
  activateDbName(store.dbName);
  return store;
}

// Descriptor for a NEW store — nothing is created yet. The first store reuses
// the default `qcr-vault` database; later stores get their own
// `qcr-vault-<id>` database.
export function newStoreDescriptor(name) {
  const reg = readRegistry();
  const first = reg.stores.length === 0;
  const id = first ? 'default' : crypto.randomUUID();
  const dbName = first ? DEFAULT_DB_NAME : `${DEFAULT_DB_NAME}-${id}`;
  return { id, name: (name || '').trim() || 'My Workspace', dbName };
}

export function registerStore(descriptor) {
  const reg = readRegistry();
  if (!reg.stores.some(s => s.id === descriptor.id)) reg.stores.push(descriptor);
  reg.lastStoreId = descriptor.id;
  writeRegistry(reg);
}

export function setLastStore(id) {
  const reg = readRegistry();
  reg.lastStoreId = id;
  writeRegistry(reg);
}

export function setStoreHint(id, hint) {
  const reg = readRegistry();
  const s = reg.stores.find(x => x.id === id);
  if (s) { s.hint = hint || ''; writeRegistry(reg); }
}

// Non-secret email shown on this store's unlock screen when the user opts in.
export function setStoreEmail(id, email) {
  const reg = readRegistry();
  const s = reg.stores.find(x => x.id === id);
  if (s) { s.email = email || ''; writeRegistry(reg); }
}

// Permanently deletes a store: its registry entry AND its database. This is the
// only operation that destroys data.
export async function removeStore(id) {
  const reg = readRegistry();
  const store = reg.stores.find(s => s.id === id);
  reg.stores = reg.stores.filter(s => s.id !== id);
  if (reg.lastStoreId === id) reg.lastStoreId = reg.stores[0]?.id || null;
  writeRegistry(reg);
  if (store) {
    // Detach from the target DB (closing its connection) so deletion isn't
    // blocked by an open handle.
    if (getActiveDbName() === store.dbName) {
      setActiveDbName(reg.stores[0]?.dbName || `${DEFAULT_DB_NAME}-detached`);
      lockVault();
    }
    await new Promise((resolve) => {
      const req = indexedDB.deleteDatabase(store.dbName);
      req.onsuccess = req.onerror = req.onblocked = () => resolve();
    });
  }
}

// On first run of the multi-store code, register a pre-existing legacy vault as
// the default store so it appears in the picker and its data is preserved. The
// legacy database is only READ here — never renamed or deleted.
export async function ensureDefaultStore() {
  const reg = readRegistry();
  if (reg.stores.length > 0) return reg.stores;
  setActiveDbName(DEFAULT_DB_NAME);
  const st = await vaultStatus(); // 'locked' means a vault already exists there
  if (st === 'locked') {
    reg.stores.push({ id: 'default', name: 'My Workspace', dbName: DEFAULT_DB_NAME });
    reg.lastStoreId = 'default';
    writeRegistry(reg);
  }
  return reg.stores;
}

function requireKey() {
  if (!cryptoKey) throw new Error('Vault is locked');
  return cryptoKey;
}

function matches(record, query) {
  return Object.entries(query || {}).every(([k, v]) => record[k] === v);
}

function applySort(list, sort) {
  if (!sort) return list;
  const desc = sort.startsWith('-');
  const field = desc ? sort.slice(1) : sort;
  return [...list].sort((a, b) => {
    const av = a[field] ?? '';
    const bv = b[field] ?? '';
    const cmp = av < bv ? -1 : av > bv ? 1 : 0;
    return desc ? -cmp : cmp;
  });
}

function collectionAPI(name) {
  const prefix = name + ':';
  // Serializes read-modify-write updates so concurrent updates to the same
  // collection can't read stale data and overwrite each other's changes.
  let updateChain = Promise.resolve();

  // Returns the pristine cached array (never handed to callers directly).
  const readAll = async () => {
    if (collectionCaches.has(name)) return collectionCaches.get(name);
    const key = requireKey();
    const rows = await idbGetRange('records', prefix, prefix + '\uffff');
    const records = await Promise.all(rows.map(r => decryptJSON(key, r)));
    collectionCaches.set(name, records);
    return records;
  };

  const cacheUpsert = (record) => {
    const cached = collectionCaches.get(name);
    if (!cached) return;
    const copy = structuredClone(record);
    const i = cached.findIndex(r => r.id === record.id);
    if (i >= 0) cached[i] = copy; else cached.push(copy);
  };

  const cacheRemove = (ids) => {
    const cached = collectionCaches.get(name);
    if (!cached) return;
    const doomed = new Set(ids);
    collectionCaches.set(name, cached.filter(r => !doomed.has(r.id)));
  };

  const writeOne = async (record) => {
    const key = requireKey();
    const payload = await encryptJSON(key, record);
    await idbPut('records', prefix + record.id, payload);
    cacheUpsert(record);
  };

  return {
    async list(sort, limit) {
      const all = applySort(await readAll(), sort);
      return structuredClone(limit ? all.slice(0, limit) : all);
    },
    async filter(query, sort, limit) {
      const all = applySort((await readAll()).filter(r => matches(r, query)), sort);
      return structuredClone(limit ? all.slice(0, limit) : all);
    },
    async get(id) {
      const cached = collectionCaches.get(name);
      if (cached) {
        const hit = cached.find(r => r.id === id);
        return hit ? structuredClone(hit) : null;
      }
      const key = requireKey();
      const row = await idbGet('records', prefix + id);
      return row ? decryptJSON(key, row) : null;
    },
    async create(data) {
      const now = new Date().toISOString();
      const record = { ...data, id: crypto.randomUUID(), created_date: now, updated_date: now };
      await writeOne(record);
      return record;
    },
    async bulkCreate(items) {
      const key = requireKey();
      const now = new Date().toISOString();
      const records = items.map(d => ({ ...d, id: crypto.randomUUID(), created_date: now, updated_date: now }));
      const entries = await Promise.all(records.map(async r => [prefix + r.id, await encryptJSON(key, r)]));
      await idbPutMany('records', entries);
      records.forEach(cacheUpsert);
      return records;
    },
    async update(id, data) {
      const self = this;
      const run = async () => {
        const existing = await self.get(id);
        if (!existing) throw new Error('Record not found: ' + id);
        const record = { ...existing, ...data, updated_date: new Date().toISOString() };
        await writeOne(record);
        return record;
      };
      const result = updateChain.then(run, run);
      updateChain = result.catch(() => {});
      return result;
    },
    async delete(id) {
      await idbDelete('records', prefix + id);
      cacheRemove([id]);
    },
    async deleteByIds(ids) {
      await idbDeleteMany('records', ids.map(id => prefix + id));
      cacheRemove(ids);
    },
    async deleteMany(query) {
      const all = await readAll();
      const doomed = all.filter(r => matches(r, query));
      await idbDeleteMany('records', doomed.map(r => prefix + r.id));
      cacheRemove(doomed.map(r => r.id));
      return doomed.length;
    },
  };
}

// Writes records into a collection preserving their existing ids (used by backup restore).
export async function importRecords(collectionName, records) {
  const key = requireKey();
  const prefix = collectionName + ':';
  const entries = await Promise.all(records.map(async r => [prefix + r.id, await encryptJSON(key, r)]));
  await idbPutMany('records', entries);
  // Bypasses collectionAPI, so drop that collection's cache rather than merge.
  collectionCaches.delete(collectionName);
}

// Global app-wide settings (API keys, etc.) stored encrypted, independent of any analysis.
const APP_SETTINGS_KEY = 'AppSettings:global';

export const appSettings = {
  async get() {
    const key = requireKey();
    const row = await idbGet('records', APP_SETTINGS_KEY);
    return row ? decryptJSON(key, row) : {};
  },
  async set(data) {
    const key = requireKey();
    const merged = { ...(await this.get()), ...data };
    await idbPut('records', APP_SETTINGS_KEY, await encryptJSON(key, merged));
    return merged;
  },
};

// Non-secret personalization for the lock screen, stored OUTSIDE the encrypted
// vault (localStorage) because the lock screen renders before the vault is
// unlocked and cannot read encrypted settings. Written ONLY when the user
// explicitly opts in ("show on lock screen"); holds no secret material — just a
// display email the returning user recognizes. Cleared when the option is off.
const LOCK_PROFILE_KEY = 'qcr-lock-profile';
export const lockProfile = {
  get() {
    try { return JSON.parse(localStorage.getItem(LOCK_PROFILE_KEY)) || {}; }
    catch { return {}; }
  },
  // Merges the patch into the existing profile so independently-managed fields
  // (email, hint) don't clobber each other.
  set(patch) {
    const next = { ...this.get(), ...(patch || {}) };
    try { localStorage.setItem(LOCK_PROFILE_KEY, JSON.stringify(next)); } catch { /* storage unavailable */ }
    return next;
  },
  clear() {
    try { localStorage.removeItem(LOCK_PROFILE_KEY); } catch { /* storage unavailable */ }
  },
};

export const db = {
  entities: {
    Project: collectionAPI('Project'),
    Scenario: collectionAPI('Scenario'),
    Treatment: collectionAPI('Treatment'),
    AuditEvent: collectionAPI('AuditEvent'),
  },
};