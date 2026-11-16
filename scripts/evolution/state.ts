import {readFileSync,writeFileSync,existsSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {generatedFiles,publicProjection,type EvolutionState} from './generate';
export const ownedPaths=['model/evolution/state.json','src/generated/render-policy.ts','shared/generated-navigation.ts','public/evolution.json','shared/generated-artwork.ts','shared/generated-tactics.ts'];
export const digest=(value:unknown)=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function contextDigest(){
 const paths:string[]=[];
 function walk(dir:string){for(const e of readdirSync(dir,{withFileTypes:true})){const p=dir+'/'+e.name;if(e.isDirectory())walk(p);else if(/\.(ts|mjs|json|css|html|yml)$/.test(p)&&!ownedPaths.includes(p))paths.push(p);}}
 for(const dir of ['src','shared','server','scripts','tests'])walk(dir);
 paths.push('model/evolution/policy.json','model/evolution/brief.json','package-lock.json','package.json','index.html','evolution-lab.html','evolution-studio.html','vite.config.ts','tsconfig.json','public/wasm/cs_verdant.wasm','public/wasm/cs_evolution.wasm');
 return digest(paths.sort().map(path=>[path,createHash('sha256').update(readFileSync(path)).digest('hex')]));
}
export function stateFiles(state:EvolutionState){
 return {...generatedFiles(state),'model/evolution/state.json':JSON.stringify(state,null,2)+'\n','public/evolution.json':publicProjection(state)};
}
export function writeState(state:EvolutionState){for(const [path,content]of Object.entries(stateFiles(state)))writeFileSync(path,content);}
export function outputHashes(){return Object.fromEntries(ownedPaths.map(path=>[path,createHash('sha256').update(readFileSync(path)).digest('hex')]));}
export function preserveOwned(){return new Map(ownedPaths.map(path=>[path,existsSync(path)?readFileSync(path):null]));}
