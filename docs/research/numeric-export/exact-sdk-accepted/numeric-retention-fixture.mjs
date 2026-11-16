import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {minimatch} from 'minimatch';
const settings=JSON.parse(readFileSync('artifacts/numeric-retention-test-input.json'));
const rows=JSON.parse(readFileSync('artifacts/numeric-archive-index.json'));
function selected(path,config){
 const patterns=config.path.trim().split('\n').map(p=>p.trim());
 if(config['include-hidden-files']!=='true'&&path.split('/').some(p=>p.startsWith('.')))return false;
 const match=p=>minimatch(path,p.endsWith('/')?p+'**':p,{dot:true});
 return patterns.some(p=>!p.startsWith('!')&&match(p))&&!patterns.some(p=>p.startsWith('!')&&match(p.slice(1)));
}
const proof=[
 'evidence/primitive/uorust-numeric-export.fixture/project/.lexlean/production/build/result.json',
 'evidence/primitive/uorust-numeric-export.fixture/project/.lexlean/production/build/packages/rust-std/numeric_significand_probe/src/lib.rs',
 'evidence/primitive/uorust-numeric-export.fixture/project/.lexlean/production/build/.proof-receipt',
 'evidence/primitive/uorust-numeric-export.fixture/project/.lake/build/proof.olean',
 'evidence/primitive/uorust-numeric-export.fixture/probe.wasm',
 'evidence/primitive/uorust-numeric-export.fixture/native',
 'evidence/receipt.json','evidence/primitive.log'
];
const caches=[
 'evidence/primitive/prismpm-cargo-1001/registry/cache/pkg.crate',
 'evidence/primitive/prismpm-cargo-1001/git/checkouts/repo/.git/config',
 'evidence/primitive/prismpm-cargo-12345/.package-cache'
];
assert(!selected(proof[0],settings.before),'Original default must reproduce omitted hidden proof');
assert(selected(caches[0],settings.before),'Original pattern must reproduce retained cache');
for(const p of proof)assert(selected(p,settings.after),`Required proof/output omitted: ${p}`);
for(const p of caches)assert(!selected(p,settings.after),`Disposable cache retained: ${p}`);
let excludedCache=0,retainedOther=0;
for(const r of rows){
 const cache=r.name.startsWith('primitive/prismpm-cargo-1001/');
 assert.equal(selected('evidence/'+r.name,settings.after),!cache,r.name);
 if(cache)excludedCache++;else retainedOther++;
}
assert.equal(excludedCache,29954);assert.equal(retainedOther,19);
const result={scope:'YAML plus minimatch path-selection fixture; no SDK or remote upload executed',before:{hiddenProductionProofIncluded:false,disposableCargoCacheIncluded:true},after:{syntheticProofAndOutputPathsRetained:proof.length,syntheticCachePathsExcluded:caches.length,actualArchiveCacheFilesExcluded:excludedCache,actualArchiveNonCacheFilesRetained:retainedOther},passes:true};
writeFileSync('artifacts/numeric-retention-fixture-results.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
