// Risk tolerance: a project-level statement of appetite — "we accept at most
// a {probability} chance of losing more than {threshold} in a year" — checked
// against a simulated loss exceedance curve. The tolerance itself lives on
// the Project record ({ threshold, probability } or null).

// Probability that annual loss exceeds `threshold`, read off an exceedance
// curve by linear interpolation between the surrounding points. Beyond the
// simulated maximum the curve is ~0; below the first point it is the curve's
// starting probability.
export function exceedanceProbabilityAt(exceedance, threshold) {
  const { thresholds, probabilities } = exceedance;
  if (threshold <= thresholds[0]) return probabilities[0];
  const last = thresholds.length - 1;
  if (threshold >= thresholds[last]) return probabilities[last];
  let i = 1;
  while (thresholds[i] < threshold) i += 1;
  const t0 = thresholds[i - 1];
  const t1 = thresholds[i];
  const w = t1 === t0 ? 0 : (threshold - t0) / (t1 - t0);
  return probabilities[i - 1] + w * (probabilities[i] - probabilities[i - 1]);
}

// null when there is nothing to compare; otherwise the estimated probability
// of exceeding the tolerated loss and whether that sits within appetite.
export function toleranceStatus(exceedance, tolerance) {
  if (!exceedance || !tolerance || !(tolerance.threshold > 0)) return null;
  const probability = exceedanceProbabilityAt(exceedance, tolerance.threshold);
  return { probability, within: probability <= tolerance.probability };
}
