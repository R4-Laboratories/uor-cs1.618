/** Original map: a coastal relay station, two courtyards connected by three lanes. */
export interface Box { id:string; x:number;y:number;z:number;w:number;h:number;d:number;material:'stone'|'plaster'|'teal'|'crate'|'metal'; }
export const MAP = {name:'Meridian',subtitle:'Coastal relay station',half:27,sites:[{id:'A',x:-17,z:-14,radius:4.2},{id:'B',x:17,z:-14,radius:4.2}],spawns:{attack:[[-5,22],[-2.5,22],[0,22],[2.5,22],[5,22]],defend:[[-5,-23],[-2.5,-23],[0,-23],[2.5,-23],[5,-23]]}} as const;
let n=0;
const box=(x:number,z:number,w:number,d:number,h=5,material:Box['material']='plaster',y=0):Box=>({id:`m${n++}`,x,y,z,w,h,d,material});
export const BOXES:Box[]=[
 box(0,-28,58,2,7,'stone'),box(0,28,58,2,7,'stone'),box(-28,0,2,54,7,'stone'),box(28,0,2,54,7,'stone'),
 // Southern buildings separate the three attack routes, with open cross-connectors.
 box(-12,13,10,12,7),box(12,13,10,12,7),
 // Mid-blocks frame a narrow central lane and broad west/east approaches.
 box(-9,-1,8,8,6,'stone'),box(9,-1,8,8,6,'stone'),
 // North structures split the sites from defender spawn.
 box(-16,-22,12,3,5),box(16,-22,12,3,5),
 box(-6,-13,4,10,7),box(6,-13,4,10,7),
 // Two landmark site towers and a sheltered overlook.
 box(-23,-12,3,9,5,'teal'),box(23,-12,3,9,5,'teal'),
 box(0,-6,3,3,2.5,'stone'),
 // Readable tactical cover. Low cover can be jumped onto; tall crates block sight.
 box(-19,1,3,3,2.6,'crate'),box(20,5,3,4,2.6,'crate'),
 box(-18,-14,3,3,2,'crate'),box(-13,-17,2.5,2.5,2.8,'crate'),
 box(18,-14,3,3,2,'crate'),box(13,-10,2.5,2.5,2.8,'crate'),
 box(-1,8,2.5,2.5,1.2,'crate'),box(3,16,2,2,1.1,'metal'),
 box(-24,17,2,6,2,'stone'),box(24,17,2,6,2,'stone'),
];
export const WAYPOINTS = [
 [0,22],[0,14],[0,4],[0,0],[-3,-6],[3,-6],[0,-13],[0,-23],
 [-21,22],[-21,10],[-21,5],[-17,-6],[-17,-10],[-17,-18],[-9,-19],
 [21,22],[21,12],[21,0],[18,-6],[18,-10],[18,-18],[9,-19],
 [-4,5],[4,5],[-16,6],[16,6],[-9,-7],[9,-7]
] as const;
export function zoneAt(x:number,z:number):string {
 if(z>18)return 'ATTACKER SPAWN'; if(z< -21)return 'DEFENDER SPAWN';
 if(z< -8 && x< -9)return 'SITE A';if(z< -8 && x>9)return 'SITE B';
 if(x< -14)return 'WEST WALK';if(x>14)return 'EAST ARCADE';return 'MID COURT';
}
