#!/usr/bin/env node
// Portable security audit orchestrator.
//
// Runs layered analysis over the app described by audit.config.json and emits
// report.json + report.md. Designed to be copied into any project: delete
// audit.config.json and the first run re-detects the target's profile.
//
//   node security-audit/index.mjs            # static phase (default)
//   node security-audit/index.mjs --dynamic  # browser phase (needs Playwright)
//   node security-audit/index.mjs --all      # both
//
// This tool FINDS and ISOLATES. It never applies fixes.

import { loadOrDetectConfig } from './lib/config.mjs'
import { scanDependencies } from './lib/deps.mjs'
import { scanSecrets } from './lib/secrets.mjs'
import { scanStatic } from './lib/static.mjs'
import { loadManualFindings } from './lib/manual.mjs'
import { runDynamic } from './lib/dynamic.mjs'
import { writeReports } from './lib/report.mjs'

const args = new Set(process.argv.slice(2))
const wantDynamic = args.has('--dynamic') || args.has('--all')
const wantStatic = !args.has('--dynamic') || args.has('--all')

// Each layer reports what it covered AND what it could not, so "no findings"
// is never mistaken for "did not look".
const layers = []
const findings = []

async function runLayer(name, phase, fn) {
  const started = Date.now()
  try {
    const result = await fn()
    findings.push(...(result.findings || []))
    layers.push({
      name,
      phase,
      ran: true,
      tool: result.tool || 'built-in',
      covered: result.covered || '',
      limitations: result.limitations || [],
      findingCount: (result.findings || []).length,
      ms: Date.now() - started,
    })
    console.log(`  ✓ ${name}: ${(result.findings || []).length} finding(s) [${result.tool || 'built-in'}]`)
    for (const l of result.limitations || []) console.log(`      ! ${l}`)
  } catch (err) {
    layers.push({
      name,
      phase,
      ran: false,
      error: err instanceof Error ? err.message : String(err),
      limitations: [`Layer failed to run: ${err instanceof Error ? err.message : String(err)}`],
      findingCount: 0,
      ms: Date.now() - started,
    })
    console.log(`  ✗ ${name}: FAILED — ${err instanceof Error ? err.message : String(err)}`)
  }
}

const { config, detected } = await loadOrDetectConfig()
console.log(`\nSecurity audit — ${config.app.name}`)
if (detected) {
  console.log('  (no config found; wrote a detected audit.config.json — please review it)')
}

if (wantStatic) {
  console.log('\nStatic phase:')
  await runLayer('dependencies', 'static', () => scanDependencies(config))
  await runLayer('secrets', 'static', () => scanSecrets(config))
  await runLayer('code-patterns', 'static', () => scanStatic(config))
  await runLayer('manual-review', 'static', () => loadManualFindings(config))
}

if (wantDynamic) {
  console.log('\nDynamic phase:')
  await runLayer('browser-runtime', 'dynamic', () => runDynamic(config))
}

const summary = await writeReports({ config, layers, findings })
console.log(`\n${summary.total} finding(s): ${summary.bySeverity}`)
console.log(`Reports: security-audit/report.md, security-audit/report.json\n`)

// Non-zero exit on unresolved High/Critical makes this usable as a CI gate.
const blocking = findings.filter(
  (f) => (f.severity === 'Critical' || f.severity === 'High') && f.status !== 'accepted' && f.status !== 'fixed',
).length
process.exit(blocking > 0 ? 1 : 0)
