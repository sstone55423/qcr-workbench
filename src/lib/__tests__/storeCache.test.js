import { describe, it, expect, vi, beforeEach } from 'vitest';

// In-memory stand-in for the IndexedDB layer so the encrypted store (and its
// read cache) can be exercised end-to-end in Node with real crypto.
vi.mock('@/lib/localdb/idb', () => {
  const stores = { records: new Map(), meta: new Map() };
  const calls = { getRange: 0 };
  return {
    __idbState: { stores, calls },
    idbGet: vi.fn(async (store, k) => stores[store].get(k)),
    idbPut: vi.fn(async (store, k, v) => { stores[store].set(k, v); }),
    idbDelete: vi.fn(async (store, k) => { stores[store].delete(k); }),
    idbGetRange: vi.fn(async (store, lo, hi) => {
      calls.getRange++;
      return [...stores[store].entries()]
        .filter(([k]) => k >= lo && k <= hi)
        .map(([, v]) => v);
    }),
    idbPutMany: vi.fn(async (store, entries) => { entries.forEach(([k, v]) => stores[store].set(k, v)); }),
    idbDeleteMany: vi.fn(async (store, keys) => { keys.forEach(k => stores[store].delete(k)); }),
    setActiveDbName: vi.fn(),
    getActiveDbName: vi.fn(() => 'qcr-vault'),
  };
});

import { createVault, lockVault, unlockVault, db } from '@/lib/localdb/store';
import { __idbState } from '@/lib/localdb/idb';

const Scenario = db.entities.Scenario;

beforeEach(async () => {
  lockVault();
  __idbState.stores.records.clear();
  __idbState.stores.meta.clear();
  __idbState.calls.getRange = 0;
  await createVault('test-passphrase');
});

describe('collection read cache', () => {
  it('decrypts the collection once across repeated reads', async () => {
    await Scenario.create({ title: 'One', analysis_id: 'a1' });
    await Scenario.list();
    await Scenario.list('-created_date');
    await Scenario.filter({ analysis_id: 'a1' });
    expect(__idbState.calls.getRange).toBe(1);
  });

  it('reflects writes made after the cache is built', async () => {
    await Scenario.list(); // build cache while empty
    const created = await Scenario.create({ title: 'New', analysis_id: 'a1' });
    expect((await Scenario.list()).map(p => p.id)).toContain(created.id);
    await Scenario.update(created.id, { title: 'Renamed' });
    expect((await Scenario.get(created.id)).title).toBe('Renamed');
    await Scenario.delete(created.id);
    expect(await Scenario.list()).toEqual([]);
    expect(await Scenario.get(created.id)).toBeNull();
  });

  it('hands out clones — mutating results cannot corrupt the cache', async () => {
    await Scenario.create({ title: 'Pristine', authors: [{ name: 'X' }] });
    const [first] = await Scenario.list();
    first.title = 'MUTATED';
    first.authors.push({ name: 'INJECTED' });
    const [reread] = await Scenario.list();
    expect(reread.title).toBe('Pristine');
    expect(reread.authors).toEqual([{ name: 'X' }]);
  });

  it('clears on lock and rebuilds from IndexedDB after unlock', async () => {
    await Scenario.create({ title: 'Persisted' });
    await Scenario.list();
    lockVault();
    await expect(Scenario.list()).rejects.toThrow('Vault is locked');
    expect(await unlockVault('test-passphrase')).toBe(true);
    const papers = await Scenario.list();
    expect(papers).toHaveLength(1);
    expect(papers[0].title).toBe('Persisted');
    expect(__idbState.calls.getRange).toBe(2); // once before lock, once after
  });

  it('keeps collections independent', async () => {
    await Scenario.create({ title: 'P' });
    await db.entities.Project.create({ name: 'A' });
    expect(await Scenario.list()).toHaveLength(1);
    expect(await db.entities.Project.list()).toHaveLength(1);
    expect(await db.entities.Treatment.list()).toHaveLength(0);
  });
});
