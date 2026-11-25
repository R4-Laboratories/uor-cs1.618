import {frame,frameReady} from './prism-frame';
import {identityStore} from './identity-store';
import {sealCareer,verifyCareerSeal,type CareerKey,type MeFrame} from '../shared/hologram-identity';

export const careerPreferenceKey='cs1618-career-profile';
export type CareerProfile='auto'|'local'|'shared';
export function careerProfile():CareerProfile {
  try{
    const stored=localStorage.getItem(careerPreferenceKey);
    return stored==='shared'||stored==='local'?stored:'auto';
  }catch{return 'auto';}
}
export function sharedCareerID(){
  const shared=frame as unknown as MeFrame & {account?:{id:string;expires:number}};
  return shared.account&&shared.account.expires>Date.now()?shared.account.id:null;
}
export async function careerAccount():Promise<CareerKey|null> {
  const profile=careerProfile();
  let key:CareerKey|undefined;
  if(profile!=='shared'){
    const session=await identityStore();
    if(session)key={owner:session.prism,session};
  }
  if(!key && profile!=='local'){
    await frameReady.catch(()=>{});
    const owner=sharedCareerID();
    if(owner)key={owner,frame:frame as unknown as MeFrame};
  }
  if(!key)return null;
  const challenge=crypto.randomUUID();
  const seal=await sealCareer(key,location.origin,'session',challenge);
  await verifyCareerSeal(seal,key.owner,location.origin,'session',challenge);
  return key;
}
