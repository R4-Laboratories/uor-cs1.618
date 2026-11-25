import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const manifest=JSON.parse(readFileSync('model/artifacts.json'));
assert.equal(manifest.schema,'cs1618/artifacts/1');
for(const [path,expected] of Object.entries(manifest.files)){const data=readFileSync(path);assert.equal(data.length,expected.bytes,`${path} size drift`);assert.equal(createHash('sha256').update(data).digest('hex'),expected.sha256,`${path} changed; rebuild, verify, then deliberately record artifacts`);}
for(const path of ['public/wasm/cs_verdant.wasm','public/wasm/cs_round.wasm','public/wasm/cs_evolution.wasm','public/wasm/cs_identity.wasm']){const module=new WebAssembly.Module(readFileSync(path));assert.equal(WebAssembly.Module.imports(module).length,0,`${path} must be import-free`);}
const lock=JSON.parse(readFileSync('model/upstream-lock.json'));assert.deepEqual(lock.map(pin=>pin.name).sort(),['verdant-engine','verdant-resonance','lexlean','prismpm','prism-devrel','UORust','vRAM','vTensor','verdant-studio'].sort());for(const p of lock)assert.match(p.commit,/^[0-9a-f]{40}$/);
const watched=JSON.parse(readFileSync('model/development/sources.json')).sources;
for(const name of ['verdant-engine','vRAM','vTensor','verdant-studio']){
 const source=watched.find(entry=>entry.repository==='afflom/'+name);
 assert.equal(source?.commit,lock.find(pin=>pin.name===name).commit,'Development watch must compare '+name+' to the shipped revision');
}
const engineRevision=lock.find(p=>p.name==='verdant-engine').commit;assert.equal(manifest.engineRevision,engineRevision);assert.ok(readFileSync('crates/cs-verdant/Cargo.toml','utf8').includes('rev = "'+engineRevision+'"'));
assert.equal(JSON.parse(readFileSync('model/verdant-3d.json')).revision,engineRevision,'3D integration record must identify the engine actually pinned');
for(const [project,kernel] of [['vRAM','vram_representation'],['vTensor','vtensor_layout']]) {
 const root = `vendor/${project}/${kernel}`;
 const provenance = JSON.parse(readFileSync(`${root}/provenance.json`));
 for(const [file,digest] of Object.entries(provenance.files)) assert.equal(createHash('sha256').update(readFileSync(`${root}/${file}`)).digest('hex'), digest);
}
const source=readFileSync('server/match.ts','utf8');assert.ok(source.includes('roundKernel.decide('));assert.ok(!source.includes('round.generated'),'Runtime cannot use the unverified JS oracle');
console.log(`Verified ${Object.keys(manifest.files).length} source/artifact hashes, ${lock.length} upstream pins, import-free Wasm and mandatory Prism runtime.`);
