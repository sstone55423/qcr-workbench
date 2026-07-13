// The legacy single-vault database name. With multiple stores, each store is its
// OWN IndexedDB database; the currently-active one is selected here. `qcr-vault`
// remains the default store so pre-existing data keeps working unchanged.
const DB_VERSION = 1;
let currentDbName = 'qcr-vault';
let dbPromise = null;
let openDbHandle = null;

// Switches which store's database subsequent operations target. Closes the old
// connection and clears the cache so openDB() reopens the new one on next use.
export function setActiveDbName(name) {
  if (name === currentDbName && dbPromise) return;
  if (openDbHandle) { try { openDbHandle.close(); } catch { /* already closing */ } openDbHandle = null; }
  currentDbName = name;
  dbPromise = null;
}

export function getActiveDbName() {
  return currentDbName;
}

export function openDB() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(currentDbName, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('records')) db.createObjectStore('records');
        if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta');
      };
      req.onsuccess = () => { openDbHandle = req.result; resolve(req.result); };
      req.onerror = () => reject(req.error);
    });
  }
  return dbPromise;
}

export async function idbGet(store, key) {
  const db = await openDB();
  return new Promise((res, rej) => {
    const r = db.transaction(store, 'readonly').objectStore(store).get(key);
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}

export async function idbGetRange(store, lower, upper) {
  const db = await openDB();
  return new Promise((res, rej) => {
    const r = db.transaction(store, 'readonly').objectStore(store).getAll(IDBKeyRange.bound(lower, upper));
    r.onsuccess = () => res(r.result || []);
    r.onerror = () => rej(r.error);
  });
}

export async function idbPut(store, key, value) {
  const db = await openDB();
  return new Promise((res, rej) => {
    const t = db.transaction(store, 'readwrite');
    t.objectStore(store).put(value, key);
    t.oncomplete = () => res();
    t.onerror = () => rej(t.error);
  });
}

export async function idbPutMany(store, entries) {
  const db = await openDB();
  return new Promise((res, rej) => {
    const t = db.transaction(store, 'readwrite');
    const s = t.objectStore(store);
    entries.forEach(([key, value]) => s.put(value, key));
    t.oncomplete = () => res();
    t.onerror = () => rej(t.error);
  });
}

export async function idbDelete(store, key) {
  const db = await openDB();
  return new Promise((res, rej) => {
    const t = db.transaction(store, 'readwrite');
    t.objectStore(store).delete(key);
    t.oncomplete = () => res();
    t.onerror = () => rej(t.error);
  });
}

export async function idbDeleteMany(store, keys) {
  const db = await openDB();
  return new Promise((res, rej) => {
    const t = db.transaction(store, 'readwrite');
    const s = t.objectStore(store);
    keys.forEach(key => s.delete(key));
    t.oncomplete = () => res();
    t.onerror = () => rej(t.error);
  });
}