import {readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
const hash=path=>createHash('sha256').update(readFileSync(path)).digest('hex');
const paths=['Cargo.toml','Cargo.lock','crates/cs-verdant/Cargo.toml','crates/cs-verdant/src/lib.rs','model/round.prompt.json','prism/app/lexlean.lock','public/wasm/cs_verdant.wasm','public/wasm/cs_round.wasm','public/prism/CS-Round.holo','model/evolution/admission.prompt.json','prism/evolution/app/lexlean.lock','public/wasm/cs_evolution.wasm','public/prism/CS-Evolution.holo'];
function walk(dir){for(const name of readdirSync(dir,{withFileTypes:true})){const p=dir+'/'+name.name;if(name.isDirectory())walk(p);else if(p.endsWith('.lex.tex'))paths.push(p);}}
walk('prism/app/src');walk('prism/evolution/app/src');
const record={schema:'cs1618/artifacts/1',engine:'verdant-core',engineRevision:JSON.parse(readFileSync('model/upstream-lock.json')).find(x=>x.name==='verdant-engine').commit,evolutionBuild:'071558e95f9aa89316402ff5c6d6708e9a6b9d3608a9851a917d65dd88773181',roundBuild:'3b66383a3d163668aae5e2d60725c77af763d6194aaf978f3869cfe621713620',files:Object.fromEntries(paths.sort().map(p=>[p,{sha256:hash(p),bytes:readFileSync(p).length}]))};
writeFileSync('model/artifacts.json',JSON.stringify(record,null,2)+'\n');console.log(`Recorded ${paths.length} source and artifact digests.`);
