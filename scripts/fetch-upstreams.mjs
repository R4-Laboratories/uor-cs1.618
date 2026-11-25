import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

const root = resolve(process.env.UPSTREAM_DIR ?? '../upstream');
mkdirSync(root, { recursive: true });
const sources = {
 vRAM: ['device/proof/runtime/bundle/packages/rust-core/vram_representation', 'device/proof/runtime/project/src'],
 vTensor: ['generated/layout/packages/rust-core/vtensor_layout', 'app/src'],
 'verdant-studio': ['certified/packages/rust-std/verdant_studio', 'model/bindings'],
};

for (const pin of JSON.parse(readFileSync('model/upstream-lock.json'))) {
 const dir = resolve(root, pin.name);
 if (!existsSync(dir)) {
  execFileSync('git', ['clone', '--depth', '1', '--filter=blob:none', '--no-checkout', pin.repository, dir], { stdio: 'inherit' });
  const git = args => execFileSync('git', ['-C', dir, ...args], { stdio: 'inherit' });
  git(['fetch', '--depth', '1', 'origin', pin.commit]);
  if (sources[pin.name]) git(['sparse-checkout', 'set', ...sources[pin.name]]);
  git(['checkout', '--detach', pin.commit]);
 }
 const head = execFileSync('git', ['-C', dir, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
 if (head !== pin.commit) throw Error(`${dir} is not at the required revision; existing checkouts are never reset automatically`);
 console.log(pin.name, head);
}
