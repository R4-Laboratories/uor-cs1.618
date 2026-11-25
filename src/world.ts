import {createViewmodel, createMuzzleFlash} from './viewmodel';
import {convergeViewmodel, crosshairDepth, muzzleToWorld} from './weapon-aim';
import {sprayOffset} from '../shared/experience';
import {buildMeridianYard} from './environment-yard';
import {createMeridianMaterials, cargoManifest, wallGeometry, type MeridianAssets} from './environment-materials';
import {stageStudioSurfaces, studioSurface} from './studio-render';
import {PartBuilder} from './operator-geometry';
import {CombatEffects} from './combat-effects';
import {HdBudget} from './hd-budget';
import {quality as hdQuality} from '../model/verdant-3d.json';
import {HdLayer,createHdLoader} from './hd-layer';
import {CharacterLayer} from './characters';
import type {VerdantEngine} from '../shared/engine';
import {adaptQuality} from '../shared/generated-experience';
import {ArtworkLayer} from './creative/artwork';
import {optimizeScenery} from './generated/render-policy';
import * as T from 'three';
import {BOXES,MAP,type Box} from '../shared/map';
import {RULES,WEAPONS} from '../shared/config';
import type {PublicPlayer,SelfState,Snapshot,GameEvent,Motion} from '../shared/protocol';
const boxGeo=new T.BoxGeometry(1,1,1);
const daylight=new T.Vector3(-26,34,20).normalize();
export class WorldView{
 private readonly yardSun=new T.DirectionalLight(0xffe9c9,2.75);
 private readonly handSun=new T.DirectionalLight(0xffedda,2.6);
 private readonly inverseView=new T.Quaternion();
 private readonly skyRotation=new T.Quaternion();
 private lightSampleAt=-1;
 private lightTarget=2.6;
 renderer:T.WebGLRenderer;scene=new T.Scene();camera=new T.PerspectiveCamera(76,1,0.05,220);weaponScene=new T.Scene();weaponCamera=new T.PerspectiveCamera(60,1,.01,10);
 players=new Map<string,T.Group>();mats:Record<string,T.MeshStandardMaterial>={};gun=new T.Group();gunId='';flash:T.Mesh;private effects=new CombatEffects(this.scene);
 bomb:T.Group;private bombDisplay:T.CanvasTexture|null=null;private bombDisplayKey='';private switchLeft=0;private aimBlend=0;private gait=0;private drewWeapon=false;private flashPending=false;private weaponParts:ReturnType<typeof createViewmodel>|null=null;recoil=0;damage=0;elapsed=0;loaded=false;
 private buildingScenery=true;
 readonly meridian: MeridianAssets;
 private readonly cargoLabel=cargoManifest();
 private undoEvolution:(()=>void)|null=null;
 evolutionStatus='baseline';
 qualityMode:'auto'|'native'|'low'='auto';
 quality={scale:1,slow:0,fast:0};
 setQuality(mode:'auto'|'native'|'low'){
  this.qualityMode=mode;this.hdBudget?.reset();
  this.requestHd(mode==='native'?hdQuality.nativePin:mode==='low'?hdQuality.performancePin:hdQuality.initialAuto);
  const shadowSize=mode==='low'?512:mode==='auto'?1024:2048;
  const shadow=this.yardSun.shadow;
  if(shadow.mapSize.x!==shadowSize){
   shadow.dispose();shadow.map=null;shadow.mapPass=null;
   shadow.mapSize.set(shadowSize,shadowSize);this.renderer.shadowMap.needsUpdate=true;
  }
  this.quality={scale:mode==='low'?.7:1,slow:0,fast:0};
  this.renderer.setPixelRatio(Math.min(devicePixelRatio,1)*this.quality.scale);this.resize();
 }

 artwork:ArtworkLayer;
 characters:CharacterLayer|null=null;
 private engine:VerdantEngine|null=null;
 hd:HdLayer|null=null;private hdWorker:ReturnType<typeof createHdLoader>|null=null;
 private hdBudget:HdBudget|null=null;private hdRequested=-1;
 cameraError='';
 cameraGuard:{guard:number;clearance:number;guarded:boolean;obstructed:boolean}|null=null;
 private requestHd(lod:number){if(!this.hd||lod===this.hdRequested)return;this.hdRequested=lod;void this.hd.setLod(lod).catch(error=>{if(this.hd?.diagnostics.status==='failed'&&this.hdRequested===lod){this.hdRequested=-1;console.error('Verdant HD detail failed',error);}});}
 setEngine(engine:VerdantEngine){
  stageStudioSurfaces(engine);
  this.characters?.dispose();this.hd?.dispose();this.hdWorker?.dispose();this.engine=engine;this.hdBudget=new HdBudget(engine);this.characters=new CharacterLayer(engine);
  this.hdWorker=createHdLoader();this.hd=new HdLayer(this.scene,this.hdWorker.load);this.hdRequested=-1;
  this.requestHd(this.qualityMode==='native'?hdQuality.nativePin:this.qualityMode==='low'?hdQuality.performancePin:hdQuality.initialAuto);
 }
 constructor(public canvas:HTMLCanvasElement,options:{evolution?:boolean;preserveDrawingBuffer?:boolean}={}){
  this.renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance',preserveDrawingBuffer:options.preserveDrawingBuffer??false});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1));this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.autoUpdate=false;this.renderer.shadowMap.needsUpdate=true;this.renderer.shadowMap.type=T.PCFSoftShadowMap;this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.02;
  this.scene.background=new T.Color(0xb9d0dc);this.scene.fog=new T.Fog(0xb4c6c9,47,155);
  this.scene.add(new T.HemisphereLight(0xd9eaff,0x958979,1.14));
  const sun=this.yardSun;sun.position.set(-26,34,20);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-53,right:53,top:50,bottom:-45,near:1,far:130});sun.shadow.bias=-.0003;sun.shadow.normalBias=.03;this.scene.add(sun);
  const fill=new T.DirectionalLight(0xc4e3e8,.55);fill.position.set(20,15,-30);this.scene.add(fill);
  this.meridian=createMeridianMaterials(this.scene);
  this.mats=this.meridian.materials;
  const groundGeo=new T.PlaneGeometry(180,180);
  const groundUV=groundGeo.getAttribute('uv');
  for(let i=0;i<groundUV.count;i++)groundUV.setXY(i,groundUV.getX(i)*42,groundUV.getY(i)*42);
  const ground=new T.Mesh(groundGeo,this.mats.ground);
  ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;this.scene.add(ground);
  for(const b of BOXES)this.buildBox(b);
  this.details();
  buildMeridianYard(this.scene,this.mats);
  for(const s of MAP.sites){
   const col=s.id==='A'?0xefad65:0x7acac5;
   this.sign(s.id,s.x,.03,s.z+1.5,3.8,col,true);
   this.sign(`SITE ${s.id}`,s.x,3.5,-20.45,4,col,false,0,true);
  }
  this.artwork=new ArtworkLayer(this.scene);
  this.buildingScenery=false;
  if(options.evolution!==false){try{this.undoEvolution=optimizeScenery(this.scene);this.evolutionStatus='active';}catch{this.evolutionStatus='rolled-back';}}
  this.bomb=this.makeBomb();this.scene.add(this.bomb);this.bomb.visible=false;
  // The equipped model reflects the same sky as the yard and receives its sun in camera space.
  void this.meridian.ready.then(()=>{
   this.weaponScene.environment=this.scene.environment;
   this.skyRotation.setFromEuler(this.scene.environmentRotation);
   this.weaponScene.environmentRotation.copy(this.scene.environmentRotation);
  });
  this.weaponScene.environmentIntensity=.55;
  this.handSun.position.copy(daylight);
  this.weaponScene.add(new T.HemisphereLight(0xdfecf1,0x8b8580,1.45),this.handSun,this.gun);
  this.flash=createMuzzleFlash();this.flash.visible=false;this.gun.add(this.flash);
  this.resize();window.addEventListener('resize',()=>this.resize());this.loaded=true;
 }
 mesh(x:number,y:number,z:number,w:number,h:number,d:number,material:T.Material,parent:T.Object3D=this.scene){const m=new T.Mesh(boxGeo,material);m.userData.staticScenery=this.buildingScenery;m.position.set(x,y,z);m.scale.set(w,h,d);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
 buildBox(b:Box){
  const tile=b.material==='crate'?2.4:b.material==='teal'?2.5:3.1;
  const surface=b.surface??(b.finish==='customs'&&b.material==='plaster'&&b.x>-37?'limewash':b.material);
  const body=new T.Mesh(wallGeometry(b.w,b.h,b.d,tile),this.mats[surface]);
  body.position.set(b.x,b.y+b.h/2,b.z);body.castShadow=true;body.receiveShadow=true;
  body.userData.staticScenery=true;this.scene.add(body);
  if(b.finish) return;
  if(b.material==='crate'){
   for(const y of [.09,b.h-.09])this.mesh(b.x,b.y+y,b.z,b.w+.065,.14,b.d+.065,this.mats.dark);
   for(const x of [-b.w*.36,b.w*.36]){
    this.mesh(b.x+x,b.y+b.h/2,b.z,.095,b.h+.028,b.d+.035,this.mats.metal);
    this.mesh(b.x+x,b.y+b.h*.3,b.z+b.d/2+.035,.17,.17,.04,this.mats.dark);
   }
   // Weathered edge protectors and a printed dispatch label give these cases scale.
   for(const sx of [-1,1])for(const sz of [-1,1]){
    this.mesh(b.x+sx*(b.w/2-.09),b.y+b.h/2,b.z+sz*(b.d/2-.07),.19,b.h,.17,this.mats.trim);
   }
   this.mesh(b.x+b.w*.04,b.y+b.h*.61,b.z+b.d/2+.027,Math.min(.92,b.w*.42),.46,.008,this.cargoLabel);
  } else if(b.h>=5){
   for(let y=2.65;y<b.h-.5;y+=2.65){this.mesh(b.x,b.y+y,b.z+b.d/2+.004,b.w,.022,.009,this.mats.stone);this.mesh(b.x,b.y+y,b.z-b.d/2-.004,b.w,.022,.009,this.mats.stone);}
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
  if(backed){ctx.fillStyle='#dbe4d9';ctx.font='22px monospace';ctx.fillText('MERIDIAN  /  RELAY YARD',256,184);}
  const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=4;
  const mesh=new T.Mesh(new T.PlaneGeometry(size,size/2),new T.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,side:T.DoubleSide,polygonOffset:true,polygonOffsetFactor:-1}));mesh.position.set(x,y,z);if(floor)mesh.rotation.x=-Math.PI/2;else mesh.rotation.y=rot;this.scene.add(mesh);return mesh;
 }
 details(){
  // Repeated structural details turn simple collision volumes into a readable coastal station.
  for(const x of [-21,21]){
   for(const z of [-2,5,12]){for(const px of [x-3,x+3]){this.mesh(px,2.5,z,.4,5,.4,this.mats.trim);this.mesh(px,4.8,z,.65,.3,.65,this.mats.trim);}this.mesh(x,5,z,6.6,.35,.45,this.mats.trim);}
   // Slotted canopy sheets let sunlight reach the walkway and preserve sightlines.
   for(let n=0;n<7;n++)this.mesh(x,5.66,-1+n*2.13,6.12,.11,1.35,this.mats.metal);
   const lamp=new T.MeshBasicMaterial({color:0xffe6ba});
   for(const z of [-2,5,12])this.mesh(x,4.82,z,.94,.08,.16,lamp);
  }
  this.sign('MERIDIAN',0,4.2,26.92,8,0x477979, false, Math.PI);
  this.sign('RELAY STATION  /  06',0,2.7,26.91,7,0x777363,false,Math.PI);
  this.sign('A / WEST',-21,.025,19,3.5,0xe6ab68,true);this.sign('B / EAST',21,.025,19,3.5,0x8abcc3,true);
  this.sign('A  ←',-8,2.5,19.04,2,0xb66d3b);this.sign('→  B',8,2.5,19.04,2,0x3a7377);
  this.sign('CUSTOMS',-29.5,4.1,17.07,4,0xf0cf9f,false,0,true);
  this.sign('PUMP HALL',29.5,4.1,17.07,4,0xb1d6d5,false,0,true);
  this.sign('A',-5,2.5,-7.94,1.5,0xc17d48);this.sign('B',5,2.5,-7.94,1.5,0x477979);
  for(const lane of [-1,1]){
   const plate=this.routePlate(lane<0?'A':'B');
   const width=3.3;
   for(const [x,y,z] of [[lane*8,2.6,3.07],[lane*21,4.34,5.08]]){
    const board=new T.Mesh(new T.PlaneGeometry(width,width*.33),plate);
    board.position.set(x,y,z);this.scene.add(board);
   }
  }
  // Antennas and silhouettes are outside the playable envelope.
  for(let i=0;i<12;i++){const angle=i/12*Math.PI*2,rad=70+(i%3)*6;const x=Math.cos(angle)*rad,z=Math.sin(angle)*rad,h=6+(i*7%11);this.mesh(x,h/2,z,7+(i%3)*3,h,9,this.mats.plaster);this.mesh(x,h+.1,z,7.5+(i%3)*3,.3,9.5,this.mats.trim);}
  this.mesh(-14,9.2,14,.18,5,.18,this.mats.metal);this.mesh(-14,10.5,14,3,.08,.08,this.mats.metal);
  for(const x of [-10,10]){const points=[new T.Vector3(x,6.7,7),new T.Vector3(x*.5,5.7,3),new T.Vector3(0,6.8,-1)];this.scene.add(new T.Line(new T.BufferGeometry().setFromPoints(new T.CatmullRomCurve3(points).getPoints(24)),new T.LineBasicMaterial({color:0x3f4540})));}
  // Low curb lines and painted lane markers remain below the collision step height.
  for(const x of [-26.4,26.4])this.mesh(x,.06,0,.28,.12,52,this.mats.trim);

 }
 routePlate(site:'A'|'B'){
  const sheet=document.createElement('canvas');sheet.width=512;sheet.height=170;
  const ink=sheet.getContext('2d')!, west=site==='A';
  ink.fillStyle=west?'#794426':'#27565b';ink.fillRect(0,0,512,170);
  ink.strokeStyle='#dddacb';ink.lineWidth=3;ink.strokeRect(6,6,500,158);
  ink.fillStyle='#f1e9d2';ink.font='bold 96px sans-serif';
  ink.fillText(site,west?165:42,127);
  ink.font='bold 31px sans-serif';ink.fillText(west?'WEST':'EAST',west?260:143,83);
  ink.font='22px monospace';ink.fillText('RELAY YARD',west?260:143,118);
  ink.save();if(!west){ink.translate(512,0);ink.scale(-1,1);}
  ink.beginPath();ink.moveTo(34,85);ink.lineTo(84,34);ink.lineTo(84,65);ink.lineTo(135,65);
  ink.lineTo(135,103);ink.lineTo(84,103);ink.lineTo(84,134);ink.closePath();ink.fill();ink.restore();
  const map=new T.CanvasTexture(sheet);map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;
  return new T.MeshStandardMaterial({map,roughness:.63,metalness:.10});
 }
 makeBomb(){
  const g=new T.Group(), shell=new PartBuilder();
  shell.box([0,.15,0],[.74,.26,.50],0x293339,undefined,.045);
  shell.box([0,.258,0],[.73,.042,.50],0x101a20,undefined,.017);
  shell.box([0,.289,0],[.685,.061,.46],0x606966,undefined,.028);
  // Overmolded corners and a recessed carry handle make the relay case readable in silhouette.
  for(const x of [-.30,.30]){
   for(const z of [-.194,.194]){
    shell.box([x,.161,z],[.105,.27,.114],0xd38e40,undefined,.027);
    shell.box([x,.306,z],[.081,.035,.08],0x232c2b,undefined,.012);
   }
  }
  for(const x of [-.12,.12])shell.box([x,.172,.267],[.035,.048,.09],0x333b3c,undefined,.010);
  shell.box([0,.172,.302],[.267,.048,.045],0x161f21,undefined,.015);
  shell.box([-.09,.327,0],[.40,.049,.27],0x182327,undefined,.019);
  for(let col=0;col<2;col++)for(let row=0;row<3;row++)
   shell.box([.144+col*.067,.33,-.06+row*.061],[.049,.024,.042],row===2?0xb88646:0x283233,undefined,.006);
  const casing=new T.Mesh(shell.finish(),new T.MeshStandardMaterial({...studioSurface('polymer'),vertexColors:true,color:0xffffff}));
  casing.castShadow=true;casing.receiveShadow=true;g.add(casing);
  const canvas=document.createElement('canvas');canvas.width=256;canvas.height=128;
  this.bombDisplay=new T.CanvasTexture(canvas);this.bombDisplay.colorSpace=T.SRGBColorSpace;
  const display=new T.Mesh(new T.PlaneGeometry(.34,.21),new T.MeshBasicMaterial({map:this.bombDisplay,toneMapped:false}));display.name='bomb-display';display.rotation.x=-Math.PI/2;display.position.set(-.09,.354,0);g.add(display);
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

 private removePlayer(id:string,group:T.Group){
  this.characters?.remove(id);
  group.userData.release?.();
  this.scene.remove(group);
  this.players.delete(id);
 }
 makePlayer(p:PublicPlayer){
  if(this.characters){const g=this.characters.create(p);g.userData.side=p.team;this.scene.add(g);this.players.set(p.id,g);return g;}
  const g=new T.Group();const outfit=new T.MeshStandardMaterial({color:p.team==='attack'?0x9a6842:0x416f7d,roughness:.8});const vest=new T.MeshStandardMaterial({color:p.team==='attack'?0x453d33:0x263c43,roughness:.8});const skin=new T.MeshStandardMaterial({color:0xc39b75,roughness:.8});
  this.mesh(0,1.04,0,.52,.63,.33,outfit,g);this.mesh(0,1.08,-.07,.56,.46,.32,vest,g);
  const head=new T.Mesh(new T.SphereGeometry(.2,8,6),skin);head.position.y=1.57;head.scale.set(.9,1.12,.95);head.castShadow=true;g.add(head);this.mesh(0,1.65,.02,.37,.18,.37,vest,g);this.mesh(0,1.56,-.17,.32,.07,.06,this.mats.dark,g);
  for(const sign of [-1,1]){const leg=this.mesh(sign*.15,.39,0,.2,.72,.22,outfit,g);leg.name=sign===-1?'legL':'legR';this.mesh(sign*.15,.08,-.06,.23,.16,.36,vest,g);const arm=this.mesh(sign*.33,1.06,-.16,.18,.5,.18,outfit,g);arm.rotation.x=-.9;}
  this.mesh(.16,1.15,-.5,.12,.14,.75,this.mats.dark,g);this.mesh(.16,1.2,-.91,.06,.06,.2,this.mats.metal,g);g.userData.side=p.team;
  g.userData.release=()=>{outfit.dispose();vest.dispose();skin.dispose();head.geometry.dispose();};
  g.userData.pos=new T.Vector3(p.x,p.y,p.z);this.scene.add(g);this.players.set(p.id,g);return g;
 }
 setWeapon(id:string){
  if(this.gunId===id)return;
  const materials=new Set<T.MeshStandardMaterial>();
  const geometries=new Set<T.BufferGeometry>();
  const textures=new Set<T.Texture>();
  this.gun.traverse(part=>{
   if(!(part instanceof T.Mesh)||part===this.flash)return;
   geometries.add(part.geometry);
   for(const material of Array.isArray(part.material)?part.material:[part.material]){
    materials.add(material);
    if(material.map)textures.add(material.map);
   }
  });
  textures.forEach(map=>map.dispose());
  materials.forEach(material=>material.dispose());
  geometries.forEach(geometry=>geometry.dispose());
  this.gun.clear();
  const model=createViewmodel(id);
  this.weaponParts=model;
  this.gun.add(model.root,this.flash);
  this.flash.position.set(0,.016,model.muzzle);
  this.flash.userData.hideInArmory=true;
  this.gunId=id;
  this.switchLeft=.26;this.aimBlend=0;
 }
 clearRoundEffects(){this.effects.clear();}
 event(e:GameEvent,selfId:string){
  if(e.type==='shot'){
   let muzzle:T.Vector3|null=null;
   if(e.actor===selfId){
    this.recoil=1;this.flashPending=true;
    this.flash.rotation.z=e.id*2.39996;
    const scale=.83+(e.id%7)*.055;
    this.flash.scale.set(scale,scale,e.weapon==='breaker'?1.3:scale);
    if(this.drewWeapon&&this.gunId===e.weapon&&e.ex!==undefined&&e.ey!==undefined&&e.ez!==undefined){
     const tip=this.flash.getWorldPosition(new T.Vector3());
     muzzle=muzzleToWorld(tip,this.weaponCamera,this.camera,new T.Vector3(e.ex,e.ey,e.ez));
    }
   }else if(e.actor)muzzle=this.characters?.muzzleOf(e.actor,e.weapon)??null;
   this.effects.shot(e,muzzle);
  }
  if(e.type==='explode')this.effects.explode(e.x!,e.y!,e.z!);
 }
 resize(){const w=innerWidth,h=innerHeight;this.renderer.setSize(w,h,false);this.camera.aspect=w/h;this.camera.updateProjectionMatrix();this.weaponCamera.aspect=w/h;this.weaponCamera.updateProjectionMatrix();}
 render(dt:number,snapshot:Snapshot|null,position:Motion|null,yaw:number,pitch:number,scoped:boolean,spectating:PublicPlayer|null,active=false){
  if(this.qualityMode==='auto'){const next=adaptQuality(this.quality,active?dt:1);if(next.scale!==this.quality.scale){this.renderer.setPixelRatio(Math.min(devicePixelRatio,1)*next.scale);this.resize();}this.quality=next;}
  if(this.hdBudget&&this.hd?.diagnostics.status==='ready'&&this.qualityMode==='auto')this.requestHd(this.hdBudget.sample(this.hd.diagnostics.lod,dt,active));
  this.elapsed+=dt;
  // Even a slower renderer must display a newly confirmed shot at least once.
  this.flash.visible=this.flashPending||this.recoil>.7;
  this.flashPending=false;
  if(!snapshot){this.bomb.visible=false;this.cameraError='';for(const [id,g] of this.players)this.removePlayer(id,g);const t=this.elapsed*.025;this.camera.position.set(30*Math.cos(t+.8),19,30*Math.sin(t+.8));this.camera.lookAt(0,0,-6);}
  else{
   const self=snapshot.self;const view=self.alive&&position?position:spectating??{x:0,y:14,z:20,crouch:false};
   this.camera.position.set(view.x,view.y+('crouch'in view&&view.crouch?RULES.crouchEye:RULES.eyeHeight),view.z);
   const spray=sprayOffset(WEAPONS[self.weapon],self.burst??0);
   this.camera.rotation.order='YXZ';this.camera.rotation.z=0;
   this.camera.rotation.y=self.alive?yaw+spray.yaw:spectating?.yaw??0;
   this.camera.rotation.x=self.alive?pitch+spray.pitch:spectating?.pitch??-.35;
   const sighted=scoped&&self.alive&&self.reloadLeft<=0;
   const fov=sighted?(self.weapon==='scout'?32:65):76;this.camera.fov=T.MathUtils.lerp(this.camera.fov,fov,Math.min(1,dt*15));this.camera.updateProjectionMatrix();
   if(this.engine){try{const p=this.camera.position;const frame=this.engine.cameraFrame(p.x,p.y,p.z,this.camera.rotation.y,this.camera.rotation.x,this.camera.fov,this.camera.aspect);this.camera.position.set(frame.x,frame.y,frame.z);this.cameraGuard=frame;this.cameraError='';}catch(error){this.cameraGuard=null;this.cameraError=String(error);return;}}
   const sides=new Map(snapshot.players.map(p=>[p.id,p.team]));
   for(const [id,g] of this.players)if(sides.get(id)!==g.userData.side)this.removePlayer(id,g);
   for(const p of snapshot.players){const g=this.players.get(p.id)??this.makePlayer(p);g.visible=p.id!==self.id&&p.alive&&p.id!==spectating?.id;g.position.set(p.x,p.y,p.z);g.rotation.y=p.yaw;g.scale.y=p.crouch?.65:1;if(g.visible)this.characters?.update(p,dt,this.elapsed);const walking=Math.hypot(p.vx,p.vz)>1;for(const side of ['legL','legR']){const leg=g.getObjectByName(side);if(leg)leg.rotation.x=walking?Math.sin(this.elapsed*12+(side==='legL'?0:Math.PI))*.35:0;}}
   const b=snapshot.bomb;this.updateBombDisplay(b);this.bomb.visible=!!b&&!b.terminal&&b.state!=='carried';if(b){this.bomb.position.set(b.x,b.y,b.z);this.bomb.rotation.y=0;const led=this.bomb.getObjectByName('bomb-led');if(led)led.visible=b.state==='dropped'||Math.sin(this.elapsed*(b.remaining<10?18:6))>0;}
   if(self.alive){
    this.inverseView.copy(this.camera.quaternion).invert();
    this.handSun.position.copy(daylight).applyQuaternion(this.inverseView);
    this.weaponScene.environmentRotation.setFromQuaternion(this.inverseView.multiply(this.skyRotation));
    if(this.engine && this.elapsed>=this.lightSampleAt){
     const eye=this.camera.position;
     const hit=this.engine.ray(eye.x,eye.y,eye.z,daylight.x,daylight.y,daylight.z,100);
     this.lightTarget=hit>=0&&hit<100?.36:2.6;
     this.lightSampleAt=this.elapsed+.12;
    }
    this.handSun.intensity=T.MathUtils.damp(this.handSun.intensity,this.lightTarget,10,dt);
   }
   this.setWeapon(self.weapon);
   const speed=position?Math.hypot(position.vx,position.vz):0;
   this.gait+=dt*speed*1.9;
   const moving=self.grounded?Math.min(1,speed/RULES.runSpeed):0;
   const bob=Math.sin(this.gait)*moving;
   const aimTarget=sighted&&this.switchLeft<=0?1:0;
   this.aimBlend=T.MathUtils.damp(this.aimBlend,aimTarget,20,dt);
   const hip=1-this.aimBlend;
   this.weaponCamera.fov=54+6*hip;
   this.weaponCamera.updateProjectionMatrix();
   const progress=self.reloadLeft>0?1-self.reloadLeft/(WEAPONS[self.weapon]?.reload??2):0;const reload=self.reloadLeft>0?Math.sin(Math.max(0,progress)*Math.PI):0;this.switchLeft=Math.max(0,this.switchLeft-dt);const equip=this.switchLeft/.26;
   if(this.weaponParts){
    const {chassis,pistol,magazine,magazineRest,support}=this.weaponParts;
    chassis.position.z=pistol?this.recoil*.024:0;
    const withdrawal=Math.sin(Math.min(1,Math.max(0,(progress-.08)*1.55))*Math.PI);
    magazine.position.fromArray(magazineRest);
    if(self.weapon==='breaker'){
     const pump=4*this.recoil*(1-this.recoil)*.08;
     magazine.position.z+=pump;
     support.position.set(withdrawal*.03,-withdrawal*.045,pump+withdrawal*.075);
    }else{
     magazine.position.y-=withdrawal*.16;
     magazine.rotation.x=-withdrawal*.20;
     support.position.set(withdrawal*.055,-withdrawal*.08,withdrawal*.13);
    }
    support.rotation.x=withdrawal*.17;
   }
   // Sight and bore are parallel lines in model space; move the fitted mesh
   // relative to the pivot instead of baking an arbitrary toe-in into its yaw.
   const axisHeight=T.MathUtils.lerp(.016,this.weaponParts!.sightHeight,this.aimBlend);
   this.weaponParts!.root.position.y=-axisHeight;
   this.flash.position.y=.016-axisHeight;
   const depth=crosshairDepth(this.camera,this.engine,snapshot.players,self.id,WEAPONS[self.weapon].range);
   const lateral=Math.min(1,this.camera.aspect/.90);
   this.gun.position.set((.205+Math.cos(this.gait*.5)*moving*.011)*lateral*hip,
    (-.173+bob*.008)*hip-reload*.13-equip*.22,-.49-.03*hip+this.recoil*.072+equip*.12);
   convergeViewmodel(this.gun,depth,(-.065+bob*.013)*hip+this.recoil*.025+reload*.5-equip*.2);
   this.gun.rotation.x+=reload*.35+equip*.3;
   this.gun.rotation.y+=reload*.25;
  }
  this.renderer.autoClear=true;try{this.renderer.render(this.scene,this.camera);}catch(error){if(!this.undoEvolution)throw error;this.undoEvolution();this.undoEvolution=null;this.evolutionStatus='rolled-back';this.renderer.shadowMap.needsUpdate=true;this.renderer.render(this.scene,this.camera);}
  this.drewWeapon=!!snapshot?.self.alive&&!(scoped&&snapshot.self.weapon==='scout'&&snapshot.self.reloadLeft<=0);
  if(this.drewWeapon){this.renderer.autoClear=false;this.renderer.clearDepth();this.renderer.render(this.weaponScene,this.weaponCamera);}
  this.recoil=Math.max(0,this.recoil-dt*8);this.effects.update(dt);
 }
}
