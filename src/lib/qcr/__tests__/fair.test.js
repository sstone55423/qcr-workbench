import { describe, it, expect } from 'vitest';
import { expectedLoss, decompositionRows } from '@/lib/qcr/fair';

const fixed = (v, unit = '') => ({ minimum: v, most_likely: v, maximum: v, unit });

// v0 test_fair.py reference case
const model = {
  threat_event_frequency: fixed(2),
  vulnerability: fixed(0.25),
  primary_loss: fixed(100000),
  secondary_loss: fixed(50000),
  secondary_loss_probability: fixed(0.2),
};

describe('expectedLoss', () => {
  it('reproduces the v0 reference decomposition', () => {
    const r = expectedLoss(model);
    expect(r.tef).toBeCloseTo(2, 10);
    expect(r.vulnerability).toBeCloseTo(0.25, 10);
    expect(r.lef).toBeCloseTo(0.5, 10);
    expect(r.primaryLoss).toBeCloseTo(100000, 6);
    expect(r.expectedSecondaryLoss).toBeCloseTo(10000, 6);
    expect(r.lossMagnitude).toBeCloseTo(110000, 6);
    expect(r.ale).toBeCloseTo(55000, 6);
  });
});

describe('decompositionRows', () => {
  it('returns the five FAIR factors in order', () => {
    const rows = decompositionRows(model);
    expect(rows).toHaveLength(5);
    expect(rows[0].labelKey).toBe('fair.factorTef');
    expect(rows[0].estimate.minimum).toBe(2);
  });
});
