#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
mkdir -p artifacts/numeric-task2
# Collection binds this deterministic corpus; generate it before SDK work.
python3 scripts/numeric/oracle.py --include-division --output artifacts/numeric-task2/vectors.json > artifacts/numeric-task2/oracle.log
# The caller may provide a runner for the exact pinned production SDK image.
runner=${NUMERIC_SDK_RUNNER:-scripts/numeric/run-cached-sdk.sh}
"$runner" sh -c 'cd /workspace/prism/numeric; lexlean lock && lexlean fmt && lexlean lock; status=$?; chmod -R a+rwX .; exit $status' > artifacts/numeric-task2/format.log 2>&1
"$runner" sh -c 'cd /workspace/prism/numeric && lexlean production targets --diagnostic-format json' > artifacts/numeric-task2/targets.json
python3 - <<'PY'
import json
from pathlib import Path
x=json.load(open('artifacts/numeric-task2/targets.json'))
t=next(t for t in x['targets'] if t['id']=='rust-std')
r={'spec':'lexlean/production-request/1','roots':[{'package':{'name':f'numeric_{op}{w}','version':'0.1.0'},'root':f'BoundedNumeric.Float.{op}{w}','targets':[{'id':t['id'],'digest':t['digest']}]} for op in ("div","mul") for w in (32,64)]}
Path('prism/numeric/request.json').write_text(json.dumps(r,indent=2)+'\n')
PY
"$runner" sh -c 'cd /workspace/prism/numeric; lexlean production build --request request.json --diagnostic-format json; status=$?; chmod -R a+rwX .; exit $status' > artifacts/numeric-task2/build-result.json 2> artifacts/numeric-task2/build.log
python3 scripts/numeric/collect.py artifacts/numeric-task2/build-result.json
