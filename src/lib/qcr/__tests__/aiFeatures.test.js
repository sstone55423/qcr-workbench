import { describe, it, expect, vi } from 'vitest';
import { validateTreatment } from '@/lib/qcr/models';

vi.mock('@/lib/ai', () => ({
  invokeAI: vi.fn(),
  getLastAIRun: () => ({ label: 'Mock AI', model: 'mock-1', at: '2026-07-13' }),
}));

import { invokeAI } from '@/lib/ai';
import { suggestScenarioTreatments } from '@/lib/qcr/aiFeatures';

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
});
