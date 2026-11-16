import * as T from 'three';
import type {HdAsset} from '../shared/engine';
export type HdLoader=(lod:number)=>Promise<HdAsset[]>;
/** Exterior detail is visual only; it never inserts unmatched cover into the multiplayer map. */
export class HdLayer {
 readonly group=new T.Group();private serial=0;private released=false;
 diagnostics={lod:-1,triangles:0,status:'loading',error:''};
 constructor(scene:T.Scene,private load:HdLoader){this.group.name='verdant-hd-exterior';scene.add(this.group);}
 async setLod(lod:number){
  if(!Number.isInteger(lod)||lod<0||lod>4)throw new RangeError('Invalid HD LOD');
  const serial=++this.serial;this.diagnostics.status='loading';
  try{
   const assets=await this.load(lod);if(this.released||serial!==this.serial)return;
   const geometries=assets.map(a=>{const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(a.positions.flat(),3));g.setAttribute('normal',new T.Float32BufferAttribute(a.normals.flat(),3));g.setAttribute('uv',new T.Float32BufferAttribute(a.uvs.flat(),2));g.setAttribute('color',new T.Float32BufferAttribute(a.colors.map(c=>c.slice(0,3)).flat(),3));g.setIndex(a.indices);g.computeBoundingSphere();return g;});
   this.clear();const material=new T.MeshStandardMaterial({vertexColors:true,roughness:.88,metalness:.02});
   // Hall north of defender spawn, two bridges and six canopy silhouettes outside the boundary walls.
   const placements=[[0,0,0,-43,0],[1,-43,0,0,Math.PI/2],[1,43,0,0,Math.PI/2],
    [2,-35,0,-20,0],[2,35,0,-20,0],[2,-35,0,15,0],[2,35,0,15,0],[2,-18,0,36,0],[2,18,0,36,0]];
   for(const [kind,x,y,z,rotation]of placements){const m=new T.Mesh(geometries[kind],material);m.position.set(x,y,z);m.rotation.y=rotation;m.receiveShadow=true;this.group.add(m);}
   this.diagnostics={lod,triangles:placements.reduce((n,p)=>n+assets[p[0]].indices.length/3,0),status:'ready',error:''};
  }catch(error){if(serial===this.serial&&!this.released){this.diagnostics.status='failed';this.diagnostics.error=String(error);}throw error;}
 }
 private clear(){const geometry=new Set<T.BufferGeometry>(),materials=new Set<T.Material>();for(const child of this.group.children){const m=child as T.Mesh;geometry.add(m.geometry);materials.add(m.material as T.Material);}this.group.clear();geometry.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());}
 dispose(){this.released=true;this.serial++;this.clear();this.group.removeFromParent();}
}
/** One bounded request per detail transition; worker owns generation and caches no mesh copies. */
export function createHdLoader(){
 const worker=new Worker(new URL('./hd-worker.ts',import.meta.url),{type:'module'});
 let serial=0;let unavailable:Error|null=null;const pending=new Map<number,{resolve:(v:HdAsset[])=>void;reject:(e:Error)=>void}>();
 worker.onmessage=({data})=>{const p=pending.get(data.id);if(!p)return;pending.delete(data.id);if(data.error)p.reject(new Error(data.error));else p.resolve(data.assets);};
 const fail=(error:Error)=>{unavailable=error;worker.terminate();for(const p of pending.values())p.reject(error);pending.clear();};
 worker.onerror=e=>{e.preventDefault();fail(new Error(e.message));};
 worker.onmessageerror=()=>fail(new Error('HD worker response could not be decoded'));
 return {load:(lod:number)=>new Promise<HdAsset[]>((resolve,reject)=>{if(unavailable){reject(unavailable);return;}const id=++serial;pending.set(id,{resolve,reject});worker.postMessage({id,lod,engineUrl:new URL('wasm/cs_verdant.wasm',document.baseURI).href});}),dispose:()=>fail(new Error('HD worker closed'))};
}
