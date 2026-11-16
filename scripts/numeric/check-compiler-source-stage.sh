#!/usr/bin/env bash
# Diagnostic runner only. Never selects this compiler for a game production build.
set -euo pipefail
cd /source
mkdir -p /evidence/gates /evidence/test-tools
git config --global --add safe.directory /source
export RUSTC_WRAPPER=
export CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0
export CARGO_INCREMENTAL=0
export PATH="$(dirname "$(elan which lean)"):$PATH"
{
  lean --version
  lake --version
  rustc -vV
  cargo -V
  node --version
  sha256sum "$(command -v lean)" "$(rustup which rustc)" "$(rustup which cargo)" "$(command -v node)"
  sha256sum /opt/prismpm/share/inventory.json
} > /evidence/tool-identities.txt

# The SDK's registry cache predates this source lock. Cargo verifies the exact
# lockfile checksums; neither dependency versions nor the lockfile are changed.
sha256sum rust/Cargo.lock > /evidence/cargo-lock-before.txt
CARGO_NET_OFFLINE=false cargo fetch --locked --manifest-path rust/Cargo.toml \
  > /evidence/locked-fetch.log 2>&1
sha256sum -c /evidence/cargo-lock-before.txt

# Some upstream test scripts use rg, which this SDK does not include. This is a
# separately identified test helper, not a replacement compiler or SDK seed.
CARGO_NET_OFFLINE=false cargo install --locked --version 14.1.1 \
  --root /tmp/compiler-test-tools ripgrep > /evidence/ripgrep-build.log 2>&1
export PATH="/tmp/compiler-test-tools/bin:$PATH"
rg --version > /evidence/test-tools/ripgrep-version.txt
sha256sum /tmp/compiler-test-tools/bin/rg > /evidence/test-tools/ripgrep-sha256.txt
cp /tmp/compiler-test-tools/.crates.toml /evidence/test-tools/

if ! (cd lean && lake build ProdLib) > /evidence/compiler-preflight.log 2>&1; then
  printf '%s\n' 'Compiler build failed; downstream source gates were not run.' > /evidence/preflight-failure.txt
  exit 1
fi
set +e
bash scripts/check-numeric-source-stage.sh /evidence/gates
gate_status=$?
set -e
printf '%s\n' "$gate_status" > /evidence/source-stage-exit-code.txt
# Keep generated source/IR and focused executable evidence; never copy Cargo or
# SDK caches into the artifact. A failing gate remains a failing workflow.
if test -d output; then
  find output -maxdepth 1 -type d -name 'numeric*' -print0 > /tmp/numeric-evidence-paths
else
  : > /tmp/numeric-evidence-paths
fi
if test -s /tmp/numeric-evidence-paths; then
  tar --null -T /tmp/numeric-evidence-paths -czf /evidence/focused-generated-evidence.tar.gz
fi
sha256sum -c /evidence/cargo-lock-before.txt
exit "$gate_status"
