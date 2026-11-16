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
