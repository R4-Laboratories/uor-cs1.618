#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
sdk_image=$(node -e "console.log(JSON.parse(require('fs').readFileSync('prism/prismpm.lock')).sdk_image)")
project="${PRISM_PROJECT:-round}"
case "$project" in
  round) project_path=prism/app ;;
  evolution) project_path=prism/evolution/app ;;
  *) echo "Unknown Prism project" >&2; exit 2 ;;
esac
# SDK_RUNNER is an optional executable wrapper for environments with a prestarted
# pinned SDK. It receives the same command argv as the ordinary image path.
if [ -n "${SDK_RUNNER:-}" ]; then
  "$SDK_RUNNER" /bin/bash -c 'set -e; ulimit -S -s 65536; cd "/workspace/$1"; lexlean lock; lexlean fmt --check; prismpm check; prismpm build; prismpm verify' _ "$project_path"
else
  # The SDK entrypoint drops root to uid 1000. Match the checkout owner instead,
  # using the SDK-supported per-UID writable cache for hosted runners.
  docker run --rm --user "$(id -u):$(id -g)" -e HOME=/tmp/prismpm-home -e PRISMPM_EPHEMERAL_HOME=1 -v "$PWD:/workspace" "$sdk_image" /bin/bash -c 'set -e; ulimit -S -s 65536; cd "/workspace/$1"; lexlean lock; lexlean fmt --check; prismpm check; prismpm build; prismpm verify' _ "$project_path"
fi
