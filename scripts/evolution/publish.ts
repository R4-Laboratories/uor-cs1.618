import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {ownedPaths,outputHashes} from './state';
export function validatePublication(report:any,base:string,remote:string,changed:string[],hashes:Record<string,string>){
 if(report.schema!=='cs1618/evolution-tick/1'||report.apply!==true||report.changed!==true||report.checks!==true||!['admitted','no-improvement'].includes(report.outcome))throw Error('No validated publication');
 if(report.base!==base||base!==remote)throw Error('Main changed after evaluation; refuse untested rebase');
 if(!changed.length||changed.some(p=>!ownedPaths.includes(p)))throw Error('Mutation exceeded evolution-owned files');
 if(!report.outputs||Object.keys(report.outputs).sort().join('|')!==[...ownedPaths].sort().join('|'))throw Error('Incomplete output custody');
 for(const path of ownedPaths)if(!/^[a-f0-9]{64}$/.test(report.outputs[path])||report.outputs[path]!==hashes[path])throw Error(`Tested output changed: ${path}`);
 const age=Date.now()-Date.parse(report.completed);if(!Number.isFinite(age)||age<0||age>60*60*1000)throw Error('Publication evidence expired');
}
export function publish(){
 if(process.env.GITHUB_ACTIONS!=='true'||process.env.GITHUB_REF!=='refs/heads/main')throw Error('Publication runs only in the main-branch GitHub workflow');
 const report=JSON.parse(readFileSync('artifacts/evolution/tick.json','utf8'));if(!report.changed){console.log(`No commit: ${report.outcome}`);return;}
 const git=(...args:string[])=>execFileSync('git',args,{encoding:'utf8'}).trim();
 execFileSync('gh',['auth','setup-git'],{stdio:'inherit'});git('fetch','origin','main');
 const base=git('rev-parse','HEAD'),remote=git('rev-parse','origin/main');
 const changes=execFileSync('git',['status','--porcelain','-z','--untracked-files=all'],{encoding:'utf8'}).split('\0').filter(Boolean).map(line=>line.slice(3));
 validatePublication(report,base,remote,changes,outputHashes());
 git('config','user.name','github-actions[bot]');git('config','user.email','41898282+github-actions[bot]@users.noreply.github.com');
 git('add','--',...ownedPaths);git('commit','-m',report.accepted?`Evolution: admit generation ${report.generation}`:'Evolution: record candidates without improvement');
 // A concurrent update is refused by ordinary fast-forward push. Never force/rebase.
 git('push','origin','HEAD:refs/heads/main');
 execFileSync('gh',['workflow','run','pages.yml','--ref','main'],{stdio:'inherit'});
 console.log(`Published ${git('rev-parse','HEAD')} and explicitly dispatched Pages.`);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)publish();
