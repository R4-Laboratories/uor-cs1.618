import * as T from 'three';
import {BOXES, MAP} from '../shared/map';
import {Hardware} from './environment-hardware';
import {buildCustomsQuarter} from './environment-quarter';

function roadPaint(scene:T.Scene) {
  // One decal atlas in map space: wear, contact at the wall foot, gratings and lane stripes.
  const canvas=document.createElement('canvas');canvas.width=canvas.height=1024;
  const c=canvas.getContext('2d')!;
  const scale=canvas.width/(MAP.halfWidth*2);
  c.scale(scale,canvas.height/(MAP.halfDepth*2)); c.translate(MAP.halfWidth,MAP.halfDepth);
  for (const b of BOXES) {
    if (b.y!==0) continue;
    c.fillStyle='rgba(39,34,26,.42)';
    c.shadowColor='rgba(34,34,30,.75)'; c.shadowBlur=scale*.35;
    c.fillRect(b.x-b.w/2,b.z-b.d/2,b.w,b.d);
  }
  c.shadowBlur=0;c.shadowColor='transparent';
  c.fillStyle='#ddcaa294';
  for (const x of [-5.6,5.6]) {
    c.fillRect(x,3,.1,22);
    for(let z=11;z<25;z+=3)c.fillRect(x<0?x-.45:x+.4,z,.09,1.5);
  }
  for(const x of [-20.7,20.7]){
    c.fillStyle='#dbcda794';
    for(let z=18;z<22;z+=.52)c.fillRect(x-1.45,z,2.9,.24);
  }
  for(const x of [-6.6,6.6,-25.3,25.3]) {
    c.fillStyle='#434a4999';c.fillRect(x-.15,-18,.30,37);
    c.fillStyle='#1f2828c4';
    for(let z=-18;z<19;z+=.16)c.fillRect(x-.12,z,.24,.05);
  }
  // Chip the paint deterministically. The same map renders identically on every client.
  let seed=1618;
  const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
  c.globalCompositeOperation='destination-out';
  c.fillStyle='rgba(255,255,255,.7)';
  for(let i=0;i<12000;i++)c.fillRect((random()*2-1)*MAP.halfWidth,(random()*2-1)*MAP.halfDepth,.035+random()*.10,.04);
  const tex=new T.CanvasTexture(canvas);tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=4;
  const decal=new T.Mesh(new T.PlaneGeometry(2*MAP.halfWidth,2*MAP.halfDepth),new T.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1}));
  decal.rotation.x=-Math.PI/2; decal.position.y=.012;scene.add(decal);
}

/** Both site perimeters share a draw call. Mesh edges stay sharp underfoot. */
function sitePerimeters(scene:T.Scene) {
  const positions:number[]=[], colors:number[]=[], indices:number[]=[];
  const dashes=28, arcSteps=4;
  for (const site of MAP.sites) {
    const color=new T.Color(site.id==='A'?0xe6a454:0x69b5b6);
    for(let dash=0;dash<dashes;dash++) {
      const first=positions.length/3;
      for(let i=0;i<=arcSteps;i++) {
        const angle=2*Math.PI*(dash+.75*i/arcSteps)/dashes;
        for(const radius of [site.radius-.23,site.radius]) {
          positions.push(site.x+radius*Math.cos(angle),.018,site.z+radius*Math.sin(angle));
          colors.push(color.r,color.g,color.b);
        }
        if(i<arcSteps){
          const j=first+2*i;
          indices.push(j,j+2,j+1,j+1,j+2,j+3);
        }
      }
    }
  }
  const geometry=new T.BufferGeometry();
  geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));
  geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));
  geometry.setIndex(indices);
  const paint=new T.MeshBasicMaterial({vertexColors:true,transparent:true,opacity:.86,depthWrite:false});
  const rings=new T.Mesh(geometry,paint);
  rings.name='Painted site perimeters';
  rings.renderOrder=1;
  scene.add(rings);
}

/** Industrial silhouette and functional details all sit on walls, rooftops or beyond the arena. */
export function buildMeridianYard(scene:T.Scene, mats:Record<string,T.MeshStandardMaterial>) {
  const kit=new Hardware();
  const shell=mats.trim,frame=mats.dark,steel=mats.metal,glass=mats.glass;
  const amber=new T.MeshStandardMaterial({color:0xaf6838,roughness:.66,metalness:.28});
  const conduit=new T.MeshStandardMaterial({color:0xb6beb6,roughness:.59,metalness:.46});
  const pearl=new T.MeshStandardMaterial({color:0xe2d9bc,roughness:.67});
  const lit=new T.MeshBasicMaterial({color:0xffe5b5});
  for(const sign of [-1,1]){
    const blockX=sign*12, siteColor=sign<0?amber:mats.teal;
    // A sawtooth clerestory and sheet-metal fascia cap each southern warehouse.
    for(const z of [9,13,17]){
      kit.box(blockX,7.32,z,9.85,.65,2.55,frame);
      kit.box(blockX,7.43,z+1.29,9.45,.35,.045,glass);
      kit.beam([blockX,7.68,z+1.32],[blockX,7.05,z-1.4],9.94,.11,steel);
      for(const dx of [-3.2,-1.3,.6,2.5])kit.box(blockX+dx,7.4,z+1.32,.065,.43,.07,conduit);
    }
    kit.box(blockX,6.2,19.04,9.9,.49,.08,siteColor);
    kit.box(blockX,3.32,19.06,9.85,.11,.15,steel);
    for(const x of [blockX-4.65,blockX+4.65]){
      kit.box(x,2.75,19.075,.13,5.45,.11,conduit);
      for(let y=.7;y<5.5;y+=1.35)kit.box(x,y,19.09,.23,.075,.18,frame);
    }
    // Industrial loading doors face the main route, recessed into the facade visually.
    const face=sign*6.96;
    for(const z of [10.1,15.65]){
      kit.box(face,1.68,z,.09,3.35,3.4,frame);
      kit.box(face-sign*.055,1.6,z,.055,3.1,3.11,steel);
      for(let y=.26;y<3.18;y+=.23)kit.box(face-sign*.09,y,z,.04,.045,3.10,frame);
      kit.box(face-sign*.12,3.55,z,.29,.21,3.62,conduit);
      kit.box(face-sign*.18,3.91,z,.31,.13,.75,frame);
      kit.box(face-sign*.22,3.84,z,.22,.04,.57,lit);
      kit.box(face-sign*.1,.75,z-1.75,.19,1.5,.13,siteColor);
    }
    // Monitor windows on the high service cores leave the lower walls uncluttered.
    const core=sign*9;
    for (const side of [-1,1]){
      const z=-1+side*4.035;
      kit.box(core,4.32,z,6.9,1.37,.11,frame);
      kit.box(core,4.35,z+side*.07,6.58,1.10,.05,glass);
      for(let i=-3;i<=3;i++)kit.box(core+i,4.32,z+side*.12,.075,1.23,.07,steel);
      kit.box(core,3.61,z+side*.03,7.05,.12,.25,conduit);
    }
    // Tank drums beyond the seawall carry reinforcing hoops and a shared service catwalk.
    for(const z of [-23,-8]){
      const x=sign*56; const d=10;
      kit.tank(x,5.4,z,d,10.8,pearl);
      for(const y of [1.2,5.4,10.5])kit.tank(x,y,z,d+.12,.16,steel);
      kit.tank(x,10.95,z,d-.45,.35,conduit);
      kit.tank(x,11.5,z,1,.85,frame);
    }
    // Painted overhead shelter trusses on the pre-existing side walkways.
    const cx=sign*21;
    for(const offset of [-2.9,2.9])kit.box(cx+offset,5.40,5.45,.16,.44,14.45,steel);
    for(const z of [-1,5,11]){
      kit.beam([cx-3,5.2,z],[cx,5.82,z],.14,.15,steel);
      kit.beam([cx,5.82,z],[cx+3,5.2,z],.14,.15,steel);
      kit.box(cx,5.13,z,6.1,.16,.18,frame);
      for(const offset of [-2,-1,0,1,2])kit.box(cx+offset,5.27,z,.08,.31,.12,conduit);
    }
  }
  // The low metal collider at the first intersection reads as a service cabinet.
  // All relief sits flush against its collision envelope.
  const cabinet=BOXES.find(b=>b.material==='metal');
  if(cabinet){
    const {x,z,w,h,d}=cabinet;
    kit.box(x,h-.02,z,w+.035,.10,d+.035,frame);
    kit.box(x,.075,z,w+.018,.15,d+.018,frame);
    for(const side of [-1,1]){
      const faceZ=z+side*(d/2+.008);
      kit.box(x,h*.52,faceZ,1.69,.73,.035,frame);
      for(const dx of [-.43,.43]){
        kit.box(x+dx,h*.52,faceZ+side*.02,.80,.65,.03,steel);
        for(let k=0;k<5;k++)kit.box(x+dx,h*.60+k*.038,faceZ+side*.045,.57,.016,.012,frame);
        kit.box(x+dx+.25,h*.42,faceZ+side*.04,.032,.12,.018,frame);
        kit.box(x+dx-.16,h*.39,faceZ+side*.05,.22,.11,.014,amber);
      }
    }
  }
  // A harbor container crane behind the northern ridge: the crane is a distant landmark.
  for(const [cx,cz] of [[-24,-46],[36,-54]]){
    const top=19;
    for(const dx of [-3,3])for(const dz of [-2,2]) {
      kit.beam([cx+dx*1.6,4,cz+dz*1.4],[cx+dx,top,cz+dz],.45,.48,amber);
    }
    for(const dz of [-2,2]){
      kit.beam([cx-4,8,cz+dz],[cx+3,top-1,cz+dz],.19,.21,amber);
      kit.beam([cx+4,8,cz+dz],[cx-3,top-1,cz+dz],.19,.21,amber);
    }
    kit.box(cx+5,top,cz,23,.40,4.7,amber);
    for(const dz of [-2.26,2.26]){
      kit.box(cx+5,top+.93,cz+dz,23,.14,.14,amber);
      for(let j=0;j<12;j++){
        const x=cx-6.45+j*1.9;
        kit.beam([x,top+(j%2?.20:.92),cz+dz],[x+1.9,top+(j%2?.92:.20),cz+dz],.105,.12,amber);
      }
    }
    kit.box(cx,top+1.23,cz,5,2.25,3.5,shell);
    kit.box(cx+1.2,top+1.48,cz+1.79,1.95,1,.11,glass);
    kit.beam([cx,top+5.5,cz],[cx+16.4,top+.2,cz],.12,.14,steel);
    kit.beam([cx,top+5.5,cz],[cx-6.1,top+.2,cz],.14,.14,steel);
    kit.box(cx,top+2.8,cz,.30,5.6,.34,amber);
    for(const dx of [11,13])kit.box(cx+dx,top-2.5,cz,.055,4.8,.085,frame);
    kit.box(cx+12,top-4.95,cz,3.4,.28,1.3,amber);
  }
  buildCustomsQuarter(scene,kit,mats);
  kit.finish(scene);
  roadPaint(scene);
  sitePerimeters(scene);
}
