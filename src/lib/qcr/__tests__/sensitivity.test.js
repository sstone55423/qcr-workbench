import { describe, it, expect } from 'vitest';
import { sensitivityRows } from '@/lib/qcr/sensitivity';
import { expectedLoss } from '@/lib/qcr/fair';

const est = (minimum, most_likely, maximum) => ({ minimum, most_likely, maximum, unit: '' });

const fair = {
  threat_event_frequency: est(0.5, 1, 3),
  vulnerability: est(0.1, 0.3, 0.6),
  primary_loss: est(50000, 150000, 600000),
  secondary_loss: est(10000, 40000, 200000),
  secondary_loss_probability: est(0.1, 0.3, 0.5),
};

describe('sensitivityRows', () => {
  it('brackets the baseline and sorts by swing width', () => {
    const { baseline, rows } = sensitivityRows(fair);
    expect(baseline).toBeCloseTo(expectedLoss(fair).ale, 9);
    expect(rows).toHaveLength(5);
    for (const row of rows) {
      expect(row.low).toBeLessThanOrEqual(baseline);
      expect(row.high).toBeGreaterThanOrEqual(baseline);
    }
    for (let i = 1; i < rows.length; i++) {
      expect(rows[i - 1].high - rows[i - 1].low).toBeGreaterThanOrEqual(rows[i].high - rows[i].low);
    }
  });

  it('gives a degenerate factor zero swing', () => {
    const pinned = { ...fair, vulnerability: est(0.3, 0.3, 0.3) };
    const { rows } = sensitivityRows(pinned);
    const vuln = rows.find((r) => r.factor === 'vulnerability');
    expect(vuln.high - vuln.low).toBeCloseTo(0, 9);
  });

  it('does not mutate the input model', () => {
    const before = JSON.stringify(fair);
    sensitivityRows(fair);
    expect(JSON.stringify(fair)).toBe(before);
  });
});
