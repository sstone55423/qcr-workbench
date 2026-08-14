// Shared finding shape and ordering. Every layer emits this structure so the
// report is uniform regardless of which tool produced the result.

export const SEVERITIES = ['Critical', 'High', 'Medium', 'Low', 'Info']

export const severityRank = (s) => {
  const i = SEVERITIES.indexOf(s)
  return i === -1 ? SEVERITIES.length : i
}

export function makeFinding({
  id,
  title,
  severity = 'Medium',
  severityRationale = '',
  confidence = 'Likely',
  owasp = '',
  cwe = '',
  location = '',
  evidence = '',
  exploit = '',
  impact = '',
  remediation = '',
  layer = '',
  phase = 'static',
  status = 'open',
}) {
  return {
    id,
    title,
    severity,
    severityRationale,
    confidence,
    owasp,
    cwe,
    location,
    evidence,
    exploit,
    impact,
    remediation,
    layer,
    phase,
    status,
  }
}

// Stable, diff-friendly ordering so two runs can be compared directly.
export function sortFindings(findings) {
  return [...findings].sort(
    (a, b) =>
      severityRank(a.severity) - severityRank(b.severity) ||
      String(a.id).localeCompare(String(b.id)),
  )
}
