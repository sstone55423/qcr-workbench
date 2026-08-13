# Using the QCR Workbench MCP tools

QCR Workbench exposes its FAIR risk-math as callable tools over **two** surfaces
that share one registry ([`src/lib/mcp/tools.js`](../src/lib/mcp/tools.js)):

- **Remote MCP** — a server at `/mcp` for MCP clients (Claude Desktop, the MCP
  Inspector, scripts). Tools run on the Cloudflare Worker.
- **WebMCP** — the same tools registered *in the page* via `navigator.modelContext`,
  callable by a WebMCP-capable browser agent. Tools run locally; nothing leaves
  the browser.

The eight shared tools: `compute_ale`, `simulate_scenario`, `evaluate_treatment`,
`optimize_controls`, `sensitivity_analysis`, `calibrate_estimate`, `search_fair_kb`,
`validate_model`. WebMCP additionally exposes `list_scenarios` and `open_workbench_step`.

`search_fair_kb` searches the bundled reference corpora (compromise-type
write-ups with incident references, the control catalog with framework
citations and typical effectiveness ranges, and the sample scenario library)
with deterministic lexical matching — no network, identical results on both
surfaces. The effectiveness ranges it returns are planning heuristics, not
measurements.

A sample FAIR model used in the examples below:

```json
{
  "threat_event_frequency":     { "minimum": 0.5,   "most_likely": 1,      "maximum": 3 },
  "vulnerability":              { "minimum": 0.1,   "most_likely": 0.3,    "maximum": 0.6 },
  "primary_loss":              { "minimum": 50000, "most_likely": 150000, "maximum": 600000 },
  "secondary_loss":            { "minimum": 10000, "most_likely": 40000,  "maximum": 200000 },
  "secondary_loss_probability":{ "minimum": 0.1,   "most_likely": 0.3,    "maximum": 0.5 }
}
```

---

## A · Remote MCP (`/mcp`)

**Endpoint:** `POST https://qcr-workbench.org/mcp`
(also `https://qcr-workbench-v2.sstone55423.workers.dev/mcp`). JSON-RPC 2.0 over
HTTP (stateless Streamable HTTP).

> **Prerequisite:** deploy the Worker so `/mcp` is live: `npm run cf:deploy`.
> If Cloudflare Access is later enabled on the host, MCP clients must present an
> Access **service token** (`CF-Access-Client-Id` / `CF-Access-Client-Secret`
> headers) or the endpoint must sit outside the Access policy.

### Option 1 — MCP Inspector (quickest sanity check)

```bash
npx @modelcontextprotocol/inspector
```

In the UI: **Transport** = `Streamable HTTP`, **URL** = `https://qcr-workbench.org/mcp`
→ **Connect** → **List Tools** → pick `compute_ale`, paste the sample model under
`fair`, **Run**. You should get the ALE and its decomposition.

### Option 2 — Claude Desktop

Recent Claude Desktop connects to remote MCP servers two ways:

- **Custom Connector** (Settings → Connectors → Add): name it `QCR Workbench`,
  URL `https://qcr-workbench.org/mcp`.
- **Config file bridge** (`claude_desktop_config.json`) using `mcp-remote`:

  ```json
  {
    "mcpServers": {
      "qcr-workbench": {
        "command": "npx",
        "args": ["-y", "mcp-remote", "https://qcr-workbench.org/mcp"]
      }
    }
  }
  ```

Restart Claude Desktop, then ask e.g. *"Use compute_ale on this FAIR model …"* and
Claude will call the tool and report the real figures.

### Option 3 — raw JSON-RPC (any client / curl)

```bash
# List tools
curl -s https://qcr-workbench.org/mcp \
  -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'

# Call a tool
curl -s https://qcr-workbench.org/mcp \
  -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{
        "name":"compute_ale",
        "arguments":{"fair": { ...the sample model... }}}}'
```

The handshake, if you implement a client: `initialize` → `tools/list` → `tools/call`.

---

## B · WebMCP (in-page)

WebMCP registers the tools on `navigator.modelContext` so a browser agent can
call them **inside the running app** — over your local, in-memory session. Data
never leaves the browser, so this works with the local-first model.

**Requirements**
- A WebMCP-capable browser: **Edge 147+** (native) or **Chrome 149** (origin
  trial). Feature check: `('modelContext' in navigator)`.
- **HTTPS** (a secure context). `https://qcr-workbench.org` qualifies; so does
  `http://localhost` during `npm run cf:dev` / `npm run dev`.

**Enable it** (it's opt-in and off by default):

1. Open the app, then in DevTools console:
   ```js
   localStorage.setItem('qcr.webmcp', '1');
   ```
2. Reload the page. On mount the app registers the tools (see
   [`WebMcpBridge`](../src/components/WebMcpBridge.jsx)). Turn off with
   `localStorage.setItem('qcr.webmcp','0')` + reload.

**Confirm registration** (Chrome testing API, behind a flag):

```js
if ('modelContextTesting' in navigator) {
  console.log((await navigator.modelContextTesting.getTools()).map(t => t.name));
}
```

**Use it.** With a WebMCP-capable agent active on the page, the tools are
discoverable and callable. Beyond the seven compute tools, WebMCP adds:

- `list_scenarios` — the open project's scenarios, each with its ALE.
- `open_workbench_step` — navigate the app to a scenario step (e.g. `simulation`).

Example agent prompts once enabled:

- *"List the scenarios in this project and tell me which has the highest ALE."*
- *"Open the ransomware scenario's simulation step, then simulate it and give me the P95."*
- *"Calibrate a 90% CI of \$1M–\$4M into a PERT estimate."*

Every number comes from the app's audited math — the agent can't invent an ALE,
it has to call `compute_ale`.

---

## Which one to use

| | Remote MCP | WebMCP |
|---|---|---|
| Runs on | Cloudflare Worker (server) | In the browser page |
| Best for | Claude Desktop, scripts, CI, shared access | An agent operating the live app privately |
| Data | Goes through the Worker/D1 | Stays in the browser |
| Maturity | Stable | Emerging (Edge/Chrome only) |
