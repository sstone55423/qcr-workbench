import { describe, it, expect } from 'vitest';
import {
  applyTreatment, compareTreatment, combineTreatments, compareTreatmentSet, optimizeTreatments,
} from '@/lib/qcr/treatments';

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

const treatment = (id, cost, vulnReduction, freqReduction = 0) => ({
  id, name: id, annual_cost: cost,
  frequency_reduction: freqReduction, vulnerability_reduction: vulnReduction,
  primary_loss_reduction: 0, secondary_loss_reduction: 0,
});

describe('combineTreatments', () => {
  it('adds costs and compounds same-factor reductions with diminishing returns', () => {
    const combined = combineTreatments([treatment('a', 10000, 0.5), treatment('b', 20000, 0.5)]);
    expect(combined.annual_cost).toBe(30000);
    expect(combined.vulnerability_reduction).toBeCloseTo(0.75, 10); // not 1.0
    expect(combined.frequency_reduction).toBe(0);
  });

  it('never exceeds a 100% reduction', () => {
    const combined = combineTreatments([treatment('a', 0, 1), treatment('b', 0, 0.9)]);
    expect(combined.vulnerability_reduction).toBeCloseTo(1, 10);
  });

  it('a set of one equals the treatment itself', () => {
    const single = treatment('a', 10000, 0.5);
    expect(compareTreatmentSet(model, [single])).toEqual(compareTreatment(model, single));
  });
});

describe('optimizeTreatments', () => {
  // Baseline ALE 100k. a: 50% vuln cut for 10k (net 40k). b: 30% for 5k
  // (net 25k). Together: 65% cut for 15k (net 50k) — better than either.
  const a = treatment('a', 10000, 0.5);
  const b = treatment('b', 5000, 0.3);

  it('picks the combination when it beats every single treatment', () => {
    const { best } = optimizeTreatments(model, [a, b], 20000);
    expect(best.ids.sort()).toEqual(['a', 'b']);
    expect(best.comparison.netBenefit).toBeCloseTo(100000 * 0.65 - 15000, 6);
  });

  it('respects the budget cap', () => {
    const { best, affordableExists } = optimizeTreatments(model, [a, b], 9000);
    expect(affordableExists).toBe(true);
    expect(best.ids).toEqual(['b']); // only b fits 9k
  });

  it('reports when nothing fits the budget', () => {
    const { best, affordableExists } = optimizeTreatments(model, [a, b], 1000);
    expect(best).toBeNull();
    expect(affordableExists).toBe(false);
  });

  it('returns no set when doing nothing is better', () => {
    const wasteful = treatment('w', 500000, 0.1); // costs far more than it saves
    const { best, affordableExists } = optimizeTreatments(model, [wasteful], 1e9);
    expect(best).toBeNull();
    expect(affordableExists).toBe(true);
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
