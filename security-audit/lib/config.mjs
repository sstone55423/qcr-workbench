// Config load + first-run detection. Keeping the target profile in a config
// file is what makes this tool portable between projects.

import { readFile, writeFile, access } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
export const AUDIT_DIR = join(ROOT, 'security-audit')
const CONFIG_PATH = join(AUDIT_DIR, 'audit.config.json')

const exists = async (p) => {
  try {
    await access(p)
    return true
  } catch {
    return false
  }
}

async function readJSON(path) {
  try {
    return JSON.parse(await readFile(path, 'utf8'))
  } catch {
    return null
  }
}

// Best-effort profile of an unknown project, so a fresh copy of this tool has
// something to work with on its first run.
async function detectConfig() {
  const pkg = (await readJSON(join(ROOT, 'package.json'))) || {}
  const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) }
  const has = (name) => Object.prototype.hasOwnProperty.call(deps, name)

  const frameworks = []
  if (has('react')) frameworks.push('react')
  if (has('vue')) frameworks.push('vue')
  if (has('svelte')) frameworks.push('svelte')
  if (has('next')) frameworks.push('next')
  if (has('express') || has('fastify') || has('koa')) frameworks.push('node-server')

  const hasBackend = has('express') || has('fastify') || has('koa') || has('next')
  const aiSdks = ['@anthropic-ai/sdk', 'openai', '@google/generative-ai', '@mlc-ai/web-llm'].filter(has)

  return {
    app: {
      name: pkg.name || 'unknown-app',
      description: pkg.description || '',
      languages: ['typescript', 'javascript'],
      frameworks,
      buildTool: has('vite') ? 'vite' : has('webpack') ? 'webpack' : 'unknown',
      hasBackend,
      entryPoints: ['index.html', 'src/main.tsx', 'src/main.ts', 'src/index.tsx'],
      dataStores: [],
      authModel: 'unknown — review this',
      thirdPartyServices: aiSdks,
      trustBoundaries: [
        'User-entered free text rendered back into the UI',
        'Files imported/restored by the user',
        'Responses from third-party APIs',
      ],
    },
    scope: ['src', 'index.html', 'package.json', 'vite.config.ts'],
    ignore: ['node_modules', 'dist', 'build', 'coverage', '.git', 'security-audit/evidence'],
    dynamic: {
      enabled: false,
      startCommand: pkg.scripts?.dev ? 'npm run dev' : '',
      previewCommand: pkg.scripts?.preview ? 'npm run build && npm run preview' : '',
      baseUrl: 'http://localhost:5173',
      readySelector: 'body',
      allowedHosts: ['localhost', '127.0.0.1'],
      setupFlow: [],
      canaryPrefix: 'CANARY',
    },
  }
}

export async function loadOrDetectConfig() {
  if (await exists(CONFIG_PATH)) {
    const config = await readJSON(CONFIG_PATH)
    if (config) return { config, detected: false }
  }
  const config = await detectConfig()
  await writeFile(CONFIG_PATH, JSON.stringify(config, null, 2) + '\n')
  return { config, detected: true }
}
