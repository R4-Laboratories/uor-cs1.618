import {TEAM_NAMES,WEAPONS,EQUIPMENT,RULES} from '../shared/config';
import {BOXES,MAP,zoneAt} from '../shared/map';
import type {Snapshot,PublicPlayer,Motion,GameEvent} from '../shared/protocol';
export const $=<T extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as T;
const escape=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export class UI{
 buyOpen=false;scoreOpen=false;pauseOpen=false;toastUntil=0;hitUntil=0;hurtUntil=0;lastHealth=100;lastRound=-1;killLines:{text:string;until:number}[]=[];
 constructor(){
 $('app').innerHTML=`
 <div id="loading" class="loading"><div class="brand-mark">φ</div><span>LOADING MERIDIAN</span><small id="load-detail">Initializing Verdant Engine…</small></div>
 <main id="lobby" class="lobby hidden">
  <header class="lobby-header"><a class="wordmark" href="./">cs<span>1.618</span><i>®</i></a><span class="header-label">TACTICAL HARMONY</span><a class="docs-link" href="./manual.html" target="_blank">FIELD MANUAL ↗</a></header>
  <div class="lobby-body"><section class="intro"><div class="eyebrow"><span class="live-dot"></span> MULTIPLAYER TACTICAL FPS <span class="version">01 / MERIDIAN</span></div><h1>Every move.<br>In <em>proportion.</em></h1><p class="lede">Old-school precision. A new playing field.<br>Two teams. Two sites. One decisive round.</p>
   <form id="join-form" class="deploy-card"><div class="card-heading"><span>ENTER THE OPERATION</span><span class="square-mark">↗</span></div>
    <div class="form-grid"><label>CALLSIGN<input id="name" maxlength="18" placeholder="Your callsign" value="Operator" autocomplete="nickname" required></label><label id="server-room-field">ROOM CODE<input id="room" maxlength="20" pattern="[A-Za-z0-9-]+" value="MERIDIAN" aria-label="Room code" required></label></div>
    <div class="team-select" role="group" aria-label="Choose team"><button type="button" data-team="auto" class="selected">AUTO ASSIGN</button><button type="button" data-team="attack"><span class="ember-dot"></span> EMBER</button><button type="button" data-team="defend"><span class="tidal-dot"></span> TIDAL</button></div>
    <label class="mode-label">CONNECTION<select id="network-mode"><option value="browser">Browser-hosted · WebRTC</option><option value="server">Dedicated game server</option></select></label>
    <div id="browser-fields"><button id="host-room" class="primary" type="button">CREATE BROWSER ROOM <span>＋</span></button><label>JOIN A FRIEND<input id="peer-invite" maxlength="2048" placeholder="Paste invitation link or code" autocomplete="off"></label></div>
    <button id="join" class="primary" type="submit"><span id="join-label">JOIN INVITATION</span><span>↗</span></button>
    <button id="practice" class="secondary" type="button">PRACTICE WITH BOTS <span>→</span></button>
    <details id="connection-settings"><summary>Connection settings <span>+</span></summary><label id="server-address-field">GAME SERVER<input id="server" placeholder="ws://localhost:3000/socket" aria-label="Game server address"></label><label class="check-label"><input id="fill-bots" type="checkbox" checked> Fill empty online slots with bots</label><div id="peer-settings"><label>STUN SERVERS<input id="stun-servers" placeholder="stun:stun.example.com:3478"></label><label>OPTIONAL TURN RELAY<input id="turn-servers" placeholder="turn:relay.example.com:3478?transport=udp"></label><div class="form-grid"><label>TURN USERNAME<input id="turn-user" autocomplete="off"></label><label>TURN CREDENTIAL<input id="turn-credential" type="password" autocomplete="off"></label></div><label class="check-label"><input id="relay-only" type="checkbox"> Require relay (needs TURN)</label><label>SIGNALING SERVICE<input id="signaling-server" placeholder="PeerJS Cloud (default)"></label><p>STUN helps find direct routes. TURN relays blocked connections. Optional signaling URL must point to PeerServer. Credentials stay in this tab and are not included in invitations.</p></div><p>Browser hosts must keep this tab open and active. Closing the host ends the room.</p></details>
    <p id="lobby-status" class="status" role="status">Create a browser room, share its invitation, and play. No game server needed.</p>
   </form>
  </section><aside class="map-caption"><div class="map-stamp">M<span>06</span></div><div><span class="eyebrow">ACTIVE MAP</span><h2>MERIDIAN</h2><p>Coastal relay station · Defusal · 5 vs 5</p></div><div class="map-coordinate">36° 43′ N<br>04° 25′ W</div></aside></div>
  <footer class="lobby-footer"><span><b>φ</b> BUILT FOR THE OPEN WEB</span><span>VERDANT ENGINE <i>/</i> cs1.618</span><span>PRECISION OVER CHAOS.</span></footer>
 </main>
 <div id="hud" class="hud hidden">
  <div class="radar-wrap"><canvas id="radar" width="200" height="200" aria-label="Tactical minimap"></canvas><span id="zone">MERIDIAN</span></div>
  <div class="round-bar"><div class="team-score ember"><small>EMBER</small><strong id="score-a">0</strong><span id="alive-a"></span></div><div class="clock"><small id="phase-label">BUY PHASE</small><strong id="clock">00:12</strong><span id="round-label">ROUND 01</span></div><div class="team-score tidal"><small>TIDAL</small><strong id="score-d">0</strong><span id="alive-d"></span></div></div>
  <div class="session-info"><span id="session-room">MERIDIAN</span><span id="ping">LOCAL</span></div>
  <div id="kill-feed" class="kill-feed"></div>
  <div id="round-banner" class="round-banner hidden"><small id="banner-label">ROUND COMPLETE</small><h2 id="banner-title"></h2><p id="banner-detail"></p></div>
  <div id="crosshair" class="crosshair"><i></i><i></i><i></i><i></i><b></b></div><div id="hit-marker" class="hit-marker hidden">×</div><div id="hurt" class="hurt hidden"></div>
  <div id="objective" class="objective hidden"><span id="objective-text"></span><div class="progress"><i id="objective-progress"></i></div></div>
  <div id="context-hint" class="context-hint"></div>
  <div id="spectator" class="spectator hidden"><small>ELIMINATED · SPECTATING</small><strong id="spectator-name"></strong><span>Next round, you’re back. <kbd>SPACE</kbd> Next teammate</span></div>
  <div class="bottom-hud"><div class="vitals"><div><span class="stat-icon">+</span><strong id="health">100</strong><small>HEALTH</small></div><span class="divider"></span><div><span class="stat-icon shield">◇</span><strong id="armor">0</strong><small>ARMOR</small></div></div><div class="utility"><span id="money">$800</span><span id="equipment"></span><span class="buy-key"><kbd>B</kbd> BUY</span></div><div class="ammo"><small id="weapon-name">P9 SIDEARM</small><div><strong id="ammo">15</strong><span>/ <b id="reserve">60</b></span></div><span id="reload-label">1 PRIMARY <i>·</i> 2 SIDEARM</span></div></div>
  <div class="control-strip"><span><kbd>WASD</kbd> MOVE</span><span><kbd>R</kbd> RELOAD</span><span><kbd>E</kbd> INTERACT</span><span><kbd>TAB</kbd> SCOREBOARD</span><span><kbd>ESC</kbd> MENU</span></div>
 </div>
 <div id="deploy-overlay" class="overlay hidden"><div class="pause-card"><div class="eyebrow">CONNECTION ESTABLISHED</div><h2>Ready on the line.</h2><p id="deploy-description">Click to capture the mouse and deploy.</p><div class="peer-share hidden"><label>ROOM INVITATION<input class="invitation-link" readonly aria-label="Room invitation"></label><button type="button" class="secondary copy-invitation">COPY INVITATION</button><p class="peer-state"></p><small>Keep the host tab open and active. The room ends when its host leaves.</small></div><button id="deploy" class="primary">DEPLOY <span>→</span></button><small>WASD move · Mouse aim · Left click fire<br>B buy · E hold to plant / defuse</small></div></div>
 <div id="pause" class="overlay hidden"><div class="pause-card"><div class="eyebrow">OPERATOR MENU</div><h2>Take a breath.</h2><p>The online match continues while this menu is open.</p><div class="peer-share hidden"><label>ROOM INVITATION<input class="invitation-link" readonly aria-label="Room invitation"></label><button type="button" class="secondary copy-invitation">COPY INVITATION</button><p class="peer-state"></p></div><button id="resume" class="primary">RESUME OPERATION <span>→</span></button><label>MOUSE SENSITIVITY<input id="sensitivity" type="range" min="0.5" max="3" value="1" step="0.1"></label><label>AUDIO VOLUME<input id="volume" type="range" min="0" max="1" value="0.45" step="0.05"></label><button id="leave" class="secondary">LEAVE MATCH <span>↗</span></button><a href="./manual.html" target="_blank">Controls & field manual ↗</a></div></div>
 <section id="buy-menu" class="overlay hidden"><div class="buy-panel"><header><div><span class="eyebrow">FIELD SUPPLY</span><h2>Make it count.</h2></div><div><strong id="buy-balance">$800</strong><button id="close-buy" class="icon-btn" aria-label="Close buy menu">×</button></div></header><p id="buy-rule">Purchases are available near your spawn during the buy window.</p><div id="weapon-grid" class="weapon-grid"></div><h3>EQUIPMENT</h3><div id="equipment-grid" class="equipment-grid"></div><footer><span id="buy-message" role="status">Select equipment to purchase.</span><span><kbd>B</kbd> CLOSE</span></footer></div></section>
 <section id="scoreboard" class="overlay score-overlay hidden"><div class="score-panel"><header><span class="eyebrow">MERIDIAN / DEFUSAL</span><h2>Round intelligence.</h2><span>FIRST TO ${RULES.matchWin}</span></header><div id="score-rows"></div></div></section>
 <div id="toast" class="toast hidden" role="status"></div>`;
 }
 show(id:string,on:boolean){$(id).classList.toggle('hidden',!on);}
 status(text:string){$('lobby-status').textContent=text;}
 toast(text:string){$('toast').textContent=text;this.toastUntil=performance.now()+3500;this.show('toast',true);}
 setBuy(open:boolean,s:Snapshot|null){this.buyOpen=open;this.show('buy-menu',open);if(open&&s)this.renderBuy(s);}
 renderBuy(s:Snapshot){
  $('buy-balance').textContent=`$${s.self.money.toLocaleString()}`;
  $('weapon-grid').innerHTML=Object.values(WEAPONS).filter(w=>w.price>0&&(!w.team||w.team===s.self.team)).map(w=>`<button class="weapon-card" data-buy="${w.id}" ${s.self.money<w.price?'disabled':''}><span>${w.category}</span><svg viewBox="0 0 240 70" aria-hidden="true"><path d="M20 33h35l10-12h70v8h70v5h-60l-8 10h-31l-4 22H85l-4-23H61L31 53z"/><path d="M62 25v-8h48v8M170 28v-9h4v9"/></svg><strong>${w.name}</strong><footer><b>$${w.price.toLocaleString()}</b><small>${w.mag} ROUNDS</small></footer></button>`).join('');
  $('equipment-grid').innerHTML=EQUIPMENT.filter(e=>!('team'in e)||e.team===s.self.team).map(e=>`<button data-buy="${e.id}" ${s.self.money<e.price?'disabled':''}><strong>${e.name}</strong><small>${e.detail}</small><span>$${e.price}</span></button>`).join('');
 }
 event(e:GameEvent,s:Snapshot){
  const name=(id:string|undefined)=>escape(s.players.find(p=>p.id===id)?.name??'Operator');
  if(e.type==='kill'){this.killLines.unshift({text:`<b>${name(e.actor)}</b> <span>${e.head?'⌖':'—'} ${escape(WEAPONS[e.weapon!]?.name??'')}</span> ${name(e.target)}`,until:performance.now()+6500});this.killLines=this.killLines.slice(0,5);}
  if(e.type==='hit'&&e.actor===s.self.id)this.hitUntil=performance.now()+160;
  if(e.type==='plant'||e.type==='defuse')this.toast(e.text??'');
 }
 update(s:Snapshot,pos:Motion,ping:number,spectating:PublicPlayer|null){
  const now=performance.now(),self=s.self;this.show('toast',now<this.toastUntil);this.show('hit-marker',now<this.hitUntil);
  if(self.health<this.lastHealth)this.hurtUntil=now+350;this.lastHealth=self.health;this.show('hurt',now<this.hurtUntil);
  $('score-a').textContent=String(s.score.attack);$('score-d').textContent=String(s.score.defend);
  for(const [team,id]of [['attack','alive-a'],['defend','alive-d']] as const)$(id).innerHTML=s.players.filter(p=>p.team===team).map(p=>`<i class="${p.alive?'':'dead'}"></i>`).join('');
  const planted=s.bomb?.state==='planted'&&s.phase==='live';const time=planted?s.bomb!.remaining:s.remaining;
  const seconds=Math.ceil(Math.max(0,time));$('clock').textContent=`${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;
  $('clock').classList.toggle('urgent',planted||time<15&&s.phase==='live');
  $('phase-label').textContent=planted?`DEVICE AT ${s.bomb?.site}`:s.phase==='freeze'?'BUY PHASE':s.phase==='waiting'?'WAITING':s.phase==='matchEnd'?'MATCH COMPLETE':s.phase==='ended'?'ROUND COMPLETE':'LIVE ROUND';
  $('round-label').textContent=`ROUND ${String(s.round).padStart(2,'0')}`;
  $('session-room').textContent=s.room;$('ping').textContent=s.room==='PRACTICE'?'LOCAL':`${Math.round(ping)} MS`;
  $('zone').textContent=zoneAt(pos.x,pos.z);$('health').textContent=String(self.health);$('armor').textContent=String(self.armor);$('money').textContent=`$${self.money.toLocaleString()}`;
  $('equipment').textContent=[s.bomb?.carrier===self.id?'◈ DEVICE':'',self.kit?'◇ KIT':''].filter(Boolean).join('  ');
  const g=self.inventory[self.slot];$('weapon-name').textContent=WEAPONS[g.id].name.toUpperCase();$('ammo').textContent=String(g.ammo).padStart(2,'0');$('reserve').textContent=String(g.reserve);$('reload-label').textContent=self.reloadLeft>0?`RELOADING  ${self.reloadLeft.toFixed(1)}s`:'1 PRIMARY  ·  2 SIDEARM';
  this.show('objective',self.progress>0);$('objective-text').textContent=self.action;$('objective-progress').style.width=`${self.progress*100}%`;
  let hint='';if(s.phase==='freeze')hint=`You are ${TEAM_NAMES[self.team]} · ${self.team==='attack'?'Plant at A or B':'Defend the relay'} · Press B to buy`;
  if(s.phase==='waiting')hint='Waiting for the opposing team to join this room.';
  if(self.alive&&s.phase==='live'){
   if(s.bomb?.carrier===self.id&&MAP.sites.some(site=>Math.hypot(pos.x-site.x,pos.z-site.z)<site.radius))hint='HOLD E TO PLANT · stand still';
   if(planted&&self.team==='defend'&&Math.hypot(pos.x-s.bomb!.x,pos.z-s.bomb!.z)<2.3)hint=`HOLD E TO DEFUSE · ${self.kit?'5':'10'} seconds`;
   if(g.ammo===0)hint='PRESS R TO RELOAD';
  }
  $('context-hint').textContent=hint;
  const ended=s.phase==='ended'||s.phase==='matchEnd';this.show('round-banner',ended);if(ended){$('banner-label').textContent=s.phase==='matchEnd'?'MATCH COMPLETE':'ROUND COMPLETE';$('banner-title').textContent=`${s.winner?TEAM_NAMES[s.winner]:'ROUND'} WINS`;$('banner-detail').textContent=s.reason;}
  this.show('crosshair',self.alive&&!this.buyOpen&&!this.pauseOpen);this.show('spectator',!self.alive);$('spectator-name').textContent=spectating?.name??'Waiting for next round';
  this.killLines=this.killLines.filter(k=>k.until>now);$('kill-feed').innerHTML=this.killLines.map(k=>`<div>${k.text}</div>`).join('');
  if(this.scoreOpen)this.renderScore(s);
  if(this.buyOpen&&this.lastRound!==s.round)this.renderBuy(s);this.lastRound=s.round;
  this.radar(s,pos,spectating);
 }
 renderScore(s:Snapshot){$('score-rows').innerHTML=(['attack','defend']as const).map(team=>`<div class="score-team ${team}"><h3>${TEAM_NAMES[team]} <b>${s.score[team]}</b></h3><div class="score-table-head"><span>OPERATOR</span><span>K</span><span>D</span><span>STATUS</span></div>${s.players.filter(p=>p.team===team).sort((a,b)=>b.kills-a.kills).map(p=>`<div class="score-row ${p.id===s.self.id?'you':''}"><span>${escape(p.name)} ${p.bot?'<small>BOT</small>':''}${p.id===s.self.id?' <small>YOU</small>':''}</span><span>${p.kills}</span><span>${p.deaths}</span><span>${p.alive?'ACTIVE':'OUT'}</span></div>`).join('')}</div>`).join('');}
 radar(s:Snapshot,pos:Motion,spectating:PublicPlayer|null){
  const c=$<HTMLCanvasElement>('radar').getContext('2d')!;const scale=3;const coord=(v:number)=>100+v*scale;
  c.clearRect(0,0,200,200);c.fillStyle='rgba(10,24,27,.9)';c.fillRect(0,0,200,200);c.strokeStyle='#43565a';c.strokeRect(19,19,162,162);
  for(const b of BOXES){c.fillStyle=b.material==='crate'?'#6e7160':'#3b4b4d';c.fillRect(coord(b.x-b.w/2),coord(b.z-b.d/2),b.w*scale,b.d*scale);}
  for(const site of MAP.sites){c.fillStyle=site.id==='A'?'#de9e67':'#81bdc2';c.font='bold 14px sans-serif';c.fillText(site.id,coord(site.x)-4,coord(site.z)+5);}
  for(const p of s.players){if(!p.alive||p.team!==s.self.team)continue;c.fillStyle=p.id===s.self.id?'#d8efb7':'#86b6be';c.beginPath();c.arc(coord(p.id===s.self.id?pos.x:p.x),coord(p.id===s.self.id?pos.z:p.z),p.id===s.self.id?4:2.5,0,Math.PI*2);c.fill();}
  const view=s.self.alive?{...pos,yaw:s.self.yaw}:spectating;if(view){c.strokeStyle='#d8efb7';c.beginPath();c.moveTo(coord(view.x),coord(view.z));c.lineTo(coord(view.x)-Math.sin(view.yaw)*11,coord(view.z)-Math.cos(view.yaw)*11);c.stroke();}
  if(s.bomb&&(s.bomb.state==='planted'||s.self.team==='attack')){c.fillStyle='#f6b069';c.fillRect(coord(s.bomb.x)-2,coord(s.bomb.z)-2,4,4);}
 }
}
