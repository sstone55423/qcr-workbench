// Scope-aware file walking shared by the scanning layers.

import { readdir, stat, readFile } from 'node:fs/promises'
import { join, relative, sep } from 'node:path'
import { ROOT } from './config.mjs'

const TEXT_EXT = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json', '.html', '.css',
  '.md', '.yml', '.yaml', '.env', '.txt', '.svg',
])

export async function walkScope(config) {
  const ignore = new Set((config.ignore || []).map((p) => p.split('/')[0]))
  const files = []

  async function walk(dir) {
    let entries
    try {
      entries = await readdir(dir, { withFileTypes: true })
    } catch {
      return
    }
    for (const entry of entries) {
      const full = join(dir, entry.name)
      const rel = relative(ROOT, full).split(sep).join('/')
      if (ignore.has(entry.name) || (config.ignore || []).some((p) => rel.startsWith(p))) continue
      if (entry.isDirectory()) {
        await walk(full)
      } else {
        const dot = entry.name.lastIndexOf('.')
        const ext = dot === -1 ? '' : entry.name.slice(dot)
        if (TEXT_EXT.has(ext)) files.push({ path: full, rel })
      }
    }
  }

  for (const scope of config.scope || ['src']) {
    const target = join(ROOT, scope)
    try {
      const s = await stat(target)
      if (s.isDirectory()) await walk(target)
      else files.push({ path: target, rel: scope })
    } catch {
      /* scope entry does not exist in this project */
    }
  }
  return files
}

export async function readLines(file) {
  const text = await readFile(file.path, 'utf8')
  return { text, lines: text.split(/\r?\n/) }
}
