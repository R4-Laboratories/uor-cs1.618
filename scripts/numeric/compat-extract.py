#!/usr/bin/env python3
"""Diagnostic only: source-verified oleans through unchanged SDK LCNF and codegen."""
import hashlib,json,re,subprocess
from pathlib import Path
root=Path.cwd(); ev=root/'artifacts/numeric-task2/compat'
runner='scripts/numeric/run-cached-sdk.sh'
log=(ev/'source-verify.log').read_text()
m=re.search(r'attestation ([a-f0-9]{64})',log)
if not m: raise RuntimeError('successful exact source attestation absent: '+log)
att=m[1]; verified=root/'prism/numeric/compat/.lexlean/verified'/att
assert (verified/'attestation.json').is_file()
def run(command,path):
    with path.open('w') as f:
        p=subprocess.run([runner,'sh','-c',command],stdout=f,stderr=subprocess.STDOUT)
    return p.returncode
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
results={}
for name in ['fixedSigned','comparison','iteration','constantIteration','step','addInt16','addInt32','addInt64','addUInt32','addUInt64','convertUInt64','convertInt64','repeat4','nested4','unsignedLess','shiftUInt64','equalUInt64']:
    module='Alternatives' if name.startswith(('add','convert','repeat','nested','unsigned','shift','equal')) else 'Compatibility'
    dest=f'/workspace/artifacts/numeric-task2/compat/{name}'
    cmd=f'export LEAN_PATH=/workspace/artifacts/numeric-task2/compat/lean-work/.lake/build/lib/lean:/opt/prismpm/share/exporter-seed/.lake/build/lib/lean; /opt/prismpm/share/exporter-seed/.lake/build/bin/prod-export --module BoundedNumeric.{module} --root BoundedNumeric.{module}.{name} --ir-module numeric_compatibility --out {dest}/export; s=$?; chmod -R a+rwX /workspace/artifacts/numeric-task2; exit $s'
    status=run(cmd,ev/f'{name}-extract.log')
    results[name]={'extract_exit':status,'extract_command':cmd}
    if status==0:
        cmd=f'/workspace/artifacts/numeric-task2/compat/codegen-target/debug/numeric-compat-codegen {dest}/export/kernel.ir {dest}/package; s=$?; chmod -R a+rwX /workspace/artifacts/numeric-task2; exit $s'
        results[name].update(codegen_exit=run(cmd,ev/f'{name}-codegen.log'),codegen_command=cmd)
results['attestation']=att
results['source_sha256']=sha(root/'prism/numeric/compat/src/Compatibility.lex.tex')
(ev/'results.json').write_text(json.dumps(results,indent=2)+'\n')
print(json.dumps(results,indent=2))
