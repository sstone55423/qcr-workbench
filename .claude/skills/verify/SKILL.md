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

## Drive (Playwright, chromium)

Playwright is NOT a repo dependency — `npm install playwright` in a scratch
dir and run scripts from there (`npx playwright install chromium` if needed).

Critical gotchas:
- **A full page reload re-locks the vault** (encryption key is a module-level
  variable). Never `page.goto()` between steps — navigate by clicking the
  stepper links (`getByRole('link', { name: 'FAIR model' })` etc.) and sidebar.
- First-run flow: store picker → "Create a new store" → inputs are
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
