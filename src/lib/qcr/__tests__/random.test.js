import { describe, it, expect } from 'vitest';
import { RNG, percentile } from '@/lib/qcr/random';

function moments(draw, n) {
  let sum = 0;
  const xs = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    xs[i] = draw();
    sum += xs[i];
  }
  const mean = sum / n;
  let varSum = 0;
  for (let i = 0; i < n; i++) varSum += (xs[i] - mean) ** 2;
  return { mean, variance: varSum / n };
}

describe('RNG statistical properties', () => {
  it('uniform has mean ~0.5', () => {
    const rng = new RNG(1);
    const { mean } = moments(() => rng.uniform(), 100000);
    expect(Math.abs(mean - 0.5)).toBeLessThan(0.005);
  });

  it('normal has mean ~0 and variance ~1', () => {
    const rng = new RNG(2);
    const { mean, variance } = moments(() => rng.normal(), 100000);
    expect(Math.abs(mean)).toBeLessThan(0.02);
    expect(Math.abs(variance - 1)).toBeLessThan(0.03);
  });

  it('beta(2, 5) matches analytic mean and variance', () => {
    const rng = new RNG(3);
    const { mean, variance } = moments(() => rng.beta(2, 5), 100000);
    const m = 2 / 7;
    const v = (2 * 5) / (49 * 8);
    expect(Math.abs(mean - m) / m).toBeLessThan(0.02);
    expect(Math.abs(variance - v) / v).toBeLessThan(0.05);
  });

  it('gamma(0.7) (shape < 1 path) matches analytic mean', () => {
    const rng = new RNG(4);
    const { mean } = moments(() => rng.gamma(0.7), 100000);
    expect(Math.abs(mean - 0.7) / 0.7).toBeLessThan(0.02);
  });

  it.each([[0.3], [5], [50]])('poisson(%s) has mean ~lambda (both sampler paths)', (lambda) => {
    const rng = new RNG(5);
    const { mean, variance } = moments(() => rng.poisson(lambda), 100000);
    expect(Math.abs(mean - lambda) / lambda).toBeLessThan(0.03);
    expect(Math.abs(variance - lambda) / lambda).toBeLessThan(0.06);
  });

  it('poisson returns only non-negative integers', () => {
    const rng = new RNG(6);
    for (const lambda of [0.5, 40]) {
      for (let i = 0; i < 1000; i++) {
        const k = rng.poisson(lambda);
        expect(Number.isInteger(k)).toBe(true);
        expect(k).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('bernoulli(0.3) has mean ~0.3', () => {
    const rng = new RNG(7);
    const { mean } = moments(() => rng.bernoulli(0.3), 100000);
    expect(Math.abs(mean - 0.3)).toBeLessThan(0.01);
  });
});

describe('percentile (NumPy linear interpolation)', () => {
  // Reference values from numpy.percentile
  it('matches numpy on a fixed vector', () => {
    const v = [15, 20, 35, 40, 50];
    expect(percentile(v, 40)).toBeCloseTo(29, 10);   // np.percentile(v, 40) == 29.0
    expect(percentile(v, 50)).toBeCloseTo(35, 10);
    expect(percentile(v, 90)).toBeCloseTo(46, 10);   // np.percentile(v, 90) == 46.0
    expect(percentile(v, 0)).toBe(15);
    expect(percentile(v, 100)).toBe(50);
  });
  it('handles unsorted input and single elements', () => {
    expect(percentile([3, 1, 2], 50)).toBe(2);
    expect(percentile([7], 95)).toBe(7);
  });
});
