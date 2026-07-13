# QCR Workbench — contributor notes

Local-first React SPA for FAIR-based quantitative cyber risk analysis.
No backend, no telemetry, no env vars. v0 (Streamlit prototype) lives at git
tag `v0`.

## Commands

```bash
npm run dev / build / preview
npm test           # vitest — math, store, backup, i18n parity
npm run typecheck  # tsc over JS (checkJs); __tests__ excluded
npm run lint
```

## Architecture in one breath

`src/lib/localdb/` is a passphrase-encrypted IndexedDB document store
(entities: Project, Scenario, Treatment, AuditEvent). `src/lib/qcr/` holds all
domain math as pure functions. Pages (`src/pages/`) stay thin; feature
components live in `src/components/<feature>/`; vendored shadcn primitives in
`src/components/ui/` (don't restyle them). Provider order in `App.jsx` is
load-bearing: Theme → Vault (the gate) → I18n → Project.

## Rules that are easy to break

- **Every user-facing string goes through `t()`** and must exist in all 7
  dictionaries (`src/lib/i18n/*.js`) — the parity test enforces identical key
  sets and `{var}` placeholders.
- **Scenario writes go through `src/lib/qcr/scenarioStore.js`**, never
  `db.entities.Scenario` directly from a page: FAIR-estimate edits must clear
  `simulation` and `ai_narrative` in the same atomic update.
- **Never persist the raw simulation loss array** — only summary + histogram
  bins + exceedance points. The array is recomputable (seeded RNG).
- **Treatment results are never stored** — recomputed from the current FAIR
  model at render.
- **The Monte Carlo semantics are v0-compatible on purpose** (one per-event
  loss draw shared across a simulated year; sampler alpha/beta built from the
  PERT mean). Don't "fix" them without a deliberate decision; tests document
  the quirks.
- **AI never computes numbers** — prompts embed computed figures; anything
  AI-written enters the model only via explicit user acceptance, with
  provenance + audit log. See `AI-GOVERNANCE.md`.
- **No secrets outside the vault**: API keys live only in the encrypted
  `AppSettings` record. localStorage holds only non-secrets (theme, store
  registry, auto-lock minutes).
- A full page reload re-locks the vault (module-level key) — that's by design;
  e2e tests must navigate client-side.

## Verification

Playwright e2e recipe: create store/vault → new project → "Load sample
scenarios" → walk the 7 steps via the stepper links (not page.goto — reload
locks the vault). Reference numbers for the `ransomware` sample: deterministic
ALE **$611,274**; simulated mean (20k iters, seed 42) ≈ $802k; default
treatment → residual $276,000, net benefit $185,275, ROC 124%.
