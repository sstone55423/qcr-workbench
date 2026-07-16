---
name: verify
description: Build, launch, and drive QCR Workbench end-to-end (vault → samples → 7-step workflow) to verify changes at the browser surface.
---

# Verifying QCR Workbench

## Launch

```bash
npm run dev          # Vite; picks 5173 or next free port — read the port from output
```

Gates (CI territory, not verification): `npm test`, `npm run typecheck`,
`npm run lint`, `npm run build` (check dist/index.html for the injected CSP meta).

## Committed smoke suite

`npm run test:e2e` runs the committed Playwright specs in `e2e/` (config:
`playwright.config.js`, dedicated port 5289 so it never reuses a sibling dev
server). `smoke.spec.js` drives the whole vault→samples→workbench flow and pins
the ransomware ALE; `a11y.spec.js` gates axe-core serious/critical violations on
the lock screen and home. Run these first — they cover most of the recipe below.

## Drive ad-hoc (Playwright, chromium)

For exploratory driving beyond the committed suite, the same Playwright dep is
now in the repo (`npx playwright install chromium` if the browser is missing).

Critical gotchas:
- **A full page reload re-locks the vault** (encryption key is a module-level
  variable). Never `page.goto()` between steps — navigate by clicking the
  stepper links (`getByRole('link', { name: 'FAIR model' })` etc.) and sidebar.
- First-run flow: store picker → "Create a new data store" → inputs are
  [name, passphrase, confirm, hint] → "Create store" button. Passphrase min 8
  chars. After lock, click the store button (use `.first()` — the name can
  match twice) before the password input exists.
- A "Get started" welcome dialog appears once per browser profile — dismiss it.

## Reference numbers (ransomware sample, must hold)

- Deterministic ALE **$611,274**; LEF 0.29; loss magnitude $2,083,889.
- Simulation (20,000 iterations, seed 42): mean ≈ $802,436 (within ~1% of the
  analytic expectation ≈ $803,034), no-loss probability ≈ 72.8% (≈ exp(−LEF)),
  median $0.
- Default treatment (cost 150k; reductions 15/35/20/10%): residual ALE
  $276,000, net benefit $185,275, ROC 124%.

## Flows worth driving

1. Vault create → project → "Load sample scenarios" (5 cards with ALE badges).
2. Walk the 7 steps via stepper; run simulation; add treatment; download the
   report (`page.waitForEvent('download')`) and grep it for the ALE table.
3. Invalidation probe: edit an estimate on Assumptions → Apply → Simulation
   page must show the empty-state guidance again.
4. Lock → wrong passphrase rejected → correct passphrase → data persisted.
5. Language cycle button (sidebar) → nav shows "Escenarios" (es), then
   "Szenarien"/"Projekte" (de).

Watch `page.on('pageerror')` / console errors — the app should produce none.
