// In-page WebMCP provider (W3C Web Model Context Protocol, navigator.modelContext).
//
// Registers the shared QCR tools (src/lib/mcp/tools.js) so a WebMCP-capable
// browser agent (Edge 147+, Chrome origin trial) can call them IN THE PAGE —
// the tools run over the user's local, unencrypted-in-memory session, so unlike
// the remote /mcp server nothing leaves the browser. That makes WebMCP the MCP
// surface compatible with the local-first / zero-knowledge model.
//
// Opt-in and gated: WebMCP is an emerging standard, so this stays off unless the
// browser supports it AND the user set the flag (localStorage qcr.webmcp='1').

import { QCR_TOOLS } from '@/lib/mcp/tools';

const FLAG_KEY = 'qcr.webmcp';

// The WebMCP object moved from navigator.modelContext to document.modelContext;
// prefer the new location and fall back to the old one on earlier builds.
function getModelContext() {
  if (typeof document !== 'undefined' && 'modelContext' in document) return document.modelContext;
  if (typeof navigator !== 'undefined' && 'modelContext' in navigator) return navigator.modelContext;
  return null;
}

export function isWebMcpSupported() {
  return getModelContext() != null;
}

export function isWebMcpEnabled() {
  if (!isWebMcpSupported()) return false;
  try {
    return localStorage.getItem(FLAG_KEY) === '1';
  } catch {
    return false;
  }
}

export function setWebMcpEnabled(on) {
  try {
    localStorage.setItem(FLAG_KEY, on ? '1' : '0');
  } catch {
    /* storage unavailable — treat as off */
  }
}

// WebMCP execute() returns a plain object; surface thrown validation errors as
// { error } so the agent sees the message instead of a rejected promise.
const toExecute = (run) => async (input) => {
  try {
    return await run(input || {});
  } catch (e) {
    return { error: e?.message || String(e) };
  }
};

// Register the shared QCR compute tools plus any caller-supplied app-action
// tools (already in WebMCP shape). Returns an uninstaller that unregisters
// exactly what it added — a no-op when WebMCP isn't supported.
export function installWebMcp({ appTools = [] } = {}) {
  const mc = getModelContext();
  if (!mc) return () => {};

  const compute = QCR_TOOLS.map((t) => ({
    name: t.name,
    description: t.description,
    inputSchema: t.inputSchema,
    annotations: { readOnlyHint: !!t.readOnly },
    execute: toExecute(t.run),
  }));

  const all = [...compute, ...appTools];
  for (const tool of all) mc.registerTool(tool);

  return () => {
    for (const tool of all) {
      try {
        // Not all builds expose unregisterTool (some use provideContext/clearContext).
        mc.unregisterTool?.(tool.name);
      } catch {
        /* already gone / not supported */
      }
    }
  };
}
