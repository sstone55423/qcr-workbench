import { describe, it, expect, vi } from 'vitest';
import { validateTreatment } from '@/lib/qcr/models';

vi.mock('@/lib/ai', () => ({
  invokeAI: vi.fn(),
  getLastAIRun: () => ({ label: 'Mock AI', model: 'mock-1', at: '2026-07-13' }),
}));

import { invokeAI } from '@/lib/ai';
import {
  suggestScenarioTreatments, suggestScenarioAssumptions, similarSampleScenarios, relevantControls,
} from '@/lib/qcr/aiFeatures';
import { findSampleById } from '@/data/sampleLibraries';

const scenario = {
  name: 'Test scenario', description: 'Test risk.', asset: 'Asset', threat: 'Threat', effect: 'Effect',
  assumptions: ['A1'],
};
const expected = { ale: 100000, lef: 0.5, lossMagnitude: 200000 };

describe('suggestScenarioTreatments', () => {
  it('clamps AI-drafted numbers into valid treatment ranges and drops nameless entries', async () => {
    invokeAI.mockResolvedValue({
      suggestions: [
        {
          name: '  MFA rollout  ', rationale: 'Reduces takeover.',
          annual_cost: -500, frequency_reduction: 1.7, vulnerability_reduction: -0.2,
          primary_loss_reduction: 0.25, secondary_loss_reduction: 'not a number',
        },
        { name: '', rationale: 'nameless', annual_cost: 1, frequency_reduction: 0, vulnerability_reduction: 0, primary_loss_reduction: 0, secondary_loss_reduction: 0 },
      ],
    });

    const { suggestions, provenance } = await suggestScenarioTreatments({ scenario, expected, treatments: [] });
    expect(suggestions).toHaveLength(1);
    const s = suggestions[0];
    expect(s.name).toBe('MFA rollout');
    expect(s.annual_cost).toBe(0);
    expect(s.frequency_reduction).toBe(1);
    expect(s.vulnerability_reduction).toBe(0);
    expect(s.secondary_loss_reduction).toBe(0);
    // Every surviving suggestion must already satisfy the domain validator.
    expect(() => validateTreatment(s)).not.toThrow();
    expect(provenance.label).toBe('Mock AI');
  });

  it('embeds the computed figures and existing treatment names in the prompt', async () => {
    invokeAI.mockResolvedValue({ suggestions: [] });
    await suggestScenarioTreatments({ scenario, expected, treatments: [{ name: 'Existing control' }] });
    const { prompt } = invokeAI.mock.calls.at(-1)[0];
    expect(prompt).toContain('$100,000');
    expect(prompt).toContain('Existing control');
    expect(prompt).toContain('do not recompute');
  });

  it('grounds the prompt with relevant control-catalog entries', async () => {
    invokeAI.mockResolvedValue({ suggestions: [] });
    const ransomware = {
      name: 'Ransomware outage', description: 'Ransomware encrypts servers and backups; operations halt.',
      asset: 'Core servers', threat: 'Ransomware group', effect: 'Downtime and rebuild', assumptions: [],
    };
    await suggestScenarioTreatments({ scenario: ransomware, expected, treatments: [] });
    const { prompt } = invokeAI.mock.calls.at(-1)[0];
    expect(prompt).toContain('Reference control catalog');
    expect(prompt).toContain('Immutable offline backups');
    expect(prompt).toContain('planning heuristics');
    expect(prompt).toMatch(/NIST CSF 2\.0/);
  });
});

describe('relevantControls', () => {
  it('surfaces scenario-appropriate controls', () => {
    const controls = relevantControls({
      name: 'Cattle Sale Payment Redirect',
      description: 'Fraudsters impersonate a buyer over email and redirect auction proceeds by wire transfer.',
      asset: 'Sale proceeds', threat: 'Business email compromise fraud group', effect: 'Diverted funds',
    });
    expect(controls.length).toBeGreaterThan(0);
    expect(controls.length).toBeLessThanOrEqual(6);
    expect(controls.map((c) => c.id)).toContain('payment-verification');
  });
});

describe('similarSampleScenarios', () => {
  const ransomwareScenario = {
    name: 'Ransomware outage', description: 'Ransomware encrypts servers; operations halt during recovery.',
    asset: 'Core servers', threat: 'Ransomware group', effect: 'Downtime and rebuild',
  };

  it('retrieves topically similar samples from the bundled libraries', () => {
    const similar = similarSampleScenarios(ransomwareScenario);
    expect(similar.length).toBeGreaterThan(0);
    expect(similar.length).toBeLessThanOrEqual(2);
    const text = similar.map((s) => `${s.name} ${s.description} ${s.threat}`.toLowerCase()).join(' ');
    expect(text).toContain('ransom');
    for (const sample of similar) expect(sample.assumptions.length).toBeGreaterThan(0);
  });

  it('never returns the sample the scenario was loaded from', () => {
    const own = findSampleById('ranch-ransomware');
    const similar = similarSampleScenarios({
      ...own, sample_id: 'ranch-ransomware',
    });
    expect(similar.map((s) => s.id)).not.toContain('ranch-ransomware');
  });
});

describe('suggestScenarioAssumptions', () => {
  it('grounds the prompt with similar sample exemplars but forbids copying', async () => {
    invokeAI.mockResolvedValue({ suggestions: [{ text: 'A', rationale: 'B' }] });
    const scenario = {
      name: 'Ransomware outage', description: 'Ransomware encrypts servers; operations halt during recovery.',
      asset: 'Core servers', threat: 'Ransomware group', effect: 'Downtime and rebuild', assumptions: [],
    };
    const { suggestions, provenance } = await suggestScenarioAssumptions({ scenario });
    const { prompt } = invokeAI.mock.calls.at(-1)[0];
    expect(prompt).toContain('Reference examples');
    expect(prompt).toContain('do not copy them verbatim');
    expect(suggestions).toHaveLength(1);
    expect(provenance.label).toBe('Mock AI');
  });
});
