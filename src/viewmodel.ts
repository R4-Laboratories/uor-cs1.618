import * as T from 'three';
import {PartBuilder, surfaceTexture, type Point} from './operator-geometry';
import {studioSurface} from './studio-render';

type WeaponType='sidearm'|'kestrel'|'m4'|'smg'|'scout';
interface Finish {shell:number; panel:number; accent:number; index:number}
const finish:Record<WeaponType,Finish>={
  sidearm:{shell:0x535d66,panel:0x263a43,accent:0x9cbdad,index:9},
  kestrel:{shell:0x786650,panel:0x353b37,accent:0xdb894a,index:7},
  m4:{shell:0x52646b,panel:0x263c43,accent:0xc4ba85,index:4},
  smg:{shell:0x686250,panel:0x353a35,accent:0xdda85f,index:3},
  scout:{shell:0x747c63,panel:0x394539,accent:0xd5bb84,index:8},
};
const dark=0x202a2d,steel=0x404c51,cut=0x7c8787,rubber=0x252c2c;
function batch(root:T.Group,name:string,parts:PartBuilder,params:T.MeshStandardMaterialParameters){
  const material=new T.MeshStandardMaterial({...params,color:0xffffff,vertexColors:true});
  const mesh=new T.Mesh(parts.finish(),material);mesh.name=name;root.add(mesh);return mesh;
}

function sleeve(parts:PartBuilder,start:Point,end:Point,color:number){
  const from=new T.Vector3(...start),to=new T.Vector3(...end);
  const axis=to.clone().sub(from),basis=new T.Vector3(1,0,0).cross(axis).normalize();
  const widthAxis=axis.clone().normalize().cross(basis).normalize();
  const positions=[],indices=[];
  const rings=[[0,.084],[.18,.086],[.24,.090],[.29,.082],[.47,.080],[.55,.074],[.61,.081],[.70,.069],[.79,.070],[.88,.057],[1,.053]];
  const segments=16;
  for(let j=0;j<rings.length;j++){
    const [t,r]=rings[j],center=from.clone().lerp(to,t);
    for(let i=0;i<segments;i++){
      const angle=Math.PI*2*i/segments;
      const radius=r*(1+.045*Math.sin(angle*3+j*.7));
      const vertex=center.clone().addScaledVector(widthAxis,radius*Math.cos(angle)).addScaledVector(basis,radius*.89*Math.sin(angle));
      positions.push(vertex.x,vertex.y,vertex.z);
      if(j){const a=(j-1)*segments+i,b=(j-1)*segments+(i+1)%segments;indices.push(a,a+segments,b,b+segments,b,a+segments);}
    }
  }
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setIndex(indices);geo.computeVertexNormals();parts.add(geo,[0,0,0],[1,1,1],color);
  const cuff=from.clone().lerp(to,.84).toArray() as Point;
  parts.link(cuff,end,.064,.055,0x394240,16);
}
function glove(parts:PartBuilder,center:Point,support:boolean){
  const [x,y,z]=center,side=support?-1:1;
  const shell=0x423e35,knit=0x655e49,rim=0x2d302e;
  parts.ellipsoid(center,[.053,.052,.088],knit,[support?-.22:.35,0,side*.17]);
  parts.ellipsoid([x+side*.029,y+.008,z],[.034,.042,.068],shell);
  for(let i=0;i<4;i++){
    // Cupped segments, soft backs, rubber knuckle pads and wrapped fingertips.
    const fz=z-.061+i*.033,fy=y+.008-i*.005;
    const a:Point=[x+side*.026,fy+.025,fz],b:Point=[x+side*.045,fy-.005,fz-.004],c:Point=[x+side*.007,fy-.038,fz-.005];
    parts.link(a,b,.018,.016,knit,9);parts.link(b,c,.016,.012,shell,9);
    parts.ellipsoid(b,[.017,.015,.014],rim);parts.ellipsoid(c,[.012,.013,.013],shell);
    parts.ellipsoid([x+side*.037,fy+.017,fz],[.016,.017,.013],rim);
  }
  parts.ellipsoid([x-side*.02,y+.017,z-.038],[.021,.027,.055],shell,[.32,side*-.55,0]);
}
function makeHands(pistol:boolean){
  const group=new T.Group();group.userData.hideInArmory=true;group.name='field-gloves';
  const material={...studioSurface('oliveFabric'),map:surfaceTexture('cloth'),roughness:.89};
  const hands=new PartBuilder(),right:Point=[.028,-.133,-.155];
  sleeve(hands,[.195,-.32,.23],[.049,-.15,-.087],0x596257);
  glove(hands,right,false);
  batch(group,'trigger-hand-and-sleeve',hands,material);
  const support=new T.Group();support.name='support-hand';group.add(support);
  const arm=new PartBuilder(),left:Point=pistol?[-.043,-.153,-.19]:[-.04,-.057,-.52];
  const wrist:Point=[left[0]-.035,left[1]-.024,left[2]+.065];
  sleeve(arm,[-.265,-.28,-.13],wrist,0x53605a);
  glove(arm,left,true);batch(support,'support-glove-and-sleeve',arm,{...material,map:surfaceTexture('cloth',1)});
  return {group,support};
}
const segs=['abcedf','bc','abged','abgcd','fgbc','afgcd','afegcd','abc','abcdefg','abfgcd'];
function stamp(body:PartBuilder,at:Point,number:number,color:number){
  const [x,y,z]=at,coords:{[k:string]:[number,number,boolean]}={
    a:[0,.005,true],b:[-.003,.0025,false],c:[-.003,-.0025,false],d:[0,-.005,true],
    e:[.003,-.0025,false],f:[.003,.0025,false],g:[0,0,true]};
  for(const [i,digit] of String(number).padStart(2,'0').split('').entries()){
    for(const letter of segs[Number(digit)]){
      const [dz,dy,horizontal]=coords[letter];
      body.box([x,y+dy,z+dz+i*.009],[.0008,horizontal?.0012:.0038,horizontal?.005:.0012],color);
    }
  }
}
function fittedSight(parts:PartBuilder,z:number,palette:Finish){
  parts.box([0,.077,z],[.078,.024,.095],steel,[0,0,0],.004);
  // A chamfered open hood with a real aperture and a slotted clamp.
  const outline=new T.Shape();
  outline.moveTo(-.044,0);outline.lineTo(-.043,.059);outline.lineTo(-.026,.081);
  outline.lineTo(.020,.081);outline.lineTo(.043,.058);outline.lineTo(.041,0);outline.closePath();
  const aperture=new T.Path();
  aperture.moveTo(-.030,.013);aperture.lineTo(.029,.013);aperture.lineTo(.03,.052);
  aperture.lineTo(.016,.069);aperture.lineTo(-.020,.069);aperture.lineTo(-.030,.055);aperture.closePath();
  outline.holes.push(aperture);
  const hood=new T.ExtrudeGeometry(outline,{depth:.046,bevelEnabled:true,bevelSize:.002,bevelThickness:.002,bevelSegments:1});
  parts.add(hood,[0,.079,z-.024],[1,1,1],palette.panel,[-.13,0,0]);
  parts.box([-.046,.106,z+.004],[.009,.026,.047],palette.shell,[0,0,0],.004);
  parts.link([-.045,.09,z+.014],[-.056,.09,z+.014],.009,.009,cut,12);
  parts.box([-.057,.09,z+.014],[.001,.002,.012],dark,[-.36,0,0]);
  parts.box([0,.087,z+.038],[.069,.008,.014],steel);
}
function topCover(parts:PartBuilder,width:number,length:number,z:number,y:number,tint:number){
  const shape=new T.Shape();
  shape.moveTo(-width/2,-.022);shape.lineTo(-width/2,.012);
  shape.lineTo(-width*.28,.028);shape.lineTo(width*.28,.028);shape.lineTo(width/2,.012);
  shape.lineTo(width/2,-.022);shape.closePath();
  const cap=new T.ExtrudeGeometry(shape,{depth:length,bevelEnabled:true,bevelSize:.002,bevelThickness:.002,bevelSegments:1});
  parts.add(cap,[0,y,z],[1,1,1],tint);
}
/** Viewmodel is pre-batched by finish and animated component. The flash stays owned by WorldView. */
export function createViewmodel(id:string){
  const type:WeaponType=Object.hasOwn(finish,id)?id as WeaponType:'sidearm';
  const p=finish[type],pistol=type==='sidearm',compact=type==='smg',scout=type==='scout',kestrel=type==='kestrel';
  const root=new T.Group(),body=new PartBuilder(),metal=new PartBuilder(),soft=new PartBuilder(),mag=new PartBuilder();
  const front=pistol?-.50:compact?-.66:scout?-1.02:kestrel?-.90:-.87;
  const shoulder=pistol?-.12:compact?.09:scout?.18:.16;
  const top=pistol?.034:.043;
  const bodyProfile:[number,number][]=pistol
    ? [[-.48,.013],[-.46,top],[-.145,top],[-.126,.029],[-.132,-.02],[-.44,-.02],[-.48,-.007]]
    : [[-.52,.019],[-.484,top],[-.18,top],[-.133,.043],[-.126,-.028],[-.191,-.043],[-.25,-.041],[-.283,-.08],[-.373,-.08],[-.401,-.045],[-.501,-.041]];
  body.profile(0,bodyProfile,pistol?.078:.088,p.shell);
  topCover(body,pistol?.073:.082,pistol?.305:.323,pistol?-.457:-.473,top-.008,p.shell);
  // The dark inset, stepped edge and exposed fastener break up the camera-facing receiver.
  const rx=pistol?-.042:-.047;
  metal.profile(rx,[[-.281,.018],[-.269,.03],[-.204,.03],[-.199,.018],[-.203,-.003],[-.274,-.003]],.005,dark,.001);
  metal.box([rx-.003,.006,-.234],[.003,.008,.053],steel);
  metal.link([rx-.004,.012,-.216],[rx-.015,.012,-.216],.006,.006,cut,10);
  // Faceted coating panel, inlaid index and serial on the camera-facing side.
  body.profile(pistol?-.041:-.046,[[-.46,.016],[-.427,.036],[-.29,.036],[-.324,-.008],[-.438,-.008]],.002,p.panel,.0004);
  body.profile(pistol?-.043:-.048,[[-.423,.033],[-.417,.033],[-.448,-.005],[-.454,-.005]],.0016,p.accent,.0002);
  stamp(metal,[pistol?-.044:-.049,.016,-.388],p.index,0xd8d7c5);
  for(let i=0;i<(pistol?8:4);i++)body.box([pistol?-.04:-.046,.011,-.169-i*.009],[.004,.041,.003],steel,[.23,0,0]);
  for(const z of [-.168,-.29])metal.link([-.047,.008,z],[-.051,.008,z],.006,.006,cut,8);
  const gripProfile:[number,number][]=[[-.227,-.043],[-.15,-.039],[-.114,-.169],[-.12,-.217],[-.184,-.216],[-.198,-.16]];
  soft.profile(0,gripProfile,.063,rubber);
  soft.profile(0,[[-.345,-.036],[-.337,-.037],[-.319,-.105],[-.211,-.104],[-.205,-.114],[-.321,-.114],[-.329,-.101]],.026,steel,.002);
  for(let i=0;i<5;i++)soft.box([-.034,-.09-i*.018,-.169+i*.004],[.004,.004,.036],0x525854,[.11,0,0]);
  metal.link([0,.016,front+.14],[0,.016,front+.02],pistol?.023:.021,pistol?.022:.019,steel,16);
  metal.link([0,.016,front+.037],[0,.016,front-.009],.029,.025,cut,16);
  metal.link([0,.016,front-.009],[0,.016,front-.011],.017,.017,0x13191b,16);
  if(pistol){
    soft.profile(0,[[-.463,-.019],[-.169,-.022],[-.154,-.068],[-.22,-.08],[-.247,-.055],[-.415,-.054]],.071,p.panel);
    metal.box([0,.057,-.448],[.011,.021,.023],steel);metal.box([0,.059,-.441],[.005,.007,.008],0xf2c582);
    for(const x of [-.027,.027])metal.box([x,.057,-.164],[.02,.025,.029],steel);
    mag.box([0,0,0],[.077,.024,.077],dark,[.18,0,0],.005);
  }else{
    const guardEnd=compact?-.61:scout?-.62:kestrel?-.67:-.72;
    body.profile(0,[[guardEnd,.036],[-.495,.05],[-.462,.035],[-.464,-.038],[guardEnd+.017,-.046],[guardEnd,-.024]],.091,kestrel?0x83573c:p.panel);
    for(let i=0;i<(scout?3:compact?3:5);i++){
      const z=guardEnd+.029+i*.032;
      metal.box([-.047,.006,z],[.003,.019,.021],0x20292a,[.18,0,0],.002);
      metal.box([0,.065,-.47+i*.043],[.091,.010,.015],steel);
    }
    metal.link([0,.016,guardEnd],[0,.016,front+.09],scout?.03:.024,scout?.028:.019,steel,16);
    metal.link([0,.016,guardEnd+.017],[0,.016,guardEnd-.017],.037,.034,cut,14);
    if(compact){
      // Collapsible wire stock and exposed guide rods give the SMG a visibly open rear silhouette.
      for(const x of [-.035,.035]){
        metal.link([x,.005,-.219],[x,.005,shoulder-.016],.008,.008,cut,12);
        metal.link([x,-.056,-.13],[x,-.075,shoulder-.012],.007,.007,steel,12);
      }
      soft.profile(0,[[shoulder-.022,.018],[shoulder+.007,.022],[shoulder+.015,-.09],[shoulder-.009,-.101],[shoulder-.025,-.069]],.082,rubber,.003);
      soft.box([0,.014,-.097],[.075,.023,.114],p.panel,[0,0,0],.005);
      for(let i=0;i<4;i++)body.box([-.040,-.007,shoulder-.045-i*.026],[.007,.016,.006],p.accent,[.30,0,0]);
    }else{
     metal.link([0,.001,-.142],[0,.001,shoulder-.01],.027,.025,steel,16);
     soft.profile(0,[[-.116,.027],[shoulder-.029,.022],[shoulder,.002],[shoulder-.008,-.029],[-.104,-.019]],.073,p.panel);
     soft.profile(0,[[-.125,-.019],[-.075,-.020],[shoulder-.035,-.080],[shoulder-.016,-.057],[shoulder-.012,-.113],[shoulder-.043,-.108],[-.086,-.050]],.061,p.panel);
     for(const x of [-.039,.039]){
       for(let i=0;i<3;i++)soft.box([x,.001,shoulder-.052-i*.021],[.003,.035,.005],rubber,[.24,0,0]);
     }
     metal.link([-.040,-.006,shoulder-.05],[-.043,-.006,shoulder-.05],.007,.007,cut,10);
     soft.profile(0,[[shoulder-.022,.022],[shoulder+.008,.013],[shoulder+.011,-.119],[shoulder-.021,-.119]],.084,rubber,.003);
     body.profile(0,[[-.106,.032],[shoulder-.063,.029],[shoulder-.033,.009],[-.079,.007]],.081,p.shell);
    }
    const curve=kestrel?.037:compact?-.027:0;
    mag.profile(0,[[-.051,.067],[.025,.084],[.05,-.076],[.036+curve,-.133],[-.036+curve,-.13],[-.043,-.083]],.059,kestrel?steel:p.panel);
    for(let i=0;i<4;i++)mag.box([-.031,.036-i*.037,-.008+(curve*i/4)],[.004,.006,.061],cut,[.12,0,0]);
    if(scout){
      for(const z of [-.244,-.44])metal.box([0,.091,z],[.059,.076,.034],dark,[0,0,0],.004);
      metal.link([0,.144,-.537],[0,.144,-.181],.037,.038,steel,22);
      metal.link([0,.144,-.177],[0,.144,-.238],.054,.040,steel,24);
      metal.link([0,.144,-.535],[0,.144,-.590],.043,.060,steel,24);
      metal.link([0,.144,-.176],[0,.144,-.175],.045,.045,0x28494b,24);
      metal.link([0,.181,-.365],[0,.209,-.365],.021,.021,cut,12);
    }else if(compact){
      // Two low sight ears and a forward blade retain a clear open sight picture.
      body.profile(0,[[-.33,.061],[-.291,.092],[-.169,.092],[-.15,.077],[-.15,.060]],.046,p.shell);
      for(const x of [-.025,.025])metal.box([x,.105,-.176],[.013,.036,.024],steel,[0,0,-x*4],.003);
      metal.box([0,.083,-.59],[.016,.068,.022],steel,[0,0,0],.002);
      metal.box([0,.111,-.578],[.005,.009,.003],p.accent);
    }else if(!kestrel)fittedSight(metal,-.255,p);
    else{
      metal.box([0,.061,-.284],[.064,.016,.048],dark);
      metal.box([0,.071,front+.085],[.01,.07,.02],steel);
      for(const x of [-.025,.025])metal.box([x,.073,-.284],[.013,.018,.027],steel);
    }
  }
  batch(root,'coated-chassis',body,{...studioSurface('parkerized'),map:surfaceTexture('finish',p.index)});
  batch(root,'machined-hardware',metal,studioSurface('brushedSteel'));
  batch(root,'polymer-furniture',soft,studioSurface('polymer'));
  const magazine=batch(root,'detachable-magazine',mag,studioSurface('gunmetal'));
  const magazineRest:Point=[0,pistol?-.208:-.144,pistol?-.152:compact?-.255:-.327];magazine.position.fromArray(magazineRest);
  const {group,support}=makeHands(pistol);root.add(group);
  return {root,magazine,magazineRest,support,muzzle:front-.038};
}
