import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const manifest=JSON.parse(readFileSync('model/artifacts.json'));
assert.equal(manifest.schema,'cs1618/artifacts/1');
for(const [path,expected] of Object.entries(manifest.files)){const data=readFileSync(path);assert.equal(data.length,expected.bytes,`${path} size drift`);assert.equal(createHash('sha256').update(data).digest('hex'),expected.sha256,`${path} changed; rebuild, verify, then deliberately record artifacts`);}
for(const path of ['public/wasm/cs_verdant.wasm','public/wasm/cs_round.wasm','public/wasm/cs_evolution.wasm']){const module=new WebAssembly.Module(readFileSync(path));assert.equal(WebAssembly.Module.imports(module).length,0,`${path} must be import-free`);}
const lock=JSON.parse(readFileSync('model/upstream-lock.json'));assert.equal(lock.length,6);for(const p of lock)assert.match(p.commit,/^[0-9a-f]{40}$/);
const source=readFileSync('server/match.ts','utf8');assert.ok(source.includes('roundKernel.decide('));assert.ok(!source.includes('round.generated'),'Runtime cannot use the unverified JS oracle');
console.log(`Verified ${Object.keys(manifest.files).length} source/artifact hashes, six upstream pins, import-free Wasm and mandatory Prism runtime.`);
