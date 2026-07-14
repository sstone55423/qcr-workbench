// Audit trail: records every significant action (scenario edits, simulations,
// treatments, AI generations, exports) per project, for methodology documentation.
//
// Events persist a message KEY plus params ({message_key, message_params}) so
// the log renders in whatever language the viewer has active — the record
// itself stays language-neutral. Events written before this scheme carry a
// pre-rendered English `details` string and display as-is.
import { db } from '@/lib/localdb/store';

// Fire-and-forget — logging must never break the action being logged.
export function logAudit(projectId, category, messageKey, messageParams = {}) {
  db.entities.AuditEvent.create({
    project_id: projectId,
    category,
    message_key: messageKey,
    message_params: messageParams,
  }).catch(() => {});
}

// Renders an event's message in the viewer's language; legacy events fall
// back to their stored English text.
export function resolveAuditMessage(event, t) {
  return event.message_key ? t(event.message_key, event.message_params) : (event.details || '');
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

export function exportAuditTxt(project, events, t) {
  const lines = [
    t('audit.exportTitle', { name: project.name }),
    t('audit.exportedStamp', { date: new Date().toLocaleString() }),
    t('audit.totalEvents', { count: events.length }),
    ''.padEnd(70, '='),
    '',
    ...events.map(e => `${fmtDate(e.created_date)}  [${t(`auditCat.${e.category}`)}]  ${resolveAuditMessage(e, t)}`),
  ];
  download(new Blob([lines.join('\n')], { type: 'text/plain' }),
    `${project.name.replace(/[^a-z0-9]/gi, '_')}_audit_log.txt`);
}

// Byte-order mark prefix so Word detects the .doc export as UTF-8.
const UTF8_BOM = String.fromCharCode(0xfeff);

export function exportAuditDoc(project, events, t) {
  const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const rows = events.map(e =>
    `<tr><td style="padding:4px 12px 4px 0;white-space:nowrap;vertical-align:top">${esc(fmtDate(e.created_date))}</td>` +
    `<td style="padding:4px 12px 4px 0;vertical-align:top"><b>${esc(t(`auditCat.${e.category}`))}</b></td>` +
    `<td style="padding:4px 0;vertical-align:top">${esc(resolveAuditMessage(e, t))}</td></tr>`
  ).join('');
  const html = `<html xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><title>Audit Log</title></head>` +
    `<body style="font-family:Georgia,serif"><h1>${esc(t('audit.exportTitle', { name: project.name }))}</h1>` +
    `<p style="color:#666">${esc(t('audit.exportedStamp', { date: new Date().toLocaleString() }))} · ${esc(t('audit.totalEvents', { count: events.length }))}</p>` +
    `<table>${rows}</table></body></html>`;
  download(new Blob([UTF8_BOM, html], { type: 'application/msword' }),
    `${project.name.replace(/[^a-z0-9]/gi, '_')}_audit_log.doc`);
}
