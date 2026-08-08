// Remote MCP endpoint for QCR Workbench (bootcamp Project 5, applied).
//
// A stateless Streamable-HTTP MCP server: it speaks JSON-RPC 2.0 over POST /mcp
// and returns plain application/json (no session, no SSE) because every tool is
// a pure, deterministic function from src/lib/qcr — nothing to stream or
// remember. Exposing the trusted math as tools is the strong form of the
// AI-GOVERNANCE rule "AI never computes numbers": an MCP client gets real,
// audited figures by CALLING the math instead of guessing it.

import { expectedLoss } from '@/lib/qcr/fair';
import {
  simulateAnnualLoss, exceedanceCurve, DEFAULT_ITERATIONS, DEFAULT_SEED,
} from '@/lib/qcr/simulation';
import { compareTreatment, optimizeTreatments } from '@/lib/qcr/treatments';
import { sensitivityRows } from '@/lib/qcr/sensitivity';
import { ciToEstimate } from '@/lib/qcr/calibration';
import { validateFairModel, FAIR_FACTORS } from '@/lib/qcr/models';

const SERVER_INFO = { name: 'qcr-workbench', version: '2.0.0' };
const DEFAULT_PROTOCOL = '2025-06-18';

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

const fairSchema = {
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

const treatmentSchema = {
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

// ── Tools ───────────────────────────────────────────────────────────────────
const TOOLS = [
  {
    name: 'compute_ale',
    description: 'Deterministic FAIR annualized loss expectancy (ALE) with its decomposition: TEF, vulnerability, loss event frequency, and loss magnitude.',
    inputSchema: { type: 'object', properties: { fair: fairSchema }, required: ['fair'] },
    handler: ({ fair }) => { validateFairModel(fair); return expectedLoss(fair); },
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
    handler: ({ fair, iterations, seed }) => {
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
    handler: ({ fair, treatment }) => { validateFairModel(fair); return compareTreatment(fair, treatment); },
  },
  {
    name: 'optimize_controls',
    description: 'Pick the control subset maximizing net benefit under an annual budget (exhaustive search; up to 16 treatments). Returns the best set or null if nothing affordable beats doing nothing.',
    inputSchema: {
      type: 'object',
      properties: { fair: fairSchema, treatments: { type: 'array', items: treatmentSchema }, budget: { type: 'number' } },
      required: ['fair', 'treatments', 'budget'],
    },
    handler: ({ fair, treatments, budget }) => { validateFairModel(fair); return optimizeTreatments(fair, treatments, budget); },
  },
  {
    name: 'sensitivity_analysis',
    description: 'One-at-a-time tornado sensitivity: how far the ALE swings when each FAIR factor moves to its min/max while others hold at their means. Rows sorted widest-swing first.',
    inputSchema: { type: 'object', properties: { fair: fairSchema }, required: ['fair'] },
    handler: ({ fair }) => { validateFairModel(fair); return sensitivityRows(fair); },
  },
  {
    name: 'calibrate_estimate',
    description: 'Convert a 90% confidence interval [lower, upper] into a PERT estimate {minimum, most_likely, maximum} usable as a FAIR factor. Returns null if the bounds are not a usable interval.',
    inputSchema: {
      type: 'object',
      properties: { lower: { type: 'number' }, upper: { type: 'number' } },
      required: ['lower', 'upper'],
    },
    handler: ({ lower, upper }) => ciToEstimate(lower, upper),
  },
  {
    name: 'validate_model',
    description: 'Validate a FAIR model (0 ≤ minimum ≤ most_likely ≤ maximum for every factor). Returns {valid:true} or {valid:false, error}.',
    inputSchema: { type: 'object', properties: { fair: fairSchema }, required: ['fair'] },
    handler: ({ fair }) => {
      try { validateFairModel(fair); return { valid: true }; }
      catch (e) { return { valid: false, error: e.message }; }
    },
  },
];

const toolDefs = () => TOOLS.map(({ name, description, inputSchema }) => ({ name, description, inputSchema }));

// ── JSON-RPC dispatch ────────────────────────────────────────────────────────
const rpcResult = (id, result) => ({ jsonrpc: '2.0', id, result });
const rpcError = (id, code, message) => ({ jsonrpc: '2.0', id, error: { code, message } });

async function dispatch(msg) {
  if (!msg || msg.jsonrpc !== '2.0') return rpcError(msg?.id ?? null, -32600, 'Invalid Request');
  const { id, method, params } = msg;
  switch (method) {
    case 'initialize':
      return rpcResult(id, {
        protocolVersion: params?.protocolVersion || DEFAULT_PROTOCOL,
        capabilities: { tools: {} },
        serverInfo: SERVER_INFO,
      });
    case 'ping':
      return rpcResult(id, {});
    case 'tools/list':
      return rpcResult(id, { tools: toolDefs() });
    case 'tools/call': {
      const tool = TOOLS.find((t) => t.name === params?.name);
      if (!tool) return rpcError(id, -32602, `Unknown tool: ${params?.name}`);
      try {
        const out = await tool.handler(params.arguments || {});
        return rpcResult(id, { content: [{ type: 'text', text: JSON.stringify(out) }] });
      } catch (e) {
        // Tool-execution failures are reported as an errored tool result, not a
        // protocol error, so the model can see and react to the message.
        return rpcResult(id, { content: [{ type: 'text', text: e?.message || String(e) }], isError: true });
      }
    }
    default:
      // Notifications (e.g. notifications/initialized) carry no id — ack silently.
      if (id === undefined) return null;
      return rpcError(id, -32601, `Method not found: ${method}`);
  }
}

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, OPTIONS',
  'access-control-allow-headers': 'content-type, mcp-session-id, mcp-protocol-version',
};

export async function handleMcp(request) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  if (request.method !== 'POST') {
    // This stateless server never initiates messages, so GET/SSE isn't offered.
    return new Response('Method Not Allowed', { status: 405, headers: { ...CORS, allow: 'POST, OPTIONS' } });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify(rpcError(null, -32700, 'Parse error')), {
      status: 400, headers: { 'content-type': 'application/json', ...CORS },
    });
  }

  const send = (data) =>
    new Response(data === null ? '' : JSON.stringify(data), {
      status: data === null ? 202 : 200,
      headers: { 'content-type': 'application/json', ...CORS },
    });

  if (Array.isArray(body)) {
    const results = (await Promise.all(body.map(dispatch))).filter(Boolean);
    return send(results.length ? results : null);
  }
  return send(await dispatch(body));
}
