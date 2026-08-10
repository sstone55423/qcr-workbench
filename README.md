# QCR Workbench

**Live at [qcr-workbench.org](https://qcr-workbench.org)** — no account, no
install; your data stays encrypted in your browser.

A **local-first, privacy-preserving workbench for quantitative cyber risk
analysis** built on the FAIR model. Scope a risk scenario, calibrate three-point
estimates, run a Monte Carlo simulation, compare treatment economics, and export
a board-ready report — entirely in your browser, with everything encrypted on
your device.

> **Version 1** is a ground-up rewrite of the original Streamlit prototype
> ("test version 0", preserved at git tag `v0`), following the architecture of
> [Biblio Insight Lab](https://biblio-insight-lab.org): a zero-knowledge,
> no-backend React SPA.

## What it does

1. **Scoping** — name the asset, threat, effect, and accountable owner; record
   scoping assumptions (optionally AI-suggested, always human-approved).
2. **FAIR decomposition** — Loss Event Frequency (TEF × Vulnerability) and Loss
   Magnitude (Primary + expected Secondary), driven by five modified-PERT
   three-point estimates.
3. **Assumptions** — calibrate the estimates; edits atomically invalidate any
   stale simulation results.
4. **Expected loss** — the deterministic ALE with a step-by-step calculation
   trace.
5. **Monte Carlo simulation** — seeded and reproducible; annual loss
   distribution, tail percentiles, no-loss probability, and the loss exceedance
   curve.
6. **Treatments** — model controls as factor reductions; compare baseline vs.
   residual ALE, net benefit, and return on control.
7. **Executive report** — Markdown report with an ALE-vs-tail interpretation
   guide, downloadable, with an optional AI-drafted narrative (labeled and
   provenance-stamped).

Beyond the per-scenario workflow: a project-level **Portfolio** view
(scenarios ranked by ALE plus an aggregate Monte Carlo loss exceedance curve),
**tornado sensitivity analysis** on the deterministic step, a project
**risk tolerance** ("at most a 10% chance of losing more than $1M a year")
checked against every exceedance curve and stated in the executive report,
**treatment portfolios** with a budget optimizer, per-estimate **rationale
fields** for defensible provenance, **snapshots** that build an ALE trend over
time, **CSV import/export** of scenarios, and **print-to-PDF** reports.

Ten sample scenarios (the fictional *Stella Polaris Medical Components*
portfolio) load with one click.

The methodology follows [FAIR™ (Factor Analysis of Information
Risk)](https://www.fairinstitute.org/), the open international standard for
quantifying information risk, stewarded by the [FAIR
Institute](https://www.fairinstitute.org/). This project is independent and
not affiliated with or endorsed by the FAIR Institute.

## Architecture

- **No backend.** A static SPA (React 19 + Vite 7 + Tailwind 4 + shadcn/ui).
  The host serves files; it never sees data.
- **Encrypted vault.** All entities live in IndexedDB as AES-GCM-256
  ciphertext under a PBKDF2-derived key (250k iterations). Locking the vault
  drops the key from memory. A forgotten passphrase is unrecoverable by design.
- **Multi-store.** Each workspace is its own IndexedDB database; switch from
  the lock screen.
- **Audit trail.** Every significant action (edits, simulations, AI
  generations, exports) is recorded per project.
- **BYO-key AI, optional.** Anthropic / OpenAI / Gemini / Qwen / local Ollama /
  on-device WebLLM / Chrome built-in AI. Calls go browser → provider directly.
  AI never performs risk math. See `AI-GOVERNANCE.md`.
- **7 languages** (en, es, de, fr, pt, tr, ru) with enforced key parity.
- **Offline-capable PWA** with a strict CSP.

See `ARCHITECTURE-AND-DESIGN.md` for the full architecture and design overview,
and `SECURITY.md` and `DATA-PRIVACY.md` for the full posture.

## Development

```bash
npm install
npm run dev        # Vite dev server
npm test           # vitest (math, store, backup, i18n parity)
npm run typecheck  # tsc over JS (checkJs)
npm run lint
npm run build      # static dist/ with CSP meta + PWA service worker
```

The risk math lives in `src/lib/qcr/` as pure functions (ported from the v0
`qcr_core` Python package; the Monte Carlo semantics are preserved exactly).
Pages stay thin; the encrypted entity store is `src/lib/localdb/`.

## Deploy

Any static host. For Cloudflare Pages:

```bash
npm run build && npx wrangler pages deploy dist --project-name qcr-workbench
```

`public/_headers` carries the header-only security directives
(`frame-ancestors`, `nosniff`, referrer policy).

## License & citation

© 2026 Scott Thomas Stone. Free for research, education, and personal use.
Citation formats are in `CITATION.cff` and under Help in the app.
