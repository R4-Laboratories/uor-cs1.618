#!/usr/bin/env python3
"""Discover production outputs, retain the whole bundle and compile its actual run exports."""
import hashlib,json,os,re,shlex,shutil,subprocess
from pathlib import Path
root=Path.cwd(); dest=root/'artifacts/numeric'; runner=os.environ.get('NUMERIC_SDK_RUNNER','scripts/numeric/run-cached-sdk.sh')
results=[]
for p in (root/'prism/numeric/.lexlean/production').glob('*/result.json'):
    r=json.loads(p.read_text())
    if {x['root'] for x in r['roots']}=={'BoundedNumeric.Float.mul32','BoundedNumeric.Float.mul64'}: results.append((p.stat().st_mtime,p,r))
assert results,'no complete actual float-root bundle'
_,path,result=max(results)
bundle=dest/'bundles'/result['result_id']
if bundle.exists(): shutil.rmtree(bundle)
shutil.copytree(path.parent,bundle)
def sdk(command,log):
    with (dest/log).open('w') as out:
        subprocess.run([runner,'sh','-c',command],stdout=out,stderr=subprocess.STDOUT,check=True)
def container(p): return '/workspace/'+str(Path(p).relative_to(root))
sdk('cd /workspace/prism/numeric && lexlean production verify-artifact '+shlex.quote(container(bundle)),'verify-artifact.log')
commands=['set -eu']; signatures={}; sources={}
for entry in result['roots']:
    output=entry['outputs'][0]; package=output['package']; name=package['name']; src=bundle/package['directory']/'src/lib.rs'
    assert package['export']=='run'
    sig=re.search(r'pub fn run\([^\n]+',src.read_text()).group()
    signatures[name]=sig; sources[name]=hashlib.sha256(src.read_bytes()).hexdigest()
    for suffix,target in [('',[]),('_wasm',['--target','wasm32-unknown-unknown'])]:
        args=['rustc','--edition=2021','-O','--crate-name',name,'--crate-type','rlib',*target,container(src),'-o',container(dest/f'lib{name}{suffix}.rlib')]
        commands.append(shlex.join(args))
(dest/'exported-signatures.json').write_text(json.dumps(signatures,indent=2)+'\n')
for kind in ('native','wasm'):
    args=['rustc','--edition=2021','-O',f'/workspace/scripts/numeric/{kind}.rs']
    if kind=='wasm': args+=['--crate-type','cdylib','--target','wasm32-unknown-unknown']
    for name in signatures: args+=['--extern',f'{name}=/workspace/artifacts/numeric/lib{name}'+('_wasm' if kind=='wasm' else '')+'.rlib']
    args+=['-o',f'/workspace/artifacts/numeric/'+('numeric.wasm' if kind=='wasm' else 'native')]
    commands.append(shlex.join(args))
commands.append('chmod -R a+rwX /workspace/artifacts/numeric')
script=dest/'compile.sh'; script.write_text('\n'.join(commands)+'\n')
sdk('sh /workspace/artifacts/numeric/compile.sh','compile.log')
manifest={'source':result['source'],'compiler':result['compiler'],'bundle':str(bundle.relative_to(root)),'result_id':result['result_id'],'signatures':signatures,'generated_source_sha256':sources,'targets':[e['outputs'][0]['target'] for e in result['roots']]}
manifest['files']={str(p.relative_to(root)):hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(bundle.rglob('*')) if p.is_file()}
for p in [*Path('prism/numeric/src').glob('*'), *Path('scripts/numeric').glob('*.py'), *Path('scripts/numeric').glob('*.rs'), *Path('scripts/numeric').glob('*.sh'), *Path('scripts/numeric').glob('*.mjs'), Path('model/numeric-kernels.json'), Path('prism/numeric/lexlean.lock'), dest/'native',dest/'numeric.wasm',dest/'vectors.json']:
    manifest['files'][str(p.relative_to(root) if p.is_absolute() else p)]=hashlib.sha256(p.read_bytes()).hexdigest()
(dest/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(json.dumps({'bundle':str(bundle),'signatures':signatures}))
