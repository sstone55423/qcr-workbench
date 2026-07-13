import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  createVault, unlockVault, lockVault,
  ensureDefaultStore, getStores, activateStore, activateDbName,
  newStoreDescriptor, registerStore, setLastStore, removeStore,
} from '@/lib/localdb/store';
import { inspectBackup, readBackupDump, importDump } from '@/lib/backup';
import { clearSessionPassphrase } from '@/lib/backupService';
import LockScreen from '@/components/vault/LockScreen';

const VaultContext = createContext(null);

export function VaultProvider({ children }) {
  const [status, setStatus] = useState('loading'); // loading | picker | unlocked
  const [stores, setStores] = useState([]);
  const [currentStore, setCurrentStore] = useState(null);

  useEffect(() => {
    (async () => {
      // Register any pre-existing legacy vault as the default store (read-only),
      // then show the picker.
      await ensureDefaultStore();
      setStores(getStores());
      setStatus('picker');
    })();
  }, []);

  // Create a brand-new, empty store. Existing stores are never touched, so there
  // is nothing to overwrite and nothing to lose.
  const createStore = async (name, passphrase, hint) => {
    const desc = newStoreDescriptor(name);
    activateDbName(desc.dbName);
    await createVault(passphrase);
    registerStore({ ...desc, hint: (hint || '').trim() });
    setStores(getStores());
    setCurrentStore({ ...desc, hint: (hint || '').trim() });
    setStatus('unlocked');
  };

  // Open an existing store.
  const unlockStore = async (id, passphrase) => {
    const store = activateStore(id);
    if (!store) return false;
    const ok = await unlockVault(passphrase);
    if (ok) {
      setLastStore(id);
      setCurrentStore(store);
      setStatus('unlocked');
    }
    return ok;
  };

  // Create a new store populated from a backup file. For an ENCRYPTED backup the
  // backup passphrase becomes the store passphrase; for an UNENCRYPTED backup the
  // entered passphrase becomes it. The existing stores are untouched.
  const restoreStore = async (name, fileText, passphrase) => {
    const { encrypted } = inspectBackup(fileText);
    if (!encrypted && passphrase.length < 8) {
      throw new Error('Choose a passphrase of at least 8 characters — it becomes this store’s passphrase.');
    }
    const dump = await readBackupDump(fileText, passphrase);
    const desc = newStoreDescriptor(name);
    activateDbName(desc.dbName);
    await createVault(passphrase);
    registerStore({ ...desc });
    const counts = await importDump(dump);
    setStores(getStores());
    setCurrentStore({ ...desc });
    setStatus('unlocked');
    return counts;
  };

  const deleteStore = async (id) => {
    await removeStore(id);
    setStores(getStores());
  };

  const lock = () => {
    lockVault();
    clearSessionPassphrase();
    setCurrentStore(null);
    setStores(getStores());
    setStatus('picker');
  };

  if (status === 'loading') {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (status !== 'unlocked') {
    return (
      <LockScreen
        stores={stores}
        onUnlock={unlockStore}
        onCreate={createStore}
        onRestore={restoreStore}
        onDelete={deleteStore}
      />
    );
  }

  return <VaultContext.Provider value={{ lock, currentStore, stores }}>{children}</VaultContext.Provider>;
}

export const useVault = () => useContext(VaultContext);
