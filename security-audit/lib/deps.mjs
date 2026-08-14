// Dependency / supply-chain layer: known CVEs via the ecosystem's own auditor,
// plus lockfile hygiene checks.

import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { access } from 'node:fs/promises'
import { join } from 'node:path'
import { ROOT } from './config.mjs'
import { makeFinding } from './findings.mjs'

const run = promisify(execFile)

const SEVERITY_MAP = {
  critical: 'Critical',
  high: 'High',
  moderate: 'Medium',
  low: 'Low',
  info: 'Info',
}

export async function scanDependencies() {
  const findings = []
  const limitations = []

  let audit = null
  try {
    // npm audit exits non-zero when vulnerabilities exist, so read stdout even
    // on failure rather than treating it as a broken layer.
    const { stdout } = await run('npm', ['audit', '--json'], {
      cwd: ROOT,
      shell: true,
      maxBuffer: 20 * 1024 * 1024,
    })
    audit = JSON.parse(stdout)
  } catch (err) {
    if (err && typeof err.stdout === 'string' && err.stdout.trim().startsWith('{')) {
      try {
        audit = JSON.parse(err.stdout)
      } catch {
        limitations.push('npm audit produced unparseable output')
      }
    } else {
      limitations.push(`npm audit unavailable (${err?.message || 'unknown error'}) — CVE coverage incomplete`)
    }
  }

  if (audit?.vulnerabilities) {
    for (const [name, vuln] of Object.entries(audit.vulnerabilities)) {
      // npm nests transitive causes; only report the top-level advisory once.
      const via = (vuln.via || []).filter((v) => typeof v === 'object')
      const title = via[0]?.title || `Vulnerable dependency: ${name}`
      const url = via[0]?.url || ''
      findings.push(
        makeFinding({
          id: `dep-${name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`,
          title: `${name}: ${title}`,
          severity: SEVERITY_MAP[vuln.severity] || 'Medium',
          severityRationale: `npm advisory severity: ${vuln.severity}`,
          confidence: 'Confirmed',
          owasp: 'A06:2021 Vulnerable and Outdated Components',
          cwe: via[0]?.cwe?.join(', ') || 'CWE-1035',
          location: `${name}@${vuln.range || 'unknown'}`,
          evidence: url ? `Advisory: ${url}` : JSON.stringify(vuln.via?.slice(0, 2) || []),
          exploit: `An attacker exploits the known vulnerability in ${name}; reachability from this app must be confirmed by hand.`,
          impact: `Depends on the advisory; see ${url || 'npm audit output'}`,
          remediation: vuln.fixAvailable
            ? `Run npm audit fix${typeof vuln.fixAvailable === 'object' ? ` (updates to ${vuln.fixAvailable.name}@${vuln.fixAvailable.version})` : ''}`
            : 'No automatic fix; evaluate upgrade or replacement.',
          layer: 'dependencies',
        }),
      )
    }
  }

  try {
    await access(join(ROOT, 'package-lock.json'))
  } catch {
    findings.push(
      makeFinding({
        id: 'dep-no-lockfile',
        title: 'No lockfile committed',
        severity: 'Medium',
        severityRationale: 'Unpinned transitive dependencies allow silent, unreviewed code changes.',
        confidence: 'Confirmed',
        owasp: 'A08:2021 Software and Data Integrity Failures',
        cwe: 'CWE-1104',
        location: 'package-lock.json',
        evidence: 'File not present',
        exploit: 'A compromised or malicious transitive release is pulled in on a fresh install without review.',
        impact: 'Unreproducible builds; supply-chain exposure.',
        remediation: 'Commit the lockfile and install with `npm ci` in CI.',
        layer: 'dependencies',
      }),
    )
  }

  return {
    tool: audit ? 'npm audit' : 'built-in (degraded)',
    covered: 'Known CVEs in the dependency tree; lockfile presence.',
    limitations: [
      ...limitations,
      'Does not assess whether vulnerable code paths are actually reachable from this app.',
      'Does not detect malicious-but-unreported packages or abandoned maintainership.',
    ],
    findings,
  }
}
