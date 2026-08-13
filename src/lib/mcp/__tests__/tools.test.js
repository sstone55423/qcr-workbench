import { describe, it, expect } from 'vitest';
import { QCR_TOOLS, toolByName } from '@/lib/mcp/tools';
import { expectedLoss } from '@/lib/qcr/fair';

const est = (minimum, most_likely, maximum) => ({ minimum, most_likely, maximum });
const fair = {
  threat_event_frequency: est(0.5, 1, 3),
  vulnerability: est(0.1, 0.3, 0.6),
  primary_loss: est(50000, 150000, 600000),
  secondary_loss: est(10000, 40000, 200000),
  secondary_loss_probability: est(0.1, 0.3, 0.5),
};

describe('QCR MCP tool registry', () => {
  it('exposes the expected tools', () => {
    expect(QCR_TOOLS.map((t) => t.name)).toEqual([
      'compute_ale', 'simulate_scenario', 'evaluate_treatment', 'optimize_controls',
      'sensitivity_analysis', 'calibrate_estimate', 'search_fair_kb', 'validate_model',
    ]);
  });

  it('every tool has a description, object inputSchema, and run()', () => {
    for (const t of QCR_TOOLS) {
      expect(typeof t.description).toBe('string');
      expect(t.description.length).toBeGreaterThan(0);
      expect(t.inputSchema.type).toBe('object');
      expect(typeof t.run).toBe('function');
    }
  });

  it('compute_ale matches expectedLoss', () => {
    expect(toolByName('compute_ale').run({ fair }).ale).toBeCloseTo(expectedLoss(fair).ale, 6);
  });

  it('simulate_scenario is deterministic, summary-only (no raw loss array), 20-pt curve', () => {
    const a = toolByName('simulate_scenario').run({ fair, iterations: 2000, seed: 42 });
    const b = toolByName('simulate_scenario').run({ fair, iterations: 2000, seed: 42 });
    expect(a.mean).toBe(b.mean);
    expect(a).not.toHaveProperty('annualLosses');
    expect(a.exceedance).toHaveLength(20);
  });

  it('evaluate_treatment returns residual ALE and ROC', () => {
    const treatment = {
      annual_cost: 150000, frequency_reduction: 0.15, vulnerability_reduction: 0.35,
      primary_loss_reduction: 0.2, secondary_loss_reduction: 0.1,
    };
    const out = toolByName('evaluate_treatment').run({ fair, treatment });
    expect(out.residualAle).toBeLessThan(out.baselineAle);
    expect(out).toHaveProperty('returnOnControl');
  });

  it('calibrate_estimate inverts a 90% CI to a PERT estimate', () => {
    expect(toolByName('calibrate_estimate').run({ lower: 1_000_000, upper: 4_000_000 }).most_likely)
      .toBeCloseTo(2_500_000, 6);
  });

  it('search_fair_kb finds relevant entries across corpora and respects filters', () => {
    const all = toolByName('search_fair_kb').run({ query: 'ransomware backups recovery' });
    expect(all.matches.length).toBeGreaterThan(0);
    expect(all.matches.length).toBeLessThanOrEqual(5); // default max
    // Best-first ordering.
    for (let i = 1; i < all.matches.length; i++) {
      expect(all.matches[i - 1].score).toBeGreaterThanOrEqual(all.matches[i].score);
    }
    // Both a compromise-type write-up and a control should surface for this query.
    const corpora = new Set(all.matches.map((m) => m.corpus));
    expect(corpora.has('compromise_types') || corpora.has('controls')).toBe(true);

    const controlsOnly = toolByName('search_fair_kb').run({ query: 'mfa credential', corpus: 'controls', max_results: 3 });
    expect(controlsOnly.corpora_searched).toEqual(['controls']);
    expect(controlsOnly.matches.length).toBeLessThanOrEqual(3);
    expect(controlsOnly.matches.every((m) => m.corpus === 'controls')).toBe(true);

    expect(toolByName('search_fair_kb').run({ query: 'zzzz qqqq' }).matches).toHaveLength(0);
  });

  it('validate_model flags a bad factor ordering', () => {
    const bad = { ...fair, vulnerability: est(0.6, 0.3, 0.1) };
    expect(toolByName('validate_model').run({ fair: bad }).valid).toBe(false);
    expect(toolByName('validate_model').run({ fair }).valid).toBe(true);
  });
});
