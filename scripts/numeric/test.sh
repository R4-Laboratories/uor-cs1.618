#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
runner=${NUMERIC_SDK_RUNNER:-scripts/numeric/run-cached-sdk.sh}
python3 scripts/numeric/oracle.py > artifacts/numeric/oracle.log
python3 - <<'PY'
import json
from pathlib import Path
x=json.load(open('artifacts/numeric/vectors.json'))
Path('artifacts/numeric/vectors.txt').write_text(''.join(' '.join(map(str,row))+'\n' for row in x['vectors']))
PY
"$runner" sh -c '/workspace/artifacts/numeric/native < /workspace/artifacts/numeric/vectors.txt' > artifacts/numeric/native-replay.log 2>&1
node scripts/numeric/replay.mjs > artifacts/numeric/wasm-replay.log 2>&1
python3 scripts/numeric/check-custody.py > artifacts/numeric/custody.log
# Verify the official bundle verifier rejects changed emitted bytes in an isolated copy.
python3 - <<'PYCUSTODY'
import json,shutil
from pathlib import Path
m=json.load(open('artifacts/numeric/manifest.json')); src=Path(m['bundle'])
dst=Path('artifacts/numeric/rejected-bundle')/src.name
if dst.exists(): shutil.rmtree(dst)
shutil.copytree(src,dst)
p=next(dst.glob('packages/*/*/src/lib.rs')); p.write_bytes(p.read_bytes()+b'\n')
Path('artifacts/numeric/reject-bundle.sh').write_text('cd /workspace/prism/numeric\nlexlean production verify-artifact /workspace/'+str(dst)+'\n')
PYCUSTODY
if "$runner" sh /workspace/artifacts/numeric/reject-bundle.sh > artifacts/numeric/red-changed-bundle.log 2>&1; then
  echo 'ERROR: changed emitted bundle was accepted' >&2; exit 1
fi
# Corrupt one result bit in an isolated ABI copy, keeping generated kernel packages intact.
python3 - <<'PY'
from pathlib import Path
p=Path('scripts/numeric/wasm.rs').read_text()
assert 'LAST = bits;' in p
Path('artifacts/numeric/wrong-result.rs').write_text(p.replace('LAST = bits;', 'LAST = bits ^ 1;'))
PY
"$runner" sh -c 'rustc --edition=2021 -O --crate-name numeric_wrong_result --crate-type cdylib --target wasm32-unknown-unknown /workspace/artifacts/numeric/wrong-result.rs --extern numeric_mul32=/workspace/artifacts/numeric/libnumeric_mul32_wasm.rlib --extern numeric_mul64=/workspace/artifacts/numeric/libnumeric_mul64_wasm.rlib -o /workspace/artifacts/numeric/wrong-result.wasm; chmod a+rw /workspace/artifacts/numeric/wrong-result.wasm' > artifacts/numeric/mutation-compile.log 2>&1
if node scripts/numeric/replay.mjs artifacts/numeric/wrong-result.wasm > artifacts/numeric/red-wrong-result.log 2>&1; then
  echo 'ERROR: wrong-result mutation was accepted' >&2; exit 1
fi
python3 - <<'PY'
import hashlib,json
from pathlib import Path
p=Path('artifacts/numeric/red-wrong-result.log')
assert 'ERR_ASSERTION' in p.read_text() and '1n !== 0n' in p.read_text(),p.read_text()
print(json.dumps({'status':'passed','native_vectors':len(Path('artifacts/numeric/native-replay.log').read_text().splitlines()),'native_output_sha256':hashlib.sha256(Path('artifacts/numeric/native-replay.log').read_bytes()).hexdigest(),'wrong_result_mutation':'refused at exact bits comparator'}))
PY
cat artifacts/numeric/wasm-replay.log artifacts/numeric/custody.log
