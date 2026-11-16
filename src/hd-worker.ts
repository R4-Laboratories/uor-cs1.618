import {createEngine} from '../shared/engine';
let engine:ReturnType<typeof createEngine>|undefined;
self.onmessage=async({data})=>{
 try{
  engine??=fetch(data.engineUrl).then(r=>{if(!r.ok)throw Error('HD engine download failed');return r.arrayBuffer();}).then(createEngine).catch(error=>{engine=undefined;throw error;});
  const e=await engine;const assets=[0,1,2].map(kind=>e.hdAsset(kind,data.lod));self.postMessage({id:data.id,assets});
 }catch(error){self.postMessage({id:data.id,error:String(error)});}
};
