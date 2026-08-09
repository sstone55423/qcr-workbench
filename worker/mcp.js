// Remote MCP endpoint for QCR Workbench (bootcamp Project 5, applied).
//
// A stateless Streamable-HTTP MCP server: it speaks JSON-RPC 2.0 over POST /mcp
// and returns plain application/json (no session, no SSE) because every tool is
// a pure, deterministic function from src/lib/qcr — nothing to stream or
// remember. Exposing the trusted math as tools is the strong form of the
// AI-GOVERNANCE rule "AI never computes numbers": an MCP client gets real,
// audited figures by CALLING the math instead of guessing it.

import { QCR_TOOLS, toolByName } from '@/lib/mcp/tools';

const SERVER_INFO = { name: 'qcr-workbench', version: '2.0.0' };
const DEFAULT_PROTOCOL = '2025-06-18';

const toolDefs = () => QCR_TOOLS.map(({ name, description, inputSchema }) => ({ name, description, inputSchema }));

// ── JSON-RPC dispatch ────────────────────────────────────────────────────────
const rpcResult = (id, result) => ({ jsonrpc: '2.0', id, result });
const rpcError = (id, code, message) => ({ jsonrpc: '2.0', id, error: { code, message } });

async function dispatch(msg) {
  if (!msg || msg.jsonrpc !== '2.0') return rpcError(msg?.id ?? null, -32600, 'Invalid Request');
  const { id, method, params } = msg;
  switch (method) {
    case 'initialize':
      return rpcResult(id, {
        protocolVersion: params?.protocolVersion || DEFAULT_PROTOCOL,
        capabilities: { tools: {} },
        serverInfo: SERVER_INFO,
      });
    case 'ping':
      return rpcResult(id, {});
    case 'tools/list':
      return rpcResult(id, { tools: toolDefs() });
    case 'tools/call': {
      const tool = toolByName(params?.name);
      if (!tool) return rpcError(id, -32602, `Unknown tool: ${params?.name}`);
      try {
        const out = await tool.run(params.arguments || {});
        return rpcResult(id, { content: [{ type: 'text', text: JSON.stringify(out) }] });
      } catch (e) {
        // Tool-execution failures are reported as an errored tool result, not a
        // protocol error, so the model can see and react to the message.
        return rpcResult(id, { content: [{ type: 'text', text: e?.message || String(e) }], isError: true });
      }
    }
    default:
      // Notifications (e.g. notifications/initialized) carry no id — ack silently.
      if (id === undefined) return null;
      return rpcError(id, -32601, `Method not found: ${method}`);
  }
}

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, OPTIONS',
  'access-control-allow-headers': 'content-type, mcp-session-id, mcp-protocol-version',
};

export async function handleMcp(request) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  if (request.method !== 'POST') {
    // This stateless server never initiates messages, so GET/SSE isn't offered.
    return new Response('Method Not Allowed', { status: 405, headers: { ...CORS, allow: 'POST, OPTIONS' } });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify(rpcError(null, -32700, 'Parse error')), {
      status: 400, headers: { 'content-type': 'application/json', ...CORS },
    });
  }

  const send = (data) =>
    new Response(data === null ? '' : JSON.stringify(data), {
      status: data === null ? 202 : 200,
      headers: { 'content-type': 'application/json', ...CORS },
    });

  if (Array.isArray(body)) {
    const results = (await Promise.all(body.map(dispatch))).filter(Boolean);
    return send(results.length ? results : null);
  }
  return send(await dispatch(body));
}
