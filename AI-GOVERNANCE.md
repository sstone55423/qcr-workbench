# AI Governance

QCR Workbench can optionally use AI models. Under the framing of the NIST AI
RMF, ISO/IEC 42001, and the EU AI Act, this application is a **deployer** of
third-party general-purpose models, not a provider: it ships no model, trains
nothing, and the user selects and credentials every model that is used.

## Principles (enforced in code, not just policy)

1. **AI never does the math.** Every quantitative result — FAIR decomposition,
   expected loss, Monte Carlo statistics, treatment economics — is computed
   deterministically in `src/lib/qcr/`. AI prompts *embed* the already-computed
   figures (`src/lib/qcr/aiFeatures.js`) and instruct the model not to invent
   or recompute numbers. An AI outage changes nothing about the analysis.
2. **Human in the loop for anything entering the model.** AI-suggested scoping
   assumptions are staged in the UI and enter the scenario only when the user
   accepts each one individually. The AI narrative is a labeled draft attached
   to the report; it never modifies estimates, results, or scenario scoping.
3. **Transparency and provenance** (EU AI Act Art. 50 pattern). Every AI output
   is rendered with an explicit AI-disclosure banner; the provider, model, and
   timestamp are stamped on the stored narrative, shown in the UI, written to
   the audit log, and included in the downloaded report's disclosure block.
4. **Staleness detection.** The narrative stores a hash of the inputs it was
   drafted from; if the model or assumptions change afterward, the UI flags the
   narrative as stale until it is redrafted (and FAIR-estimate edits clear it
   outright).
5. **Privacy by architecture.** AI calls go directly from the browser to the
   user's chosen provider with the user's own key — no proxy, no middleman, no
   logging layer. Fully local options (WebLLM over WebGPU, Chrome built-in AI,
   local Ollama) are first-class and keep all content on-device. See
   `DATA-PRIVACY.md`.
6. **Auditability.** Each AI generation writes an `AuditEvent` (category `ai`)
   naming the provider, so a reviewer can reconstruct what was AI-assisted.

## What AI is used for

| Feature | Input sent | Output handling |
|---|---|---|
| Executive narrative draft | Scenario scoping text + computed figures | Stored with provenance + inputs hash; rendered with disclosure; appended to report export under an explicit disclosure heading |
| Assumption suggestions | Scenario scoping text + existing assumptions | Staged; each suggestion requires explicit user acceptance |
| Treatment suggestions | Scenario scoping text + computed baseline figures + existing treatment names | Staged; accepting a suggestion opens it pre-filled in the treatment form for the analyst to review, adjust, and explicitly save (audit-logged); treatment economics are always recomputed deterministically from what is saved |

## What AI is **not** used for

- Estimating or modifying the five FAIR factors
- Any calculation, simulation, or comparison
- Anything automatic or scheduled — every AI call is a user click

## Residual risks the user accepts

- **Model error**: narratives can mischaracterize the computed results; the
  disclosure banner says so, and the numbers in the report tables remain
  authoritative.
- **Provider exposure**: using a cloud provider sends scenario text to that
  provider under the user's own agreement with them. Regulated content should
  use the on-device options.
