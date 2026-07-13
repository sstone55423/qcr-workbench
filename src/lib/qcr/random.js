// Seeded random sampling for the Monte Carlo engine. Replaces NumPy's
// Generator: same distributions (uniform, normal, gamma, beta, Poisson,
// Bernoulli), different bit streams — results are reproducible within this
// app for a given seed, but not bit-identical to the Python v0.

// Mulberry32: tiny, fast, well-distributed 32-bit PRNG.
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Lanczos approximation of log(Gamma(x)), needed by the large-lambda
// Poisson sampler. Accurate to ~1e-13 for x > 0.
const LANCZOS_G = 7;
const LANCZOS_C = [
  0.99999999999980993, 676.5203681218851, -1259.1392167224028,
  771.32342877765313, -176.61502916214059, 12.507343278686905,
  -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
];

function logGamma(x) {
  if (x < 0.5) {
    // Reflection formula
    return Math.log(Math.PI / Math.sin(Math.PI * x)) - logGamma(1 - x);
  }
  x -= 1;
  let sum = LANCZOS_C[0];
  for (let i = 1; i < LANCZOS_G + 2; i++) sum += LANCZOS_C[i] / (x + i);
  const t = x + LANCZOS_G + 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(sum);
}

export class RNG {
  constructor(seed = 42) {
    this.uniform = mulberry32(seed);
    this._spareNormal = null;
  }

  // Standard normal via polar Box-Muller, caching the spare deviate.
  normal() {
    if (this._spareNormal !== null) {
      const v = this._spareNormal;
      this._spareNormal = null;
      return v;
    }
    let u, v, s;
    do {
      u = 2 * this.uniform() - 1;
      v = 2 * this.uniform() - 1;
      s = u * u + v * v;
    } while (s >= 1 || s === 0);
    const mul = Math.sqrt((-2 * Math.log(s)) / s);
    this._spareNormal = v * mul;
    return u * mul;
  }

  // Gamma(shape, 1) via Marsaglia–Tsang; the shape<1 case uses the standard
  // boost Gamma(shape) = Gamma(shape+1) * U^(1/shape).
  gamma(shape) {
    if (shape <= 0) throw new Error('gamma shape must be positive');
    if (shape < 1) {
      const u = this.uniform();
      return this.gamma(shape + 1) * Math.pow(u, 1 / shape);
    }
    const d = shape - 1 / 3;
    const c = 1 / Math.sqrt(9 * d);
    for (;;) {
      let x, v;
      do {
        x = this.normal();
        v = 1 + c * x;
      } while (v <= 0);
      v = v * v * v;
      const u = this.uniform();
      if (u < 1 - 0.0331 * x * x * x * x) return d * v;
      if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
    }
  }

  beta(alpha, betaParam) {
    const a = this.gamma(alpha);
    const b = this.gamma(betaParam);
    return a / (a + b);
  }

  // Poisson(lambda): Knuth's product method for small lambda, Hörmann's PTRS
  // transformed-rejection sampler for large lambda (Knuth degrades as
  // exp(-lambda) underflows and needs O(lambda) uniforms per draw).
  poisson(lambda) {
    if (lambda < 0) throw new Error('poisson lambda must be non-negative');
    if (lambda === 0) return 0;
    if (lambda < 30) {
      const limit = Math.exp(-lambda);
      let k = 0;
      let p = 1;
      do {
        k += 1;
        p *= this.uniform();
      } while (p > limit);
      return k - 1;
    }
    // PTRS (Hörmann 1993)
    const b = 0.931 + 2.53 * Math.sqrt(lambda);
    const a = -0.059 + 0.02483 * b;
    const invAlpha = 1.1239 + 1.1328 / (b - 3.4);
    const vr = 0.9277 - 3.6224 / (b - 2);
    const logLambda = Math.log(lambda);
    for (;;) {
      const u = this.uniform() - 0.5;
      const v = this.uniform();
      const us = 0.5 - Math.abs(u);
      const k = Math.floor(((2 * a) / us + b) * u + lambda + 0.43);
      if (us >= 0.07 && v <= vr) return k;
      if (k < 0 || (us < 0.013 && v > us)) continue;
      if (Math.log((v * invAlpha) / (a / (us * us) + b)) <= k * logLambda - lambda - logGamma(k + 1)) {
        return k;
      }
    }
  }

  bernoulli(p) {
    return this.uniform() < p ? 1 : 0;
  }
}

// q-th percentile (0–100) with NumPy's default linear interpolation.
export function percentile(values, q) {
  if (!values.length) throw new Error('percentile of empty array');
  const sorted = Array.from(values).sort((a, b) => a - b);
  const h = ((sorted.length - 1) * q) / 100;
  const lo = Math.floor(h);
  const hi = Math.min(lo + 1, sorted.length - 1);
  return sorted[lo] + (h - lo) * (sorted[hi] - sorted[lo]);
}
