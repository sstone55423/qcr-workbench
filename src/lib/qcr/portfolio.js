// Portfolio-level aggregation across a project's scenarios: deterministic ALE
// ranking and an aggregate Monte Carlo annual-loss distribution. Nothing here
// is persisted — portfolio results are recomputed on demand from the current
// scenarios, so they can never be stale (same reasoning as treatment results).
import { expectedLoss } from '@/lib/qcr/fair';
import { simulateAnnualLoss, exceedanceCurve, DEFAULT_ITERATIONS, DEFAULT_SEED } from '@/lib/qcr/simulation';
import { percentile } from '@/lib/qcr/random';

// Stable per-scenario seed: the base seed mixed with a djb2 hash of the
// scenario's identity, so portfolio results don't depend on scenario order
// and sample scenarios reproduce across vaults (sample_id is stable; ad-hoc
// scenarios fall back to their record id).
export function scenarioSeed(baseSeed, scenario) {
  const s = String(scenario.sample_id || scenario.id);
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return (baseSeed + h) >>> 0;
}

// Deterministic ranking: per-scenario ALE, sorted descending, with each
// scenario's share of the portfolio total.
export function portfolioAle(scenarios) {
  const rows = scenarios
    .map((s) => ({ id: s.id, name: s.name, owner: s.owner, ale: expectedLoss(s.fair).ale }))
    .sort((a, b) => b.ale - a.ale);
  const total = rows.reduce((sum, row) => sum + row.ale, 0);
  return { total, rows: rows.map((row) => ({ ...row, share: total ? row.ale / total : 0 })) };
}

// Aggregate Monte Carlo: each scenario is simulated independently with its
// stable derived seed and the annual losses are summed year-by-year. The
// scenarios are treated as INDEPENDENT — a deliberate modeling assumption the
// UI states next to the results. Returns summary + exceedance points only;
// the combined loss array stays in memory (recomputable).
export function simulatePortfolio(scenarios, iterations = DEFAULT_ITERATIONS, seed = DEFAULT_SEED) {
  const combined = new Float64Array(iterations);
  for (const scenario of scenarios) {
    const { annualLosses } = simulateAnnualLoss(scenario.fair, iterations, scenarioSeed(seed, scenario));
    for (let i = 0; i < iterations; i++) combined[i] += annualLosses[i];
  }
  let sum = 0;
  let zeroCount = 0;
  for (let i = 0; i < iterations; i++) {
    sum += combined[i];
    if (combined[i] === 0) zeroCount += 1;
  }
  return {
    params: { iterations, seed },
    summary: {
      mean: sum / iterations,
      median: percentile(combined, 50),
      percentile_90: percentile(combined, 90),
      percentile_95: percentile(combined, 95),
      percentile_99: percentile(combined, 99),
      probability_of_zero_loss: zeroCount / iterations,
      iterations,
    },
    exceedance: exceedanceCurve(combined, 100),
  };
}
