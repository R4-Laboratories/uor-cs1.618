import {mergeRow,type CareerRow} from '../shared/career';

let opening:Promise<IDBDatabase>|undefined;
function database():Promise<IDBDatabase> {
  if(!opening) opening=new Promise<IDBDatabase>((resolve,reject)=>{
    const request=indexedDB.open('cs1618-career',1);
    request.onupgradeneeded=()=>{
      const store=request.result.createObjectStore('scores',{keyPath:['owner','seat']});
      store.createIndex('owner','owner');
    };
    request.onerror=()=>reject(request.error);
    request.onsuccess=()=>{
      const db=request.result;
      db.onversionchange=()=>{db.close();opening=undefined;};
      resolve(db);
    };
  }).catch(error=>{opening=undefined;throw error;});
  return opening;
}

export async function readCareer(owner:string):Promise<CareerRow[]> {
  await recoverPending(owner);
  const db=await database();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction('scores');
    const rows=tx.objectStore('scores').index('owner').getAll(owner);
    tx.oncomplete=()=>resolve(rows.result.map(({seat,mode,kills,deaths})=>({seat,mode,kills,deaths})));
    tx.onabort=()=>reject(tx.error??Error('Career storage unavailable.'));
  });
}

/** One IndexedDB write transaction serializes concurrent tabs and makes imports atomic. */
export async function saveCareer(owner:string,rows:CareerRow[]):Promise<void> {
  const db=await database();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction('scores','readwrite'),store=tx.objectStore('scores');
    let problem:unknown;
    for(const row of rows){
      const get=store.get([owner,row.seat]);
      get.onsuccess=()=>{
        try{
          const merged=mergeRow(get.result,row);
          if(merged.kills!==get.result?.kills||merged.deaths!==get.result?.deaths)store.put({...merged,owner});
        }catch(error){problem=error;tx.abort();}
      };
    }
    tx.oncomplete=()=>resolve();
    tx.onabort=()=>reject(problem??tx.error??Error('Could not save career.'));
  });
}

const pendingPrefix=(owner:string)=>'cs1618-career-pending/'+owner+'/';

/** A score can arrive just as a tab navigates away. Keep a tiny write-ahead
 * snapshot until the corresponding IndexedDB transaction commits. */
export async function saveMatchScore(owner:string,rows:CareerRow[]) {
  const journal:{key:string;value:string}[]=[],committing:CareerRow[]=[];
  for(const row of rows){
    const key=pendingPrefix(owner)+row.seat;
    let merged=row;
    try{
      const prior=localStorage.getItem(key);
      merged=mergeRow(prior?JSON.parse(prior):undefined,row);
      const value=JSON.stringify(merged);
      localStorage.setItem(key,value);
      journal.push({key,value});
    }catch{/* Browsers that disable localStorage can still use IndexedDB. */}
    committing.push(merged);
  }
  await saveCareer(owner,committing);
  for(const {key,value} of journal){
    try{if(localStorage.getItem(key)===value)localStorage.removeItem(key);}catch{}
  }
}

async function recoverPending(owner:string) {
  const rows:CareerRow[]=[];
  const prefix=pendingPrefix(owner);
  try{
    for(let i=0;i<localStorage.length;i++){
      const key=localStorage.key(i);
      if(!key?.startsWith(prefix))continue;
      const value=localStorage.getItem(key);if(value)rows.push(mergeRow(undefined,JSON.parse(value)));
    }
  }catch{/* Readable committed scores stay available if localStorage is disabled. */}
  if(rows.length)await saveMatchScore(owner,rows);
}
