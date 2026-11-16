#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
sdk_image=$(node -e "console.log(JSON.parse(require('fs').readFileSync('prism/prismpm.lock')).sdk_image)")
# SDK_RUNNER is an optional executable wrapper for environments with a prestarted
# pinned SDK. It receives the same command argv as the ordinary image path.
if [ -n "${SDK_RUNNER:-}" ]; then
  "$SDK_RUNNER" /bin/bash -c 'set -e; ulimit -S -s 65536; cd /workspace/prism/app; lexlean lock; lexlean fmt --check; prismpm check; prismpm build; prismpm verify'
else
  docker run --rm -v "$PWD:/workspace" "$sdk_image" /bin/bash -c 'set -e; ulimit -S -s 65536; cd /workspace/prism/app; lexlean lock; lexlean fmt --check; prismpm check; prismpm build; prismpm verify'
fi
