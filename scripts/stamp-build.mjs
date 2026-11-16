import {execFileSync} from 'node:child_process';
import {writeFileSync,readFileSync} from 'node:fs';
let commit='local-archive';try{commit=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim();}catch{}
writeFileSync('public/build.json',JSON.stringify({schema:'cs1618/build/1',commit,version:JSON.parse(readFileSync('package.json')).version,generation:JSON.parse(readFileSync('model/evolution/state.json')).generation,engineRevision:JSON.parse(readFileSync('model/upstream-lock.json')).find(p=>p.name==='verdant-engine').commit},null,2)+'\n');

writeFileSync('public/engine.json',readFileSync('model/verdant-3d.json'));
