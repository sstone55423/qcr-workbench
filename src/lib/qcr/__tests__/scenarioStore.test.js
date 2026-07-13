import { describe, it, expect, vi, beforeEach } from 'vitest';

// In-memory stand-in for the IndexedDB layer so the domain store can be
// exercised end-to-end in Node with real crypto (same harness as
// storeCache.test.js).
vi.mock('@/lib/localdb/idb', () => {
  const stores = { records: new Map(), meta: new Map() };
  return {
    __idbState: { stores },
    idbGet: vi.fn(async (store, k) => stores[store].get(k)),
    idbPut: vi.fn(async (store, k, v) => { stores[store].set(k, v); }),
    idbDelete: vi.fn(async (store, k) => { stores[store].delete(k); }),
    idbGetRange: vi.fn(async (store, lo, hi) =>
      [...stores[store].entries()].filter(([k]) => k >= lo && k <= hi).map(([, v]) => v)),
    idbPutMany: vi.fn(async (store, entries) => { entries.forEach(([k, v]) => stores[store].set(k, v)); }),
    idbDeleteMany: vi.fn(async (store, keys) => { keys.forEach(k => stores[store].delete(k)); }),
    setActiveDbName: vi.fn(),
    getActiveDbName: vi.fn(() => 'qcr-vault'),
  };
});

import { createVault, lockVault, unlockVault, db } from '@/lib/localdb/store';
import { __idbState } from '@/lib/localdb/idb';
import {
  createScenario, updateScenarioFair, updateScenarioAssumptions, saveSimulation,
  deleteScenario, createTreatment, loadSampleScenarios,
} from '@/lib/qcr/scenarioStore';
import { createBackup, restoreBackup } from '@/lib/backup';

const fair = (v = 1) => ({
  threat_event_frequency: { minimum: v, most_likely: v, maximum: v, unit: 'events/year' },
  vulnerability: { minimum: 0.5, most_likely: 0.5, maximum: 0.5, unit: 'probability' },
  primary_loss: { minimum: 1000, most_likely: 1000, maximum: 1000, unit: 'USD/event' },
  secondary_loss: { minimum: 0, most_likely: 0, maximum: 0, unit: 'USD/event' },
  secondary_loss_probability: { minimum: 0, most_likely: 0, maximum: 0, unit: 'probability' },
});

let project;

beforeEach(async () => {
  lockVault();
  __idbState.stores.records.clear();
  __idbState.stores.meta.clear();
  await createVault('test-passphrase');
  project = await db.entities.Project.create({ name: 'Test Project' });
});

describe('scenario lifecycle', () => {
  it('creates, persists across lock/unlock, and deletes with treatment cascade', async () => {
    const scenario = await createScenario(project.id, { name: 'S1', description: 'd', asset: 'a', threat: 't', effect: 'e', owner: 'o', fair: fair() });
    await createTreatment(scenario, { name: 'T1', annual_cost: 100, frequency_reduction: 0.1, vulnerability_reduction: 0, primary_loss_reduction: 0, secondary_loss_reduction: 0 });

    lockVault();
    expect(await unlockVault('test-passphrase')).toBe(true);
    expect(await db.entities.Scenario.list()).toHaveLength(1);
    expect(await db.entities.Treatment.list()).toHaveLength(1);

    await deleteScenario(scenario);
    expect(await db.entities.Scenario.list()).toHaveLength(0);
    expect(await db.entities.Treatment.list()).toHaveLength(0);
  });

  it('rejects an invalid FAIR model', async () => {
    const bad = fair();
    bad.vulnerability = { minimum: 0.9, most_likely: 0.5, maximum: 1, unit: '' };
    await expect(createScenario(project.id, { name: 'Bad', fair: bad })).rejects.toThrow(/most likely/);
  });
});

describe('invalidation rules', () => {
  it('clears simulation and AI narrative when FAIR estimates change', async () => {
    let scenario = await createScenario(project.id, { name: 'S', fair: fair() });
    scenario = await saveSimulation(scenario, { iterations: 1000, seed: 42 }, { mean: 1 }, { binWidth: 1, counts: [] }, { thresholds: [], probabilities: [] });
    scenario = await db.entities.Scenario.update(scenario.id, { ai_narrative: { text: 'x', provenance: {} } });
    expect(scenario.simulation).not.toBeNull();

    scenario = await updateScenarioFair(scenario, fair(2));
    expect(scenario.simulation).toBeNull();
    expect(scenario.ai_narrative).toBeNull();
    expect(scenario.fair.threat_event_frequency.minimum).toBe(2);
  });

  it('keeps simulation but clears AI narrative when assumption text changes', async () => {
    let scenario = await createScenario(project.id, { name: 'S', fair: fair() });
    scenario = await saveSimulation(scenario, { iterations: 1000, seed: 42 }, { mean: 1 }, { binWidth: 1, counts: [] }, { thresholds: [], probabilities: [] });
    scenario = await db.entities.Scenario.update(scenario.id, { ai_narrative: { text: 'x', provenance: {} } });

    scenario = await updateScenarioAssumptions(scenario, ['New assumption']);
    expect(scenario.simulation).not.toBeNull();
    expect(scenario.ai_narrative).toBeNull();
    expect(scenario.assumptions).toEqual(['New assumption']);
  });
});

describe('sample data loader', () => {
  it('loads the five Stella Polaris scenarios and is idempotent', async () => {
    const first = await loadSampleScenarios(project.id);
    expect(first).toHaveLength(5);
    const again = await loadSampleScenarios(project.id);
    expect(again).toHaveLength(0);
    const all = await db.entities.Scenario.filter({ project_id: project.id });
    expect(all).toHaveLength(5);
    const ransomware = all.find(s => s.sample_id === 'ransomware');
    expect(ransomware.fair.primary_loss.maximum).toBe(4800000);
    expect(ransomware.assumptions).toHaveLength(3);
  });
});

describe('backup roundtrip', () => {
  it('restores projects, scenarios, and treatments from an encrypted backup', async () => {
    const scenario = await createScenario(project.id, { name: 'S', fair: fair() });
    await createTreatment(scenario, { name: 'T', annual_cost: 10, frequency_reduction: 0, vulnerability_reduction: 0, primary_loss_reduction: 0, secondary_loss_reduction: 0 });

    const backupText = await createBackup('backup-pass-123');

    // Wipe the vault contents, then restore.
    await db.entities.Treatment.deleteMany({});
    await db.entities.Scenario.deleteMany({});
    await db.entities.Project.deleteMany({});
    expect(await db.entities.Scenario.list()).toHaveLength(0);

    const counts = await restoreBackup(backupText, 'backup-pass-123');
    expect(counts).toEqual({ projects: 1, scenarios: 1, treatments: 1 });
    const restored = await db.entities.Scenario.list();
    expect(restored).toHaveLength(1);
    expect(restored[0].id).toBe(scenario.id);
    expect(restored[0].fair.vulnerability.most_likely).toBe(0.5);
  });

  it('rejects a wrong backup passphrase', async () => {
    const backupText = await createBackup('right-pass-123');
    await expect(restoreBackup(backupText, 'wrong-pass-123')).rejects.toThrow(/passphrase|corrupted/i);
  });
});
