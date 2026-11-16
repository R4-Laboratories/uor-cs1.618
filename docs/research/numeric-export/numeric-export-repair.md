# Numeric export repair

2026-11-16. Isolated UORust repair committed as **bee4de1e77f6e15e91f36a04a779ae17cf748632** on `fix/numeric-export-eligibility`, worktree `/workspace/scratch/uorust-export-repair`, base `9d1f379676aa1099c4b88093608a37a66ba819f6`. Test-only follow-up **8716a9ce29e30bea96ee451cb16483b89b028ae2** adds explicit native success-value assertions. Original upstream checkout and all game product code, kernels and shipped Wasm were left untouched. No push was performed.

**Outcome:** repaired UORust's certification admission boundary. Direct or transitive roots reaching `Prelude::float*` now receive a stable `unbounded-float-model:` refusal, retained by root kappa in `refusals.toml`, and are omitted from production requests, including batched requests. Unrelated integer roots remain eligible. This conservative guard is locally tested, not release-accepted; the historical patch also violates the template-bound VERIFICATION.md hash, as corrected below. It does not implement full IEEE floating-point arithmetic.

Portable cumulative two-commit patch series against `9d1f379`: `numeric-export-eligibility.patch`, SHA-256 `4daef333a2dcd94c066e959ac9bcbc4dd2d82828c37f2b9a0a73805e3a042e81`. Stable tracking register: `numeric-export-issues.json`. Raw results: `numeric-export-evidence/`.

## Confirmed numerical boundary

The actual UORust Prelude was executed through its existing arbitrary-size test evaluator, instrumented only in test code to record the largest natural's bit length. Its final results matched the independent literal/host expectations while intermediates exceeded production Nat's 64-bit range:

| Exact model operation / input | Largest observed intermediate |
|---|---:|
| binary64 `1.0 * 1.0` | 105 bits (`2^104`) |
| binary64 maximal significands `(2^53-1)^2` | 106 bits |
| binary64 `1.0 / 1.0` | 160 bits (`2^159`) |
| binary64 `fma(1.0,1.0,0.0)` | 105 bits |
| binary64 `sqrt(1.0)` including root-search candidates | 325 bits |
| binary64 `1.0 + 2^-50` alignment | 103 bits |
| binary32 `1.0 / 1.0` | 73 bits |
| binary32 `sqrt(1.0)` including root-search candidates | 153 bits |
| `floatPow2 64` | 65 bits |
| binary64 to-u64 conversion of `1.0` (eager `2^64-1` mask) | 65 bits |

Sources in the repair checkout: `crates/uorust/assets/project/src/Prelude.lex.tex:1033` (`floatPow2`), `:1275` (`floatSumCore`), `:1308` (`floatMul`), `:1315` (`floatDiv`), `:1420` (`floatFma`), `:1427` (`floatSqrt`). Trace regression: `crates/uorust/src/mir/float.rs:1126`. A simple u128 replacement is insufficient for these algorithms. The higher sqrt widths are real trial-candidate squares, not the final square-root value.

## First actual production case

To distinguish rejection, checked failure and silent wrong execution, a minimal LexLean production root exported **only the exact Nat multiplication primitive used in floatMul's significand product**:

```
parameters: [a : Nat, b : Nat]
body: (prim multiply a b : Nat)
production: {effects: [overflow], targets: [rust-std]}
```

This root was accepted, kernel-checked and packaged. It was not rejected as ineligible. Bundle result:
`1d5242cc9705d62484e05139ec5548d40a773009dcdb3ec3184dc230cfc215ba`.
The unaltered generated package `src/lib.rs` has SHA-256
`e40a203ffa285ea6e04b9de084346d4e91fa31951e4e8af4788a6945d4e5c31e`.
It returns `Result<u64, Overflow>` and uses checked multiplication.

`lexlean production verify-artifact` replayed the output bindings successfully. As its output explicitly states, source-free replay did not rerun axiom audit, Lean elaboration, leanchecker or extraction; those ran in the preceding production build. The generated bundle records axioms `Classical.choice`, `Quot.sound`, and `propext`, rather than an axiom-free claim.

The emitted Rust was compiled unchanged to native and wasm32 using small external test wrappers. Both returned explicit `Overflow` on `2^52 * 2^52` and `(2^53-1)^2`. Zero, `u64::MAX * 1` and `2^23 * 2^23` controls succeeded. Node verified zero Wasm imports and asserted the results. There was no silent wrong result or trap in these tested cases. **The full floatMul/Div/Fma/Sqrt closure was not exported or compiled; that remains NEXP-003.**

Retained bundle and executables: `/workspace/scratch/numeric-probe/project/.lexlean/production/1d5242cc9705d62484e05139ec5548d40a773009dcdb3ec3184dc230cfc215ba`, `/workspace/scratch/numeric-probe/native`, `/workspace/scratch/numeric-probe/probe.wasm`.

## Toolchain provenance

The available cached SDK root was accessed by the existing Docker/chroot mechanism with a dedicated scratch mount. It has:

- LexLean 0.4.0 binary SHA-256 `9cba65a6cf2db6c1afc24c60d98621409c6f7eb9a1dcb99298bb658310f6e5d6`, exactly matching `/workspace/cs1.618/prism/prismpm.lock`.
- Inventory SHA-256 `0d4fe1864891ab1220a752d929a5a3a334f5987e0518a97f83f06fb5bdad105f`, exactly matching that lock's amd64 inventory.
- Cached Rust `1.97.1 (8bab26f4f 2026-07-14)` and Lean `leanprover/lean4:v4.32.1`.
- `rust-std` descriptor `957f6e9a7a87b504094f9c5d0ed9305aad7cbee156bba670acc8bda99db5224c`, explicitly 64-bit naturals and integers.

The game's image pin is `ghcr.io/uor-foundation/prismpm-sdk@sha256:d6c263a733a6bc36e0458c3f5b9a1f5ea9c14dfbe8c257d3f650a960b5fe633c`.
**UORust instead pins** `ghcr.io/afflom/prismpm-sdk-patched@sha256:c74e492aeac97208f83cfdddf40e1a43592b2280bd95f217255ac6bfbf7f8cd0`. That image was not cached. No large download, pin change or inventory bypass was attempted. These are compatible-toolchain diagnostic results, not UORust exact-image acceptance.

## Exact SDK inventory blocker

`xtask/src/bootstrap.rs:318` compares the amd64 entry in `prismpm.lock` with
`PRISMPM_SDK_INVENTORY=/opt/prismpm/share/inventory.json`. Expected inventory
SHA-256 is `5ab0a0e97253920e6e5eb1850a3118b1382e966c4a6996082cf4868a385dbb6a`;
observed is `0d4fe1864891ab1220a752d929a5a3a334f5987e0518a97f83f06fb5bdad105f`.
The full **17-entry expected/observed diff**, with exact IDs, versions, kinds
and hashes, is `numeric-export-evidence/sdk-inventory-diff.json`.
Examples: expected LexLean `5ffeb81962a84821cd3630e7599b469c49076696f3a4c60910ac82e65d253ee6`,
observed `/usr/local/bin/lexlean` `9cba65a6cf2db6c1afc24c60d98621409c6f7eb9a1dcb99298bb658310f6e5d6`;
expected PrismPM `e49d2f65488e8679291769972ecedbb2f47a84b9782433d2d1b8839b1fbba7a8`,
observed inventory entry `eae9a54a3d5164b75cd409b43746132b7d89a6c5b90885fdd3e6fbc632bfd0fc`;
expected `oscal-validator` `431b1cf86e5ae9bda64fe7f9f6b887d6466e3d9ea4d7bdae9f9f7c15c382e0e1`
is absent from the observed inventory. The other differences include stdlib,
contracts, conformance and SDK evidence, not just one executable lookup.

This is a **pre-existing environment mismatch**: the lock is byte-equivalent
as parsed JSON to `git show 9d1f379:prismpm.lock`, and the comparison code was
not changed. The loaded inventory exactly matches the game SDK, so substituting
an inventory path or changing PATH would misrepresent the running tools.
There is no evidenced small cached-path repair for this 17-artifact mismatch.
The exact patched SDK remains required; pins were left unchanged.

## Changes and verification

The behavioral change is 11 lines at `crates/uorust/src/certify.rs:994`; the rest is regression/evidence and reproducibility work. UE-20 was registered before implementation, with a scenario and failing test. The red test admitted `{direct, integer, transitive}` where only `{integer}` was expected. After the guard, it also validates public production request output, kappa-keyed refusals and an all-refused batch. Full model source stays available for proofs. The guard currently excludes all Prelude float closures conservatively, including helpers or restricted domains that might later acquire sufficient bounds; it does not analyze arbitrary hand-authored arithmetic or certify every non-float root safe. It reuses the existing marker's static definition-reference closure, not runtime branch or range analysis.

Coverage by operation: any reached Prelude float helper for add/sub/mul/div/remainder, sqrt/FMA, comparisons/classification, negation/abs/copy-sign, rounding and conversions is blocked. No claim is made that all fixed-format comparison/sign helpers intrinsically need wide arithmetic. MIR `to_bits`/`from_bits` use `Kind::Bits` and return the input bit-pattern term unchanged (`crates/uorust/src/mir/lower.rs:5402`), so a helper-free identity closure is not blocked by this guard; usual compiler eligibility still applies, and bitcast equivalence is not newly proved. The tests load all unused float definitions and keep integer/bit-identity roots eligible, while unqualified aliases, qualified Behavior aliases and a non-float-named Prelude alias that reaches floatMul are refused.

Commands executed inside the cached SDK, from the isolated worktree, using `CARGO_TARGET_DIR=/workspace/target/numeric-repair`, `CARGO_BUILD_JOBS=2`, `CARGO_PROFILE_DEV_DEBUG=0`, `CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_INCREMENTAL=0`:

```
cargo test --offline --locked -p uorust --lib certify::tests::marking_makes_the_roots_production_and_their_callees_executable -- --exact
cargo test --offline --locked -p uorust --lib ue_20 -- --nocapture
cargo test --offline --locked -p uorust --lib -- --nocapture
cargo run --offline --locked -p xtask -- check-model --write
cargo run --offline --locked -p xtask -- validate
cargo test --offline --locked -p uorust --test cli
cargo test --offline --locked -p repo-conformance --test bdd
cargo fmt --all -- --check
```

Results: baseline 1 passed; red UE-20 run 1 failed as intended and 1 numerical trace passed; final **147 library tests, 12 CLI tests, 4 BDD meta-gate tests passed**. The final two UE-20 tests also passed after adding qualified/Prelude aliases, helper-free bit identity and the conversion-mask trace; these were test-only refinements after the broad suites. Formatting and `git diff --check` passed. Generated `CONFORMANCE.md` matches the model. `xtask validate` passed model/error/deferral/dependency checks and then stopped with **`prismpm.lock native artifact inventory disagrees with the running SDK`**. The AGENTS.md-required complete `just vv` remains blocked by the missing exact patched SDK. No full-release or universal equivalence claim is made.

Primitive probe commands (dedicated `/workspace/scratch/numeric-probe/run-sdk.sh` maps scratch to `/workspace`):

```
lexlean --project /workspace/project/lexlean.toml fmt
lexlean --project /workspace/project/lexlean.toml lock
lexlean --project /workspace/project/lexlean.toml production build --request /workspace/project/request.json
lexlean production verify-artifact /workspace/project/.lexlean/production/1d5242cc9705d62484e05139ec5548d40a773009dcdb3ec3184dc230cfc215ba
sh /workspace/compile-probe.sh
```

`compile-probe.sh` invokes Rust 1.97.1 directly on the generated source for native and wasm32 rlibs, links the committed wrappers, and executes native controls. The Node probe asserts the actual Wasm results. A portable version of these commands and all fixtures is committed as `scripts/probe-numeric-export.sh`; it was syntax-checked and its fixture/individual commands were exercised, but the new wrapper was not rerun end-to-end to repeat the same proof build.

## Remaining work

NEXP-001 is fixed locally; NEXP-002 tracks source-owned multi-limb/bounded arithmetic; NEXP-003 tracks full IEEE-root export and compiled replay; NEXP-004 records the diagnosed checked-overflow behavior; NEXP-005 tracks exact-SDK release validation; NEXP-006 tracks later Three.js/CPU/GPU fidelity and performance. Independent review passed with no blocking defect; its minor native assertion finding was resolved below. Exact-SDK acceptance remains required before upstream publication. The game remains on its existing implementation.

## Review follow-up: explicit native value checks

The separate test-only commit **8716a9ce29e30bea96ee451cb16483b89b028ae2** (`Assert native numeric probe success values`) adds three lines to the native fixture: after checking error status, each successful result is asserted equal to `a * b`. The guard, pins, AGENTS.md and workflows were unchanged. The fixture was compiled with the cached SDK's Rust against the retained, unmodified generated native rlib; no production proof build was repeated. The existing Wasm binary was rerun with the committed Node assertion fixture.

Commands executed:

```
cp /workspace/scratch/uorust-export-repair/crates/uorust/tests/fixtures/numeric-export/native.rs /workspace/scratch/numeric-probe/native-refined.rs
bash /workspace/scratch/numeric-probe/run-sdk.sh rustc --edition=2021 /workspace/native-refined.rs --extern numeric_significand_probe=/workspace/libnumeric_significand_probe.rlib -o /workspace/native-refined
bash /workspace/scratch/numeric-probe/run-sdk.sh /workspace/native-refined
node /workspace/scratch/uorust-export-repair/crates/uorust/tests/fixtures/numeric-export/probe.mjs /workspace/scratch/numeric-probe/probe.wasm
```

Both controls passed: zero = 0, u64 edge = 18446744073709551615, binary32 product = 70368744177664; both binary64 products returned overflow. Wasm again had zero imports. Evidence is `numeric-export-evidence/native-refined-replay.log` and `wasm-refined-replay.log`. `git diff --check` passed. The cumulative patch and review diff now include both commits. The full portable wrapper was still not run end-to-end, and the exact-SDK acceptance limitation remains unchanged. No publication occurred.

## Correction: historical policy-file violation

The workflow integration review identified an additional release blocker missed by the initial review: historical commit `bee4de1` appended project evidence to `VERIFICATION.md`, which `template.lock` byte-binds as a universal policy file. I independently recomputed every listed policy-file hash. The other five match; `VERIFICATION.md` does not: expected/base SHA-256 `0912821fea354276fff5faa2b6b6ded0cdf4ef86112ad035b41a0a7a0513bd21`, historical candidate SHA-256 `92cede46bbda7a955e633511a77db26cb52098c6e616e6afb4f41c6a1073b9d9`. This violates the explicit AGENTS.md policy-file boundary. The historical candidate would fail the template gate even with the exact patched SDK available.

The original scoped guard-code assessment remains valid, but the earlier release-blocker account was incomplete: both the SDK mismatch and this policy-file mutation block historical acceptance. The historical patch is not release-ready. Its worktree and patch are preserved unchanged as historical evidence. The current port addresses packaging by placing project-specific evidence in `docs/numeric-export.md` and preserving universal policy files and pins; that candidate requires a separate review against current upstream, including every byte-bound policy file and lock predicate. This correction does not claim that the current port has already passed review or full acceptance.
