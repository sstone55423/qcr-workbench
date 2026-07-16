// Calibrated-estimator entry: convert a 90% confidence interval ("I'm 90%
// sure the value is between L and U") into the three-point estimate the PERT
// model stores. For the symmetric modified-PERT (shape 4, mode centered) the
// underlying Beta(3,3) has its 5th/95th percentiles at these fixed fractions
// of the [min, max] range, so the inversion is exact — the resulting
// distribution's 5th–95th percentile range is exactly [L, U].
const P05 = 0.1892553774; // Beta(3,3) 5th percentile
const P95 = 0.8107446226; // Beta(3,3) 95th percentile

// Returns {minimum, most_likely, maximum} or null when the bounds are not a
// usable interval. When the computed minimum would be negative it is clamped
// to 0 (estimates are non-negative); the interval is then slightly wider than
// 90% on the low side — the filled three points are shown for review anyway.
export function ciToEstimate(lower, upper) {
  if (!Number.isFinite(lower) || !Number.isFinite(upper)) return null;
  if (lower < 0 || upper <= lower) return null;
  const span = (upper - lower) / (P95 - P05);
  const rawMin = lower - P05 * span;
  const maximum = rawMin + span;
  const minimum = Math.max(0, rawMin);
  return { minimum, most_likely: (rawMin + maximum) / 2, maximum };
}
