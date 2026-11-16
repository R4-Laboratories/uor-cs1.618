import {readFileSync,existsSync,mkdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
const root=resolve(process.env.UPSTREAM_DIR??'../upstream');mkdirSync(root,{recursive:true});
for(const pin of JSON.parse(readFileSync('model/upstream-lock.json'))){
 const dir=resolve(root,pin.name);
 if(!existsSync(dir)){execFileSync('git',['clone','--filter=blob:none','--no-checkout',pin.repository,dir],{stdio:'inherit'});execFileSync('git',['-C',dir,'fetch','--depth','1','origin',pin.commit],{stdio:'inherit'});execFileSync('git',['-C',dir,'checkout','--detach',pin.commit],{stdio:'inherit'});}
 const head=execFileSync('git',['-C',dir,'rev-parse','HEAD'],{encoding:'utf8'}).trim();if(head!==pin.commit)throw Error(`${dir} is not at the required revision; existing checkouts are never reset automatically`);
 console.log(pin.name,head);
}
