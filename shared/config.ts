export const RULES = {tickRate:60,snapshotRate:20,maxPlayers:10,freezeSeconds:12,roundSeconds:115,bombSeconds:40,plantSeconds:3,defuseSeconds:10,kitDefuseSeconds:5,endSeconds:6,matchWin:8,startMoney:800,maxMoney:16000,winReward:3250,lossReward:1900,killReward:300,buySeconds:25,radius:0.34,standingHeight:1.78,crouchHeight:1.1,eyeHeight:1.62,crouchEye:0.94,gravity:21,jumpSpeed:7,runSpeed:5.8,walkSpeed:3,crouchSpeed:2.1,acceleration:42,friction:30} as const;
export type Team='attack'|'defend';
export type Phase='waiting'|'freeze'|'live'|'ended'|'matchEnd';
export interface Weapon {id:string;name:string;category:string;price:number;damage:number;head:number;mag:number;reserve:number;interval:number;reload:number;spread:number;recoil:number;range:number;automatic:boolean;team?:Team;}
export const WEAPONS:Record<string,Weapon>={
 sidearm:{id:'sidearm',name:'P9 Sidearm',category:'PISTOL',price:0,damage:26,head:3,mag:15,reserve:60,interval:0.22,reload:1.7,spread:0.006,recoil:0.016,range:65,automatic:false},
 kestrel:{id:'kestrel',name:'Kestrel 7.62',category:'RIFLE',price:2700,damage:36,head:3.4,mag:30,reserve:90,interval:0.105,reload:2.5,spread:0.006,recoil:0.022,range:100,automatic:true,team:'attack'},
 m4:{id:'m4',name:'Sentinel M4',category:'RIFLE',price:3100,damage:31,head:3.4,mag:30,reserve:90,interval:0.09,reload:2.2,spread:0.004,recoil:0.016,range:100,automatic:true,team:'defend'},
 smg:{id:'smg',name:'Vector SMG',category:'SMG',price:1500,damage:23,head:2.8,mag:30,reserve:120,interval:0.075,reload:2,spread:0.012,recoil:0.011,range:60,automatic:true},
 scout:{id:'scout',name:'Longbow Scout',category:'SCOPED RIFLE',price:3500,damage:80,head:2.5,mag:10,reserve:30,interval:1.1,reload:3,spread:0.001,recoil:0.06,range:150,automatic:false},
};
export const EQUIPMENT=[{id:'armor',name:'Kevlar + helmet',price:1000,detail:'100 armor · reduces damage'},{id:'kit',name:'Defusal kit',price:400,detail:'Defuse in 5 seconds',team:'defend'},{id:'ammo',name:'Reserve ammunition',price:100,detail:'Refill both weapon reserves'}] as const;
export const TEAM_NAMES={attack:'EMBER',defend:'TIDAL'};
