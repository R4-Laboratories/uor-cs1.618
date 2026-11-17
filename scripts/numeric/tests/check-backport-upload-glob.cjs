// Use the pinned upload action's @actions/glob 0.5.0, installed outside the repo.
// ACTIONS_GLOB_MODULE=/tmp/.../node_modules/@actions/glob node <this file>
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'backport-glob-check-'))
const repository = path.resolve(__dirname, '../../..')
const options = {
  followSymbolicLinks: true, implicitDescendants: true,
  omitBrokenSymbolicLinks: true, excludeHiddenFiles: false
}

function uploadPaths(file) {
  const lines = fs.readFileSync(file, 'utf8').split('\n')
  const selected = []
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/^          path: (.+)$/)
    if (!match) continue
    if (match[1] === '|') {
      while (lines[i + 1]?.startsWith('            ')) selected.push(lines[++i].trim())
    } else if (/^(evidence|recovered)\//.test(match[1])) selected.push(match[1])
  }
  return selected
}

async function main() {
  const modulePath = process.env.ACTIONS_GLOB_MODULE
  assert(modulePath, 'Set ACTIONS_GLOB_MODULE to the pinned @actions/glob install')
  assert.equal(require(path.join(modulePath, 'package.json')).version, '0.5.0')
  const paths = [
    ...uploadPaths(path.join(repository, '.github/workflows/prismpm-backport-diagnostics.yml')),
    ...uploadPaths(path.join(repository, '.github/workflows/prismpm-backport-recovery.yml'))
  ]
  assert(paths.length > 25)
  for (const file of paths) {
    assert(!file.includes('projects/'))
    const fixture = path.join(root, file, file.endsWith('/') ? 'bounded.log' : '')
    fs.mkdirSync(path.dirname(fixture), {recursive: true})
    fs.writeFileSync(fixture, 'retained')
  }
  const privateRoot = path.join(root, 'evidence/projects')
  fs.mkdirSync(privateRoot, {mode: 0o700})
  fs.writeFileSync(path.join(privateRoot, 'private'), 'private')
  const readdir = fs.promises.readdir
  let privateReads = 0
  fs.promises.readdir = async function (target, ...args) {
    if (String(target) === privateRoot || String(target).startsWith(privateRoot + '/')) {
      privateReads++
      throw Object.assign(new Error('simulated host EACCES'), {code: 'EACCES'})
    }
    return readdir.call(this, target, ...args)
  }
  try {
    const glob = require(modulePath)
    const result = await (await glob.create(paths.map(p => path.join(root, p)).join('\n'), options)).glob()
    const files = result.filter(file => fs.statSync(file).isFile())
    assert.equal(files.length, paths.length)
    assert.equal(privateReads, 0)
    console.log(`PASS: ${paths.length} diagnostic/recovery upload selections; 0 private project reads`)
    await assert.rejects(async () => (await glob.create(path.join(root, 'evidence/'), options)).glob(),
                         {code: 'EACCES'})
    assert(privateReads > 0)
    console.log('PASS: old broad evidence/ selection fails EACCES negative control')
  } finally {
    fs.promises.readdir = readdir
  }
}

main().catch(error => { console.error(error); process.exitCode = 1 })
  .finally(() => fs.rmSync(root, {recursive: true, force: true}))
