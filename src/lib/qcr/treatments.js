// Risk-treatment modeling and economic comparison — port of v0 treatments.py.
// Comparison uses the DETERMINISTIC ALE, so results are always consistent with
// the current FAIR model and recomputable at render (never persisted).
import { expectedLoss } from '@/lib/qcr/fair';

function reduceEstimate(estimate, reduction) {
  const factor = 1 - (reduction || 0);
  return {
    ...estimate,
    minimum: estimate.minimum * factor,
    most_likely: estimate.most_likely * factor,
    maximum: estimate.maximum * factor,
  };
}

// Secondary-loss probability is intentionally passed through unchanged —
// treatments in this model reduce how often and how much, not the chance that
// a loss event has secondary consequences.
export function applyTreatment(fair, treatment) {
  return {
    threat_event_frequency: reduceEstimate(fair.threat_event_frequency, treatment.frequency_reduction),
    vulnerability: reduceEstimate(fair.vulnerability, treatment.vulnerability_reduction),
    primary_loss: reduceEstimate(fair.primary_loss, treatment.primary_loss_reduction),
    secondary_loss: reduceEstimate(fair.secondary_loss, treatment.secondary_loss_reduction),
    secondary_loss_probability: fair.secondary_loss_probability,
  };
}

export function compareTreatment(fair, treatment) {
  const baselineAle = expectedLoss(fair).ale;
  const residualAle = expectedLoss(applyTreatment(fair, treatment)).ale;
  const riskReduction = baselineAle - residualAle;
  const netBenefit = riskReduction - treatment.annual_cost;
  return {
    baselineAle,
    residualAle,
    riskReduction,
    annualCost: treatment.annual_cost,
    netBenefit,
    returnOnControl: treatment.annual_cost ? netBenefit / treatment.annual_cost : null,
  };
}

// Combines several treatments into one virtual treatment: costs add, and
// reductions of the same factor compound on the residual (two 50% reductions
// leave 25%, not 0%) — the independent-controls assumption, which builds in
// diminishing returns and can never exceed 100%.
export function combineTreatments(treatments) {
  const compound = (key) => 1 - treatments.reduce((left, t) => left * (1 - (t[key] || 0)), 1);
  return {
    annual_cost: treatments.reduce((sum, t) => sum + (t.annual_cost || 0), 0),
    frequency_reduction: compound('frequency_reduction'),
    vulnerability_reduction: compound('vulnerability_reduction'),
    primary_loss_reduction: compound('primary_loss_reduction'),
    secondary_loss_reduction: compound('secondary_loss_reduction'),
  };
}

// Economics of a treatment SET, using the combined virtual treatment.
export function compareTreatmentSet(fair, treatments) {
  return compareTreatment(fair, combineTreatments(treatments));
}

// Best treatment set under an annual budget, by exhaustive subset search —
// treatment interactions (compounding reductions) make greedy selection
// unsound, and per-scenario treatment counts are small, so 2^n is cheap.
// Maximizes net benefit; ties break toward the cheaper set. `best` is null
// when no affordable combination beats doing nothing.
export function optimizeTreatments(fair, treatments, budget) {
  const n = treatments.length;
  if (n === 0) return { best: null, affordableExists: false };
  if (n > 16) throw new Error('optimizeTreatments supports at most 16 treatments');
  let best = null;
  let affordableExists = false;
  for (let mask = 1; mask < (1 << n); mask++) {
    const subset = [];
    let cost = 0;
    for (let i = 0; i < n; i++) {
      if (mask & (1 << i)) {
        subset.push(treatments[i]);
        cost += treatments[i].annual_cost || 0;
      }
    }
    if (cost > budget) continue;
    affordableExists = true;
    const comparison = compareTreatmentSet(fair, subset);
    if (
      !best ||
      comparison.netBenefit > best.comparison.netBenefit ||
      (comparison.netBenefit === best.comparison.netBenefit && comparison.annualCost < best.comparison.annualCost)
    ) {
      best = { treatments: subset, ids: subset.map((t) => t.id), comparison };
    }
  }
  if (best && best.comparison.netBenefit <= 0) best = null;
  return { best, affordableExists };
}
