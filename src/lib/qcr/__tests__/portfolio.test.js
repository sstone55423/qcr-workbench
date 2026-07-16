import { describe, it, expect } from 'vitest';
import { portfolioAle, simulatePortfolio, scenarioSeed } from '@/lib/qcr/portfolio';
import { simulateAnnualLoss } from '@/lib/qcr/simulation';
import { expectedLoss } from '@/lib/qcr/fair';

const est = (minimum, most_likely, maximum) => ({ minimum, most_likely, maximum, unit: '' });

const fairA = {
  threat_event_frequency: est(0.5, 1, 3),
  vulnerability: est(0.1, 0.3, 0.6),
  primary_loss: est(50000, 150000, 600000),
  secondary_loss: est(10000, 40000, 200000),
  secondary_loss_probability: est(0.1, 0.3, 0.5),
};
const fairB = {
  threat_event_frequency: est(2, 8, 20),
  vulnerability: est(0.01, 0.04, 0.12),
  primary_loss: est(25000, 180000, 900000),
  secondary_loss: est(5000, 50000, 250000),
  secondary_loss_probability: est(0.05, 0.15, 0.35),
};

const scenarios = [
  { id: 'x1', sample_id: null, name: 'Alpha', owner: 'A', fair: fairA },
  { id: 'x2', sample_id: 'bec', name: 'Beta', owner: 'B', fair: fairB },
];

describe('portfolioAle', () => {
  it('ranks scenarios by ALE descending and shares sum to 1', () => {
    const { total, rows } = portfolioAle(scenarios);
    expect(total).toBeCloseTo(expectedLoss(fairA).ale + expectedLoss(fairB).ale, 6);
    expect(rows[0].ale).toBeGreaterThanOrEqual(rows[1].ale);
    expect(rows.reduce((s, r) => s + r.share, 0)).toBeCloseTo(1, 9);
  });

  it('handles an empty portfolio', () => {
    expect(portfolioAle([])).toEqual({ total: 0, rows: [] });
  });
});

describe('simulatePortfolio', () => {
  it('is reproducible and independent of scenario order', () => {
    const a = simulatePortfolio(scenarios, 5000, 42);
    const b = simulatePortfolio([...scenarios].reverse(), 5000, 42);
    expect(a.summary).toEqual(b.summary);
    expect(a.exceedance.probabilities).toEqual(b.exceedance.probabilities);
  });

  it('reduces to the single-scenario simulation with the derived seed', () => {
    const only = [scenarios[0]];
    const portfolio = simulatePortfolio(only, 2000, 42);
    const direct = simulateAnnualLoss(fairA, 2000, scenarioSeed(42, scenarios[0]));
    expect(portfolio.summary.mean).toBeCloseTo(direct.mean, 9);
    expect(portfolio.summary.percentile_95).toBeCloseTo(direct.percentile_95, 9);
  });

  it('has a mean close to the sum of the individual simulated means', () => {
    const portfolio = simulatePortfolio(scenarios, 20000, 42);
    const sumOfMeans =
      simulateAnnualLoss(fairA, 20000, scenarioSeed(42, scenarios[0])).mean +
      simulateAnnualLoss(fairB, 20000, scenarioSeed(42, scenarios[1])).mean;
    expect(portfolio.summary.mean).toBeCloseTo(sumOfMeans, 6);
  });

  it('defaults to the independent aggregation (correlation 0)', () => {
    const withDefault = simulatePortfolio(scenarios, 5000, 42);
    const explicitZero = simulatePortfolio(scenarios, 5000, 42, 0);
    expect(withDefault.summary).toEqual(explicitZero.summary);
    expect(withDefault.params.correlation).toBe(0);
  });

  it('preserves the aggregate mean regardless of correlation (marginals unchanged)', () => {
    const indep = simulatePortfolio(scenarios, 20000, 42, 0);
    const correlated = simulatePortfolio(scenarios, 20000, 42, 0.7);
    // Reordering only re-pairs which loss lands in which year, so E[sum] is
    // identical; the tail, not the mean, is what correlation moves.
    expect(correlated.summary.mean).toBeCloseTo(indep.summary.mean, 6);
  });

  it('fattens the joint tail as correlation rises', () => {
    const indep = simulatePortfolio(scenarios, 20000, 42, 0);
    const mid = simulatePortfolio(scenarios, 20000, 42, 0.5);
    const perfect = simulatePortfolio(scenarios, 20000, 42, 1);
    expect(mid.summary.percentile_99).toBeGreaterThan(indep.summary.percentile_99);
    expect(perfect.summary.percentile_99).toBeGreaterThan(mid.summary.percentile_99);
  });

  it('stays order-independent when correlated', () => {
    const a = simulatePortfolio(scenarios, 5000, 42, 0.6);
    const b = simulatePortfolio([...scenarios].reverse(), 5000, 42, 0.6);
    expect(a.summary).toEqual(b.summary);
    expect(a.exceedance.probabilities).toEqual(b.exceedance.probabilities);
  });

  it('clamps correlation into [0, 1]', () => {
    expect(simulatePortfolio(scenarios, 2000, 42, -1).params.correlation).toBe(0);
    expect(simulatePortfolio(scenarios, 2000, 42, 5).params.correlation).toBe(1);
  });

  it('derives distinct seeds per scenario and stable seeds from sample_id', () => {
    expect(scenarioSeed(42, scenarios[0])).not.toBe(scenarioSeed(42, scenarios[1]));
    // A sample scenario keeps the same seed regardless of its record id.
    expect(scenarioSeed(42, { id: 'anything', sample_id: 'bec' })).toBe(scenarioSeed(42, { id: 'other', sample_id: 'bec' }));
  });
});
