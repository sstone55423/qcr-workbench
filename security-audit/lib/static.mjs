// Static code analysis. Prefers semgrep when installed; otherwise falls back
// to the built-in rule table below and says so, so reduced coverage is never
// reported as a clean result.

import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { ROOT } from './config.mjs'
import { walkScope, readLines } from './walk.mjs'
import { makeFinding } from './findings.mjs'

const run = promisify(execFile)

// A rule fires only when `re` matches AND any `context` predicate passes, which
// keeps benign uses (e.g. Math.random in a Monte Carlo simulation) out of the
// report.
const RULES = [
  {
    id: 'react-dangerous-html',
    re: /dangerouslySetInnerHTML/,
    title: 'React dangerouslySetInnerHTML bypasses automatic escaping',
    severity: 'High',
    owasp: 'A03:2021 Injection',
    cwe: 'CWE-79',
    exploit: 'User-controlled text reaching this sink executes as HTML/script in the viewer\'s browser.',
    remediation: 'Render as text, or sanitize with a vetted sanitizer before injecting.',
  },
  {
    id: 'dom-innerhtml',
    re: /\.(inner|outer)HTML\s*=|insertAdjacentHTML\s*\(|document\.write\s*\(/,
    title: 'Direct DOM HTML injection sink',
    severity: 'High',
    owasp: 'A03:2021 Injection',
    cwe: 'CWE-79',
    exploit: 'If any part of the assigned string derives from user input, it executes as markup.',
    remediation: 'Use textContent, or sanitize before assignment.',
  },
  {
    id: 'code-eval',
    re: /\beval\s*\(|new\s+Function\s*\(/,
    title: 'Dynamic code execution',
    severity: 'High',
    owasp: 'A03:2021 Injection',
    cwe: 'CWE-95',
    exploit: 'Attacker-influenced input reaching this call runs as JavaScript.',
    remediation: 'Replace with explicit parsing/dispatch; never evaluate data as code.',
  },
  {
    id: 'timer-string',
    re: /set(?:Timeout|Interval)\s*\(\s*['"`]/,
    title: 'Timer called with a string body (implicit eval)',
    severity: 'Medium',
    owasp: 'A03:2021 Injection',
    cwe: 'CWE-95',
    exploit: 'String timer bodies are evaluated as code.',
    remediation: 'Pass a function reference instead of a string.',
  },
  {
    id: 'weak-random',
    re: /Math\.random\s*\(/,
    // Only security-relevant when the surrounding code is about identity or
    // key material — statistical simulation is a legitimate use.
    context: (line, file) =>
      /key|token|salt|nonce|iv\b|secret|password|passphrase|session|auth|crypto|uuid|random_?id/i.test(line) ||
      /crypto|auth|session|token/i.test(file.rel),
    title: 'Math.random() used in a security-relevant context',
    severity: 'High',
    owasp: 'A02:2021 Cryptographic Failures',
    cwe: 'CWE-338',
    exploit: 'Math.random is predictable; an attacker can reproduce generated values.',
    remediation: 'Use crypto.getRandomValues() / crypto.randomUUID().',
  },
  {
    id: 'weak-cipher',
    re: /AES-ECB|AES-CBC|["']RC4["']|createCipher\s*\(|MD5|SHA-?1\b/i,
    title: 'Weak or unauthenticated cryptographic primitive',
    severity: 'High',
    owasp: 'A02:2021 Cryptographic Failures',
    cwe: 'CWE-327',
    exploit: 'Unauthenticated or broken primitives permit tampering or recovery of plaintext.',
    remediation: 'Use AES-GCM (authenticated) and SHA-256+ for hashing.',
  },
  {
    id: 'weak-kdf-iterations',
    re: /iterations\s*[:=]\s*(\d+)/,
    context: (line) => {
      const m = line.match(/iterations\s*[:=]\s*(\d+)/)
      return m ? Number(m[1]) < 100000 : false
    },
    title: 'Key-derivation iteration count below current guidance',
    severity: 'High',
    owasp: 'A02:2021 Cryptographic Failures',
    cwe: 'CWE-916',
    exploit: 'A stolen encrypted store can be brute-forced offline far faster than intended.',
    remediation: 'Use >=600,000 PBKDF2-SHA256 iterations (OWASP 2023) or move to Argon2id.',
  },
  {
    id: 'sensitive-web-storage',
    re: /(local|session)Storage\.setItem\s*\(\s*[`'"][^`'"]*(key|token|secret|pass|credential|auth)/i,
    title: 'Credential-like value written to web storage',
    severity: 'High',
    owasp: 'A02:2021 Cryptographic Failures',
    cwe: 'CWE-922',
    exploit: 'Any XSS, extension, or local user reads web storage in plaintext.',
    remediation: 'Keep secrets in encrypted storage or memory only.',
  },
  {
    id: 'console-secret',
    re: /console\.(log|warn|error|debug)\s*\([^)]*\b(key|token|secret|passphrase|password|credential)\b/i,
    title: 'Possible secret written to console',
    severity: 'Medium',
    owasp: 'A09:2021 Security Logging and Monitoring Failures',
    cwe: 'CWE-532',
    exploit: 'Secrets appear in devtools, screen shares, and crash reports.',
    remediation: 'Redact before logging, or drop the log line.',
  },
  {
    id: 'insecure-transport',
    re: /["']http:\/\/(?!localhost|127\.0\.0\.1|\{)/,
    title: 'Plaintext HTTP endpoint',
    severity: 'Medium',
    owasp: 'A02:2021 Cryptographic Failures',
    cwe: 'CWE-319',
    exploit: 'Traffic (including credentials) is readable and modifiable on the network path.',
    remediation: 'Use HTTPS.',
  },
  {
    id: 'tls-verification-disabled',
    re: /rejectUnauthorized\s*:\s*false|NODE_TLS_REJECT_UNAUTHORIZED\s*=\s*['"]?0/,
    title: 'TLS certificate verification disabled',
    severity: 'Critical',
    owasp: 'A02:2021 Cryptographic Failures',
    cwe: 'CWE-295',
    exploit: 'Any machine-in-the-middle can present a forged certificate and read/alter traffic.',
    remediation: 'Never disable certificate verification; fix the trust store instead.',
  },
  {
    id: 'postmessage-no-origin',
    re: /addEventListener\s*\(\s*['"]message['"]/,
    title: 'postMessage listener — verify it checks event.origin',
    severity: 'Medium',
    owasp: 'A01:2021 Broken Access Control',
    cwe: 'CWE-346',
    exploit: 'A hostile frame posts messages the handler trusts.',
    remediation: 'Validate event.origin against an allowlist before acting.',
  },
  {
    id: 'target-blank-noopener',
    re: /target\s*=\s*["']_blank["']/,
    // JSX splits attributes across lines, so rel= is usually on a neighbouring
    // line rather than the same one — check a small window instead.
    context: (line, file, lines, i) =>
      !lines.slice(Math.max(0, i - 4), i + 5).some((l) => /\brel\s*=/.test(l)),
    title: 'target="_blank" without rel="noopener"',
    severity: 'Low',
    owasp: 'A05:2021 Security Misconfiguration',
    cwe: 'CWE-1022',
    exploit: 'The opened page can navigate the opener via window.opener (reverse tabnabbing).',
    remediation: 'Add rel="noopener noreferrer".',
  },
  {
    id: 'browser-sdk-key-exposure',
    re: /dangerouslyAllowBrowser\s*:\s*true/,
    title: 'Provider SDK explicitly permitted to run in the browser with a user key',
    severity: 'Info',
    owasp: 'A05:2021 Security Misconfiguration',
    cwe: 'CWE-522',
    exploit: 'Intentional in a bring-your-own-key local-first app; becomes critical if a shared/server key is ever used here.',
    remediation: 'Keep this path user-key-only and document it; never ship an app-owned key through it.',
  },
]

// Return each line with // and /* */ comments removed, so pattern rules match
// real code and not a keyword mentioned in a comment. Quote-aware: string
// contents (including URLs and comment markers inside literals) are preserved,
// so rules that legitimately match inside strings still fire. Block-comment
// state carries across lines.
function stripComments(lines) {
  const out = []
  let inBlock = false
  for (const raw of lines) {
    let res = ''
    let quote = null
    for (let i = 0; i < raw.length; i++) {
      const c = raw[i]
      const n = raw[i + 1]
      if (inBlock) {
        if (c === '*' && n === '/') { inBlock = false; i++ }
        continue
      }
      if (quote) {
        res += c
        if (c === '\\') { res += n ?? ''; i++ } else if (c === quote) quote = null
        continue
      }
      if (c === '"' || c === "'" || c === '`') { quote = c; res += c; continue }
      if (c === '/' && n === '/') break // line comment: drop the rest
      if (c === '/' && n === '*') { inBlock = true; i++; continue }
      res += c
    }
    out.push(res)
  }
  return out
}

async function trySemgrep(config) {
  try {
    await run('semgrep', ['--version'], { shell: true })
  } catch {
    return null
  }
  const { stdout } = await run(
    'semgrep',
    ['--config', 'auto', '--json', '--quiet', ...(config.scope || ['src'])],
    { cwd: ROOT, shell: true, maxBuffer: 40 * 1024 * 1024 },
  )
  const parsed = JSON.parse(stdout)
  return (parsed.results || []).map((r) =>
    makeFinding({
      id: `semgrep-${r.check_id.split('.').pop()}-${r.path.replace(/[^a-z0-9]+/gi, '-')}-${r.start.line}`.toLowerCase(),
      title: r.extra?.message?.split('\n')[0] || r.check_id,
      severity: r.extra?.severity === 'ERROR' ? 'High' : r.extra?.severity === 'WARNING' ? 'Medium' : 'Low',
      severityRationale: `semgrep severity ${r.extra?.severity}`,
      confidence: 'Likely',
      owasp: (r.extra?.metadata?.owasp || []).join(', '),
      cwe: (r.extra?.metadata?.cwe || []).join(', '),
      location: `${r.path}:${r.start.line}`,
      evidence: (r.extra?.lines || '').trim().slice(0, 300),
      exploit: r.extra?.metadata?.impact || 'See rule documentation.',
      remediation: r.extra?.fix || r.extra?.metadata?.references?.[0] || 'See rule documentation.',
      layer: 'code-patterns',
    }),
  )
}

export async function scanStatic(config) {
  const findings = []
  const limitations = []
  let tool = 'built-in rules'

  const semgrepFindings = await trySemgrep(config).catch(() => null)
  if (semgrepFindings) {
    tool = 'semgrep + built-in rules'
    findings.push(...semgrepFindings)
  } else {
    limitations.push(
      'semgrep not installed — ran built-in rules only; install semgrep for broader taint-aware coverage.',
    )
  }

  const files = await walkScope(config)
  // A CSP may be injected by the build rather than written into index.html, so
  // look across the scope before concluding there is none.
  let cspDefinedAnywhere = false
  let indexHtmlSeen = false

  for (const file of files) {
    if (file.rel.startsWith('security-audit/')) continue
    const { lines, text } = await readLines(file)
    if (/Content-Security-Policy/i.test(text)) cspDefinedAnywhere = true
    if (file.rel === 'index.html') indexHtmlSeen = true

    // Match against comment-stripped code so a keyword inside a // or /* */
    // comment does not fire a rule; evidence and context still use the original.
    const codeLines = /\.(js|jsx|ts|tsx|mjs|cjs)$/.test(file.rel) ? stripComments(lines) : lines
    lines.forEach((line, i) => {
      const codeLine = codeLines[i]
      for (const rule of RULES) {
        if (!rule.re.test(codeLine)) continue
        if (rule.context && !rule.context(line, file, lines, i)) continue
        findings.push(
          makeFinding({
            id: `${rule.id}-${file.rel.replace(/[^a-z0-9]+/gi, '-')}-${i + 1}`.toLowerCase(),
            title: rule.title,
            severity: rule.severity,
            severityRationale: 'Pattern match; confirm reachability from untrusted input.',
            confidence: 'Speculative',
            owasp: rule.owasp,
            cwe: rule.cwe,
            location: `${file.rel}:${i + 1}`,
            evidence: line.trim().slice(0, 300),
            exploit: rule.exploit,
            impact: rule.exploit,
            remediation: rule.remediation,
            layer: 'code-patterns',
          }),
        )
      }
    })

  }

  if (indexHtmlSeen && !cspDefinedAnywhere) {
    findings.push(
      makeFinding({
        id: 'missing-csp',
        title: 'No Content-Security-Policy defined',
        severity: 'Medium',
        severityRationale: 'CSP is the main mitigation that limits impact when an XSS slips through.',
        confidence: 'Confirmed',
        owasp: 'A05:2021 Security Misconfiguration',
        cwe: 'CWE-1021',
        location: 'index.html',
        evidence: 'No CSP meta tag or build-time CSP injection found anywhere in scope.',
        exploit: 'An injected script faces no origin restrictions and can exfiltrate data to any host.',
        impact: 'Removes defence-in-depth against XSS and clickjacking.',
        remediation:
          "Add a strict CSP (default-src 'self'; script-src without 'unsafe-inline'; frame-ancestors 'none') via a meta tag, a build-time injection, or host headers.",
        layer: 'code-patterns',
      }),
    )
  }

  return {
    tool,
    covered: `${files.length} in-scope files against ${RULES.length} built-in rules${semgrepFindings ? ' plus semgrep auto config' : ''}.`,
    limitations: [
      ...limitations,
      'Pattern matching is not taint analysis: it flags sinks, not proven data flow from untrusted sources.',
      'Findings are marked Speculative until confirmed by manual review or the dynamic phase.',
    ],
    findings,
  }
}
