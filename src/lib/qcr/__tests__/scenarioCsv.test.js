import { describe, it, expect } from 'vitest';
import { scenariosToCsv, parseScenariosCsv, parseCsv, CSV_HEADERS } from '@/lib/qcr/scenarioCsv';

const est = (minimum, most_likely, maximum, unit = 'u', rationale = '') => ({
  minimum, most_likely, maximum, unit, ...(rationale ? { rationale } : {}),
});

const scenario = {
  name: 'Ransomware, "the big one"', // comma and quotes on purpose
  description: 'Line one\nline two',
  asset: 'MES', threat: 'Affiliate', effect: 'Outage', owner: 'VP, Ops',
  assumptions: ['First', 'Second'],
  fair: {
    threat_event_frequency: est(0.2, 0.7, 1.8, 'events/year', 'Incident data 2023–25'),
    vulnerability: est(0.15, 0.35, 0.65, 'probability'),
    primary_loss: est(350000, 1300000, 4800000, 'USD/event'),
    secondary_loss: est(100000, 800000, 3500000, 'USD/event'),
    secondary_loss_probability: est(0.1, 0.3, 0.6, 'probability'),
  },
};

describe('scenario CSV roundtrip', () => {
  it('survives commas, quotes, newlines, assumptions, and rationales', () => {
    const csv = scenariosToCsv([scenario]);
    const { scenarios, errors } = parseScenariosCsv(csv);
    expect(errors).toEqual([]);
    expect(scenarios).toHaveLength(1);
    const back = scenarios[0];
    expect(back.name).toBe(scenario.name);
    expect(back.description).toBe(scenario.description);
    expect(back.owner).toBe('VP, Ops');
    expect(back.assumptions).toEqual(['First', 'Second']);
    expect(back.fair.threat_event_frequency).toEqual(scenario.fair.threat_event_frequency);
    expect(back.fair.vulnerability.rationale).toBeUndefined();
  });

  it('emits a stable header row', () => {
    const csv = scenariosToCsv([]);
    expect(csv).toBe(CSV_HEADERS.join(','));
    expect(CSV_HEADERS[0]).toBe('name');
    expect(CSV_HEADERS).toContain('tef_minimum');
    expect(CSV_HEADERS).toContain('slp_rationale');
  });
});

describe('parseScenariosCsv error handling', () => {
  it('skips invalid rows with line numbers and keeps good ones', () => {
    const csv = [
      CSV_HEADERS.join(','),
      // valid minimal row
      ['Good', '', '', '', '', '', '', 0.1, 0.5, 1, 'e/y', '', 0.1, 0.2, 0.3, 'p', '', 1, 2, 3, 'usd', '', 0, 0, 0, 'usd', '', 0, 0, 0, 'p', ''].join(','),
      // broken ordering (min > max)
      ['Bad', '', '', '', '', '', '', 5, 0.5, 1, 'e/y', '', 0.1, 0.2, 0.3, 'p', '', 1, 2, 3, 'usd', '', 0, 0, 0, 'usd', '', 0, 0, 0, 'p', ''].join(','),
      // not a number
      ['Worse', '', '', '', '', '', '', 'x', 0.5, 1, 'e/y', '', 0.1, 0.2, 0.3, 'p', '', 1, 2, 3, 'usd', '', 0, 0, 0, 'usd', '', 0, 0, 0, 'p', ''].join(','),
    ].join('\r\n');
    const { scenarios, errors } = parseScenariosCsv(csv);
    expect(scenarios.map((s) => s.name)).toEqual(['Good']);
    expect(errors).toHaveLength(2);
    expect(errors[0].line).toBe(3);
    expect(errors[1].line).toBe(4);
    expect(errors[1].message).toMatch(/tef_minimum/);
  });

  it('rejects a file without the required columns', () => {
    const { scenarios, errors } = parseScenariosCsv('foo,bar\n1,2');
    expect(scenarios).toEqual([]);
    expect(errors[0].message).toMatch(/missing column/);
  });
});

describe('parseCsv', () => {
  it('handles quoted separators and escaped quotes', () => {
    const rows = parseCsv('a,"b,c","d""e"\r\n"multi\nline",2,3');
    expect(rows).toEqual([['a', 'b,c', 'd"e'], ['multi\nline', '2', '3']]);
  });
});
