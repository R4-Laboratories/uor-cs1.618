import {test} from 'node:test';
import assert from 'node:assert/strict';
import {continuationDecision,continueEvolution,type ChainObservation} from '../scripts/evolution/continue';
const head='a'.repeat(40),other='b'.repeat(40),repo='R4-Laboratories/uor-cs1.618';
const ready:ChainObservation={enabled:true,repo,head,checkout:head,live:head,hasCandidates:true,runs:[],trigger:{name:'Verify and publish cs1.618',status:'completed',conclusion:'success',head_sha:head,head_branch:'main',event:'workflow_dispatch',head_repository:{full_name:repo}}};
test('a verified publication with untried candidates starts the next tick',()=>assert.equal(continuationDecision(ready),'dispatch'));
test('continuation rejects failed, foreign, PR and superseded publications',()=>{
 for(const patch of [{conclusion:'failure'},{status:'in_progress'},{head_branch:'feature'},{head_sha:other},{event:'pull_request'},{name:'Unrelated workflow'},{head_repository:{full_name:'someone/fork'}}])assert.notEqual(continuationDecision({...ready,trigger:{...ready.trigger,...patch}}),'dispatch');
 assert.equal(continuationDecision({...ready,checkout:other}),'superseded');
});
test('pause, exhausted search and an existing tick cannot create a dispatch loop',()=>{
 assert.equal(continuationDecision({...ready,enabled:false}),'disabled');
 assert.equal(continuationDecision({...ready,hasCandidates:false}),'settled');
 for(const status of ['queued','in_progress','completed'])assert.equal(continuationDecision({...ready,runs:[{head_sha:head,status}]}),'already-run');
 assert.equal(continuationDecision({...ready,runs:[{head_sha:other,status:'completed'}]}),'dispatch');
});
test('continuation waits for the served commit and then dispatches exactly once',async()=>{
 let observed=0,dispatched=0,waits=0;
 const result=await continueEvolution(async()=>({...ready,live:++observed<3?other:head}),async o=>{assert.equal(o.head,head);dispatched++;},async()=>{waits++;},4);
 assert.equal(result.decision,'dispatched');assert.equal(dispatched,1);assert.equal(waits,2);
});
test('a failed deployment or exhausted frontier dispatches nothing',async()=>{
 let dispatched=0;
 for(const observation of [{...ready,hasCandidates:false},{...ready,trigger:{...ready.trigger,conclusion:'failure'}}])await continueEvolution(async()=>observation,async()=>{dispatched++;},async()=>{},3);
 assert.equal(dispatched,0);
});
test('CDN timeout and API failures fail visibly without queuing a tick',async()=>{
 let dispatched=0;
 await assert.rejects(continueEvolution(async()=>({...ready,live:other}),async()=>{dispatched++;},async()=>{},2),/publication/);
 await assert.rejects(continueEvolution(async()=>{throw Error('API unavailable');},async()=>{dispatched++;},async()=>{},2),/API unavailable/);
 await assert.rejects(continueEvolution(async()=>ready,async()=>{throw Error('dispatch denied');},async()=>{},2),/dispatch denied/);
 assert.equal(dispatched,0);
});
test('a Pages job can continue after both verified jobs finish while the workflow is still running',()=>{
 const publicationJobs=[{name:'build',status:'completed',conclusion:'success'},{name:'deploy',status:'completed',conclusion:'success'}];
 const observation={...ready,trigger:{...ready.trigger,status:'in_progress',conclusion:null},publicationJobs};
 assert.equal(continuationDecision(observation),'dispatch');
 for(const jobs of [[],publicationJobs.slice(0,1),[{...publicationJobs[0],conclusion:'failure'},publicationJobs[1]],[publicationJobs[0],{...publicationJobs[1],status:'in_progress'}],[publicationJobs[0],{...publicationJobs[1],name:'unrelated'}]])assert.equal(continuationDecision({...observation,publicationJobs:jobs}),'ignored');
 assert.equal(continuationDecision({...observation,trigger:{...observation.trigger,status:'completed',conclusion:'failure'}}),'ignored');
});
