import {RULES as R} from './config';
import type {Input,Motion} from './protocol';
import type {VerdantEngine} from './engine';
const toward=(a:number,b:number,d:number)=>a<b?Math.min(b,a+d):Math.max(b,a-d);
export function movePlayer(p:Motion,input:Input,dt:number,engine:VerdantEngine,enabled=true){
 p.crouch=input.crouch;
 const speed=p.crouch?R.crouchSpeed:input.walk||input.scope?R.walkSpeed:R.runSpeed;
 const len=Math.max(1,Math.hypot(input.forward,input.strafe));
 const forward=enabled?input.forward/len:0,strafe=enabled?input.strafe/len:0;
 const wishX=(-Math.sin(input.yaw)*forward+Math.cos(input.yaw)*strafe)*speed;
 const wishZ=(-Math.cos(input.yaw)*forward-Math.sin(input.yaw)*strafe)*speed;
 const accel=(forward||strafe?R.acceleration:R.friction)*(p.grounded?1:0.22)*dt;
 p.vx=toward(p.vx,wishX,accel);p.vz=toward(p.vz,wishZ,accel);
 if(input.jump&&p.grounded&&enabled){p.vy=R.jumpSpeed;p.grounded=false;}
 const pos=engine.move(p.x,p.y,p.z,p.vx*dt,p.vz*dt,R.radius,p.crouch?R.crouchHeight:R.standingHeight);
 if(Math.abs(pos.x-p.x)<1e-7)p.vx=0;if(Math.abs(pos.z-p.z)<1e-7)p.vz=0;
 p.x=pos.x;p.z=pos.z;
 p.vy-=R.gravity*dt;
 const oldY=p.y; p.y+=p.vy*dt;
 const floor=engine.support(p.x,p.z,oldY,R.radius*0.8);
 if(p.y<=floor){p.y=floor;p.vy=0;p.grounded=true;}else p.grounded=false;
 // Ceiling collision keeps jumping players below overhangs.
 const height=p.crouch?R.crouchHeight:R.standingHeight;
 if(p.vy>0&&engine.ray(p.x,oldY+height,p.z,0,1,0,Math.max(0,p.y-oldY)+0.01)<p.y-oldY){p.y=oldY;p.vy=0;}
}
