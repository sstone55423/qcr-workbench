// Framework-agnostic QCR tool registry — the single source of truth shared by
// the remote MCP server (worker/mcp.js, wraps run() into MCP content) and the
// in-page WebMCP provider (src/lib/mcp/webmcp.js, registers run() directly).
// Every tool is a pure function over src/lib/qcr, so it's deterministic, needs
// no app state, and upholds AI-GOVERNANCE ("AI never computes numbers"): a
// client gets real, audited figures by calling the math instead of guessing.

import { expectedLoss } from '@/lib/qcr/fair';
import {
  simulateAnnualLoss, exceedanceCurve, DEFAULT_ITERATIONS, DEFAULT_SEED,
} from '@/lib/qcr/simulation';
import { compareTreatment, optimizeTreatments } from '@/lib/qcr/treatments';
import { sensitivityRows } from '@/lib/qcr/sensitivity';
import { ciToEstimate } from '@/lib/qcr/calibration';
import { validateFairModel, FAIR_FACTORS } from '@/lib/qcr/models';

// ── JSON Schema fragments for tool inputs ───────────────────────────────────
const estimate = (description) => ({
  type: 'object',
  description,
  properties: {
    minimum: { type: 'number' },
    most_likely: { type: 'number' },
    maximum: { type: 'number' },
  },
  required: ['minimum', 'most_likely', 'maximum'],
});

export const fairSchema = {
  type: 'object',
  description: 'FAIR estimate model; each factor is a PERT estimate {minimum, most_likely, maximum} with minimum ≤ most_likely ≤ maximum.',
  properties: {
    threat_event_frequency: estimate('Threat event frequency (events per year)'),
    vulnerability: estimate('Vulnerability (probability 0–1 that an event becomes a loss)'),
    primary_loss: estimate('Primary loss per event (currency)'),
    secondary_loss: estimate('Secondary loss per event (currency)'),
    secondary_loss_probability: estimate('Probability (0–1) an event has secondary loss'),
  },
  required: FAIR_FACTORS,
};

export const treatmentSchema = {
  type: 'object',
  description: 'A control/treatment: an annual cost and fractional (0–1) reductions of each factor.',
  properties: {
    name: { type: 'string' },
    annual_cost: { type: 'number', description: 'Annual cost of the control (currency)' },
    frequency_reduction: { type: 'number', description: 'Fractional TEF reduction, 0–1' },
    vulnerability_reduction: { type: 'number', description: 'Fractional vulnerability reduction, 0–1' },
    primary_loss_reduction: { type: 'number', description: 'Fractional primary-loss reduction, 0–1' },
    secondary_loss_reduction: { type: 'number', description: 'Fractional secondary-loss reduction, 0–1' },
  },
  required: ['annual_cost'],
};

// ── Tools: { name, description, inputSchema, readOnly, run(args) → plain obj } ─
export const QCR_TOOLS = [
  {
    name: 'compute_ale',
    description: 'Deterministic FAIR annualized loss expectancy (ALE) with its decomposition: TEF, vulnerability, loss event frequency, and loss magnitude.',
    inputSchema: { type: 'object', properties: { fair: fairSchema }, required: ['fair'] },
    readOnly: true,
    run: ({ fair }) => { validateFairModel(fair); return expectedLoss(fair); },
  },
  {
    name: 'simulate_scenario',
    description: 'Monte Carlo simulation of annual loss for a FAIR model. Returns summary statistics (mean, median, P90/P95/P99, probability of a zero-loss year, max) and a 20-point loss-exceedance curve. Deterministic for a given seed.',
    inputSchema: {
      type: 'object',
      properties: {
        fair: fairSchema,
        iterations: { type: 'integer', description: `Iterations (default ${DEFAULT_ITERATIONS})` },
        seed: { type: 'integer', description: `RNG seed (default ${DEFAULT_SEED})` },
      },
      required: ['fair'],
    },
    readOnly: true,
    run: ({ fair, iterations, seed }) => {
      validateFairModel(fair);
      const s = seed ?? DEFAULT_SEED;
      const sim = simulateAnnualLoss(fair, iterations || DEFAULT_ITERATIONS, s);
      const ex = exceedanceCurve(sim.annualLosses, 20);
      return {
        mean: sim.mean,
        median: sim.median,
        percentile_90: sim.percentile_90,
        percentile_95: sim.percentile_95,
        percentile_99: sim.percentile_99,
        probability_of_zero_loss: sim.probability_of_zero_loss,
        max_loss: sim.max_loss,
        iterations: sim.iterations,
        seed: s,
        exceedance: ex.thresholds.map((loss, i) => ({ loss, probability: ex.probabilities[i] })),
      };
    },
  },
  {
    name: 'evaluate_treatment',
    description: 'Cost-benefit of one control against a FAIR model: baseline vs residual ALE, risk reduction, net benefit, and return on control (ROC).',
    inputSchema: { type: 'object', properties: { fair: fairSchema, treatment: treatmentSchema }, required: ['fair', 'treatment'] },
    readOnly: true,
    run: ({ fair, treatment }) => { validateFairModel(fair); return compareTreatment(fair, treatment); },
  },
  {
    name: 'optimize_controls',
    description: 'Pick the control subset maximizing net benefit under an annual budget (exhaustive search; up to 16 treatments). Returns the best set or null if nothing affordable beats doing nothing.',
    inputSchema: {
      type: 'object',
      properties: { fair: fairSchema, treatments: { type: 'array', items: treatmentSchema }, budget: { type: 'number' } },
      required: ['fair', 'treatments', 'budget'],
    },
    readOnly: true,
    run: ({ fair, treatments, budget }) => { validateFairModel(fair); return optimizeTreatments(fair, treatments, budget); },
  },
  {
    name: 'sensitivity_analysis',
    description: 'One-at-a-time tornado sensitivity: how far the ALE swings when each FAIR factor moves to its min/max while others hold at their means. Rows sorted widest-swing first.',
    inputSchema: { type: 'object', properties: { fair: fairSchema }, required: ['fair'] },
    readOnly: true,
    run: ({ fair }) => { validateFairModel(fair); return sensitivityRows(fair); },
  },
  {
    name: 'calibrate_estimate',
    description: 'Convert a 90% confidence interval [lower, upper] into a PERT estimate {minimum, most_likely, maximum} usable as a FAIR factor. Returns null if the bounds are not a usable interval.',
    inputSchema: {
      type: 'object',
      properties: { lower: { type: 'number' }, upper: { type: 'number' } },
      required: ['lower', 'upper'],
    },
    readOnly: true,
    run: ({ lower, upper }) => ciToEstimate(lower, upper),
  },
  {
    name: 'validate_model',
    description: 'Validate a FAIR model (0 ≤ minimum ≤ most_likely ≤ maximum for every factor). Returns {valid:true} or {valid:false, error}.',
    inputSchema: { type: 'object', properties: { fair: fairSchema }, required: ['fair'] },
    readOnly: true,
    run: ({ fair }) => {
      try { validateFairModel(fair); return { valid: true }; }
      catch (e) { return { valid: false, error: e.message }; }
    },
  },
];

export const toolByName = (name) => QCR_TOOLS.find((t) => t.name === name);
