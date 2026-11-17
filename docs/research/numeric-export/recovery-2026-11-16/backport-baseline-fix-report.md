# Task2c-B1 fix round 2 — initial checkpoint

Status: **NEEDS_CONTEXT: independent review, then actual hosted shared golden generation.** No generated baseline was synthesized, imported or accepted. No hosted run, Docker pull, upstream push or SDK promotion was performed by this implementation.

## Commits and scope

- Upstream local commit `f6776fca7c9f675b3bb762ddaf88d256aad3d77f`, tree `4bf2b2ee620c50c6d3ea13011fa4f8c0af6d24a9`, parent `2a31ad07fd0b3ea0ef63f22f165d98e310eb89ec`.
- Game local commit `27619a53a37b96f67bf5bffc60942c5a2175aea5` (parent includes controller evidence commit `28ba94e`). Only new shared-preparation workflow/helper/tests and **separate** `scripts/numeric/prismpm-preparation-candidate` snapshot.
- Old `scripts/numeric/prismpm-candidate`, full-source VV workflow/helper, original compiler archives/descriptors, SDK/toolchain pins, generated goldens and fixture expected result remain unchanged. Source worktree is clean; unrelated game research working directory was not staged.
- Preparation bundle SHA256 `0cb655bc675605cecf01a551ab7da29f0a63d9cd68fe2a2f03d3b2de0378ff76`; review patch SHA256 `b905535439f330fc19c4c5c2feb8e02f55db9f6d86742a75e76fc4e2a17b2b37`. Existing immutable restorer schema and `numeric-export-backport` branch retained.

## Source corrections and measured evidence

Fresh actual CLI was built with exact isolated Rust 1.97.1 using `cargo build --locked --offline -p prismpm --bin prismpm` (scoped compile-only `CARGO_PROFILE_DEV_DEBUG=0 CARGO_INCREMENTAL=0 CARGO_BUILD_JOBS=2`, umask 022, isolated Cargo home). Build passed. These options were not installed as a verification environment or used to alter source policy.

`target/debug/prismpm check --project tests/fixtures/controller/ct-02-prism-code-model/project --json` initially exited 3 with PP2101: authored `f6274f7e39fe374edbc453002099c268a554ed590017d929c15ed34792bc692d` versus measured `bde664ad933ee9952eaa71f5478494fabc7d30952232a490af0f5dac7274d03c`. Parsed that actual structured failure and changed exactly the two authored bindings plus case comment. The same actual command after correction and again after commit exited 0, entity_count 105, model_id `bde664ad933ee9952eaa71f5478494fabc7d30952232a490af0f5dac7274d03c`. Expected success JSON is untouched.

Independently matched all 31 register input paths against the Rust projector's exact ordered closure, length-framed path and byte inputs with u64 big-endian lengths, and hashed actual file bytes. Result `c8213cedf16ad1691f136122a58a87a33a596a95e8e5c9b361bf78109df22133` replaces only the stale register digest; path list is unchanged. Local evidence: source `target/baseline-fix-{build.log,fixture-before.json,fixture-after.json,fixture-final.json,emitter.json}`.

Native golden helper now mirrors the actual default Released generator recipe: length-framed domain, `released`, NUL-terminated Released descriptor; exact `exporter/source.rs`; original application-build/Lean-project/Holo-archive bytes; original checked/dereferenced compiler-manifest alias; final build-artifact domain. Its two review seals are controller `04f04bddfe071a40940345f12a9487b41f4b77dde62dab91987f5c58d2e3fe0c` and framing owner `7b8b1c021b0ab2332b5be708947f1e8a4aa0fc5da298430f191b766cce832e32`. Parent review must independently judge these owners and recipe; these seals do not qualify generation. Fixed Released frame is 92 bytes; actual recipe result is `0eae6b594fc9edbb37ed52d038e15c48c1a2b5cea97fd49e4ec07135375d54f1`. No source-selector or candidate fallback was added to the native writer.

## Local checks (not hosted acceptance)

- `node --test --test-reporter=tap scripts/native-golden.test.mjs`: **18 passed, 1 failed, 0 skipped**. The existing actual-workflow-shell test fails because its absolute `/usr/bin/python3` command supervisor refuses this host's Python **3.13.5** (owner admits 3.11.2/3.12.3); protocol reports an error instead of started/pid/version. Kept exact failure at `target/baseline-fix-native-golden.log`. No owner or test relaxation. Full 19-test suite is required in hosted pinned environment.
- `node --test --test-reporter=tap --test-name-pattern='generator preflight|reviewed Released source frame|current shared source baseline' scripts/native-golden.test.mjs`: **3 passed, 0 failed, 0 skipped** (selected-only run). Includes exact real recipe, candidate/wrong-descriptor baseline refusal, newly bound source-byte mutation and existing alias/owner controls. Log `target/baseline-fix-recipe-tests.log`.
- `node --test --test-reporter=tap scripts/construct-exporter-backport.test.mjs`: **2 passed, 0 failed, 0 skipped**. Log `target/baseline-fix-constructor-tests.log`.
- Actual `applicationGeneratorIdentity(process.cwd())` returned the Released identity above; `validateApplicationGenerator(process.cwd())` still refused **committed shared application generator source hash is stale**. This is the expected genuine-baseline blocker, not a waived check.
- `node --check` on both changed source JS files and `git diff --check` passed.
- An initial overly broad `cargo fmt --all -- --check` failed on unchanged generated `stdlib/generated/package/src/lib.rs` and other generated formatting. It did not edit files. Authored-package format and model-check results are recorded below; no Rust implementation changed and no new Clippy/native builds were warranted.
- Game `python3 -m unittest discover -s scripts/numeric/tests -p test_golden_preparation.py -v`: **10 passed**. Synthetic controls exercise original byte/binary patch retention, missing status/log, writer failure, command ordering, truncation, wrong revision, unowned changes, symlink and aggregate bounds. These are harness tests, not generator evidence. Log `artifacts/numeric-baseline-preparation/helper-tests.log`.
- Actual fresh disposable local clone at base3666 restored the new bundle with the unchanged restorer, independently verified bundle/patch/candidate/tree/cleanliness, and passed original `bash scripts/bootstrap-verify.sh --check-source`. Receipt/definition hashes retained under `artifacts/numeric-baseline-preparation/restoration/`; disposable clone removed. No generation ran.
- New workflow YAML parses; old candidate and full-VV files compare unchanged. Local disk remained about 20GiB free.

## Reviewed launch recipe and retained evidence

Parent may publish/dispatch `.github/workflows/prismpm-backport-golden-preparation.yml` after review. Narrow push paths select only this new workflow, helper, test and preparation snapshot; old full VV is not triggered by those changes. One ubuntu-24.04 job, 240-minute limit, exact source devcontainer definition/cache, UID1000, original entrypoint and bootstrap preflight, Debian12/native amd64 check, umask022, no inherited environment and no global Cargo build/profile flags. Minimum 8GiB free checked before image/run. Source image is development-only, **not** a replacement SDK.

From the restored exact source, the helper runs in order (each through original bounded `scripts/ci-observe.mjs run`):

```sh
node --test scripts/native-golden.test.mjs
node --test scripts/text-workbench.test.mjs
just golden-write 'Review exact proposed backport shared golden source.'
just golden-check
```

Existing golden command platform/toolchain/preflight/qualification/comparison logic remains authoritative. First nonzero command stops subsequent commands and retains its exact status. Collector always starts `result.json` as incomplete; success needs all four original zero statuses and completed observer results, complete original logs, exact source HEAD/tree, and changes confined to tests/golden. Captures original full tests/golden tree, binary/full-index HEAD patch including new files, bounded logs/metadata/statuses, SHA256 inventory and actual source-container config/rootfs identity. Per retained file <=64MiB, aggregate <=256MiB; observer retains 32MiB head + rotating tails, and any truncation makes proposal incomplete. Only `complete-review-required` is emitted for a fully retained successful proposal; this is never acceptance. Failure/cancellation remains incomplete or missing completion. Artifact `backport-shared-golden-proposal-RUN-ATTEMPT`, retained 30 days; workflow log and source image identity remain additional diagnostics.

## Next dependency and unchanged acceptance requirements

Actual hosted shared output must be independently reviewed and imported byte-for-byte in a new source commit, with original run/source/generator identities. Do not hand-edit generated manifests or replace historical evidence. Native helper early stale-baseline refusal is expected until that import.

Then genuine dual-architecture native review is required using the original owner and real GitHub context:

```sh
node scripts/native-golden.mjs tests
node scripts/native-golden.mjs run "$SOURCE_REVISION" "$RUNNER_TEMP/native-golden"
```

Use genuine ubuntu-24.04 X64 and ubuntu-24.04 ARM64 runners and unchanged golden-development image locks (index42213da8…), preserving all 38 exporter-seed controls, locked acquisition/offline generation, write/check repetition, six raw native records and truthful review-required status. Current owner requires exact source fetch/workflow context; game-side reuse needs a separately reviewed exact-source/native-worker adapter after shared outputs exist. No forged GitHub variables, d6 substitution or new native implementation in this checkpoint.

After shared/native review and import, capture a **new** candidate and rerun all eight original source partitions plus assembler at that same commit, after original workers finish. Original run44002718718 failures remain failures. Parent identified an additional wrapper-owned inherited CARGO_BUILD_JOBS conformance failure; this new workflow does not export it and does not repair/replace that separate historical workflow. Installed unchanged-d6 integration and source-free/product gates remain distinct outstanding requirements; focused helper checks and golden proposals confer no SDK/product admission.

Final authored-source checks: `PATH=/workspace/diagnostic-tools/rust-1.97.1/bin:$PATH CARGO_HOME=/workspace/diagnostic-tools/cargo-home CARGO_NET_OFFLINE=true cargo fmt -p prismpm -p xtask -- --check` **exit0** (`target/baseline-fix-format.log`); existing exact-source `target/debug/xtask validate-model` **exit0**, “documents current, 209 ids, 92 codes, meta-gate and audits clean (R1)” (`target/baseline-fix-validate-model.log`). This model command is not full `xtask validate` or full VV. No pending local test process remains.
