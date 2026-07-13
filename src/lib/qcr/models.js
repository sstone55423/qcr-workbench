// Validation for the QCR domain objects. Estimates and treatments are plain
// objects (they live encrypted in IndexedDB); these validators are the port of
// v0's dataclass __post_init__ checks and throw with user-facing messages.

export const FAIR_FACTORS = [
  'threat_event_frequency',
  'vulnerability',
  'primary_loss',
  'secondary_loss',
  'secondary_loss_probability',
];

// 0 <= minimum <= most_likely <= maximum, all finite numbers.
export function validateEstimate(estimate, label = 'estimate') {
  const { minimum, most_likely, maximum } = estimate || {};
  for (const [name, value] of [['minimum', minimum], ['most likely', most_likely], ['maximum', maximum]]) {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      throw new Error(`${label}: ${name} must be a number`);
    }
  }
  if (minimum < 0) throw new Error(`${label}: minimum must be at least 0`);
  if (minimum > most_likely || most_likely > maximum) {
    throw new Error(`${label}: values must satisfy minimum ≤ most likely ≤ maximum`);
  }
  return estimate;
}

export function validateFairModel(fair) {
  for (const factor of FAIR_FACTORS) {
    if (!fair?.[factor]) throw new Error(`FAIR model is missing ${factor}`);
    validateEstimate(fair[factor], factor.replaceAll('_', ' '));
  }
  return fair;
}

const REDUCTION_FIELDS = [
  'frequency_reduction',
  'vulnerability_reduction',
  'primary_loss_reduction',
  'secondary_loss_reduction',
];

export function validateTreatment(treatment) {
  const cost = treatment?.annual_cost;
  if (typeof cost !== 'number' || !Number.isFinite(cost) || cost < 0) {
    throw new Error('annual cost must be a non-negative number');
  }
  for (const field of REDUCTION_FIELDS) {
    const value = treatment[field] ?? 0;
    if (typeof value !== 'number' || value < 0 || value > 1) {
      throw new Error(`${field.replaceAll('_', ' ')} must be between 0 and 1`);
    }
  }
  return treatment;
}
