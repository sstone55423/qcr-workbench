// Monte Carlo loss simulation — port of v0 simulation.py. The sampling
// semantics are preserved exactly: one Poisson event count per simulated year
// with rate TEF·Vulnerability, and ONE sampled per-event loss (with one
// Bernoulli secondary draw) shared by all events in that year.
import { samplePert } from '@/lib/qcr/estimates';
import { RNG, percentile } from '@/lib/qcr/random';

export const ITERATION_CHOICES = [1000, 5000, 10000, 20000, 50000];
export const DEFAULT_ITERATIONS = 20000;
export const DEFAULT_SEED = 42;

export function simulateAnnualLoss(fair, iterations = DEFAULT_ITERATIONS, seed = DEFAULT_SEED) {
  if (iterations < 100) throw new Error('iterations must be at least 100');
  const rng = new RNG(seed);
  const tef = samplePert(fair.threat_event_frequency, iterations, rng);
  const vulnerability = samplePert(fair.vulnerability, iterations, rng);
  for (let i = 0; i < iterations; i++) {
    vulnerability[i] = Math.min(Math.max(vulnerability[i], 0), 1);
  }
  const eventCounts = new Float64Array(iterations);
  for (let i = 0; i < iterations; i++) {
    eventCounts[i] = rng.poisson(tef[i] * vulnerability[i]);
  }
  const primary = samplePert(fair.primary_loss, iterations, rng);
  const secondaryProbability = samplePert(fair.secondary_loss_probability, iterations, rng);
  for (let i = 0; i < iterations; i++) {
    secondaryProbability[i] = Math.min(Math.max(secondaryProbability[i], 0), 1);
  }
  const secondary = samplePert(fair.secondary_loss, iterations, rng);

  const annualLosses = new Float64Array(iterations);
  let zeroCount = 0;
  let sum = 0;
  for (let i = 0; i < iterations; i++) {
    const perEventLoss = primary[i] + rng.bernoulli(secondaryProbability[i]) * secondary[i];
    const loss = eventCounts[i] * perEventLoss;
    annualLosses[i] = loss;
    sum += loss;
    if (loss === 0) zeroCount += 1;
  }

  return {
    annualLosses,
    mean: sum / iterations,
    median: percentile(annualLosses, 50),
    percentile_90: percentile(annualLosses, 90),
    percentile_95: percentile(annualLosses, 95),
    percentile_99: percentile(annualLosses, 99),
    probability_of_zero_loss: zeroCount / iterations,
    max_loss: annualLosses.reduce((m, x) => (x > m ? x : m), 0),
    iterations,
  };
}

// Loss thresholds and the probability that annual loss strictly exceeds each.
export function exceedanceCurve(annualLosses, points = 100) {
  const n = annualLosses.length;
  let max = 0;
  for (let i = 0; i < n; i++) if (annualLosses[i] > max) max = annualLosses[i];
  const top = Math.max(max, 1);
  const thresholds = [];
  const probabilities = [];
  for (let p = 0; p < points; p++) {
    const threshold = (top * p) / (points - 1);
    let count = 0;
    for (let i = 0; i < n; i++) if (annualLosses[i] > threshold) count += 1;
    thresholds.push(threshold);
    probabilities.push(count / n);
  }
  return { thresholds, probabilities };
}

// Equal-width histogram over [0, max]; returns bin width and counts so the
// persisted summary stays a few KB instead of the raw loss array.
export function histogramBins(annualLosses, bins = 60) {
  const n = annualLosses.length;
  let max = 0;
  for (let i = 0; i < n; i++) if (annualLosses[i] > max) max = annualLosses[i];
  const top = Math.max(max, 1);
  const binWidth = top / bins;
  const counts = new Array(bins).fill(0);
  for (let i = 0; i < n; i++) {
    const idx = Math.min(Math.floor(annualLosses[i] / binWidth), bins - 1);
    counts[idx] += 1;
  }
  return { binWidth, counts };
}
