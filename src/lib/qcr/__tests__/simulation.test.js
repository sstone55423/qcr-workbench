import { describe, it, expect } from 'vitest';
import { simulateAnnualLoss, exceedanceCurve, histogramBins } from '@/lib/qcr/simulation';

const est = (minimum, most_likely, maximum) => ({ minimum, most_likely, maximum, unit: '' });

const model = {
  threat_event_frequency: est(0.5, 1, 3),
  vulnerability: est(0.1, 0.3, 0.6),
  primary_loss: est(50000, 150000, 600000),
  secondary_loss: est(10000, 40000, 200000),
  secondary_loss_probability: est(0.1, 0.3, 0.5),
};

describe('simulateAnnualLoss', () => {
  it('throws for fewer than 100 iterations', () => {
    expect(() => simulateAnnualLoss(model, 50)).toThrow(/at least 100/);
  });

  it('is reproducible for the same seed and differs across seeds', () => {
    const a = simulateAnnualLoss(model, 1000, 42);
    const b = simulateAnnualLoss(model, 1000, 42);
    const c = simulateAnnualLoss(model, 1000, 7);
    expect(Array.from(a.annualLosses)).toEqual(Array.from(b.annualLosses));
    expect(a.mean).not.toBe(c.mean);
  });

  it('produces ordered, sane summary statistics', () => {
    const r = simulateAnnualLoss(model, 5000, 42);
    expect(r.median).toBeLessThanOrEqual(r.percentile_90);
    expect(r.percentile_90).toBeLessThanOrEqual(r.percentile_95);
    expect(r.percentile_95).toBeLessThanOrEqual(r.percentile_99);
    expect(r.probability_of_zero_loss).toBeGreaterThanOrEqual(0);
    expect(r.probability_of_zero_loss).toBeLessThanOrEqual(1);
    expect(r.max_loss).toBeGreaterThanOrEqual(r.percentile_99);
    for (const x of r.annualLosses) expect(x).toBeGreaterThanOrEqual(0);
  });

  it('matches the analytic expectation of the v0 sampling scheme at scale', () => {
    // E[annual] = E[TEF]·E[V]·(E[P] + E[SLP]·E[S]) with each factor's mean
    // being the v0 sampler's analytic mean (min + 4·pertMean + max)/6 — see
    // estimates.test.js for why that differs from pertMean.
    const r = simulateAnnualLoss(model, 50000, 42);
    const samplerMean = ({ minimum, most_likely, maximum }) => {
      const pert = (minimum + 4 * most_likely + maximum) / 6;
      return (minimum + 4 * pert + maximum) / 6;
    };
    const expectedMean =
      samplerMean(model.threat_event_frequency) *
      samplerMean(model.vulnerability) *
      (samplerMean(model.primary_loss) +
        samplerMean(model.secondary_loss_probability) * samplerMean(model.secondary_loss));
    expect(Math.abs(r.mean - expectedMean) / expectedMean).toBeLessThan(0.05);
  });
});

describe('exceedanceCurve', () => {
  it('starts at threshold 0 and is monotone non-increasing over 100 points', () => {
    const r = simulateAnnualLoss(model, 2000, 42);
    const { thresholds, probabilities } = exceedanceCurve(r.annualLosses);
    expect(thresholds).toHaveLength(100);
    expect(thresholds[0]).toBe(0);
    for (let i = 1; i < probabilities.length; i++) {
      expect(probabilities[i]).toBeLessThanOrEqual(probabilities[i - 1]);
    }
  });
});

describe('histogramBins', () => {
  it('buckets every sample exactly once', () => {
    const r = simulateAnnualLoss(model, 2000, 42);
    const { binWidth, counts } = histogramBins(r.annualLosses, 60);
    expect(counts).toHaveLength(60);
    expect(binWidth).toBeGreaterThan(0);
    expect(counts.reduce((a, b) => a + b, 0)).toBe(2000);
  });
});
