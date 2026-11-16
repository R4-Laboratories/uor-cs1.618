import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const pin=JSON.parse(readFileSync('model/prism-frame.json','utf8'));
const dependencies=pin.dependencies;
if(!Array.isArray(dependencies)||dependencies.length!==2)throw Error('Expected the two canonical frame dependencies');
const urls=new Set();
for(const entry of dependencies){
 const expected=`https://uor-foundation.github.io/template/frame/${entry.sha256}/${entry.path.split('/').at(-1)}`;
 if(!/^[a-f0-9]{64}$/.test(entry.sha256)||entry.url!==expected||entry.path!==`prism-frame/${entry.sha256}/${entry.url.split('/').at(-1)}`||urls.has(entry.url))throw Error('Invalid frame dependency custody');
 urls.add(entry.url);const bytes=readFileSync('public/'+entry.path);
 if(bytes.length!==entry.bytes||createHash('sha256').update(bytes).digest('hex')!==entry.sha256)throw Error('Frame dependency byte drift: '+entry.path);
}
const frame=readFileSync(pin.path),panels=readFileSync('public/'+dependencies[0].path,'utf8');
if(createHash('sha256').update(frame).digest('hex')!==pin.sha256||!frame.toString('utf8').includes(dependencies[0].sha256)||!panels.includes(dependencies[1].sha256)||!dependencies[0].path.endsWith('/prism-panels.mjs')||!dependencies[1].path.endsWith('/prism-id.mjs'))throw Error('Dependency map does not close the unchanged published frame loader');
const projection=dependencies.map(({url,path,sha256,bytes})=>({url,path,sha256,bytes}));
const content='// Generated from model/prism-frame.json by scripts/prism-frame-assets.mjs.\nexport const assets=Object.freeze('+JSON.stringify(projection,null,2)+');\nexport const assetVersion=assets.map(asset=>asset.sha256).join(\':\');\n';
const path='public/prism-frame-assets.mjs';
if(process.argv.includes('--check')){if(readFileSync(path,'utf8')!==content)throw Error('Frame dependency projection drift');}else writeFileSync(path,content);
console.log('Prism frame dependency bytes and public projection verified.');
