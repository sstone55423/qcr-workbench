// QCR Workbench v2 Worker.
//
// Serves the built React SPA via the Static Assets binding and a small JSON
// API under /api/* backed by D1. Only /api/* invokes this Worker
// (run_worker_first in wrangler.jsonc); every other path is served straight
// from assets, with SPA fallback to index.html. Rows are scoped to the
// Cloudflare Access identity so a shared database still isolates users.

const json = (data, init = {}) =>
  new Response(JSON.stringify(data), {
    ...init,
    headers: { 'content-type': 'application/json; charset=utf-8', ...(init.headers || {}) },
  });

const fail = (status, message) => json({ error: message }, { status });

// Cloudflare Access injects the authenticated email after gating the app.
// Locally that header is absent, so fall back to a dev identity.
const ownerEmail = (request) =>
  request.headers.get('Cf-Access-Authenticated-User-Email') || 'dev@localhost';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    // Safety net: normally assets serve non-API paths without invoking us.
    if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(request);
    try {
      return await handleApi(request, env, url);
    } catch (err) {
      return fail(500, err?.message || 'Internal error');
    }
  },
};

async function handleApi(request, env, url) {
  const owner = ownerEmail(request);
  const { pathname } = url;
  const method = request.method;

  if (pathname === '/api/health') {
    return json({ ok: true, service: 'qcr-workbench-v2', time: new Date().toISOString() });
  }

  if (pathname === '/api/projects') {
    if (method === 'GET') {
      const { results } = await env.DB
        .prepare('SELECT * FROM projects WHERE owner_email = ? ORDER BY updated_at DESC')
        .bind(owner)
        .all();
      return json(results.map(deserializeProject));
    }
    if (method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const name = String(body.name || '').trim();
      if (!name) return fail(400, 'name is required');
      const id = body.id || crypto.randomUUID();
      const tolerance = body.tolerance ? JSON.stringify(body.tolerance) : null;
      await env.DB
        .prepare('INSERT INTO projects (id, owner_email, name, description, tolerance) VALUES (?, ?, ?, ?, ?)')
        .bind(id, owner, name, body.description || null, tolerance)
        .run();
      const row = await env.DB.prepare('SELECT * FROM projects WHERE id = ?').bind(id).first();
      return json(deserializeProject(row), { status: 201 });
    }
    return fail(405, 'method not allowed');
  }

  const projectMatch = pathname.match(/^\/api\/projects\/([^/]+)$/);
  if (projectMatch) {
    const id = projectMatch[1];
    const row = await env.DB
      .prepare('SELECT * FROM projects WHERE id = ? AND owner_email = ?')
      .bind(id, owner)
      .first();
    if (!row) return fail(404, 'project not found');
    if (method === 'GET') return json(deserializeProject(row));
    if (method === 'DELETE') {
      await env.DB.prepare('DELETE FROM projects WHERE id = ?').bind(id).run();
      return json({ deleted: id });
    }
    return fail(405, 'method not allowed');
  }

  return fail(404, 'unknown endpoint');
}

function deserializeProject(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    tolerance: row.tolerance ? JSON.parse(row.tolerance) : null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}
