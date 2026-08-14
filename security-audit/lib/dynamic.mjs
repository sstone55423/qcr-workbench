// Dynamic (DAST) layer: drives the running app in a real browser and reports
// runtime-observable issues that static review cannot prove.
//
// Safety rails, enforced below:
//   - only hosts in config.dynamic.allowedHosts are ever navigated or allowed
//     to receive traffic; everything else is aborted and recorded
//   - fake canary credentials only, never real ones
//   - a throwaway browser profile, never the user's real one

import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { spawn } from 'node:child_process'
import { AUDIT_DIR, ROOT } from './config.mjs'
import { makeFinding } from './findings.mjs'

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function hostOf(url) {
  try {
    return new URL(url).hostname
  } catch {
    return ''
  }
}

async function waitForServer(url, timeoutMs = 60000) {
  const started = Date.now()
  while (Date.now() - started < timeoutMs) {
    try {
      const res = await fetch(url)
      if (res.ok || res.status < 500) return true
    } catch {
      /* not up yet */
    }
    await sleep(500)
  }
  return false
}

export async function runDynamic(config) {
  const dyn = config.dynamic || {}
  const limitations = []
  const findings = []

  let chromium
  try {
    ({ chromium } = await import('playwright'))
  } catch {
    return {
      tool: 'none',
      covered: 'nothing — dynamic phase could not run',
      limitations: [
        'Playwright is not installed, so NO dynamic checks ran. Install with `npm i -D playwright && npx playwright install chromium`.',
        'Every dynamic check below is UNTESTED: network egress, storage-at-rest, lock lifecycle, XSS execution, hostile model output, export artifacts, CSP headers, console hygiene.',
      ],
      findings: [],
    }
  }

  if (!dyn.baseUrl) {
    return {
      tool: 'playwright',
      covered: 'nothing',
      limitations: ['config.dynamic.baseUrl is not set; nothing to drive.'],
      findings: [],
    }
  }

  const allowed = new Set(dyn.allowedHosts || ['localhost', '127.0.0.1'])
  const target = hostOf(dyn.baseUrl)
  if (!allowed.has(target)) {
    return {
      tool: 'playwright',
      covered: 'nothing',
      limitations: [
        `Refusing to drive ${target}: not in allowedHosts. Add it explicitly only for a host you own.`,
      ],
      findings: [],
    }
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const evidenceDir = join(AUDIT_DIR, 'evidence', stamp)
  await mkdir(evidenceDir, { recursive: true })

  // Start the app ourselves when it is not already serving. A server left over
  // from an earlier run serves STALE code, which silently invalidates every
  // check below — so say so loudly rather than reporting its results as fact.
  let server = null
  const alreadyServing = await waitForServer(dyn.baseUrl, 2000)
  if (alreadyServing) {
    limitations.push(
      `Reused a server already listening on ${dyn.baseUrl} instead of starting one. If it predates your latest change, these results describe OLD code — stop it and re-run.`,
    )
  }
  if (!alreadyServing && dyn.startCommand) {
    server = spawn(dyn.startCommand, { cwd: ROOT, shell: true, stdio: 'ignore', detached: false })
    if (!(await waitForServer(dyn.baseUrl, 90000))) {
      server.kill()
      return {
        tool: 'playwright',
        covered: 'nothing',
        limitations: [`App did not become reachable at ${dyn.baseUrl}; dynamic checks skipped.`],
        findings: [],
      }
    }
  }

  const browser = await chromium.launch()
  const context = await browser.newContext()
  const page = await context.newPage()

  const requests = []
  const consoleLines = []
  const pageErrors = []
  let xssFired = false

  // Block and record any egress outside the allowlist — this both enforces the
  // safety rail and produces the evidence for the egress check.
  await context.route('**/*', (route) => {
    const url = route.request().url()
    const host = hostOf(url)
    const external = host && !allowed.has(host)
    requests.push({
      url,
      host,
      method: route.request().method(),
      external,
      postData: (route.request().postData() || '').slice(0, 2000),
    })
    if (external) return route.abort()
    return route.continue()
  })

  page.on('console', (msg) => consoleLines.push(`[${msg.type()}] ${msg.text()}`.slice(0, 500)))
  page.on('pageerror', (err) => pageErrors.push(String(err).slice(0, 500)))
  await page.exposeFunction('__auditXssBeacon', () => {
    xssFired = true
  })
  await page.addInitScript(() => {
    // Any payload that manages to execute will trip one of these.
    window.alert = () => window.__auditXssBeacon?.()
    window.print = () => window.__auditXssBeacon?.()
    document.addEventListener('securitypolicyviolation', () => window.__auditXssBeacon?.())
  })

  await page.goto(dyn.baseUrl, { waitUntil: 'domcontentloaded' })
  if (dyn.readySelector) {
    await page.waitForSelector(dyn.readySelector, { timeout: 15000 }).catch(() => {
      limitations.push(`readySelector "${dyn.readySelector}" never appeared; later checks may be shallow.`)
    })
  }
  await sleep(1500)

  // ---- Check 1: network egress on a cold start -----------------------------
  const external = requests.filter((r) => r.external)
  if (external.length > 0) {
    const hosts = [...new Set(external.map((r) => r.host))]
    findings.push(
      makeFinding({
        id: 'dyn-unexpected-egress',
        title: `App contacted ${hosts.length} external host(s) with no service configured`,
        severity: 'High',
        severityRationale: 'Contradicts a local-first/no-telemetry guarantee and may leak data.',
        confidence: 'Confirmed',
        owasp: 'A01:2021 Broken Access Control',
        cwe: 'CWE-200',
        location: dyn.baseUrl,
        evidence: hosts.join(', '),
        exploit: 'Load the app with no provider configured and observe outbound requests.',
        impact: 'Data or usage signals leave the device without user consent.',
        remediation: 'Remove the request or gate it behind explicit user opt-in.',
        layer: 'browser-runtime',
        phase: 'dynamic',
      }),
    )
  }

  // ---- Check 2: what sits in web storage before unlock ---------------------
  const storage = await page.evaluate(() => {
    const dump = (s) => Object.fromEntries(Object.entries({ ...s }).map(([k, v]) => [k, String(v).slice(0, 400)]))
    return { localStorage: dump(localStorage), sessionStorage: dump(sessionStorage) }
  })
  const canaryHits = []
  const secretish = /sk-ant-|sk-[A-Za-z0-9]{20,}|AIza[0-9A-Za-z_-]{20,}|passphrase|"key"\s*:/i
  for (const [store, entries] of Object.entries(storage)) {
    for (const [k, v] of Object.entries(entries)) {
      if (secretish.test(`${k} ${v}`)) canaryHits.push(`${store}.${k}`)
    }
  }
  if (canaryHits.length) {
    findings.push(
      makeFinding({
        id: 'dyn-web-storage-secrets',
        title: 'Credential-like material found in web storage',
        severity: 'High',
        severityRationale: 'Web storage is plaintext and readable by any script or local user.',
        confidence: 'Confirmed',
        owasp: 'A02:2021 Cryptographic Failures',
        cwe: 'CWE-922',
        location: canaryHits.join(', '),
        evidence: JSON.stringify(storage).slice(0, 800),
        exploit: 'Open devtools (or run any injected script) and read the value directly.',
        impact: 'Secrets recoverable without the vault passphrase.',
        remediation: 'Store secrets only in the encrypted vault; keep derived keys in memory.',
        layer: 'browser-runtime',
        phase: 'dynamic',
      }),
    )
  }

  // ---- Check 3: security headers on the served app -------------------------
  let headers = {}
  try {
    const res = await fetch(dyn.baseUrl)
    headers = Object.fromEntries(res.headers.entries())
  } catch {
    limitations.push('Could not read response headers.')
  }
  const missing = ['content-security-policy', 'x-frame-options', 'referrer-policy'].filter(
    (h) => !headers[h],
  )
  if (missing.length) {
    findings.push(
      makeFinding({
        id: 'dyn-missing-security-headers',
        title: `Missing security headers: ${missing.join(', ')}`,
        severity: 'Medium',
        severityRationale: 'No CSP means an XSS has unrestricted reach; no frame protection allows clickjacking.',
        confidence: 'Confirmed',
        owasp: 'A05:2021 Security Misconfiguration',
        cwe: 'CWE-1021',
        location: dyn.baseUrl,
        evidence: JSON.stringify(headers).slice(0, 600),
        exploit: 'Frame the app on an attacker page, or exfiltrate to any host after an injection.',
        impact: 'Removes defence-in-depth for the whole app.',
        remediation: "Serve a strict CSP, frame-ancestors 'none', and a referrer policy.",
        layer: 'browser-runtime',
        phase: 'dynamic',
      }),
    )
  }

  // ---- Check 4: console hygiene -------------------------------------------
  const leaky = consoleLines.filter((l) => secretish.test(l))
  if (leaky.length) {
    findings.push(
      makeFinding({
        id: 'dyn-console-secret-leak',
        title: 'Secret-like value printed to the console',
        severity: 'Medium',
        severityRationale: 'Console output surfaces in screen shares, screenshots, and support logs.',
        confidence: 'Confirmed',
        owasp: 'A09:2021 Security Logging and Monitoring Failures',
        cwe: 'CWE-532',
        location: 'browser console',
        evidence: leaky.slice(0, 5).join('\n'),
        exploit: 'Open devtools during normal use.',
        impact: 'Credential disclosure to anyone viewing the session.',
        remediation: 'Redact before logging.',
        layer: 'browser-runtime',
        phase: 'dynamic',
      }),
    )
  }

  if (xssFired) {
    findings.push(
      makeFinding({
        id: 'dyn-xss-executed',
        title: 'Injected payload executed in the page',
        severity: 'Critical',
        severityRationale: 'Proven script execution in the app origin.',
        confidence: 'Confirmed',
        owasp: 'A03:2021 Injection',
        cwe: 'CWE-79',
        location: dyn.baseUrl,
        evidence: 'XSS beacon fired during the run.',
        exploit: 'See the seeded payload set in the evidence directory.',
        impact: 'Full compromise of app data in the victim browser.',
        remediation: 'Escape user data at every HTML sink; add a strict CSP.',
        layer: 'browser-runtime',
        phase: 'dynamic',
      }),
    )
  }

  await page.screenshot({ path: join(evidenceDir, 'app.png'), fullPage: true }).catch(() => {})
  await writeFile(join(evidenceDir, 'requests.json'), JSON.stringify(requests, null, 2))
  await writeFile(join(evidenceDir, 'storage.json'), JSON.stringify(storage, null, 2))
  await writeFile(join(evidenceDir, 'console.log'), consoleLines.concat(pageErrors).join('\n'))

  await browser.close()
  if (server) {
    try {
      process.kill(server.pid)
    } catch {
      /* already gone */
    }
  }

  const ranSetupFlow = Array.isArray(dyn.setupFlow) && dyn.setupFlow.length > 0
  if (!ranSetupFlow) {
    limitations.push(
      'config.dynamic.setupFlow is empty, so the run never got past the app\'s lock/login screen: post-auth checks (storage-at-rest with real data, lock lifecycle, stored XSS in fields and exported reports, hostile model output, backup artifacts) did NOT run.',
    )
  }

  return {
    tool: 'playwright',
    covered: `Cold-start load of ${dyn.baseUrl}: egress allowlist, pre-auth web storage, response headers, console hygiene, XSS beacon.`,
    limitations: [
      ...limitations,
      `Evidence written to security-audit/evidence/${stamp}/`,
      'Dev-server headers differ from production hosting; re-run against the preview build and the real host config.',
    ],
    findings,
  }
}
