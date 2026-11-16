# Task2c-A source review fix round1

Status: source repair committed for diagnostic CI and independent review;
execution validation is pending. This is not upstream publication or approval
of the compiler candidate.

Source: `/workspace/scratch/lean4-prod-numeric`, branch `numeric-export-repair`.
Base: `634c2c5e52c039299e0a9207a5562cb9c41600b9`.
Fix: `9396a2a00c635ff749eaaf304245fe84d6b3c08b`
(`Refuse non-inert consumed conversion dependencies`).

## Change

`lean/Prod/Conversion.lean` now keeps kernel reconstruction/field validation
separate from eager erasability. Before marking either dictionary consumed, a
fuel-bounded evaluator checks construction of both reconstructed expressions.
It checks arguments and let values before beta substitution or projection can
discard them, inspects safe alias bodies, and refuses recursors, branches,
bounded scalar arithmetic, and opaque calls/thunks. Pure aliases, dictionary
constructors, projections, and delayed function references remain recognized.
Literal Nat/Int representation and standard numeral/negation wrappers are
handled structurally; scalar expressions are not accepted merely because they
are definitionally equal to literals. Arbitrary safe definitions are no longer
enough to authorize erasure. Existing semantic/type validation and backward
liveness guards remain in place.

`lean/Conformance/NumericClosureFixture.lean` defines safe constants and aliases
for four counterexamples. `lean/Conformance/NumericConversion.lean` replaces the
actual extracted `widen` target let, inserts any eager dependencies immediately
before it, and invokes production `Prod.emitKernelIr`. No unrelated old target
dictionary is left behind. Each probe requires exactly:

```
noncanonical checkedConvert non-inert dictionary dependency
```

The probes cover direct `canonicalAfter (Nat.add maxNat oneNat)`, the same
application through a function alias, a closed dictionary alias hiding the
scalar dependency behind another safe alias, and a closed dictionary alias
branching on that addition. The mathematical addition is `2^64`; the branch
selects the canonical dictionary under kernel reduction. Field validation runs
before the new check, so the expected exact error distinguishes erasure refusal
from earlier semantic/type refusal.

The RED path is a static trace, not an executed result: on the base implementation
all these safe closed expressions reconstruct, canonical field checks can
succeed, and pruning follows and erases the failing consumed graph. The new
tests would then reach their `failing consumed dependency admitted` assertion.

The original unrelated unused-overflow insertion is byte-identical. Its existing
generated native and import-free Wasm replay, at optimization levels 0 and 2,
still requires `AddOverflow`. The new cases deliberately refuse source export;
there is no generated-backend replay claim for those refused cases. Existing
positive canonical and renamed-alias roots and all previous refusal probes are
retained. No generated expectations, Rust backend, Cargo lock, SDK pin, gate,
timeout, game wrapper, or candidate bundle was changed.

`specs/designs/numeric-conversion-normalization.md` records the exact eager
acceptance grammar, fuel refusal, regression paths, and evidence limits.

## Checks actually performed

All commands ran in `/workspace/scratch/lean4-prod-numeric` unless noted.

- `git diff --check`: exit 0, no output, before commit.
- `bash -n scripts/check-numeric-conversion.sh`: exit 0, no output.
- `bash -n scripts/check-numeric-source-stage.sh`: exit 0, no output.
- A Python comparison read `git show HEAD:lean/Conformance/NumericConversion.lean`
  before committing and the worktree file, then compared the entire independent
  unused-failure block from its comment through the final write. It also checked
  the four-file change set and empty diffs for the native/Wasm replay fixture,
  focused gate, and Cargo locks. Output:

  ```
  PASS: independent unused-failure block byte-identical; replay/gates/locks untouched; four-file scope
  ```

- Reviewed the full four-file diff, then the final changed test/spec diff.
- Used Python `urllib.request.urlopen` to read individual source files from
  `https://raw.githubusercontent.com/leanprover/lean4/v4.32.1/` (no SDK/binaries
  fetched). Checked `Expr.isLambda`, `Expr.isForall`, `Expr.getAppArgs`,
  `Expr.instantiate1`, `Expr.instantiateLevelParams`, `DefinitionSafety`'s `BEq`,
  `ConstructorVal.induct/numParams`, `OpaqueVal.isUnsafe`, `Meta.isProof`, and
  `Array.foldr`. Read `Init/Data/Int/Basic.lean` to confirm `instOfNat`,
  `instNegInt`, `Int.neg`, and their literal-representation path. These are API
  source checks, not Lean elaboration or compilation.
- `for tool in lean lake nix cargo rustc node; do command -v "$tool" || true; done`:
  only Node was present, at
  `/opt/codex/runtimes/codex-primary-runtime/dependencies/node/bin/node`.
- Commit command succeeded:

  ```
  [numeric-export-repair 9396a2a] Refuse non-inert consumed conversion dependencies
   4 files changed, 221 insertions(+), 20 deletions(-)
  ```

- `git status --short` after commit: no output (clean source checkout).

## Pending evidence and limits

No local Lean compilation, RED/GREEN execution, native/Wasm replay, or broad
source-stage suite was run. The environment has no local Lean SDK; none was
downloaded. The controller must snapshot this exact commit to real pinned-SDK
diagnostic CI, retain the actual generated artifacts/logs, and request independent
review. Any compilation or refusal/positive-case failures require follow-up.

The argument covers eager dictionary construction and consumed-dependency
deletion. Lambda bodies stored in fields are delayed; the existing field check
is still kernel definitional equality. This repair does not prove arbitrary
definitionally equal function bodies preserve bounded-target failures when
invoked. The design explicitly records that limit rather than treating these
empirical probes as a universal compiler-equivalence theorem. The 256 fuel
limit deliberately refuses sufficiently deep otherwise-pure aliases.

No subagents, upstream push, PR, or other publication was performed. The only
write outside the source checkout is this requested report.

## Fix round2: observed compiler literal-constructor mismatch

Actual diagnostic CI run `43974835116`, on source commit `9396a2a`, failed
compiler preflight. Read the retained log at
`artifacts/numeric-task2c/ci-43974835116/compiler-preflight.log` in the game
checkout. The observed diagnostic was:

```
error: Prod/Conversion.lean:81:12: Unknown constant `Lean.Literal.nat`

Note: Inferred this name from the expected resulting type of `.nat`:
  Literal
error: Lean exited with code 1
```

This is a compilation failure, not evidence for any downstream refusal or
native/Wasm replay result. The controller reported original SDK/lock integrity
finalization passed and no downstream gates ran.

Fixed both Expr literal patterns in `inertValue?` from `.lit (.nat n)` to
`.lit (.natVal n)`. The latter is the pinned `Lean.Literal` constructor;
`Lean.Compiler.LCNF.LitValue.nat` is a distinct constructor and the existing
LCNF fixture literals intentionally remain `.nat`.

Commit: `7c2a42c239a8f2ecde7bd4ec110c0540337b8d0d`
(`Use Expr natural literal constructors in erasure check`). It changes one file,
two insertions and two deletions, with no other behavioral changes.

Checks actually performed:

- Read individual pinned v4.32.1 `src/Lean/Expr.lean` and
  `src/Lean/Compiler/LCNF/Basic.lean` source files through Python urllib (no SDK
  or binaries fetched). Confirmed `Literal.natVal/strVal`, `Expr.lit : Literal →
  Expr`, nearby `Expr.letE/proj` constructor signatures, and `LitValue.nat/str`.
- `git diff --check`: exit 0, no output.
- Reviewed the entire two-line source diff.
- Python asserted the file equals the previous committed file with exactly the
  two `.lit (.nat n)` patterns replaced, that it is the only changed file, and
  that both existing LCNF overflow-fixture literals are unchanged. Output:

  ```
  PASS: only two Expr Literal constructor corrections; LCNF .nat fixtures unchanged
  ```

- Commit succeeded; `git status --short` afterward returned no output.

No local Lean compilation or execution was available or claimed. Fresh actual
pinned-SDK CI must validate this exact correction and then run the downstream
gates. No upstream push, generated expectation edit, SDK/lock change, or game
diagnostic wrapper change was made.

## Baseline fixture correction following round2

The controller supplied completed baseline run `43973785776`, for source
`634c2c5`, with compiler preflight and broader gates passing but focused
validation failing. Read the retained focused log at
`artifacts/numeric-task2c/ci-43973785776/focused.log` in the game checkout:

```
Build completed successfully (13 jobs).
ordinary helper and renamed signed helper exported
Conformance/NumericConversion.lean:48:35: error(lean.synthInstanceFailed): failed to synthesize instance of type class
  Inhabited Prod.ExtractedDef
```

The fixture used `extracted[0]!`, which requires an `Inhabited` fallback. Replaced
that single line with checked optional indexing and an explicit refusal:

```lean
let some first := extracted[0]? | throwError "missing extracted widen definition"
```

No placeholder/default instance was introduced. Subsequent missing-declaration
and missing-code checks remain unchanged.

Commit: `3a1520fb2e3b9e57fb70979d732aa0340ffab847`
(`Check extracted numeric fixture before indexing`), directly atop `7c2a42c`.

Local checks: `git diff --check` exited 0; reviewed the entire one-line diff;
a Python assertion verified exactly that one replacement and a one-file change
set, printing:

```
PASS: one checked-indexing fixture correction; no default instance or other changes
```

The commit changes one file with one insertion and one deletion. Source status
after committing is clean. This baseline failure and its broader-gate results
do not establish success for the current repaired candidate. No local SDK,
Lean execution, or native/Wasm replay was available; the controller will snapshot
both confirmed compilation corrections together and rerun actual diagnostic CI.

## Fix round3: actual isolated Lean execution and live-type discovery repair

The controller installed the publisher's Lean 4.32.1 component separately from
the SDK and supplied initial local diagnostics on `3a1520f`. This changes the
earlier no-local-toolchain evidence boundary; these are component-only diagnostic
results, not full pinned-SDK acceptance. The observed executable is
`/workspace/diagnostic-tools/lean-4.32.1-linux/bin/lean`, with SHA-256
`e8baaa71855a616dc351028f3ad2200051b0671f423a1696a100e809302d5550`, matching
the SDK compiler binary per the controller's retained toolchain record. Its
reported version is Lean 4.32.1, commit
`f054605aea4b840552cca2e725580bffd1e1b704`, Release.

Initial actual local `NumericConversion.lean` diagnostics reported the ambiguous
`.fvar` pattern in `conversionTarget?`; added the explicit scrutinee type
`Option (Arg .pure)`. Marked the four new class-valued alias definitions
`@[implicit_reducible]`, matching the existing fixture discipline and eliminating
the compiler warnings. The overflow probes still insert their calls after LCNF
extraction; these annotations do not bypass their production normalization tests.

The next actual run compiled and passed `NumericClosure`, then failed the
existing live-dictionary assertion. An isolated export probe showed this real
type-discovery gap before the source repair:

```
(def liveDictionary ((x UInt32))
  (Tuple (Option UInt64) (named "SemanticFixture.Portable.LexLeanRuntime.Fixed"))
  ...)
```

There was no `Fixed` type declaration, and `unsupported_types` was empty. The
LCNF dictionary value itself was already erased and lowered to `0`; the live
dictionary type remained in the result. `declTypeNames` looked only at the outer
`Prod` head, while `lowerType` recursively rendered the nested named type.

Repaired signature discovery in `lean/Prod/Lower.lean` to follow exactly the
builtin containers already followed by `lowerType`: `Prod`, `List`, `Option`,
and `Except`. Other parameterized types still declare their head and remain
unsupported. The existing live-dictionary gate was retained unchanged. Actual
generated IR after the repair now includes:

```
(type "SemanticFixture.Portable.LexLeanRuntime.Fixed" (unsupported "type parameters"))
```

The return type/body stay the same; the corresponding declaration is also in
`unsupported_types`. This is actual IR/coverage evidence, not yet a codegen
refusal or native/Wasm result. The separate codegen gate must still reject this
IR. The design document records why nested live types must remain visible.

Commit: `ec06da8eaf56e9fc2624cd8d6e3be8274b94a983`
(`Preserve nested dictionary refusal in numeric fixtures`). Four files changed,
32 insertions and 12 deletions. Full diff and whitespace checks passed; the
source checkout was clean after commit. No generated expectation, safety gate,
SDK pin, lock, or diagnostic wrapper was changed.

Actual final local commands (working directory `lean/`, with
`PATH=/workspace/diagnostic-tools/lean-4.32.1-linux/bin:$PATH` and
`set -euo pipefail`):

```
lake build ProdLib Conformance.NumericClosureFixture
lake env lean Conformance/NumericClosure.lean
lake env lean Conformance/NumericConversion.lean
```

All three exited 0. The final build output had no warnings, ending with
`Build completed successfully (13 jobs).` The fixture outputs were:

```
ordinary helper and renamed signed helper exported
numeric conversions: canonical, renamed, four semantic, two type and four consumed-dependency refusals, live residue, and failing unused operation
```

Full logs, exact command record, toolchain identity, tested source diff and
commit identity are retained in the source checkout at
`output/numeric-source-fix-round3/`: `build-2.log`, `closure-2.log`,
`conversion-2.log`, `lean-commands.txt`, `lean-toolchain.json`, `candidate.diff`,
and `candidate-commit.txt`. Initial failed execution logs are `build.log`,
`closure.log`, and `conversion.log`. Actual before/after diagnostic exports and
coverage are `live.ir`, `live.coverage.json`, `live-after.ir`, and
`live-after.coverage.json`; probe output logs are `live-probe.log` and
`live-probe-after.log`. A first scratch probe lacked `Lean.logInfo` qualification;
that diagnostic-only scratch file was corrected before the retained export runs.

The four exact consumed-dependency source refusals have now actually executed
successfully, as have the retained Lean positive/semantic/type/live/unused checks.
Generated native/Wasm execution and the full source-stage gates remain pending.
The additional production type-discovery change also requires scoped review.

## Round3 continued: actual generated native/import-free Wasm replay

The controller supplied isolated Rust 1.97.1 host and Wasm components, with
`rustc` SHA-256
`d3a664c970a9fd8361b64194861bebc1ae37b9054e5ee3400dc1c9e691797eea` and
`cargo` SHA-256
`828980723df339d62434390e9fb8ef8831036583343ae2316b7ab5646b5c1953`, matching
the SDK binaries. Their exact locked dependencies were fetched into a separate
Cargo home. `rust/Cargo.lock` remains unchanged from `634c2c5`, SHA-256
`c794ca08da2ab6695e401c5f506d6e0187f71185e33219c0dff0841a2a424eb0`.
Local Node is `v24.22.1`, which differs from the SDK; this remains component-only
diagnostic execution, not full SDK acceptance.

The first actual full focused run generated both Rust files from actual Lean IR
and observed the expected live-dictionary codegen refusal:

```
Code generation refused: PolymorphicType("SemanticFixture.Portable.LexLeanRuntime.Fixed"): type `SemanticFixture.Portable.LexLeanRuntime.Fixed` has type parameters; monomorphization is not implemented
```

It then failed native compilation because `include!` cannot include generated
files beginning with the inner attribute `#![allow(dead_code)]`. The complete
failure is retained in `output/numeric-source-fix-round3/focused.log`.

Repaired only the replay fixture's module wiring: use `#[path]` modules for the
two untouched generated files and re-export numeric definitions at crate root
so existing generated `crate::Counter` references resolve. All replay assertions,
including `unused::unusedFailure(0) == Err(ComputeError::AddOverflow)`, are
byte-identical. No generated file or expected value was hand-edited; the focused
script and its native/Wasm/import gates are unchanged. The design's evidence
paragraph now reflects actual component-level execution rather than the earlier
no-local-toolchain condition.

Final round3 source commit: `2a13f942b04f0828e03c5d7db7e4db6ecb626d6e`
(`Load generated numeric replay files as Rust modules`), atop `ec06da8`.
The wrapper/spec follow-up changes two files, 10 insertions and six deletions.
Diff/whitespace checks passed and the source checkout is clean.

Actual rerun command, from the source checkout:

```
export PATH=/workspace/diagnostic-tools/rust-1.97.1/bin:/workspace/diagnostic-tools/lean-4.32.1-linux/bin:$PATH
export CARGO_HOME=/workspace/diagnostic-tools/cargo-home
export RUSTC_WRAPPER=
export CARGO_PROFILE_DEV_DEBUG=0
export CARGO_PROFILE_TEST_DEBUG=0
export CARGO_INCREMENTAL=0
export CARGO_BUILD_JOBS=2
set -o pipefail
bash scripts/check-numeric-conversion.sh 2>&1 | tee output/numeric-source-fix-round3/focused-2.log
```

Exit 0, ending:

```
numeric helper/conversion refusals and generated native/import-free Wasm replay passed
```

This actual run passed the Lean positive/refusal probes, both real IR-to-Rust
generations, the live `PolymorphicType` rejection, native execution at optimization
levels 0 and 2, and Wasm compilation/instantiation at both levels with exactly
zero imports and `numeric_check() == 0`. The native and Wasm checks include the
unchanged independent `AddOverflow` assertion. Generated-code warnings for
parentheses, unused variable, and naming remain in the full log; no lint or
failure gate was weakened to obtain success.

Evidence is retained under `output/numeric-source-fix-round3/`: full
`focused-2.log`, `focused-commands.txt`, `focused-toolchain.json`,
`replay-wrapper.diff`, and `generated-artifacts.sha256`. The actual generated IR,
Rust, rejection log, replay wrapper, native executables, and Wasm binaries remain
under `output/numeric/`; the hash manifest covers them. These paths are in the
source checkout for controller archival, not written into game artifacts here.

Focused component diagnostics now pass. Fresh full pinned-SDK CI and scoped
review of the round3 production type-discovery change remain required; baseline
broader-gate success is not attributed to this candidate.
