# Canonical native-library retained-reader controls: read-only reconnaissance

Inspected exact PrismPM `2a31ad07fd0b3ea0ef63f22f165d98e310eb89ec` and game `scripts/numeric/canonical/{packages.py,test_packages.py,sdk-run.sh}`. No implementation, tests, builds or source changes performed. Actual-d6 run `44008985569` is package-production evidence only until its original results are collected and independently checked.

## Existing boundary: no complete native-library source-free reader

- `release_verification::validate` explicitly rejects `model.library`: **“native-library evidence cannot authorize a product release”**. `validate_with_authority` calls that reader first. Keep this refusal unchanged.
- B1's test-only `replay_retained_backport_projects` calls that application reader and requires family `application`; it cannot accept these four native-library packages. Reusing its filesystem loader pattern is reasonable; relabeling library evidence as application or deleting its refusal is not.
- `contracts::CanonicalDocument::parse` supports `library-build-binding/1`, `library-acceptance/1`, `library-verification-manifest/2`. The manifest contract also calls existing owner/process readers and checks replay placement, native Lake preflight and owner artifact agreement. It **does not** read the artifact bytes, replay the retained source graph or independently bind SDK authority.
- `library_verification::run` is a producer: it performs source verification, independent generation, std/no_std execution, then publishes receipts. Calling `verify` on a mutated project is not a retained-reader control; it may regenerate/reselect outputs and does not establish refusal of the original captured bundle.
- `packages.py::check/selection` is a game-owned freeze/collection harness. Its actual hashing and resealed synthetic unit mutants are useful, but are not PrismPM reader execution. Its `complete-reader-inputs` scope correctly unclaims independent actual-reader controls.

Thus **no existing CLI or one-call API at 2a31 provides complete native-library source-free admission**. The minimum immediate addition can be diagnostic test-only composition of existing readers, with explicitly bounded claims. A complete native-library semantic/production reader remains a separate design requirement; do not present the composition as that admission API.

## Minimal test-only snapshot delta

Proposed upstream delta: add `#[cfg(test)] mod library_retained_tests;` under `release_verification.rs` and new `release_verification/library_retained_tests.rs`. Keep all production admission dispatch/refusals unchanged and do not alter the ten-test `backport_authority` filter. No schema/source/compiler/archive change is needed. A single dedicated ignored integration test is appropriate, explicitly invoked with `--ignored`; invocation must fail if evidence is absent/malformed. Ordinary unit success must never count as running it.

Suggested command after a reviewed immutable snapshot containing that delta exists:

```bash
PRISMPM_TEST_CANONICAL_LIBRARY_EVIDENCE=/reader-inputs \
  cargo test --locked --offline -p prismpm --lib \
  release_verification::library_retained_tests::retained_canonical_libraries_source_free \
  -- --ignored --exact --nocapture
```

Require exit0, exactly `1 passed; 0 failed; 0 ignored`, four separately named operation results, a fixed mutation-count table, and an explicit final marker such as `retained canonical libraries: 4 bound; declared mutation controls rejected`. Missing input, missing operation or zero selected tests must fail. This reader test binary is separately measured; it is not the exact original producer binary. Existing 2a31 producer outputs can be read by the reviewed newer test snapshot without regenerating them, provided both identities and the original input archive digest are retained.

Existing functions available to that test module, and their precise limits:

1. `canonical_json`, `file_rows`, `exact_files`, `descriptor`, `digest`, `safe_path`: canonical JSON/byte descriptor and exact member-set checks. Parse build manifest `/1`, library build inputs `/3` (including `library_artifacts_sha256` and `library_generator_sha256`), compute build ID from canonical inputs, and compare actual model/build/verified bytes and identifiers.
2. `CanonicalDocument::parse` for the three library contracts above; verify complete verification files are exactly `manifest.json`, `library-acceptance.json`, `lexlean-attestation.json`. Bind model/build/LexLean IDs and acceptance bytes to both manifests, not merely schema-validate each file independently.
3. `holo::library::project_library` and `validate_roots` on the typed retained `lexlean/snapshot.json`; `library_build::validate_export_identity` on actual retained `coverage.json`, `roots.json`, parsed `kernel.ir`, modeled exports and acceptance roots. These establish projection/named-root consistency. A null/non-library projection is refusal. `library_verification::audit_declarations` preserves the native-library proof policy.
4. Reuse existing private `snapshot_semantics`, `attestation_shape`, `runtime_modules`, `declaration_audits`, `lexlean_processes` for their scoped checks where applicable. **Do not call `lexlean_binding` unchanged**: its no-application branch calls `holo::projector::project_snapshot`, which always creates `library: None`; a native-library graph instead needs `project_library`. A complete shared LexLean binding adaptation must be explicitly implemented/reviewed or remain unclaimed; passing a few parsers is not full semantic replay.
5. `exporter::validate_owner_binding` with the retained full LexLean manifest, descriptors computed from actual library files, top-level process rows, and exact `library_build::export_arguments` reconstructed from retained module names/model. This binds controller-build/replay, model, lexical source closure, exporter argv and products.
6. `process_records`, `process_platform`, `validate_exporter_execution`, plus `exporter::validate_acquisition_authority` for **every** owner and top-level exporter execution, using an independently supplied parsed original d6 lock. Require entire execution equality across phases/top level, source-backport closed authority, and receipt native platform equal retained preflight. **Do not call `validate_exporter_authority` unchanged**: it gathers owner phases only for application `/2` and permits candidate schemas only for application/native-module `/2`, not library `/2`.

If implementing only the existing function controls without a reviewed complete LexLean/artifact binding composition, label results `native-library retained consistency controls`, with the exact checked invariants. It is not acceptable to emit “full native-library source-free verified” from partial coverage.

## Required actual input set and source removal

For each mul32/mul64/div32/div64: original successful BuildResult/VerifyResult JSON; complete selected `.prism/build/<id>` including manifest/model, `lexlean/snapshot.json`, full `lexlean/build/**`, all `library/**` (IR, coverage, roots, model binding, package files/generation manifest and `.crate`); complete selected `.prism/verified/<id>` three-file tree. Supply the original d6 lock and independent expected operation/root/source/kernel-file mapping captured at production, plus original producer binary/source/compiler/SDK identities and original capture digest.

The collector archive may also contain authored project sources and `.lexlean` caches/evidence. The reader phase must create a **new reduced directory containing only** selected build, verified and authority/selection records; no original `src`, LexLean project configs, `.lake`, producer source project or package regeneration cache. Keep the original archive immutable. Run the test with no access to original application projects; retained generated Lean/snapshot documents are evidence and remain readable. No test helper may call Controller build/verify, Lake, compiler/exporter, artifact regeneration or current project loading. Capture reduced input member manifest and hashes before/after; mutants are disposable in-memory/file copies.

## Meaningful mutation controls and honest authority limits

| Defect | Mutation and hash repair | Actual reader boundary to require |
| --- | --- | --- |
| Source evidence | Change a declaration/semantic ID in retained snapshot; repair its build-file descriptor, library artifact closure/build ID and outer verification IDs as needed, leaving independent attestation/source authority unchanged. | Snapshot semantic recipe, exact library projection, attestation/source-ID binding or declaration audit. A changed *authored* source before capture is only a freeze-harness control. |
| Requested root | Swap/remove the raw arithmetic root in retained coverage/roots or acceptance/model binding; repair changed file descriptors, build ID and outer manifest hash. | Modeled `validate_roots`, exact named-export identity, acceptance subset and owner exporter argv must disagree. Also test wrong operation against independently captured operation mapping. |
| Compiler archive/descriptor | Change selected archive/descriptor in all relevant execution copies and reseal verification manifest/attestation ID. | Closed compiled `Source` + acquisition validator; no old-seed fallback. |
| Child | Change one phase/top-level child measurement and reseal the outer manifest. | Actual owner/execution equality and process binding, not stale outer checksum. |
| Generated output | Change generated Rust or crate bytes and repair outer build file rows/build ID/verification hash, leaving the recorded original owner/product descriptors or generation binding intact. | Actual file descriptor/owner product binding. Also missing/extra/duplicate/symlink files must fail. |

For every mutant, run the untouched real capture first, require the intended typed reader failure and record which surrounding hashes were recomputed; avoid reporting a generic manifest-digest failure as a deeper root/child/source refusal. Use exact actual operation bundles, not fabricated accepted fixtures.

**Unavoidable authority limit:** if an attacker consistently replaces *all* child measurements, product descriptors, IDs and transcripts, these unsigned records cannot authenticate the original computation. Candidate child SHA is separately measured, not pinned to the old d6 exporter. A fully uniformly resealed child/output/source replacement must be rejected against an independently retained producer/capture/provenance anchor (whose bytes are not part of the mutant), or by a stronger reviewed semantic/provenance reader. Such anchor refusal is an **external authority/custody control**, not evidence that an existing native-library parser proved production authenticity. Do not invent an old SDK binary equality rule for the candidate or claim arbitrary self-consistent forged bundles are rejected by existing readers. This distinction is the precise missing authority to preserve as pending design work.

Before implementation, agree whether the immediate gate is this bounded test-only consistency/authority-control composition or a complete native-library retained semantic reader. The former can close concrete reader gaps while preserving native-library-only scope; the latter is substantive new work and cannot be inferred from B1 application reader success or freeze-harness unit tests.
