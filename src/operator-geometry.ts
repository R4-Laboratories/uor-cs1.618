import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

export type Point = [number,number,number];
export type Tint = T.ColorRepresentation;
type Skin = {joint:number, origin:Point};
const yAxis = new T.Vector3(0,1,0);

/** Bakes small sculpted parts together so stitches, buckles and seams don't each cost a draw. */
export class PartBuilder {
  private parts:T.BufferGeometry[]=[];
  skin?:Skin;
  add(source:T.BufferGeometry, at:Point, dimensions:Point, tint:Tint, rotation:Point=[0,0,0], orient?:T.Quaternion) {
    const geometry=source.index?source.toNonIndexed():source;
    if(source!==geometry)source.dispose();
    const translation=new T.Vector3(...at);
    if(this.skin)translation.add(new T.Vector3(...this.skin.origin));
    const quat=orient??new T.Quaternion().setFromEuler(new T.Euler(...rotation));
    geometry.applyMatrix4(new T.Matrix4().compose(translation,quat,new T.Vector3(...dimensions)));
    const pos=geometry.getAttribute('position'),norm=geometry.getAttribute('normal');
    const baseColor=new T.Color(tint), colors=[],uv=[],joints=[],weights=[];
    for(let i=0;i<pos.count;i++){
      const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i);
      const nx=Math.abs(norm.getX(i)),ny=Math.abs(norm.getY(i)),nz=Math.abs(norm.getZ(i));
      // A physical projection keeps weave size consistent across large and small components.
      uv.push((nx>nz&&nx>ny?z:x)*5,(ny>nz&&ny>nx?z:y)*5);
      colors.push(baseColor.r,baseColor.g,baseColor.b);
      if(this.skin){joints.push(this.skin.joint,0,0,0);weights.push(1,0,0,0);}
    }
    geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));
    geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
    if(this.skin){
      geometry.setAttribute('skinIndex',new T.Uint16BufferAttribute(joints,4));
      geometry.setAttribute('skinWeight',new T.Float32BufferAttribute(weights,4));
    }
    this.parts.push(geometry);
  }
  box(at:Point,size:Point,tint:Tint,rotation:Point=[0,0,0],round=0) {
    const geo=round?new RoundedBoxGeometry(...size,1,round):new T.BoxGeometry(...size);
    this.add(geo,at,[1,1,1],tint,rotation);
  }
  ellipsoid(at:Point,size:Point,tint:Tint,rotation:Point=[0,0,0]){
    this.add(new T.SphereGeometry(1,14,9),at,size,tint,rotation);
  }
  link(a:Point,b:Point,r1:number,r2:number,tint:Tint,sides=12,aspect=1){
    const v=new T.Vector3(...a),w=new T.Vector3(...b),direction=w.clone().sub(v);
    const geometry=new T.CylinderGeometry(r2,r1,direction.length(),sides);
    this.add(geometry,v.lerp(w,.5).toArray() as Point,[1,1,aspect],tint,[0,0,0],new T.Quaternion().setFromUnitVectors(yAxis,direction.normalize()));
  }
  // Sewn volumes use elliptical sections with a slight stagger to catch light on fabric folds.
  garment(at:Point,rings:[number,number,number][],tint:Tint){
    const sides=16,positions:number[]=[],indices:number[]=[];
    for(let j=0;j<rings.length;j++){
      const [y,w,d]=rings[j];
      for(let i=0;i<sides;i++){
        const angle=i*2*Math.PI/sides;
        const fold=1+.035*Math.cos(3*angle+j*.4);
        positions.push(w*fold*Math.cos(angle),y+.008*Math.sin(2*angle+j*.9),d*fold*Math.sin(angle));
        if(j){
          const a=(j-1)*sides+i,b=(j-1)*sides+(i+1)%sides;
          indices.push(a,a+sides,b,b+sides,b,a+sides);
        }
      }
    }
    const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setIndex(indices);geo.computeVertexNormals();
    this.add(geo,at,[1,1,1],tint);
  }
  /** Extruded side profile in local (longitudinal z, height y) coordinates. */
  profile(x:number,points:[number,number][],width:number,tint:Tint,bevel=.003){
    const shape=new T.Shape(points.map(([z,y])=>new T.Vector2(z,y)));
    const geo=new T.ExtrudeGeometry(shape,{depth:width-2*bevel,bevelEnabled:bevel>0,bevelSize:bevel,bevelThickness:bevel,bevelSegments:1,curveSegments:2});
    geo.translate(0,0,-(width-2*bevel)/2);geo.rotateY(-Math.PI/2);
    this.add(geo,[x,0,0],[1,1,1],tint);
  }
  finish(){
    const geometry=mergeGeometries(this.parts)!;
    this.parts.forEach(part=>part.dispose());this.parts=[];
    geometry.computeBoundingSphere();
    return geometry;
  }
}

/** Small generated tiles for bead-blasted alloy, durable paint and woven material. */
export function surfaceTexture(style:'cloth'|'finish',tintSeed=0){
  const size=128,bytes=new Uint8Array(size*size*4);
  let state=1618+tintSeed;
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    state=(Math.imul(state,1664525)+1013904223)>>>0;
    const grain=(state>>>24)/255,idx=(x+y*size)*4;
    const fleck=style==='cloth'
      ? ((x%4===0||y%4===0)?-.10:0)+(((x>>2)^(y>>2))&1)*.039+grain*.085
      : ((x+((y>>3)*2))%53===0?-.055:0)+grain*.085+Math.sin(y/size*Math.PI*24)*.021;
    const stripe=Math.sin(x/size*Math.PI*2+1.6*Math.sin(y/size*Math.PI*4));
    const breakup=Math.cos(y/size*Math.PI*4+Math.sin(x/size*Math.PI*4));
    const patina=style==='finish'?(stripe>.48&&breakup>-.3?-.095:0):
      (stripe+.72*breakup>.73?-.16:stripe+.72*breakup<-.88?.035:0);
    const value=Math.round(235+(fleck+patina)*170);
    bytes[idx]=bytes[idx+1]=bytes[idx+2]=Math.min(255,value);bytes[idx+3]=255;
  }
  const map=new T.DataTexture(bytes,size,size);map.colorSpace=T.SRGBColorSpace;
  map.wrapS=map.wrapT=T.RepeatWrapping;map.magFilter=T.LinearFilter;map.minFilter=T.LinearMipmapLinearFilter;
  map.generateMipmaps=true;map.needsUpdate=true;return map;
}
