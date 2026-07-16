// Domain layer over db.entities for scenarios and treatments: CRUD wrappers
// that own the invalidation rules and the audit trail, so pages never write
// entities directly. The critical invariant (from v0): editing the FAIR
// estimates invalidates the persisted simulation and AI narrative in the SAME
// atomic update, so stale downstream results can never exist.
import { db } from '@/lib/localdb/store';
import { logAudit } from '@/lib/auditLog';
import { validateFairModel, validateTreatment, FAIR_FACTORS } from '@/lib/qcr/models';
import { getLibrary, DEFAULT_LIBRARY_ID } from '@/data/sampleLibraries';

// True when the numeric parts of two FAIR models match. Estimates also carry
// documentation (unit, rationale) that doesn't feed the math — edits to those
// must not invalidate simulation results.
export function fairNumbersEqual(a, b) {
  return FAIR_FACTORS.every((factor) =>
    a[factor].minimum === b[factor].minimum &&
    a[factor].most_likely === b[factor].most_likely &&
    a[factor].maximum === b[factor].maximum);
}

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
  logAudit(projectId, 'scenario', 'auditMsg.scenarioCreated', { name: record.name });
  return record;
}

// Scoping metadata only (name/description/asset/threat/effect/owner) — leaves
// the FAIR model and results untouched.
export async function updateScenarioMeta(scenario, patch) {
  const record = await db.entities.Scenario.update(scenario.id, patch);
  logAudit(scenario.project_id, 'scenario', 'auditMsg.scenarioUpdated', { name: record.name });
  return record;
}

// Persist FAIR-model edits. When the NUMBERS changed, everything computed
// from them is cleared in the same atomic write; a documentation-only edit
// (rationale text) keeps the simulation but still clears the AI narrative,
// whose inputs hash covers the whole model.
export async function updateScenarioFair(scenario, fair) {
  validateFairModel(fair);
  const numbersChanged = !fairNumbersEqual(scenario.fair, fair);
  const record = await db.entities.Scenario.update(scenario.id, {
    fair,
    ai_narrative: null,
    ...(numbersChanged ? { simulation: null } : {}),
  });
  logAudit(
    scenario.project_id,
    'assumptions',
    numbersChanged ? 'auditMsg.fairUpdated' : 'auditMsg.rationaleUpdated',
    { name: scenario.name },
  );
  return record;
}

// Assumption text does not feed the math, so simulation results survive; the
// AI narrative referenced the old assumptions, so it is cleared.
export async function updateScenarioAssumptions(scenario, assumptions) {
  const record = await db.entities.Scenario.update(scenario.id, {
    assumptions,
    ai_narrative: null,
  });
  logAudit(scenario.project_id, 'assumptions', 'auditMsg.assumptionsUpdated', { name: scenario.name });
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
  logAudit(scenario.project_id, 'simulation', 'auditMsg.simulationRun', {
    name: scenario.name,
    iterations: params.iterations.toLocaleString(),
    seed: params.seed,
  });
  return record;
}

export async function saveAiNarrative(scenario, aiNarrative) {
  const record = await db.entities.Scenario.update(scenario.id, { ai_narrative: aiNarrative });
  logAudit(scenario.project_id, 'ai', 'auditMsg.narrativeDrafted', { name: scenario.name, label: aiNarrative?.provenance?.label || 'AI' });
  return record;
}

export async function deleteScenario(scenario) {
  await db.entities.Treatment.deleteMany({ scenario_id: scenario.id });
  await db.entities.Scenario.delete(scenario.id);
  logAudit(scenario.project_id, 'scenario', 'auditMsg.scenarioDeleted', { name: scenario.name });
}

export async function createTreatment(scenario, data) {
  validateTreatment(data);
  const record = await db.entities.Treatment.create({
    scenario_id: scenario.id,
    project_id: scenario.project_id,
    ...data,
  });
  logAudit(scenario.project_id, 'treatment', 'auditMsg.treatmentAdded', { treatment: record.name, scenario: scenario.name });
  return record;
}

export async function updateTreatment(scenario, treatmentId, patch) {
  validateTreatment(patch);
  const record = await db.entities.Treatment.update(treatmentId, patch);
  logAudit(scenario.project_id, 'treatment', 'auditMsg.treatmentUpdated', { treatment: record.name, scenario: scenario.name });
  return record;
}

export async function deleteTreatment(scenario, treatment) {
  await db.entities.Treatment.delete(treatment.id);
  logAudit(scenario.project_id, 'treatment', 'auditMsg.treatmentDeleted', { treatment: treatment.name, scenario: scenario.name });
}

// Renders a bundled sample's user-facing text (name, scoping fields,
// assumptions, estimate units) through the UI translator. Applied at load and
// reset time only: once loaded, samples are ordinary user data and keep the
// language they were loaded in — switching the UI language later does not
// rewrite them (delete and reload to get another language). Without t (tests,
// missing keys) the English JSON passes through unchanged.
export function localizeSample(sample, t) {
  if (!t) return sample;
  const k = (field) => t(`samples.${sample.id}.${field}`);
  const fair = structuredClone(sample.fair);
  fair.threat_event_frequency.unit = k('unitTef');
  fair.vulnerability.unit = t('units.probability');
  fair.secondary_loss_probability.unit = t('units.probability');
  fair.primary_loss.unit = t('units.usdPerEvent');
  fair.secondary_loss.unit = t('units.usdPerEvent');
  return {
    ...sample,
    fair,
    name: k('name'),
    description: k('description'),
    asset: k('asset'),
    threat: k('threat'),
    effect: k('effect'),
    owner: k('owner'),
    assumptions: [k('a1'), k('a2'), k('a3')],
  };
}

// Loads a bundled demonstration library into a project, translated into the
// active UI language when t is provided. Scenarios already loaded there
// (matched by sample_id) are skipped, so the action is idempotent per library.
export async function loadSampleScenarios(projectId, t = null, libraryId = DEFAULT_LIBRARY_ID) {
  const library = getLibrary(libraryId);
  const existing = await db.entities.Scenario.filter({ project_id: projectId });
  const present = new Set(existing.map(s => s.sample_id).filter(Boolean));
  const fresh = library.scenarios.filter(s => !present.has(s.id));
  if (fresh.length === 0) return [];
  const records = await db.entities.Scenario.bulkCreate(
    fresh.map((sample) => {
      const { id, ...rest } = localizeSample(sample, t);
      return {
        ...rest,
        project_id: projectId,
        sample_id: id,
        simulation: null,
        ai_narrative: null,
      };
    }),
  );
  logAudit(projectId, 'scenario', 'auditMsg.samplesLoadedFrom', { count: records.length, library: library.company });
  return records;
}
