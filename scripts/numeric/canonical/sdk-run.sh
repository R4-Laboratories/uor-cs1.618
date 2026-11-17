#!/usr/bin/env bash
# Runs only inside unchanged d6 SDK, through its original entrypoint and inventory.
set -Eeuo pipefail
umask 022
root=/evidence
helper=/game/scripts/numeric/canonical/packages.py
stage=initialization
finish() {
  local status=$? custody=0
  trap - EXIT ERR
  sha256sum -c "$root/original-files.sha256" > "$root/final-identities.log" 2>&1 || custody=$?
  if test -f "$root/verifier.sha256"; then sha256sum -c "$root/verifier.sha256" >> "$root/final-identities.log" 2>&1 || custody=$?; fi
  printf '%s\n' "$status" > "$root/runner-command-exit-code.txt"
  printf '%s\n' "$custody" > "$root/custody-exit-code.txt"
  if test "$status" -eq 0; then status=$custody; fi
  printf '%s\n' "$status" > "$root/runner-exit-code.txt"
  exit "$status"
}
test "$(id -u)" = 1000
test "$(cat "$root/host-permissions.txt")" = host-write-ok
printf '%s\n' container-write-ok > "$root/container-permissions.txt"
if test "${1:-}" = --permissions-only; then exit 0; fi
cd /work/prismpm-b1
test "$(git rev-parse HEAD)" = 2a31ad07fd0b3ea0ef63f22f165d98e310eb89ec
test -z "$(git status --porcelain --untracked-files=all)"
sha256sum Cargo.lock vendor/lean4-prod/lean.tar vendor/lean4-prod/backports/numeric-task2c/{lean.tar,descriptor.json} \
  /opt/prismpm/share/inventory.json /opt/prismpm/share/exporter-seed/manifest.json \
  "$(command -v prismpm)" "$(command -v lexlean)" "$(elan which lean)" \
  "$(rustup which rustc)" "$(rustup which cargo)" "$(command -v node)" \
  /game/prism/prismpm.lock > "$root/original-files.sha256"
trap finish EXIT
trap 'printf "ERROR stage=%s line=%s exit=%s\n" "$stage" "$LINENO" "$?" >&2' ERR
{
  git rev-parse HEAD
  lean --version
  lake --version
  rustc -vV
  cargo -V
  node --version
  stat -f -c '%T %S %b' /tmp /dev/shm
  ulimit -s
} > "$root/environment.txt"
stage=build-verifier
CARGO_BUILD_JOBS=2 CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 \
  cargo build --locked --offline -p prismpm --bin prismpm > "$root/verifier-build.log" 2>&1
B1_BIN=/work/prismpm-b1/target/debug/prismpm
readonly B1_BIN
sha256sum "$B1_BIN" > "$root/verifier.sha256"
stage=stage
python3 "$helper" stage /work/prismpm-b1 "$root/projects"
mkdir "$root/operations"
# Explicit pending records survive any early failure.
for op in mul32 mul64 div32 div64; do
  mkdir "$root/operations/$op"
  for phase in prepare build verify select; do printf '%s\n' not-run > "$root/operations/$op/$phase.status"; done
done
failed=0
for op in mul32 mul64 div32 div64; do
  project="$root/projects/$op"
  ev="$root/operations/$op"
  stage="prepare-$op"
  if (
    cd "$project"
    lexlean lock && lexlean fmt && lexlean lock && lexlean fmt --check && lexlean lock --check &&
    python3 "$helper" freeze "$project" && python3 "$helper" check "$project" &&
    cmp /game/prism/prismpm.lock "$project/prismpm.lock"
  ) > "$ev/prepare.log" 2>&1; then code=0; else code=$?; fi
  printf '%s\n' "$code" > "$ev/prepare.status"
  if test "$code" -ne 0; then failed=1; continue; fi
  stage="build-$op"
  if "$B1_BIN" --project "$project" --exporter-source numeric-task2c --json build > "$ev/build-result.json" 2> "$ev/build.stderr"; then code=0; else code=$?; fi
  printf '%s\n' "$code" > "$ev/build.status"
  if test "$code" -ne 0; then failed=1; continue; fi
  python3 "$helper" check "$project"
  stage="verify-$op"
  if "$B1_BIN" --project "$project" --exporter-source numeric-task2c --json verify > "$ev/verify-result.json" 2> "$ev/verify.stderr"; then code=0; else code=$?; fi
  printf '%s\n' "$code" > "$ev/verify.status"
  if test "$code" -ne 0; then failed=1; continue; fi
  stage="select-$op"
  if python3 "$helper" select "$project" "$ev" > "$ev/select.log" 2>&1; then code=0; else code=$?; fi
  printf '%s\n' "$code" > "$ev/select.status"
  if test "$code" -ne 0; then failed=1; fi
  cmp /game/prism/prismpm.lock "$project/prismpm.lock"
  sha256sum -c "$root/verifier.sha256"
done
test "$failed" -eq 0
stage=replay
python3 /game/scripts/numeric/canonical/replay.py "$root" > "$root/replay.log" 2>&1
printf '%s\n' 'Four actual native-library CLI verifications and exact-output native/import-free Wasm corpus replay completed. Diagnostic only; upstream validation and independent custody controls remain separate gates.' > "$root/completion.txt"
