import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import type {Page} from 'playwright';
import {WEAPONS} from '../shared/config';
import {sprayOffset} from '../shared/experience';

export async function checkWeaponAim(page:Page,output:string) {
  const samples=[];
  for(const viewport of [{width:800,height:450},{width:390,height:640}]){
    await page.setViewportSize(viewport);
    await page.waitForFunction(()=> (window as any).fixture.world.camera.aspect===innerWidth/innerHeight);
    await page.evaluate(()=>{(window as any).fixture.world.setQuality('low');});
    for(const id of Object.keys(WEAPONS)){
      const weapon=WEAPONS[id],spray=sprayOffset(weapon,3);
      const sample=await page.evaluate<{
        id:string;depth:number;hipError:number;sightError:number;tracerError:number;
        endpointError:number;hostDirectionError:number;scoped:boolean;opticVisible:boolean;drawn:boolean;
      }>(`(() => {
        const id=${JSON.stringify(id)};
        const {world:w,ui,snapshot:s,engine}= window.fixture;
        const self=s.self,scoped=id==='scout',T=w.gun.position.constructor;
        Object.assign(self,{alive:true,x:0,z:22,y:0,yaw:.18,pitch:-.025,weapon:id,
          action:'',progress:0,reloadLeft:0,burst:3,vx:0,vy:0,vz:0});
        self.slot=${weapon.slot};self.inventory[self.slot]={id,ammo:${weapon.mag},reserve:${weapon.reserve}};
        s.players=[self];s.phase='live';s.round=3;s.remaining=94;
        const render=(ads,elapsed)=>{
          w.render(elapsed,s,self,self.yaw,self.pitch,ads,null,true);
          ui.update(s,self,0,null);ui.updateAim(s,self,self.yaw,ads,w.camera.fov);
        };
        // The previous iteration finished in ADS. Advance elapsed time to settled hip.
        render(false,1);
        const dir=w.camera.getWorldDirection(new T());
        const yaw=self.yaw+${spray.yaw},pitch=self.pitch+${spray.pitch};
        const hostDirectionError=dir.distanceTo(new T(-Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),-Math.cos(yaw)*Math.cos(pitch)));
        const pos=w.camera.position;
        const depth=engine.ray(pos.x,pos.y,pos.z,dir.x,dir.y,dir.z,150);
        const getPoint=(y,z)=>w.weaponParts.root.localToWorld(new T(0,y,z));
        const start=getPoint(.016,-.15),tip=getPoint(.016,w.weaponParts.muzzle);
        const line=tip.clone().sub(start);
        const plane=Math.max(2.25, Math.min(depth, ${WEAPONS[id].range}));
        const converge=start.clone().addScaledVector(line,(-plane-start.z)/line.z).project(w.weaponCamera);
        const rect=document.getElementById('crosshair').getBoundingClientRect();
        const center=new T(rect.x+rect.width/2,rect.y+rect.height/2,0);
        const pixels=(q)=>new T((q.x+1)*innerWidth*.5,(1-q.y)*innerHeight*.5,0);
        const hipError=pixels(converge).distanceTo(center);
        const end=pos.clone().addScaledVector(dir,Math.min(depth,10));
        w.event({id:82,type:'shot',actor:self.id,weapon:id,x:pos.x,y:pos.y,z:pos.z,ex:end.x,ey:end.y,ez:end.z},self.id);
        const trace=w.effects.traces.at(-1).line.geometry.getAttribute('position');
        const tracerTip=pixels(new T().fromBufferAttribute(trace,0).project(w.camera));
        const tracerError=tracerTip.distanceTo(pixels(tip.clone().project(w.weaponCamera)));
        const endpointError=end.distanceTo(new T().fromBufferAttribute(trace,1));
        render(true,.15);render(true,1);
        const sight=pixels(getPoint(w.weaponParts.sightHeight,-.40).project(w.weaponCamera));
        const sightError=sight.distanceTo(center);
        const opticVisible=!document.querySelector('#scope-glass').classList.contains('hidden');
        const drawn=w.drewWeapon;
        return {id,depth,hipError,sightError,tracerError,endpointError,hostDirectionError,scoped,opticVisible,drawn};
      })()`);
      samples.push({viewport,...sample});
      assert(sample.hostDirectionError<1e-9,id+' camera center diverges from the host spray center');
      assert(sample.hipError<.12, id+' bore misses the crosshair');
      assert(sample.sightError<.12,id+' optic misses the crosshair');
      assert(sample.tracerError<.12,id+' tracer starts outside the rendered muzzle');
      assert(sample.endpointError<.00001,id+' tracer lost the authoritative endpoint');
      assert.equal(sample.opticVisible,sample.scoped);
      assert.equal(sample.drawn,!sample.scoped);
      if(viewport.width===800 && ['m4','breaker'].includes(id))
        await page.screenshot({path:output+'/aim-'+id+'.png',timeout:90000});
    }
  }
  await writeFile(output+'/weapon-aim.json',JSON.stringify(samples,null,2)+'\n');
  return samples.length;
}
