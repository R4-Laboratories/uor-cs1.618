import {readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
const hash=path=>createHash('sha256').update(readFileSync(path)).digest('hex');
const paths=['public/app.holo','public/prism/CS-Identity.holo','public/wasm/cs_identity.wasm','model/identity.prompt.json','prism/identity/app/lexlean.lock','model/hologram-policy.json','model/hologram-vendor.json','model/prism-frame.json','Cargo.toml','Cargo.lock','crates/cs-verdant/Cargo.toml','crates/cs-verdant/src/lib.rs','crates/cs-verdant/src/characters.rs','crates/cs-verdant/src/scene3d.rs','crates/cs-verdant/src/texture_store.rs','model/upstream-lock.json','model/verdant-3d.json','model/round.prompt.json','prism/app/lexlean.lock','public/wasm/cs_verdant.wasm','public/wasm/cs_round.wasm','public/prism/CS-Round.holo','model/evolution/admission.prompt.json','prism/evolution/app/lexlean.lock','public/wasm/cs_evolution.wasm','public/prism/CS-Evolution.holo'];
const frame = JSON.parse(readFileSync('model/prism-frame.json'));
paths.push('docs/licenses/prism-template-MIT.txt','docs/licenses/prism-template-NOTICE.txt',
 'public/hologram/manifest.json','scripts/prism-frame-assets.mjs',
 frame.path,frame.delivery.adapter,frame.delivery.projection,frame.delivery.license);
for(const dependency of frame.dependencies) {
 paths.push('public/'+dependency.path);
 if(!paths.includes(dependency.provenance)) paths.push(dependency.provenance);
}
for(const [upstream,kernel] of [['vRAM','vram_representation'],['vTensor','vtensor_layout']]) {
 for (const file of ['Cargo.toml','src/lib.rs','package.json','provenance.json','source.lex.tex']) paths.push(`vendor/${upstream}/${kernel}/${file}`);
}
function walk(dir){for(const name of readdirSync(dir,{withFileTypes:true})){const p=dir+'/'+name.name;if(name.isDirectory())walk(p);else if(p.endsWith('.lex.tex'))paths.push(p);}}
walk('prism/identity/app/src');walk('prism/app/src');walk('prism/evolution/app/src');
const record={schema:'cs1618/artifacts/1',engine:'verdant-core',engineRevision:JSON.parse(readFileSync('model/upstream-lock.json')).find(x=>x.name==='verdant-engine').commit,evolutionBuild:'071558e95f9aa89316402ff5c6d6708e9a6b9d3608a9851a917d65dd88773181',roundBuild:'3b66383a3d163668aae5e2d60725c77af763d6194aaf978f3869cfe621713620',files:Object.fromEntries(paths.sort().map(p=>[p,{sha256:hash(p),bytes:readFileSync(p).length}]))};
writeFileSync('model/artifacts.json',JSON.stringify(record,null,2)+'\n');console.log(`Recorded ${paths.length} source and artifact digests.`);
