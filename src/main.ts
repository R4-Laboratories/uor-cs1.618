import '@fontsource/barlow/400.css';
import '@fontsource/barlow/500.css';
import '@fontsource/barlow/600.css';
import '@fontsource/barlow-condensed/500.css';
import '@fontsource/barlow-condensed/600.css';
import '@fontsource/barlow-condensed/700.css';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import './style.css';
import {WorldView} from './world';
import {UI,$} from './ui';
import {createEngine} from '../shared/engine';
import {GameAudio} from './audio';
import {neutralInput,type Input,type Motion,type Snapshot,type PublicPlayer} from '../shared/protocol';
import {movePlayer} from '../shared/movement';
import {WEAPONS,type Team} from '../shared/config';
const ui=new UI(),canvas=$<HTMLCanvasElement>('world');
let view:WorldView;
try{view=new WorldView(canvas);}catch(error){$('load-detail').textContent='WebGL2 is unavailable. Enable hardware acceleration and reload.';throw error;}
let bytes:ArrayBuffer;
try{const response=await fetch(`${import.meta.env.BASE_URL}wasm/cs_verdant.wasm`);if(!response.ok)throw Error('Engine download failed');bytes=await response.arrayBuffer();}catch(error){$('load-detail').textContent='Could not load the game engine. Check the connection and reload.';throw error;}
const roundResponse=await fetch(`${import.meta.env.BASE_URL}wasm/cs_round.wasm`);if(!roundResponse.ok){$('load-detail').textContent='Could not load the Prism round kernel. Reload to try again.';throw Error('Missing Prism kernel');}const roundBytes=await roundResponse.arrayBuffer();
const engine=await createEngine(bytes);const audio=new GameAudio(engine);
let snapshot:Snapshot|null=null,position:Motion|null=null,worker:Worker|null=null,socket:WebSocket|null=null,connecting=false;
let team:Team|'auto'='auto',yaw=0,pitch=0,seq=0,slot:0|1=1,fire=false,scope=false,locked=false,sensitivity=1,spectatorIndex=0;
let ping=0,lastEvent=0,lastSnapshot=0,lastFrame=performance.now(),accumulator=0,uiTime=0,pingTime=0,beepTime=0;
let pending:{input:Input;canMove:boolean}[]=[];const keys=new Set<string>();
const saved=(key:string,fallback:string)=>{try{return localStorage.getItem(key)??fallback;}catch{return fallback;}};
const save=(key:string,value:string)=>{try{localStorage.setItem(key,value);}catch{}};
$<HTMLInputElement>('name').value=saved('cs-name','Operator');
const query=new URLSearchParams(location.search);
$<HTMLInputElement>('room').value=query.get('room')??saved('cs-room','MERIDIAN');
const defaultServer=location.hostname.endsWith('github.io')?'':`${location.protocol==='https:'?'wss':'ws'}://${location.host}/socket`;
$<HTMLInputElement>('server').value=query.get('server')??saved('cs-server',defaultServer);
ui.show('loading',false);ui.show('lobby',true);
function send(message:unknown){if(worker)worker.postMessage(message);else if(socket?.readyState===WebSocket.OPEN)socket.send(JSON.stringify(message));}
function spectator():PublicPlayer|null{if(!snapshot||snapshot.self.alive)return null;const list=snapshot.players.filter(p=>p.team===snapshot!.self.team&&p.alive);return list[spectatorIndex%Math.max(1,list.length)]??null;}
function setPaused(open:boolean){ui.pauseOpen=open;ui.show('pause',open);keys.clear();fire=false;scope=false;}
async function capture(){await audio.start();try{await canvas.requestPointerLock();}catch{ui.toast('Click the game again to capture your mouse.');}ui.show('deploy-overlay',false);setPaused(false);}
function receive(m:any){
 if(m.type==='welcome'){connecting=false;seq=0;lastEvent=0;pending=[];ui.show('lobby',false);ui.show('hud',true);ui.show('deploy-overlay',true);$('deploy-description').textContent=`You joined ${m.team==='attack'?'Ember — attackers':'Tidal — defenders'}. Click to deploy.`;ui.status('');return;}
 if(m.type==='snapshot'){
  const s=m as Snapshot,previous=snapshot;
  if(!previous||s.round!==previous.round||!previous.self.alive&&s.self.alive){yaw=s.self.yaw;pitch=s.self.pitch;slot=s.self.slot;pending=[];keys.clear();}
  snapshot=s;lastSnapshot=performance.now();
  pending=pending.filter(p=>p.input.seq>s.self.seq);
  position={x:s.self.x,y:s.self.y,z:s.self.z,vx:s.self.vx,vy:s.self.vy,vz:s.self.vz,grounded:s.self.grounded,crouch:s.self.crouch};
  let prevJump=false;for(const p of pending){movePlayer(position,{...p.input,jump:p.input.jump&&!prevJump},1/60,engine,p.canMove);prevJump=p.input.jump;}
  for(const e of s.events)if(e.id>lastEvent){lastEvent=e.id;if(e.at!==undefined&&s.time-e.at>0.5)continue;view.event(e,s.self.id);ui.event(e,s);if(e.type!=='hit'||e.actor===s.self.id)audio.event(e,{...position,yaw},s.self.id);}
  if(!s.self.alive&&ui.buyOpen)ui.setBuy(false,s);
  return;
 }
 if(m.type==='pong'){ping=performance.now()-m.at;return;}
 if(m.type==='buy-result'){
  const messages:Record<string,string>={funds:'Not enough credits.',team:'This item is issued to the other team.',phase:'The buy window is closed.',zone:'Return to your spawn to buy.',dead:'You can buy when you respawn.',owned:'You already have this item.',unknown:'Unknown equipment.'};
  $('buy-message').textContent=m.error?messages[m.error]??'Purchase refused.':'Equipment issued.';
  if(!m.error){if(WEAPONS[m.item])slot=0;setTimeout(()=>{if(snapshot){ui.renderBuy(snapshot);}},100);}
  return;
 }
 if(m.type==='error'){if(m.code==='input')return;ui.status(m.message);ui.toast(m.message);if(connecting){connecting=false;$<HTMLButtonElement>('join').disabled=false;$<HTMLButtonElement>('practice').disabled=false;}return;}
}
function disconnect(){worker?.terminate();worker=null;if(socket){socket.onclose=null;socket.close();socket=null;}snapshot=null;position=null;pending=[];connecting=false;keys.clear();fire=false;scope=false;ui.setBuy(false,null);ui.scoreOpen=false;ui.show('scoreboard',false);setPaused(false);ui.show('deploy-overlay',false);ui.show('hud',false);ui.show('lobby',true);document.exitPointerLock();$<HTMLButtonElement>('join').disabled=false;$<HTMLButtonElement>('practice').disabled=false;}
async function join(local:boolean){
 if(connecting)return;const name=$<HTMLInputElement>('name').value.trim()||'Operator',room=$<HTMLInputElement>('room').value.trim().toUpperCase();
 if(!local&&!/^[A-Z0-9-]{1,20}$/.test(room)){ui.status('Use a room code of 1–20 letters, digits or hyphens.');return;}
 let address=$<HTMLInputElement>('server').value.trim();
 if(!local){try{if(!address)throw Error();if(/^https?:/.test(address))address=address.replace(/^http/,'ws');const url=new URL(address);if(!['ws:','wss:'].includes(url.protocol))throw Error();if(url.pathname==='/')url.pathname='/socket';address=url.href;if(location.protocol==='https:'&&url.protocol!=='wss:'){ui.status('This HTTPS page needs a secure wss:// game server.');return;}}catch{ui.status('Enter a game server address in Connection settings, or choose Practice.');$<HTMLDetailsElement>('connection-settings').open=true;return;}}
 connecting=true;ui.status(local?'Preparing your local operation…':'Connecting to the game server…');$<HTMLButtonElement>('join').disabled=true;$<HTMLButtonElement>('practice').disabled=true;
 save('cs-name',name);save('cs-room',room);if(!local)save('cs-server',address);
 await audio.start();
 if(local){worker=new Worker(new URL('./practice-worker.ts',import.meta.url),{type:'module'});worker.onmessage=e=>receive(e.data);worker.onerror=()=>{disconnect();ui.status('Practice could not start. Reload and try again.');};worker.postMessage({type:'init',bytes:bytes.slice(0),roundBytes:roundBytes.slice(0),name,team});}
 else{
  socket=new WebSocket(address);const current=socket;const timeout=setTimeout(()=>{if(connecting){disconnect();ui.status('Connection timed out. Check the game server address.');}},12000);
  socket.onopen=()=>{current.send(JSON.stringify({type:'join',name,room,team,bots:$<HTMLInputElement>('fill-bots').checked}));};
  socket.onmessage=e=>{try{receive(JSON.parse(e.data));if(!connecting)clearTimeout(timeout);}catch{ui.toast('The server sent an invalid response.');}};
  socket.onerror=()=>{ui.status('Could not connect. Start the server or check its address.');};
  socket.onclose=()=>{clearTimeout(timeout);disconnect();ui.status('Disconnected from the game server. Rejoin to continue.');};
 }
}
$('join-form').addEventListener('submit',e=>{e.preventDefault();void join(false);});$('practice').onclick=()=>{void join(true);};$('deploy').onclick=()=>{void capture();};$('resume').onclick=()=>{void capture();};$('leave').onclick=disconnect;
for(const button of document.querySelectorAll<HTMLButtonElement>('[data-team]'))button.onclick=()=>{team=button.dataset.team as Team|'auto';for(const b of document.querySelectorAll('[data-team]'))b.classList.toggle('selected',b===button);};
$('close-buy').onclick=()=>{ui.setBuy(false,snapshot);void capture();};
$('buy-menu').onclick=e=>{const button=(e.target as Element).closest<HTMLButtonElement>('[data-buy]');if(button&&!button.disabled)send({type:'buy',item:button.dataset.buy});};
$<HTMLInputElement>('sensitivity').oninput=e=>{sensitivity=Number((e.target as HTMLInputElement).value);};$<HTMLInputElement>('volume').oninput=e=>audio.setVolume(Number((e.target as HTMLInputElement).value));
document.addEventListener('pointerlockchange',()=>{locked=document.pointerLockElement===canvas;if(!locked&&snapshot&&!ui.buyOpen&&!ui.scoreOpen&&$('deploy-overlay').classList.contains('hidden'))setPaused(true);if(locked)setPaused(false);});
document.addEventListener('mousemove',e=>{if(!locked||ui.buyOpen||ui.pauseOpen||!snapshot?.self.alive)return;const factor=.002*sensitivity*(scope?.5:1);yaw-=e.movementX*factor;yaw=Math.atan2(Math.sin(yaw),Math.cos(yaw));pitch=Math.max(-1.5,Math.min(1.5,pitch-e.movementY*factor));});
document.addEventListener('mousedown',e=>{if(!locked||ui.buyOpen||ui.pauseOpen)return;if(e.button===0)fire=true;if(e.button===2)scope=true;});document.addEventListener('mouseup',e=>{if(e.button===0)fire=false;if(e.button===2)scope=false;});
canvas.addEventListener('contextmenu',e=>e.preventDefault());
document.addEventListener('keydown',e=>{
 if(!snapshot)return;if((e.target as HTMLElement).tagName==='INPUT')return;
 if(['Tab','Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();
 if(e.code==='Tab'){ui.scoreOpen=true;ui.show('scoreboard',true);return;}
 if(e.code==='Escape'){ui.setBuy(false,snapshot);document.exitPointerLock();setPaused(true);return;}
 if(e.repeat)return;
 if(e.code==='KeyB'&&snapshot.self.alive){ui.setBuy(!ui.buyOpen,snapshot);keys.clear();fire=false;scope=false;if(ui.buyOpen){setPaused(false);document.exitPointerLock();}else void capture();return;}
 if(e.code==='Digit1')slot=0;if(e.code==='Digit2')slot=1;
 if(e.code==='Space'&&!snapshot.self.alive)spectatorIndex++;
 keys.add(e.code);
});
document.addEventListener('keyup',e=>{keys.delete(e.code);if(e.code==='Tab'){ui.scoreOpen=false;ui.show('scoreboard',false);}});
window.addEventListener('blur',()=>{keys.clear();fire=false;scope=false;});
let previousJump=false,lastRender=0;
function tick(){
 if(!snapshot||!position)return;
 const active=locked&&!ui.buyOpen&&!ui.pauseOpen&&snapshot.self.alive;
 if(active){if(keys.has('ArrowLeft'))yaw+=.025;if(keys.has('ArrowRight'))yaw-=.025;yaw=Math.atan2(Math.sin(yaw),Math.cos(yaw));}
 const i:Input={...neutralInput(),seq:++seq,yaw,pitch,slot,forward:active?(Number(keys.has('KeyW'))-Number(keys.has('KeyS'))):0,strafe:active?(Number(keys.has('KeyD'))-Number(keys.has('KeyA'))):0,jump:active&&keys.has('Space'),crouch:active&&(keys.has('ControlLeft')||keys.has('KeyC')),walk:active&&keys.has('ShiftLeft'),fire:active&&fire,reload:active&&keys.has('KeyR'),use:active&&keys.has('KeyE'),scope:active&&scope};
 send({type:'input',input:i});
 const canMove=snapshot.phase==='live'&&snapshot.self.alive;
 if(snapshot.self.alive){movePlayer(position,{...i,jump:i.jump&&!previousJump},1/60,engine,canMove);pending.push({input:i,canMove});if(pending.length>90)pending.shift();}previousJump=i.jump;
}
function frame(now:number){
 const dt=Math.min(.05,(now-lastFrame)/1000);lastFrame=now;accumulator+=dt;
 while(accumulator>=1/60){tick();accumulator-=1/60;}
 const target=spectator();if(!document.hidden&&now-lastRender>(snapshot&&!ui.pauseOpen?0:1000/24)){view.render(Math.min(.15,(now-lastRender)/1000),snapshot,position,yaw,pitch,scope,target);lastRender=now;}
 if(snapshot&&position){
  uiTime+=dt;if(uiTime>.08){ui.update(snapshot,position,ping,target);uiTime=0;}
  pingTime+=dt;if(pingTime>2){send({type:'ping',at:performance.now()});pingTime=0;}
  if(snapshot.bomb?.state==='planted'&&snapshot.phase==='live'){beepTime+=dt;if(beepTime>(snapshot.bomb.remaining<10?.35:1)){audio.beep();beepTime=0;}}
  if(now-lastSnapshot>5000&&socket){disconnect();ui.status('Connection lost. Rejoin the room to continue.');}
 }
 requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
// Read-only diagnostics for automated rendering/network verification and operator support.
Object.defineProperty(window,'cs1618',{get:()=>({snapshot,position:position?{...position}:null,yaw,pitch,locked,engine:'Verdant Core',pending:pending.length})});
