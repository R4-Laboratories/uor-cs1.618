import type {VerdantEngine} from '../shared/engine';
interface Node{x:number;z:number;links:number[];}
export class BotNavigator{
 nodes:Node[]=[];
 constructor(engine:VerdantEngine){
  for(let z=-25;z<=25;z+=2)for(let x=-25;x<=25;x+=2){
   if(engine.ray(x,1,z,1,0,0,0.45)<0.45||engine.ray(x,1,z,-1,0,0,0.45)<0.45||engine.ray(x,1,z,0,0,1,0.45)<0.45||engine.ray(x,1,z,0,0,-1,0.45)<0.45)continue;
   this.nodes.push({x,z,links:[]});
  }
  for(let a=0;a<this.nodes.length;a++)for(let b=a+1;b<this.nodes.length;b++){
   const p=this.nodes[a],q=this.nodes[b],d=Math.hypot(p.x-q.x,p.z-q.z);if(d>2.9)continue;
   const move=engine.move(p.x,0,p.z,q.x-p.x,q.z-p.z,0.42,1.78);if(Math.hypot(move.x-q.x,move.z-q.z)>0.01)continue;
   const reverse=engine.move(q.x,0,q.z,p.x-q.x,p.z-q.z,0.42,1.78);if(Math.hypot(reverse.x-p.x,reverse.z-p.z)>0.01)continue;
   p.links.push(b);q.links.push(a);
  }
 }
 point(i:number|undefined){return i===undefined?undefined:this.nodes[i];}
 nearest(x:number,z:number){let best=0,d=Infinity;this.nodes.forEach((p,i)=>{const n=Math.hypot(p.x-x,p.z-z);if(n<d){d=n;best=i;}});return best;}
 path(x:number,z:number,gx:number,gz:number){
  const start=this.nearest(x,z),goal=this.nearest(gx,gz),queue=[start],parents=new Map<number,number>([[start,-1]]);
  for(let k=0;k<queue.length;k++){const id=queue[k];if(id===goal)break;for(const n of this.nodes[id].links)if(!parents.has(n)){parents.set(n,id);queue.push(n);}}
  if(!parents.has(goal))return [];
  const route=[];let cur=goal;while(cur!==start){route.push(cur);cur=parents.get(cur)!;}return route.reverse();
 }
}
