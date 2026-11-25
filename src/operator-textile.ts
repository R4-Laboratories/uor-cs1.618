import * as T from 'three';

/** Periodic twill with crossing yarns. One color/normal pair serves both teams. */
export function operatorTextile() {
  const size=128, color=new Uint8Array(size*size*4), normal=new Uint8Array(color.length);
  const heights=new Float32Array(size*size);
  for(let y=0;y<size;y++){
    for(let x=0;x<size;x++){
      const i=y*size+x;
      const warp=.5-.5*Math.cos(2*Math.PI*(x+.22*Math.sin(y*Math.PI/8))/8);
      const weft=.5-.5*Math.cos(2*Math.PI*(y+.18*Math.sin(x*Math.PI/8))/8);
      const over=((x>>3)+3*(y>>3))%4<2;
      heights[i]=over ? warp*.8+weft*.2 : warp*.2+weft*.8;
      const dye=Math.sin(x*2*Math.PI/size)*Math.cos(y*4*Math.PI/size)*3;
      const value=Math.round(227+12*heights[i]+dye);
      color.fill(value,i*4,i*4+3);
      color[i*4+3]=255;
    }
  }
  for(let y=0;y<size;y++){
    for(let x=0;x<size;x++){
      const i=(y*size+x)*4;
      const dx=heights[y*size+(x+size-1)%size]-heights[y*size+(x+1)%size];
      const dy=heights[((y+size-1)%size)*size+x]-heights[((y+1)%size)*size+x];
      const scale=1/Math.hypot(dx,dy,1);
      normal[i]=Math.round(127.5*(1+dx*scale));
      normal[i+1]=Math.round(127.5*(1+dy*scale));
      normal[i+2]=Math.round(127.5*(1+scale));
      normal[i+3]=255;
    }
  }
  function tile(bytes:Uint8Array<ArrayBuffer>){
    const map=new T.DataTexture(bytes,size,size);
    map.wrapS=map.wrapT=T.RepeatWrapping;
    map.repeat.set(1.75,1.75);map.generateMipmaps=true; map.minFilter=T.LinearMipmapLinearFilter; map.magFilter=T.LinearFilter;
    map.needsUpdate=true;
    return map;
  }
  const map=tile(color), normalMap=tile(normal);
  map.colorSpace=T.SRGBColorSpace;
  map.name='Field uniform twill';normalMap.name='Twill yarn normals';
  return {map,normalMap,normalScale:new T.Vector2(.16,.16)};
}
