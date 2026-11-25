import * as T from 'three';
import {ARCH_GATES, BOXES, GROUND_PATCHES} from '../shared/map';
import {Hardware} from './environment-hardware';
import {studioSurface} from './studio-render';

type Materials=Record<string,T.MeshStandardMaterial>;

/** A radial cut stone. Both flat faces and joint beds participate in sunlight and shadows. */
function archStone(inner:number,outer:number,a:number,b:number,depth:number) {
 const shape=new T.Shape();
 shape.moveTo(inner*Math.cos(a),inner*Math.sin(a));
 shape.absarc(0,0,inner,a,b,false);
 shape.lineTo(outer*Math.cos(b),outer*Math.sin(b));
 shape.absarc(0,0,outer,b,a,true);
 shape.closePath();
 const geometry=new T.ExtrudeGeometry(shape,{depth,bevelEnabled:false,curveSegments:3});
 geometry.translate(0,0,-depth/2);
 return geometry;
}

function arcade(kit:Hardware,x:number,z:number,radius:number,spring:number,m:Materials) {
 const stone=[m.trim,m.concrete,m.trim,m.plaster];
 const flatten=.54;
 const pieces=17;
 for(let i=0;i<pieces;i++){
  const gap=.005;
  const start=i*Math.PI/pieces+gap,end=(i+1)*Math.PI/pieces-gap;
  const key=i===Math.floor(pieces/2);
  const voussoir=archStone(radius,radius+(key?.89:.65),start,end,key?1.51:1.39);
  voussoir.scale(1,flatten,1);
  kit.shaped(voussoir,stone[i%stone.length],x,spring,z);
 }
 for(const side of [-1,1]){
  const px=x+side*(radius+.32);
  kit.box(px,spring-.12,z,.91,.24,1.59,m.trim);
  kit.box(px,.23,z,.82,.46,1.5,m.trim);
 }
}

function tiledGround(scene:T.Scene,kit:Hardware,m:Materials) {
 for(const p of GROUND_PATCHES){
  const ground=new T.PlaneGeometry(p.w,p.d);
  const uv=ground.getAttribute('uv');
  for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*p.w/2.65,uv.getY(i)*p.d/2.65);
  const pavement=new T.Mesh(ground,p.surface==='stone'?m.cobbles:m.dark);
  pavement.rotation.x=-Math.PI/2;pavement.position.set(p.x,.007,p.z);pavement.receiveShadow=true;scene.add(pavement);
  if(p.surface==='metal'){
   for(let i=-p.w/2+.08;i<p.w/2;i+=.17)kit.box(p.x+i,.025,p.z,.043,.029,p.d,m.metal);
   for(const dz of [-.48,0,.48])kit.box(p.x,.029,p.z+p.d*dz,p.w,.035,.047,m.metal);
  }
 }
}

/** Canvas stripes keep a sharp stitched border even where the fabric sags between battens. */
function awning(scene:T.Scene,x:number,z:number,w:number,d:number,y:number,flipped:boolean) {
 const cloth=new T.PlaneGeometry(w,d,24,8);cloth.rotateX(-Math.PI/2);
 const pos=cloth.getAttribute('position');
 for(let i=0;i<pos.count;i++){
  const u=pos.getX(i)/w+.5,v=pos.getZ(i)/d+.5;
  const sag=Math.sin(Math.PI*u)*Math.sin(Math.PI*v);
  pos.setY(i,-.39*sag+(v-.5)*.36+.10*Math.sin(u*3*Math.PI)*v);
 }
 cloth.computeVertexNormals();
 const sheet=document.createElement('canvas');sheet.width=256;sheet.height=64;
 const ink=sheet.getContext('2d')!;
 ink.fillStyle=flipped?'#a85537':'#456c61';ink.fillRect(0,0,256,64);
 ink.fillStyle='#d3b699';ink.fillRect(37,0,48,64);
 ink.fillStyle='#dfc8a7';ink.fillRect(105,0,5,64);ink.fillRect(16,0,5,64);
 for(let j=0;j<64;j+=2){ink.fillStyle='rgba(44,39,24,.13)';ink.fillRect(0,j,256,1);}
 for(let j=0;j<256;j+=3){ink.fillStyle='rgba(230,212,179,.10)';ink.fillRect(j,0,1,64);}
 const tex=new T.CanvasTexture(sheet);tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.repeat.set(w*.75,d);tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=4;
 const skin=new T.MeshStandardMaterial({...studioSurface('oliveFabric'),map:tex,color:0xffffff,side:T.DoubleSide});
 const tarp=new T.Mesh(cloth,skin);tarp.castShadow=true;tarp.receiveShadow=true;tarp.position.set(x,y,z);scene.add(tarp);
}

function dialTexture() {
 const c=document.createElement('canvas');c.width=c.height=256;
 const p=c.getContext('2d')!;
 p.fillStyle='#c8baa0';p.fillRect(0,0,256,256);
 p.translate(128,128);p.lineCap='round';
 p.strokeStyle='#66563e';p.lineWidth=8;p.beginPath();p.arc(0,0,116,0,Math.PI*2);p.stroke();
 for(let tick=0;tick<60;tick++){
  p.rotate(Math.PI/30);p.lineWidth=tick%5===0?4:1;
  p.beginPath();p.moveTo(0,-105);p.lineTo(0,tick%5===0?-87:-99);p.stroke();
 }
 p.fillStyle='#4e493c';p.font='bold 17px serif';p.textAlign='center';p.fillText('MERIDIAN',0,51);
 p.strokeStyle='#30352e';p.lineWidth=7;
 p.beginPath();p.moveTo(-30,-45);p.lineTo(0,0);p.lineTo(66,-32);p.stroke();
 const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=4;
 return new T.MeshStandardMaterial({map:tex,roughness:.80});
}

function customs(scene:T.Scene,kit:Hardware,m:Materials) {
 const terracotta=new T.MeshStandardMaterial({...studioSurface('plaster'),color:0x9b674c});
 const timber=new T.MeshStandardMaterial({...studioSurface('crate'),color:0x584839});
 const shutter=new T.MeshStandardMaterial({...studioSurface('tealPaint'),color:0x567775});
 const copper=new T.MeshStandardMaterial({...studioSurface('copper'),color:0x778573});
 for(const b of BOXES.filter(b=>b.finish==='customs')){
  // Break the massing with a parapet, clay tile courses and recessed upper windows.
  kit.box(b.x,b.h-.14,b.z,b.w+.4,.28,b.d+.38,m.trim);
  kit.box(b.x,b.h+.14,b.z,b.w+.18,.26,b.d+.25,terracotta);
  for(let dz=-b.d/2+.17;dz<b.d/2;dz+=.31){
   kit.beam([b.x-b.w/2-.13,b.h+.32,b.z+dz],[b.x+b.w/2+.13,b.h+.32,b.z+dz],.12,.17,terracotta);
  }
  const side=b.x< -36?1:-1;
  const face=b.x+side*(b.w/2+.025);
  for(let localZ=-b.d/2+1.0;localZ<b.d/2-.6;localZ+=2.6){
   const wz=b.z+localZ,y=b.h*.65;
   kit.box(face,y,wz,.11,1.69,1.18,m.trim);
   kit.box(face+side*.073,y,wz,.045,1.47,.94,m.dark);
   kit.box(face+side*.11,y,wz,.046,1.42,.047,timber);
   for(const off of [-.72,.72]){
    kit.box(face+side*.10,y,wz+off,.09,1.57,.38,shutter);
    for(let s=0;s<5;s++)kit.box(face+side*.16,y-.52+s*.24,wz+off,.035,.045,.36,timber);
   }
   kit.box(face+side*.09,y-.84,wz,.26,.12,1.48,m.trim);
  }
  // Shuttered shop entrances and freight-room doors are mounted to solid walls.
  const doorZ=b.z-.3,doorW=Math.min(2.05,b.d*.37);
  kit.box(face,.18,doorZ,.25,.36,doorW+.48,m.stone);
  kit.box(face,1.39,doorZ,.15,2.75,doorW+.32,m.trim);
  kit.box(face+side*.10,1.36,doorZ,.08,2.54,doorW,m.crate);
  for(const dx of [-1,1]){
   kit.box(face+side*.15,1.35,doorZ+dx*doorW*.49,.09,2.57,.085,timber);
   kit.box(face+side*.15,1.38,doorZ+dx*doorW*.05,.10,2.59,.055,timber);
  }
  for(const dy of [.47,1.19,2.19])kit.box(face+side*.148,dy,doorZ,.07,.11,doorW,timber);
  kit.box(face+side*.20,1.17,doorZ+.14,.12,.08,.22,m.dark);
  kit.box(face+side*.14,2.83,doorZ,.40,.19,doorW+.59,m.trim);
  const wz=doorZ+doorW*.62+.09;
  kit.box(face+side*.20,2.3,wz,.32,.16,.17,m.dark);
  kit.box(face+side*.31,2.09,wz,.24,.36,.19,m.trim);
  kit.box(face+side*.31,1.9,wz,.27,.09,.23,m.dark);
  // Rainwater goods climb the stucco along the street corners.
  kit.tank(face+side*.09,b.h*.49,b.z+b.d*.43,.14,b.h*.98,copper);
 }
 // The central signal arch and the two colonnades read from opposite ends of the quarter.
 for(const g of ARCH_GATES)arcade(kit,g.x,g.z,g.radius,g.spring,m);

 // Clock belfry and shallow terracotta roof over the central customs house.
 const tx=-9,tz=-.75;
 kit.box(tx,7.5,tz,3.4,3.4,3.45,m.plaster);
 for(const [y,w,h] of [[6.35,3.78,.29],[8.67,3.70,.16],[9.15,3.9,.32]])kit.box(tx,y,tz,w,h,w,m.trim);
 const cap=new T.ConeGeometry(2.8,1.9,4,1,false,Math.PI/4);
 kit.shaped(cap,terracotta,tx,10.20,tz);
 kit.tank(tx,11.31,tz,.115,.60,copper);
 const dial=dialTexture(),face=new T.CircleGeometry(.79,48);
 for(const dir of [-1,1]){
  kit.shaped(face,dial,tx,7.65,tz+dir*1.741,dir>0?0:Math.PI);
 }
 // Canvas is slung between the masonry masses, well above the player and the routes.
 awning(scene,-35.6,13.6,8.8,3.75,4.48,true);
 awning(scene,-35.6,18.0,8.8,2.35,4.65,false);
 awning(scene,-21,7.65,5.75,2.9,5.10,true);
 // A short customs marquee marks the split from the old service yard.
 awning(scene,-4.65,13.1,4.6,4.2,4.7,false);
 for(const z of [11.1,15.1]){
  kit.beam([-6.95,5.55,z],[-2.33,4.85,z],.045,.045,timber);
  kit.beam([-6.95,4.63,z],[-2.33,4.63,z],.075,.075,timber);
 }
 for(const z of [11.8,15.45,16.85,19.2]){
  kit.beam([-40.3,4.39,z],[-31.0,4.39,z],.040,.040,timber);
 }
 // The square's collidable cistern plinth supports a patterned sun screen and a copper crown.
 const cx=-40,cz=0;
 kit.box(cx,2.48,cz,4.72,.19,7.10,m.trim);
 for(const dx of [-1.96,1.96])for(const dz of [-2.95,2.95])kit.box(cx+dx,3.35,cz+dz,.17,1.82,.17,copper);
 kit.box(cx,4.25,cz,4.9,.16,7.35,timber);
 for(let z=-3.4;z<=3.4;z+=.5)kit.box(cx,4.39,z,4.9,.09,.21,terracotta);
}

function pumpHall(scene:T.Scene,kit:Hardware,m:Materials) {
 const pipe=new T.MeshStandardMaterial({...studioSurface('copper'),color:0xaa623f});
 const desat=new T.MeshStandardMaterial({...studioSurface('tealPaint'),color:0x638c81});
 const casing=new T.MeshStandardMaterial({...studioSurface('galvanized'),color:0x65716c});
 const lamp=new T.MeshBasicMaterial({color:0xfff1c9});
 const flange=new T.CylinderGeometry(.55,.55,.12,20);
 flange.rotateX(Math.PI/2);
 const trunk=new T.CylinderGeometry(.40,.40,18.5,20);trunk.rotateX(Math.PI/2);
 for(const x of [31.4,40.85]){
  kit.shaped(trunk,pipe,x,5.42,1);
  for(const z of [-7.2,-2.7,1.8,6.3,9.5]){
   kit.shaped(flange,casing,x,5.42,z);
   kit.box(x,5.96,z,.085,.64,.19,m.metal);
  }
 }
 for(const b of BOXES.filter(b=>b.finish==='pump'&&b.h>4)){
  const side=b.x<35?1:-1,face=b.x+side*(b.w/2+.025);
  kit.box(b.x,b.h,b.z,b.w+.38,.23,b.d+.32,m.trim);
  kit.box(face,b.h-.82,b.z,.12,1.16,b.d-.37,m.dark);
  kit.box(face+side*.07,b.h-.80,b.z,.07,.84,b.d-.55,m.glass);
  for(let dz=-b.d/2+.62;dz<b.d/2;dz+=.71)kit.box(face+side*.09,b.h-.80,b.z+dz,.09,.96,.075,casing);
  // Galvanized inspection doors, rubber seals and the lower crash rail break up tall metal faces.
  const dz=b.z-.25;
  kit.box(face,1.49,dz,.12,2.97,2.53,m.dark);
  kit.box(face+side*.08,1.46,dz,.07,2.77,2.31,casing);
  for(const edge of [-1,1])kit.box(face+side*.13,1.45,dz+edge*1.13,.07,2.81,.076,pipe);
  kit.box(face+side*.13,2.88,dz,.15,.14,2.52,pipe);
  kit.box(face+side*.17,1.85,dz,.07,.47,.98,m.dark);
  for(let j=0;j<4;j++)kit.box(face+side*.20,1.68+j*.11,dz,.05,.04,.88,casing);
  kit.box(face+side*.18,1.09,dz+.76,.11,.065,.29,m.dark);
  for(const oz of [-.36,.36])kit.box(face+side*.13,.64,dz+oz*b.d,.21,.15,b.d*.24,pipe);
  for(const dz of [-b.d*.39,b.d*.39])kit.box(face+side*.07,b.h*.46,b.z+dz,.20,b.h*.92,.26,desat);
 }
 // The brown roof framing carries the elevated feed lines, with illuminated service lamps under the ribs.
 for(const z of [-7.7,-3.3,1.0,5.3,9.7]){
  kit.box(36,5.91,z,17.05,.20,.19,pipe);
  for(let i=0;i<8;i++){
   const x=27.7+i*2.07;
   kit.beam([x,5.99,z],[x+2.07,6.25,z],.08,.08,casing);
  }
  kit.box(36,5.80,z,1.95,.10,.36,m.dark);
  kit.box(36,5.70,z,1.76,.07,.27,lamp);
 }
 for(const b of BOXES.filter(b=>b.finish==='pump'&&b.h<4)){
  kit.box(b.x,b.h+.02,b.z,b.w+.13,.14,b.d+.13,casing);
  const left=b.x - b.w/2-.025;
  for(const dz of [-b.d*.32,0,b.d*.32]){
   kit.box(left,b.h*.52,b.z+dz,.12,b.h*.58,b.d*.23,m.dark);
   for(let i=0;i<7;i++)kit.box(left-.065,b.h*.31+i*.15,b.z+dz,.065,.045,b.d*.20,desat);
  }
  // Cylindrical motor housing sits on its solid base.
  kit.tank(b.x,b.h+.38,b.z,1.38,.76,desat);
  for(const y of [.15,.28,.41,.54])kit.tank(b.x,b.h+y,b.z,1.43,.04,casing);
 }
 const wheel=new T.TorusGeometry(.41,.045,8,32);
 for(const [x,z] of [[32.3,4.06],[41.7,-1.43]]){
  kit.shaped(wheel,pipe,x,1.42,z);
  for(const angle of [0,Math.PI/3,2*Math.PI/3]){
   const dx=.38*Math.cos(angle),dy=.38*Math.sin(angle);
   kit.beam([x-dx,1.42-dy,z],[x+dx,1.42+dy,z],.044,.044,pipe);
  }
 }
 // Place the station name on the brick end wall facing the eastern spawn approach.
 const sheet=document.createElement('canvas');sheet.width=512;sheet.height=192;
 const p=sheet.getContext('2d')!;
 p.fillStyle='#203b3a';p.fillRect(0,0,512,192);
 p.strokeStyle='#97a79a';p.lineWidth=4;p.strokeRect(8,8,496,176);
 p.font='bold 29px sans-serif';p.fillStyle='#ccddd0';p.fillText('MERIDIAN  /  WATERWORKS',25,54);
 p.font='bold 82px sans-serif';p.fillStyle='#e0bc70';p.fillText('INTAKE 03',21,143);
 const tex=new T.CanvasTexture(sheet);tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=4;
 const sign=new T.Mesh(new T.PlaneGeometry(4.9,1.84),new T.MeshStandardMaterial({map:tex,roughness:.7}));
 sign.position.set(42,3.55,17.53);scene.add(sign);
}

export function buildCustomsQuarter(scene:T.Scene,kit:Hardware,materials:Materials){
 tiledGround(scene,kit,materials);
 customs(scene,kit,materials);
 pumpHall(scene,kit,materials);
}
