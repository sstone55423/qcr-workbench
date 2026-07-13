// Three-point (modified PERT) estimate utilities — port of v0 estimates.py.

export const PERT_SHAPE = 4.0;

// Mean of a modified PERT distribution: (min + 4·mode + max) / 6 at shape 4.
export function pertMean(estimate, shape = PERT_SHAPE) {
  return (estimate.minimum + shape * estimate.most_likely + estimate.maximum) / (shape + 2);
}

// Sample a bounded modified PERT distribution into a Float64Array.
export function samplePert(estimate, size, rng, shape = PERT_SHAPE) {
  if (size < 1) throw new Error('size must be at least 1');
  const low = estimate.minimum;
  const mode = estimate.most_likely;
  const high = estimate.maximum;
  const out = new Float64Array(size);
  if (low === high) {
    out.fill(low);
    return out;
  }
  const mean = (low + shape * mode + high) / (shape + 2);
  const alpha = 1 + (shape * (mean - low)) / (high - low);
  const beta = 1 + (shape * (high - mean)) / (high - low);
  for (let i = 0; i < size; i++) {
    out[i] = low + rng.beta(alpha, beta) * (high - low);
  }
  return out;
}
