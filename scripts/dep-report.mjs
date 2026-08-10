#!/usr/bin/env node
// Weekly dependency & vulnerability report generator.
//
// Reads the JSON that the workflow captured from `npm outdated` and
// `npm audit`, and emits:
//   - report.html          : the email body (inline-styled for mail clients)
//   - subject=<line>        : appended to $GITHUB_OUTPUT for the mail step
//
// Runs in GitHub Actions on real Node — no external dependencies.

import { readFileSync, writeFileSync, appendFileSync } from 'node:fs';

// The components the request is specifically about — surfaced first.
const CORE = new Set([
  'react',
  'react-dom',
  'vite',
  '@vitejs/plugin-react',
  'tailwindcss',
  '@tailwindcss/postcss',
]);

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8') || '{}');
  } catch {
    return {};
  }
}

function majorOf(v) {
  return String(v || '').split('.')[0];
}
function isMajorJump(cur, latest) {
  if (!cur || !latest) return false;
  return majorOf(cur) !== majorOf(latest);
}
function esc(s) {
  return String(s ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
}

// --- Outdated packages ------------------------------------------------------
// npm outdated --json => { name: { current, wanted, latest, ... } }
const outdated = readJson('outdated.json');
const outdatedRows = Object.entries(outdated).map(([name, info]) => ({
  name,
  current: info.current || '—',
  wanted: info.wanted || '—',
  latest: info.latest || '—',
  core: CORE.has(name),
  major: isMajorJump(info.current, info.latest),
}));
const coreOutdated = outdatedRows.filter((r) => r.core).sort((a, b) => a.name.localeCompare(b.name));
const otherOutdated = outdatedRows.filter((r) => !r.core).sort((a, b) => a.name.localeCompare(b.name));

// Core components that are already current (so the report affirmatively lists them).
const coreUpToDate = [...CORE].filter((n) => !outdated[n]).sort();

// --- Vulnerabilities --------------------------------------------------------
// npm audit --json => { vulnerabilities: {...}, metadata: { vulnerabilities: {...} } }
const audit = readJson('audit.json');
const vulns = audit.vulnerabilities || {};
const meta = (audit.metadata && audit.metadata.vulnerabilities) || {
  info: 0, low: 0, moderate: 0, high: 0, critical: 0, total: 0,
};
const sevRank = { critical: 4, high: 3, moderate: 2, low: 1, info: 0 };
const vulnRows = Object.values(vulns)
  .map((v) => ({
    name: v.name,
    severity: v.severity,
    range: v.range,
    fix:
      v.fixAvailable === true
        ? 'yes (npm audit fix)'
        : v.fixAvailable && v.fixAvailable.version
        ? `${v.fixAvailable.name}@${v.fixAvailable.version}${v.fixAvailable.isSemVerMajor ? ' — MAJOR' : ''}`
        : 'no automatic fix',
    advisories: (Array.isArray(v.via) ? v.via : [])
      .filter((x) => x && typeof x === 'object')
      .map((x) => ({ title: x.title, url: x.url })),
  }))
  .sort((a, b) => (sevRank[b.severity] || 0) - (sevRank[a.severity] || 0));

// --- Subject line -----------------------------------------------------------
const date = new Date().toISOString().slice(0, 10);
const updCount = outdatedRows.length;
const updPart = `${updCount} update${updCount === 1 ? '' : 's'}`;
const vulnPart =
  meta.total > 0
    ? `${meta.total} vuln${meta.total === 1 ? '' : 's'} (` +
      [
        meta.critical && `${meta.critical} crit`,
        meta.high && `${meta.high} high`,
        meta.moderate && `${meta.moderate} mod`,
        meta.low && `${meta.low} low`,
      ]
        .filter(Boolean)
        .join(', ') +
      ')'
    : 'no vulnerabilities';
const flag = meta.critical || meta.high ? '[ACTION] ' : '';
const subject = `${flag}QCR deps — ${updPart}, ${vulnPart} — ${date}`;

// --- HTML body --------------------------------------------------------------
const sevColor = { critical: '#b91c1c', high: '#c2410c', moderate: '#a16207', low: '#0369a1', info: '#475569' };
const cell = 'padding:6px 10px;border-bottom:1px solid #e5e7eb;font-size:14px;';
const th = 'padding:6px 10px;text-align:left;font-size:12px;text-transform:uppercase;letter-spacing:.04em;color:#6b7280;border-bottom:2px solid #e5e7eb;';

function outdatedTable(rows) {
  if (!rows.length) return '<p style="color:#16a34a;font-size:14px;margin:4px 0 16px;">All up to date.</p>';
  const body = rows
    .map(
      (r) => `<tr>
        <td style="${cell}font-family:ui-monospace,monospace;">${esc(r.name)}</td>
        <td style="${cell}">${esc(r.current)}</td>
        <td style="${cell}">${esc(r.latest)}${r.major ? ' <span style="color:#b91c1c;font-weight:600;">(major)</span>' : ''}</td>
      </tr>`,
    )
    .join('');
  return `<table style="border-collapse:collapse;width:100%;margin:4px 0 20px;">
    <thead><tr><th style="${th}">Package</th><th style="${th}">Current</th><th style="${th}">Latest</th></tr></thead>
    <tbody>${body}</tbody></table>`;
}

const vulnSection = vulnRows.length
  ? `<table style="border-collapse:collapse;width:100%;margin:4px 0 20px;">
      <thead><tr>
        <th style="${th}">Package</th><th style="${th}">Severity</th>
        <th style="${th}">Vulnerable</th><th style="${th}">Fix</th>
      </tr></thead>
      <tbody>${vulnRows
        .map(
          (v) => `<tr>
            <td style="${cell}font-family:ui-monospace,monospace;">${esc(v.name)}</td>
            <td style="${cell}color:${sevColor[v.severity] || '#475569'};font-weight:600;text-transform:capitalize;">${esc(v.severity)}</td>
            <td style="${cell}font-family:ui-monospace,monospace;">${esc(v.range)}</td>
            <td style="${cell}">${esc(v.fix)}</td>
          </tr>${
            v.advisories.length
              ? `<tr><td colspan="4" style="${cell}color:#6b7280;font-size:12px;padding-top:0;">${v.advisories
                  .map((a) => `• ${esc(a.title)}${a.url ? ` — <a href="${esc(a.url)}" style="color:#2563eb;">advisory</a>` : ''}`)
                  .join('<br>')}</td></tr>`
              : ''
          }`,
        )
        .join('')}</tbody></table>`
  : '<p style="color:#16a34a;font-size:14px;margin:4px 0 16px;">No known vulnerabilities in the installed dependency tree.</p>';

const coreUpToDateNote = coreUpToDate.length
  ? `<p style="font-size:13px;color:#16a34a;margin:0 0 20px;">Current: ${coreUpToDate.map(esc).join(', ')}.</p>`
  : '';

const html = `<!doctype html><html><body style="margin:0;background:#f9fafb;padding:24px 0;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#111827;">
<div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;">
  <div style="background:#0f172a;color:#f8fafc;padding:18px 22px;">
    <div style="font-size:17px;font-weight:600;">QCR Workbench — weekly dependency & vulnerability check</div>
    <div style="font-size:13px;color:#94a3b8;margin-top:2px;">${esc(date)} · branch <code style="color:#cbd5e1;">${esc(process.env.GITHUB_REF_NAME || 'main')}</code></div>
  </div>
  <div style="padding:22px;">
    <p style="font-size:15px;margin:0 0 20px;"><strong>Summary:</strong> ${esc(updPart)}, ${esc(vulnPart)}.</p>

    <h2 style="font-size:15px;margin:0 0 6px;">Core components (React / Vite / Tailwind)</h2>
    ${outdatedTable(coreOutdated)}
    ${coreUpToDateNote}

    <h2 style="font-size:15px;margin:0 0 6px;">Known vulnerabilities (npm audit)</h2>
    ${vulnSection}

    <h2 style="font-size:15px;margin:0 0 6px;">Other outdated packages (${otherOutdated.length})</h2>
    ${outdatedTable(otherOutdated)}

    <p style="font-size:12px;color:#9ca3af;border-top:1px solid #e5e7eb;padding-top:14px;margin-top:8px;">
      Generated by <code>.github/workflows/dependency-monitor.yml</code> via <code>npm outdated</code> + <code>npm audit</code>.
      Reply to nobody — this is an automated report. Update with <code>npm i pkg@latest</code> or <code>npm audit fix</code>.
    </p>
  </div>
</div>
</body></html>`;

writeFileSync('report.html', html);
if (process.env.GITHUB_OUTPUT) {
  appendFileSync(process.env.GITHUB_OUTPUT, `subject=${subject}\n`);
}
console.log(subject);
