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

// Some browsers (notably WebKit) occasionally never fire any event on
// indexedDB.open; without a deadline the caller would wait forever.
const OPEN_TIMEOUT_MS = 10000;

export function openDB() {
  if (!dbPromise) {
    const p = new Promise((resolve, reject) => {
      let settled = false;
      const fail = (err) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        reject(err);
      };
      const timer = setTimeout(() => fail(new Error(
        'The browser’s local database did not respond. Close other QCR Workbench tabs, then reload and try again.'
      )), OPEN_TIMEOUT_MS);
      let req;
      try { req = indexedDB.open(currentDbName, DB_VERSION); } catch (err) { fail(err); return; }
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('records')) db.createObjectStore('records');
        if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta');
      };
      req.onsuccess = () => {
        // Opened after we already gave up: don't leak the connection.
        if (settled) { try { req.result.close(); } catch { /* already closing */ } return; }
        settled = true;
        clearTimeout(timer);
        openDbHandle = req.result;
        resolve(req.result);
      };
      req.onerror = () => fail(req.error || new Error('Could not open the browser’s local database.'));
      req.onblocked = () => fail(new Error(
        'The local database is in use by another QCR Workbench tab. Close other tabs, then try again.'
      ));
    });
    dbPromise = p;
    // A failed open must not be cached, or every later attempt fails instantly.
    p.catch(() => { if (dbPromise === p) dbPromise = null; });
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