# Task2c-B1 diagnostic dual compiler authorities

Status: diagnostic implementation committed; focused component controls and final local checks complete. Upstream worktree is clean; nothing was pushed. Exact-SDK B1 CLI acquisition and the optional genuine-retained-file replay extension have **not** run locally. No game adoption, upstream publication, SDK release qualification or product acceptance is claimed.

## Immutable inputs and resulting artifacts

- Upstream PrismPM base: `3666dc0f9da56fcf066d96ec01cd9e14ec9a2974`, branch `numeric-export-backport`.
- Separate replay-input correction commit: `b9a38652bb50bc719862d196e11d6948566e7b33`. Applied the game's pinned `prism-verifier-backport.mjs` before editing verification code; its source and patched hashes matched. Only the two existing `design/` and `oscal/` replay-input exclusions were added in that commit.
- B1 implementation commit: `e837d723826e3e55c45febba2900e85e29caa578` (`feat: govern explicit numeric exporter source authority`).
- Released authority remains compiler `991956fe427bb646498fd0912c89b71be71e7beb`, archive `7a1a716a57040ea2307f7a34e895a75ebdca7438cf9d5d0364007acb594366bf`, unchanged SDK `sha256:d6c263a733a6bc36e0458c3f5b9a1f5ea9c14dfbe8c257d3f650a960b5fe633c`.
- Candidate closed ID: `numeric-task2c`; compiler commit `2a13f942b04f0828e03c5d7db7e4db6ecb626d6e`, tree `747d3c5c4ed0d7984a9ebcadc665b10417e5ea84`.
- Actual distribution: game repository `R4-Laboratories/uor-cs1.618`, immutable commit `3e58e37161a6b8584c913b486484848bf3f3c046`, `scripts/numeric/compiler-candidate/{manifest.json,candidate.bundle,candidate.patch}`. Bundle SHA `ad555eb1d133fa3cbe04362606da005c112565ba9255806c4e67d47e390734e4`; patch SHA `0278ee47e9210484a4481b0afe1589a1da29f31fc5e624adb94580c065e31373`. This is not an upstream afflom publication.
- Candidate archive: `vendor/lean4-prod/backports/numeric-task2c/lean.tar`, SHA `6963efb98d5a67a54a5a969d520f0090218115f86da1dd573b789dc027fafb52`, 419840 bytes.
- Descriptor beside it: SHA `163fd02651d0c3e5116bdf1f0549b72d43ec849e66cd7d328b83cbec4fb70dc7`. It contains no resulting verifier/exporter binary digest or self-digest.
- The exact d6 lock reader fixture was copied byte-for-byte from the immutable game commit above; SHA `fb18f8a88756f6f3b89efe375c6611ab317beec320f986f81af92e142ac54969`.

Restoration used a clean dedicated checkout of the exact base and the game's existing restorer, which checked bundle/ref, base ancestry, candidate commit/tree, patch and bundle hashes. `scripts/construct-exporter-backport.py` produced a deterministic file-only USTAR archive and independently compared each of its 63 member bytes/modes against Git. A second descriptor/archive-member check matched all 63 entries. The source archive is the tracked `lean/` subtree; `lake build prod-export` actually compiles `Prod.Emit` and its transitive imports (including Example/Conformance). Neither the entire candidate repository nor its Rust packages are claimed as compiled. Original Rust generator pins, Cargo.lock and original archive are untouched.

Controller reported source-stage exact-SDK CI `43978245009` succeeded for unchanged candidate `2a13f94` (all 31 gates; focused native/Wasm O0/O2; original lock/image retained), artifact `14281967144`, SHA `08ce8def692d9670506047da60158b321712da238cb25c2992c34979c7b6ce78`. That upstream source result is distinct from B1 acceptance.

## Implemented consumer map and guard decisions

- `exporter/source.rs`: private typed `Source::{Released, NumericTask2c}`, closed parsing, compiled archive/descriptor/revision registry, unique archive resolution and length-framed source identity. `released` is the default; paths, URLs, free digests and unknown IDs fail.
- `cli.rs`, `controller/mod.rs`: explicit `--exporter-source` only on build/verify; `Controller::load` stays Released. The explicit constructor fixes selection before acquisition. Application/Library generator identities bind selected ID/descriptor and authority implementation; input-lock drift remains visible. ProjectConfig is unchanged.
- `exporter.rs`: original cold/seed path and original JS admission helper unchanged. Candidate requires current installed native SDK inventory, lock/2 authority and exact d6 image digest, and builds fresh source. Its closed acquisition/2 source-backport receipt binds descriptor, archive, revision, native platform, inventory and independent SDK lock digest. Actual child measurement remains in the outer execution record. No seed/source failure falls back. Source-only growth cannot be reused after the first build.
- `exporter/custody.rs`, `owner.rs`, `directory.rs`: original Snapshot retains typed authority; all recapture/protection/retirement follows that authority. Comparisons check authority before members. Package/context/owner retain selection and reject phase changes. Existing native identity, no-follow, single-link, bounded source/build trees, execution-on-failure checks and conservative retirement remain.
- `application_build.rs`, `library_build.rs`, `verification.rs`: standalone and owned paths acquire the selected source; legacy module verification checks the selected registered archive against compiled bytes. Stable sidecar records selected archive/actual child. Holo `lean4_prod_commit` records selected revision. The private unavailable browser prerequisite keeps its explicit Released-only acquisition wrapper; no public selector reaches it.
- `release_verification.rs`: current /2 evidence resolves source from retained closed ID/descriptor independently of reader defaults. All owner/top-level exports must agree, as must sidecar, child, selected Holo revision, native preflight and independent SDK lock/inventory. Historical /1 candidate laundering rejects. Existing SDK qualification JS remains sdk-seed-only.
- `model/dependencies.toml`: two ordinary file artifacts on existing lean4-prod row; no new dependency ID/metadata field. The strict original JS `compilerRevision` parser is unchanged and was executed successfully against the expanded register. The dependency-register checksum and rebuilt generator identities legitimately change; no old SDK inventory digest was recomputed or substituted. Actual same-new-binary d6 seed acceptance remains a required CI control, not an inference from these unchanged pins.
- `model/ids.toml`, SPEC, SDK Gherkin scenario and conformance runner: DK-39 registers the capability and requires every named control, including actual dual source builds. Existing `PP1001`, `PP5008`, SDK lock failures and release-reader `PP6101` retain their roles; no new unregistered code.
- Test-only retained-file extension: `PRISMPM_TEST_BACKPORT_EVIDENCE` supplies **evidence paths only**, never a production source selector. The existing reader control then requires three real CLI outputs, passes complete retained files to the existing private semantic/authority reader and runs the existing mutation corpus on the genuine candidate output. It is not a public admission API. CI must require its explicit completion marker; ordinary unit success does not mean this extension ran.

## Local validation and limits

Environment: isolated exact Rust 1.97.1 components and Lean 4.32.1; CARGO_HOME `/workspace/diagnostic-tools/cargo-home`; two jobs, no incremental state/debug symbols. Exact source-bootstrap timeout and Elan proxies were subsequently installed by controller, without changing global tools. Their expected hashes were enforced by the unchanged verifier. Disk stayed above 21 GiB free (8 GiB stop threshold was never approached). No Docker SDK pull occurred.

- Locked dependency fetch completed; Cargo.lock unchanged.
- `cargo check --locked --offline -p prismpm`: passed.
- `cargo test --locked --offline -p prismpm --lib backport_authority -- --nocapture`: 10/10 passed in 46.94s, including the explicit owner phase-selection control and both fresh native compiler builds.
- `cargo test --locked --offline -p prismpm --lib exporter:: -- --nocapture`: 62/62 passed with exact Elan/timeout and umask022 before the final extra phase-selection test. Includes all old source/child replacement, failure, retirement, limits and seed guards.
- `cargo test --locked --offline -p prismpm --lib exporter::custody::`: 20/20 passed.
- Actual source component builds/exports measured Released child SHA `b0081437c68a576ea0b19805568e8ac8c418cf5b7b366d7881b02f38dbaf77ed`, 226949656 bytes; candidate SHA `15e2d1c3d45f181a0fb2c5de86c4cfe78a9b15b31712500defbe491828bd3915`, 227109272 bytes. Final runs under umask022 measured mode0755; earlier umask077 runs measured mode0700 with identical bytes. Each passed original before/after Snapshot custody. These are component measurements, **not** SDK acquisition receipts.
- Unchanged `node --test sdk/exporter-seed.test.mjs`: 38/38 passed inside a user namespace with a real <=1GiB `/dev/shm` tmpfs and umask022. Initial host runs failed the correct tmpfs/mode controls; no expectations or guards were edited.
- `cargo xtask validate-model --write` and `cargo xtask validate-spec-links`: passed; 209 capabilities bijective with scenarios/tests. Generated SDK source tar remained unchanged. Final read-only model check passed (209 IDs, 92 codes, meta-gate/audits clean) and final SPEC-link check passed (209 bijective rows).
- `cargo clippy --locked --offline -p prismpm --lib --tests -- -D warnings`: final recheck passed.
- `cargo test --locked --offline -p prismpm --lib release_verification::tests`: 10/10 passed; `controller::tests`: 8/8 passed. The genuine-retained-file extension was not enabled for these local reader tests.
- Normative authored formatting (`cargo fmt -- --check`): final check passed. A broad `cargo fmt --all` incorrectly traversed preexisting generated stdlib sources and reported their baseline formatting; those files were not edited.
- Full local `cargo xtask validate`: **failed**, not skipped or accepted: 987/1062 Node tests passed and 75 failed under host Node24.22.1, inherited compiler profile overrides and initial umask077. Examples include expected TAP/Node22 framing mismatches, guarded inherited `CARGO_PROFILE_DEV_DEBUG` refusal, and standalone runner failures. Exact log: upstream `target/backport-validate.log`. Full exact-SDK validation remains mandatory; isolated components are not the SDK.
- Same rebuilt diagnostic CLI rejected unknown path selection and selector use on clean with canonical PP1001 envelopes. Final `cargo build --locked --offline -p prismpm --bin prismpm` passed; separately measured `target/debug/prismpm` SHA `c0c67e2e16d936504939f631aa832d88917a434db1475f4acc28bd09d9a82fbb`. It is not the old `33aec824...` executable. Both CLI refusal controls were repeated against this final binary. An initial ad hoc Python assertion expected a top-level `code` and failed on the actual canonical `diagnostic.code` envelope; correcting only that harness confirmed both PP1001 refusals.

## Runnable exact-d6 SDK recipe (pending)

Run on both native SDK platforms when available. Use an unchanged d6 image/container with original installed inventory, lock/seed and PATH. Launch the newly built verifier **by its absolute path**, without replacing `/usr/local/bin/prismpm` or putting it ahead of the installed command inventory. Do not place local diagnostic proxies or host CARGO_HOME in this container. Capture image/index/platform/inventory and source/binary hashes independently.

Use a writable disposable source checkout at `/work/prismpm-b1`, a separate fresh evidence directory `/work/b1-evidence`, and normal SDK-owned Cargo cache. Supply a bounded tmpfs, e.g. Docker `--tmpfs /tmp:rw,exec,nosuid,nodev,size=1g,mode=1777` and `--shm-size=1g`; preserve the SDK entrypoint/environment. The required image is:

```text
ghcr.io/uor-foundation/prismpm-sdk@sha256:d6c263a733a6bc36e0458c3f5b9a1f5ea9c14dfbe8c257d3f650a960b5fe633c
```

Inside that image, after verifying captured source identity (never a mutable branch):

```bash
set -euo pipefail
umask 022
cd /work/prismpm-b1
# Build the new verifier ONCE. Resource overrides apply to compilation only.
CARGO_BUILD_JOBS=2 CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 \
  cargo build --locked --offline -p prismpm --bin prismpm
B1_BIN=/work/prismpm-b1/target/debug/prismpm
B1_EVIDENCE=/work/b1-evidence
test ! -e "$B1_EVIDENCE"
mkdir -m 700 "$B1_EVIDENCE"
sha256sum "$B1_BIN" > "$B1_EVIDENCE/verifier.sha256"
for name in default released numeric-task2c; do
  cp -R tests/fixtures/holo/ho-11-text-application/project "$B1_EVIDENCE/$name"
  chmod -R u+rwX "$B1_EVIDENCE/$name"
  cp tests/fixtures/exporter-backport/sdk-lock.json "$B1_EVIDENCE/$name/prismpm.lock"
  if test "$name" = default; then
    "$B1_BIN" --project "$B1_EVIDENCE/$name" --json verify \
      > "$B1_EVIDENCE/$name.json" 2> "$B1_EVIDENCE/$name.stderr"
  else
    "$B1_BIN" --project "$B1_EVIDENCE/$name" --exporter-source "$name" --json verify \
      > "$B1_EVIDENCE/$name.json" 2> "$B1_EVIDENCE/$name.stderr"
  fi
  cmp tests/fixtures/exporter-backport/sdk-lock.json "$B1_EVIDENCE/$name/prismpm.lock"
done
sha256sum --check "$B1_EVIDENCE/verifier.sha256"
# No source selector is passed to this reader. It resolves retained evidence.
PRISMPM_TEST_BACKPORT_EVIDENCE="$B1_EVIDENCE" CARGO_BUILD_JOBS=2 \
CARGO_INCREMENTAL=0 CARGO_PROFILE_TEST_DEBUG=0 \
  cargo test --locked --offline -p prismpm --lib \
  backport_authority_retained_selection_is_independent_and_historical_laundering_fails \
  -- --nocapture > "$B1_EVIDENCE/retained-reader.log" 2>&1
rg -F 'retained backport projects: 3 independently bound; candidate mutation corpus rejected' \
  "$B1_EVIDENCE/retained-reader.log"
# All diagnostic source/custody controls remain independently required.
CARGO_BUILD_JOBS=2 CARGO_INCREMENTAL=0 CARGO_PROFILE_TEST_DEBUG=0 \
  cargo test --locked --offline -p prismpm --lib backport_authority -- --nocapture \
  > "$B1_EVIDENCE/authority-controls.log" 2>&1
```

The retained reader extension requires actual default and explicit Released **sdk-seed** receipts and equal build IDs; candidate **source-backport** receipts and a distinct build ID; all owner/top-level original exports, measured children, actual sidecar/Holo provenance, native preflight, complete artifact/semantic replay and independent d6 lock binding. It runs existing resealed-manifest/artifact mutation controls against the genuine candidate output. This is source-free integrity/authority replay, not OCI product admission or SDK release acceptance.

For actual corrupt-default-seed refusal, use a second disposable d6 container with the **same measured new verifier** and a fresh ho-11 project/unchanged d6 lock. Copy `/opt/prismpm/share/exporter-seed/manifest.json` into an external fresh fixture, change one byte there, and bind that file read-only over that single path in the second container. Execute the omitted-selector and explicit-released verify commands above, require nonzero/PP5008, no published `.prism/verified` result and no candidate receipt. Never mutate the real SDK seed in the positive container. Then rerun unmodified default in a fresh container. Likewise execute candidate on disposable missing/legacy/foreign-native-lock fixtures and require failure, plus unknown path/ID and unsupported-command selector PP1001 controls. Do not relabel such failures as cold acquisition, repair receipts, reseal successful evidence, or overwrite game artifacts.

Full B1 exact-SDK checks still include normative formatting/model/audits, Clippy, workspace/unit/conformance and `cargo xtask vv` (or the unchanged partitioned CI gates); the bounded tmpfs and clean SDK compiler environment are required. DK-39's conformance entry is `cargo test --locked --offline -p repo-conformance --test conformance conformance_dk_39 -- --exact --nocapture` and requires every named control, not zero-test success.

### Outstanding full product/source-free gate

The existing gate is `scripts/product-sdk-check.sh` (documented in `scripts/product-sdk-check.md`):

```bash
bash scripts/product-sdk-check.sh \
  ghcr.io/uor-foundation/prismpm-sdk@sha256:d6c263a733a6bc36e0458c3f5b9a1f5ea9c14dfbe8c257d3f650a960b5fe633c \
  3666dc0f9da56fcf066d96ec01cd9e14ec9a2974 \
  /absolute/new/product-evidence
```

That command must run from the clean source checkout matching the **installed image**, not this B1 checkout falsely labeled as the image's source. It requires the real two-platform index and signed child SBOMs, native Docker/registry access, exact source capture, authoritative fetched inputs and genuine current image advisory scans. It builds named products A/B in two roots through the installed CLI, then gives only their OCI graph to a fresh offline receiver for source-free replay/export and changed/missing proof refusal. It remains deliberately sdk-seed-only and therefore is **not** a candidate-admission route or a test of the separately rebuilt B1 binary. The B1 candidate's complete OCI/product qualification still needs a separately reviewed real-graph run with those prerequisites; neither the narrow retained-file extension nor fake scans can substitute. Parent explicitly reserved this later gate.
