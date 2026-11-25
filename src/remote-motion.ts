import type {PublicPlayer, Snapshot} from '../shared/protocol';

type Pose = Pick<PublicPlayer, 'x' | 'y' | 'z' | 'yaw' | 'pitch'>;
interface Track { from:Pose; player:PublicPlayer }

function pose(track:Track, t:number):Pose {
 const a=track.from, b=track.player;
 const turn=Math.atan2(Math.sin(b.yaw-a.yaw),Math.cos(b.yaw-a.yaw));
 return {x:a.x+(b.x-a.x)*t, y:a.y+(b.y-a.y)*t, z:a.z+(b.z-a.z)*t,
  yaw:a.yaw+turn*t, pitch:a.pitch+(b.pitch-a.pitch)*t};
}

/** Smooth confirmed remote poses between 20 Hz packets, keeping the local camera on predicted input. */
export class RemoteMotion {
 private tracks=new Map<string,Track>();
 private received=0;
 private duration=0;
 private last:Snapshot|null=null;

 clear(){this.tracks.clear();this.last=null;}
 private fraction(now:number){return this.duration>0?Math.max(0,Math.min(1,(now-this.received)/this.duration)):1;}
 receive(snapshot:Snapshot,now:number){
  const previous=this.last;
  if(previous && snapshot.room===previous.room && snapshot.tick<=previous.tick)return;
  const continuous=previous && previous.room===snapshot.room && previous.round===snapshot.round && now-this.received<250;
  const t=this.fraction(now);
  const next=new Map<string,Track>();
  for(const player of snapshot.players){
   if(player.id===snapshot.self.id)continue;
   const prior=this.tracks.get(player.id);
   let from:Pose=player;
   if(continuous && prior?.player.alive && player.alive && prior.player.team===player.team &&
     Math.hypot(player.x-prior.player.x,player.y-prior.player.y,player.z-prior.player.z)<3){
    from=pose(prior,t);
   }
   next.set(player.id,{from,player});
  }
  this.tracks=next;
  this.duration=continuous?Math.max(16,Math.min(80,(snapshot.time-previous.time)*1000)):0;
  this.received=now;this.last=snapshot;
 }
 sample(player:PublicPlayer, now:number):PublicPlayer {
  const track=this.tracks.get(player.id), t=this.fraction(now);
  if(!track || t>=1 || track.from===track.player)return player;
  return {...player,...pose(track,t)};
 }
}
