# QCR Workbench v2 — Cloudflare-native (branch `v2-redesign`)

A rebuild of QCR Workbench as the capstone that wires together the six building
blocks from the Cloudflare AI Architecture Bootcamp. **This deliberately breaks
v1's local-first, zero-backend, zero-knowledge model** — data moves server-side
into D1, gated by Cloudflare Access. That trade is the whole point of "use
Cloudflare completely"; v1 on `main` remains the private, local-only version.

## Bootcamp tool → v2 role

| Tool (bootcamp project) | Role in v2 |
|---|---|
| Workers + Static Assets (P1) | One Worker serves the React SPA **and** the `/api/*` backend |
| D1 (new) | Projects / scenarios / treatments / audit, scoped by Access identity |
| AI Gateway (P2) | Narrative generation with failover + caching + cost tracking |
| Vectorize RAG (P3) | Ground AI estimates in a FAIR-method + loss/threat-intel KB |
| Durable Objects + Agents SDK (P4) | Conversational risk-assessment agent with memory |
| MCP Server (P5) | Expose `compute_ale` / `simulate_scenario` / `search_fair_kb` to Claude |
| Browser Run (P6) | Pull current breach-cost / threat data into estimates |

The domain math in `src/lib/qcr/` stays pure and unchanged — it runs client-side
or inside the Worker over the same parsed objects.

## Architecture

```
Browser (React SPA, served as Static Assets)
   │  /api/*  (run_worker_first)
   ▼
Cloudflare Worker  ── worker/index.js
   ├── D1  (DB binding)                 projects/scenarios/treatments/audit
   ├── AI Gateway → Workers AI / Anthropic   [phase 2]
   ├── Vectorize   (FAIR KB)                 [phase 2]
   ├── Durable Object  (assessment agent)    [phase 3]
   └── MCP endpoint  /mcp                     [phase 4]
Cloudflare Access gates everything; Cf-Access-Authenticated-User-Email = owner.
```

## Phases

- **Phase 1 — foundation (DONE, local).** Worker + Static Assets serving the SPA;
  D1 schema (`migrations/0001_init.sql`); `/api/health` and D1-backed
  `/api/projects` CRUD. Verified locally via `wrangler dev`.
- **Phase 2 — data layer + AI.** Full scenario/treatment/audit endpoints; swap the
  frontend IndexedDB adapter for `fetch('/api/…')`; route narratives through AI
  Gateway; add the Vectorize FAIR knowledge base.
- **Phase 3 — agent.** Durable Object that conducts a conversational FAIR
  assessment (drafts estimates for user confirmation, per AI-GOVERNANCE.md).
- **Phase 4 — interop.** MCP server exposing QCR tools; Browser Run threat-intel
  fetch. Wire Cloudflare Access on the deployed app.

## Running it

```bash
# Local (no cloud account needed):
npm run build
npm run d1:apply:local      # applies migrations to a local sqlite
npm run cf:dev              # wrangler dev → http://localhost:8787

# First-time remote setup (needs `wrangler login`):
npm run d1:create           # prints the database_id …
#   → paste it into wrangler.jsonc  d1_databases[0].database_id
npm run d1:apply:remote
npm run cf:deploy           # builds + wrangler deploy
```

## Open decisions

- **Auth**: Cloudflare Access (assumed) vs. custom. Access = zero code, but needs
  a Zero Trust policy on the deployed hostname.
- **AI provider**: Workers AI (fully in-network, free tier) vs. AI Gateway →
  Anthropic BYOK (higher quality). Gateway supports both with failover.
- **Encryption**: v1's zero-knowledge vault is gone. If any field must stay
  client-encrypted (e.g. AI keys), decide per-field before Phase 2.
