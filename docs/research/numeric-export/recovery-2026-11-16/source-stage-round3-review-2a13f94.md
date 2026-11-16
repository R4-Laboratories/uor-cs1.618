# Task2c-A round3 scoped review

Reviewed `3a1520fb2e3b9e57fb70979d732aa0340ffab847` through
`2a13f942b04f0828e03c5d7db7e4db6ecb626d6e`, including the supported-container
discovery change and retained component-level execution evidence. The source
checkout reports the exact latter commit. No implementation edits, build/test
reruns, or delegation were performed. The requested review report is the only
new file written by this review.

## Spec verdict: approve scoped changes and focused component evidence

No actionable finding remains in this delta. The original consumed-dependency
P1 remains statically addressed, and the retained focused run now executes all
four exact refusal probes successfully. The unrelated eager overflow remains
in generated IR/Rust and its native/Wasm replay passes.

`signatureTypeNames` (`lean/Prod/Lower.lean:885-894`) mirrors exactly the four
recursive container patterns in `lowerType`: `Prod`, `List`, `Option`, and
`Except`. It follows both sides of the binary containers. The different order
used when rendering `Except` as `Result` has no effect on discovery: both names
are collected, then deduplicated and sorted by existing `collectTypeDecls`.
Builtin container heads remain filtered by `isPortableBuiltinTypeName`.

For other applied types the existing head-only behavior is preserved, so this
does not admit arbitrary parameterized types. Function/opaque type handling is
not expanded. Existing body-based and transitive constructor-field discovery
remain in place. The parameter and stripped-result walks now include supported
container payloads (`:908-915`), matching the names type lowering actually emits.

The actual before/after live-dictionary IR differs only by the new unsupported
`Fixed` declaration; the corresponding coverage change populates
`unsupported_types`. The retained codegen log then explicitly rejects this IR
with `PolymorphicType("SemanticFixture.Portable.LexLeanRuntime.Fixed")`. Thus
the live nested dictionary remains refused, including when its LCNF value was
already erased.

## Quality verdict: approve scoped changes; full SDK regression acceptance pending

No actionable new issue was found. The type-discovery change is small and
consistent with the existing lowerer's supported shapes. The unchanged live
dictionary assertion supplies a real regression check for the observed gap.

The explicit `Option (Arg .pure)` annotation disambiguates the fixture pattern.
The four reducibility annotations let canonical fields reach their intended
validation path; the tests still insert calls after extraction and require the
exact non-inert-dependency refusal, so simplifier erasure cannot substitute for
testing the production normalization pass.

The replay fixture now loads generated files through `#[path]` modules, allowing
their inner attributes without editing generated source. Re-exporting generated
definitions preserves `crate::Counter` resolution. The assertions and the
`ComputeError` binding are unchanged; actual generated Rust retains checked
arithmetic and `TryFrom` conversion behavior. The generated failure function
uses `checked_add(...).ok_or(AddOverflow)?` before the conversion.

## Evidence reviewed and limits

Read `output/numeric-source-fix-round3/focused-2.log`, the exact command and
toolchain records, the before/after live IR and coverage, generated numeric and
unused-failure IR/Rust, and the actual live rejection log. The focused log ends
with the successful native/import-free Wasm replay marker. Its unchanged
`set -euo pipefail` script runs native and Wasm at optimization levels 0 and 2,
asserts zero Wasm imports and return value zero, and preserves the independent
`AddOverflow` assertion.

Verified all 13 entries in `generated-artifacts.sha256` with `sha256sum -c`;
every retained artifact matched. `git diff --check` for the reviewed range passed.
This review did not re-execute those programs or independently re-download the
toolchain. The retained record identifies Lean 4.32.1 and Rust/Cargo 1.97.1 binary
hashes reported as matching the SDK, and explicitly identifies local Node
24.22.1 as different.

Focused component execution is now supported by retained actual results, not
only a static claim. Full pinned-SDK broad CI for exact candidate `2a13f94`
remains pending. Baseline broad-gate success is not transferred to this revision;
in particular, the newly expanded type discovery must receive current-candidate
regression coverage before final source-stage acceptance. No whole-game
canonical-root or source-backport admission is asserted by this review.
