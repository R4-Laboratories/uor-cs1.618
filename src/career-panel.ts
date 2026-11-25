import {careerAccount,careerProfile,careerPreferenceKey} from './career-account';
import {readCareer,saveCareer} from './career-store';
import {backupCareer,careerTotals,verifyBackup,type CareerBackup} from '../shared/career';
import {frame} from './prism-frame';

const output=(id:string)=>document.getElementById(id)!;
export function installCareerPanel() {
  const save=output('career-export') as HTMLButtonElement,load=output('career-import') as HTMLInputElement;
  const persist=output('career-persist') as HTMLButtonElement;
  if(navigator.storage?.persist){
    void navigator.storage.persisted().then(granted=>persist.hidden=granted).catch(()=>{});
    persist.onclick=async()=>{
      try{
        const granted=await navigator.storage.persist();
        persist.hidden=granted;
        output('career-status').textContent=granted?'Browser granted persistent storage. A signed backup also protects against clearing site data.':'Browser kept its default storage policy. Download a signed backup to keep a separate copy.';
      }catch{output('career-status').textContent='Browser storage protection unavailable. A signed backup can still be downloaded.';}
    };
  }
  const choose=output('career-profile') as HTMLSelectElement;
  choose.value=careerProfile();
  choose.onchange=()=>{
    try{localStorage.setItem(careerPreferenceKey,choose.value);output('career-status').textContent='';void refresh();}
    catch{choose.value=careerProfile();output('career-status').textContent='Could not save the profile selection.';}
  };
  let generation=0;
  async function refresh(){
    const version=++generation;
    save.disabled=load.disabled=true;
    try{
      const key=await careerAccount();
      const rows=key?await readCareer(key.owner):[];
      if(version!==generation)return;
      for(const mode of ['multiplayer','practice'] as const){
        const {kills,deaths,ratio}=careerTotals(rows,mode);
        output('career-'+mode).textContent=kills+(kills===1?' kill':' kills')+' · '+deaths+(deaths===1?' death':' deaths')+' · '+ratio+' K/D';
      }
      output('career-owner').textContent=key?'Recording for '+key.owner:'Create or link a Prism ID to start recording.';
      save.disabled=load.disabled=!key;
    }catch{
      if(version===generation)output('career-owner').textContent='Career unavailable. Check the identity and browser storage.';
    }
  }
  async function owner(){
    const key=await careerAccount();
    if(!key)throw Error('Create or link the original Prism ID first.');
    return key;
  }
  save.onclick=async()=>{
    try{
      const key=await owner(),data=await backupCareer(key,location.origin,await readCareer(key.owner));
      const url=URL.createObjectURL(new Blob([JSON.stringify(data)],{type:'application/json'}));
      const a=document.createElement('a');a.href=url;a.download='cs1618-career.json';a.click();
      setTimeout(()=>URL.revokeObjectURL(url),1000);
      output('career-status').textContent='Signed score backup downloaded. Keep a linked device or identity recovery kit to restore it.';
    }catch(error){output('career-status').textContent=(error as Error).message;}
  };
  load.onchange=async()=>{
    const file=load.files?.[0];if(!file)return;
    load.value='';
    try{
      if(file.size>32*1024*1024)throw Error('Career file exceeds 32 MiB.');
      const key=await owner(),input=JSON.parse(await file.text()) as CareerBackup;
      const rows=await verifyBackup(input,key,location.origin);
      if((await owner()).owner!==key.owner)throw Error('The selected Prism identity changed.');
      await saveCareer(key.owner,rows);await refresh();
      output('career-status').textContent='Backup merged. Repeated scores count once.';
    }catch(error){output('career-status').textContent=(error as Error).message;}
  };
  frame.addEventListener('accountchange',()=>void refresh());
  window.addEventListener('pageshow',()=>void refresh());
  window.addEventListener('focus',()=>void refresh());
  void refresh();
  return refresh;
}
