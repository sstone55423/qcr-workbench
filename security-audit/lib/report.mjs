// Report emission: machine-readable JSON plus a human-readable Markdown
// summary. Ordering is stable so two runs diff cleanly.

import { writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { AUDIT_DIR } from './config.mjs'
import { SEVERITIES, sortFindings } from './findings.mjs'

const esc = (s) => String(s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ')

export async function writeReports({ config, layers, findings }) {
  await mkdir(AUDIT_DIR, { recursive: true })
  const sorted = sortFindings(findings)

  const counts = Object.fromEntries(
    SEVERITIES.map((s) => [s, sorted.filter((f) => f.severity === s).length]),
  )

  const report = {
    generatedAt: new Date().toISOString(),
    app: config.app,
    summary: { total: sorted.length, bySeverity: counts },
    coverage: layers,
    findings: sorted,
  }
  await writeFile(join(AUDIT_DIR, 'report.json'), JSON.stringify(report, null, 2) + '\n')

  const md = []
  md.push(`# Security Audit — ${config.app.name}`)
  md.push('')
  md.push(`Generated ${report.generatedAt}`)
  md.push('')
  md.push('## Summary')
  md.push('')
  md.push('| Severity | Count |')
  md.push('| --- | --- |')
  for (const s of SEVERITIES) md.push(`| ${s} | ${counts[s]} |`)
  md.push(`| **Total** | **${sorted.length}** |`)
  md.push('')

  md.push('## Findings')
  md.push('')
  if (sorted.length === 0) {
    md.push('_No findings recorded. Check the coverage section before concluding the app is clean._')
    md.push('')
  }
  for (const f of sorted) {
    md.push(`### [${f.severity}] ${f.title}`)
    md.push('')
    md.push(
      `- **id**: \`${f.id}\`  \n- **confidence**: ${f.confidence}  \n- **phase**: ${f.phase} (${f.layer})  \n- **taxonomy**: ${[f.owasp, f.cwe].filter(Boolean).join(' · ') || 'n/a'}  \n- **location**: \`${f.location}\``,
    )
    if (f.severityRationale) md.push(`- **why this severity**: ${f.severityRationale}`)
    md.push('')
    if (f.evidence) {
      md.push('**Evidence**')
      md.push('')
      md.push('```')
      md.push(String(f.evidence).slice(0, 1200))
      md.push('```')
      md.push('')
    }
    if (f.exploit) {
      md.push(`**Exploit scenario** — ${f.exploit}`)
      md.push('')
    }
    if (f.impact) {
      md.push(`**Impact** — ${f.impact}`)
      md.push('')
    }
    if (f.remediation) {
      md.push(`**Remediation** — ${f.remediation}`)
      md.push('')
    }
  }

  md.push('## Coverage and limitations')
  md.push('')
  md.push('| Layer | Phase | Ran | Tool | Findings |')
  md.push('| --- | --- | --- | --- | --- |')
  for (const l of layers) {
    md.push(`| ${esc(l.name)} | ${l.phase} | ${l.ran ? 'yes' : 'NO'} | ${esc(l.tool || '-')} | ${l.findingCount} |`)
  }
  md.push('')
  for (const l of layers) {
    if (!l.covered && !(l.limitations || []).length) continue
    md.push(`**${l.name}** — ${l.covered || 'see below'}`)
    md.push('')
    for (const lim of l.limitations || []) md.push(`- ${lim}`)
    md.push('')
  }
  md.push('> A layer that did not run, or a check that was skipped, is not a pass.')
  md.push('')

  await writeFile(join(AUDIT_DIR, 'report.md'), md.join('\n'))

  return {
    total: sorted.length,
    bySeverity: SEVERITIES.filter((s) => counts[s] > 0).map((s) => `${counts[s]} ${s}`).join(', ') || 'none',
  }
}
