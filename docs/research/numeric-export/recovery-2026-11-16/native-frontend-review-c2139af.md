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

## Scoped re-review — fix round 1

Reviewed delta: `d8f8d8a05d697ef0258e1b85db01d5bf369a8385..e1c32a64fd2a99b438341267e9d005e559ae2506`, from `native-frontend-fix1-review.diff`, together with the appended implementation report and selected indexed evidence in `/workspace/diagnostic-tools/native-frontend-review-fix-1`. This section updates the original findings without erasing their historical verdicts.

**Spec Compliance: PASS for this scoped fix review. Task Quality: PASS for this scoped fix review.** Both original important findings are addressed. No new blocking regression was found in the four-file delta. **Static diagnostic-launch readiness: yes within the reviewed native-library frontend scope.** This is permission to proceed to the controller's next diagnostic/gate work, not evidence that source VV, goldens, actual SDK verification or production admission have passed.

### P1 — “the new /3 schema rejects genuine source-backport acquisition” — ADDRESSED

The `/3` schema now has an additional closed acquisition alternative requiring all ten actual source-backport fields, exact `/2` schema/mode/source ID/toolchain, supported platform and formatted authority digests. The previous cold/SDK-seed alternatives remain intact; historical library `/1` and `/2` schemas are outside the diff and unchanged. This resolves the structural publication refusal without relabeling the acquisition or weakening the independent authority boundary.

The added `backport_manifest_v3_canonical_publication_preserves_independent_authority` test reaches the actual `CanonicalDocument::from_value` boundary with both phase receipts, source-plan artifact binding and retained replay window. It changes all three acquisition copies coherently for missing/unknown/changed-field controls. It correctly distinguishes syntactically admissible platform/inventory/lock labels from independent authority: those labels can pass canonical structure but must fail `validate_acquisition_authority` against the original fixture lock. The positive receipt passes both checks. The final indexed log records 1 passed, 0 failed; the independent SDK-binding/seed-control log also records 1 passed. These are appropriately labeled structural/authority-fixture tests, not fabricated SDK execution evidence.

### P2 — “cumulative output accounting uses normalized strings, not original stream bytes” — ADDRESSED

The frontend passes its `(stdout_remaining, stderr_remaining)` pair directly to the closed runner. Each pipe uses its corresponding allowance. The runner checks those raw buffers before decoding/normalization and returns private raw-byte counters with the unchanged serialized `ProcessRecord`. `MeasuredProcess::charge` subtracts both raw counts with checked arithmetic before committing the new pair. Normalized strings no longer determine either cumulative allowance, and the larger other-stream budget no longer governs an exhausted stream.

The real-child regressions directly cover the reported failure: a 10,800,000-byte first stream leaves 5,977,216 bytes despite normalization shrinking its record, and the second equal-sized stream is refused; both stdout and stderr are covered. Separate controls exercise asymmetric allowances, exact limits, zero-output execution at exhausted budgets and refusal of further output. The indexed log records both controls passed. Existing timeout/process-tree and failed-stream controls record 2 passes, and the shared-deadline control records 1 pass.

### Fix-delta regression assessment

The shared legacy entry point still passes equal per-stream limits, preserves inherited-environment selection, and unwraps the same `ProcessRecord`; the change does not add serialized fields or alter the original timeout/error/normalization logic. The new accounting type is private execution state. The frontend's invocation, module graph, custody checks and original total 300-second deadline are unchanged. The schema expansion is limited to the intended new contract. No critical, important or minor new finding was identified in this delta.

Controller source and the previously reviewed seal are outside the fix diff and unchanged. The earlier actual-recipe review therefore remains applicable to `a7b057a856f67bf223644e6fe7568696e6347f4f9a8f67a7f071ee512d926bf7`. The indexed native-recipe log records both focused recipe controls passing. Changed frontend/runner bytes necessarily change the library generator identity through its existing reviewed closure; the controller must capture the new immutable candidate and identities rather than carry forward the old candidate values.

### Evidence limits and remaining controller work

I checked the recorded command array and verified the byte lengths/SHA-256 values of seven selected logs against the supplied index: final canonical-publication, raw/asymmetric output, timeout, shared deadline, independent SDK binding, final clippy and native-recipe checks. I read those logs; I did not rerun passing suites or claim independent execution of their tests. No broader source crawl, source/index/HEAD mutation, subagent, push or build was performed. Only this report was appended.

Untouched out-of-scope observations: none newly raised. The original **Cannot Verify / controller checks** remain required: full applicable source VV and genuine source/native golden gates; immutable updated candidate/snapshot capture; unchanged-d6 actual build+verify for all four numeric packages; genuine two-owner/source-backport/SDK evidence and retained-bundle mutations; and native/Wasm corpus plus mutation/None controls over the newly selected artifacts. The fixture-specific SDK reader remains distinct from the numeric source-backport admission reader. This scoped pass makes no application/Holo/source-free product or production-admission claim.

## Scoped re-review — fix round 2

Reviewed delta: `e1c32a64fd2a99b438341267e9d005e559ae2506..c2139afad62941d2feae01442884056e2d850b75`, from `native-frontend-fix2-review.diff`. The finding under review is **frontend-harness-review.md P2**, not the earlier raw-output P2. I read the original brief, that finding and its retained-SDK evidence description, and the appended round-two implementation report.

**Original P2 — “reviewed source's SDK frontend branch assumes PATH Lean is the actual Lean executable”: ADDRESSED at the producer and owner identity boundary.**

**Spec Compliance: NEEDS CHANGES. Task Quality: NEEDS CHANGES.** One important caller regression remains in the source-owned reader adaptation. Static readiness of this complete fix checkpoint is therefore blocked pending the correction below. The producer correction does not establish installed-SDK execution or waive the parent-owned fullVV/golden/SDK/corpus gates.

### Addressed producer finding

The inventory-present branch now selects the fixed actual Lean executable under `/usr/local/elan/toolchains/leanprover--lean4---v4.32.1/bin/lean`, independently of ambient elan selectors. `SdkLeanAuthority` verifies the original SDK environment, reads the exact inventory through a held regular-file descriptor with the original 8-MiB bound, binds those bytes to the verification digest, and selects the unique closed `lean` / `binary` / `4.32.1` artifact. `LeanTools` hashes and retains the original selected launcher and actual Lean separately, checks actual bytes against that artifact, and verifies their original file identities/references around execution and completion. I inspected the unchanged `sdk::verify_environment` and `ExecutableFile` interfaces specifically to establish these custody and bounded-read semantics.

The owner now compares launcher receipt identity with PATH Lean preflight and actual frontend identity with the freshly verified artifact. Actual Lean must differ from launcher/Lake; PATH Lean and Lake can correctly share elan. The version-output binding remains. The direct actual binary receives the existing closed environment; the runner, receipt fields, module arguments/order, raw cumulative output allowances, original 300-second compilation deadline and proof/export/acceptance paths are outside this fix or unchanged by it. No SDK/PATH/inventory/marker/pin change is used as a workaround.

The added private-layout control uses real pinned launcher/Lean bytes, an independent architecture-specific SDK-lock artifact digest, and real closed frontend execution. Its same-byte replacement and wrong-artifact controls are appropriate. Its limitation is explicit: it creates a source-bootstrap `Frontend` and substitutes the private measured `LeanTools`; it does **not** invoke the production inventory-present constructor against an installed SDK. The separate owner test covers both locked platform identity layouts. These tests support the scoped correction, while actual inventory-present SDK execution remains a required later gate.

### Important — R2-1 / P1: current retained-evidence reader omits its newly required inventory argument

Locations: `scripts/library-sdk-check.mjs:322`–`:323` (unchanged caller of the changed interface), `:446`–`:447` (new sixth argument), and `:494` (unconditional inventory-string requirement).

The new `validateVerificationOwner(..., nativeInventory)` correctly separates inventory command authority from actual Lean artifact authority. However, `readLibraryEvidence` still calls it with only the original five arguments. `checkAccepted` and its callers also have no route for supplying the new inventory string. Therefore every otherwise valid current `/3` bundle reaching that call fails `independently captured native inventory required`. The updated outer `verifyResult` call at line 579 supplies the inventory and passes its tests, but it does not exercise this earlier retained-artifact readback path.

Consequence: actual source-owned native-library qualification is blocked when its cold, restored, warm or concurrent results reach `checkAccepted` (callers at lines 362, 366, 381, 388 and 405). The actual `library-owner-reader-replay.mjs` baseline also calls `checkAccepted` and cannot complete for current `/3` evidence. This is a direct interface regression introduced by the fix, not an unrelated historical observation. It is visible from the mandatory first check and the missing argument; no passing suite was rerun to demonstrate it.

Fix: thread the independently authenticated native inventory bytes and matching binding through the actual `checkAccepted`/`readLibraryEvidence` paths, including their production and actual reader-replay callers. Preserve explicit historical `/1`/`/2` handling and the existing application behavior. Do not make inventory optional, derive actual Lean authority from the receipt, or fall back to equality with the launcher. Add a positive current `/3` retained-artifact test through the **public `checkAccepted` path**, with distinct launcher/actual hashes, plus missing/foreign inventory and coherently resealed identity refusals. Direct `validateVerificationOwner` tests and the outer `verifyResult` fixture alone do not cover this caller.

No additional critical, important or minor regression was found in the six-file fix delta. The controller recipe/seal and generic frontend/runtime reader are unchanged in the supplied diff; the previous actual controller-recipe review remains applicable. The new frontend/owner bytes must be captured in the next library generator/candidate identity.

### Recorded checks and unresolved execution failures

I checked the three command arrays and verified all fourteen `.log` files plus `initial-broad-run-observed.txt` against their indexed byte lengths and SHA-256 values. Their retained summaries report eight focused Rust test passes, clippy success, and JS selections passing 3 library-reader, 2 custody-reader, 19 product-reader, 2 recipe and 1 semantic-source tests. No suite was rerun. The passing reader selections do not prove the broken `checkAccepted` `/3` call path works.

The initial broader invocation remains **15 passed / 3 failed**, as honestly retained. The Cargo `ENOENT` failure has an exact focused retry recorded under the prescribed PATH. The two process-owner failures remain unresolved: missing `retirement.json` after roughly 60 seconds and missing `exit.json`. I inspected only those named test bodies and `startOwnedCommand`: they call the unchanged portable process owner directly and fail before receipt validation; they do not execute the changed library validator or use the changed SDK fixture in those failing calls. Neither that function nor the Python owner is in this diff. I found no direct causal path from this delta to those failures, but their root cause is **not established**, and they must not be relabeled passing or excused by the successful reader selections. They remain separate required execution checks for the controller's subsequent gate work.

Untouched observations outside this fix: no additional source defects raised. Game harness P1 (original launcher versus underlying Cargo/Lean measurement) is separately assigned and not resolved by this source review. Installed-SDK execution, full applicable source VV, genuine source/native goldens, updated immutable snapshots, four actual package build/verifies, retained-bundle/producer-authority controls and exact native/import-free Wasm corpus/None checks remain unverified here. No production, source-free product, application/Holo or universal proof admission is claimed.

Review boundaries: read the supplied fix diff once, then inspected only named SDK custody, retained-reader callers and failed-test interfaces needed for the findings above. No broad untouched-code review, passing-suite rerun, compiler/build/Docker invocation, source/index/HEAD mutation, subagent or push occurred. Only this report was appended. Approximately 12 GiB remained free.
