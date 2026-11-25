import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

/** Face-mounted trim and distant structures share instanced batches across the yard. */
export class Hardware {
  private bins = new Map<T.BufferGeometry, Map<T.Material,T.Matrix4[]>>();
  private readonly shapedPieces=new Map<T.Material,T.BufferGeometry[]>();
  private readonly cube = new T.BoxGeometry();
  private readonly round = new T.CylinderGeometry(.5,.5,1,20);
  private add(shape:T.BufferGeometry, material:T.Material, object:T.Object3D) {
    let bin = this.bins.get(shape);
    if (!bin) this.bins.set(shape,bin=new Map());
    let instances=bin.get(material);
    if (!instances) bin.set(material,instances=[]);
    object.updateMatrix();
    instances.push(object.matrix);
  }
  box(x:number,y:number,z:number,w:number,h:number,d:number,m:T.Material) {
    const o=new T.Object3D();
    o.position.set(x,y,z); o.scale.set(w,h,d);
    this.add(this.cube,m,o);
  }
  tank(x:number,y:number,z:number,diameter:number,height:number,m:T.Material) {
    const o=new T.Object3D();
    o.position.set(x,y,z); o.scale.set(diameter,height,diameter);
    this.add(this.round,m,o);
  }
  beam(a:[number,number,number],b:[number,number,number],w:number,d:number,m:T.Material) {
    const from=new T.Vector3(...a),to=new T.Vector3(...b);
    const vector=to.clone().sub(from), o=new T.Object3D();
    o.position.copy(from).lerp(to,.5);
    o.scale.set(w,vector.length(),d);
    o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),vector.normalize());
    this.add(this.cube,m,o);
  }
  shaped(geometry:T.BufferGeometry, material:T.Material, x:number,y:number,z:number, rotationY=0, scale=1) {
    const piece=geometry.index?geometry.toNonIndexed():geometry.clone();
    piece.scale(scale,scale,scale);piece.rotateY(rotationY);piece.translate(x,y,z);
    let group=this.shapedPieces.get(material);
    if(!group)this.shapedPieces.set(material,group=[]);
    group.push(piece);
  }
  finish(scene:T.Scene) {
    for(const [material,pieces] of this.shapedPieces){
      const mesh=new T.Mesh(mergeGeometries(pieces)!,material);
      mesh.castShadow=true;mesh.receiveShadow=true;mesh.name='Street fittings';
      scene.add(mesh);pieces.forEach(g=>g.dispose());
    }
    this.shapedPieces.clear();
    for (const [geometry,materials] of this.bins) for (const [material,poses] of materials) {
      const batch=new T.InstancedMesh(geometry,material,poses.length);
      batch.name='Meridian architecture'; batch.castShadow=true; batch.receiveShadow=true;
      poses.forEach((matrix,i)=>batch.setMatrixAt(i,matrix));
      batch.computeBoundingSphere();
      scene.add(batch);
    }
  }
}
