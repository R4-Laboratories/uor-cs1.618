# Candidate Source Capture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Execute the original complete conditional publication capture against the exact repaired source and unchanged d6 SDK, without pretending the SDK contains the new source.

**Architecture:** An explicit test-only route stages measured source and the existing test executable into a separate input volume. Its writer must retire before execution mounts the input read-only; a separate independent reader binds the resulting evidence to the actual source, executable and original SDK. The original image-owned route stays byte-for-byte intact.

**Tech Stack:** Python 3.12.3, Node.js, Rust cfg(test), Docker CLI 28.4.0, original PrismPM source devcontainer and immutable d6 runtime.

**Spec:** `docs/superpowers/specs/2026-11-16-candidate-source-capture-design.md`

This is the NEXP013 dependency of the existing bounded-numeric-kernels Task 2c. It does not supersede that plan, the pending SDK frontend identity fixes, shared/native baseline generation, or later numeric/render acceptance. Execute sequentially after the current frontend source and harness review; upstream publication remains deferred.

## Global Constraints

- Preserve `ghcr.io/uor-foundation/prismpm-sdk@sha256:d6c263a733a6bc36e0458c3f5b9a1f5ea9c14dfbe8c257d3f650a960b5fe633c`, inventory, marker, PATH and all tool/policy pins.
- Preserve bytes of `scripts/conditional-capture-sdk.py`, `conditional-capture-command.mjs`, `sdk-command-owner.mjs` and `sdk-command-owner.py`; preserve the actual exact test and all original 22 mutation/refusal controls.
- New route is `candidate-source-v1`; legacy is `image-owned-v1`. The closed cfg(test) selector is `PRISMPM_OC10_CAPTURE_ROUTE`; absence means legacy, an unknown value refuses before Docker, and no failure fallback exists.
- Canonical protocol framing matches original `encoded`: sorted keys, compact ASCII-escaped JSON and one final LF; source/union rows use UTF-8 byte order and paths contain Unicode scalar values only. JS independently reproduces that framing.
- Input schema `prismpm/conditional-candidate-capture-input/1`; response schema `prismpm/conditional-candidate-capture-response/1`; separate retained envelope `candidate-transport-evidence.json`. Keep original capture receipt/schema and `complete_application_accepted=false`.
- Source and retained trees each at most 512 MiB / 100,000 rows; each regular source member at most 256 MiB; canonical protocol JSON at most 32 MiB; exact ELF at most 1 GiB; bootstrap at most 32 KiB and each of two bootstrap modules at most 1 MiB.
- One 2400-second absolute outer budget, including staging; 420 seconds reserved for reconciliation. Cleanup at most 18 daemon calls capped at 15 seconds each plus two attachment waits capped at 35 seconds each, all clamped to the same deadline.
- Preserve original 32 MiB aggregate command logs, 64 MiB combined response limit and 1 MiB attachment diagnostic limit. Preserve diagnostic streams on failure.
- UID/GID1000, rootfs read-only, network none, caps dropped, no-new-privileges, memory/swap 8 GiB, 2 CPUs, 256 PIDs; `/tmp` 8 GiB exec tmpfs, `/workspaces` 16 MiB noexec tmpfs. Stage has no daemon socket; execution retains the original oracle socket.
- At least 10 GiB actual free space before stage transfer and before execution; original cache limits 2 GiB / 250,000 entries / depth32. Local workspace must retain 8 GiB; never pull the full SDK locally on vfs.
- Stage input volume is writable only during staging. Execution uses `/candidate-input` read-only, the same volume's `candidate-source` subpath read-only at the exact protected compiled root, and a separate writable `/workspace` volume. Same-UID chmod or symlink indirection is not immutability.
- Failures retain owned volumes and diagnostics; remove only authenticated actors. Success requires complete original evidence, actual stage retirement before execution, actual final actor/volume retirement and EOF.
- No public capability, production admission, source-free runtime, malicious-daemon isolation, universal arithmetic or multi-architecture success claim follows from these test controls.

## Review Focus

- A fixture includes untracked but recursively consumed files: conflict-checked union preserves them without calling them tracked source (Task 1).
- Truncated input, trailing bytes or interruption: stage refuses before any executable actor exists (Tasks 1/2).
- A same-UID process redirects a compiled-root ancestor or temporarily rewrites source: actual read-only views and protected parents prevent it (Tasks 2/4).
- Cleanup loses an actor ID during creation or times out: bounded label/image/role reconciliation retains uncertain volumes, never deletes unknown owners (Tasks 2/4).
- Python and JS normalize alias rows differently or a self-consistent receipt substitutes another source: independent owner bytes and framing joins refuse it (Task 3).

---

### Task 1: Closed complete-source protocol and bounded bootstrap

**Files:** Create `scripts/conditional-capture-candidate.py`, `scripts/conditional-capture-bootstrap.py`, `scripts/conditional-capture-candidate.test.py` in the PrismPM source worktree. The existing legacy helper is imported by exact authenticated path, not edited or copied wholesale.

**Interfaces:** Candidate CLI `parent SOURCE_ROOT ELF`; internal `stage` and `guest` modes are closed bootstrap entries. `measure_inputs(source: Path, executable: Path, remaining_seconds: int) -> dict` produces a closed source-input plan; `bind_runtime(source_plan: dict, runtime_observation: dict) -> dict` produces the full mandatory input descriptor after independent runtime inspection; `materialize_inputs(reader, destination: Path, descriptor: dict, deadline: float) -> dict` consumes canonical descriptor-bound bodies, completion marker and actual EOF, then returns the readback record. Staging rejects an unbound source plan; no null/default/fabricated runtime observation is permitted. The parent and guest use the same full descriptor grammar; Task 3 independently recomputes it in JS. Stage/guest are not user-supplied path or command execution interfaces.

- [x] Add real fragmented-pipe/file controls: complete tracked/private source and fixture union, executable/data classification and direct relative aliases; assert every byte/directory/alias survives exact readback. Include changed exporter source, a bounded archive member, and BMP/non-BMP names whose UTF-16 and UTF-8 ordering differ; pin exact ASCII-escaped protocol bytes.
- [x] Add refusal cases: duplicate/unsorted/missing/extra rows, undeclared parent, fixture conflict/extra, noncanonical JSON, absolute/backslash/control/traversal path, chained/escaping/link-ancestor alias, hardlink/special file, occupied destination, size/count boundary, short body, extra body/marker/trailing input, deadline and interruption. An EOF-negative case must assert no stage success.
- [x] Run `python3 -I -B scripts/conditional-capture-candidate.test.py`; record the pre-implementation failure.
- [x] Implement the closed descriptor and conflict-checked source/fixture union using existing measurement primitives, streaming singly linked files to exclusive destinations and hashing actual bytes; retain original source rows separately from union rows. Seal modes and perform complete recursive readback without exclusions.
- [x] Implement bootstrap fixed module admission and exact Python `sys.orig_argv` checks. Stage consumes only the utility and candidate module capsules before the descriptor, then enters authenticated code in the same PID. Execute mode validates the already read-only capsule and descriptor. Neither mode accepts arbitrary modules or paths.
- [x] Add actual child controls for substituted bootstrap/entry/utility, wrong digest/length, wrong argument shape, early stream closure and byte limits; run new controls and unchanged `python3 -I -B scripts/conditional-capture-sdk.test.py "$PRISMPM_CAPTURE_TEST_ELF"`. The controller supplies the actual current source-crate libtest ELF and its original case listing must pass; a tiny protocol probe cannot substitute for that suite. Host results are component evidence, not Python3.12.3/d6 qualification.
- [x] Commit the isolated protocol/bootstrap implementation and report exact interfaces, framing and evidence for independent review.

### Task 2: Read-only actor lifecycle and candidate execution

The spec’s Task2 implementation rulings add a never-started inspection actor to resolve descriptor/runtime circularity and refuse candidate roots beneath writable `/workspace`. Preserve the original18-call/420s cleanup bound; include all three actors in the finite accounting and evidence.

**Files:** Modify the new candidate helper/tests/bootstrap from Task 1; create `scripts/conditional-capture-candidate-command.mjs` and its focused test. Preserve all four legacy authority files.

**Interfaces:** `parent(source: Path, executable: Path) -> int` orchestrates the closed CLI using Task 1's descriptor/materializer. Bind Task 1’s measured source plan to actual independently inspected image/config/platform/inventory/image-authority observations with `bind_runtime`; fixture or absent observations cannot launch staging. One deadline governs all phases. `guest(descriptor: dict, deadline: float) -> dict` verifies immutable input and separate SDK baseline, then returns the closed response wrapping the unchanged original payload. Candidate launcher admits only `/candidate-input/current-test-elf`, existing `/workspace/conditional-capture` output, and the original exact libtest case/supervisor profile.

- [x] Add lifecycle controls that fail initially: exact create/start/inspect order, stage absence before execute creation, extra writable volume reference, wrong role/config/image/mount/argv/environment, pending creation, failed stage retirement, interrupted attachment and insufficient cleanup budget. Assert failed or ambiguous lifecycle never publishes a complete envelope.
- [x] Implement one input volume/stage actor and one work volume/execution actor with exact spec policy. Reuse original bounded subprocess/image/receipt utilities. Inspect actual image authority, inventory and config separately from candidate authority; do not authorize them by equality to caller bytes.
- [x] Implement fixed read-only candidate root and `volume-subpath=candidate-source` compiled-root mount. Validate allowed root grammar, protected ancestors, no-follow metadata and actual mount relation. Verify complete source/authority/ELF at both views before and after execution; keep all copies out of writable work/cache.
- [x] Implement the small candidate Node launcher using the unchanged JS/Python supervisor closure and exact original test/listing/count/timeout/output/exhaustion checks. Preserve cache/protoc behavior and original SDK lock joins.
- [x] Implement complete bounded SDK-tree baseline measurement and recheck. Unsupported actual source closure is a precise refusal, never skipped rows. Preserve original response/result/receipt checks within the candidate response and independently compare them in the parent.
- [x] Implement authenticated bounded retirement with failure volume retention. Create the separate envelope only after original tree/receipt checks, actual EOF and both actor/volume retirements. Its capture-record digest excludes the envelope; outer owner subsequently includes it.
- [x] Run real local process/pipe controls plus unchanged legacy tests and the new launcher tests. Record which daemon/mount behaviors require Task 4 actual qualification rather than crediting a stubbed daemon transcript as proof.
- [x] Commit and independently review the complete authority/lifecycle diff before connecting it to source gates.

### Task 3: Explicit source-test selection and independent reader

**Files:** Modify `crates/prismpm/src/oci/publication_context/capture_tests.rs`, `tests/browser-view/compile.mjs`, `tests/publication-context-linkage/{capture-owner,capture-oracle}.mjs`, the exact source workspace-test caller in `xtask/src/main.rs` / `xtask/src/gate_driver.rs`, and the owned source Node-suite child boundary in `crates/conformance/src/cases/node_suite.rs` only as required. Create `tests/publication-context-linkage/candidate-transport.mjs` and `.test.mjs`; register focused checks through the existing source test owner. Update normative SPEC only for the new test-evidence distinction, without changing public production policy.

**Interfaces:** `verifyCandidateTransport({envelopeBytes, sourceRoot, sourceRecords, executable, captureRoot, sdkLock, inventoryBytes})` independently returns verified transport evidence or throws. `sourceRecords` is the existing independently owned Map including normalized alias `resolved`; `executable` is the owner's actual captured ELF record, never a caller hash alone. Pin exact inner field names against Tasks 1/2's committed descriptor/envelope in the implementation brief before starting this task.

- [x] Add selector tests: absent/explicit legacy route retains original command; exact candidate value selects only the new helper; unknown/ambient conflict refuses before execution; SDK child executes the original body without recursive dispatch.
- [x] Scope candidate selection to the owning publication-capture invocation and the complete workspace-test child command. Reject ambient overrides. Preserve full Cargo test arguments and GateDriver command/clean-source custody; do not globally broaden compiler environment overrides or replace `PRISMPM_TEST_SDK_IMAGE`.
- [x] Add independent JS-reader tests with real temporary source/ELF/capture files: positive Python/JS byte-identical framing vectors including BMP/non-BMP paths; source/union/fixture mismatch; alias normalization; altered source, each authority member, ELF/listing/count, SDK distribution/config/inventory, receipt/tree digest; wrong mount/role/retirement/EOF; unknown fields and added retained file. Coherently editing record copies still fails against independently owned bytes.
- [x] Implement the reader in JS without calling the Python producer. Recompute canonical framing/hashes, verify closed schemas, complete unions, original authority/lock/receipt joins and non-circular envelope closure; distinguish live observations from cryptographic attestations.
- [x] Connect reader to original capture-owner completion and repeated `verify()` checks; preserve original producer-source archive, all release controls and generated native/no_std/Wasm replay.
- [x] Run the focused Rust selector/boundary tests, `node --test tests/publication-context-linkage/candidate-transport.test.mjs`, and existing affected owner/compiler environment tests. Verify legacy authority file hashes remain unchanged and production paths unchanged.
- [x] Commit and independently review scope, environment ownership and reader closure. Do not label this an actual SDK success.

### Task 4: Actual unchanged-SDK qualification and final source acceptance

Refined design: [qualification design](../specs/2026-11-16-candidate-capture-qualification-design.md). Implement/review source Task4a first: direct held-owner16 mutation controls, separately retained bounded control record and early immutable noncompletion locator; source ownership adds only capture-owner, its private helper/test and minimal existing xtask focused-test registration. Preserve65+2 actual OC10 cases, original22 refusals and immutable helpers. Task4b then implements/reviews the game-only actual-daemon qualifier/workflow against the exact reviewed successor. No generic callback or serialized reconstruction of a branded ELF owner is permitted. The new diagnostic sidecar is outside capture hashes and its post-write custody is checked through replay; locator supplies only bounded failure discovery. The reader's unchanged bounded ELF listing is the sole allowed child during mutated envelope controls.

**Files:** In the game repo create a dedicated diagnostic workflow and helper/tests beneath `scripts/numeric/` for focused capture qualification, plus immutable source transport metadata under the existing preparation mechanism. Update `numeric-export-issues.json` and research evidence only from actual results. Final accepted snapshot/full-VV files change only after all applicable source baselines and focused gates pass.

**Interfaces:** Restore the exact clean reviewed source commit/tree with the existing authenticated preparation transport. Hosted source devcontainer builds the genuine fresh test ELF; the unchanged d6 SDK executes it. Separate protocol/mount qualification from the original complete OC10 capture; actual worker/config/platform identities and statuses are retained for each.

- [ ] Design the hosted wrapper from existing full-VV/devcontainer controls, with bounded artifacts and independent final source/tool identity checks. Add focused wrapper refusal tests; independently review before triggering any job. No local full-image pull.
- [ ] On actual d6 prove stage/retire/read-only subpath behavior and actual daemon support. Under UID1000 attempt write, chmod, hardlink, rename and write-then-restore through every source/authority/ELF view and protected compiled-root ancestor. A planted additional writer must block execution. Exercise bounded failed creation/attachment and owned-volume retention; retain original SDK source measurement and original tool identities.
- [ ] Run the genuine exact original capture test, full original graph/publisher/attempt refusals and external oracle retirement. Run independent owner plus generated native/no_std/context/admission Wasm replay and actual retained-envelope mutation controls. Preserve unsuccessful output and original failure history.
- [ ] Import only genuine shared/native baseline outputs through original writers and independent reviews. Refresh final source snapshot and full-VV wrapper; remove the known global `CARGO_BUILD_JOBS=2` override and reject ambient `CARGO_BUILD_*` while retaining source-owned internal settings and offline Cargo.
- [ ] Run all eight full-VV parts and same-source assembler, plus separate original-SDK library verification/corpus gates. Do not combine old2a31 passing partitions with the new revision. Any failed gate remains open with exact evidence.
- [ ] Close NEXP013 only after focused actual transport/capture and required final source gates pass. Publish reviewed game evidence under existing authorization; keep production numeric/render admission governed by the parent plan and all upstream pushes/PRs deferred.

## Plan self-review

Protocol/materialization, immutable source ownership, legacy preservation, original SDK separation, bounded lifecycle, independent reader and exact original capture each map to Tasks 1–4. The five review-focus conditions have explicit tests above. Interfaces use one descriptor and separate envelope; Tasks 2/3 consume recorded committed fields rather than independently inventing them. Actual daemon/subpath, SDK closure and full original test behavior remain measured prerequisites, not assumptions converted into acceptance. No user approval is pending: prior instructions authorize autonomous repair and planning; source authority policy and production gates remain binding.
