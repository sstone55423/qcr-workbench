// One-at-a-time sensitivity of the deterministic ALE: swing each FAIR factor
// to its minimum and to its maximum while the other factors stay at their
// PERT means (exactly as expectedLoss uses them). The swing width shows which
// assumption drives the result — and where better data would matter most.
import { expectedLoss } from '@/lib/qcr/fair';
import { FAIR_FACTORS } from '@/lib/qcr/models';

const FACTOR_LABEL_KEYS = {
  threat_event_frequency: 'fair.factorTef',
  vulnerability: 'fair.factorVulnerability',
  primary_loss: 'fair.factorPrimaryLoss',
  secondary_loss: 'fair.factorSecondaryLoss',
  secondary_loss_probability: 'fair.factorSlp',
};

// Pin one factor to a single value (a degenerate estimate has that value as
// its PERT mean), leaving the others untouched.
const pin = (fair, factor, value) => ({
  ...fair,
  [factor]: { ...fair[factor], minimum: value, most_likely: value, maximum: value },
});

// Rows sorted by swing width (widest first — tornado order). low/high are the
// ALE values at the factor's two extremes; baseline is the unmodified ALE.
export function sensitivityRows(fair) {
  const baseline = expectedLoss(fair).ale;
  const rows = FAIR_FACTORS.map((factor) => {
    const atMin = expectedLoss(pin(fair, factor, fair[factor].minimum)).ale;
    const atMax = expectedLoss(pin(fair, factor, fair[factor].maximum)).ale;
    return {
      factor,
      labelKey: FACTOR_LABEL_KEYS[factor],
      low: Math.min(atMin, atMax),
      high: Math.max(atMin, atMax),
    };
  });
  rows.sort((a, b) => (b.high - b.low) - (a.high - a.low));
  return { baseline, rows };
}
