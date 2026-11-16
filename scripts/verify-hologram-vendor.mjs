import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
const manifest = JSON.parse(await readFile(path.join(root, 'model/hologram-vendor.json'), 'utf8'));
const pins = { template: '5b712b9d7b123af6c4545534ffa7c8b1647e7110', stitch: '1607d53dfc5a34324f8102123d166d727cc66634', me: 'ee7a2d81c6b5d2146f7a4199bcbfe0aa2c8b6c85' };
const paths = new Set();
for (const entry of manifest.files) {
  const repo = entry.repository.split('/').at(-1);
  if (entry.commit !== pins[repo] || entry.path !== `vendor/${repo}/${entry.sourcePath}` || entry.path.includes('..') || paths.has(entry.path)) throw new Error(`Invalid custody entry: ${entry.path}`);
  paths.add(entry.path);
  const bytes = await readFile(path.join(root, entry.path));
  if (bytes.length !== entry.bytes || createHash('sha256').update(bytes).digest('hex') !== entry.sha256) throw new Error(`Vendor custody mismatch: ${entry.path}`);
}
async function inspect(dir) {
  for (const file of await readdir(path.join(root, dir), { withFileTypes: true })) {
    const name = `${dir}/${file.name}`;
    if (file.isDirectory()) await inspect(name);
    else if (!file.isFile() || !paths.has(name)) throw new Error(`Untracked vendor file: ${name}`);
  }
}
for (const repo of Object.keys(pins)) await inspect(`vendor/${repo}`);
for (const required of ['vendor/stitch/src/prism-id.js', 'vendor/stitch/src/layer1-uor/generated-model.js', 'vendor/me/frame/panels.mjs', 'vendor/me/LICENSE-MIT', 'vendor/template/frame/panels.mjs', 'vendor/template/identity/prism-id.mjs', 'vendor/template/LICENSE-MIT']) if (!paths.has(required)) throw new Error(`Missing vendor source: ${required}`);
console.log(`Hologram vendor custody verified: ${paths.size} unchanged pinned files`);
