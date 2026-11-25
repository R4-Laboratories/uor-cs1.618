import type {Team,Phase} from './config';
// Peers must agree on the authoritative arena and available equipment.
export const GAME_PROTOCOL='cs1618-v3';
export interface Input {seq:number;forward:number;strafe:number;yaw:number;pitch:number;jump:boolean;crouch:boolean;walk:boolean;fire:boolean;reload:boolean;use:boolean;slot:0|1;scope:boolean;}
export const neutralInput=():Input=>({seq:0,forward:0,strafe:0,yaw:0,pitch:0,jump:false,crouch:false,walk:false,fire:false,reload:false,use:false,slot:0,scope:false});
export interface Motion {x:number;y:number;z:number;vx:number;vy:number;vz:number;grounded:boolean;crouch:boolean;}
export interface Gun {id:string;ammo:number;reserve:number;}
export interface PublicPlayer extends Motion {id:string;name:string;team:Team;alive:boolean;yaw:number;pitch:number;weapon:string;kills:number;deaths:number;bot:boolean;}
export interface CareerCount {seat:string;kills:number;deaths:number;}
export interface SelfState extends PublicPlayer {career?:CareerCount;health:number;armor:number;money:number;kit:boolean;inventory:Gun[];slot:0|1;reloadLeft:number;progress:number;action:string;seq:number;recoil:number;burst?:number;}
export interface Bomb {state:'carried'|'dropped'|'planted';carrier:string|null;x:number;y:number;z:number;site:string|null;remaining:number;terminal?:'defused'|'exploded';defuser?:string|null;}
export type HitZone='head'|'torso'|'legs';
export interface GameEvent {id:number;at?:number;type:'shot'|'hit'|'kill'|'round'|'plant'|'defuse'|'explode'|'step'|'landing'|'interaction-start'|'interaction-cancel'|'interaction-complete'|'reload-start'|'reload-cancel'|'reload-complete'|'bomb-pickup'|'bomb-drop';action?:'plant'|'defuse';actor?:string;target?:string;team?:Team;text?:string;head?:boolean;zone?:HitZone;shotId?:number;damage?:number;armorDamage?:number;pellets?:number;weapon?:string;x?:number;y?:number;z?:number;ex?:number;ey?:number;ez?:number;}
export interface Snapshot {type:'snapshot';time:number;tick:number;room:string;phase:Phase;round:number;remaining:number;score:Record<Team,number>;players:PublicPlayer[];self:SelfState; bomb:Bomb|null;events:GameEvent[];winner:Team|null;reason:string;}
export type ClientMessage={type:'join';protocol:typeof GAME_PROTOCOL;name:string;room:string;team:Team|'auto';bots:boolean}|{type:'input';input:Input}|{type:'buy';item:string}|{type:'ping';at:number};
