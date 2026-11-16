import {loadArchive,type Application} from 'prism-code';
export interface IdentityObligations {origin:boolean;fresh:boolean;signature:boolean;consent:boolean;}
export class HologramPolicy {
 private constructor(readonly application:Application){}
 static async load(bytes:Uint8Array){const application=await loadArchive(bytes);const acceptance=await application.acceptance();if(!acceptance.total||acceptance.failed.length)throw Error('Identity Holo acceptance failed');return new HologramPolicy(application);}
 async admits(facts:IdentityObligations){
  const values=[facts.origin,facts.fresh,facts.signature,facts.consent];if(values.some(v=>typeof v!=='boolean'))throw Error('Invalid identity observations');
  const answer=new TextDecoder().decode(await this.application.dispatch(new TextEncoder().encode(values.map(v=>v?'pass':'fail').join(' ')))).trim();
  if(answer!=='allow'&&answer!=='deny')throw Error('Identity Holo refused request');return answer==='allow';
 }
}
