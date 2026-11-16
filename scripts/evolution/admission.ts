import {readFileSync} from 'node:fs';
export interface Obligations {fidelity:boolean;benefit:boolean;bounds:boolean;checks:boolean;}
/** The admission decision executes the actual PrismPM-generated Text/1 guest. */
export class AdmissionKernel{
 private module=new WebAssembly.Module(readFileSync('public/wasm/cs_evolution.wasm'));
 constructor(){if(WebAssembly.Module.imports(this.module).length)throw Error('Admission guest must be import-free');}
 decide(obligations:Obligations):'admit'|'reject'{
  const fields=[obligations.fidelity,obligations.benefit,obligations.bounds,obligations.checks];if(fields.some(x=>typeof x!=='boolean'))throw Error('Invalid admission obligations');
  const guest=new WebAssembly.Instance(this.module,{}).exports as any;
  const input=new TextEncoder().encode(fields.map(x=>x?'pass':'fail').join(' ')),at=guest.holo_alloc(input.length)>>>0;
  new Uint8Array(guest.memory.buffer,at,input.length).set(input);
  const packed=BigInt.asUintN(64,guest.holo_run(at,input.length)),offset=Number(packed>>32n),length=Number(packed&0xffffffffn);
  if(length>32||offset+length>guest.memory.buffer.byteLength)throw Error('Invalid admission response');
  const result=new TextDecoder().decode(new Uint8Array(guest.memory.buffer,offset,length)).trim();if(result!=='admit'&&result!=='reject')throw Error('Admission guest refused request');return result;
 }
}
