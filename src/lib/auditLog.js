// Audit trail: records every significant action (scenario edits, simulations,
// treatments, AI generations, exports) per project, for methodology documentation.
import { db } from '@/lib/localdb/store';

// Fire-and-forget — logging must never break the action being logged.
export function logAudit(projectId, category, details) {
  db.entities.AuditEvent.create({ project_id: projectId, category, details })
    .catch(() => {});
}

const fmtDate = (iso) => new Date(iso).toLocaleString();

const download = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

export function exportAuditTxt(project, events) {
  const lines = [
    `AUDIT LOG — ${project.name}`,
    `Exported: ${new Date().toLocaleString()}`,
    `Total events: ${events.length}`,
    ''.padEnd(70, '='),
    '',
    ...events.map(e => `${fmtDate(e.created_date)}  [${e.category}]  ${e.details}`),
  ];
  download(new Blob([lines.join('\n')], { type: 'text/plain' }),
    `${project.name.replace(/[^a-z0-9]/gi, '_')}_audit_log.txt`);
}

export function exportAuditDoc(project, events) {
  const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const rows = events.map(e =>
    `<tr><td style="padding:4px 12px 4px 0;white-space:nowrap;vertical-align:top">${esc(fmtDate(e.created_date))}</td>` +
    `<td style="padding:4px 12px 4px 0;vertical-align:top"><b>${esc(e.category)}</b></td>` +
    `<td style="padding:4px 0;vertical-align:top">${esc(e.details)}</td></tr>`
  ).join('');
  const html = `<html xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><title>Audit Log</title></head>` +
    `<body style="font-family:Georgia,serif"><h1>Audit Log — ${esc(project.name)}</h1>` +
    `<p style="color:#666">Exported: ${new Date().toLocaleString()} · ${events.length} events</p>` +
    `<table>${rows}</table></body></html>`;
  download(new Blob(['\ufeff', html], { type: 'application/msword' }),
    `${project.name.replace(/[^a-z0-9]/gi, '_')}_audit_log.doc`);
}