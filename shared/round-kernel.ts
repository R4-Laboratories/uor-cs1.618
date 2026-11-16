/** Executes the PrismPM-produced Text/1 guest; there is no handwritten production fallback. */
export interface RoundRequest {bomb:'absent'|'planted'|'defused'|'exploded';attackers:number;defenders:number;clock:number;}
export type RoundResult='continue'|'attack'|'defend';
interface Guest {memory:WebAssembly.Memory;holo_alloc:(n:number)=>number;holo_run:(at:number,n:number)=>bigint;}
export class RoundKernel{
 private cache=new Map<string,RoundResult>();
 constructor(private module:WebAssembly.Module){if(WebAssembly.Module.imports(module).length)throw Error('Prism round guest must be import-free');}
 decide(r:RoundRequest):RoundResult{
  if(!['absent','planted','defused','exploded'].includes(r.bomb)||![r.attackers,r.defenders].every(n=>Number.isInteger(n)&&n>=0&&n<=5)||(r.clock!==0&&r.clock!==1))throw Error('Invalid round-kernel request');
  const request=`${r.bomb} ${r.attackers} ${r.defenders} ${r.clock}`;
  const cached=this.cache.get(request);if(cached)return cached;
  // The generated guest uses a monotonic allocator. A fresh instance per distinct
  // bounded request prevents leaks, and the 288-entry memo is immutable thereafter.
  const guest=new WebAssembly.Instance(this.module,{}).exports as unknown as Guest;
  const input=new TextEncoder().encode(request),at=guest.holo_alloc(input.length)>>>0;
  new Uint8Array(guest.memory.buffer,at,input.length).set(input);
  const packed=BigInt.asUintN(64,guest.holo_run(at,input.length)),offset=Number(packed>>32n),size=Number(packed&0xffffffffn);
  if(size>32||offset+size>guest.memory.buffer.byteLength)throw Error('Invalid Prism guest response bounds');
  const result=new TextDecoder().decode(new Uint8Array(guest.memory.buffer,offset,size)).trim();
  if(result!=='continue'&&result!=='attack'&&result!=='defend')throw Error('Prism round guest refused a valid request');
  this.cache.set(request,result);return result;
 }
}
export async function createRoundKernel(bytes:BufferSource){return new RoundKernel(await WebAssembly.compile(bytes));}
