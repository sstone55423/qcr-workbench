# AI Governance

> Placeholder — the full governance statement is written in the documentation
> phase. The commitments below are architectural and already in force.

QCR Workbench can optionally use AI (your own API key, a local Ollama server,
or fully on-device models) to draft narrative text and suggest analysis
assumptions. Under the NIST AI RMF and ISO/IEC 42001 framing, this app is a
**deployer** of third-party models, not a provider.

- **Human in the loop:** AI never changes your risk model by itself. Suggested
  assumptions must be explicitly accepted; narratives are labeled drafts.
- **No math by AI:** All quantitative results (FAIR decomposition, expected
  loss, Monte Carlo simulation, treatment economics) are computed
  deterministically in code. AI only receives already-computed numbers to
  narrate.
- **Provenance:** Every AI-generated output is stamped with the provider,
  model, and timestamp, recorded in the audit log, and disclosed in exports.
- **Privacy:** AI calls go directly from your browser to the provider you
  configured. No proxy, no middleman. On-device options (WebLLM, Chrome
  built-in AI) never send data anywhere.
