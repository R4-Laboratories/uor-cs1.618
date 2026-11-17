# Task2 scoped contract rereview

2026-11-17. **NOT READY for Task2a0 as currently specified: one concrete fixture-copy blocker remains.** B1 and B3 are addressed at design level. B2 now has a genuine API acquisition design, but its exact input/write roster omits files required by the real `lock` operation. No broader architectural rejection and no request to expand the proof/API scope.

Reviewed revision2 `task-2-contract-design.md`, new `task-2a0-snapshot-brief.md`, appended parent ruling, and original B1–B3 findings. Checked changed claims against immutable PrismPM463177a and current Task1 package public API/source/schema plus existing fixture/tool file metadata. Task1 fix1 packaging/independent review remains pending; passing tests reported by the parent are not substituted for that approval. Only this rereview report was written; no test/build/network/source/index operations or subagents.

## B1 — Addressed in the revised design

The revised §7 uses bytewise logical module order, original `module.semantic.declarations` order, a unique summary.logical_id join, exact raw↔summary.linked_ir comparison, and `summary.elaboration.declarations` in its own order when present, including a legitimately empty list. It does not append elaboration theorem/cross-check metadata. Row module uses `lean_module`, theorem uses the effective name, and source_sha256 uses the module source.

This matches `src/backend/constructive_nat/mod.rs::plan`, `src/api.rs::render_build_started`, `src/ir/semantic.rs::lowered_declarations` and `src/artifact/snapshot.rs::from_checked`. `SemanticModule.elaboration` is skipped in raw serialization, while changed/model lowered declarations survive in the summary elaboration. The summary's alphabetical logical_id sort is explicitly distinguished from effective declaration order. The `none`/`exact` policy choice matches `SemanticDeclaration::axiom_policy_kind` (`src/ir/semantic.rs:1576`).

The proposed ordering fixture exercises both distinctions: zLast then aFirst are selected around an intervening realization; its summary sorts aFirst,middleIdentity,zLast. `RealizationDescriptor::Deterministic` with a stateless Nat identity body does lower to an ordinary definition of the same name (`src/ir/semantic/model.rs:4140–4144`). Actual parser acceptance and snapshot content are properly left to a0, with failure retention and reviewed syntax correction rather than silent substitution. The revised helper does not claim to independently reconstruct linker elaboration correctness; actual checked snapshot authority and original audits retain that responsibility.

## B2 — Acquisition approach addressed; exact a0 brief remains blocked

The external API approach is real and appropriately separated from production admission:

* `api::{Engine,CheckRequest,Selection}` is publicly reachable; Selection is re-exported by api. `Engine::snapshot` returns the public SemanticSnapshot; `canonical_bytes()` supplies its exact file bytes. No new CLI command or checker export is needed.
* `project::Project::load`, public `config`, `canonical_toml()` and `compile_stack_plan().stack_bytes` support the proposed configuration/worker preparation. Keep Engine, snapshot serialization and destruction on the modeled stack, as specified.
* The three output anchors are unknown until actual execution. The design neither fabricates hashes nor treats historical unrepaired outputs as repaired evidence. a1 must wait for actual indexed files and review.
* An external direct rustc link using measured existing candidate/camino rlibs is a plausible bounded acquisition method. Current artifact paths exist; this is not proof that they already have repaired/frozen provenance. The explicit provenance/ambiguity refusal must precede compilation. No Cargo/dependency rebuild is implied.

### Remaining blocker A0-1 — Copy and retain the actual Lake workspace pin files

`task-2a0-snapshot-brief.md`, “Exact owned paths” and “Fixed fixtures,” allows/copies only `lexlean.toml`, `lexlean.lock`, source files and generated `.lexlean` data. It does **not** allow/copy `lean-toolchain`, `lakefile.toml`, or the fixtures' existing `lake-manifest.json`.

The first actual child is `lock`. `src/lock.rs::compute_lock` calls `workspace_pins(project)` unconditionally at approximately1271, including language1.2. `workspace_pins` at1170–1246 requires the exact pinned `lean-toolchain` and exactly one of `lakefile.toml`/`lakefile.lean`; missing either fails. It also binds `lake-manifest.json` when present. This is not confined to the language1.0 wording in some diagnostic strings. Therefore the current exact copy algorithm cannot reach its first successful `lock`, regardless of the helper's compilation.

The existing positive-direct fixture has regular `lean-toolchain`, `lakefile.toml`, and `lake-manifest.json`; no new handwritten Lean is necessary. Amend the brief's allowed paths, fixed fixture copy rules, pre/post inventory and input-index roster to include those exact measured files for positive and zero, and specify which measured workspace triple ordering copies (zero's is the natural choice). Preserve their bytes and pinned toolchain, validate absence of a second Lake config, and charge their bytes to the same128MiB budget. If deliberately excluding a historical optional manifest, that is an explicit reviewed input change with newly computed lock/source identities, not an implicit omission; copying all three is the simplest concrete correction.

Then remeasure the complete input roster before any CLI command. The driver still obtains genuine API snapshots; this correction adds required fixture inputs only and introduces no compiler/production API or pin change.

## B3 — Addressed at design level

The revised boundary now separates:

* Prism canonical bytes without LF from restricted LexLean snapshot/manifest/certificate file bytes with exactly one LF; raw artifact hashes include it.
* Independently selected raw snapshot/manifest/certificate hashes from IDs asserted inside those bytes. BoundProjectInputs supplies separately measured raw/normalized source, canonical config/lock and module/closure expectations. Component anchors come from the actual parent-held a0 index; they confer no production admission.
* Existing source/semantic recipes from the new F framing. Inspection of `src/artifact/content_id.rs` confirms domain+NUL and u32 label length/u64 payload length, path-sorted normalized source inputs, canonical TOML/lock, decoded compiler-semantics digest, and no-LF linked-IR/closure payloads. `src/link.rs:210–225,1209–1238` confirms the proposed linked-ir envelope and ordering. Manifest config input uses canonical TOML (`src/api.rs:465–474`).
* One nonresettable reader budget, explicit aggregate64MiB byte cap including schemas/inputs, numeric per-input/value/token/member/decoded-string limits, work/ref/deadline charging, and the distinct original contract item_count. The primitive/member-slot recurrence matches PrismPM `contracts.rs:1025–1035`, including the `/4` total65536 cap.

UTF-8 byte sorting, LF, unnecessary escapes, malformed UTF-8/lone surrogates and duplicate decoded keys are now explicit; the provided scalar-byte/order examples agree with the original serializers. Iterative schema traversal with bounded supported keywords and local frozen refs closes the previous unbounded-validator ambiguity. Full original schema integration and Rust cross-serializer validation remain explicit future gates. These are design findings only: no JS parser, counter, source normalizer or interpreter implementation has been validated.

The exact a1 helper/test/schema paths and imports are now enumerated; the four named schema files exist in the candidate package. a1's real positives depend on a0's actual anchors and independent review. Synthetic negatives do not qualify membership. Its missing output hashes are appropriately unknown rather than placeholders.

## Other changed-contract checks

* `runtime_closure_sha256` now identifies raw original `model/library-frontend-runtime.json` bytes, with full T_D and actual runtime-output comparisons retained separately. Its five named records match the original file. This resolves the previous raw/canonical/subtree ambiguity without weakening complete source closure.
* Preparation now binds both raw Prism and raw/canonical LexLean config identities, retains original witnesses, and explicitly restricts the diagnostic preparation profile to fixed selected paths before mutation. The narrower diagnostic profile does not reinterpret original general configuration support.
* Exact child argv is now specified without argv0 and contains real CLI flags. `--proof-compiler` remains a Prism wrapper option; actual LexLean children never receive it. Entrypoints defaults match the current CLI.
* SDK digest now means the original canonical `/2` projection selected by `sdk::execution_lock`; original `sdk.rs:452–489,1075` validates that projection/inventory. Candidate `/3` project input hashes therefore do not enter A's SDK authority and no new cycle is introduced.
* Task3 production custody/producer formats remain explicitly blocked. No opaque File, a0 index or fixture object constructs admitted A/P. The D/R/I/P and sidecar/replay decisions from the first review remain unchanged.

## Resource/readiness ruling

At this rereview, free disk was8,980,283,392 bytes. The brief's required floor+128MiB+16MiB reserve is8,740,929,536 bytes, so that point-in-time measurement passes the arithmetic preflight; it is not a reservation while Task1 is active. Existing CLI is60,569,368 bytes and candidate rlib172,370,270 bytes, but those are read-only inputs, not permission to copy them or predict linker peak. Direct-link peak/RSS must still be measured under the stated proactive stop/deadline/log controls; bounded refusal is a valid acquisition failure, never a reason to enlarge limits silently.

**A0-1 is the only new blocking mismatch identified in this scoped rereview.** Correct the exact workspace-pin input/write roster, then review that correction. Repaired Task1 independent PASS, frozen source/rlib/CLI provenance, current resource preflight and exclusive slot remain mandatory before a0 execution. a1 stays dependent on genuine a0 outputs/index review and its own bounded authorization. No actual compilation, snapshot acquisition, Task2 completion or production admission is certified here.
