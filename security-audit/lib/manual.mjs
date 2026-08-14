// Curated findings from human/agent code review, kept in version control so
// they persist across runs and can be marked fixed or accepted over time.
// Automated layers cannot reason about design intent; this file is where that
// judgment lives.

import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { AUDIT_DIR } from './config.mjs'
import { makeFinding } from './findings.mjs'

const MANUAL_PATH = join(AUDIT_DIR, 'findings', 'manual.json')

export async function loadManualFindings() {
  let raw
  try {
    raw = JSON.parse(await readFile(MANUAL_PATH, 'utf8'))
  } catch {
    return {
      tool: 'manual review',
      covered: 'none',
      limitations: ['No findings/manual.json present — no curated review findings loaded.'],
      findings: [],
    }
  }

  const findings = (raw.findings || []).map((f) =>
    makeFinding({ ...f, layer: 'manual-review', phase: f.phase || 'static' }),
  )
  const open = findings.filter((f) => f.status !== 'fixed')

  return {
    tool: 'manual review',
    covered: raw.covered || 'See findings/manual.json',
    limitations: raw.limitations || [],
    // Fixed items stay in the file as history but are not re-reported.
    findings: open,
  }
}
