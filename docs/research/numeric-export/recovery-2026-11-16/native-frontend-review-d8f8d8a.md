# NEXP012 independent native-library frontend review

Reviewed checkpoint: `f6776fca7c9f675b3bb762ddaf88d256aad3d77f..d8f8d8a05d697ef0258e1b85db01d5bf369a8385` in `/workspace/scratch/prismpm-numeric`.

**Spec Compliance: changes required.** The native-library-only frontend design implements the principal requested source, module, process, runtime-authority and two-phase bindings, but the new verification schema cannot publish the required NumericTask2c source-backport evidence. Its claimed shared original output allowance is also not enforced on original stream bytes.

**Task Quality: changes required.** The separation of deterministic generated artifacts from measured execution evidence is sound, and the owner derives and records the frontend itself. Two important integration/resource-accounting issues remain. This checkpoint is not statically ready for the intended unchanged-d6 numeric build+verify diagnostic launch until these are corrected. This is a task-scoped review, not whole-branch acceptance or production admission.

## Findings

### Important — P1: the new /3 schema rejects genuine source-backport acquisition

Location: `schemas/library-verification-manifest-v3.schema.json:260` (the acquisition `oneOf`, including the `/1` constants at lines 266 and 282); publication call at `crates/prismpm/src/library_verification.rs:399`.

The new schema permits only `prismpm/exporter-acquisition/1` with `cold` or `sdk-seed`. The required `NumericTask2c` owner actually produces the closed `prismpm/exporter-acquisition/2`, `mode: source-backport` receipt, including `source_id`, `descriptor_sha256` and `sdk_lock_digest` (`crates/prismpm/src/exporter.rs:319`). `CanonicalDocument::from_value` performs JSON-schema validation before semantic validation and publication (`contracts.rs:1055`, `contracts.rs:1081`); there is no projection that makes this genuine receipt fit the new schema.

Consequence: even after real frontend compilation, proof verification, independent export, regeneration and native acceptance succeed, the intended numeric verification cannot publish its `/3` manifest and will fail PP1101. The actual component tests and cold/sdk-seed fixtures do not reach this boundary.

Focused confirmation: loaded the new schema's exact acquisition subschema using Python's Draft202012 validator. The existing cold receipt passed; the exact source-backport shape emitted by `exporter.rs`, with the preserved compiler/archive/descriptor pins, failed both alternatives. Errors include the wrong schema and mode constants, forbidden backport fields, and missing seed-only fields. No compiler suite or SDK execution was rerun.

Fix: add an explicitly closed acquisition/2 source-backport alternative to the **new** `/3` contract, preserving the existing `/1` and `/2` historical schemas and the existing Rust source/descriptor/archive/SDK authority checks. Add a focused complete `/3` canonical-publication regression using a legitimate source-backport-shaped exporter record, plus unknown/missing/changed authority-field refusals. Do not relabel source-backport as cold or sdk-seed to satisfy the schema.

### Important — P2: cumulative output accounting uses normalized strings, not original stream bytes

Location: `crates/prismpm/src/library_frontend.rs:376` and `crates/prismpm/src/library_frontend.rs:392`.

`Frontend::run` passes `max(stdout_remaining, stderr_remaining)` as the limit for **both** streams, then subtracts `record.stdout.len()` and `record.stderr.len()`. Those are already transformed by path normalization and `stable_success_output` in the existing runner (`verification.rs:1339`, `verification.rs:1371`), whereas the original per-stream limit is checked on raw captured bytes (`verification.rs:1332`). Path replacement and duration normalization can shorten the returned strings substantially.

Consequence: the sequence can accept more than the specified shared 16 MiB of original stdout or stderr. Even without shortening, a child can consume the larger other-stream allowance before the post-return subtraction rejects it. The 300-second shared deadline is retained; this finding concerns the separately promised original output allowance.

Focused accounting example, not a claim of a new real Lean execution: each of two successful streams containing 100,000 lines of `x in ` followed by 100 zeroes and `1s` is 10,800,000 raw bytes, below the individual runner limit. Existing duration normalization reduces each returned string to 1,600,000 bytes. The helper therefore accepts a total 21,600,000 raw bytes while charging only 3,200,000 against 16,777,216. This follows directly from the existing normalization and the new subtraction; no passing suite was rerun.

Fix: enforce separate remaining stdout/stderr limits in the closed runner and charge the actual pre-normalization byte counts, keeping the established serialized process contract intact if internal counters suffice. Add a focused control with two bounded children whose raw cumulative stream bytes exceed the limit while their normalized records do not, and an asymmetric stdout/stderr allowance control. Preserve the existing deadline and process-group cleanup.

No critical findings. No additional minor findings are required for this checkpoint.

## Strengths and reviewed authority

- The frontend is library-scoped. The application builder, shared generated Lean project emitter, ordinary-native indices, proof sources and toolchain/archive pins are unchanged in this patch. The shared runner's old entry point retains its inherited-environment behavior; the new frontend uses a separate closed-environment entry point.
- The plan uses every generated project module, validates exact source bytes and emitted import headers, gets runtime bytes/closure from LexLean, and orders the complete dependency graph deterministically. Runtime source hashes/imports are also independently checked by the JS reader's source-owned registry, rather than accepting successful exit records as runtime authority.
- The owner derives the frontend itself, retains its actual process records, compares them with the returned product, guards source/package/cwd custody around children, and requires completion through packaging. Both receipts bind the exact canonical `library/frontend.json` projection. That projection excludes native executable and compiled companion hashes while retaining the complete source plan.
- The actual helper component log records the complete Bounds/Laws test passing in 45.14 seconds. Its source test performs two fresh compilations, eight real kernel checks and two full-module exports; the report appropriately limits this to component evidence. The retained source-plan reader-control log also records its focused pass. Other claimed suite results were not rerun or independently recertified here.

The controller/native-golden seal was reviewed as an **actual recipe**, not authorized by a digest alone. I read `controller/mod.rs::application_generator_identity_for`, the active default `Controller::load`, `exporter/source.rs::Source::frame`, and `scripts/native-golden.mjs::applicationGeneratorIdentity`. The default selects Released; the helper's three u64-big-endian framed authority fields, source-file order, embedded manifest alias and final literal match the active Rust recipe. A read-only comparison confirms the active application recipe is byte-identical to the base. The measured controller digest equals `a7b057a856f67bf223644e6fe7568696e6347f4f9a8f67a7f071ee512d926bf7`. That exact checkpoint seal is independently reviewed. The active library `/3` recipe includes the new frontend and process runner among its twelve framed source owners. Any later recipe/owner change requires review of that new state.

## Cannot Verify / controller checks still required

1. After the fixes, capture the new immutable source checkpoint and generator identities, then run full applicable source VV and required native/source golden gates. This review does not waive the genuine Python-version/resource guard refusals or certify the pending full native-golden run.
2. Run unchanged-d6 actual CLI build+verify for all four numeric packages. Retain both genuine owner phases, full declaration/axiom and kernel audit, exact regeneration, std/no_std acceptance, original source-backport acquisition and actual exporter child/SDK inventory bindings. The schema probe only establishes the current blocker; it is not a substitute for this run.
3. Execute retained-bundle mutation controls against those actual outputs, including omitted Bounds/runtime/companions, coherent source/plan/tool/profile mutations, phase reordering/reuse, roots, archive, child and output changes. The generic frontend reader supplies structural/source binding; the numeric controller must still provide independent producer/source-backport/SDK authority. The fixture-specific `checkAccepted` cold/sdk-seed reader is not a general numeric source-backport admission reader.
4. Bind any source-independent reader to the reviewed runtime registry and its full reader/source closure; do not accept caller-selected runtime metadata or infer authenticity from matching hashes alone. Compiled companion hashes in the current component receipts are retained measurements of transient workspaces, not independently replayable retained companion files or full SDK custody evidence.
5. Re-run native/Wasm corpus and mutation/None controls over the exact newly selected CLI outputs before downstream admission. No application/Holo/source-free product qualification or universal arithmetic proof follows from this review.

## Review execution boundaries

Read the requested brief, prerequisite reconnaissance, normative AGENTS instructions, implementation report as claims, and the packaged diff. Read unchanged functions only to resolve concrete schema-publication, process-output or identity-recipe boundaries; recovered output-truncated diff portions as needed. No source/index/HEAD changes, subagents, pushes, builds, broad suite reruns or Docker runs were performed. The only new workspace artifact from this review is this report. Disk check showed approximately 14 GiB available, above the 8 GiB floor. Historical candidate/preparation snapshots remain untouched.
