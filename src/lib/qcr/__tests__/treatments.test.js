import { describe, it, expect } from 'vitest';
import { applyTreatment, compareTreatment } from '@/lib/qcr/treatments';

const fixed = (v) => ({ minimum: v, most_likely: v, maximum: v, unit: '' });

// v0 test_treatments.py reference: baseline ALE 100k; halving vulnerability
// gives residual 50k; cost 10k → net benefit 40k, return on control 4.0.
const model = {
  threat_event_frequency: fixed(2),
  vulnerability: fixed(0.5),
  primary_loss: fixed(100000),
  secondary_loss: fixed(0),
  secondary_loss_probability: fixed(0),
};

describe('compareTreatment', () => {
  it('reproduces the v0 reference economics', () => {
    const r = compareTreatment(model, {
      name: 'MFA', annual_cost: 10000,
      frequency_reduction: 0, vulnerability_reduction: 0.5,
      primary_loss_reduction: 0, secondary_loss_reduction: 0,
    });
    expect(r.baselineAle).toBeCloseTo(100000, 6);
    expect(r.residualAle).toBeCloseTo(50000, 6);
    expect(r.riskReduction).toBeCloseTo(50000, 6);
    expect(r.netBenefit).toBeCloseTo(40000, 6);
    expect(r.returnOnControl).toBeCloseTo(4.0, 10);
  });

  it('returns null return-on-control at zero cost', () => {
    const r = compareTreatment(model, {
      name: 'Free', annual_cost: 0,
      frequency_reduction: 0, vulnerability_reduction: 0.5,
      primary_loss_reduction: 0, secondary_loss_reduction: 0,
    });
    expect(r.returnOnControl).toBeNull();
    expect(r.netBenefit).toBeCloseTo(50000, 6);
  });
});

describe('applyTreatment', () => {
  it('scales all three estimate points and passes secondary_loss_probability through', () => {
    const slp = { minimum: 0.1, most_likely: 0.2, maximum: 0.4, unit: 'probability' };
    const fair = { ...model, secondary_loss_probability: slp };
    const reduced = applyTreatment(fair, {
      annual_cost: 0, frequency_reduction: 0.5,
      vulnerability_reduction: 0, primary_loss_reduction: 0, secondary_loss_reduction: 0,
    });
    expect(reduced.threat_event_frequency.minimum).toBeCloseTo(1, 10);
    expect(reduced.threat_event_frequency.most_likely).toBeCloseTo(1, 10);
    expect(reduced.threat_event_frequency.maximum).toBeCloseTo(1, 10);
    expect(reduced.secondary_loss_probability).toEqual(slp);
  });
});
