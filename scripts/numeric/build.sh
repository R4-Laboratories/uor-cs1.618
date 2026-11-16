#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
mkdir -p artifacts/numeric
# The caller may provide a runner for the exact pinned production SDK image.
runner=${NUMERIC_SDK_RUNNER:-scripts/numeric/run-cached-sdk.sh}
"$runner" sh -c 'cd /workspace/prism/numeric; lexlean lock && lexlean fmt && lexlean lock; status=$?; chmod -R a+rwX .; exit $status' > artifacts/numeric/format.log 2>&1
"$runner" sh -c 'cd /workspace/prism/numeric && lexlean production targets --diagnostic-format json' > artifacts/numeric/targets.json
python3 - <<'PY'
import json
from pathlib import Path
x=json.load(open('artifacts/numeric/targets.json'))
t=next(t for t in x['targets'] if t['id']=='rust-std')
r={'spec':'lexlean/production-request/1','roots':[{'package':{'name':f'numeric_mul{w}','version':'0.1.0'},'root':f'BoundedNumeric.Float.mul{w}','targets':[{'id':t['id'],'digest':t['digest']}]} for w in (32,64)]}
Path('prism/numeric/request.json').write_text(json.dumps(r,indent=2)+'\n')
PY
"$runner" sh -c 'cd /workspace/prism/numeric; lexlean production build --request request.json; status=$?; chmod -R a+rwX .; exit $status' > artifacts/numeric/build.log 2>&1
python3 scripts/numeric/collect.py
