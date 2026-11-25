import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import type {CharacterAsset} from '../shared/engine';
import {PartBuilder,type Point} from './operator-geometry';

const bands=[0xce8849,0x68a6be];
export function operatorColors(team:number) {
  return team===0
    ? {jacket:0x856e53, trousers:0x5c604d,vest:0x544e3b,woven:0x817458,plate:0x646b54,head:0x585744}
    : {jacket:0x475d6c, trousers:0x394853,vest:0x323f45,woven:0x637070,plate:0x49585d,head:0x434e54};
}
export function uniformColor(team:number,bone:number,x:number,y:number,z:number){
  const p=operatorColors(team);
  const base=bone>=16&&[16,17,20,21].includes(bone)?0x3c3b32:bone>=14?p.trousers:[9,13].includes(bone)?0x45463d:bone===5?0x343b3a:p.jacket;
  const patch=Math.sin(x*47+z*26)*Math.cos(y*38)+Math.sin(z*61-y*16)*.65;
  return new T.Color(base).multiplyScalar(.96+(patch>.53?.055:patch<-.51?-.045:0));
}

/** Rigid skin weights fit each accessory to its Verdant bone without extra draw calls per pocket. */
export function tailoredKit(asset:CharacterAsset,team:number){
  const kit=new PartBuilder(), hardware=new PartBuilder(), lenses=new PartBuilder();
  const p=operatorColors(team),accent=bands[team];
  const centers:Point[]=[];
  for(const bone of asset.bones){
    const origin=bone.root?[0,0,0]:centers[bone.parent];
    centers.push(bone.translation.map((n,k)=>origin[k]+n) as Point);
  }
  function on(joint:number){kit.skin=hardware.skin=lenses.skin={joint,origin:centers[joint]};}
  const strap=0x393c35,frame=0x303c3e,lens=team?0x305275:0x72553b;
  on(0);
  kit.garment([0,-.015,0],[[-.12,.143,.137],[-.07,.236,.158],[.02,.248,.178],[.08,.234,.177],[.15,.225,.172],[.20,.211,.158]],p.trousers);
  on(1);
  kit.garment([0,.01,0],[[-.055,.218,.168],[0,.221,.178],[.025,.21,.168],[.055,.232,.187],[.08,.216,.173],[.18,.238,.192],[.30,.267,.188]],p.jacket);
  // The yoke carries the collar into both shoulders as the arms raise.
  on(3);
  kit.garment([0,0,-.006],[[-.05,.243,.168],[.01,.279,.164],[.056,.295,.145],[.101,.214,.133],[.122,.151,.12]],p.jacket);
  on(4);
  kit.garment([0,.005,0],[[-.069,.134,.126],[-.048,.151,.141],[-.035,.145,.137],[-.018,.153,.145],
    [.006,.147,.140],[.018,.146,.141],[.026,.139,.132],[.050,.136,.129],[.061,.131,.123],[.10,.114,.11],[.15,.099,.10]],p.woven);
  on(2);
  // Torso panels overlap the cloth around its elliptical chest; front faces +Z.
  kit.ellipsoid([0,.067,.01],[.277,.221,.246],p.vest);
  kit.box([0,.075,.208],[.403,.31,.082],p.plate,[.08,0,0],.029);
  kit.box([0,.085,-.231],[.35,.337,.113],p.vest,[-.13,0,0],.036);
  for(const side of [-1,1]){
    kit.profile(side*.151,[[.253,.168],[.254,.214],[.232,.251],[.180,.283],[.09,.293],[-.038,.288],
      [-.151,.267],[-.202,.225],[-.224,.168],[-.213,.168],[-.191,.217],[-.145,.256],[-.036,.277],
      [.09,.282],[.174,.272],[.222,.243],[.243,.207],[.242,.168]],.071,p.woven,.002);
    hardware.box([side*.151,.225,.242],[.074,.028,.015],strap,[-.49,0,0],.004);
    kit.box([side*.217,-.007,-.012],[.085,.103,.285],p.vest,[0,side*.14,0],.018);
  }
  for(const y of [.14,.096,.052])kit.box([0,y,.254],[.327,.018,.012],p.woven);
  // Each faction's woven patch reads by shape as well as dye. Repeat it on the pack.
  for(const back of [false,true]){
    const x=back?0:.100, y=back?.1:.181, z=back?-.355:.253, outward=back?-1:1;
    kit.box([x,y,z],[.124,.060,.013],0x313b37,undefined,.005);
    if(team===0){
      for(const sign of [-1,1])kit.box([x+sign*.018,y,z+outward*.008],[.048,.012,.009],accent,[0,0,sign*-.53]);
    }else{
      for(const shift of [-.01,.01])kit.box([x,y+shift,z+outward*.008],[.079,.009,.008],accent);
    }
  }
  for(let i=0;i<3;i++){
    const x=(i-1)*.129;
    kit.box([x,-.039,.239],[.117,.134,.073],p.vest,[.07,x*.4,0],.012);
    kit.box([x,.005,.279],[.119,.041,.014],p.woven,[.07,x*.4,0],.006);
    kit.box([x,-.024,.282],[.019,.048,.012],strap);
  }
  // Compact travel pack, side radio, two retention straps.
  kit.box([0,.03,-.295],[.294,.271,.106],team?p.plate:p.woven,[-.12,0,0],.026);
  for(const x of [-.092,.092])kit.box([x,.034,-.349],[.024,.219,.016],strap,[-.12,0,0]);
  hardware.box([.216,.071,-.174],[.09,.142,.069],frame,[0,-.18,-.09],.01);
  hardware.link([.228,.127,-.175],[.246,.285,-.177],.009,.004,frame,8);
  on(0);
  kit.ellipsoid([0,.037,0],[.219,.066,.201],strap);
  hardware.box([0,.039,.193],[.069,.042,.016],0x757264,[0,0,0],.003);
  for(const x of [-.153,.153])kit.box([x,-.005,-.11],[.085,.095,.097],p.vest,[0,x,0],.01);
  on(5);
  // Goggle frame, glass bridge, cloth lower face and a cut helmet brim.
  kit.garment([0,0,.004],[[-.027,.100,.113],[-.008,.127,.141],[.016,.144,.154],[.036,.153,.162],
    [.057,.155,.166],[.073,.151,.161],[.092,.148,.154],[.102,.140,.146]],p.head);
  kit.ellipsoid([0,.081,.153],[.035,.032,.023],p.head);
  hardware.ellipsoid([0,.182,-.009],[.168,.112,.162],p.plate);
  hardware.ellipsoid([0,.153,.035],[.162,.033,.171],p.vest);
  if(team===0){
    kit.box([0,.208,.127],[.071,.035,.012],p.woven,[-.36,0,0],.004);
    kit.box([0,.208,.135],[.047,.009,.009],accent,[-.36,0,0]);
    for(const x of [-.076,.076])kit.box([x,.20,.091],[.021,.062,.084],p.woven,[-.42,0,x],.005);
  }else{
    hardware.box([0,.19,.143],[.056,.054,.03],frame,[.12,0,0],.008);
    hardware.box([0,.196,.16],[.036,.022,.01],0x81827a);
  }
  for(const side of [-1,1]){
    kit.box([side*.096,.193,-.07],[.05,.024,.111],p.woven,[0,0,side*-.7],.004);
    hardware.link([side*.134,.162,-.08],[side*.150,.149,.107],.014,.012,frame,8);
    hardware.ellipsoid([side*.147,.113,.0],[.029,.055,.047],frame);
    kit.box([side*.142,.143,.02],[.027,.025,.156],strap,[0,side*.08,-side*.04],.003);
    hardware.box([side*.061,.117,.146],[.143,.056,.035],frame,[.05,side*.32,side*.07],.012);
    // Sample across the bent face so the scene reflection follows its curvature.
    const vertices:number[]=[], indices:number[]=[];
    const columns=14,rows=6;
    for(let v=0;v<=rows;v++){
      const height=v*2/rows-1;
      for(let u=0;u<=columns;u++){
        const width=u*2/columns-1, corner=Math.abs(width)**6;
        const x=width*(.063-.004*Math.abs(height)**6);
        const y=height*(.022-.006*corner);
        vertices.push(x,y,.016*(1-width*width)-.006*height*height);
        if(u&&v){
          const n=v*(columns+1)+u;
          indices.push(n-columns-2,n-columns-1,n,n-columns-2,n,n-1);
        }
      }
    }
    const geo=new T.BufferGeometry();
    geo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geo.setIndex(indices);geo.computeVertexNormals();
    lenses.add(geo,[side*.061,.117,.164],[1,1,1],lens,[.04,side*.32,side*.07]);
    hardware.box([side*.122,.120,.144],[.018,.025,.018],0x6a7372,[0,side*.35,0],.004);
  }
  for(const [side,upper,thigh,shin,foot] of [[-1,7,14,15,16],[1,11,18,19,20]]){
    on(upper-1);
    kit.ellipsoid([side*.122,-.010,0],[.154,.098,.129],p.jacket);
    on(upper);
    kit.garment([0,0,0],[[-.31,.075,.080],[-.255,.089,.097],[-.191,.101,.101],[-.157,.104,.110],[-.13,.099,.102],[-.075,.114,.115],[.015,.092,.102]],p.jacket);
    kit.ellipsoid([side*.012,-.056,0],[.121,.114,.127],p.jacket);
    kit.box([side*.109,-.09,0],[.025,.082,.095],p.vest,[0,0,side*.1],.011);
    for(const stripe of (team ? [-.012,.012] : [0])){
      kit.box([side*.123,-.084+stripe,.002],[.009,team?.010:.021,.076],accent,[team?0:.28,0,0]);
    }
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
    hardware.ellipsoid([0,-.018,.117],[.072,.071,.039],p.plate);
    on(foot);
    kit.garment([0,0,0],[[-.040,.089,.091],[.009,.091,.099],[.073,.083,.091],[.137,.085,.087]],0x41413a);
    kit.ellipsoid([0,.002,.063],[.092,.074,.143],0x46453d);
    hardware.box([0,-.063,.073],[.179,.041,.265],0x303433,[0,0,0],.013);
    for(let i=0;i<4;i++)kit.box([0,.057+i*.013,.123-i*.011],[.084,.011,.01],p.woven,[0,i%2?.32:-.32,0]);
  }
  // Keep the original skeleton and one geometry per team. The three contiguous
  // groups share a material pass per finish across every piece of kit.
  const parts=[kit.finish(),hardware.finish(),lenses.finish()];
  // A graduated visor coating adds a pale outer rim; the curved normals carry the live reflection.
  const lensColor=parts[2].getAttribute('color'),normals=parts[2].getAttribute('normal');
  const shade=new T.Color(lens),rim=new T.Color(team?0x7d9fad:0xb39d79),tint=new T.Color();
  for(let i=0;i<lensColor.count;i++){
    const edge=T.MathUtils.smoothstep(normals.getY(i),.06,.48);
    tint.copy(shade).lerp(rim,edge*.78);
    lensColor.setXYZ(i,tint.r,tint.g,tint.b);
  }
  const geometry=mergeGeometries(parts,true)!;
  for(const part of parts)part.dispose();
  return geometry;
}

export function carriedLength(weapon:string) {
  switch(weapon){
    case 'sidearm':return .18;
    case 'rivet':return .23;
    case 'scout':return .62;
    case 'smg':return .34;
    case 'tern':return .43;
    case 'breaker':return .56;
    default:return .51;
  }
}
export function carriedModel(weapon:string) {
  const kit=new PartBuilder(),pistol=weapon==='sidearm'||weapon==='rivet',long=weapon==='scout';
  const muzzle=carriedLength(weapon);
  kit.box([0,.02,.045],[.057,.07,pistol?.228:.30],0x475056,[0,0,0],.008);
  kit.link([0,.026,.125],[0,.026,muzzle],.019,.017,0x343f41);
  kit.box([0,-.061,0],[.041,.094,.052],0x383a36,[.28,0,0],.006);
  if(weapon==='rivet')kit.box([0,.045,.075],[.062,.037,.27],0x919595,[0,0,0],.006);
  if(weapon==='breaker'){
    kit.link([0,-.016,.13],[0,-.016,muzzle-.05],.025,.021,0x475452);
    kit.box([0,-.012,.28],[.078,.072,.163],0x74543e,[0,0,0],.012);
    kit.box([0,-.021,-.17],[.069,.102,.20],0x705542,[-.13,0,0],.01);
  }else if(!pistol){
    kit.box([0,.016,.19],[.068,.083,.17],weapon==='kestrel'?0x805d42:0x53605a,[0,0,0],.009);
    kit.box([0,-.014,-.16],[.066,.091,.173],0x34403e,[-.1,0,0],.01);
    kit.box([0,-.076,.089],[.045,.143,.071],0x4b5350,[-.16,0,0],.005);
    if(weapon==='tern'){
      kit.box([0,.083,.041],[.056,.018,.136],0x607569);
      for(const z of [-.016,.1])kit.box([0,.062,z],[.043,.036,.018],0x607569);
    }
    if(long)kit.link([0,.092,-.043],[0,.092,.155],.031,.028,0x343e40);
  }
  return kit.finish();
}
