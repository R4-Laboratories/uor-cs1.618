import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {validateArt,validateTactics,synthesizeArt,synthesizeTactics,type ArtProgram,type TacticsProgram} from '../../shared/creative-program';
export interface CreativeProposal {art:ArtProgram;tactics:TacticsProgram;}
export async function requestModelProposal(token:string,brief:string,fetcher:typeof fetch=fetch):Promise<{status:string;reason?:string;proposal:CreativeProposal|null}>{
 try{
  const response=await fetcher('https://models.github.ai/inference/chat/completions',{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json','X-GitHub-Api-Version':'2022-11-28'},signal:AbortSignal.timeout(45000),body:JSON.stringify({model:'openai/gpt-4.1-mini',temperature:.7,max_tokens:3500,response_format:{type:'json_object'},messages:[{role:'system',content:'Author a JSON object {art,tactics} for a browser tactical FPS. Return only data conforming to the supplied example structure and constraints. Never include source code, URLs, extra keys or explanations.'},{role:'user',content:brief}]})});
  if(!response.ok)return {status:'unavailable',reason:`http-${response.status}`,proposal:null};
  const body=await response.text();if(body.length>100000)throw Error('response-limit');
  const content=JSON.parse(body).choices?.[0]?.message?.content;if(typeof content!=='string'||content.length>30000)throw Error('content-limit');
  const proposal=JSON.parse(content);if(Object.keys(proposal).sort().join(',')!=='art,tactics')throw Error('schema');validateArt(proposal.art);validateTactics(proposal.tactics);
  return {status:'authored',proposal};
 }catch{return {status:'unavailable',reason:'invalid-response-or-network',proposal:null};}
}
export async function authorProposals(){
 const state=JSON.parse(readFileSync('model/evolution/state.json','utf8'));const brief=readFileSync('model/evolution/brief.json','utf8');
 const token=process.env.GH_MODELS_TOKEN;
 const prompt=brief+'\nExample shape/schema (make a new program): '+JSON.stringify({art:synthesizeArt(state.seed),tactics:synthesizeTactics(state.seed)})+'\nConstraints: art version=1, seed uint32, hex RGB colors, at most48 shapes; kind line/ring/box, x/y/a/b between0and1, weight .002..04. Tactics version=1, max12rules, max64 expression nodes depth4. Expressions: {fact:name},{not:expression},{all:[expressions]},{any:[expressions]}. Facts: enemy,empty,lowAmmo,canPlant,canDefuse,urgent,carrier,attacker,planted,dropped. Actions: interact,reload,engage,advance,escort,guard. Fall back to advance.';
 const result=token?await requestModelProposal(token,prompt):{status:'unavailable',reason:'no-model-token',proposal:null};
 const report={...result,base:process.env.GITHUB_SHA??null,seed:state.seed,brief:JSON.parse(brief).version,created:new Date().toISOString()};
 mkdirSync('artifacts/evolution',{recursive:true});writeFileSync('artifacts/evolution/author.json',JSON.stringify(report,null,2)+'\n');console.log(`Creative author: ${result.status}${result.reason?' ('+result.reason+')':''}; validated synthesis remains available.`);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await authorProposals();
