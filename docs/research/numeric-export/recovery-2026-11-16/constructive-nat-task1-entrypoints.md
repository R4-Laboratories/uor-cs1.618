# Constructive Nat Task1 readiness and entrypoint brief

Read-only reconnaissance, 2026-11-17. Binding inputs: `docs/superpowers/plans/2026-11-16-constructive-nat-backport.md` Task1 and the adopted design, including its final implementation-sequencing clarification. No builds, proof searches, tests, source edits, dependency resolution, or tool installation were performed for this brief. All commands below are future component commands, not claimed results.

## Readiness and scope

Task1 has a concrete source integration route; no further architectural decision is required before the authorized disposable component implementation. Its success establishes component evidence only. Final B, T_D, D/R, controller C, complete materialization, acquired tools, SDK verification and full source qualification remain later gates. The observed development checkout was `f8808ad717a1582cd39d8c01bc452519a112afdd`; capture repair may advance it. Record the actual development revision when copying; do not call either revision final B. The active capture implementation retains sole production-worktree ownership.

Task1 owns only a disposable candidate LexLean package, fixtures and evidence. It does not implement PrismPM Engine selection, worker DTO propagation, candidate acquisition/readers, or root registry/auditor. These are Tasks2–3. Retain an enumerated patch/report under the game repository's `scripts/numeric/constructive-proof-candidate/` with research evidence. A component patch is not an admitted overlay until reconciliation and independent review against frozen B.

## Pristine input and four authority copies

All source references below are relative to `/workspace/scratch/prismpm-numeric/vendor/lexlean/`, the original packaged source. The original upstream revision is `e0b74b81e6f49c83596a957d232c8383a5db1a25`. Recorded SHA-256 values:

| Input | SHA-256 |
| --- | --- |
| `MANIFEST.sha256` | `dd35c1b0359c90c5896c5188c9e10bb4008883cb21ee92d35bc2fd4c8d4ac759` |
| original `lexlean-0.4.0.crate` | `f2d579289052493d2c68274b10015d2cce544a78fbb876d73062184f09fb0a18` |
| `Cargo.lock` | `008618c60e0ee0da9f33fd63f6d2d7c0d053a8d980de1a0315d85e308a7d1151` |

The only four admitted Lean authority members, each beneath `language/preservation-1.2/modules/LexLeanTarget/`, are:

| Member | SHA-256 |
| --- | --- |
| `RustSemantics.lean` | `4be743de0333df2264821d15ced344144d8c37b4a51d161b1f3d0b2df89c09b5` |
| `RustSyntax.lean` | `d9190acb5db02ae27819ab4af621d27756473a5b4710f53757bbdef1adc38618` |
| `TargetSemantics.lean` | `55206f1bafd9608b991b5181a2d2c531aca490e571143278ba05cdaa765c1cbb` |
| `TargetSyntax.lean` | `c0e0bb061cfcdc7e7f4434e13fc8b7298dcb701db9ea8189e012d8068e04ee0c` |

Copy these exact bytes once as members of the disposable package, not as new handwritten authority. Preserve all original runtime data. No fifth authority file, changed `.lean`, handwritten production `lakefile.lean`, generated Rust patch, axiom waiver or changed pin is permitted. Generated Lean and separate diagnostic audit files are outputs/evidence, never source authority.

The candidate package is `lexlean-constructive-diagnostic` version `0.4.0-constructive.1`. Use a distinct preparation executable, e.g. `lexlean-constructive-diagnostic`; retain the Rust library target name `lexlean` for existing source/test imports. In the disposable copy only, update package/bin metadata and the lock's local root-package record without changing transitive versions or checksums. Remove unsupported clean-upstream VCS/publication metadata or replace it with explicitly local diagnostic provenance. The pristine package retains its original record. Do not invent an upstream revision for the candidate or embed a future D digest.

## Actual Rust entrypoints

| Actual entrypoint | Task1 use |
| --- | --- |
| `src/ir/semantic.rs:689` `SemanticProof`; `LinearArithmetic` at699 | Consume checked language1.2 semantic nodes. Existing authored syntax stays unchanged. |
| `src/ir/semantic.rs:1290` `SemanticDeclaration::Theorem` | Supplies type parameters, parameters, statement, proof and exact `axioms` policy. Select only Nat-fragment, empty-policy language1.2 `LinearArithmetic`. |
| `src/ir/semantic.rs:8288` existing `check_proof` branch | Existing language and definition-reference checks remain. No raw source reparse or bypass. |
| `src/backend/lean.rs:2079` `render_module` | Dispatches semantic modules into `semantic::render_lean`; API caller is `src/api.rs:270`. |
| `src/backend/semantic.rs:1883` `render_lean` | Fallible module-level renderer; it obtains lowered declarations. Candidate theorem planning can occur here or in a checked plan passed here. |
| `src/backend/semantic.rs:2212` theorem arm | Correct selection point: statement/policy/binders are available before calling the old proof renderer. |
| `src/backend/semantic.rs:1216` `Render::proof` | Accepts only proof and indentation and returns `String`; it lacks theorem policy/goal. Do not use it alone to decide candidate applicability or swallow refusal. Preserve its old branch for nonselected proofs. |
| `src/backend/semantic.rs:1739,1788` declaration emission helpers | Keep new generated proof text inside existing declaration span/coverage ownership. |
| `src/api.rs:253` `render_build` | Assemble one checked proof plan and the fixed certificate artifact alongside generated files, then bind it through the build manifest. |

Smallest proposed new internal module layout (new paths, not existing APIs): `src/backend/constructive_nat/{mod.rs,certificate.rs,check.rs,synthesize.rs,emit.rs,tests.rs}`, registered in `src/backend/mod.rs`. Keep a private checked-certificate type constructible only by the checker. Required flow is checked theorem → bounded synthesis → canonical serialization → independent decode/check against that theorem → checked certificate → proof emission. Share the same checked plan between proof emission and artifact serialization; do not synthesize two potentially different witnesses. The exact private Rust signatures are an implementation detail; no new public theorem-prover API is needed.

Preserve existing runtime imports. In particular `render_lean` currently detects linear arithmetic when deciding to import Laws around1930–1942; importing existing runtime declarations does not itself insert their axioms into a new theorem. Do not remove unrelated runtime/source-closure checks as an optimization.

## Algorithm and finite contract to implement

Implement only adopted rules: Hyp, ReflLE/ReflEQ, LiteralLE, WeakenLT, TransLE, AddLE, AddLTLE, EqSymm/EqTrans/NormalizeEQ, RewriteSide and CancelLT. Normalize using proved associativity/commutativity/zero/congruence steps; compare canonical additive forms while retaining proof of equivalence. No arbitrary theorem opcode, tactic payload, solver-success token, classical fallback, omega, simp or native_decide in the selected branch. Validate actual Init lemma signatures and empty closures with the original Lean tool during implementation; this reconnaissance performs no new proof search.

Recipe A is bounded variable-bound BFS with smallest numeric bound, shortest path, then lexicographic hypothesis-index tie breaking; traverse the goal's original addition tree. Recipe B enumerates source-order strict hypotheses, scales1..16, equality hypotheses/orientations/side choices, allows at most one whole-side equality transport, then removes the maximal common additive vector/constant and proves cancellation. These are generic operations, never theorem-name, literal, source-hash or fixture cases.

Enforce all ten adopted caps before expansion/allocation: 32 Nat parameters; 64 atomic hypotheses; 1,024 input term nodes; 128-bit unsigned literals/computed constants; coefficient4,096; scale16; 8,192 Recipe-B candidates; 16,384 DAG nodes; 1MiB proof text per theorem; 4,096 canonical leaves. Normalization proof steps, candidate attempts, serialization and output expansion must consume their relevant cumulative budgets. Use checked u128 arithmetic. Preserve original source/output limits and the shared300-second stage deadline across all modules/theorems; a per-theorem cap cannot restart that deadline.

A concrete wire detail needs explicit implementation: existing `artifact/canonical_json.rs:13–18` supports `Json::Int(i64)`, not u128. Represent Nat128 constants in the new closed certificate schema as shortest unsigned decimal **strings** (`0` or nonzero digit followed by digits), with at most39 digits and checked u128 parsing/range. Keep small indices/counts as bounded ordinary integers. Do not truncate/saturate constants, widen the old JSON contract, or accept multiple textual encodings. This resolves a representation detail within the adopted arithmetic range; it does not change a proof rule or cap. Include zero, u128 maximum, overflow, leading-zero and sign controls.

## Semantics, fixed output and diagnostics registration

Expected candidate-only changed paths are the new Rust module above, `src/backend/mod.rs`, `src/backend/semantic.rs`, `src/backend/lean.rs` only if its internal context must carry the plan, `src/api.rs`, `src/lib.rs`, candidate `Cargo.toml`/`Cargo.lock`/provenance, `language/semantics-1.2.toml`, new `language/constructive-nat-1.2/` rules data, new `schemas/constructive-nat-certificate.schema.json`, and candidate `model/errors.toml`/derived `ERRORS.md`. Enumerate actual paths before editing; do not spread changes to unused parser/IR forms. New tests/fixtures are additional explicit paths. Ordinary originals remain untouched.

- `build.rs:24–29` embeds language, schemas, axiom-parser goldens and canonical-JSON goldens. Rust implementation bytes alone do not change the semantics ID. Version candidate `language/semantics-1.2.toml` honestly (base `lean_backend="21"`, `proof_lowering="3"`), and embed closed rule/bound/output semantics plus certificate schema.
- `src/lib.rs:166–205` explicitly partitions1.2 files. Add the exact new schema and rules prefix there; otherwise the new files silently change1.0/1.1 semantics too. `compiler_semantics_id_for` at285 computes the result. Require unchanged1.0/1.1 IDs and genuinely different candidate1.2 ID. Recorded base1.2 ID: `1427f8b629013648a480454d67202788f2303f5396f1d7c70a7c350ddab6f694`.
- Register project-level `proofs/constructive-nat.json` in `render_build`, with a named output kind (proposed `constructive-nat-certificate`), exact proposition and checked DAG per selected theorem, deterministic order and no missing/extra/duplicate row. The closed schema must specify framing, rule fields, references, Nat encoding and compiler/source/semantic bindings. Zero selected rows are permitted for a fixed candidate artifact; they do not imply altered legacy proof lowering.
- `artifact/manifest.rs:8–23` uses string output kinds and `schemas/build-manifest-v2.schema.json` does not enumerate them. A registered new kind and independently checked closed certificate schema suffice; do not relax the existing manifest schema. FileRows/files are assembled at `api.rs:378–387`, cumulative report charging at398 and manifest at495–510. Charge certificate bytes before allocation and include exact bytes/hash in the manifest, never a loose sidecar.
- Preserve `backend::check_output_closure` (`backend/mod.rs:24`, called from `api.rs:353,361`) and declaration/source coverage. The certificate cannot license unchecked generated text.
- The original error registry currently ends the relevant backend range atLLB6007. Register a candidate-specific unsupported/invalid constructive proof refusal (LLB6008 is an available candidate allocation in this inspected registry), and retain existing LLS8002 limit meaning. No fallback after a selected proof is refused.
- Existing verification's manifest hash/attestation binding covers registered output bytes. Task1 does not change theorem axiom policy, source audit, kernel replay, erased closure or process-owner guards. Candidate independent-reader authority is Task2, not supplied by this artifact's own claims.

## Smallest disposable package and tool/cache plan

Use `/workspace/diagnostic-tools/constructive-nat-task1/{package,fixtures,generated,evidence}`. Copy the recorded pristine packaged tree into `package` (about50MiB); no full PrismPM workspace is needed for this component. Package source/provenance inventory, copied authority bytes, changed paths and fixtures are retained separately from generated outputs. The full22 base aliases/materializer remain Task3 obligations; this package copy does not qualify them.

Use existing absolute tools and cache only:

| Tool/input | Path / measured SHA-256 |
| --- | --- |
| Cargo | `/workspace/diagnostic-tools/rust-1.97.1/bin/cargo`; `828980723df339d62434390e9fb8ef8831036583343ae2316b7ab5646b5c1953` |
| rustc | `/workspace/diagnostic-tools/rust-1.97.1/bin/rustc`; `d3a664c970a9fd8361b64194861bebc1ae37b9054e5ee3400dc1c9e691797eea` |
| Lean | `/workspace/diagnostic-tools/lean-4.32.1-linux/bin/lean`; `e8baaa71855a616dc351028f3ad2200051b0671f423a1696a100e809302d5550` |
| leanchecker | `/workspace/diagnostic-tools/lean-4.32.1-linux/bin/leanchecker`; `c7c51e296d28dd443ed60f9414feef41253ede89dea76dbb2adde29768c3ed5f` |
| Original compiler to preserve | `/workspace/diagnostic-tools/lexlean-target/release/lexlean`; `3765ef724d19a4d08681aaa0123ff637e65c1ffcc0b8d02ae268b521b5cf2c94` |
| Cargo home | `/workspace/diagnostic-tools/cargo-home` (~263MiB) |
| Reusable release target | `/workspace/diagnostic-tools/lexlean-target` (~410MiB) |

Latest measured available space was9,598,791,680 bytes, only1,008,857,088 bytes above the8GiB floor. Recheck immediately before copying/building. Share the existing release dependency cache only with distinctly renamed package/bin, measure the original binary before/after, and do not overwrite it. Set `CARGO_INCREMENTAL=0`, `CARGO_BUILD_JOBS=2`; use release-only component tests to avoid a second debug dependency cache. A512MiB aggregate component-growth ceiling is a conservative stop condition, not a demonstrated build estimate. Monitor free bytes during compilation and stop while preserving failure/evidence before reaching8GiB. Do not delete another task's outputs, duplicate a cache, fetch dependencies, or pull/build Docker. If the measured reserve is inadequate, report it for an owned hosted component job rather than relaxing the floor. Record rustfmt/clippy identities if those tools are invoked.

## Focused future commands and test inventory

Run every Cargo command in the package with this declared environment prefix; retain the full actual environment/argv and logs:

```sh
env CARGO_HOME=/workspace/diagnostic-tools/cargo-home \
 CARGO_TARGET_DIR=/workspace/diagnostic-tools/lexlean-target \
 CARGO_BUILD_JOBS=2 CARGO_INCREMENTAL=0 \
 RUSTC=/workspace/diagnostic-tools/rust-1.97.1/bin/rustc \
 PATH=/workspace/diagnostic-tools/rust-1.97.1/bin:/workspace/diagnostic-tools/lean-4.32.1-linux/bin:/usr/bin:/bin \
 /workspace/diagnostic-tools/rust-1.97.1/bin/cargo <arguments below>
```

Future argument sets, all scoped to `/workspace/diagnostic-tools/constructive-nat-task1/package/Cargo.toml`:

```text
metadata --manifest-path <package>/Cargo.toml --locked --offline --no-deps
 test --manifest-path <package>/Cargo.toml --release --locked --offline --lib backend::constructive_nat::tests:: -- --nocapture
 test --manifest-path <package>/Cargo.toml --release --locked --offline --lib ir::semantic::tests::semantic_theorem_policy_
 test --manifest-path <package>/Cargo.toml --release --locked --offline --lib backend::semantic::byte_literal_tests::language_1_2_runtime_is_native_and_language_1_1_keeps_its_frozen_text -- --exact
 test --manifest-path <package>/Cargo.toml --release --locked --offline --lib backend::semantic::byte_literal_tests::spans_are_the_declaration_objects_whatever_the_layout -- --exact
 test --manifest-path <package>/Cargo.toml --release --locked --offline --lib backend::semantic::byte_literal_tests::comment_tokens_in_generated_string_literals_are_data -- --exact
 test --manifest-path <package>/Cargo.toml --release --locked --offline --test unit canonical_json_is_restricted -- --exact
 test --manifest-path <package>/Cargo.toml --release --locked --offline --test unit axiom_parser_matches_the_golden_vectors -- --exact
 build --manifest-path <package>/Cargo.toml --release --locked --offline --bin lexlean-constructive-diagnostic
```

The `constructive_nat` selector is **proposed**, not an existing passing suite. Other selectors above exist in the inspected package. `Cargo.toml` has `autotests=false` and explicit test targets; a new integration test requires an explicit target. Some existing process integration tests depend on repository examples/original binary and may skip outside their repository; those are not Task1 acceptance evidence. No broad process-owner suite rerun is justified by this component brief. Add targeted fixed-output/manifest tests because current focused tests do not establish certificate coverage.

Required new controls: generic renamed/reordered variables, altered literals, unused hypotheses, BFS cycles/ties, strict scaling, equality orientations/cancellation; every malformed/rule/forward-reference/scope/type/conclusion case; all ten exact-boundary/exhaustion cases; decimal encoding limits; unsupported fragments; cumulative multi-theorem output/deadline accounting; deterministic serialized round-trip; missing/duplicate/extra artifact rows; and unchanged nonselected lowering. Run initially failing tests, then the actual implementation. Compare base/candidate Lean and TeX for nonselected cases; entire candidate manifests legitimately differ due to version/semantics/new fixed artifact.

Authored fixtures must include the unchanged five `Bounds.lex.tex` propositions (`limbAddBound`, `cellAddBound`, `divDoubleRemainderBound`, `divReducedRemainderBound`, `divQuotientStepBound`) with exact empty theorem policies, plus generic variants. Use the candidate CLI for actual lock/fmt/check/build source emission, not a direct handwritten Lean witness. Preserve generated bytes. Check those fresh modules with original Lean4.32.1 and replay them with original leanchecker, then collect actual `#print axioms` for every generated theorem and helper. Expected empty means truly empty, including no `sorryAx`.

For standalone component checking, explicitly measured original runtime oleans may be reused with a fresh candidate output directory and fixed `LEAN_PATH`; record their source/compiled identities and never reuse stale candidate oleans. A direct pinned `leanchecker <module>` invocation is component evidence. The normative compiler path remains `verify/leanchecker.rs:16` → `lake env <absolute leanchecker> <module>`, and no fake Lake invocation or changed normal pipeline is permitted. Include original compilation/replay/axiom outputs and hashes. `verify/axiom.rs:142` supplies the existing audit parser; malformed output is failure. Full SDK verification and all native artifacts remain later gates even if these controls pass.

## Untouched paths and handoff evidence

Ordinary `/workspace/scratch/prismpm-numeric/vendor/lexlean/**`, root `Cargo.toml`/`Cargo.lock`, `crates/prismpm/Cargo.toml`, package-API consumers, `model/dependencies.toml`, ordinary generator/emitter input arrays, original Engine/controller/worker/verification/readers, SDK inventory/lock, guest/exporter authority and all installed tools remain untouched. The later candidate PrismPM dependency and selection belong only to its derived tree. Nothing in Task1 freezes B or edits registry admission.

The implementation handoff must retain pristine/source/tool hashes, complete candidate file inventory and patch, exact original four authority comparison, source fixture identities, semantics IDs for1.0/1.1/1.2, canonical certificate/generated proof/manifest bytes, exact commands/exits/logs, resource measurements, original-binary before/after hashes and all failures. Independent review must inspect the actual generic checker/emitter and recipe, not infer correctness from a source digest. No readiness statement here claims algorithm implementation, Lean proof success, SDK qualification or production admission.
