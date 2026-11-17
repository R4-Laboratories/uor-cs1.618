#!/usr/bin/env bash
# Diagnostic acquisition only; never replace the SDK's installed verifier.
set -Eeuo pipefail
umask 022
stage=initialization
trap 'printf "ERROR stage=%s line=%s exit=%s command=%q\n" "$stage" "$LINENO" "$?" "$BASH_COMMAND" >&2' ERR
finish() {
  local status=$? cleanup=0 archive=0
  trap - EXIT ERR
  if test -f /evidence/original-files.sha256; then
    sha256sum -c /evidence/original-files.sha256 > /evidence/final-identities.log 2>&1 || cleanup=$?
  fi
  if test -f /evidence/verifier.sha256; then
    sha256sum -c /evidence/verifier.sha256 >> /evidence/final-identities.log 2>&1 || cleanup=$?
  fi
  # Run as the project owner: the host artifact collector cannot enter projects/.
  # tar preserves the private tree's bytes and modes without changing raw evidence.
  if test -d /evidence/projects; then
    {
      tar -czf /evidence/retained-projects.tar.gz.tmp -C /evidence projects &&
        chmod 644 /evidence/retained-projects.tar.gz.tmp &&
        mv /evidence/retained-projects.tar.gz.tmp /evidence/retained-projects.tar.gz
    } > /evidence/archive.log 2>&1 || archive=$?
    if test "$cleanup" -eq 0; then cleanup=$archive; fi
  fi
  if test "$status" -eq 0; then status=$cleanup; fi
  printf '%s\n' "$status" > /evidence/runner-exit-code.txt || {
    if test "$status" -eq 0; then status=1; fi
  }
  exit "$status"
}
trap finish EXIT
cd /work/prismpm-b1
test "$(id -u)" = 1000
test -z "$(git status --porcelain --untracked-files=all)"
mkdir -p /evidence/gates
sha256sum Cargo.lock tests/fixtures/exporter-backport/sdk-lock.json \
  vendor/lean4-prod/lean.tar vendor/lean4-prod/backports/numeric-task2c/{lean.tar,descriptor.json} \
  /opt/prismpm/share/inventory.json /opt/prismpm/share/exporter-seed/manifest.json \
  "$(command -v prismpm)" "$(elan which lean)" "$(rustup which rustc)" \
  "$(rustup which cargo)" "$(command -v node)" > /evidence/original-files.sha256
{
  git rev-parse HEAD
  lean --version
  lake --version
  rustc -vV
  cargo -V
  node --version
  stat -f -c '%T %S %b' /tmp /dev/shm
  ulimit -s
} > /evidence/environment.txt

# Resource settings belong only to compilation, not to the verified CLI child.
stage=build-verifier
CARGO_BUILD_JOBS=2 CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 \
  cargo build --locked --offline -p prismpm --bin prismpm > /evidence/build.log 2>&1
B1_BIN=/work/prismpm-b1/target/debug/prismpm
readonly B1_BIN
sha256sum "$B1_BIN" > /evidence/verifier.sha256
test ! -e /evidence/projects
mkdir -m 700 /evidence/projects
for name in default released numeric-task2c; do
  stage="verify-$name"
  cp -R tests/fixtures/holo/ho-11-text-application/project "/evidence/projects/$name"
  chmod -R u+rwX "/evidence/projects/$name"
  cp tests/fixtures/exporter-backport/sdk-lock.json "/evidence/projects/$name/prismpm.lock"
  source_args=()
  if test "$name" != default; then source_args=(--exporter-source "$name"); fi
  "$B1_BIN" --project "/evidence/projects/$name" "${source_args[@]}" --json verify \
    > "/evidence/projects/$name.json" 2> "/evidence/projects/$name.stderr"
  cmp tests/fixtures/exporter-backport/sdk-lock.json "/evidence/projects/$name/prismpm.lock"
done

stage=retained-reader
PRISMPM_TEST_BACKPORT_EVIDENCE=/evidence/projects CARGO_BUILD_JOBS=2 \
CARGO_INCREMENTAL=0 CARGO_PROFILE_TEST_DEBUG=0 \
  cargo test --locked --offline -p prismpm --lib \
    backport_authority_retained_selection_is_independent_and_historical_laundering_fails \
    -- --nocapture > /evidence/gates/retained-reader.log 2>&1
# Explicit execution marker: an ordinary unit pass does not prove this extension ran.
grep -Fx 'retained backport projects: 3 independently bound; candidate mutation corpus rejected' \
  /evidence/gates/retained-reader.log
stage=authority-controls
CARGO_BUILD_JOBS=2 CARGO_INCREMENTAL=0 CARGO_PROFILE_TEST_DEBUG=0 \
  cargo test --locked --offline -p prismpm --lib backport_authority -- --nocapture \
    > /evidence/gates/authority-controls.log 2>&1
stage=completed
printf '%s\n' 'Actual dual-authority acquisition and retained-file replay completed; not SDK release or product qualification.' \
  > /evidence/completion.txt
