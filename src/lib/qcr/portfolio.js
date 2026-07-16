// Portfolio-level aggregation across a project's scenarios: deterministic ALE
// ranking and an aggregate Monte Carlo annual-loss distribution. Nothing here
// is persisted — portfolio results are recomputed on demand from the current
// scenarios, so they can never be stale (same reasoning as treatment results).
import { expectedLoss } from '@/lib/qcr/fair';
import { simulateAnnualLoss, exceedanceCurve, DEFAULT_ITERATIONS, DEFAULT_SEED } from '@/lib/qcr/simulation';
import { percentile, RNG } from '@/lib/qcr/random';

// Default cross-scenario correlation: 0 keeps the historical independent
// aggregation (and its reference numbers) exactly.
export const DEFAULT_CORRELATION = 0;

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

// Ascending argsort: returns an index permutation `order` such that
// values[order[0]] <= values[order[1]] <= … — used to rank the copula factor.
function argsortAscending(values) {
  const order = Array.from({ length: values.length }, (_, i) => i);
  order.sort((a, b) => values[a] - values[b]);
  return order;
}

// Induce cross-scenario correlation while preserving every scenario's marginal
// loss distribution EXACTLY (this is the Iman–Conover idea with a one-factor
// equicorrelation driver). Each scenario's own loss array is untouched — only
// the pairing of which loss lands in which simulated year is reshuffled so that
// a shared latent factor lines the scenarios' bad years up. `rho` is the target
// pairwise rank correlation: 0 = independent, 1 = losses co-rank perfectly (all
// scenarios' worst years coincide — the fattest joint tail).
//
// For each year i a systemic normal F[i] is shared across scenarios; scenario k
// also draws an idiosyncratic normal E_k[i], and its latent rank driver is
// Z_k[i] = sqrt(rho)·F[i] + sqrt(1-rho)·E_k[i] (so corr(Z_k, Z_j) = rho). The
// scenario's sorted losses are then dealt out by the ranks of Z_k. F is seeded
// independently of scenario order, and each E_k is seeded from the scenario's
// stable seed, so the correlated result stays order-independent too.
function correlatedCombine(perScenarioLosses, iterations, seed, scenarioSeeds, rho) {
  const combined = new Float64Array(iterations);
  const factorRng = new RNG((seed ^ 0x5bd1e995) >>> 0); // systemic factor stream
  const factor = new Float64Array(iterations);
  for (let i = 0; i < iterations; i++) factor[i] = factorRng.normal();
  const wSys = Math.sqrt(rho);
  const wIdio = Math.sqrt(1 - rho);

  perScenarioLosses.forEach((losses, k) => {
    const idioRng = new RNG((scenarioSeeds[k] ^ 0xa136aaad) >>> 0);
    const z = new Float64Array(iterations);
    for (let i = 0; i < iterations; i++) z[i] = wSys * factor[i] + wIdio * idioRng.normal();
    const sortedLosses = Float64Array.from(losses).sort();
    const zOrder = argsortAscending(z); // year with the r-th smallest Z …
    for (let r = 0; r < iterations; r++) combined[zOrder[r]] += sortedLosses[r]; // … gets the r-th smallest loss
  });
  return combined;
}

// Aggregate Monte Carlo across a project's scenarios. Each scenario is simulated
// with its stable derived seed; the per-year annual losses are then combined
// either independently (`correlation` = 0, summed in place — the historical
// path) or with a shared systemic factor that correlates their tails (see
// correlatedCombine). Returns summary + exceedance points only; the combined
// loss array stays in memory (recomputable).
export function simulatePortfolio(
  scenarios,
  iterations = DEFAULT_ITERATIONS,
  seed = DEFAULT_SEED,
  correlation = DEFAULT_CORRELATION,
) {
  const rho = Math.min(Math.max(correlation, 0), 1);
  const seeds = scenarios.map((s) => scenarioSeed(seed, s));
  const perScenarioLosses = scenarios.map(
    (s, k) => simulateAnnualLoss(s.fair, iterations, seeds[k]).annualLosses,
  );

  let combined;
  if (rho === 0 || scenarios.length < 2) {
    // Independent aggregation — order-independent and bit-for-bit the historical
    // result, so the documented reference numbers still hold.
    combined = new Float64Array(iterations);
    for (const losses of perScenarioLosses) {
      for (let i = 0; i < iterations; i++) combined[i] += losses[i];
    }
  } else {
    combined = correlatedCombine(perScenarioLosses, iterations, seed, seeds, rho);
  }

  let sum = 0;
  let zeroCount = 0;
  for (let i = 0; i < iterations; i++) {
    sum += combined[i];
    if (combined[i] === 0) zeroCount += 1;
  }
  return {
    params: { iterations, seed, correlation: rho },
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
