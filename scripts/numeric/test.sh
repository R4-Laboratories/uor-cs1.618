#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
runner=${NUMERIC_SDK_RUNNER:-scripts/numeric/run-cached-sdk.sh}
python3 scripts/numeric/oracle.py --include-division --output artifacts/numeric-task2/vectors.json > artifacts/numeric-task2/oracle.log
python3 - <<'PY'
import json
from pathlib import Path
x=json.load(open('artifacts/numeric-task2/vectors.json'))
Path('artifacts/numeric-task2/vectors.txt').write_text(''.join(' '.join(map(str,row))+'\n' for row in x['vectors']))
PY
"$runner" sh -c '/workspace/artifacts/numeric-task2/native < /workspace/artifacts/numeric-task2/vectors.txt' > artifacts/numeric-task2/native-replay.log 2>&1
node scripts/numeric/replay.mjs > artifacts/numeric-task2/wasm-replay.log 2>&1
python3 scripts/numeric/check-custody.py > artifacts/numeric-task2/custody.log
# Verify the official bundle verifier rejects changed emitted bytes in an isolated copy.
python3 - <<'PYCUSTODY'
import json,shutil
from pathlib import Path
m=json.load(open('artifacts/numeric-task2/manifest.json')); src=Path(m['bundle'])
dst=Path('artifacts/numeric-task2/rejected-bundle')/src.name
if dst.exists(): shutil.rmtree(dst)
shutil.copytree(src,dst)
p=next(dst.glob('packages/*/*/src/lib.rs')); p.write_bytes(p.read_bytes()+b'\n')
Path('artifacts/numeric-task2/reject-bundle.sh').write_text('cd /workspace/prism/numeric\nlexlean production verify-artifact /workspace/'+str(dst)+'\n')
PYCUSTODY
if "$runner" sh /workspace/artifacts/numeric-task2/reject-bundle.sh > artifacts/numeric-task2/red-changed-bundle.log 2>&1; then
  echo 'ERROR: changed emitted bundle was accepted' >&2; exit 1
fi
# Corrupt one result bit in an isolated ABI copy, keeping generated kernel packages intact.
python3 - <<'PY'
from pathlib import Path
p=Path('scripts/numeric/wasm.rs').read_text()
assert 'LAST = bits;' in p
Path('artifacts/numeric-task2/wrong-result.rs').write_text(p.replace('LAST = bits;', 'LAST = bits ^ 1;'))
PY
"$runner" sh -c 'rustc --edition=2021 -O --crate-name numeric_wrong_result --crate-type cdylib --target wasm32-unknown-unknown /workspace/artifacts/numeric-task2/wrong-result.rs --extern numeric_mul32=/workspace/artifacts/numeric-task2/libnumeric_mul32_wasm.rlib --extern numeric_mul64=/workspace/artifacts/numeric-task2/libnumeric_mul64_wasm.rlib --extern numeric_div32=/workspace/artifacts/numeric-task2/libnumeric_div32_wasm.rlib --extern numeric_div64=/workspace/artifacts/numeric-task2/libnumeric_div64_wasm.rlib -o /workspace/artifacts/numeric-task2/wrong-result.wasm; chmod a+rw /workspace/artifacts/numeric-task2/wrong-result.wasm' > artifacts/numeric-task2/mutation-compile.log 2>&1
if node scripts/numeric/replay.mjs artifacts/numeric-task2/wrong-result.wasm > artifacts/numeric-task2/red-wrong-result.log 2>&1; then
  echo 'ERROR: wrong-result mutation was accepted' >&2; exit 1
fi
python3 - <<'PY'
import hashlib,json
from pathlib import Path
p=Path('artifacts/numeric-task2/red-wrong-result.log')
assert 'ERR_ASSERTION' in p.read_text() and '1n !== 0n' in p.read_text(),p.read_text()
print(json.dumps({'status':'passed','native_vectors':len(Path('artifacts/numeric-task2/native-replay.log').read_text().splitlines()),'native_output_sha256':hashlib.sha256(Path('artifacts/numeric-task2/native-replay.log').read_bytes()).hexdigest(),'wrong_result_mutation':'refused at exact bits comparator'}))
PY
cat artifacts/numeric-task2/wasm-replay.log artifacts/numeric-task2/custody.log
