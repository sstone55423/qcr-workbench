import { describe, it, expect } from 'vitest';
import { pertMean, samplePert } from '@/lib/qcr/estimates';
import { validateEstimate } from '@/lib/qcr/models';
import { RNG } from '@/lib/qcr/random';

const est = (minimum, most_likely, maximum, unit = '') => ({ minimum, most_likely, maximum, unit });

describe('validateEstimate', () => {
  it('rejects out-of-order values', () => {
    expect(() => validateEstimate(est(10, 5, 20))).toThrow(/minimum/);
  });
  it('rejects negative minimum', () => {
    expect(() => validateEstimate(est(-1, 0, 1))).toThrow(/at least 0/);
  });
  it('accepts a valid estimate', () => {
    expect(validateEstimate(est(1, 4, 10))).toBeTruthy();
  });
});

describe('pertMean', () => {
  it('matches (min + 4·mode + max) / 6', () => {
    expect(pertMean(est(1, 4, 10))).toBeCloseTo(4.5, 12);
  });
});

describe('samplePert', () => {
  it('throws for size < 1', () => {
    expect(() => samplePert(est(1, 2, 3), 0, new RNG(1))).toThrow(/at least 1/);
  });
  it('returns constants when min === max', () => {
    const s = samplePert(est(5, 5, 5), 100, new RNG(1));
    expect(Array.from(s).every((x) => x === 5)).toBe(true);
  });
  it('stays within bounds', () => {
    const s = samplePert(est(1, 4, 10), 2000, new RNG(7));
    for (const x of s) {
      expect(x).toBeGreaterThanOrEqual(1);
      expect(x).toBeLessThanOrEqual(10);
    }
  });
  it('sample mean matches the v0 sampler analytic mean', () => {
    // v0's sample_pert builds alpha/beta from the PERT MEAN, not the mode, so
    // the sampling distribution's true mean is (min + 4·pertMean + max)/6 —
    // slightly above pertMean. Preserved deliberately for v0 parity.
    const s = samplePert(est(1, 4, 10), 50000, new RNG(42));
    const mean = s.reduce((a, b) => a + b, 0) / s.length;
    const analytic = (1 + 4 * pertMean(est(1, 4, 10)) + 10) / 6; // 29/6
    expect(Math.abs(mean - analytic) / analytic).toBeLessThan(0.01);
  });
});
