#!/usr/bin/env python3
"""Bind one successful production result, retain its whole bundle and compile actual exports."""
import hashlib,json,os,re,shlex,shutil,subprocess,sys
from pathlib import Path
root=Path.cwd(); dest=root/'artifacts/numeric-task2'; runner=os.environ.get('NUMERIC_SDK_RUNNER','scripts/numeric/run-cached-sdk.sh')
# The successful invocation is the sole authority; mtimes and old bundles are irrelevant.
command=json.loads(Path(sys.argv[1]).read_text())
assert command['spec']=='lexlean/command-result/1' and command['command']=='production'
assert command['success'] is True and command['exit_code']==0
assert len(command['artifacts'])==1
project=root/'prism/numeric'
relative=Path(command['artifacts'][0])
assert relative.parts[:2]==('.lexlean','production') and len(relative.parts)==3
assert re.fullmatch('[0-9a-f]{64}',relative.name)
path=project/relative/'result.json'; result=json.loads(path.read_text())
assert result['result_id']==relative.name
request=json.loads((project/'request.json').read_text())
assert {r['root'] for r in result['roots']}=={r['root'] for r in request['roots']}=={f'BoundedNumeric.Float.{op}{w}' for op in ('mul','div') for w in (32,64)}
for key in ('source_id','semantic_id'): assert result['source'][key]==command[key]
for key in ('build_id','attestation_id'): assert result['verification'][key]==command[key]
expected={r['root']:r for r in request['roots']}
for entry in result['roots']:
    wanted=expected[entry['root']]
    for output in entry['outputs']:
        assert {k:output['package'][k] for k in ('name','version')}==wanted['package']
        assert output['target'] in wanted['targets']
assert result['source']['lock_sha256']==hashlib.sha256((project/'lexlean.lock').read_bytes()).hexdigest()
build=json.loads((project/'.lexlean/build'/command['build_id']/'manifest.json').read_text())
for key in ('source_id','semantic_id','build_id'): assert build[key]==command[key]
for entry in build['inputs']:
    if entry['kind'] in ('source','lock','project-config','workspace'):
        bound=project/entry['path']
        assert bound.is_file() and hashlib.sha256(bound.read_bytes()).hexdigest()==entry['sha256'],entry['path']
(dest/'build-manifest.json').write_text(json.dumps(build,indent=2)+'\n')
(dest/'build-request.json').write_text(json.dumps(request,indent=2)+'\n')
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
    for name in signatures: args+=['--extern',f'{name}=/workspace/artifacts/numeric-task2/lib{name}'+('_wasm' if kind=='wasm' else '')+'.rlib']
    args+=['-o',f'/workspace/artifacts/numeric-task2/'+('numeric.wasm' if kind=='wasm' else 'native')]
    commands.append(shlex.join(args))
commands.append('chmod -R a+rwX /workspace/artifacts/numeric-task2')
script=dest/'compile.sh'; script.write_text('\n'.join(commands)+'\n')
sdk('sh /workspace/artifacts/numeric-task2/compile.sh','compile.log')
manifest={'source':result['source'],'compiler':result['compiler'],'bundle':str(bundle.relative_to(root)),'result_id':result['result_id'],'signatures':signatures,'generated_source_sha256':sources,'targets':[e['outputs'][0]['target'] for e in result['roots']]}
manifest['files']={str(p.relative_to(root)):hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(bundle.rglob('*')) if p.is_file()}
for p in [*Path('prism/numeric/src').glob('*'), *Path('scripts/numeric').glob('*.py'), *Path('scripts/numeric').glob('*.rs'), *Path('scripts/numeric').glob('*.sh'), *Path('scripts/numeric').glob('*.mjs'), Path('model/numeric-kernels.json'), Path('prism/numeric/lexlean.lock'), dest/'build-result.json',dest/'build-manifest.json',dest/'build-request.json',dest/'native',dest/'numeric.wasm',dest/'vectors.json']:
    manifest['files'][str(p.relative_to(root) if p.is_absolute() else p)]=hashlib.sha256(p.read_bytes()).hexdigest()
(dest/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(json.dumps({'bundle':str(bundle),'signatures':signatures}))
