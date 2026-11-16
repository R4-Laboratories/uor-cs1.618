#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
sdk_image=$(node -e "console.log(JSON.parse(require('fs').readFileSync('prism/prismpm.lock')).sdk_image)")
project="${PRISM_PROJECT:-round}"
case "$project" in
  round) project_path=prism/app ;;
  evolution) project_path=prism/evolution/app ;;
  identity) project_path=prism/identity/app ;;
  *) echo "Unknown Prism project" >&2; exit 2 ;;
esac
# Invoke the backported verifier by absolute path: SDK child executables retain
# their original PATH and the full SDK inventory checks stay enabled.
command='set -euo pipefail
ulimit -S -s 65536
cd /workspace
bash scripts/build-proof-verifier.sh
verifier=/workspace/artifacts/proof-toolchain/target/debug/prismpm
cd "/workspace/$1"
echo "[proof] lexlean lock and format"
lexlean lock
lexlean fmt --check
echo "[proof] prismpm check"
"$verifier" check
echo "[proof] prismpm build"
"$verifier" build
echo "[proof] prismpm full verify"
"$verifier" --json verify | tee "/workspace/artifacts/proofs/$2-verification.json"'
# SDK_RUNNER receives the same command argv as the ordinary pinned image path.
if [ -n "${SDK_RUNNER:-}" ]; then
  "$SDK_RUNNER" /bin/bash -c "$command" _ "$project_path" "$project"
else
  docker run --rm --user "$(id -u):$(id -g)" -e HOME=/tmp/prismpm-home -e PRISMPM_EPHEMERAL_HOME=1 -v "$PWD:/workspace" "$sdk_image" /bin/bash -c "$command" _ "$project_path" "$project"
fi
