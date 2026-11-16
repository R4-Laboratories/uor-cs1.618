# Task2c-A source fix round1 review

Scope: the P1 finding from `source-stage-review.md` and new breakage in the
four-file fix diff. Reviewed base `634c2c5e52c039299e0a9207a5562cb9c41600b9`
to candidate `9396a2a00c635ff749eaaf304245fe84d6b3c08b` in
`/workspace/scratch/lean4-prod-numeric`. The checkout reports that exact candidate.
Read the original brief/review, the fix report, the supplied diff and the changed
source with line numbers. `git diff --check` for this range returned exit 0.
No implementation edits, Lean execution, builds, SDK acquisition, commits,
pushes, or delegation were performed during this review.

## Spec verdict: scoped static approval; final acceptance pending execution

The original P1 is addressed in the inspected source. Reconstruction and
erasability are now separate checks, and both reconstructed dictionaries must
pass `validateErasure` before their IDs become consumed
(`lean/Prod/Conversion.lean:149-152`, `:209-212`).

The new evaluator checks application arguments before beta reduction and let
values before substitution (`:84-86`, `:112-120`). Consequently a dictionary
factory cannot discard its overflowing scalar dependency before that dependency
is inspected. The check visits a projected constructor before selecting its
field (`:87-92`), covering the analogous discarded-field case.

Safe-definition metadata is no longer sufficient for erasure. Zero-argument
aliases are inspected recursively, and syntactic function bodies remain delayed
until application (`:93-110`, `:141-144`). Thus the hidden scalar alias and hidden
branch variants cannot bypass inspection merely by returning a canonical
dictionary under kernel reduction. Recursor/branch evaluation has no accepting
case; the scalar construction exceptions are explicit literal representation
operations, rather than general kernel evaluation. Exhausted fuel refuses.

Existing field/type validation and backward liveness are retained. The change
does not modify the Rust backend, expected generated files, Cargo locks, SDK
pins, or replay gates. This scoped approval closes the static objection to eager
consumed-graph deletion; it does not establish whole-compiler equivalence or
validate arbitrary delayed field bodies beyond the existing semantic boundary.

## Quality verdict: scoped static approval; execution evidence pending

No actionable new issue was found in the fix diff. The evaluator has a small,
explicit acceptance grammar and fails closed on unsupported evaluation and
excessive alias depth. The design records its conservative rejection behavior
and the remaining distinction between eager construction and delayed field
execution.

The four regression probes exercise the affected production path rather than
only calling a private predicate. `withConsumedDependency` replaces the actual
extracted conversion target and inserts its eager dependencies immediately
before that let (`lean/Conformance/NumericConversion.lean:19-41`, `:92-109`).
This avoids leaving an unrelated original target dictionary behind. Each probe
requires the exact non-inert-dependency error (`:111-116`), so an earlier field
or type rejection cannot masquerade as validation of the new check.

The probes cover a direct scalar dependency, the same dependency through a
function alias, a zero-argument alias hiding scalar evaluation, and a
zero-argument alias branching on that evaluation. The original unrelated unused
overflow probe and native/import-free Wasm replay are unchanged. Refused graphs
appropriately have no generated-backend execution claim; the accepted unused
overflow still requires generated `AddOverflow` replay.

## Evidence required before final acceptance

No actual Lean elaboration, compilation, new-probe execution, or generated
native/Wasm execution for `9396a2a` has been reviewed. API-source and shell syntax
checks do not establish those outcomes. The pending baseline run for `634c2c5`
cannot validate this fix revision.

Fresh exact-candidate CI must demonstrate:

- Compilation of the added evaluator and fixture code with the pinned SDK.
- The four exact production refusals and all retained positive canonical /
  renamed-dictionary cases.
- The retained unrelated-unused-failure behavior and existing generated native
  and import-free Wasm replay at optimization levels 0 and 2.
- The affected regression and generated-output evidence required by the original
  source-stage review, with any unrelated failed gates reported as failures.

Static approval is therefore available promptly, but source-stage acceptance
remains pending fresh execution evidence and its review.
