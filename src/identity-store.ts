export async function identityStore(write=false,value?:any):Promise<any>{
 return new Promise((resolve,reject)=>{
  const request=indexedDB.open('cs1618-prism',1);request.onupgradeneeded=()=>request.result.createObjectStore('identity');request.onerror=()=>reject(request.error);
  request.onsuccess=()=>{const db=request.result,tx=db.transaction('identity',write?'readwrite':'readonly'),store=tx.objectStore('identity'),op=write?store.put(value,'current'):store.get('current');tx.oncomplete=()=>{db.close();resolve(write?value:op.result??null);};tx.onerror=()=>{db.close();reject(tx.error);};tx.onabort=()=>{db.close();reject(tx.error??Error('Identity storage aborted'));};};
 });
}
