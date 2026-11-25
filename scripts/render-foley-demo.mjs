import {chromium} from 'playwright';
import {createServer} from 'vite';
import {mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';

const output='docs/evidence/field-update/meridian-audio.mp3';
const server=await createServer({server:{host:'127.0.0.1',port:0,hmr:false},plugins:[{
  name:'foley-audition',
  configureServer(dev){
    dev.middlewares.use('/foley-audition',(_req,res)=>{
      res.setHeader('Content-Type','text/html');res.end('<title>Meridian audio audition</title>');
    });
  },
}]});
await server.listen();
let browser;
try {
  browser=await chromium.launch({args:['--no-sandbox']});
  const page=await browser.newPage();
  await page.goto(server.resolvedUrls.local[0]+'foley-audition');
  const pcm=await page.evaluate(async()=>{
    const {playCue,audioBus,noiseBuffer}=await import('/src/audio.ts');
    const frequency=24000, ctx=new OfflineAudioContext(2,frequency*15,frequency);
    const bus=audioBus(ctx,.55), noise=noiseBuffer(ctx), scheduled=[];
    let id=0;
    function at(time,event,mix={}){
      const cue={id:++id,...event};
      scheduled.push(ctx.suspend(time).then(()=>{
        playCue(ctx,bus,noise,cue,{gain:1,pan:0,occluded:false,...mix},()=>{});
        return ctx.resume();
      }));
    }
    const weapons=['sidearm','rivet','smg','kestrel','m4','tern','breaker','scout'];
    weapons.forEach((weapon,i)=>at(.2+.75*i,{type:'shot',weapon}));
    ['asphalt','stone','metal','wood'].forEach((surface,i)=>{
      at(6.25+i*.8,{type:'step',surface});at(6.56+i*.8,{type:'step',surface});
    });
    at(9.65,{type:'landing',surface:'metal'});
    at(10.3,{type:'equip',weapon:'tern'});
    at(10.63,{type:'dry-trigger',weapon:'tern'});
    at(10.95,{type:'reload-start',weapon:'tern'});
    at(11.49,{type:'reload-complete',weapon:'tern'});
    at(12.18,{type:'shot',weapon:'kestrel'},{enclosure:.86});
    at(12.92,{type:'shot',weapon:'kestrel'},{remote:true,distance:29,gain:.52,pan:-.72,enclosure:.82});
    at(13.70,{type:'shot',weapon:'kestrel'},{remote:true,distance:29,gain:.52,pan:.72,occluded:true,enclosure:.82});
    const [audio]=await Promise.all([ctx.startRendering(),...scheduled]);
    const left=audio.getChannelData(0),right=audio.getChannelData(1),stereo=new Float32Array(left.length*2);
    for(let i=0;i<left.length;i++){stereo[2*i]=left[i];stereo[2*i+1]=right[i];}
    const bytes=new Uint8Array(stereo.buffer),chunks=[];
    for(let i=0;i<bytes.length;i+=16384)chunks.push(String.fromCharCode(...bytes.subarray(i,i+16384)));
    return btoa(chunks.join(''));
  });
  await mkdir('docs/evidence/field-update',{recursive:true});
  execFileSync('ffmpeg',['-v','error','-y','-f','f32le','-ar','24000','-ac','2','-i','pipe:0',
    '-c:a','libmp3lame','-q:a','3','-metadata','title=Meridian field mix',output],{input:Buffer.from(pcm,'base64')});
  console.log(output);
}finally{await browser?.close();await server.close();}
