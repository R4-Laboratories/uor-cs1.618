#!/usr/bin/env python3
"""Stage byte-identical compiler outputs, including the SDK's native runtime."""
import hashlib,json,re,shutil
from pathlib import Path
r=Path.cwd(); ev=r/'artifacts/numeric-task2/compat'; work=ev/'lean-work'; work.mkdir(exist_ok=True)
inputs=[(ev/'runtime-source',ev/'runtime-build.log'),(r/'prism/numeric/compat-alternatives',ev/'alternatives-build.log')]
modules=[]; bindings=[]
for project,log in inputs:
    build=re.search(r'built \d+ modules? at (\S+)',log.read_text())[1]
    folder=project/build
    manifest=json.loads((folder/'manifest.json').read_text())
    for row in manifest['outputs']:
        if row['kind']!='lean': continue
        if project.name=='runtime-source' and Path(row['path']).stem not in ('Portable','Collections'): continue
        path=folder/row['path']; data=path.read_bytes()
        assert hashlib.sha256(data).hexdigest()==row['sha256']
        relative=Path(row['path']).relative_to('modules'); target=work/relative
        target.parent.mkdir(exist_ok=True,parents=True); target.write_bytes(data)
        modules.append('.'.join(relative.with_suffix('').parts))
        bindings.append({'source':str(path.relative_to(r)),'target':str(target.relative_to(r)),'sha256':row['sha256']})
att=re.search(r'attestation (\w+)',(ev/'source-verify.log').read_text())[1]
p=r/'prism/numeric/compat/.lexlean/verified'/att/'modules/BoundedNumeric/Compatibility.lean'
target=work/'BoundedNumeric/Compatibility.lean'; target.write_bytes(p.read_bytes())
modules.append('BoundedNumeric.Compatibility'); bindings.append({'source':str(p.relative_to(r)),'target':str(target.relative_to(r)),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
(work/'lakefile.toml').write_text('name = "numeric_compatibility"\nversion = "0.1.0"\n[[lean_lib]]\nname = "PrismGenerated"\nroots = '+json.dumps(modules)+'\nmoreLeanArgs = ["-j2"]\n')
shutil.copyfile(r/'prism/numeric/compat/lean-toolchain',work/'lean-toolchain')
(ev/'stage-bindings.json').write_text(json.dumps(bindings,indent=2)+'\n')
