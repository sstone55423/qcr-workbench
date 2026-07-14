import { describe, it, expect } from 'vitest';
import { executiveSummary, formatCurrency } from '@/lib/qcr/reporting';

const scenario = {
  name: 'Test', description: 'Test risk.', owner: 'Owner',
  assumptions: ['First assumption', 'Second assumption'],
};
const expected = {
  tef: 1, vulnerability: 0.5, lef: 0.5,
  primaryLoss: 100, expectedSecondaryLoss: 20, lossMagnitude: 120, ale: 60,
};
const simulation = {
  mean: 200, median: 100, percentile_90: 400, percentile_95: 500,
  percentile_99: 600, probability_of_zero_loss: 1 / 3,
};

describe('formatCurrency', () => {
  it('formats like Python "${value:,.0f}"', () => {
    expect(formatCurrency(1234567.4)).toBe('$1,234,567');
    expect(formatCurrency(0)).toBe('$0');
  });
});

describe('executiveSummary', () => {
  // v0 test_reporting.py assertions
  it('explains the ALE vs tail-loss difference when a simulation is present', () => {
    const report = executiveSummary(scenario, expected, simulation);
    expect(report).toContain('How to interpret the difference');
    expect(report).toContain('long-run average');
    expect(report).toContain('tail-risk threshold');
    expect(report).toContain('probability of no loss event');
  });

  it('renders headline exposure and assumptions without a simulation', () => {
    const report = executiveSummary(scenario, expected);
    expect(report).toContain('# Quantitative Cyber Risk Report: Test');
    expect(report).toContain('**$60**');
    expect(report).toContain('- First assumption');
    expect(report).not.toContain('How to interpret');
  });

  it('includes treatment economics when present', () => {
    const report = executiveSummary(scenario, expected, null, {
      riskReduction: 50000, netBenefit: 40000,
    });
    expect(report).toContain('## Proposed treatment');
    expect(report).toContain('**$50,000**');
    expect(report).toContain('**$40,000**');
  });

  it('appends a disclosed AI narrative with provenance', () => {
    const report = executiveSummary(scenario, expected, null, null, {
      text: 'Narrative body.',
      provenance: { label: 'Claude', model: 'claude-x', at: '2026-07-13' },
    });
    expect(report).toContain('## AI-assisted narrative');
    expect(report).toContain('**Disclosure:**');
    expect(report).toContain('Narrative body.');
    expect(report).toContain('Drafted by Claude (claude-x) on 2026-07-13');
  });

  it('renders through a supplied translator', () => {
    const fakeT = (key) => `«${key}»`;
    const report = executiveSummary(scenario, expected, simulation, null, null, fakeT);
    expect(report).toContain('# «xr.title»');
    expect(report).toContain('## «xr.exposureTitle»');
    expect(report).toContain('| «xr.colMeasure» | «xr.colAnnualLoss» | «xr.colInterpretation» |');
    expect(report).toContain('*«xr.methodology»*');
    expect(report).not.toContain('Financial exposure');
  });

  it('always credits the FAIR Institute in a methodology footer', () => {
    const report = executiveSummary(scenario, expected);
    expect(report).toContain('FAIR™');
    expect(report).toContain('https://www.fairinstitute.org/');
    // The footer is the last section, after any optional appendix.
    const withNarrative = executiveSummary(scenario, expected, null, null, { text: 'Body.', provenance: {} });
    expect(withNarrative.trim().endsWith('the FAIR Institute.*')).toBe(true);
  });
});
