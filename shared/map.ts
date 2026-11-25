/** Meridian's customs quarter, relay yard and coastal pumping station. */
export interface Box {
 id:string; x:number; y:number; z:number; w:number; h:number; d:number;
 material:'stone'|'plaster'|'teal'|'crate'|'metal';
 finish?:'plain'|'customs'|'pump';
 surface?:'limewash';
}
export const MAP={
 name:'Meridian',subtitle:'Coastal customs quarter',half:45,halfWidth:45,halfDepth:27,
 sites:[{id:'A',x:-17,z:-14,radius:4.2},{id:'B',x:17,z:-14,radius:4.2}],
 spawns:{
  attack:[[-5,22],[-21,22],[0,22],[21,22],[5,22]],
  defend:[[-5,-23],[-25,-23],[0,-23],[25,-23],[5,-23]],
 },
} as const;

/** Entry and contact anchors are centered on clear navigation cells. */
export const MAP_LANES=[
 {id:'customs',entry:{x:-35,z:19},contact:{x:-35,z:-1},site:'A'},
 {id:'west',entry:{x:-21,z:15},contact:{x:-17,z:-5},site:'A'},
 {id:'mid',entry:{x:1,z:13},contact:{x:1,z:1},site:'mid'},
 {id:'east',entry:{x:23,z:13},contact:{x:19,z:-3},site:'B'},
 {id:'pumps',entry:{x:37,z:19},contact:{x:37,z:-3},site:'B'},
] as const;
export const MAP_DEFEND_HOLDS={
 A:[{x:-17,z:-19},{x:-25,z:-5},{x:-35,z:-13}],
 B:[{x:17,z:-19},{x:25,z:-5},{x:37,z:-15}],
} as const;

export const ARCH_GATES=[
 {x:0,z:2.12,radius:4.78,spring:3.15,top:6.45},
 {x:-35.6,z:10,radius:4.62,spring:2.81,top:5.86},
 {x:-35.6,z:-9,radius:5.32,spring:2.43,top:5.90},
] as const;

let n=0;
const box=(x:number,z:number,w:number,d:number,h=5,material:Box['material']='plaster',y=0,finish?:Box['finish']):Box=>({id:`m${n++}`,x,y,z,w,h,d,material,finish});
export const BOXES:Box[]=[
 box(0,-28,94,2,7,'stone'),box(0,28,94,2,7,'stone'),
 box(-46,0,2,54,7,'stone'),box(46,0,2,54,7,'stone'),
 {...box(-12,13,10,12,7),surface:'limewash'},box(12,13,10,12,7),
 box(-9,-1,8,8,6,'stone'),box(9,-1,8,8,6,'stone'),
 box(-16,-22,12,3,5),box(16,-22,12,3,5),
 box(-6,-13,4,10,7),box(6,-13,4,10,7),
 box(-23,-12,3,9,5,'teal'),box(23,-12,3,9,5,'teal'),
 box(0,-6,3,3,2.5,'stone'),
 box(-19,1,3,3,2.6,'crate'),box(20,5,3,4,2.6,'crate'),
 box(-18,-14,3,3,2,'crate'),box(-13,-17,2.5,2.5,2.8,'crate'),
 box(18,-14,3,3,2,'crate'),box(13,-10,2.5,2.5,2.8,'crate'),
 box(-1,8,2.5,2.5,1.2,'crate'),box(3,16,2,2,1.1,'metal'),
 box(-24,17,2,6,2,'stone'),box(24,17,2,6,2,'stone'),
 // Customs Square. Four landings connect the arcade to the relay yard.
 box(-29.5,12,5,10,6.6,'plaster',0,'customs'),
 box(-41.8,14.75,4.8,11.5,5.5,'plaster',0,'customs'),
 box(-40,0,4.6,7,2.45,'stone',0,'plain'),
 box(-29.5,-2.5,5,5,5.7,'plaster',0,'customs'),
 box(-29.5,-14,5,5,5.2,'stone',0,'customs'),
 box(-42,-17,4.6,8,7,'plaster',0,'customs'),
 // Pump Hall. The machinery and exterior gallery have two ground-level exits.
 box(29.5,12,5.5,10,6.6,'teal',0,'pump'),
 box(42,13,4.8,9,6.1,'teal',0,'pump'),
 box(33,1,4.4,6,2.35,'metal',0,'pump'),
 box(42,-5,4.6,7,3.1,'metal',0,'pump'),
 box(29.5,-11,5.5,7,5.9,'teal',0,'pump'),
 box(41,-18,5.2,6,6.1,'teal',0,'pump'),
 // Overhead galleries also stop authoritative shots. Their lowest trim clears jumping players.
 box(36,1,17,18,.26,'metal',6.26,'plain'),
 ...ARCH_GATES.flatMap(({x,z,radius,spring,top})=>{
  // A segmented masonry lintel keeps movement and shots consistent with its visible arch.
  const pieces:Box[]=[];
  for(const side of [-1,1])pieces.push(box(x+side*(radius+.32),z,.64,1.4,spring,'stone',0,'plain'));
  const columns=15,width=2*radius/columns;
  for(let i=0;i<columns;i++){
   const offset=(i+.5)*width-radius;
   const sill=spring+.54*Math.sqrt(radius*radius-offset*offset);
   pieces.push(box(x+offset,z,width,1.18,top-sill,'stone',sill,'plain'));
  }
  return pieces;
 }),
];

export const WAYPOINTS = [
 [0,22],[0,14],[0,4],[0,0],[-3,-6],[3,-6],[0,-13],[0,-23],
 [-21,22],[-21,10],[-21,5],[-17,-6],[-17,-10],[-17,-18],[-9,-19],
 [21,22],[21,12],[21,0],[18,-6],[18,-10],[18,-18],[9,-19],
 [-4,5],[4,5],[-16,6],[16,6],[-9,-7],[9,-7],
] as const;

export interface GroundPatch {x:number; z:number; w:number; d:number; surface:'stone'|'metal'}
export const GROUND_PATCHES:readonly GroundPatch[]=[
 {x:-35.25,z:0,w:19.5,d:54,surface:'stone'},
 {x:35.75,z:0,w:18.5,d:3.2,surface:'metal'},
 {x:35.75,z:-9.75,w:18.5,d:1.4,surface:'metal'},
 {x:35.75,z:9.75,w:18.5,d:1.4,surface:'metal'},
];
export function groundSurfaceAt(x:number,z:number):'asphalt'|'stone'|'metal'{
 return GROUND_PATCHES.find(p=>Math.abs(x-p.x)<=p.w/2&&Math.abs(z-p.z)<=p.d/2)?.surface??'asphalt';
}
export function zoneAt(x:number,z:number):string {
 if(x< -26)return z>7?'CUSTOMS ARCADE':z< -9?'WEST LANDING':'CUSTOMS SQUARE';
 if(x>26)return z>9?'INTAKE YARD':z< -9?'EAST LANDING':'PUMP HALL';
 if(z>18)return 'ATTACKER SPAWN'; if(z< -21)return 'DEFENDER SPAWN';
 if(z< -8 && x< -9)return 'SITE A';if(z< -8 && x>9)return 'SITE B';
 if(x< -14)return 'WEST WALK';if(x>14)return 'EAST ARCADE';return 'MID COURT';
}
