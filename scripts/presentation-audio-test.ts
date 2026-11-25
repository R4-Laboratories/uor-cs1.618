import {chromium} from 'playwright';
import {createServer} from 'vite';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const server=await createServer({server:{port:0,host:'127.0.0.1'},plugins:[{name:'audio-fixture',configureServer(s){s.middlewares.use('/audio-fixture',(_req,res)=>{res.setHeader('Content-Type','text/html');res.end('<html><body>Audio measurement</body></html>');});}}]});await server.listen();
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
try{
 const page=await browser.newPage(),errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(server.resolvedUrls!.local[0]+'audio-fixture');
 const result=await page.evaluate<{rows:{type:string;ended:number;peak:number;left:number;right:number;tail:number;bins:number[]}[];high:number;stopped:number;muted:number;resumed:number;after:number;interaction:number[]}>(`(async()=>{
 const {playCue,audioBus,noiseBuffer,GameAudio}=await import('/src/audio.ts');const {createEngine}=await import('/shared/engine.ts');const engine=await createEngine(await (await fetch('/wasm/cs_verdant.wasm')).arrayBuffer());
 const rows=[];
 for(const type of ['reload-start','reload-complete','reload-cancel','interaction-start','interaction-cancel','plant-progress','defuse-progress','bomb-pickup','bomb-drop','plant','defuse','round','round-result','bomb-warning','bomb-critical','equip']){
 const ctx=new OfflineAudioContext(2,24000,24000),bus=audioBus(ctx,.45);let ended=0;playCue(ctx,bus,noiseBuffer(ctx),{id:1,type:type==='round-result'?'round':type,team:type==='round-result'?'attack':undefined},{pan:.8,gain:1,occluded:false},()=>ended++);const buffer=await ctx.startRendering(),l=buffer.getChannelData(0),r=buffer.getChannelData(1);let peak=0,left=0,right=0,tail=0;const bins=Array(10).fill(0);for(let i=0;i<r.length;i++){peak=Math.max(peak,Math.abs(r[i]));left+=l[i]*l[i];right+=r[i]*r[i];bins[Math.floor(i/2400)]+=r[i]*r[i];if(i>22000)tail+=r[i]*r[i];}rows.push({type,ended,peak,left,right,tail,bins});}
 const audio=new GameAudio(engine);await audio.start();const listener={x:0,y:0,z:0,yaw:0};
 const interaction=[],snapshot={phase:'live',round:1,self:{id:'p',alive:true,action:'PLANTING',progress:.1},bomb:{state:'carried',carrier:'p'}};
 audio.update(.01,snapshot,listener);interaction.push(audio.activeVoices);snapshot.self.progress=0;audio.update(.01,snapshot,listener);interaction.push(audio.activeVoices);snapshot.self.progress=.1;audio.update(.01,snapshot,listener);interaction.push(audio.activeVoices);snapshot.self.alive=false;audio.update(.01,snapshot,listener);interaction.push(audio.activeVoices);audio.stop();
 snapshot.self.alive=true;snapshot.self.action='DEFUSING';snapshot.bomb={state:'planted',remaining:20,defuser:'p'};audio.update(.01,snapshot,listener);interaction.push(audio.activeVoices);snapshot.bomb.defuser='other';audio.update(.01,snapshot,listener);interaction.push(audio.activeVoices);snapshot.bomb.defuser='p';audio.update(.01,snapshot,listener);interaction.push(audio.activeVoices);snapshot.bomb.terminal='defused';audio.update(.01,snapshot,listener);interaction.push(audio.activeVoices);audio.stop();
 for(let i=0;i<100;i++)audio.event({id:i,type:i%2?'round':'step'},listener,'p');const high=audio.activeVoices;audio.stop();const stopped=audio.activeVoices;audio.setVolume(0);audio.event({id:1,type:'plant'},listener,'p');const muted=audio.activeVoices;audio.setVolume(.25);audio.event({id:1,type:'bomb-warning',x:8,y:0,z:0},listener,'p');const resumed=audio.activeVoices;await new Promise(r=>setTimeout(r,200));const after=audio.activeVoices;await audio.ctx.close();return {rows,high,stopped,muted,resumed,after,interaction};})()`);
 const foley=await page.evaluate<Array<{key:string;peak:number;energy:number;end:number;late:number;treble:number}>>(`(async()=>{
  const {playCue,audioBus,noiseBuffer}=await import('/src/audio.ts'),{WEAPONS}=await import('/shared/config.ts');
  const cases=Object.keys(WEAPONS).map(weapon=>['shot/'+weapon,{type:'shot',weapon},{}]);
  for(const surface of ['asphalt','metal','wood','stone']){
    cases.push(['step/'+surface,{type:'step',surface},{}],['landing/'+surface,{type:'landing',surface},{}]);
  }
  cases.push(['hit/bare',{type:'hit'},{}],['hit/armor',{type:'hit',armorDamage:4},{}],
    ['hurt/bare',{type:'hurt'},{}],['hurt/armor',{type:'hurt',armorDamage:4},{}],
    ['step/alternate',{type:'step',surface:'asphalt',id:2},{}],
    ['shot/outdoor',{type:'shot',weapon:'kestrel'},{}],
    ['shot/arcade',{type:'shot',weapon:'kestrel'},{enclosure:1}],
    ['shot/distant',{type:'shot',weapon:'kestrel'},{remote:true,distance:38}],
    ['shot/blocked',{type:'shot',weapon:'kestrel'},{remote:true,distance:38,occluded:true}]);
  const rows=[];
  for(const [key,event,mix] of cases){
    const ctx=new OfflineAudioContext(2,16000,24000),bus=audioBus(ctx,.45);
    let ended=0;
    playCue(ctx,bus,noiseBuffer(ctx),{id:1,...event},{pan:0,gain:1,occluded:false,...mix},()=>ended++);
    const buffer=await ctx.startRendering(),data=buffer.getChannelData(0);
    let peak=0,energy=0,late=0,high=0,end=0;
    for(let i=1;i<data.length;i++){
      const v=data[i];
      peak=Math.max(peak,Math.abs(v));energy+=v*v;high+=(v-data[i-1])**2;
      if(i>.038*ctx.sampleRate)late+=v*v;
      if(Math.abs(v)>1e-7)end=i/ctx.sampleRate;
    }
    if(ended!==1)throw Error('Retirement failed for '+key);
    rows.push({key,peak,energy,end,late,treble:high/energy});
  }
  return rows;
 })()`);
 const metrics=new Map(foley.map(row=>[row.key,row]));
 for(const row of foley){assert(row.peak>.001&&row.peak<1,row.key);assert(row.end<.52,row.key);}
 assert.notEqual(metrics.get('hit/bare')!.energy,metrics.get('hit/armor')!.energy,'Armor absorption changes the shooter confirmation');
 assert.notEqual(metrics.get('hurt/bare')!.energy,metrics.get('hurt/armor')!.energy,'The damaged player hears a distinct armor impact');
 const surfaceEnergy=foley.filter(row=>row.key.startsWith('step/')).map(row=>row.energy.toFixed(6));
 assert.equal(new Set(surfaceEnergy).size,5,'Four materials and the second footfall produce different audio');
 const weaponEnergy=foley.filter(row=>row.key.startsWith('shot/')&& !['outdoor','arcade','distant','blocked'].includes(row.key.slice(5))).map(row=>row.energy.toFixed(6));
 assert.equal(new Set(weaponEnergy).size,weaponEnergy.length,'Each equipped weapon has its own audible report');
 assert(metrics.get('shot/arcade')!.late>metrics.get('shot/outdoor')!.late,'Nearby surfaces produce an audible late reflection');
 assert(metrics.get('shot/distant')!.treble<metrics.get('shot/outdoor')!.treble,'Distance rolls off high frequencies');
 assert(metrics.get('shot/blocked')!.energy<metrics.get('shot/distant')!.energy,'Occlusion reduces energy');
 for(const row of result.rows){assert(row.peak>0&&row.peak<1);assert(row.right>row.left*3);assert.equal(row.ended,1);assert.equal(row.tail,0);}
 assert.equal(new Set(result.rows.map((r:any)=>r.bins.map((v:number)=>v.toFixed(6)).join(','))).size,result.rows.length);
 assert.deepEqual(result.interaction,[1,0,1,0,1,0,1,0]);assert(result.high>0&&result.high<=32);assert.equal(result.stopped,0);assert.equal(result.muted,0);assert.equal(result.resumed,1);assert.equal(result.after,0);assert.deepEqual(errors,[]);
 await mkdir('artifacts/presentation',{recursive:true});await writeFile('artifacts/presentation/audio-results.json',JSON.stringify({result,foley,errors},null,2));console.log('Presentation audio passed for objective cues, weapon reports, surface footsteps and landings, distant and reflected mixes, silence and voice retirement.');
}finally{await browser.close();await server.close();}
