/** Finite, side-effect-free authoring languages. Never evaluate model-supplied source. */
export interface Shape {kind:'line'|'ring'|'box';x:number;y:number;a:number;b:number;weight:number;}
export interface ArtProgram {version:1;seed:number;background:string;ink:string;siteA:string;siteB:string;shapes:Shape[];}
export const factNames=['enemy','empty','lowAmmo','canPlant','canDefuse','urgent','carrier','attacker','planted','dropped'] as const;
export type BotFacts=Record<typeof factNames[number],boolean>;
export type Expr={fact:typeof factNames[number]}|{not:Expr}|{all:Expr[]}|{any:Expr[]};
export const actions=['interact','reload','engage','advance','escort','guard'] as const;
export type TacticAction=typeof actions[number];
export type TacticDecider=(facts:BotFacts)=>TacticAction|null;
export interface TacticsProgram {version:1;rules:{when:Expr;action:TacticAction}[];fallback:TacticAction;}
function object(v:any,keys:string[]){if(!v||typeof v!=='object'||Array.isArray(v)||Object.keys(v).some(k=>!keys.includes(k)))throw Error('Unknown creative program field');}
export function validateArt(v:any):asserts v is ArtProgram{
 object(v,['version','seed','background','ink','siteA','siteB','shapes']);
 if(v.version!==1||!Number.isInteger(v.seed)||v.seed<0||v.seed>0xffffffff)throw Error('Invalid art identity');
 for(const key of ['background','ink','siteA','siteB'])if(typeof v[key]!=='string'||!/^#[0-9a-fA-F]{6}$/.test(v[key]))throw Error('Only literal RGB colors are permitted');
 if(!Array.isArray(v.shapes)||v.shapes.length>48)throw Error('Art shape budget exceeded');
 for(const s of v.shapes){object(s,['kind','x','y','a','b','weight']);if(!['line','ring','box'].includes(s.kind)||!['x','y','a','b','weight'].every(k=>Number.isFinite(s[k])&&s[k]>=0&&s[k]<=1)||s.weight<.002||s.weight>.04)throw Error('Invalid bounded shape');}
}
export function validateTactics(v:any):asserts v is TacticsProgram{
 object(v,['version','rules','fallback']);if(v.version!==1||!Array.isArray(v.rules)||v.rules.length>12||!actions.includes(v.fallback))throw Error('Invalid tactics program');
 let count=0;function expression(e:any,depth:number){if(++count>64||depth>4)throw Error('Tactics expression budget exceeded');object(e,['fact','not','all','any']);if(Object.keys(e).length!==1)throw Error('Ambiguous expression');
  if('fact'in e){if(!factNames.includes(e.fact))throw Error('Unknown local fact');}
  else if('not'in e)expression(e.not,depth+1);
  else{const list=e.all??e.any;if(!Array.isArray(list)||!list.length||list.length>6)throw Error('Invalid logical operation');for(const item of list)expression(item,depth+1);}}
 for(const r of v.rules){object(r,['when','action']);if(!actions.includes(r.action))throw Error('Unknown action');expression(r.when,1);}
}
function expr(e:Expr,f:BotFacts):boolean{return 'fact'in e?f[e.fact]===true:'not'in e?!expr(e.not,f):'all'in e?e.all.every(x=>expr(x,f)):e.any.some(x=>expr(x,f));}
export function decideProgram(p:TacticsProgram,f:BotFacts):TacticAction|null{if(!p.rules.length)return null;for(const r of p.rules)if(expr(r.when,f))return r.action;return p.fallback;}
function sourceExpr(e:Expr):string{return 'fact'in e?`f.${e.fact}`:'not'in e?`!(${sourceExpr(e.not)})`:'all'in e?`(${e.all.map(sourceExpr).join(' && ')})`:`(${e.any.map(sourceExpr).join(' || ')})`;}
export function compileTactics(p:TacticsProgram){validateTactics(p);return `// Generated creative decision program. Edit the model, not this file.\nimport type {BotFacts,TacticAction} from './creative-program';\nexport const tacticsProgram = ${JSON.stringify(p)};\nexport function decideTactic(f:BotFacts):TacticAction|null {\n${p.rules.map(r=>` if(${sourceExpr(r.when)})return ${JSON.stringify(r.action)};`).join('\n')}\n return ${p.rules.length?JSON.stringify(p.fallback):'null'};\n}\n`;}
export function compileArt(p:ArtProgram){validateArt(p);return `// Generated original mural recipe. No external imagery or executable model text.\nimport type {ArtProgram} from './creative-program';\nexport const artProgram:ArtProgram = ${JSON.stringify(p)};\nexport function drawMotif(ctx:CanvasRenderingContext2D){\n${p.shapes.map(s=>` ctx.lineWidth=${s.weight};ctx.beginPath();${s.kind==='line'?`ctx.moveTo(${s.x},${s.y});ctx.lineTo(${s.a},${s.b});`:s.kind==='ring'?`ctx.arc(${s.x},${s.y},${s.a*.25},0,Math.PI*2);`:`ctx.rect(${s.x},${s.y},${s.a*.3},${s.b*.3});`}ctx.stroke();`).join('\n')}\n}\n`;}
export function seeded(seed:number){let n=seed>>>0;return()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};}
export function synthesizeArt(seed:number):ArtProgram{
 const random=seeded(seed),shapes:Shape[]=[];
 // Architectural relay traces and concentric signal rings: original vector artwork.
 for(let i=0;i<18;i++)shapes.push({kind:i%3===0?'ring':i%3===1?'line':'box',x:.53+random()*.40,y:.12+random()*.74,a:.1+random()*.8,b:.1+random()*.8,weight:.004+random()*.008});
 const palettes=[['#172e34','#f3edda','#efac69','#79d6da'],['#1d2a38','#f8f0dc','#f4b072','#82d6df'],['#20343a','#fff4da','#ffbd76','#8ce4e1']];const colors=palettes[Math.floor(random()*palettes.length)];
 return {version:1,seed:seed>>>0,background:colors[0],ink:colors[1],siteA:colors[2],siteB:colors[3],shapes};
}
export const baselineArt:ArtProgram={version:1,seed:0,background:'#afa58b',ink:'#d9cfb0',siteA:'#b1a58b',siteB:'#a5aaa0',shapes:[]};
export const baselineTactics:TacticsProgram={version:1,rules:[],fallback:'advance'};
export function synthesizeTactics(seed:number):TacticsProgram{
 const fact=(fact:typeof factNames[number]):Expr=>({fact});const quiet:Expr={not:fact('enemy')};
 const rules:TacticsProgram['rules']=[
  {when:{all:[fact('canDefuse'),fact('urgent')]},action:'interact'},
  {when:{all:[{any:[fact('canDefuse'),fact('canPlant')]},quiet]},action:'interact'},
  {when:fact('empty'),action:'reload'},
  {when:fact('enemy'),action:'engage'},
  {when:{all:[fact('lowAmmo'),quiet]},action:'reload'},
  {when:fact('planted'),action:'advance'},
  {when:{all:[fact('attacker'),fact('dropped')]},action:'advance'},
  {when:{all:[fact('attacker'),{not:fact('carrier')}]},action:'escort'},
  {when:{not:fact('attacker')},action:'guard'}];
 // Ordering independent rules explores new decision trees without changing facts or authority.
 if(seed%2)[rules[2],rules[3]]=[rules[3],rules[2]];
 return {version:1,rules,fallback:'advance'};
}
