# Task1 fix round 1 independent scoped review

Reviewed 2026-11-17. **SpecCompliance: PASS for P1/P2 repair scope. Quality: PASS for P1/P2 repair scope.** Both original findings are addressed. No new blocking defect was found in the four-source-file fix. This closes the two changes requested by `task-1-review.md`; it is component acceptance, not source acquisition or SDK admission.

## Scope and identity

Reviewed the original binding brief and prior review, `task-1-fix-1-brief.md`, the appended canonical/packaged reports, the filtered packaging review diff from `c36b9e830b2819e1a45d80751c33f70f2a5f8b3c` to `77dd61d5ecfc03da3af9d3ce49294863766dbcb0`, and the complete actual `evidence/fix1-source.patch`. The scoped source patch SHA256 is `4f115e24040b0ac165b32c0ded2afd4ce4b148ff44a00f58d88d63f172015bc6`.

Compared prior/current package inventories: exactly `src/api.rs` and `src/backend/constructive_nat/{emit,mod,tests}.rs` changed; no package file was added/removed in this repair. All current package file hashes, metadata file bindings, 432 indexed evidence files and 470 indexed fixture/generated entries match their retained bytes. The previous 662 indexed payloads remain byte-identical. Canonical and packaged reports are identical. Unrelated host-access/docs changes are outside this review and were not reviewed as part of the fix.

Review actions were read-only except writing this report. No builds, tests, network operations or subagents were run. The measured free disk space was 8,978,653,184 bytes, above the unchanged 8GiB floor.

## P1: Addressed — source-name hygiene

`emit.rs:134` onward now root-qualifies the approved Init constants, including `of_decide_eq_true`, `congrArg`, the Nat/Eq lemma references, lambda parameter type and `Bool.true`. Source binder rendering remains separate and unchanged. No new parser/IR exclusions or theorem-name special cases were introduced. Root qualification resolves the original legal binder and same-namespace declaration capture without altering the theorem statement, rule DAG or accepted source names.

The retained RED evidence confirms the static finding: old CLI lock/fmt/check/build succeeded, then all three authored collision modules failed pinned Lean with the expected Nat-as-function or declaration-application errors. The six corrected selected declarations in `HygieneComponent.BinderDecide`, `BinderCongr` and `Namespace` now have real Lean elaboration, leanchecker replay and exact empty-axiom audit output. The five unchanged Bounds and nine original generic declarations were also regenerated and replayed in the same successful bounded validation batch. All 20 audit lines state no axioms; no top-level helper declarations are introduced. This is stronger evidence than merely checking the emitted strings.

## P2: Addressed — preappend output allowances

- `emit.rs:114` initializes the proof writer with `min(PROOF_BYTES, stage.remaining())`. `Text::append` checks the prospective length before `push_str`, so a certificate that consumes the remaining stage allowance cannot cause proof bytes to be appended. The 1MiB per-theorem cap and shared cumulative stage allowance are both retained. Existing charging occurs after successful production, without resetting the stage.
- `mod.rs:230` reserves one byte for the final LF using checked subtraction before the first serialization pass. Both the initial serialization and sorted canonical serialization use the same bounded `ByteWriter`, whose checks precede `extend_from_slice`; the final LF uses that writer too. The former unbounded `to_file_bytes()` construction is gone. `CanonicalJson` exhaustively serializes the original restricted JSON variants and preserves ordered keys, i64 numbers and minimal UTF-8/string escaping. The old canonical JSON implementation and language contract remain unchanged.
- `api.rs:523` computes checked `max_total_source_bytes - report_total` before calling `artifact`. `mod.rs:401` constrains artifact serialization by the minimum of this allowance and remaining stage bytes. Project exhaustion retains `LLS8002`; the stricter stage limit retains `LLB6008`. The final checked accounting remains as a defensive check after the already bounded producer.

The new tests inspect successful append lengths, not merely the eventual error: zero, partial, one-byte-short and exact proof allowances; certificate-fits/proof-does-not through `compile_checked`; existing report bytes plus exact/short artifact allowance; LF reservation before body completion; and bounded canonical output matching original bytes for control characters, Unicode, escapes and signed-i64 boundaries. Three focused RED controls failed against the old implementation. The corrected focused run passes all 20 tests, including the six added tests (one hygiene test and five budget/canonical tests). Existing per-proof/leaf-cap and shared-stage controls remain present.

## Evidence and new-breakage assessment

Read the actual command vectors and raw outputs for RED controls, corrected focused tests, all 20 authored proofs/kernel replays/axiom audits, and both new actual candidate canonical-JSON/axiom-parser integration selectors. Successful commands have exit 0 and no guard stop; the three old collision elaborations have exit 1. The proof batch took 23.6448 seconds with measured peak combined RSS 1,591,013,376 bytes under the existing diagnostic limits. Both certificate artifacts remain byte-identical to their pre-fix versions, supporting unchanged rule/source binding and framing. The final CLI identity is `b34b111b19e4bb35eaaff28abd2600fa48ede3c5c1e15cfa899f13bb1fc1fcd3`.

The report accurately distinguishes the compiled green test ELF from its later replay: one cfg(test)-only constructor was subsequently collapsed by rustfmt, with the exact whitespace-only diff retained. The replay was not a rebuild. The final CLI and integration executable were compiled from the formatted package. This does not leave a production-code validation gap. The failed mechanical edit, proactively stopped build, successful unchanged retry and attributable owned-output retirement remain explicit historical evidence; the stopped build is not counted as passing.

No new fix-induced breakage was found. The code changes are confined to constant resolution, bounded serialization/output plumbing, associated tests and formatting of touched API code. No algorithm, certificate rule/schema, semantics partition, authority source, policy, original tool or ordinary source change is introduced by this fix. Existing historical compatibility evidence is not relabeled as a fresh broad run.

There are no additional blocking or nonblocking findings in this scoped rereview. Final B/T_D/D/R/C, materialized acquisition, all SDK/export/corpus/source-VV/package-API gates remain later tasks under the unchanged adopted plan; their absence is outside this fix review and is not a new blocker for the component.
