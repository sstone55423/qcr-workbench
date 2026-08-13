# Using AI assistant tools (MCP)

QCR Workbench publishes its FAIR risk math as tools an AI assistant can call over
the **Model Context Protocol (MCP)**. Because the assistant *calls the tools*
instead of estimating, every figure it reports is produced by the same audited
math this app uses — it cannot invent an ALE. There are two ways to connect.

## 1 · Remote MCP server (e.g. Claude)

Add this URL as an MCP connector in your assistant:

```
https://qcr-workbench-v2.sstone55423.workers.dev/mcp
```

It's a public, read-only calculation service — no sign-in required. In Claude,
open **Settings → Connectors → Add custom connector**, paste the URL, and enable
the tools. (If the pretty domain has been cut over, `https://qcr-workbench.org/mcp`
works too.)

## 2 · WebMCP (in-browser agent)

If your browser supports WebMCP (Microsoft Edge 147+, or Chrome with the origin
trial), the same tools are also registered *inside this page*, so a browser agent
can run them locally — **nothing leaves your browser**. To turn it on, open the
browser console on this site and run:

```js
localStorage.setItem('qcr.webmcp', '1');
```

then reload. A browser agent then also gets two tools that operate the app: list
the open project's scenarios, and jump to a workbench step.

## The tools

| Tool | What it does |
|---|---|
| `compute_ale` | Deterministic annualized loss expectancy |
| `simulate_scenario` | Monte Carlo loss distribution (mean, P90/P95/P99) |
| `evaluate_treatment` | Cost-benefit of a control (net benefit, ROC) |
| `optimize_controls` | Best control mix under a budget |
| `sensitivity_analysis` | Which input drives the risk (tornado) |
| `calibrate_estimate` | Turn a 90% confidence range into a PERT estimate |
| `search_fair_kb` | Search the bundled knowledge base: compromise-type write-ups with incident references, the control catalog (framework citations, typical effectiveness ranges), and sample scenarios |
| `validate_model` | Check that a FAIR model is well-formed |

## A worked example

Paste this FAIR model to your assistant:

```json
{
  "threat_event_frequency":      { "minimum": 0.5,   "most_likely": 1,      "maximum": 3 },
  "vulnerability":               { "minimum": 0.1,   "most_likely": 0.3,    "maximum": 0.6 },
  "primary_loss":                { "minimum": 50000, "most_likely": 150000, "maximum": 600000 },
  "secondary_loss":              { "minimum": 10000, "most_likely": 40000,  "maximum": 200000 },
  "secondary_loss_probability":  { "minimum": 0.1,   "most_likely": 0.3,    "maximum": 0.5 }
}
```

Then ask:

> *"Use compute_ale on this FAIR model, then simulate it at 20,000 iterations with seed 42."*

You should get an **ALE of about $89,788** and a simulated mean near $90,000. If
the assistant reproduces that exact ALE, it really called the tool rather than
guessing.

Chain the tools for a full assessment in one request:

> *"I face 1–3 ransomware events a year, 20–40% of them become losses, and the
> primary loss is \$1–4M. Calibrate those into a FAIR model, validate it, compute
> the ALE, and simulate it."*

---

*This guide is in English, which is the authoritative version.*
