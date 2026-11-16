#!/usr/bin/env bash
# Diagnostic runner only. Never selects this compiler for a game production build.
set -Eeuo pipefail
diagnostic_stage=initialization
diagnostic_status=0
report_error() {
  local result=$1 line=$2 script=$3 command=$4
  printf 'ERROR stage=%s file=%s line=%s exit=%s command=%q\n' \
    "$diagnostic_stage" "$script" "$line" "$result" "$command" >&2
}
trap 'report_error "$?" "$LINENO" "${BASH_SOURCE[0]}" "$BASH_COMMAND"' ERR

archive_generated() {
  local paths=/evidence/numeric-evidence-paths
  if test -d output; then
    find output -maxdepth 1 -type d -name 'numeric*' -print0 > "$paths" || return "$?"
    if test -s "$paths"; then
      tar --null -T "$paths" -czf /evidence/focused-generated-evidence.tar.gz || return "$?"
    fi
  fi
}
hash_helper_cache() {
  local cache=${WASM_PACK_CACHE:-/tmp/compiler-test-tools/wasm-pack-cache}
  if test -d "$cache"; then
    find "$cache" -type f -print0 | sort -z | xargs -0 -r sha256sum \
      > /evidence/test-tools/wasm-pack-cache.sha256 || return "$?"
  fi
}
finish() {
  local original_status=$? final_status cleanup_status=0
  trap - EXIT ERR
  final_status=$original_status
  if test "$final_status" -eq 0; then final_status=$diagnostic_status; fi
  # Every cleanup step is attempted. A new cleanup failure can fail success,
  # but cannot replace an existing setup, focused, or broader-gate failure.
  cleanup_step() {
    local label=$1 result
    shift
    if "$@" >> /evidence/finalization.log 2>&1; then
      return 0
    else
      result=$?
      printf 'ERROR stage=finalization step=%s exit=%s\n' "$label" "$result" >&2
      if test "$cleanup_status" -eq 0; then cleanup_status=$result; fi
    fi
  }
  if ! : > /evidence/finalization.log; then cleanup_status=1; fi
  cleanup_step source-directory cd /source
  cleanup_step generated-output archive_generated
  if test -f /evidence/cargo-lock-before.txt; then
    cleanup_step cargo-lock sha256sum -c /evidence/cargo-lock-before.txt
  fi
  if test -f /evidence/original-sdk-files.sha256; then
    cleanup_step sdk-identities sha256sum -c /evidence/original-sdk-files.sha256
  fi
  if test -f /evidence/test-tools/original-wasm-tools.sha256; then
    cleanup_step wasm-tools-identity sha256sum -c /evidence/test-tools/original-wasm-tools.sha256
  fi
  cleanup_step helper-cache hash_helper_cache
  if test "$final_status" -eq 0; then final_status=$cleanup_status; fi
  if ! printf '%s\n' "$final_status" > /evidence/workflow-exit-code.txt; then
    if test "$final_status" -eq 0; then final_status=1; fi
  fi
  exit "$final_status"
}
trap finish EXIT

cd /source
mkdir -p /evidence/gates /evidence/test-tools
git config --global --add safe.directory /source
export RUSTC_WRAPPER=
export CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0
export CARGO_INCREMENTAL=0
# Capture the executable independently of the SDK's Cargo cache location, before
# adding any paths or changing CARGO_HOME. The helper preserves this exact file.
sdk_wasm_tools=$(command -v wasm-tools)
sdk_wasm_tools=$(readlink -f "$sdk_wasm_tools")
test -x "$sdk_wasm_tools"
readonly sdk_wasm_tools
printf '%s\n' "$sdk_wasm_tools" > /evidence/test-tools/original-wasm-tools-path.txt
sha256sum "$sdk_wasm_tools" > /evidence/test-tools/original-wasm-tools.sha256
export PATH="$(dirname "$(elan which lean)"):$PATH"
{
  lean --version
  lake --version
  rustc -vV
  cargo -V
  node --version
  "$sdk_wasm_tools" --version
  sha256sum "$(command -v lean)" "$(rustup which rustc)" "$(rustup which cargo)" "$(command -v node)" "$sdk_wasm_tools"
  sha256sum /opt/prismpm/share/inventory.json
} > /evidence/tool-identities.txt
sha256sum "$(command -v lean)" "$(rustup which rustc)" "$(rustup which cargo)" "$(command -v node)" \
  "$sdk_wasm_tools" /opt/prismpm/share/inventory.json > /evidence/original-sdk-files.sha256
sha256sum rust/Cargo.lock > /evidence/cargo-lock-before.txt

diagnostic_stage=compiler-preflight
if (cd lean && lake build ProdLib) > /evidence/compiler-preflight.log 2>&1; then
  preflight_status=0
else
  preflight_status=$?
fi
printf '%s\n' "$preflight_status" > /evidence/compiler-preflight-exit-code.txt
if test "$preflight_status" -ne 0; then
  report_error "$preflight_status" "$LINENO" "${BASH_SOURCE[0]}" 'lake build ProdLib'
  printf '%s\n' 'Compiler build failed; downstream source gates were not run.' > /evidence/preflight-failure.txt
  exit "$preflight_status"
fi

# The SDK's registry cache predates this source lock. Cargo verifies the exact
# lockfile checksums; neither dependency versions nor the lockfile are changed.
diagnostic_stage=locked-fetch
CARGO_NET_OFFLINE=false cargo fetch --locked --manifest-path rust/Cargo.toml \
  > /evidence/locked-fetch.log 2>&1
sha256sum -c /evidence/cargo-lock-before.txt

diagnostic_stage=focused
if bash scripts/check-numeric-conversion.sh > /evidence/focused.log 2>&1; then
  focused_status=0
else
  focused_status=$?
  report_error "$focused_status" "$LINENO" "${BASH_SOURCE[0]}" 'bash scripts/check-numeric-conversion.sh'
fi
printf '%s\n' "$focused_status" > /evidence/focused-exit-code.txt
diagnostic_status=$focused_status

# Some upstream test scripts use rg, which this SDK does not include. This is a
# separately identified test helper, not a replacement compiler or SDK seed.
diagnostic_stage=ripgrep-preparation
CARGO_NET_OFFLINE=false cargo install --locked --version 14.1.1 \
  --root /tmp/compiler-test-tools ripgrep > /evidence/ripgrep-build.log 2>&1
export PATH="/tmp/compiler-test-tools/bin:$PATH"
rg --version > /evidence/test-tools/ripgrep-version.txt
sha256sum /tmp/compiler-test-tools/bin/rg > /evidence/test-tools/ripgrep-sha256.txt
cp /tmp/compiler-test-tools/.crates.toml /evidence/test-tools/
diagnostic_stage=test-tool-preparation
# Keep errexit active while sourcing; a conditional or set +e here would allow
# an intermediate helper failure to be hidden by a later successful command.
source /game/scripts/numeric/prepare-compiler-test-tools.sh > /evidence/test-tool-preparation.log 2>&1
sha256sum -c /evidence/original-sdk-files.sha256

diagnostic_stage=source-gates
# Deliberately reruns focused after preparation to detect environment changes.
if bash scripts/check-numeric-source-stage.sh /evidence/gates; then
  gate_status=0
else
  gate_status=$?
  report_error "$gate_status" "$LINENO" "${BASH_SOURCE[0]}" 'bash scripts/check-numeric-source-stage.sh /evidence/gates'
fi
printf '%s\n' "$gate_status" > /evidence/source-stage-exit-code.txt
if test "$diagnostic_status" -eq 0; then diagnostic_status=$gate_status; fi
exit "$diagnostic_status"
