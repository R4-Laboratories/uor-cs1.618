# Current upstream numeric export repair

**Acceptance update:** cumulative candidate `0e3472ed` (including the generated-register correction) passed full unchanged `just vv` on amd64 in the exact SDK, followed by the production primitive/native/Wasm probe. See [actual receipts and scope](exact-sdk-accepted/README.md). The diagnostic narrative and `46bdbc56` identifiers below describe the original source-repair stage and remain historical evidence. No complete IEEE implementation or upstream release is claimed.

Current candidate starts at `b04af3550bb49c4e5bfdc0747a1e50cd58f13b81` in
`/workspace/scratch/uorust-export-current`, branch `fix/numeric-export-current`.
Historical base `9d1f379` and repair commits `bee4de1` / `8716a9c`, their worktree,
patch and production evidence remain separate and unchanged. The historical
patch does not apply cleanly to current main; current UE-20 is already the factory.
This port registers UE-21 and leaves every template policy file unchanged.

## Current findings and repair

The gap persists on current main. Its actual float Prelude and evaluator are
byte-identical to the historical baseline; `git diff 9d1f379 b04af355 --
crates/uorust/assets/project/src/Prelude.lex.tex crates/uorust/src/mir/float.rs`
was empty. Certification was refactored: `mark` is now a test wrapper and
`Profile::mark` is the real fresh-export admission point. The port places the
closure guard there and exercises both default and non-default workspace profiles.

The new keyed artifact reuse architecture adds a second admission path.
`carry` formerly excluded already certified roots from marking, and
`production_build` could publish those packages via `keep_carried`. Source and
compiler identities do not bind the new admission rule. A new red test seeded
matching prior artifact identities and an unchanged already verified project;
it incorrectly carried both float-dependent `read` and safe identity `scale`.
The fix marks all requested closures before selecting reusable artifacts and
excludes marked roots from both carry candidates and prior compiler refusals.
The test covers planning, production export and synchronization: only `scale`
is carried, no compiler build runs, and the float root's `k1` refusal survives.
Its safe source hash remains unchanged. The prior test suite covers broader
integer reuse, sharding and refusal accounting.

Guard coverage is conservative and lexical: any reachable `Prelude::float*`
definition blocks the root. This includes add/sub/mul/div/remainder, sqrt/FMA,
conversions/rounding, comparisons/classification and sign operations. It is
not a proof that each helper individually overflows. Direct calls, Behavior
aliases (qualified/unqualified), and a non-float-named Prelude alias are tested.
Unused loaded float definitions do not block unrelated roots. Helper-free
bit identity stays eligible; MIR to_bits/from_bits already lower to that identity.
No new bitcast, IEEE or arbitrary semantic equivalence claim follows.

Actual Prelude traces reproduce binary64 multiplication 105/106-bit
intermediates, division160, FMA105, sqrt search325 and aligned addition103;
binary32 division73 and sqrt153; `floatPow2(64)`65; binary64-to-u64(1.0)
65 for its eagerly computed `2^64-1` mask despite final result1.
A u128 substitution cannot cover these algorithms. The arithmetic model is
unchanged; bounded/multi-limb preservation and full compiled IEEE replay stay open.

## Validation and provenance

All local compiler tests below are diagnostics under the cached game SDK,
not exact UORust acceptance. Image:
`ghcr.io/uor-foundation/prismpm-sdk@sha256:d6c263a733a6bc36e0458c3f5b9a1f5ea9c14dfbe8c257d3f650a960b5fe633c`.
Rust `1.97.1 (8bab26f4f 2026-07-14)`, LexLean0.4.0 executable SHA256
`9cba65a6cf2db6c1afc24c60d98621409c6f7eb9a1dcb99298bb658310f6e5d6`;
inventory SHA256 `0d4fe1864891ab1220a752d929a5a3a334f5987e0518a97f83f06fb5bdad105f`.
The wrapper `/workspace/scratch/numeric-probe/run-uorust-current-sdk.sh` mounts
only this isolated worktree into the retained cached SDK root.

Commands inside that diagnostic environment use
`CARGO_TARGET_DIR=/workspace/target/numeric-repair CARGO_BUILD_JOBS=2
CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0 CARGO_INCREMENTAL=0`:

```sh
cargo run --offline --locked -q -p xtask -- check-model --write
cargo test --offline --locked -p uorust --lib ue_21 -- --nocapture
cargo test --offline --locked -p uorust --lib float_model_prior_artifacts_are_refused_before_reuse_ue_21 -- --nocapture
cargo fmt --all -- --check
cargo test --offline --locked -p uorust --lib
cargo test --offline --locked -p uorust --test cli
cargo test --offline --locked -p repo-conformance
cargo run --offline --locked -q -p xtask -- check-model
cargo run --offline --locked -q -p xtask -- validate
```

Initial baseline marking control passed. Initial UE-21 run failed the admission
regression (four unsafe roots admitted), while its model trace passed. After
fresh guard:232 library tests,12 CLI tests and16 repo-conformance tests passed.
Review exposed the reuse bypass; its additional red run failed as intended.
After the reuse fix all three UE-21 tests passed. Final broad results are
recorded below. `xtask validate` passes model/error/deferral/dependency checks
then refuses the mismatched SDK native inventory. `git diff --check` and
portable probe script syntax pass. Six template policy hashes match exactly.

The portable native fixture includes reviewer commit8716a9c's exact success
assertions. It was compiled again against the retained unmodified generated
primitive rlib, and the retained Wasm was replayed with the current fixture:

```sh
cp /workspace/scratch/uorust-export-current/crates/uorust/tests/fixtures/numeric-export/native.rs /workspace/scratch/numeric-probe/native-current.rs
bash /workspace/scratch/numeric-probe/run-sdk.sh rustc --edition=2021 /workspace/native-current.rs --extern numeric_significand_probe=/workspace/libnumeric_significand_probe.rlib -o /workspace/native-current
bash /workspace/scratch/numeric-probe/run-sdk.sh /workspace/native-current
node /workspace/scratch/uorust-export-current/crates/uorust/tests/fixtures/numeric-export/probe.mjs /workspace/scratch/numeric-probe/probe.wasm
```

Native/Wasm controls passed with zero Wasm imports. This remains the exact
Nat multiply primitive only:2^52*2^52 and(2^53-1)^2 explicitly overflow;
zero,u64max*1 and2^23*2^23 return exact values. No full IEEE root was exported
or replayed; no proof build was repeated and the full shell wrapper was not
rerun end-to-end. Historical bundle identity
`1d5242cc9705d62484e05139ec5548d40a773009dcdb3ec3184dc230cfc215ba`
and generated-source SHA256
`e40a203ffa285ea6e04b9de084346d4e91fa31951e4e8af4788a6945d4e5c31e`
remain the provenance for that limited compiled evidence.

## Exact-SDK gate and CI path

Current unchanged lock selects
`ghcr.io/afflom/prismpm-sdk-patched@sha256:c1bfe8d5d3b3473a2c2ca6fdd417158a3e9f5fff3b24dcbf587fe21d6fd9b635`.
Expected amd64 inventory SHA256
`d802737ecd17651465dc93640c052720bb361c1d158049ecfb5b9b25ca6c6f70`
differs from the running inventory at `/opt/prismpm/share/inventory.json`.
All17 differing entries and exact expected/observed hashes are in
`numeric-current-evidence/sdk-inventory-diff.json`. This is a pre-existing
environment mismatch, not wrong PATH resolution. No lock or inventory rewrite.

Read-only anonymous registry checks confirmed HTTP200 for token, exact index,
both manifests and HEAD of each largest layer; index bytes match the lock.
No layer body was downloaded. amd64 has26 compressed layers totaling
5,777,274,173 bytes; arm64 totals5,748,888,383. These exceed local free disk
before extraction. Evidence: `sdk-registry-availability.json`.

The unchanged bootstrap workflow (SHA256
`4461275d96f70e6feda725f2226a35c5a96416300801bc82dc954e02386a7bdd`)
supports pull_request with contents:read only and no image-secret requirement.
PRs run ubuntu24.04 amd64; main/tags run native amd64 andarm64,45minute limit.
Its run block reads the immutable lock image, mounts Docker and checkout,
checks both-architecture manifests and runs unmodified `exec just vv`.
Anonymous image access and the workflow support fork/PR execution in principle;
repository creation/push authorization is a separate restriction.

Public run https://github.com/afflom/UORust/actions/runs/43903410601 at
`a784e7e204a1c13108391c834f77221ecbe3c35c` used this exact current SDK and
same bootstrap bytes and passed both architectures (about28.5/39.6minutes).
This establishes a plausible runner path, not candidate acceptance. At query,
b04's generate workflow succeeded and certified was pending; no b04 bootstrap
success is asserted. Historical base9d1f379's bootstrap run43779526416 failed
both gate jobs with exit101. Detailed logs were inaccessible, so its root cause
is unknown; that failure is not evidence that current-base acceptance is impossible.

The planned authorized-game manual workflow can checkout exact b04, verify
candidate patch/tree/policy custody, and execute the unchanged bootstrap run
block in the exact c1 SDK while retaining full logs. NEXP-005 closes only when
that complete gate succeeds for the reviewed candidate. No reduced local suite
is a release substitute. Current production game/kernel artifacts remain unchanged.

## Final candidate

Commit `46bdbc56ad99ac2bb73d6499863260a7fead9712`, tree `80dcc02ddd30b4e44788189ed81bac2c3d4db80f`.
Portable patch `numeric-current-repair.patch`, SHA256
`135bc1e6c6bc2f8aebf169c3c3fcff729a268862e548d368c8e0b1867eb4fa40`. Machine custody manifest:
`numeric-current-manifest.json`.

Final cached-SDK diagnostics: **233 library,12 CLI,16 repo-conformance tests
passed**; three UE-21 regression tests passed. Model agreement, formatting,
script syntax and diff whitespace passed. Complete exact-image acceptance
remains blocked locally by the17-entry native inventory mismatch.
No source or artifact publication occurred. Independent review is binding
this final commit separately; no current release acceptance is claimed.

Source anchors at candidate commit46bdbc56: `crates/uorust/src/certify.rs:1910`
(carry admission), `:2311` (Profile::mark), `:4000` (fresh admission and writer
regression), `:5004` (prior-artifact regression); `crates/uorust/src/mir/float.rs:1126`
(actual model width traces); `crates/uorust/src/mir/lower.rs:5402` (bit identity).
Unchanged Prelude definitions are at
`crates/uorust/assets/project/src/Prelude.lex.tex:1033` (pow2), `:1275`
(sum alignment), `:1308` (multiply), `:1315` (divide), `:1420` (FMA),
`:1427` (sqrt), `:1483` (toNat).
