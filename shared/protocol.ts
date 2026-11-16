import type {Team,Phase} from './config';
export interface Input {seq:number;forward:number;strafe:number;yaw:number;pitch:number;jump:boolean;crouch:boolean;walk:boolean;fire:boolean;reload:boolean;use:boolean;slot:0|1;scope:boolean;}
export const neutralInput=():Input=>({seq:0,forward:0,strafe:0,yaw:0,pitch:0,jump:false,crouch:false,walk:false,fire:false,reload:false,use:false,slot:0,scope:false});
export interface Motion {x:number;y:number;z:number;vx:number;vy:number;vz:number;grounded:boolean;crouch:boolean;}
export interface Gun {id:string;ammo:number;reserve:number;}
export interface PublicPlayer extends Motion {id:string;name:string;team:Team;alive:boolean;yaw:number;pitch:number;weapon:string;kills:number;deaths:number;bot:boolean;}
export interface SelfState extends PublicPlayer {health:number;armor:number;money:number;kit:boolean;inventory:Gun[];slot:0|1;reloadLeft:number;progress:number;action:string;seq:number;recoil:number;}
export interface Bomb {state:'carried'|'dropped'|'planted';carrier:string|null;x:number;y:number;z:number;site:string|null;remaining:number;}
export interface GameEvent {id:number;at?:number;type:'shot'|'hit'|'kill'|'round'|'plant'|'defuse'|'explode'|'step';actor?:string;target?:string;team?:Team;text?:string;head?:boolean;weapon?:string;x?:number;y?:number;z?:number;ex?:number;ey?:number;ez?:number;}
export interface Snapshot {type:'snapshot';time:number;tick:number;room:string;phase:Phase;round:number;remaining:number;score:Record<Team,number>;players:PublicPlayer[];self:SelfState; bomb:Bomb|null;events:GameEvent[];winner:Team|null;reason:string;}
export type ClientMessage={type:'join';name:string;room:string;team:Team|'auto';bots:boolean}|{type:'input';input:Input}|{type:'buy';item:string}|{type:'ping';at:number};
