// Secret scanning across the working tree and git history. Committed
// credentials survive deletion, so history matters as much as HEAD.

import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { ROOT } from './config.mjs'
import { walkScope, readLines } from './walk.mjs'
import { makeFinding } from './findings.mjs'

const run = promisify(execFile)

// Provider-specific formats first (high confidence), generic patterns after.
const PATTERNS = [
  { id: 'anthropic', re: /sk-ant-[A-Za-z0-9_-]{20,}/g, label: 'Anthropic API key' },
  { id: 'openai', re: /\bsk-(?:proj-)?[A-Za-z0-9]{32,}/g, label: 'OpenAI API key' },
  { id: 'google', re: /\bAIza[0-9A-Za-z_-]{35}\b/g, label: 'Google API key' },
  { id: 'cerebras', re: /\bcsk-[A-Za-z0-9]{20,}/g, label: 'Cerebras API key' },
  { id: 'github', re: /\bgh[pousr]_[A-Za-z0-9]{36,}/g, label: 'GitHub token' },
  { id: 'aws', re: /\bAKIA[0-9A-Z]{16}\b/g, label: 'AWS access key id' },
  { id: 'slack', re: /\bxox[baprs]-[A-Za-z0-9-]{10,}/g, label: 'Slack token' },
  { id: 'private-key', re: /-----BEGIN (?:RSA |EC |OPENSSH |PGP )?PRIVATE KEY-----/g, label: 'Private key block' },
  { id: 'jwt', re: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g, label: 'JWT' },
]

// Lines that look like patterns/placeholders rather than live credentials.
const isPlaceholder = (line) =>
  /placeholder|example|dummy|fake|your[-_ ]?key|xxxx|\.\.\.|<[a-z-]+>|test-key|CANARY/i.test(line)

export async function scanSecrets(config) {
  const findings = []
  const limitations = []
  const files = await walkScope(config)

  for (const file of files) {
    // The scanner's own pattern table would otherwise match itself.
    if (file.rel.startsWith('security-audit/')) continue
    const { lines } = await readLines(file)
    lines.forEach((line, i) => {
      if (isPlaceholder(line)) return
      for (const p of PATTERNS) {
        p.re.lastIndex = 0
        const match = p.re.exec(line)
        if (!match) continue
        findings.push(
          makeFinding({
            id: `secret-${p.id}-${file.rel.replace(/[^a-z0-9]+/gi, '-')}-${i + 1}`.toLowerCase(),
            title: `${p.label} committed in source`,
            severity: 'Critical',
            severityRationale: 'A live credential in the repository is usable by anyone with read access.',
            confidence: 'Likely',
            owasp: 'A07:2021 Identification and Authentication Failures',
            cwe: 'CWE-798',
            location: `${file.rel}:${i + 1}`,
            evidence: `${match[0].slice(0, 12)}… (redacted)`,
            exploit: 'Anyone who can read the repo (or its history) uses the credential directly against the provider.',
            impact: 'Account takeover, quota theft, or data access on the third-party service.',
            remediation: 'Revoke and rotate the credential, remove it from history, and load secrets from user input or environment instead.',
            layer: 'secrets',
          }),
        )
      }
    })
  }

  // History scan: a deleted secret is still a leaked secret.
  try {
    const { stdout } = await run('git', ['log', '-p', '--all', '--no-color', '-S', 'sk-'], {
      cwd: ROOT,
      shell: true,
      maxBuffer: 40 * 1024 * 1024,
    })
    for (const p of PATTERNS) {
      p.re.lastIndex = 0
      const hit = p.re.exec(stdout)
      if (hit && !isPlaceholder(hit[0])) {
        findings.push(
          makeFinding({
            id: `secret-history-${p.id}`,
            title: `${p.label} present in git history`,
            severity: 'Critical',
            severityRationale: 'History is distributed with every clone; deletion from HEAD does not revoke it.',
            confidence: 'Likely',
            owasp: 'A07:2021 Identification and Authentication Failures',
            cwe: 'CWE-540',
            location: 'git history',
            evidence: `${hit[0].slice(0, 12)}… (redacted)`,
            exploit: 'Clone the repo, walk history, recover the credential.',
            impact: 'Same as a live committed secret; rotation is mandatory.',
            remediation: 'Rotate the credential now, then purge history (git filter-repo) and force-push.',
            layer: 'secrets',
          }),
        )
      }
    }
  } catch (err) {
    limitations.push(`git history scan skipped (${err?.message || 'git unavailable'})`)
  }

  return {
    tool: 'built-in pattern scan',
    covered: `${files.length} in-scope text files, plus git history for key-like strings.`,
    limitations: [
      ...limitations,
      'Pattern-based: unknown credential formats and encrypted blobs are not detected.',
      'No entropy-only detection, so random-looking non-standard secrets may be missed.',
    ],
    findings,
  }
}
