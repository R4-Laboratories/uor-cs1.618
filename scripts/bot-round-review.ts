/** Seeded headless practice using the same Match and Wasm as a browser host. */
import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {Match} from '../server/match';
import {zoneAt} from '../shared/map';
import {RULES} from '../shared/config';
import {createEngine,type VerdantEngine} from '../shared/engine';
import {createRoundKernel,type RoundKernel} from '../shared/round-kernel';

interface RoundReview {
 offset:number; round:number; firstContact:string[]; planted:boolean; outcome:string;
 samples:number; closeSamples:number; sightedSamples:number; advancingSighted:number;
}
export function replayBotRounds(engine:VerdantEngine,kernel:RoundKernel,offsets=[0,17,53]){
 const rounds:RoundReview[]=[];
 const dt=1/RULES.tickRate;
 for(const offset of offsets){
  const match=new Match('REVIEW',engine,kernel);
  for(let i=0;i<offset;i++)match.random();
  match.enableBots();
  for(let round=0;round<3;round++){
   while(match.phase!=='live')match.step(dt);
   let samples=0,closeSamples=0,sightedSamples=0,advancingSighted=0,planted=false;
   let eventId=match.events.at(-1)?.id??0;
   const firstContact=new Map<string,string>();
   const deadline=match.tick+(RULES.roundSeconds+RULES.bombSeconds+2)*RULES.tickRate;
   while(match.phase==='live'){
    if(match.tick>deadline)throw Error('Round exceeded both simulation clocks');
    match.step(dt);
    for(const e of match.events){
     if(e.id<=eventId)continue;
     eventId=e.id;
     if(e.type==='plant')planted=true;
     if(e.type==='shot'&&e.actor&&!firstContact.has(e.actor))firstContact.set(e.actor,zoneAt(e.x!,e.z!));
    }
    if(match.tick%30)continue;
    const alive=[...match.players.values()].filter(p=>p.alive);
    for(const p of alive){
     samples++;
     if(alive.some(q=>q!==p&&q.team===p.team&&Math.hypot(q.x-p.x,q.z-p.z)<1.8))closeSamples++;
     if(p.botTarget){
      sightedSamples++;
      if(Math.hypot(p.vx,p.vz)>1)advancingSighted++;
     }
    }
   }
   rounds.push({offset,round:match.round,firstContact:[...new Set(firstContact.values())].sort(),planted,outcome:match.reason,
    samples,closeSamples,sightedSamples,advancingSighted});
  }
 }
 const total=(name:'samples'|'closeSamples'|'sightedSamples'|'advancingSighted')=>rounds.reduce((sum,r)=>sum+r[name],0);
 return {rounds,nearTeammateFraction:total('closeSamples')/total('samples'),
  movingWithContactFraction:total('advancingSighted')/total('sightedSamples'),plantRounds:rounds.filter(r=>r.planted).length};
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const engine=await createEngine(await readFile('public/wasm/cs_verdant.wasm'));
 const kernel=await createRoundKernel(await readFile('public/wasm/cs_round.wasm'));
 console.log(JSON.stringify(replayBotRounds(engine,kernel),null,2));
}
