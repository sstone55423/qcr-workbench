# QCR Workbench — Architecture, Design, and Purpose

*An overview of how the application is built, the security and privacy
principles it is built around, and why it is useful to risk practitioners and
students.*

This document is the "why and how" companion to the focused references:

- [`SECURITY.md`](SECURITY.md) — the engineering security posture (crypto
  parameters, CSP, threat model, regulatory framing).
- [`DATA-PRIVACY.md`](DATA-PRIVACY.md) — the exhaustive inventory of where data
  lives and every network path it can travel.
- [`AI-GOVERNANCE.md`](AI-GOVERNANCE.md) — how optional AI is constrained.
- [`README.md`](README.md) — quick start and feature list.

---

## 1. What the application is

QCR Workbench is a **local-first, single-user workbench for quantitative cyber
risk analysis** built on the **FAIR** model (Factor Analysis of Information
Risk — the open international standard for quantifying information risk). It
turns a vaguely-worded risk ("ransomware could hit us") into a defensible,
money-denominated estimate: an expected annual loss, a full loss distribution
with tail percentiles, and a cost-justified comparison of the controls you
could buy to reduce it.

It runs **entirely in the browser**. There is no account to create, nothing to
install, and — critically — **no server that ever receives your risk data**.
The site that hosts the app serves static files only; your scenarios, estimates,
and results are computed on your machine and stored encrypted on your machine.

---

## 2. The central design commitment: your data stays local

Everything else in the design follows from one commitment: **your risk data
cannot leave your device without a deliberate action you take.** Cyber-risk
scenarios are often confidential — they name real assets, real weaknesses, and
real dollar exposures — so the safest place for them is nowhere but the
analyst's own machine.

This is enforced by architecture, not by policy or a privacy promise:

### 2.1 A passphrase-encrypted vault in the browser

All domain entities — **Projects, Scenarios, Treatments, Snapshots, and the
Audit trail** — are stored in the browser's **IndexedDB as AES-GCM-256
ciphertext**. The encryption key is never stored; it is *derived from your
passphrase* each time you unlock:

- **PBKDF2-SHA-256, 250,000 iterations, random 16-byte salt** → a 256-bit
  AES-GCM key (`src/lib/localdb/crypto.js`).
- Each record is encrypted with a **fresh random 12-byte IV**; AES-GCM is
  authenticated, so tampering is detectable.
- The derived key lives **only in memory** while the vault is unlocked. Locking
  the vault — manually, via the configurable auto-lock timer, or by a full page
  reload — discards the key (`lockVault()` in `src/lib/localdb/store.js`).

A consequence the app states plainly: **a forgotten passphrase is
unrecoverable.** There is no reset, no recovery email, and no vendor who can
help — because there is no vendor holding a copy. The passphrase *is* the entire
security boundary. (This is why encrypted backups exist; see §2.5.)

### 2.2 Secrets never leave the vault

Optional AI-provider API keys are the most sensitive non-risk data the app
touches. They are stored **inside the same encrypted vault** (the
`AppSettings` record), never in `localStorage` or plaintext. Only genuinely
non-secret material lives in `localStorage`:

- the **store registry** (workspace display names, optional hints — no
  passphrases, no risk data),
- UI preferences that must be readable *before* the vault unlocks (theme,
  language, auto-lock minutes),
- an **optional** lock-screen email, written only if the user explicitly enables
  "show on lock screen" and cleared when disabled.

### 2.3 Multiple independent stores ("libraries")

Each workspace is a **separate encrypted IndexedDB database** with its own
passphrase (`src/lib/localdb/store.js`). Creating or opening one never touches
another — useful for separating clients, engagements, or a teaching sandbox from
real work. A non-secret registry lists them for the lock-screen picker; deleting
a store is the *only* operation that destroys data, and it removes both the
registry entry and the underlying database.

### 2.4 The app makes zero network requests on its own

There is **no telemetry, no analytics, no error reporting, no update pings, and
no first-party API** that receives content. Every byte that ever leaves the
device does so because the user clicked something. The complete, exhaustive list
of possible egress paths lives in [`DATA-PRIVACY.md`](DATA-PRIVACY.md); in
summary they are: optional cloud-AI calls (browser → the provider *you*
configured, with *your* key, no proxy), an optional one-time on-device model
download, and web fonts. Nothing else.

### 2.5 Backups put the user in control of durability

Because no server holds a copy, durability is the user's responsibility, and the
app makes it safe:

- **Encrypted backup** (recommended): a JSON file encrypted under a passphrase
  you choose, using the same PBKDF2 + AES-GCM scheme. Safe to store anywhere.
- **Unencrypted backup** (opt-in, warned): a last-resort hedge against a
  forgotten passphrase; treat it like a password file.
- **Report / audit-log exports** are plaintext by nature — they are the
  deliverable — and are shared deliberately.

---

## 3. Security posture in brief

The full reasoning is in [`SECURITY.md`](SECURITY.md); the highlights that a
reviewer most often asks about:

- **Threat model.** Local-first, single-user. The assets to protect are the
  vault contents and the API keys while the vault is unlocked. There is *no
  multi-tenant server holding user data* to attack.
- **Content-Security-Policy.** The production build ships a CSP (`script-src
  'self'` + per-build sha256 hashes, `object-src 'none'`, `frame-src 'none'`,
  `base-uri 'self'`, `form-action 'self'`), so injected/inline scripts cannot
  execute — the real anti-XSS control. Header-only directives
  (`frame-ancestors`, `nosniff`, referrer policy) ship via `public/_headers`.
- **No XSS sinks.** `react-markdown` renders AI and report content **without**
  `rehype-raw`, so any HTML in generated text is escaped, not executed. There
  are **no** `dangerouslySetInnerHTML` uses anywhere.
- **No auth/token layer by design.** Access is gated entirely by the local
  passphrase-derived vault; the app reads no URL tokens and talks to no
  first-party backend.
- **Small, audited dependency surface.** React, Radix/shadcn primitives,
  Recharts, react-markdown, and the optional on-device AI runtime — no binary
  format parsers taking untrusted input.
- **Regulatory framing (SOC 2 / HIPAA / FERPA / GDPR).** The honest answer
  follows from the architecture: there is **no service organization behind the
  app** to audit, and no vendor custody of user content. The only off-device
  path is a user-initiated, user-configured AI call. See [`SECURITY.md`](SECURITY.md)
  §"Regulatory applicability."

---

## 4. How the software is put together

### 4.1 The local-first core (shared across versions)

A static **React 19 + Vite 7 + Tailwind 4 + shadcn/ui** single-page app. The
layering is deliberate and load-bearing:

| Layer | Location | Responsibility |
|---|---|---|
| **Encrypted document store** | `src/lib/localdb/` | AES-GCM IndexedDB vault; entity CRUD; multi-store registry |
| **Domain math (pure functions)** | `src/lib/qcr/` | FAIR decomposition, PERT sampling, Monte Carlo, treatment economics, sensitivity, tolerance, reporting |
| **Scenario write-guard** | `src/lib/qcr/scenarioStore.js` | The *only* path for scenario writes; atomically clears stale `simulation` + `ai_narrative` on any FAIR-estimate edit |
| **AI adapters (optional)** | `src/lib/ai.js`, `anthropic.js`, `localAI.js` | Browser → provider directly; AI never computes numbers |
| **Pages (thin)** | `src/pages/` | Wire the workbench steps together; hold little logic |
| **Feature components** | `src/components/<feature>/` | Reusable UI; vendored primitives in `src/components/ui/` |
| **i18n** | `src/lib/i18n/` | 7 dictionaries with enforced key + placeholder parity |

Provider order in `App.jsx` is intentional: **Theme → Vault (the gate) → I18n →
Project**. The Vault provider is the security gate — nothing behind it renders
until the passphrase unlocks the key.

**Invariants the design enforces (and tests document):**

- Every user-facing string goes through `t()` and must exist in all 7
  dictionaries (a parity test fails the build otherwise).
- The **raw Monte Carlo loss array is never persisted** — only the summary,
  histogram bins, and exceedance points. The array is recomputable from a seeded
  RNG, so storing it would waste space and risk drift.
- **Treatment results are never stored** — they are recomputed from the current
  FAIR model at render, so they can never disagree with the estimates.
- The Monte Carlo semantics are **v0-compatible on purpose** (ported exactly
  from the original Python `qcr_core`); tests pin the quirks so they are not
  "fixed" by accident.

### 4.2 AI is constrained by design

AI is entirely optional and, when used, is boxed in (full detail in
[`AI-GOVERNANCE.md`](AI-GOVERNANCE.md)):

1. **AI never does the math.** Every number is computed deterministically in
   `src/lib/qcr/`. Prompts *embed* already-computed figures and instruct the
   model not to recompute them. An AI outage changes no result.
2. **Human in the loop.** AI-suggested assumptions and treatments are *staged*
   and enter the model only on explicit, per-item user acceptance.
3. **Provenance + audit.** Every AI output is labeled with provider, model, and
   timestamp, written to the audit log, and stamped into the exported report.
4. **Privacy by architecture.** Cloud calls go **browser → provider directly**
   with the user's own key — no proxy, no logging middleman. Fully on-device
   options (WebLLM over WebGPU, Chrome built-in AI, local Ollama) keep all text
   on the machine.

### 4.3 The v2 Cloudflare shell (optional hosting evolution)

The `main` deployment is a purely static SPA. The v2 branch wraps the *same*
static app in a single **Cloudflare Worker** (`worker/index.js`,
`wrangler.jsonc`) that:

- serves the built SPA via **Static Assets** with client-router fallback,
- redirects `www → apex` so there is **one canonical origin** (and one PWA
  cache),
- exposes a **public, stateless `/mcp` endpoint** (Model Context Protocol) so
  the QCR domain math can be called as tools by external agents, and an in-page
  **WebMCP** bridge for in-browser agents,
- offers an optional **free, keyless AI provider** (`/api/ai` → Cloudflare
  Workers AI) alongside the bring-your-own-key providers,
- keeps a **dormant D1 database** wired but unused — **by explicit choice, no
  user risk data is stored in Cloudflare.**

The important property is preserved: **the Cloudflare layer stores no user
data.** The MCP endpoint is stateless (it computes and returns; it persists
nothing), and the local-first vault remains the only home for scenarios and
estimates. Cloudflare is infrastructure for *serving and computing*, not a data
custodian.

---

## 5. What the workbench actually does

The core is a **seven-step workbench** that walks a scenario from words to a
board-ready number:

1. **Scoping** — name the asset, threat, effect, and accountable owner; record
   scoping assumptions (optionally AI-suggested, always human-approved).
2. **FAIR decomposition** — Loss Event Frequency (Threat Event Frequency ×
   Vulnerability) and Loss Magnitude (Primary + expected Secondary), from five
   modified-PERT three-point estimates.
3. **Assumptions** — calibrate the estimates; edits atomically invalidate any
   now-stale simulation.
4. **Expected loss** — the deterministic Annualized Loss Expectancy (ALE) with a
   step-by-step calculation trace you can defend.
5. **Monte Carlo simulation** — seeded and reproducible; annual loss
   distribution, tail percentiles, no-loss probability, and the **loss
   exceedance curve**.
6. **Treatments** — model controls as factor reductions; compare baseline vs.
   residual ALE, **net benefit**, and **return on control**.
7. **Executive report** — a Markdown report with an ALE-vs-tail interpretation
   guide, downloadable/print-to-PDF, with an optional labeled AI narrative.

Beyond the single-scenario flow: a project **Portfolio** view (scenarios ranked
by ALE plus an aggregate, optionally *correlated* exceedance curve), **tornado
sensitivity analysis**, a project **risk-tolerance** statement ("at most a 10%
chance of losing more than $1M/year") checked against every exceedance curve,
**treatment-portfolio budget optimization**, per-estimate **rationale fields**
for provenance, **snapshots** that build an ALE trend over time, **CSV
import/export**, and **7-language** localization. Ten sample scenarios load with
one click.

---

## 6. Why it is useful

### For practitioners (risk managers, security leaders, GRC, consultants)

- **Speaks the language of the boardroom.** It converts security concerns into
  **dollars and probabilities**, so risk competes for budget on the same terms
  as everything else the business decides.
- **Defensible, not hand-wavy.** Every figure has a visible calculation trace,
  a seeded/reproducible simulation, and an audit trail of who changed what and
  when. Estimates carry rationale fields. The output survives scrutiny.
- **Justifies spend.** Treatment economics (net benefit, return on control,
  budget-constrained portfolio optimization) answer "is this control worth it?"
  directly.
- **Safe for confidential and regulated work.** Because data never leaves the
  device unless the analyst sends it, sensitive scenarios can be analyzed
  without a vendor-risk review, a data-processing agreement, or a SOC 2 request
  — there is no service organization to assess. On-device AI options keep even
  the narrative-drafting on the machine.
- **No procurement friction.** No account, no install, no backend to stand up,
  no subscription. Open a browser and work; back up a file when done.

### For students and educators

- **A transparent teaching model.** FAIR is often taught abstractly; here every
  step is visible and manipulable — change one estimate and watch the ALE, the
  distribution, and the exceedance curve move. The deterministic trace demystifies
  where the number comes from.
- **Reproducible exercises.** Seeded simulations mean an instructor's reference
  numbers (e.g. the documented `ransomware` sample: ALE **$611,274**, simulated
  mean ≈ $802k, treatment residual $276,000, net benefit $185,275, ROC 124%)
  reproduce exactly on every student's machine.
- **A worked example of privacy-by-architecture.** The codebase is a compact,
  readable case study in local-first design: passphrase-derived encryption, a
  strict CSP, no-backend data flow, and AI governance that keeps computation
  deterministic and models on a short leash. It is as useful to read as it is to
  use.
- **Zero setup, safe sandbox.** Students load ten sample scenarios in one click,
  experiment freely in an isolated store, and nothing they enter is transmitted
  anywhere.

---

## 7. In one paragraph

QCR Workbench is a browser-based FAIR quantitative-cyber-risk tool whose defining
choice is that **your risk data never leaves your device unless you send it**.
It stores everything in a passphrase-encrypted browser vault (AES-GCM-256 over
PBKDF2, key held only in memory), makes no network requests of its own, keeps
all risk math as deterministic pure functions, and constrains optional AI to
prose-drafting with full provenance — never computation. The result is a tool
practitioners can trust with confidential scenarios and produce board-ready,
defensible numbers from, and that students can learn FAIR from transparently and
reproducibly, with the source itself serving as a worked example of
privacy-preserving design.
