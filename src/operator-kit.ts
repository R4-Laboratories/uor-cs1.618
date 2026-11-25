import * as T from 'three';
import type {CharacterAsset} from '../shared/engine';
import {PartBuilder,type Point} from './operator-geometry';

const bands=[0x996944,0x528195];
export function operatorColors(team:number) {
  return team===0
    ? {jacket:0x856e53, trousers:0x5c604d,vest:0x544e3b,woven:0x817458,plate:0x646b54,head:0x585744}
    : {jacket:0x475d6c, trousers:0x394853,vest:0x323f45,woven:0x637070,plate:0x49585d,head:0x434e54};
}
export function uniformColor(team:number,bone:number,x:number,y:number,z:number){
  const p=operatorColors(team);
  const base=bone>=16&&[16,17,20,21].includes(bone)?0x3c3b32:bone>=14?p.trousers:[9,13].includes(bone)?0x45463d:bone===5?0x61584c:p.jacket;
  const patch=Math.sin(x*47+z*26)*Math.cos(y*38)+Math.sin(z*61-y*16)*.65;
  return new T.Color(base).multiplyScalar(.92+(patch>.53?.14:patch<-.51?-.12:0));
}

/** Rigid skin weights fit each accessory to its Verdant bone without extra draw calls per pocket. */
export function tailoredKit(asset:CharacterAsset,team:number){
  const kit=new PartBuilder(),p=operatorColors(team),accent=bands[team];
  const centers:Point[]=[];
  for(const bone of asset.bones){
    const origin=bone.root?[0,0,0]:centers[bone.parent];
    centers.push(bone.translation.map((n,k)=>origin[k]+n) as Point);
  }
  function on(joint:number){kit.skin={joint,origin:centers[joint]};}
  const strap=0x393c35,frame=0x303c3e,lens=team?0x547579:0x716955;
  on(0);
  kit.garment([0,-.015,0],[[-.12,.143,.137],[-.07,.236,.158],[.02,.248,.178],[.08,.234,.177],[.15,.225,.172],[.20,.211,.158]],p.trousers);
  on(1);
  kit.garment([0,.01,0],[[-.055,.218,.168],[0,.221,.178],[.025,.21,.168],[.055,.232,.187],[.08,.216,.173],[.18,.238,.192],[.30,.267,.188]],p.jacket);
  on(4);
  kit.garment([0,.005,0],[[-.06,.137,.122],[-.033,.16,.14],[-.012,.151,.136],[.018,.145,.13],[.04,.132,.124],[.061,.134,.123],[.10,.115,.11],[.15,.099,.10]],p.woven);
  on(2);
  // Torso panels overlap the cloth around its elliptical chest; front faces +Z.
  kit.ellipsoid([0,.067,.01],[.277,.221,.246],p.vest);
  kit.box([0,.075,.208],[.403,.31,.082],p.plate,[.08,0,0],.029);
  kit.box([0,.085,-.231],[.35,.337,.113],p.vest,[-.13,0,0],.036);
  for(const side of [-1,1]){
    kit.box([side*.152,.195,.144],[.072,.235,.07],p.woven,[-.29,0,side*-.16],.015);
    kit.box([side*.156,.235,.143],[.077,.044,.078],strap,[-.29,0,side*-.16],.005);
    kit.box([side*.217,-.007,-.012],[.085,.103,.285],p.vest,[0,side*.14,0],.018);
  }
  for(const y of [.14,.096,.052])kit.box([0,y,.254],[.327,.018,.012],p.woven);
  kit.box([.109,.184,.248],[.103,.046,.012],accent);
  for(let i=0;i<3;i++){
    const x=(i-1)*.129;
    kit.box([x,-.039,.239],[.117,.134,.073],p.vest,[.07,x*.4,0],.012);
    kit.box([x,.005,.279],[.119,.041,.014],p.woven,[.07,x*.4,0],.006);
    kit.box([x,-.024,.282],[.019,.048,.012],strap);
  }
  // Compact travel pack, side radio, two retention straps.
  kit.box([0,.03,-.295],[.294,.271,.106],team?p.plate:p.woven,[-.12,0,0],.026);
  for(const x of [-.092,.092])kit.box([x,.034,-.349],[.024,.219,.016],strap,[-.12,0,0]);
  kit.box([.216,.071,-.174],[.09,.142,.069],frame,[0,-.18,-.09],.01);
  kit.link([.228,.127,-.175],[.246,.285,-.177],.009,.004,frame,8);
  on(0);
  kit.ellipsoid([0,.037,0],[.219,.066,.201],strap);
  kit.box([0,.039,.193],[.069,.042,.016],0x757264,[0,0,0],.003);
  for(const x of [-.153,.153])kit.box([x,-.005,-.11],[.085,.095,.097],p.vest,[0,x,0],.01);
  on(5);
  // Goggle frame, glass bridge, cloth lower face and a cut helmet brim.
  kit.garment([0,0,0],[[-.015,.094,.094],[.019,.130,.122],[.044,.145,.146],[.058,.14,.143],[.08,.144,.143],[.10,.136,.132]],p.head);
  kit.box([0,.077,.146],[.037,.046,.026],p.head,[.14,0,0],.009);
  kit.ellipsoid([0,.182,-.009],[.168,.112,.162],p.plate);
  kit.ellipsoid([0,.153,.035],[.162,.033,.171],p.vest);
  if(team===0){
    kit.box([0,.047,.151],[.093,.021,.014],p.head,[.11,0,0],.004);
    for(const x of [-.076,.076])kit.box([x,.20,.091],[.021,.062,.084],p.woven,[-.42,0,x],.005);
  }else{
    kit.box([0,.19,.143],[.056,.054,.03],frame,[.12,0,0],.008);
    kit.box([0,.196,.16],[.036,.022,.01],0x81827a);
  }
  for(const side of [-1,1]){
    kit.box([side*.096,.193,-.07],[.05,.024,.111],p.woven,[0,0,side*-.7],.004);
    kit.link([side*.134,.162,-.08],[side*.150,.149,.107],.014,.012,frame,8);
    kit.ellipsoid([side*.147,.113,.0],[.029,.055,.047],frame);
    kit.box([side*.142,.143,.02],[.027,.025,.156],strap,[0,side*.08,-side*.04],.003);
    kit.box([side*.061,.117,.146],[.143,.056,.035],frame,[.05,side*.32,side*.07],.012);
    kit.box([side*.061,.117,.16],[.124,.039,.02],lens,[.04,side*.32,side*.07],.007);
    kit.link([side*.083,.13,.178],[side*.04,.135,.181],.004,.003,0x93a098,6);
  }
  for(const [side,upper,thigh,shin,foot] of [[-1,7,14,15,16],[1,11,18,19,20]]){
    on(upper);
    kit.garment([0,0,0],[[-.31,.075,.080],[-.255,.089,.097],[-.191,.101,.101],[-.157,.104,.110],[-.13,.099,.102],[-.075,.114,.115],[.015,.092,.102]],p.jacket);
    kit.ellipsoid([side*.012,-.056,0],[.121,.114,.127],p.jacket);
    kit.box([side*.109,-.09,0],[.025,.082,.095],p.vest,[0,0,side*.1],.011);
    kit.box([side*.123,-.082,.002],[.008,.03,.076],accent);
    on(upper+1);
    kit.garment([0,0,0],[[-.273,.058,.059],[-.237,.069,.070],[-.21,.066,.068],[-.175,.077,.080],[-.139,.081,.081],[-.121,.078,.079],[-.065,.089,.084],[.024,.079,.083]],p.jacket);
    kit.garment([0,0,0],[[-.29,.060,.063],[-.263,.071,.073],[-.237,.07,.070]],strap);
    on(upper+2);kit.ellipsoid([0,-.035,.008],[.06,.084,.055],p.head);
    on(thigh);
    kit.garment([0,0,0],[[-.444,.091,.097],[-.397,.109,.106],[-.353,.105,.115],[-.3,.134,.126],[-.26,.13,.133],[-.211,.14,.142],[-.10,.15,.144],[.018,.123,.128]],p.trousers);
    kit.box([side*.11,-.245,.008],[.064,.155,.135],p.trousers,[0,.09*side,0],.013);
    kit.box([side*.135,-.20,.01],[.025,.037,.14],p.woven);
    on(shin);
    kit.garment([0,0,0],[[-.411,.082,.076],[-.362,.088,.085],[-.322,.096,.099],[-.29,.087,.091],[-.263,.094,.098],[-.19,.097,.107],[-.112,.086,.10],[-.064,.093,.105],[.015,.097,.10]],p.trousers);
    kit.ellipsoid([0,-.023,.085],[.091,.113,.054],p.vest);
    kit.ellipsoid([0,-.018,.117],[.072,.071,.039],p.plate);
    on(foot);
    kit.garment([0,0,0],[[-.040,.089,.091],[.009,.091,.099],[.073,.083,.091],[.137,.085,.087]],0x41413a);
    kit.ellipsoid([0,.002,.063],[.092,.074,.143],0x46453d);
    kit.box([0,-.063,.073],[.179,.041,.265],0x303433,[0,0,0],.013);
    for(let i=0;i<4;i++)kit.box([0,.057+i*.013,.123-i*.011],[.084,.011,.01],p.woven,[0,i%2?.32:-.32,0]);
  }
  return kit.finish();
}

export function carriedModel(weapon:string) {
  const kit=new PartBuilder(),pistol=weapon==='sidearm',long=weapon==='scout',compact=weapon==='smg';
  const muzzle=pistol?.18:long?.62:compact?.34:.51;
  kit.box([0,.02,.045],[.057,.07,pistol?.228:.30],0x475056,[0,0,0],.008);
  kit.link([0,.026,.125],[0,.026,muzzle],.019,.017,0x343f41);
  kit.box([0,-.061,0],[.041,.094,.052],0x383a36,[.28,0,0],.006);
  if(!pistol){
    kit.box([0,.016,.19],[.068,.083,.17],weapon==='kestrel'?0x805d42:0x53605a,[0,0,0],.009);
    kit.box([0,-.014,-.16],[.066,.091,.173],0x34403e,[-.1,0,0],.01);
    kit.box([0,-.076,.089],[.045,.143,.071],0x4b5350,[-.16,0,0],.005);
    if(long)kit.link([0,.092,-.043],[0,.092,.155],.031,.028,0x343e40);
  }
  return kit.finish();
}
