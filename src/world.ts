import {ArtworkLayer} from './creative/artwork';
import {optimizeScenery} from './generated/render-policy';
import * as T from 'three';
import {BOXES,MAP,type Box} from '../shared/map';
import {RULES} from '../shared/config';
import type {PublicPlayer,SelfState,Snapshot,GameEvent,Motion} from '../shared/protocol';
const C={stone:0xafa58b,plaster:0xd9cfb0,teal:0x35676b,crate:0x817253,metal:0x53616a};
const boxGeo=new T.BoxGeometry(1,1,1);
function noiseTexture(kind:string){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const ctx=canvas.getContext('2d')!;
 let seed=618;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 ctx.fillStyle=kind==='ground'?'#b4b1a3':kind==='stone'?'#b9b6a7':kind==='crate'?'#bfb59c':'#d3d0c0';ctx.fillRect(0,0,128,128);
 for(let i=0;i<5000;i++){const v=rand()>0.5?255:0;ctx.fillStyle=`rgba(${v},${v},${v},${rand()*.09})`;ctx.fillRect(rand()*128,rand()*128,rand()*3+1,rand()*2+1);}
 if(kind==='stone'||kind==='ground'){ctx.strokeStyle='rgba(49,50,46,.19)';ctx.lineWidth=1.2;for(let y=0;y<128;y+=32){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(128,y);for(let x=(y%64?32:0);x<128;x+=64){ctx.moveTo(x,y);ctx.lineTo(x,y+32);}ctx.stroke();}}
 if(kind==='crate'){ctx.strokeStyle='rgba(30,30,30,.3)';for(let x=0;x<128;x+=16){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,128);ctx.stroke();}}
 const tx=new T.CanvasTexture(canvas);tx.wrapS=tx.wrapT=T.RepeatWrapping;tx.colorSpace=T.SRGBColorSpace;return tx;
}
export class WorldView{
 renderer:T.WebGLRenderer;scene=new T.Scene();camera=new T.PerspectiveCamera(76,1,0.05,220);weaponScene=new T.Scene();weaponCamera=new T.PerspectiveCamera(60,1,.01,10);
 players=new Map<string,T.Group>();mats:Record<string,T.MeshStandardMaterial>={};gun=new T.Group();gunId='';flash:T.Mesh;tracers:{mesh:T.Line;life:number}[]=[];impacts:{mesh:T.Mesh;life:number}[]=[];
 bomb:T.Group;recoil=0;damage=0;elapsed=0;loaded=false;
 private buildingScenery=true;
 private undoEvolution:(()=>void)|null=null;
 evolutionStatus='baseline';
 artwork:ArtworkLayer;
 constructor(public canvas:HTMLCanvasElement,options:{evolution?:boolean;preserveDrawingBuffer?:boolean}={}){
  this.renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance',preserveDrawingBuffer:options.preserveDrawingBuffer??false});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1));this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.autoUpdate=false;this.renderer.shadowMap.needsUpdate=true;this.renderer.shadowMap.type=T.PCFSoftShadowMap;this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.18;
  this.scene.background=new T.Color(0xc6d4d3);this.scene.fog=new T.Fog(0xc6d4d3,50,155);
  this.scene.add(new T.HemisphereLight(0xdcebf4,0xa49575,2.3));
  const sun=new T.DirectionalLight(0xffe5bb,3.1);sun.position.set(-26,50,22);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-40,right:40,top:40,bottom:-40,near:1,far:130});sun.shadow.bias=-.0003;sun.shadow.normalBias=.03;this.scene.add(sun);
  const fill=new T.DirectionalLight(0xc4e3e8,.55);fill.position.set(20,15,-30);this.scene.add(fill);
  for(const [k,c]of Object.entries(C)){const tex=noiseTexture(k);tex.repeat.set(2,2);this.mats[k]=new T.MeshStandardMaterial({color:c,map:tex,roughness:k==='metal'?.55:.91,metalness:k==='metal'?.4:0});}
  this.mats.trim=new T.MeshStandardMaterial({color:0xe2dac3,roughness:.85});this.mats.dark=new T.MeshStandardMaterial({color:0x253b3c,roughness:.75});
  const groundTex=noiseTexture('ground');groundTex.repeat.set(35,35);const ground=new T.Mesh(new T.PlaneGeometry(180,180),new T.MeshStandardMaterial({map:groundTex,color:0xc1b9a2,roughness:1}));ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;this.scene.add(ground);
  for(const b of BOXES)this.buildBox(b);
  this.details();
  for(const s of MAP.sites){const col=s.id==='A'?0xc67f4f:0x67aaa7;const ring=new T.Mesh(new T.RingGeometry(s.radius-.12,s.radius,64),new T.MeshBasicMaterial({color:col,transparent:true,opacity:.7,side:T.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.set(s.x,.018,s.z);this.scene.add(ring);this.sign(s.id,s.x,.03,s.z+2.5,2.2,col,true);this.sign(`SITE ${s.id}`,s.x,3.5,-20.45,2.8,col);}
  this.artwork=new ArtworkLayer(this.scene);
  this.buildingScenery=false;
  if(options.evolution!==false){try{this.undoEvolution=optimizeScenery(this.scene);this.evolutionStatus='active';}catch{this.evolutionStatus='rolled-back';}}
  this.bomb=this.makeBomb();this.scene.add(this.bomb);this.bomb.visible=false;
  this.weaponScene.add(new T.HemisphereLight(0xe4f2f4,0x635f52,2.7));const gunLight=new T.DirectionalLight(0xffdfad,3);gunLight.position.set(-2,3,2);this.weaponScene.add(gunLight);this.weaponScene.add(this.gun);
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
   this.mesh(b.x,b.y+b.h-.12,b.z,b.w+.24,.26,b.d+.24,this.mats.trim);
   this.mesh(b.x,b.y+.22,b.z,b.w+.12,.44,b.d+.12,this.mats.stone);
   if(b.w>5&&b.d>5){for(let x=-b.w/2+1.5;x<b.w/2-1;x+=3){this.window(b.x+x,b.y+4,b.z+b.d/2+.04);this.window(b.x+x,b.y+4,b.z-b.d/2-.04,Math.PI);}}
  }
 }
 window(x:number,y:number,z:number,rot=0){const g=new T.Group();g.position.set(x,y,z);g.rotation.y=rot;this.scene.add(g);this.mesh(0,0,0,.95,1.6,.12,this.mats.dark,g);this.mesh(0,-.86,.1,1.15,.14,.35,this.mats.trim,g);for(const sx of [-.32,0,.32])this.mesh(sx,0,.09,.045,1.6,.05,this.mats.teal,g);}
 sign(text:string,x:number,y:number,z:number,size:number,color:number,floor=false,rot=0){
  const c=document.createElement('canvas');c.width=512;c.height=256;const ctx=c.getContext('2d')!;ctx.fillStyle='#'+color.toString(16).padStart(6,'0');ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`bold ${text.length>3?64:180}px sans-serif`;ctx.fillText(text,256,128);
  const mesh=new T.Mesh(new T.PlaneGeometry(size,size/2),new T.MeshBasicMaterial({map:new T.CanvasTexture(c),transparent:true,depthWrite:false,side:T.DoubleSide,polygonOffset:true,polygonOffsetFactor:-1}));mesh.position.set(x,y,z);if(floor)mesh.rotation.x=-Math.PI/2;else mesh.rotation.y=rot;this.scene.add(mesh);return mesh;
 }
 details(){
  // Repeated structural details turn simple collision volumes into a readable coastal station.
  for(const x of [-21,21]){
   for(const z of [-2,5,12]){for(const px of [x-3,x+3]){this.mesh(px,2.5,z,.4,5,.4,this.mats.stone);this.mesh(px,4.8,z,.65,.3,.65,this.mats.trim);}this.mesh(x,5,z,6.6,.35,.45,this.mats.trim);}
   const awning=this.mesh(x,5.12,5.4,6.2,.08,14.2,this.mats.teal);awning.receiveShadow=true;
   for(const z of [0,4,8,12]){const lamp=new T.PointLight(0xffbd71,2,5);lamp.position.set(x,4,z);this.mesh(x,4.72,z,.35,.12,.35,new T.MeshBasicMaterial({color:0xffd79f}));}
  }
  this.sign('MERIDIAN',0,4.2,26.92,8,0x477979, false, Math.PI);
  this.sign('RELAY STATION  /  06',0,2.7,26.91,7,0x777363,false,Math.PI);
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
 makeBomb(){const g=new T.Group();this.mesh(0,.16,0,.55,.3,.36,this.mats.dark,g);this.mesh(0,.32,.02,.35,.05,.2,this.mats.metal,g);const led=new T.Mesh(new T.SphereGeometry(.035,6,6),new T.MeshBasicMaterial({color:0xff6544}));led.position.set(.15,.36,.04);g.add(led);return g;}
 makePlayer(p:PublicPlayer){
  const g=new T.Group();const outfit=new T.MeshStandardMaterial({color:p.team==='attack'?0x9a6842:0x416f7d,roughness:.8});const vest=new T.MeshStandardMaterial({color:p.team==='attack'?0x453d33:0x263c43,roughness:.8});const skin=new T.MeshStandardMaterial({color:0xc39b75,roughness:.8});
  this.mesh(0,1.04,0,.52,.63,.33,outfit,g);this.mesh(0,1.08,-.07,.56,.46,.32,vest,g);
  const head=new T.Mesh(new T.SphereGeometry(.2,8,6),skin);head.position.y=1.57;head.scale.set(.9,1.12,.95);head.castShadow=true;g.add(head);this.mesh(0,1.65,.02,.37,.18,.37,vest,g);this.mesh(0,1.56,-.17,.32,.07,.06,this.mats.dark,g);
  for(const sign of [-1,1]){const leg=this.mesh(sign*.15,.39,0,.2,.72,.22,outfit,g);leg.name=sign===-1?'legL':'legR';this.mesh(sign*.15,.08,-.06,.23,.16,.36,vest,g);const arm=this.mesh(sign*.33,1.06,-.16,.18,.5,.18,outfit,g);arm.rotation.x=-.9;}
  this.mesh(.16,1.15,-.5,.12,.14,.75,this.mats.dark,g);this.mesh(.16,1.2,-.91,.06,.06,.2,this.mats.metal,g);g.userData.pos=new T.Vector3(p.x,p.y,p.z);this.scene.add(g);this.players.set(p.id,g);return g;
 }
 setWeapon(id:string){
  if(this.gunId===id)return;this.gunId=id;this.gun.clear();
  const steel=new T.MeshStandardMaterial({color:0x28343a,roughness:.4,metalness:.75});const edge=new T.MeshStandardMaterial({color:0x52656a,roughness:.4,metalness:.6});const grip=new T.MeshStandardMaterial({color:id==='kestrel'?0x805333:0x333f3f,roughness:.9});
  const pistol=id==='sidearm',length=pistol?.3:.6;
  this.mesh(0,0,-.32,.11,.12,length,steel,this.gun);this.mesh(0,.064,-.32,.1,.025,length*.85,edge,this.gun);
  const handle=this.mesh(0,-.12,-.18,.09,.2,.11,grip,this.gun);handle.rotation.x=-.22;
  if(!pistol){this.mesh(0,-.04,-.04,.1,.13,.32,grip,this.gun);this.mesh(0,.015,-.71,.05,.05,.32,steel,this.gun);this.mesh(0,0,-.53,.14,.13,.22,grip,this.gun);const mag=this.mesh(0,-.16,-.35,.075,.22,.12,steel,this.gun);mag.rotation.x=id==='kestrel'?-.2:0;for(let z=-.58;z<-.4;z+=.04)this.mesh(0,.074,z,.13,.02,.014,edge,this.gun);}
  if(id==='scout'){const scope=new T.Mesh(new T.CylinderGeometry(.055,.055,.27,12),steel);scope.rotation.x=Math.PI/2;scope.position.set(0,.13,-.35);this.gun.add(scope);this.mesh(0,.08,-.35,.04,.1,.12,steel,this.gun);}
  else{this.mesh(0,.095,pistol?-.43:-.62,.025,.06,.025,steel,this.gun);this.mesh(0,.09,-.17,.085,.05,.025,edge,this.gun);}
  const glove=new T.MeshStandardMaterial({color:0x54605a,roughness:.9});const sleeve=new T.MeshStandardMaterial({color:0x748178,roughness:.9});
  this.mesh(.025,-.19,-.14,.15,.19,.15,glove,this.gun);const arm=this.mesh(.09,-.29,.02,.17,.2,.4,sleeve,this.gun);arm.rotation.x=.2;
  if(!pistol){this.mesh(-.04,-.11,-.49,.16,.12,.19,glove,this.gun);const left=this.mesh(-.18,-.24,-.32,.16,.19,.4,sleeve,this.gun);left.rotation.z=-.45;left.rotation.y=-.6;}
  this.flash.position.set(0,.02,pistol?-.54:-.92);this.gun.add(this.flash);
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
 render(dt:number,snapshot:Snapshot|null,position:Motion|null,yaw:number,pitch:number,scoped:boolean,spectating:PublicPlayer|null){
  this.elapsed+=dt;this.recoil=Math.max(0,this.recoil-dt*8);this.flash.visible=this.recoil>.7;
  if(!snapshot){const t=this.elapsed*.025;this.camera.position.set(30*Math.cos(t+.8),19,30*Math.sin(t+.8));this.camera.lookAt(0,0,-6);}
  else{
   const self=snapshot.self;const view=self.alive&&position?position:spectating??{x:0,y:14,z:20,crouch:false};
   this.camera.position.set(view.x,view.y+('crouch'in view&&view.crouch?RULES.crouchEye:RULES.eyeHeight),view.z);
   this.camera.rotation.order='YXZ';this.camera.rotation.z=0;this.camera.rotation.y=self.alive?yaw:spectating?.yaw??0;this.camera.rotation.x=self.alive?pitch+(self.recoil*.25):spectating?.pitch??-.35;
   const fov=scoped&&self.weapon==='scout'?32:76;this.camera.fov=T.MathUtils.lerp(this.camera.fov,fov,Math.min(1,dt*15));this.camera.updateProjectionMatrix();
   const ids=new Set(snapshot.players.map(p=>p.id));for(const[id,g]of this.players)if(!ids.has(id)){this.scene.remove(g);this.players.delete(id);}
   for(const p of snapshot.players){const g=this.players.get(p.id)??this.makePlayer(p);g.visible=p.id!==self.id&&p.alive&&p.id!==spectating?.id;g.position.lerp(new T.Vector3(p.x,p.y,p.z),Math.min(1,dt*20));g.rotation.y=p.yaw;g.scale.y=p.crouch?.65:1;const walking=Math.hypot(p.vx,p.vz)>1;for(const side of ['legL','legR']){const leg=g.getObjectByName(side);if(leg)leg.rotation.x=walking?Math.sin(this.elapsed*12+(side==='legL'?0:Math.PI))*.35:0;}}
   const b=snapshot.bomb;this.bomb.visible=!!b&&b.state!=='carried';if(b){this.bomb.position.set(b.x,b.y,b.z);this.bomb.rotation.y=this.elapsed*.2;}
   this.setWeapon(self.weapon);
   const speed=position?Math.hypot(position.vx,position.vz):0;const bob=Math.sin(this.elapsed*11)*Math.min(1,speed/5);
   const reload=self.reloadLeft>0?Math.sin(Math.min(1,self.reloadLeft/1.5)*Math.PI):0;
   this.gun.position.set(scoped&&self.weapon==='scout'?.02:.24,-.24+bob*.006-reload*.2,-.32+this.recoil*.07);
   this.gun.rotation.set(this.recoil*.09+reload*.5,bob*.006,-.05+reload*.7);
  }
  for(const list of [this.tracers,this.impacts])for(let i=list.length-1;i>=0;i--){const fx=list[i];fx.life-=dt;if(fx.life<=0){this.scene.remove(fx.mesh);fx.mesh.geometry.dispose();(fx.mesh.material as T.Material).dispose();list.splice(i,1);}else if(fx.mesh instanceof T.Mesh&&fx.life>.15)fx.mesh.scale.multiplyScalar(1+dt*6);}
  this.renderer.autoClear=true;try{this.renderer.render(this.scene,this.camera);}catch(error){if(!this.undoEvolution)throw error;this.undoEvolution();this.undoEvolution=null;this.evolutionStatus='rolled-back';this.renderer.shadowMap.needsUpdate=true;this.renderer.render(this.scene,this.camera);}
  if(snapshot?.self.alive){this.renderer.autoClear=false;this.renderer.clearDepth();this.renderer.render(this.weaponScene,this.weaponCamera);}
 }
}
