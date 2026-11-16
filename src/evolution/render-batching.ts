import * as T from 'three';
export interface BatchPolicy {cell:number;minimum:number;}
/** Transactional static-only projection. Original scenery stays available for rollback. */
export function applyStaticBatching(scene:T.Scene,policy:BatchPolicy):()=>void{
 if(!Number.isFinite(policy.cell)||policy.cell<0||!Number.isInteger(policy.minimum)||policy.minimum<2)throw Error('Invalid batching policy');
 if(policy.cell===0)return ()=>{};
 scene.updateMatrixWorld(true);
 const groups=new Map<string,T.Mesh[]>(),batches:T.InstancedMesh[]=[],hidden:T.Mesh[]=[];
 scene.traverse(object=>{
  if(!(object instanceof T.Mesh)||object instanceof T.InstancedMesh||!object.userData.staticScenery||!object.visible||Array.isArray(object.material)||object.material.transparent)return;
  if(!object.matrixWorld.elements.every(Number.isFinite))throw Error('Nonfinite scenery transform');
  const e=object.matrixWorld.elements;
  const key=[object.geometry.uuid,object.material.uuid,object.castShadow,object.receiveShadow,Math.floor(e[12]/policy.cell),Math.floor(e[14]/policy.cell)].join(':');
  const group=groups.get(key)??[];group.push(object);groups.set(key,group);
 });
 let undone=false;
 const undo=()=>{if(undone)return;undone=true;for(const mesh of hidden)mesh.visible=true;for(const batch of batches){scene.remove(batch);batch.dispose();}};
 try{
  for(const group of groups.values()){
   if(group.length<policy.minimum)continue;
   const first=group[0],batch=new T.InstancedMesh(first.geometry,first.material,group.length);
   batches.push(batch);batch.name='evolved-static-batch';batch.userData.evolutionBatch=true;batch.castShadow=first.castShadow;batch.receiveShadow=first.receiveShadow;
   group.forEach((mesh,index)=>batch.setMatrixAt(index,mesh.matrixWorld));batch.instanceMatrix.needsUpdate=true;batch.computeBoundingBox();batch.computeBoundingSphere();
   // Visibility changes only after this complete group's instance buffers exist.
   for(const mesh of group){mesh.visible=false;hidden.push(mesh);}scene.add(batch);
  }
  return undo;
 }catch(error){undo();throw error;}
}
/** Canonical expanded static-scene inventory, independent of draw-call grouping. */
export function sceneryInventory(scene:T.Scene){
 scene.updateMatrixWorld(true);const rows:string[]=[],matrix=new T.Matrix4();
 scene.traverseVisible(object=>{
  if(!(object instanceof T.Mesh)||(!object.userData.staticScenery&&!object.userData.evolutionBatch))return;
  const material=Array.isArray(object.material)?object.material.map(m=>m.uuid):object.material.uuid;
  const record=(elements:number[])=>rows.push(JSON.stringify([object.geometry.uuid,material,object.castShadow,object.receiveShadow,elements.map(Math.fround)]));
  if(object instanceof T.InstancedMesh){for(let i=0;i<object.count;i++){object.getMatrixAt(i,matrix);matrix.premultiply(object.matrixWorld);record(matrix.elements);}}
  else record(object.matrixWorld.elements);
 });return rows.sort();
}
