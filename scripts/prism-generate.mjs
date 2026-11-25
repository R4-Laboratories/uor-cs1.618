import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
const upstream=resolve(process.env.UPSTREAM_DIR??'../upstream');
execFileSync('node',[`${upstream}/prism-devrel/builder/cli.mjs`,'build','model/round.prompt.json','--out','prism','--last-modified','2026-11-16T00:00:00Z'],{stdio:'inherit'});
// This transparent decision-table projection is NOT the PrismPM production compiler.
// Production requires the compiled guest; this projection is only a parity-test oracle.
const p=JSON.parse(readFileSync('model/round.prompt.json','utf8')).app;
const condition=c=>`r.${c.field} ${c.op==='is'||c.op==='='?'===':c.op} ${JSON.stringify(c.value)}`;
const types=p.fields.map(f=>`${f.name}:${f.kind==='choice'?f.values.map(JSON.stringify).join('|'):'number'}`).join(';');
let ts=`// Generated from model/round.prompt.json by scripts/prism-generate.mjs.\nexport function roundDecision(r:{${types}}):'continue'|'attack'|'defend'{\n`;
for(const rule of p.rules)ts+=` if(${rule.when.map(condition).join('&&')})return ${JSON.stringify(rule.then)};\n`;
ts+=` return ${JSON.stringify(p.otherwise)};\n}\n`;
writeFileSync('shared/round.generated.ts',ts);
const repos=['verdant-engine','verdant-resonance','lexlean','prismpm','prism-devrel','UORust','vRAM','vTensor','verdant-studio'];
const pins=repos.map(name=>({name,repository:execFileSync('git',['-C',`${upstream}/${name}`,'remote','get-url','origin'],{encoding:'utf8'}).trim(),commit:execFileSync('git',['-C',`${upstream}/${name}`,'rev-parse','HEAD'],{encoding:'utf8'}).trim()}));
mkdirSync('docs',{recursive:true});writeFileSync('model/upstream-lock.json',JSON.stringify(pins,null,2)+'\n');
console.log('Generated round decision projection and upstream source pins. Formal proof status is reported separately.');
