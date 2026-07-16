// CSV import/export of scenarios, for interop with the spreadsheets risk
// teams already keep. Column headers are STABLE ENGLISH IDENTIFIERS (not
// localized) so a file exported under one UI language imports under any
// other; assumptions are joined with " | ". RFC 4180 quoting throughout.
import { validateFairModel } from '@/lib/qcr/models';

const FACTOR_COLUMNS = [
  ['threat_event_frequency', 'tef'],
  ['vulnerability', 'vuln'],
  ['primary_loss', 'primary_loss'],
  ['secondary_loss', 'secondary_loss'],
  ['secondary_loss_probability', 'slp'],
];

const META_COLUMNS = ['name', 'description', 'asset', 'threat', 'effect', 'owner', 'assumptions'];

export const CSV_HEADERS = [
  ...META_COLUMNS,
  ...FACTOR_COLUMNS.flatMap(([, prefix]) =>
    ['minimum', 'most_likely', 'maximum', 'unit', 'rationale'].map((part) => `${prefix}_${part}`)),
];

const quote = (value) => {
  const s = String(value ?? '');
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function scenariosToCsv(scenarios) {
  const lines = [CSV_HEADERS.join(',')];
  for (const s of scenarios) {
    const cells = [
      s.name, s.description, s.asset, s.threat, s.effect, s.owner,
      (s.assumptions || []).join(' | '),
      ...FACTOR_COLUMNS.flatMap(([factor]) => {
        const e = s.fair[factor];
        return [e.minimum, e.most_likely, e.maximum, e.unit || '', e.rationale || ''];
      }),
    ];
    lines.push(cells.map(quote).join(','));
  }
  return lines.join('\r\n');
}

// Minimal RFC 4180 reader: quoted fields may contain commas, quotes ("" for
// a literal quote), and line breaks. Returns an array of rows (string[]).
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 1; } else inQuotes = false;
      } else field += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field); field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i += 1;
      row.push(field); field = '';
      rows.push(row); row = [];
    } else {
      field += c;
    }
  }
  if (field !== '' || row.length > 0) { row.push(field); rows.push(row); }
  // Drop fully empty trailing rows.
  return rows.filter((r) => r.some((cell) => cell.trim() !== ''));
}

// Parses a scenarios CSV into scenario-shaped objects. Rows that fail
// validation are skipped and reported: { scenarios, errors: [{line, message}] }.
export function parseScenariosCsv(text) {
  const rows = parseCsv(text);
  if (rows.length === 0) return { scenarios: [], errors: [{ line: 1, message: 'empty file' }] };
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const index = Object.fromEntries(header.map((h, i) => [h, i]));
  const missing = ['name', 'tef_minimum'].filter((col) => !(col in index));
  if (missing.length) {
    return { scenarios: [], errors: [{ line: 1, message: `missing column(s): ${missing.join(', ')}` }] };
  }

  const cell = (row, col) => (index[col] !== undefined ? (row[index[col]] ?? '').trim() : '');
  const scenarios = [];
  const errors = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const line = r + 1;
    try {
      const name = cell(row, 'name');
      if (!name) throw new Error('name is required');
      const fair = {};
      for (const [factor, prefix] of FACTOR_COLUMNS) {
        const num = (part) => {
          const raw = cell(row, `${prefix}_${part}`);
          const value = Number(raw);
          if (raw === '' || !Number.isFinite(value)) throw new Error(`${prefix}_${part} is not a number`);
          return value;
        };
        fair[factor] = {
          minimum: num('minimum'),
          most_likely: num('most_likely'),
          maximum: num('maximum'),
          unit: cell(row, `${prefix}_unit`),
          ...(cell(row, `${prefix}_rationale`) ? { rationale: cell(row, `${prefix}_rationale`) } : {}),
        };
      }
      validateFairModel(fair);
      scenarios.push({
        name,
        description: cell(row, 'description'),
        asset: cell(row, 'asset'),
        threat: cell(row, 'threat'),
        effect: cell(row, 'effect'),
        owner: cell(row, 'owner'),
        assumptions: cell(row, 'assumptions') ? cell(row, 'assumptions').split('|').map((a) => a.trim()).filter(Boolean) : [],
        fair,
      });
    } catch (err) {
      errors.push({ line, message: err.message });
    }
  }
  return { scenarios, errors };
}
