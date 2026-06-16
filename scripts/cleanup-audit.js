import fs   from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname  = path.dirname(__filename)

const ROOT = path.resolve(__dirname, '..')
const report = { delete: [], confirm: [], keep: [] }

function exists(rel) {
  return fs.existsSync(path.join(ROOT, rel))
}

function read(rel) {
  try { return fs.readFileSync(path.join(ROOT, rel), 'utf8') } catch { return '' }
}

function listDir(rel) {
  try { return fs.readdirSync(path.join(ROOT, rel)) } catch { return [] }
}

// ── 1. Legacy root HTML ──────────────────────────────────────────────────────
if (exists('design-system.html')) {
  report.delete.push({
    file: 'design-system.html',
    reason: 'Superseded by preview/design-system.html'
  })
} else {
  report.keep.push('design-system.html — not found, nothing to do')
}

// ── 2. Context files ─────────────────────────────────────────────────────────
const rootFiles = listDir('.')
rootFiles.forEach(f => {
  if (f.startsWith('context_local-code_') || f.startsWith('context_')) {
    report.delete.push({ file: f, reason: 'Claude Code context dump — obsolete' })
  }
})
if (exists('context')) {
  listDir('context').forEach(f => {
    report.delete.push({ file: `context/${f}`, reason: 'Context directory — obsolete' })
  })
}

// ── 3. Backup / temp files ───────────────────────────────────────────────────
const tempPatterns = ['.bak', '.orig', '.tmp', '-copy', '-backup', '-old']
rootFiles.forEach(f => {
  if (tempPatterns.some(p => f.includes(p))) {
    report.delete.push({ file: f, reason: 'Backup or temp file' })
  }
})

// ── 4. colors_and_type.css references ────────────────────────────────────────
if (exists('colors_and_type.css')) {
  const dsIndex   = read('ds/index.css')
  const dsIndexJs = read('ds/index.js')
  const hasRef    = dsIndex.includes('colors_and_type') || dsIndexJs.includes('colors_and_type')

  let compRef = false
  listDir('ds/styles/components').forEach(f => {
    if (read(`ds/styles/components/${f}`).includes('colors_and_type')) compRef = true
  })
  listDir('ds/components').forEach(f => {
    if (read(`ds/components/${f}`).includes('colors_and_type')) compRef = true
  })

  if (hasRef || compRef) {
    report.confirm.push({
      file: 'colors_and_type.css',
      reason: 'Still referenced somewhere in ds/ — check before deleting'
    })
  } else {
    report.delete.push({
      file: 'colors_and_type.css',
      reason: 'No live references found in ds/ — superseded by tokens/'
    })
  }
}

// ── 5. Orphaned component JS (not in ds/index.js) ────────────────────────────
const indexJs = read('ds/index.js')
listDir('ds/components').forEach(f => {
  if (!f.endsWith('.js')) return
  if (!indexJs.includes(f)) {
    report.confirm.push({
      file: `ds/components/${f}`,
      reason: 'Not imported in ds/index.js — may be orphaned'
    })
  }
})

// ── 6. Orphaned component CSS (not in ds/index.css) ──────────────────────────
const indexCss = read('ds/index.css')
listDir('ds/styles/components').forEach(f => {
  if (!f.endsWith('.css')) return
  if (!indexCss.includes(f)) {
    report.confirm.push({
      file: `ds/styles/components/${f}`,
      reason: 'Not imported in ds/index.css — may be orphaned'
    })
  }
})

// ── 7. Stray HTML files at root ──────────────────────────────────────────────
rootFiles.forEach(f => {
  if (f.endsWith('.html') && f !== 'index.html') {
    report.delete.push({ file: f, reason: 'Stray HTML at root — not index.html' })
  }
})

// ── Print report ─────────────────────────────────────────────────────────────
console.log('\n=== FILES TO DELETE ===')
if (report.delete.length === 0) {
  console.log('  None found.')
} else {
  report.delete.forEach(({ file, reason }) => {
    console.log(`  ${file}\n    → ${reason}`)
  })
}

console.log('\n=== FILES TO CONFIRM BEFORE DELETING ===')
if (report.confirm.length === 0) {
  console.log('  None.')
} else {
  report.confirm.forEach(({ file, reason }) => {
    console.log(`  ${file}\n    → ${reason}`)
  })
}

console.log('\n=== DONE ===')
console.log('Review the lists above.')
console.log('Reply "confirmed" to proceed with deletions,')
console.log('or give specific instructions for CONFIRM items.')
