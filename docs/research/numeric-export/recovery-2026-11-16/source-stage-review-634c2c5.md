# Task2c-A compiler source review

Review target: `/workspace/scratch/lean4-prod-numeric`, base
`991956fe427bb646498fd0912c89b71be71e7beb`, candidate
`634c2c5e52c039299e0a9207a5562cb9c41600b9`.

This is a static source review of the supplied package, not whole-branch approval.
The current checkout identity matches the candidate. No implementation was
edited, no compiler/build/SDK was run or fetched, and no commit or push was made.
Current-candidate execution evidence remains pending from the controller.

## Spec verdict: changes required; execution validation pending

The pass runs once before both type discovery and lowering, validates actual
operand/result types, checks exact source interpretation and target conversion
fields, and keeps live dictionary residue visible in named coverage. The named
extraction option is scoped and does not recognize specialization spellings.
The patch does not change Rust lowering, Cargo.lock, or SDK identity and adds no
axioms or `sorry`.

However, the consumed-graph deletion can erase bounded-target failure. This
violates the explicit eager/failure preservation requirement, so the candidate
cannot receive spec approval even if its present focused tests pass.

## Quality verdict: changes required

One actionable P1 finding follows. The existing focused corpus is useful, but
its unused-failure test is disconnected from the consumed dictionary graph and
does not cover the failure introduced by pruning that graph. Current-candidate
native/Wasm replay and broad-regression evidence are still needed separately;
no full-suite success is claimed.

## P1: kernel-total dictionary dependencies are not safe to erase in bounded target semantics

Locations: `lean/Prod/Conversion.lean:38-60` accepts arbitrary safe definition
applications as reconstructed closed values; `:120-122` authorizes dictionary
consumption after checking projected values; `:153-155` propagates deletion to
every argument of a deleted let without checking bounded-target failure.

`safe`/nonpartial Lean definitions and definitional equality prove facts about
Lean terms. They do not prove that evaluating a closed argument succeeds under
the exporter's checked bounded-Nat semantics. Projection reduction can discard
an argument semantically while the original LCNF evaluates that argument eagerly.

A concrete, well-typed reproduction shape is available using the same
post-extraction LCNF mutation technique as the existing unused-failure probe.
Provide safe definitions:

```lean
def maxNat : Nat := 18446744073709551615
def oneNat : Nat := 1
def canonicalAfter (_ : Nat) : LexLeanRuntime.Fixed UInt64 := inferInstance
```

Starting with the extracted `widen`, insert lets before its target dictionary:

```text
a        : Nat := const maxNat [] []
b        : Nat := const oneNat [] []
overflow : Nat := const Nat.add [] [fvar a, fvar b]
target   : Fixed UInt64 := const canonicalAfter [] [fvar overflow]
```

Keep the original source dictionary, operand and conversion. Here `target`
replaces the original target dictionary let. The static control-flow trace is:

1. `closedValue?` records the zero-argument safe constants, the closed `Nat.add`
   application, and `canonicalAfter overflow`.
2. `Meta.check` accepts the reconstructed terms. The target projections reduce
   to the canonical dictionary because `canonicalAfter` ignores its argument;
   all four checked fields pass definitional equality.
3. The conversion marks `target` consumed and removes its dictionary operands.
4. Backward pruning deletes `target`, marks `overflow` consumed, deletes the
   `Nat.add` let, and recursively deletes `a` and `b`.

The bounded-target computation should fail with `AddOverflow`; the normalized
conversion instead succeeds. This is a static trace, **not an executed new
regression result**. Injecting after extraction deliberately isolates the pass
from Lean simplifier DCE, just as `Conformance/NumericConversion.lean:65-77` does.
The current probe uses `.lit` inputs and leaves its failing addition unrelated
to the consumed graph; it does not challenge this deletion rule.

Requested repair: distinguish reconstructability in the kernel from permission
to erase eager target evaluation. Restrict deletion to an independently
validated inert graph of dictionary construction, function references and
projections. If scalar computations or unclassified calls feed that graph,
either refuse normalization or retain their evaluation and existing refusal
behavior. Merely requiring a safe definition or adding literal reconstruction
does not solve this issue. Preserve renamed canonical dictionary support.

Add the dependent-overflow regression above. Verify that production export
either explicitly refuses the graph or retains its checked failure; where
accepted, generated native and import-free Wasm must observe `AddOverflow` at
both existing optimization levels. Keep the unrelated-unused-operation probe.

The same finding has a hidden-body variant: a closed zero-argument dictionary
alias can compute `maxNat + oneNat` in its body before choosing a dictionary.
For example, choose a noncanonical dictionary when that sum equals zero and
the canonical dictionary otherwise. Kernel reduction sees the mathematical
sum `2^64` and validates the canonical branch, while bounded eager evaluation
must fail on the addition. `closedValue?` accepts the alias solely from its
safe definition metadata, and pruning deletes its call. This variant also
needs a probe that preserves the call through extraction (or inserts it into
LCNF). Rejecting only explicit scalar arguments is insufficient: an erasability
check for aliases must inspect their bodies/dependencies and distinguish inert
canonical aliases from computed dictionary factories. Function bodies stored
as dictionary fields need not be eagerly evaluated merely to construct a
dictionary, so that distinction should remain explicit. These hidden-body
cases are static observations, not executed evidence.

## Evidence boundaries and outstanding checks

- The historical reconstruction report describes lost execution results and
  does not validate this candidate.
- Run `43966373788` is evidence for its actual earlier reconstructed revision,
  including its recorded failures, not an execution approval of `634c2c5`.
- Run `43970122933` stopped before source gates and provides no source validation.
- Fresh focused CI for `634c2c5`, actual generated named IR/Rust, and native /
  import-free Wasm replay remain pending. The requested new regression and fix
  will require evidence for their own candidate revision.
- Expected named fixture edits are temporary-identifier-only by source diff;
  provenance as real regenerated output must be assessed from retained fresh
  compiler artifacts, not inferred from that shape alone.

This report is intentionally available before CI completes so the semantic
finding can be addressed without waiting for unrelated gate execution.
