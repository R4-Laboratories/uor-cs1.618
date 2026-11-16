import {execFileSync} from 'node:child_process';
import {writeFileSync,readFileSync} from 'node:fs';
let commit='local-archive';try{commit=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim();}catch{}
writeFileSync('public/build.json',JSON.stringify({schema:'cs1618/build/1',commit,version:JSON.parse(readFileSync('package.json')).version,generation:JSON.parse(readFileSync('model/evolution/state.json')).generation},null,2)+'\n');
