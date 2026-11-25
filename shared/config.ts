export const RULES = {tickRate:60,snapshotRate:20,maxPlayers:10,freezeSeconds:12,roundSeconds:115,bombSeconds:40,plantSeconds:3,defuseSeconds:10,kitDefuseSeconds:5,endSeconds:6,matchWin:8,startMoney:800,maxMoney:16000,winReward:3250,lossReward:1900,killReward:300,buySeconds:25,radius:0.34,standingHeight:1.78,crouchHeight:1.1,eyeHeight:1.62,crouchEye:0.94,gravity:21,jumpSpeed:7,runSpeed:5.8,walkSpeed:3,crouchSpeed:2.1,acceleration:42,friction:30} as const;
export type Team='attack'|'defend';
export type Phase='waiting'|'freeze'|'live'|'ended'|'matchEnd';
export interface Weapon {
 id:string; name:string; category:string; slot:0|1; price:number; team?:Team;
 damage:number; head:number; armorRatio:number; falloff:number; pellets?:number;
 mag:number; reserve:number; interval:number; reload:number; spread:number; recoil:number; range:number; automatic:boolean;
}
export const WEAPONS:Record<string,Weapon>={
 sidearm:{id:'sidearm',name:'P9 Sidearm',category:'PISTOL',slot:1,price:0,damage:26,head:3,armorRatio:.49,falloff:.30,
  mag:15,reserve:60,interval:.22,reload:1.7,spread:.006,recoil:.016,range:65,automatic:false},
 rivet:{id:'rivet',name:'Rivet Heavy Pistol',category:'HEAVY PISTOL',slot:1,price:550,damage:45,head:2.65,armorRatio:.72,falloff:.27,
  mag:8,reserve:32,interval:.36,reload:2.1,spread:.007,recoil:.037,range:74,automatic:false},
 smg:{id:'smg',name:'Vector SMG',category:'SMG',slot:0,price:1500,damage:23,head:2.8,armorRatio:.54,falloff:.33,
  mag:30,reserve:120,interval:.075,reload:2,spread:.012,recoil:.011,range:60,automatic:true},
 breaker:{id:'breaker',name:'Breaker Scattergun',category:'SCATTERGUN',slot:0,price:1850,damage:17,head:1.35,armorRatio:.52,falloff:.56,pellets:6,
  mag:5,reserve:20,interval:.84,reload:2.7,spread:.058,recoil:.054,range:42,automatic:false},
 tern:{id:'tern',name:'Tern Carbine',category:'SEMI-AUTO CARBINE',slot:0,price:2050,damage:40,head:2.8,armorRatio:.77,falloff:.16,
  mag:18,reserve:72,interval:.215,reload:2.15,spread:.003,recoil:.021,range:105,automatic:false},
 kestrel:{id:'kestrel',name:'Kestrel 7.62',category:'RIFLE',slot:0,price:2700,damage:36,head:3.4,armorRatio:.84,falloff:.19,
  mag:30,reserve:90,interval:.105,reload:2.5,spread:.006,recoil:.022,range:100,automatic:true,team:'attack'},
 m4:{id:'m4',name:'Sentinel M4',category:'RIFLE',slot:0,price:3100,damage:31,head:3.4,armorRatio:.77,falloff:.16,
  mag:30,reserve:90,interval:.09,reload:2.2,spread:.004,recoil:.016,range:100,automatic:true,team:'defend'},
 scout:{id:'scout',name:'Longbow Scout',category:'SCOPED RIFLE',slot:0,price:3500,damage:80,head:2.5,armorRatio:.88,falloff:.12,
  mag:10,reserve:30,interval:1.1,reload:3,spread:.001,recoil:.06,range:150,automatic:false},
};
export const EQUIPMENT=[{id:'armor',name:'Kevlar + helmet',price:1000,detail:'100 armor · head and torso protection'},{id:'kit',name:'Defusal kit',price:400,detail:'Defuse in 5 seconds',team:'defend'},{id:'ammo',name:'Reserve ammunition',price:100,detail:'Refill both weapon reserves'}] as const;
export const TEAM_NAMES={attack:'EMBER',defend:'TIDAL'};
