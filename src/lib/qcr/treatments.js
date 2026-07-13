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
