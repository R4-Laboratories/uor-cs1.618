import {HdBudget} from './hd-budget';
import {quality as hdQuality} from '../model/verdant-3d.json';
import {HdLayer,createHdLoader} from './hd-layer';
import {CharacterLayer} from './characters';
import type {VerdantEngine} from '../shared/engine';
import {adaptQuality} from '../shared/generated-experience';
import {ArtworkLayer} from './creative/artwork';
import {optimizeScenery} from './generated/render-policy';
import * as T from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {BOXES,MAP,type Box} from '../shared/map';
import {RULES,WEAPONS} from '../shared/config';
import type {PublicPlayer,SelfState,Snapshot,GameEvent,Motion} from '../shared/protocol';
const C={stone:0xb2ad9c,plaster:0xd9cbb7,teal:0x38696c,crate:0x9a8260,metal:0x74858b};
const boxGeo=new T.BoxGeometry(1,1,1);
function noiseTexture(kind:string){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=512;const ctx=canvas.getContext('2d')!;
 let seed=618;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 ctx.fillStyle=kind==='crate'?'#c8c1b0':kind==='ground'?'#bec2be':'#e4e3dd';ctx.fillRect(0,0,512,512);
 if(kind==='ground'||kind==='stone'){
  const height=kind==='ground'?128:64,width=kind==='ground'?128:128;
  for(let y=0;y<512;y+=height)for(let x=-width;x<512;x+=width){const offset=kind==='stone'&&(y/height)%2?64:0;ctx.fillStyle=`rgba(${rand()>.45?'62,58,48':'255,248,224'},${.025+rand()*.075})`;ctx.fillRect(x+offset,y,width-1,height-1);}
  if(kind==='stone'){ctx.strokeStyle='rgba(66,61,51,.14)';ctx.lineWidth=1.5;for(let y=0;y<512;y+=64){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(512,y);for(let x=(y%128?64:0);x<512;x+=128){ctx.moveTo(x,y);ctx.lineTo(x,y+64);}ctx.stroke();}}
 }
 if(kind==='plaster'||kind==='teal'){
  for(let i=0;i<70;i++){const x=rand()*512,y=rand()*512,r=10+rand()*70;const wash=ctx.createRadialGradient(x,y,0,x,y,r);wash.addColorStop(0,'rgba(80,68,47,.035)');wash.addColorStop(1,'rgba(80,68,47,0)');ctx.fillStyle=wash;ctx.fillRect(x-r,y-r,2*r,2*r);}
  for(let i=0;i<20;i++){ctx.fillStyle='rgba(90,78,57,.025)';ctx.fillRect(rand()*512,rand()*512,1+rand()*3,25+rand()*80);}
 }

 // Fine, low-contrast aggregate rather than enlarged square noise.
 for(let i=0;i<28000;i++){const v=rand()>.5?255:0;ctx.fillStyle=`rgba(${v},${v},${v},${rand()*.035})`;ctx.fillRect(rand()*512,rand()*512,1,1);}
 if(kind==='ground'){ctx.strokeStyle='rgba(47,58,58,.12)';ctx.lineWidth=1;for(let y=0;y<=512;y+=128){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(512,y);ctx.stroke();}for(let x=0;x<=512;x+=128){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,512);ctx.stroke();}}
 if(kind==='crate'){for(let y=0;y<512;y+=64){ctx.fillStyle='rgba(52,59,55,.12)';ctx.fillRect(0,y,512,2);}for(let i=0;i<180;i++){ctx.fillStyle='rgba(87,78,60,.035)';ctx.fillRect(rand()*512,rand()*512,40+rand()*130,1);}}
 const tx=new T.CanvasTexture(canvas);tx.wrapS=tx.wrapT=T.RepeatWrapping;tx.colorSpace=T.SRGBColorSpace;tx.anisotropy=4;return tx;
}
export class WorldView{
 renderer:T.WebGLRenderer;scene=new T.Scene();camera=new T.PerspectiveCamera(76,1,0.05,220);weaponScene=new T.Scene();weaponCamera=new T.PerspectiveCamera(60,1,.01,10);
 players=new Map<string,T.Group>();mats:Record<string,T.MeshStandardMaterial>={};gun=new T.Group();gunId='';flash:T.Mesh;tracers:{mesh:T.Line;life:number}[]=[];impacts:{mesh:T.Mesh;life:number}[]=[];
 bomb:T.Group;private bombDisplay:T.CanvasTexture|null=null;private bombDisplayKey='';private switchLeft=0;private magazine:T.Object3D|null=null;recoil=0;damage=0;elapsed=0;loaded=false;
 private buildingScenery=true;
 private undoEvolution:(()=>void)|null=null;
 evolutionStatus='baseline';
 qualityMode:'auto'|'native'|'low'='auto';
 quality={scale:1,slow:0,fast:0};
 setQuality(mode:'auto'|'native'|'low'){this.qualityMode=mode;this.hdBudget?.reset();this.requestHd(mode==='native'?hdQuality.nativePin:mode==='low'?hdQuality.performancePin:hdQuality.initialAuto);this.quality={scale:mode==='low'?.7:1,slow:0,fast:0};this.renderer.setPixelRatio(Math.min(devicePixelRatio,1)*this.quality.scale);this.resize();}

 artwork:ArtworkLayer;
 characters:CharacterLayer|null=null;
 private engine:VerdantEngine|null=null;
 hd:HdLayer|null=null;private hdWorker:ReturnType<typeof createHdLoader>|null=null;
 private hdBudget:HdBudget|null=null;private hdRequested=-1;
 cameraError='';
 cameraGuard:{guard:number;clearance:number;guarded:boolean;obstructed:boolean}|null=null;
 private requestHd(lod:number){if(!this.hd||lod===this.hdRequested)return;this.hdRequested=lod;void this.hd.setLod(lod).catch(error=>{if(this.hd?.diagnostics.status==='failed'&&this.hdRequested===lod){this.hdRequested=-1;console.error('Verdant HD detail failed',error);}});}
 setEngine(engine:VerdantEngine){
  this.characters?.clear();this.hd?.dispose();this.hdWorker?.dispose();this.engine=engine;this.hdBudget=new HdBudget(engine);this.characters=new CharacterLayer(engine);
  this.hdWorker=createHdLoader();this.hd=new HdLayer(this.scene,this.hdWorker.load);this.hdRequested=-1;
  this.requestHd(this.qualityMode==='native'?hdQuality.nativePin:this.qualityMode==='low'?hdQuality.performancePin:hdQuality.initialAuto);
 }
 constructor(public canvas:HTMLCanvasElement,options:{evolution?:boolean;preserveDrawingBuffer?:boolean}={}){
  this.renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance',preserveDrawingBuffer:options.preserveDrawingBuffer??false});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1));this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.autoUpdate=false;this.renderer.shadowMap.needsUpdate=true;this.renderer.shadowMap.type=T.PCFSoftShadowMap;this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.02;
  this.scene.background=new T.Color(0xb9d0dc);this.scene.fog=new T.Fog(0xb9d0dc,50,155);
  this.scene.add(new T.HemisphereLight(0xdcebf4,0x697778,1.65));
  const sun=new T.DirectionalLight(0xffead1,2.5);sun.position.set(-26,50,22);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-40,right:40,top:40,bottom:-40,near:1,far:130});sun.shadow.bias=-.0003;sun.shadow.normalBias=.03;this.scene.add(sun);
  const fill=new T.DirectionalLight(0xc4e3e8,.55);fill.position.set(20,15,-30);this.scene.add(fill);
  for(const [k,c]of Object.entries(C)){const tex=noiseTexture(k);tex.repeat.set(2,2);this.mats[k]=new T.MeshStandardMaterial({color:c,map:tex,roughness:k==='metal'?.55:.91,metalness:k==='metal'?.4:0});}
  this.mats.trim=new T.MeshStandardMaterial({color:0xe2dac3,roughness:.85});this.mats.dark=new T.MeshStandardMaterial({color:0x253b3c,roughness:.75});
  const groundTex=noiseTexture('ground');groundTex.repeat.set(35,35);const ground=new T.Mesh(new T.PlaneGeometry(180,180),new T.MeshStandardMaterial({map:groundTex,color:0xc1b9a2,roughness:1}));ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;this.scene.add(ground);
  for(const b of BOXES)this.buildBox(b);
  this.details();
  for(const s of MAP.sites){
   const col=s.id==='A'?0xefad65:0x7acac5;
   // Broken perimeter paint gives the objective an industrial silhouette without collision geometry.
   const paint=new T.MeshBasicMaterial({color:col,transparent:true,opacity:.9,side:T.DoubleSide});
   for(let i=0;i<24;i++){const ring=new T.Mesh(new T.RingGeometry(s.radius-.24,s.radius,6,1,i*Math.PI/12,Math.PI/12*.72),paint);ring.rotation.x=-Math.PI/2;ring.position.set(s.x,.02,s.z);this.scene.add(ring);}
   this.sign(s.id,s.x,.03,s.z+1.5,3.8,col,true);
   this.sign(`SITE ${s.id}`,s.x,3.5,-20.45,4,col,false,0,true);
  }
  this.artwork=new ArtworkLayer(this.scene);
  this.buildingScenery=false;
  if(options.evolution!==false){try{this.undoEvolution=optimizeScenery(this.scene);this.evolutionStatus='active';}catch{this.evolutionStatus='rolled-back';}}
  this.bomb=this.makeBomb();this.scene.add(this.bomb);this.bomb.visible=false;
  const environment=new RoomEnvironment(),pmrem=new T.PMREMGenerator(this.renderer);this.weaponScene.environment=pmrem.fromScene(environment,.04).texture;this.weaponScene.environmentIntensity=.65;environment.dispose();pmrem.dispose();
  this.weaponScene.add(new T.HemisphereLight(0xe4f2f4,0x8b969a,2));const gunLight=new T.DirectionalLight(0xffedda,2.6);gunLight.position.set(-2,3,2);this.weaponScene.add(gunLight);this.weaponScene.add(this.gun);
  this.flash=new T.Mesh(new T.ConeGeometry(.09,.35,6),new T.MeshBasicMaterial({color:0xffe7a6,transparent:true,opacity:.9}));this.flash.rotation.x=Math.PI/2;this.flash.visible=false;this.gun.add(this.flash);
  this.resize();window.addEventListener('resize',()=>this.resize());this.loaded=true;
 }
 mesh(x:number,y:number,z:number,w:number,h:number,d:number,material:T.Material,parent:T.Object3D=this.scene){const m=new T.Mesh(boxGeo,material);m.userData.staticScenery=this.buildingScenery;m.position.set(x,y,z);m.scale.set(w,h,d);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
 buildBox(b:Box){
  this.mesh(b.x,b.y+b.h/2,b.z,b.w,b.h,b.d,this.mats[b.material]);
  if(b.material==='crate'){
   for(const y of [.12,b.h-.12])this.mesh(b.x,b.y+y,b.z,b.w+.08,.16,b.d+.08,this.mats.dark);
   for(const x of [-b.w/2+.1,b.w/2-.1])for(const z of [-b.d/2-.025,b.d/2+.025])this.mesh(b.x+x,b.y+b.h/2,b.z+z,.13,b.h,.08,this.mats.dark);
   const brace=this.mesh(b.x,b.y+b.h/2,b.z+b.d/2+.04,.16,Math.hypot(b.w*.8,b.h*.7),.09,this.mats.trim);brace.rotation.z=-Math.atan2(b.w*.8,b.h*.7);
   this.sign('V / 618',b.x,b.y+b.h*.58,b.z+b.d/2+.08,Math.min(b.w*.7,1.3),0xd4c3a4);
  } else if(b.h>=5){
   for(let y=1.8;y<b.h-.5;y+=1.4){this.mesh(b.x,b.y+y,b.z+b.d/2+.004,b.w,.022,.009,this.mats.stone);this.mesh(b.x,b.y+y,b.z-b.d/2-.004,b.w,.022,.009,this.mats.stone);}
   if(b.material==='teal'){for(let y=.8;y<b.h;y+=.6)this.mesh(b.x,b.y+y,b.z+b.d/2+.006,b.w,.035,.012,this.mats.metal);}
   this.mesh(b.x,b.y+b.h-.12,b.z,b.w+.24,.26,b.d+.24,this.mats.trim);
   this.mesh(b.x,b.y+.22,b.z,b.w+.12,.44,b.d+.12,this.mats.trim);
   if(b.w>5&&b.d>5){for(let x=-b.w/2+1.5;x<b.w/2-1;x+=3){this.window(b.x+x,b.y+4,b.z+b.d/2+.04);this.window(b.x+x,b.y+4,b.z-b.d/2-.04,Math.PI);}}
  }
 }
 window(x:number,y:number,z:number,rot=0){const g=new T.Group();g.position.set(x,y,z);g.rotation.y=rot;this.scene.add(g);this.mesh(0,0,0,.95,1.6,.12,this.mats.dark,g);this.mesh(0,-.86,.1,1.15,.14,.35,this.mats.trim,g);for(const sx of [-.32,0,.32])this.mesh(sx,0,.09,.045,1.6,.05,this.mats.teal,g);}
 sign(text:string,x:number,y:number,z:number,size:number,color:number,floor=false,rot=0,backed=false){
  const c=document.createElement('canvas');c.width=512;c.height=256;const ctx=c.getContext('2d')!;const ink='#'+color.toString(16).padStart(6,'0');
  if(backed){ctx.fillStyle='#14262b';ctx.fillRect(0,0,512,256);ctx.strokeStyle=ink;ctx.lineWidth=10;ctx.strokeRect(10,10,492,236);ctx.fillStyle=ink;ctx.fillRect(30,42,10,172);ctx.fillRect(472,42,10,172);}
  ctx.fillStyle=ink;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`bold ${backed?88:text.length>3?64:180}px sans-serif`;ctx.fillText(text,256,backed?110:128);
  if(backed){ctx.fillStyle='#dbe4d9';ctx.font='22px monospace';ctx.fillText('AUTHORIZED PLANT ZONE',256,184);}
  const mesh=new T.Mesh(new T.PlaneGeometry(size,size/2),new T.MeshBasicMaterial({map:new T.CanvasTexture(c),transparent:true,depthWrite:false,side:T.DoubleSide,polygonOffset:true,polygonOffsetFactor:-1}));mesh.position.set(x,y,z);if(floor)mesh.rotation.x=-Math.PI/2;else mesh.rotation.y=rot;this.scene.add(mesh);return mesh;
 }
 details(){
  // Repeated structural details turn simple collision volumes into a readable coastal station.
  for(const x of [-21,21]){
   for(const z of [-2,5,12]){for(const px of [x-3,x+3]){this.mesh(px,2.5,z,.4,5,.4,this.mats.trim);this.mesh(px,4.8,z,.65,.3,.65,this.mats.trim);}this.mesh(x,5,z,6.6,.35,.45,this.mats.trim);}
   const awning=this.mesh(x,5.12,5.4,6.2,.08,14.2,this.mats.teal);awning.receiveShadow=true;
   for(const z of [0,4,8,12]){const lamp=new T.PointLight(0xffbd71,2,5);lamp.position.set(x,4,z);this.mesh(x,4.72,z,.35,.12,.35,new T.MeshBasicMaterial({color:0xffd79f}));}
  }
  this.sign('MERIDIAN',0,4.2,26.92,8,0x477979, false, Math.PI);
  this.sign('RELAY STATION  /  06',0,2.7,26.91,7,0x777363,false,Math.PI);
  this.sign('A / WEST',-21,.025,19,3.5,0xe6ab68,true);this.sign('B / EAST',21,.025,19,3.5,0x8abcc3,true);
  this.sign('A  ←',-8,2.5,19.04,2,0xb66d3b);this.sign('→  B',8,2.5,19.04,2,0x3a7377);
  this.sign('A',-5,2.5,-7.94,1.5,0xc17d48);this.sign('B',5,2.5,-7.94,1.5,0x477979);
  // Antennas and silhouettes are outside the playable envelope.
  for(let i=0;i<24;i++){const angle=i/24*Math.PI*2,rad=42+(i%3)*6;const x=Math.cos(angle)*rad,z=Math.sin(angle)*rad,h=6+(i*7%11);this.mesh(x,h/2,z,7+(i%3)*3,h,9,this.mats.plaster);this.mesh(x,h+.1,z,7.5+(i%3)*3,.3,9.5,this.mats.trim);}
  this.mesh(-14,9.2,14,.18,5,.18,this.mats.metal);this.mesh(-14,10.5,14,3,.08,.08,this.mats.metal);
  for(const x of [-10,10]){const points=[new T.Vector3(x,6.7,7),new T.Vector3(x*.5,5.7,3),new T.Vector3(0,6.8,-1)];this.scene.add(new T.Line(new T.BufferGeometry().setFromPoints(new T.CatmullRomCurve3(points).getPoints(24)),new T.LineBasicMaterial({color:0x3f4540})));}
  // Low curb lines and painted lane markers remain below the collision step height.
  for(const x of [-26.4,26.4])this.mesh(x,.06,0,.28,.12,52,this.mats.trim);
  for(let z=10;z<24;z+=3)this.mesh(0,.012,z,.12,.015,1.2,new T.MeshBasicMaterial({color:0xd8cfab}));
 }
 makeBomb(){
  const g=new T.Group();this.mesh(0,.15,0,.72,.26,.50,this.mats.dark,g);this.mesh(0,.29,0,.65,.045,.44,this.mats.metal,g);
  const orange=new T.MeshStandardMaterial({color:0xcf8d48,roughness:.68,metalness:.25});
  for(const x of [-.29,.29]){this.mesh(x,.18,0,.07,.30,.52,orange,g);for(const z of [-.19,.19])this.mesh(x,.34,z,.045,.025,.045,this.mats.dark,g);}
  this.mesh(-.09,.33,0,.40,.04,.27,this.mats.dark,g);
  const canvas=document.createElement('canvas');canvas.width=256;canvas.height=128;
  this.bombDisplay=new T.CanvasTexture(canvas);this.bombDisplay.colorSpace=T.SRGBColorSpace;
  const display=new T.Mesh(new T.PlaneGeometry(.34,.21),new T.MeshBasicMaterial({map:this.bombDisplay,toneMapped:false}));display.name='bomb-display';display.rotation.x=-Math.PI/2;display.position.set(-.09,.354,0);g.add(display);
  for(let x=0;x<2;x++)for(let z=0;z<3;z++)this.mesh(.16+x*.055,.33,-.07+z*.06,.038,.025,.035,this.mats.dark,g);
  const led=new T.Mesh(new T.SphereGeometry(.035,8,6),new T.MeshBasicMaterial({color:0xff6e43}));led.name='bomb-led';led.position.set(.20,.37,-.18);g.add(led);return g;
 }
 private updateBombDisplay(b:Snapshot['bomb']){
  if(!b||!this.bombDisplay)return;
  const planted=b.state==='planted',seconds=Math.ceil(Math.max(0,Number.isFinite(b.remaining)?b.remaining:0));
  const state=b.terminal??(planted?'armed':'safe'),key=`${state}:${planted?seconds:''}`;
  if(key===this.bombDisplayKey)return;this.bombDisplayKey=key;
  const canvas=this.bombDisplay.image as HTMLCanvasElement,ctx=canvas.getContext('2d')!,color=planted&&seconds<10?'#ff9375':'#abe7c7';
  ctx.fillStyle='#081b1b';ctx.fillRect(0,0,256,128);ctx.strokeStyle=color;ctx.lineWidth=3;ctx.strokeRect(4,4,248,120);ctx.fillStyle=color;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 18px monospace';ctx.fillText(state.toUpperCase(),128,25);ctx.font='bold 61px monospace';ctx.fillText(planted?`00:${String(seconds).padStart(2,'0')}`:'--:--',128,78);this.bombDisplay.needsUpdate=true;
 }

 makePlayer(p:PublicPlayer){
  if(this.characters){const g=this.characters.create(p);this.mesh(.16,1.15,-.5,.12,.14,.75,this.mats.dark,g);this.mesh(.16,1.2,-.91,.06,.06,.2,this.mats.metal,g);this.scene.add(g);this.players.set(p.id,g);return g;}
  const g=new T.Group();const outfit=new T.MeshStandardMaterial({color:p.team==='attack'?0x9a6842:0x416f7d,roughness:.8});const vest=new T.MeshStandardMaterial({color:p.team==='attack'?0x453d33:0x263c43,roughness:.8});const skin=new T.MeshStandardMaterial({color:0xc39b75,roughness:.8});
  this.mesh(0,1.04,0,.52,.63,.33,outfit,g);this.mesh(0,1.08,-.07,.56,.46,.32,vest,g);
  const head=new T.Mesh(new T.SphereGeometry(.2,8,6),skin);head.position.y=1.57;head.scale.set(.9,1.12,.95);head.castShadow=true;g.add(head);this.mesh(0,1.65,.02,.37,.18,.37,vest,g);this.mesh(0,1.56,-.17,.32,.07,.06,this.mats.dark,g);
  for(const sign of [-1,1]){const leg=this.mesh(sign*.15,.39,0,.2,.72,.22,outfit,g);leg.name=sign===-1?'legL':'legR';this.mesh(sign*.15,.08,-.06,.23,.16,.36,vest,g);const arm=this.mesh(sign*.33,1.06,-.16,.18,.5,.18,outfit,g);arm.rotation.x=-.9;}
  this.mesh(.16,1.15,-.5,.12,.14,.75,this.mats.dark,g);this.mesh(.16,1.2,-.91,.06,.06,.2,this.mats.metal,g);g.userData.pos=new T.Vector3(p.x,p.y,p.z);this.scene.add(g);this.players.set(p.id,g);return g;
 }
 setWeapon(id:string){
  if(this.gunId===id)return;
  // Box geometry belongs to the world; flash belongs to the persistent effect.
  // Everything else built below is owned by this weapon and released once.
  const materials=new Set<T.Material>(),geometries=new Set<T.BufferGeometry>();
  this.gun.traverse(o=>{if(o instanceof T.Mesh&&o!==this.flash){for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m);if(o.geometry!==boxGeo)geometries.add(o.geometry);}});
  for(const m of materials)m.dispose();for(const g of geometries)g.dispose();this.gun.clear();this.gunId=id;this.switchLeft=.26;
  const pistol=id==='sidearm',scout=id==='scout',smg=id==='smg';
  const palette:Record<string,number[]>={sidearm:[0x263238,0x39736f],kestrel:[0x36342e,0x925335],m4:[0x2b3834,0x52766b],smg:[0x27343e,0xaf7944],scout:[0x3e4034,0x466473]};const [base,accent]=palette[id]??palette.sidearm;
  const steel=new T.MeshStandardMaterial({color:0x344149,roughness:.40,metalness:.82}),shell=new T.MeshStandardMaterial({color:base,roughness:.57,metalness:.55}),edge=new T.MeshStandardMaterial({color:0x768886,roughness:.36,metalness:.82}),grip=new T.MeshStandardMaterial({color:0x172024,roughness:.94}),paint=new T.MeshStandardMaterial({color:accent,roughness:.62,metalness:.28});
  const part=(x:number,y:number,z:number,w:number,h:number,d:number,m:T.Material)=>this.mesh(x,y,z,w,h,d,m,this.gun);
  const tube=(x:number,y:number,z:number,r:number,length:number,m:T.Material)=>{const mesh=new T.Mesh(new T.CylinderGeometry(r,r,length,12),m);mesh.rotation.x=Math.PI/2;mesh.position.set(x,y,z);this.gun.add(mesh);return mesh;};
  const front=pistol?-.48:smg?-.64:scout?-.98:-.85;
  const bevel=(x:number,y:number,z:number,w:number,h:number,d:number,m:T.Material)=>{const shape=new T.Shape();shape.moveTo(-w/2,-h/2);shape.lineTo(w/2,-h/2);shape.lineTo(w/2,h/2);shape.lineTo(-w/2,h/2);shape.closePath();const geometry=new T.ExtrudeGeometry(shape,{depth:d-.012,bevelEnabled:true,bevelSize:.006,bevelThickness:.006,bevelSegments:2,steps:1});geometry.translate(0,0,-(d-.012)/2);const mesh=new T.Mesh(geometry,m);mesh.position.set(x,y,z);this.gun.add(mesh);return mesh;};
  bevel(0,0,-.31,pistol?.082:.10,.083,pistol?.32:.40,shell);
  bevel(0,.045,-.31,pistol?.075:.09,.012,pistol?.30:.39,edge);
  part(0,-.065,-.24,.09,.055,pistol?.23:.32,grip);
  const handle=part(0,-.15,-.18,.083,.16,.105,grip);handle.rotation.x=-.23;
  part(-.048,-.145,-.18,.012,.09,.073,paint);
  // Separate barrel, muzzle recess, ejection port, slide serrations and iron sights.
  tube(0,.012,front+.035,pistol?.025:.023,pistol?.08:.29,steel);tube(0,.012,front-.012,pistol?.026:.032,.035,edge);tube(0,.012,front-.031,.017,.006,grip);
  part(-.061,.017,-.25,.006,.037,.085,steel);part(-.065,.015,-.24,.007,.011,.042,edge);
  for(let i=0;i<5;i++)part(-.055,.012,-.18+i*.014,.006,.07,.006,steel);
  part(0,.092,pistol?-.43:-.53,.015,.045,.022,grip);part(0,.078,-.15,.08,.03,.023,steel);
  part(0,.093,pistol?-.43:-.53,.008,.008,.015,paint);
  part(0,-.119,-.29,.075,.016,.12,steel);part(0,-.093,-.35,.075,.065,.018,steel);part(0,-.09,-.29,.012,.043,.018,edge);
  if(!pistol){
   const handguard=part(0,.005,smg?-.49:-.56,.115,.105,smg?.15:.23,shell);
   for(let i=0;i<5;i++){part(-.06,.012,handguard.position.z-.08+i*.035,.008,.035,.022,grip);part(0,.071,-.48+i*.045,.13,.015,.017,steel);}
   const stock=part(0,-.035,.005,.10,.12,.27,grip);stock.rotation.x=.04;part(0,-.025,.13,.12,.17,.04,grip);part(0,.035,.005,.105,.025,.20,shell);
   this.magazine=part(0,-.18,smg?-.22:-.36,.074,smg?.25:.22,.10,steel);this.magazine.rotation.x=id==='kestrel'?-.22:0;
   for(let i=0;i<3;i++)part(-.04,-.14-i*.045,smg?-.22:-.36,.008,.014,.085,edge);
  }else this.magazine=part(0,-.243,-.16,.09,.025,.12,paint);
  if(scout){tube(0,.15,-.36,.048,.29,steel);tube(0,.15,-.53,.061,.07,paint);tube(0,.15,-.20,.060,.055,paint);const glass=new T.MeshStandardMaterial({color:0x66b7be,metalness:.65,roughness:.16});tube(0,.15,-.169,.045,.004,glass);for(const z of [-.27,-.45])part(0,.095,z,.05,.07,.035,steel);part(.09,.015,-.19,.10,.02,.025,edge);}
  part(-.049,.006,-.34,.006,.035,.085,paint);for(let i=0;i<3;i++)part(-.053,.014,-.32+i*.014,.005,.005,.008,edge);
  // Original diagonal livery inlay and hardware, visible on the receiver side.
  const inlay=part(-.062,-.012,-.39,.006,.04,.075,paint);inlay.rotation.x=.4;
  for(const z of [-.18,-.40])part(-.065,-.02,z,.009,.012,.012,edge);
  const glove=new T.MeshStandardMaterial({color:0x52656c,roughness:.93}),sleeve=new T.MeshStandardMaterial({color:0x71827e,roughness:.92});
  part(.017,-.205,-.14,.13,.13,.13,glove);const arm=part(.075,-.28,.015,.15,.16,.34,sleeve);arm.rotation.x=.2;
  part(.075,-.236,-.075,.153,.025,.055,grip);
  if(!pistol){part(-.035,-.10,-.48,.13,.10,.17,glove);const left=part(-.16,-.21,-.30,.14,.16,.35,sleeve);left.rotation.z=-.45;left.rotation.y=-.6;}
  this.flash.position.set(0,.012,front-.06);this.gun.add(this.flash);
 }
 event(e:GameEvent,selfId:string){
  if(e.type==='shot'){
   if(e.actor===selfId){this.recoil=1;this.flash.visible=true;}
   const points=[new T.Vector3(e.x!,e.y!-.07,e.z!),new T.Vector3(e.ex!,e.ey!,e.ez!)];const line=new T.Line(new T.BufferGeometry().setFromPoints(points),new T.LineBasicMaterial({color:0xffdfa5,transparent:true,opacity:.65}));this.scene.add(line);this.tracers.push({mesh:line,life:.055});
   const spark=new T.Mesh(new T.SphereGeometry(.045,4,4),new T.MeshBasicMaterial({color:0xffd297}));spark.position.copy(points[1]);this.scene.add(spark);this.impacts.push({mesh:spark,life:.12});
  }
  if(e.type==='explode'){const mesh=new T.Mesh(new T.SphereGeometry(1,12,8),new T.MeshBasicMaterial({color:0xffbc67,transparent:true,opacity:.6}));mesh.position.set(e.x!,e.y!+1,e.z!);this.scene.add(mesh);this.impacts.push({mesh,life:1});}
 }
 resize(){const w=innerWidth,h=innerHeight;this.renderer.setSize(w,h,false);this.camera.aspect=w/h;this.camera.updateProjectionMatrix();this.weaponCamera.aspect=w/h;this.weaponCamera.updateProjectionMatrix();}
 render(dt:number,snapshot:Snapshot|null,position:Motion|null,yaw:number,pitch:number,scoped:boolean,spectating:PublicPlayer|null,active=false){
  if(this.qualityMode==='auto'){const next=adaptQuality(this.quality,active?dt:1);if(next.scale!==this.quality.scale){this.renderer.setPixelRatio(Math.min(devicePixelRatio,1)*next.scale);this.resize();}this.quality=next;}
  if(this.hdBudget&&this.hd?.diagnostics.status==='ready'&&this.qualityMode==='auto')this.requestHd(this.hdBudget.sample(this.hd.diagnostics.lod,dt,active));
  this.elapsed+=dt;this.recoil=Math.max(0,this.recoil-dt*8);this.flash.visible=this.recoil>.7;
  if(!snapshot){this.bomb.visible=false;this.cameraError='';this.characters?.clear();for(const g of this.players.values())this.scene.remove(g);this.players.clear();const t=this.elapsed*.025;this.camera.position.set(30*Math.cos(t+.8),19,30*Math.sin(t+.8));this.camera.lookAt(0,0,-6);}
  else{
   const self=snapshot.self;const view=self.alive&&position?position:spectating??{x:0,y:14,z:20,crouch:false};
   this.camera.position.set(view.x,view.y+('crouch'in view&&view.crouch?RULES.crouchEye:RULES.eyeHeight),view.z);
   this.camera.rotation.order='YXZ';this.camera.rotation.z=0;this.camera.rotation.y=self.alive?yaw:spectating?.yaw??0;this.camera.rotation.x=self.alive?pitch+(self.recoil*.25):spectating?.pitch??-.35;
   const fov=scoped&&self.weapon==='scout'?32:76;this.camera.fov=T.MathUtils.lerp(this.camera.fov,fov,Math.min(1,dt*15));this.camera.updateProjectionMatrix();
   if(this.engine){try{const p=this.camera.position;const frame=this.engine.cameraFrame(p.x,p.y,p.z,this.camera.rotation.y,this.camera.rotation.x,this.camera.fov,this.camera.aspect);this.camera.position.set(frame.x,frame.y,frame.z);this.cameraGuard=frame;this.cameraError='';}catch(error){this.cameraGuard=null;this.cameraError=String(error);return;}}
   const ids=new Set(snapshot.players.map(p=>p.id));for(const[id,g]of this.players)if(!ids.has(id)){this.characters?.remove(id);this.scene.remove(g);this.players.delete(id);}
   for(const p of snapshot.players){const g=this.players.get(p.id)??this.makePlayer(p);g.visible=p.id!==self.id&&p.alive&&p.id!==spectating?.id;g.position.lerp(new T.Vector3(p.x,p.y,p.z),Math.min(1,dt*20));g.rotation.y=p.yaw;g.scale.y=p.crouch?.65:1;if(g.visible)this.characters?.update(p,dt,this.elapsed);const walking=Math.hypot(p.vx,p.vz)>1;for(const side of ['legL','legR']){const leg=g.getObjectByName(side);if(leg)leg.rotation.x=walking?Math.sin(this.elapsed*12+(side==='legL'?0:Math.PI))*.35:0;}}
   const b=snapshot.bomb;this.updateBombDisplay(b);this.bomb.visible=!!b&&!b.terminal&&b.state!=='carried';if(b){this.bomb.position.set(b.x,b.y,b.z);this.bomb.rotation.y=0;const led=this.bomb.getObjectByName('bomb-led');if(led)led.visible=b.state==='dropped'||Math.sin(this.elapsed*(b.remaining<10?18:6))>0;}
   this.setWeapon(self.weapon);
   const speed=position?Math.hypot(position.vx,position.vz):0;const bob=Math.sin(this.elapsed*11)*Math.min(1,speed/5);
   const progress=self.reloadLeft>0?1-self.reloadLeft/(WEAPONS[self.weapon]?.reload??2):0;const reload=self.reloadLeft>0?Math.sin(Math.max(0,progress)*Math.PI):0;this.switchLeft=Math.max(0,this.switchLeft-dt);const equip=this.switchLeft/.26;
   if(this.magazine)this.magazine.position.y=(self.weapon==='sidearm'?-.243:-.18)-Math.sin(Math.min(1,progress*1.6)*Math.PI)*.16;
   this.gun.position.set(scoped&&self.weapon==='scout'?.02:.22,-.20+bob*.006-reload*.13-equip*.22,-.53+this.recoil*.07+equip*.12);
   this.gun.rotation.set(this.recoil*.09+reload*.35+equip*.3,.29+bob*.006+reload*.25,-.06+reload*.5-equip*.2);
  }
  for(const list of [this.tracers,this.impacts])for(let i=list.length-1;i>=0;i--){const fx=list[i];fx.life-=dt;if(fx.life<=0){this.scene.remove(fx.mesh);fx.mesh.geometry.dispose();(fx.mesh.material as T.Material).dispose();list.splice(i,1);}else if(fx.mesh instanceof T.Mesh&&fx.life>.15)fx.mesh.scale.multiplyScalar(1+dt*6);}
  this.renderer.autoClear=true;try{this.renderer.render(this.scene,this.camera);}catch(error){if(!this.undoEvolution)throw error;this.undoEvolution();this.undoEvolution=null;this.evolutionStatus='rolled-back';this.renderer.shadowMap.needsUpdate=true;this.renderer.render(this.scene,this.camera);}
  if(snapshot?.self.alive){this.renderer.autoClear=false;this.renderer.clearDepth();this.renderer.render(this.weaponScene,this.weaponCamera);}
 }
}
