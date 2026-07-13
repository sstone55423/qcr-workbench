# Security Notes

This document records the security posture of QCR Workbench for reviewers and
automated scanners. It explains **why** several patterns that scanners commonly
flag are either safe as-is or are accepted, documented trade-offs. Please read
this before filing a finding — many "issues" here are intentional and reasoned.

## Threat model

QCR Workbench is a **local-first, single-user** risk-analysis tool. There is no
multi-tenant server holding user data: projects, risk scenarios, treatments, and API keys
live in the browser's IndexedDB, encrypted at rest inside a passphrase-derived
vault (see `src/lib/localdb/crypto.js`). The user brings their own AI-provider
API keys. The main assets to protect are (1) the vault contents — the risk
scenarios and estimates themselves are often confidential — and (2) those API
keys while the vault is unlocked.

## Data-layer cryptography (sound — do not "fix" downward)

- `src/lib/localdb/crypto.js`: AES-GCM-256 (authenticated) with a random 12-byte
  IV per encryption, key derived via PBKDF2-SHA-256 with 250,000 iterations and a
  random 16-byte salt. Keys are never persisted in plaintext and exist in memory
  only while the vault is unlocked.
- API keys are stored **encrypted in IndexedDB**, not in localStorage or plaintext.

## Content-Security-Policy

A CSP is injected as a `<meta http-equiv>` into the **production build only**, via
`cspMetaPlugin` in `vite.config.js`. It is deliberately NOT applied to
`npm run dev`, because Vite's HMR client requires inline scripts and `eval`.

Design decisions:

- **`script-src 'self' 'wasm-unsafe-eval'` + per-build sha256 hashes.** `'self'`
  + the hashes are the load-bearing control: they block execution of
  injected/inline scripts (the real XSS mitigation). Any inline first-party
  scripts that ship in the build are whitelisted by their computed sha256 hash,
  so we avoid `'unsafe-inline'`. The hashing is
  automatic — if a build's inline scripts change, the hash updates.
  `'wasm-unsafe-eval'` is required by the optional on-device AI (WebLLM,
  `src/lib/localAI.js`) to compile its WebAssembly runtime. It permits **WASM
  compilation only** — it does NOT re-enable JS `eval()` or inline scripts, so
  the anti-XSS guarantee against injected scripts is unchanged. `worker-src
  'self' blob:` allows WebLLM's blob web worker; model weights load over the
  already-broad `connect-src https:`.
- **`connect-src` is intentionally broad (`'self' https: http://localhost:*`).**
  It cannot be a tight allowlist: BYO-key AI providers and WebLLM model weights
  live on arbitrary hosts, and
  the Ollama provider runs on `localhost`. A strict list would break those
  features. Consequently connect-src is not an exfiltration barrier; the XSS
  defense rests on `script-src` instead.
- **`object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, `frame-src 'none'`.**
- `style-src 'unsafe-inline'` is required (React `style={}` attributes are used
  throughout, e.g. chart sizing and theme colors, and inline style attributes
  fall under style-src).

### Limitations that require real HTTP headers (not settable via meta)

Wherever you host the static build, also set these response headers, which a
`<meta>` CSP cannot express:

```
Content-Security-Policy: frame-ancestors 'none'   # clickjacking (or fold into the header CSP)
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
```

These are set for Cloudflare Pages via `public/_headers` (shipped in the build
since 2026-07-13); other hosts need their own equivalent configuration.

The app ships as a fully static bundle with no serve-time script injection, so
`script-src 'self'` plus the per-build hashes cover every script that actually
loads. If you later deploy behind a host that injects its own inline scripts,
deliver the CSP via that host's response headers rather than relaxing
`script-src`.

## Markdown rendering — NOT an XSS sink (common false positive)

`react-markdown` is used in `src/pages/workbench/Report.jsx`, `src/pages/Help.jsx`,
and the AI narrative panel to render generated content. **This is safe as configured:**
`react-markdown` does not render raw HTML unless the `rehype-raw` plugin is added,
and this project does **not** use `rehype-raw` anywhere. Any HTML (e.g. `<script>`)
in AI output is escaped and rendered as literal text, not executed.

> Do NOT add `rehype-raw` without also adding `rehype-sanitize`/DOMPurify. If you
> do, AI-derived content becomes an XSS sink.

## `dangerouslySetInnerHTML` — not used

There are no `dangerouslySetInnerHTML` usages in the codebase. Keep it that way.

## Direct browser-to-provider API calls (intentional)

`src/lib/anthropic.js` sets `anthropic-dangerous-direct-browser-access: true`, and
`src/lib/ai.js` calls OpenAI/Gemini/DashScope/Ollama directly from the browser.
This is a deliberate consequence of the local-first, bring-your-own-key design:
there is no backend to proxy through. The user's own key is sent to the user's own
chosen provider over TLS. A backend proxy would defeat the local-first model and
move key custody to a server the user does not control.

- Note: the Gemini path (`src/lib/ai.js`, `invokeGemini`) passes the key as a URL
  query parameter because the Google Generative Language API expects `?key=`.
  Prefer the `x-goog-api-key` header if/when migrating.

## No authentication / token layer (by design)

The app has no auth layer, reads no URL tokens, and talks to no first-party
backend. Access is gated entirely by the local passphrase-derived vault.

## Dependency hygiene

- The dependency surface is deliberately small: React, Radix/shadcn primitives,
  Recharts, react-markdown, and the optional `@mlc-ai/web-llm` for on-device AI.
  There are no file-format parsers taking untrusted binary input.
- `npm audit` should be kept clean; review any new dependency against the
  no-backend, no-telemetry posture before adding it.

## Multi-tab / data-loss safety (not a classic vuln, but data integrity)

`createVault` (`src/lib/localdb/store.js`) refuses to overwrite an existing vault,
preventing a second tab from replacing the salt and orphaning all encrypted
records. Backups (`src/lib/backup.js`) are independently passphrase-encrypted.

## Regulatory applicability (SOC 2, HIPAA, FERPA, GDPR)

Institutional reviewers commonly ask about these frameworks. The honest answers
follow from the architecture: there is **no service organization behind this
app** — no server, no accounts, no vendor custody of user data. For AI-specific
frameworks (EU AI Act, NIST AI RMF, ISO/IEC 42001), see `AI-GOVERNANCE.md`.

- **SOC 2 — not applicable by architecture, and no attestation is claimed.**
  SOC 2 attests that a *service organization* safeguards customer data it
  holds. QCR Workbench holds nothing: all data stays in the user's
  browser, encrypted under a key only the user has. There is no organization
  to audit. The static-file host serving the build (Cloudflare) maintains its
  own SOC 2 attestations for its infrastructure, available from Cloudflare's
  compliance documentation.

- **HIPAA — the app is not designed for PHI; no BAA exists or is needed with
  the app itself.** Because no vendor ever receives or stores user data, there
  is no "business associate" relationship to gloss over. One real caveat: the
  **optional cloud AI features transmit scenario details (names, descriptions, computed figures) to the
  user's own chosen AI provider**. A user analyzing PHI-adjacent material is
  responsible for that provider relationship (including any BAA with the AI
  vendor) — or can avoid the question entirely by using the on-device AI
  options (WebLLM / Chrome built-in), which keep all text on the machine.

- **FERPA — same shape as HIPAA.** The app never transmits or stores education
  records off-device on its own; the only egress path is the user-initiated,
  user-configured AI call described above. Institutional users handling
  student data should apply their institution's rules to that choice of AI
  provider.

- **GDPR — the app has no controller/processor role over user content.** It
  collects no telemetry, sets no tracking identifiers, and processes personal
  data only on the user's device under the user's control. Users exporting
  data to a cloud AI provider are choosing their own processor. See
  `DATA-PRIVACY.md` for the full data-flow inventory.

None of the above are compliance *certifications* — they are architectural
statements about where data can and cannot go, verifiable from the source.
