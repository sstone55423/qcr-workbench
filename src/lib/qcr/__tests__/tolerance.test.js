import { describe, it, expect } from 'vitest';
import { exceedanceProbabilityAt, toleranceStatus } from '@/lib/qcr/tolerance';

const curve = {
  thresholds: [0, 100, 200, 300],
  probabilities: [0.9, 0.5, 0.2, 0],
};

describe('exceedanceProbabilityAt', () => {
  it('interpolates linearly between curve points', () => {
    expect(exceedanceProbabilityAt(curve, 100)).toBeCloseTo(0.5, 9);
    expect(exceedanceProbabilityAt(curve, 150)).toBeCloseTo(0.35, 9);
    expect(exceedanceProbabilityAt(curve, 250)).toBeCloseTo(0.1, 9);
  });

  it('clamps outside the simulated range', () => {
    expect(exceedanceProbabilityAt(curve, -5)).toBe(0.9);
    expect(exceedanceProbabilityAt(curve, 1e9)).toBe(0);
  });
});

describe('toleranceStatus', () => {
  it('reports within appetite when the estimated probability is at or below it', () => {
    expect(toleranceStatus(curve, { threshold: 250, probability: 0.1 })).toEqual({ probability: expect.closeTo(0.1, 9), within: true });
    expect(toleranceStatus(curve, { threshold: 150, probability: 0.1 })).toMatchObject({ within: false });
  });

  it('returns null without a curve or a usable tolerance', () => {
    expect(toleranceStatus(null, { threshold: 100, probability: 0.1 })).toBeNull();
    expect(toleranceStatus(curve, null)).toBeNull();
    expect(toleranceStatus(curve, { threshold: 0, probability: 0.1 })).toBeNull();
  });
});
