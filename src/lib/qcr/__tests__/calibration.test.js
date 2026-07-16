import { describe, it, expect } from 'vitest';
import { ciToEstimate } from '@/lib/qcr/calibration';
import { samplePert } from '@/lib/qcr/estimates';
import { RNG } from '@/lib/qcr/random';

describe('ciToEstimate', () => {
  it('produces a distribution whose 5th–95th range matches the stated CI', () => {
    const est = ciToEstimate(500000, 900000);
    const samples = samplePert({ ...est, unit: '' }, 100000, new RNG(42));
    let within = 0;
    for (const x of samples) if (x >= 500000 && x <= 900000) within += 1;
    expect(within / samples.length).toBeCloseTo(0.90, 1.5); // ±~3%
    expect(est.most_likely).toBeCloseTo(700000, 0); // symmetric → midpoint
    expect(est.minimum).toBeLessThan(500000);
    expect(est.minimum).toBeGreaterThan(0);
    expect(est.maximum).toBeGreaterThan(900000);
  });

  it('clamps a negative implied minimum to zero', () => {
    const est = ciToEstimate(10, 1000);
    expect(est.minimum).toBe(0);
    expect(est.maximum).toBeGreaterThan(1000);
    expect(est.most_likely).toBeGreaterThan(0);
  });

  it('rejects unusable bounds', () => {
    expect(ciToEstimate(5, 5)).toBeNull();
    expect(ciToEstimate(10, 5)).toBeNull();
    expect(ciToEstimate(-1, 5)).toBeNull();
    expect(ciToEstimate(NaN, 5)).toBeNull();
  });
});
