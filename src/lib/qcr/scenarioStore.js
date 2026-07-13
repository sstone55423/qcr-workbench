// Domain layer over db.entities for scenarios and treatments: CRUD wrappers
// that own the invalidation rules and the audit trail, so pages never write
// entities directly. The critical invariant (from v0): editing the FAIR
// estimates invalidates the persisted simulation and AI narrative in the SAME
// atomic update, so stale downstream results can never exist.
import { db } from '@/lib/localdb/store';
import { logAudit } from '@/lib/auditLog';
import { validateFairModel, validateTreatment } from '@/lib/qcr/models';
import sampleScenarios from '@/data/stellaPolaris.json';

export async function createScenario(projectId, data) {
  validateFairModel(data.fair);
  const record = await db.entities.Scenario.create({
    project_id: projectId,
    sample_id: null,
    assumptions: [],
    simulation: null,
    ai_narrative: null,
    ...data,
  });
  logAudit(projectId, 'scenario', `Created scenario "${record.name}"`);
  return record;
}

// Scoping metadata only (name/description/asset/threat/effect/owner) — leaves
// the FAIR model and results untouched.
export async function updateScenarioMeta(scenario, patch) {
  const record = await db.entities.Scenario.update(scenario.id, patch);
  logAudit(scenario.project_id, 'scenario', `Updated scenario "${record.name}"`);
  return record;
}

// The five FAIR estimates changed: persist them and clear everything computed
// from them in one atomic write.
export async function updateScenarioFair(scenario, fair) {
  validateFairModel(fair);
  const record = await db.entities.Scenario.update(scenario.id, {
    fair,
    simulation: null,
    ai_narrative: null,
  });
  logAudit(scenario.project_id, 'assumptions', `Updated FAIR estimates for "${scenario.name}" (simulation results cleared)`);
  return record;
}

// Assumption text does not feed the math, so simulation results survive; the
// AI narrative referenced the old assumptions, so it is cleared.
export async function updateScenarioAssumptions(scenario, assumptions) {
  const record = await db.entities.Scenario.update(scenario.id, {
    assumptions,
    ai_narrative: null,
  });
  logAudit(scenario.project_id, 'assumptions', `Updated assumptions for "${scenario.name}"`);
  return record;
}

export async function saveSimulation(scenario, params, summary, histogram, exceedance) {
  const record = await db.entities.Scenario.update(scenario.id, {
    simulation: {
      params,
      summary,
      histogram,
      exceedance,
      computed_at: new Date().toISOString(),
    },
  });
  logAudit(
    scenario.project_id,
    'simulation',
    `Ran Monte Carlo simulation for "${scenario.name}" (${params.iterations.toLocaleString()} iterations, seed ${params.seed})`,
  );
  return record;
}

export async function saveAiNarrative(scenario, aiNarrative) {
  const record = await db.entities.Scenario.update(scenario.id, { ai_narrative: aiNarrative });
  logAudit(scenario.project_id, 'ai', `AI narrative drafted for "${scenario.name}" by ${aiNarrative?.provenance?.label || 'AI'}`);
  return record;
}

export async function deleteScenario(scenario) {
  await db.entities.Treatment.deleteMany({ scenario_id: scenario.id });
  await db.entities.Scenario.delete(scenario.id);
  logAudit(scenario.project_id, 'scenario', `Deleted scenario "${scenario.name}"`);
}

export async function createTreatment(scenario, data) {
  validateTreatment(data);
  const record = await db.entities.Treatment.create({
    scenario_id: scenario.id,
    project_id: scenario.project_id,
    ...data,
  });
  logAudit(scenario.project_id, 'treatment', `Added treatment "${record.name}" to "${scenario.name}"`);
  return record;
}

export async function updateTreatment(scenario, treatmentId, patch) {
  validateTreatment(patch);
  const record = await db.entities.Treatment.update(treatmentId, patch);
  logAudit(scenario.project_id, 'treatment', `Updated treatment "${record.name}" on "${scenario.name}"`);
  return record;
}

export async function deleteTreatment(scenario, treatment) {
  await db.entities.Treatment.delete(treatment.id);
  logAudit(scenario.project_id, 'treatment', `Deleted treatment "${treatment.name}" from "${scenario.name}"`);
}

// Loads the bundled Stella Polaris demonstration scenarios into a project.
// Scenarios already loaded there (matched by sample_id) are skipped, so the
// action is idempotent.
export async function loadSampleScenarios(projectId) {
  const existing = await db.entities.Scenario.filter({ project_id: projectId });
  const present = new Set(existing.map(s => s.sample_id).filter(Boolean));
  const fresh = sampleScenarios.filter(s => !present.has(s.id));
  if (fresh.length === 0) return [];
  const records = await db.entities.Scenario.bulkCreate(
    fresh.map(({ id, ...rest }) => ({
      ...rest,
      project_id: projectId,
      sample_id: id,
      simulation: null,
      ai_narrative: null,
    })),
  );
  logAudit(projectId, 'scenario', `Loaded ${records.length} Stella Polaris sample scenario(s)`);
  return records;
}
