import {readFileSync} from 'node:fs';
const verdicts=['CandidateAdmitted','RefusedNonZeroDefect','RefusedRatchetViolation','RefusedWeightOutOfBounds','RefusedNotParetoImproving'];
const fields=['candidateDefects','candidateScoreMilli','incumbentScoreMilli','candidateComplexity','incumbentComplexity','banditWeight','ratchetClean'];
// Deliberately small compiler for the two pinned LexLean semantic definitions.
// No source-text escape hatch, calls, file access, recursion, imports or evaluation.
export function compileR4(model:any){
 if(model.schema!=='cs1618/lexlean-r4-decision-import/1'||!Array.isArray(model.declarations)||model.declarations.length!==2)throw Error('Invalid R4 import');
 const names=model.declarations.map((d:any)=>d.name).sort().join(',');if(names!=='admitParetoSynthesisTick,updateBanditWeight')throw Error('Invalid R4 definitions');
 let nodes=0;
 function expr(n:any,scope:string[],depth=0):string{
  if(!n||++nodes>256||depth>32)throw Error('R4 AST budget exceeded');const sub=(v:any)=>expr(v,scope,depth+1);
  switch(n.kind){
   case 'nat':if(typeof n.value!=='string'||!/^\d{1,5}$/.test(n.value))throw Error('Invalid natural');return String(Number(n.value));
   case 'bool':if(typeof n.value!=='boolean')throw Error('Invalid boolean');return String(n.value);
   case 'var':if(!scope.includes(n.name))throw Error('Unbound variable');return n.name;
   case 'project':if(!fields.includes(n.field))throw Error('Unknown R4 field');return `(${sub(n.value)})[${JSON.stringify(n.field)}]`;
   case 'constructor':{const name=n.constructor?.name?.replace('ParetoSynthesisVerdict.','');if(!verdicts.includes(name)||n.arguments?.length!==0)throw Error('Unknown R4 verdict');return JSON.stringify(name);}
   case 'if':return `(${sub(n.condition)}?${sub(n.then_value)}:${sub(n.else_value)})`;
   case 'not':return `(!${sub(n.value)})`;
   case 'add':case 'and':case 'or':case 'blt':case 'ble':return `(${sub(n.left)}${({add:'+',and:'&&',or:'||',blt:'<',ble:'<='} as const)[n.kind as 'add']} ${sub(n.right)})`;
   case 'primitive':if(n.operation!=='subtract'||n.arguments?.length!==2)throw Error('Unsupported R4 primitive');return `Math.max(0,${sub(n.arguments[0])}-${sub(n.arguments[1])})`;
   default:throw Error('Unsupported R4 AST node');
  }
 }
 let source='// Generated from the two pinned LexLean-R4 semantic definitions. MIT / Apache-2.0.\n// See model/development/r4-decisions.json and vendor/lexlean-r4/.\n';
 source+='export interface ParetoCheck {candidateDefects:number;candidateScoreMilli:number;incumbentScoreMilli:number;candidateComplexity:number;incumbentComplexity:number;banditWeight:number;ratchetClean:boolean;}\n';
 source+='const nat=(v:number)=>{if(!Number.isSafeInteger(v)||v<0||v>Number.MAX_SAFE_INTEGER-2)throw Error("R4 natural outside safe JS interop domain");};\n';
 for(const d of model.declarations){
  if(d.kind!=='definition')throw Error('Not an R4 definition');
  if(d.name==='admitParetoSynthesisTick')source+=`export function admitParetoSynthesisTick(c:ParetoCheck){for(const key of ${JSON.stringify(fields.filter(k=>k!=='ratchetClean'))} as const)nat(c[key]);if(typeof c.ratchetClean!=='boolean')throw Error('Invalid R4 boolean');return ${expr(d.body,['c'])};}\n`;
  else source+=`export function updateBanditWeight(weight:number,improved:boolean){nat(weight);if(typeof improved!=='boolean')throw Error('Invalid R4 boolean');return ${expr(d.body,['weight','improved'])};}\n`;
 }
 return source;
}
export const r4Source=()=>compileR4(JSON.parse(readFileSync('model/development/r4-decisions.json','utf8')));
