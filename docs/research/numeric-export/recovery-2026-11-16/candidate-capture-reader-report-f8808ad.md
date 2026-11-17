# NEXP013 Task3 implementation report

Status: **DONE_WITH_CONCERNS — implementation committed; independent review pending.** Focused source-selector, reader and boundary checks pass. The affected host suites have explicitly retained environment/process-owner failures. This is not actual SDK qualification or complete OC-10 application execution.

Source worktree: `/workspace/scratch/prismpm-numeric`, branch `numeric-export-backport`.

- Exact base: `881df278923ff271fc179703e55ea91c45f2394d`.
- Base tree: `ee7196f70cb948fec6b9aa85ed1b61eb50c73ea4`.
- Commit: `79a41668ef04c0bb566e0789589934a79c3d8019` — `Verify candidate capture transport with an independent source-test reader`.
- Head tree: `4e9cd09fcd49795e0b3cdcca39fe109bc2925373`.
- Source worktree clean after commit. No upstream push, SDK pull, Docker call, full host compiler build, production Lean source or subagent.

## Owned paths and scope

Exactly ten source paths changed:

1. `SPEC.md`: normative source-test evidence distinction only.
2. `crates/prismpm/src/oci/publication_context/capture_tests.rs`: closed cfg(test) selector around the original capture body, plus its focused test.
3. `tests/browser-view/compile.mjs`: exact owning capture invocation selects candidate route and rejects ambient route/SDK-child values.
4. `tests/publication-context-linkage/capture-owner.mjs`: independent transport verification at completion and every repeated `verify()`, separate diagnostic index, complete 12-case Node-boundary regression inventory.
5. `tests/publication-context-linkage/capture-oracle.mjs`: independently closed original receipt validator shared with the new reader; existing complete source/preimage oracle remains.
6. `tests/publication-context-linkage/candidate-transport.mjs`: new independent JS reader and separate diagnostic observer.
7. `tests/publication-context-linkage/candidate-transport.test.mjs`: seven groups of actual-file transport/framing/selector controls.
8. `xtask/src/main.rs`: exact existing full workspace-test callers select through the new scoped helper; focused Node reader test registered through the existing source audit owner.
9. `xtask/src/gate_driver.rs`: source-test command environment boundary retaining original driver custody, command arguments and target isolation; focused test.
10. `crates/conformance/src/cases/node_suite.rs`: controller-approved narrow ownership boundary described below, plus one focused regression.

No dependency helper/bootstrap/launcher/control file changed. The complete Rust capture body starting at its original `let started = std::time::Instant::now();` and the original `graph_refusals` function are byte-identical to base. All original 22 graph refusals, three publisher substitutions, four attempt refusals, source-free release construction, producer-source archive and generated native/no_std/Wasm replay remain in place. No public capability/model/policy or SDK/tool pin changed.

`17-reviewed-change.diff` is the complete staged change. `18-precommit-state.json` and `20-final-state.json` record exact owned file lengths/hashes and tree identity. `15-scope-audit.stdout` records immutable/dependency/golden comparisons and original Rust-body equality.

## Controller rulings resolved during implementation

**Config observation:** The SDK lock and inventory do not independently contain the image config digest. The controller confirmed that `descriptor.runtime.config_digest` remains an observed parent/image fact. The reader enforces exact shape and canonical descriptor/stage binding; the outer owner's privately held complete tree/envelope detects coherent replacement after capture. No synthetic distribution-to-config mapping or new envelope field was invented. A control explicitly shows that a coherently changed, well-shaped first-admission observation is not cryptographically disproved by JSON alone, then proves that replacing the already-held envelope changes the outer retained tree.

**Capture record ordering:** Original legacy capture rows are sorted recursive DFS, while Task1 source/union rows are globally UTF-8 ordered. The reader preserves the original capture DFS bytes for `capture_records_sha256`. A real-file fixture contains directory `a`, member `a/x` and sibling `a.txt`, for which DFS differs from global path sorting. No legacy protocol was rewritten.

**Node ownership scope addition:** Complete `cargo test --workspace` includes repo-conformance. Its Node suite otherwise inherits the Cargo-owned candidate selector and the independently owning Node capture correctly refuses that ambient value. The controller authorized the tenth path above: the Node boundary accepts absence or exactly `candidate-source-v1`, rejects empty/unknown/explicit-legacy conflicts before launching Node, and removes the inherited route for the new Node owner. The original SDK image variable and exact Node arguments remain unchanged. The capture owner now requires all original 11 Node regression cases plus the new case, exactly 12, both in actual listing and successful summary.

**Local resource guard:** A conservative 9 GiB guard stopped one focused xtask link. The controller authorized one retry at 8.5 GiB, still above the required 8 GiB floor. It passed without triggering the guard. No unrelated artifacts were deleted and no SDK paths were manufactured.

## Selector, environment and no-fallback behavior

`capture_helper(route, sdk_child, installed)` is in the existing cfg(test)-only module:

- Absent or exact `image-owned-v1`: original `scripts/conditional-capture-sdk.py` dispatch when outside SDK, and original in-SDK body behavior.
- Exact `candidate-source-v1`: only `scripts/conditional-capture-candidate.py`, including an explicitly selecting non-child caller that itself has installed SDK markers.
- Unknown/non-UTF-8/empty values: refusal before compiler acquisition or any helper/Docker execution.
- A marked SDK child without installed inventory refuses. A recognized route with an installed SDK child executes the original body, never recursively dispatches.
- The existing exact `/usr/bin/python3 -I -B HELPER parent SOURCE_ROOT CURRENT_EXE` arguments remain. No failure path retries or falls back.

The Node publication owner rejects any ambient route or SDK-child variable before compiler checks or process execution. Only its exact `runPublicationCapture` child environment adds the candidate route beside its already-owned output path. `compilerEnvironment`'s general extra-variable allow-list and pinned PATH were not expanded, and `PRISMPM_TEST_SDK_IMAGE` was not replaced.

The three existing complete workspace-test command vectors are admitted verbatim: full VV; VV source part excluding repo-conformance; and the existing unit-owner bins/lib/tests workspace vector excluding repo-conformance. No filtering after `--`, replacement package suite, new Cargo flags or environment-wide override is admitted. GateDriver still captures and rechecks its running executable before/after the child and preserves its isolated target directory and offline environment. Existing clean-worktree gates remain unchanged.

The Node-suite boundary then removes only the recognized Cargo-owned route before the independently owning Node invocation. Unit tests pass explicit options to the Rust selector/environment builders rather than mutating process-global Rust environment.

## Independent reader contract

Exact interface:

```
verifyCandidateTransport({envelopeBytes, sourceRoot, sourceRecords,
  executable, captureRoot, sdkLock, inventoryBytes})
```

`envelopeBytes`, `sdkLock` and `inventoryBytes` are original byte buffers, joined again to actual retained files. `sourceRecords` is the existing independently owned Map. `executable` must be the actual `captureCompilerArtifact` owner accepted by its private WeakSet; an object with matching path/hash/verify labels refuses before listing. No Python producer is called by the reader.

The reader validates the exact 20-field `prismpm/conditional-candidate-transport-evidence/1` envelope, false acceptance, exact scope/route, and all closed subordinate descriptor/stage/runtime/row/inspection/mount/view/result/retirement shapes. There is no JSON-carried daemon attestation claim.

### Canonical framing

`canonicalTransport` independently implements sorted object keys by Unicode scalar/UTF-8 order, compact separators, ASCII escaping (including surrogate-pair escaping for non-BMP scalars), and one final LF. Array order is retained. Non-scalar strings, non-integer numbers, unsafe integers, negative zero, excessive depth, non-plain objects and >32 MiB canonical JSON refuse. Parsing is followed by exact byte equality, so duplicate keys, noncanonical whitespace and alternate number/framing spellings cannot be accepted through normalization.

The exact pinned vector is:

```
[{"kind":"directory","path":"\ue000"},{"kind":"directory","path":"\ud800\udc00"}]\n
```

SHA-256 `cf49b0434bd524f4577489c108f8362dde4b0f2c25f1f2259b2c2abe2adee327`.

Tests compare the independently implemented serializer with ordinary isolated Python `json.dumps`, not the producer module. BMP/non-BMP **object keys**, path rows, controls, quotes, backslashes and DEL are covered.

### Source, fixture, authority and ELF closure

Source and retained trees each retain 512 MiB/100,000-row bounds; regular source members retain 256 MiB; source/union rows have strict UTF-8 order, scalar confined paths, exact parents, closed file/directory/link shapes and direct measured alias targets. The owner's `resolved` alias field is checked against normalized direct target resolution before deliberate removal from protocol rows. It is not silently dropped.

Actual source files are read through no-follow, singly linked, bounded regular handles with streaming hashes and before/after inode/device/mode/size/time checks. The actual complete source tree is compared to the independently owned Map and to the descriptor. The existing owner's source exclusions remain only `.git`, `target`, `.lexlean`, `.prism` at root. The exact three recursively consumed fixture subtrees are independently selected, required complete and alias-free, and joined to the complete union. All source/fixture/union hashes are recomputed. The integrated owner supplies its fresh private complete source; no producer-provided Git or record hash substitutes for that Map.

The stricter runtime root rule rejects all `/workspace/NAME` paths. Only protected `/workspaces/NAME` or the exact private `/tmp/prismpm-publication-capture-TOKEN/source` grammar is admitted, with selection and actual unaliased root checks. JSON observations of protected ancestors/read-only mounts remain distinct from the Task4 live mount proof.

The fixed six authority rows are joined to independently read source bytes in exact order. Bootstrap is <=32 KiB; the two bootstrap Python modules are <=1 MiB. The immutable original utility digest is required. Both observed image-authority entries additionally join the corresponding actual source utility/original-launcher byte lengths and independently pinned digests, and their SDK-tree records.

The owner verifies the actual ELF identity before and after reading/listing. ELF descriptor bounds remain 4 bytes–1 GiB; the existing compiler-artifact owner keeps its original stricter construction guard as well. Actual fresh bytes, size, complete `--list --format=terse` output, distinct test count and the one exact original test name are recomputed. The reader uses a bounded 30-second listing with original-style timeout/group retirement and 1 MiB diagnostics, not a caller-supplied listing hash. This listing executes no selected test body.

### Runtime, original receipt and non-circular retained tree

The unchanged d6 SDK distribution is fixed. Runtime OS/native architecture, config-digest shape, inventory digest and exact two image-authority observations are checked. The installed SDK-tree rows and hash are recomputed; canonical candidate/SDK-tree equality and utility equality booleans must match the actual compared values.

The unchanged fixture's captured `sdk-lock/1` is closed and joined to the independently supplied/retained bytes, exact SDK image, unique ordered installed artifact rows plus exactly the SDK-manifest artifact, and actual retained `standards.lock` bytes. No platform-lock schema or distribution/config mapping is fabricated. Inventory is parsed with fatal UTF-8 decoding and its closed top-level schema checked. Original inventory bytes, not reserialized labels, bind its hash.

`verifyCaptureReceipt` enforces the exact original receipt field set, false acceptance, source-free scope, source identities, expected-subject shape/release/SDK joins, all 22 ordered graph refusals, original attempt/publisher controls, elapsed bound, executable/inventory/SDK-lock joins, all seven linkage-preimage hashes, context-preimage hash and metadata hash. Source archive bytes and the original `installed_sdk_source_matches` predicate are independently checked. The existing complete `verifyCaptureOracle` still reconstructs all eight preimages and source metadata at completion and on every repeated verification; this component fixture is not a replacement for that oracle.

Stage admission must exactly match the canonical full descriptor hash, all source/union/fixture/authority/ELF fields, independently rebuilt transfer manifest and literal EOF observation. The inspection role is never-started/retired-before-stage. Stage retirement before execution, the four exact named volume/socket mount requests and exact readonly-view fields are required. Actor roles are inspect/stage/execute in that order with distinct full IDs and correctly token-derived names; volumes are input/work. Literal absence/EOF booleans, <=18 cleanup count and the unchanged successful Python3.12.3 subreaper exhaustion/result shape are checked.

The original `capture-evidence.json` digest and complete pre-envelope capture tree digest are recomputed from actual retained files. Only `candidate-transport-evidence.json` is excluded from that pre-envelope hash. The complete tree is then measured including the envelope within the original bounds, with only the original reconstructible `producer-source/target` subtree exclusion. Added files, including unreported retained output, refuse. The outer capture owner holds and compares the complete original tree including the envelope before repeating both original and transport verification. Coherent record-only edits cannot replace the independently owned source/ELF/retained bytes, and coherent post-capture observation-envelope edits cannot replace that held tree.

The finalized Task2 ACK remains exactly `{descriptor_sha256,retire:true}` plus actual EOF, enforced by the unchanged dependency. It is not an envelope field; this reader does not invent an independently measured ACK or historical daemon fact from the envelope's observation labels.

### Separate diagnostics

`verifyCandidateDiagnostics` inspects only the deterministic `<validated capture output>.candidate-diagnostics` sibling. It requires its unaliased owner/private0700 directory and exact canonical manifest/token/channels/aggregate limits. It measures available no-follow, singly linked bounded channel files and rejects unknown files or oversized channels/aggregates. The original capture channels each retain 32 MiB and combined64 MiB; exception channels each32 MiB and combined32 MiB; execute/owner/stage stderr each1 MiB; manifest1 MiB.

The capture owner writes a separate `candidate-diagnostics-index.json` in its private work directory, including on failures when the deterministic sibling exists. Available diagnostics remain outside application capture/envelope hashing. The index expressly says completeness is not asserted: absent files can mean no bytes, and inherited forwarded stdout/stderr may be incomplete. A diagnostic indexing failure does not replace an already-raised capture failure. Success joins the diagnostic token to the transport owner token, but neither diagnostic labels nor index substitute for original application evidence during repeated verification. Actual hosted artifact retention/custody remains Task4.

## Verification and evidence

Evidence directory: `/workspace/diagnostic-tools/candidate-capture-reader/`.

Every command has retained separate stdout, stderr and JSON argv/cwd/exit status/elapsed metadata. Guarded builds also record minimum free bytes and whether the guard stopped them. The final `index.json` lists exact lengths/SHA-256s for the bounded command logs, runner snapshots, scope audit, source diff and source states; the index does not self-hash. Final index details are appended below.

### Red and development outcomes

- `01-reader-red`: exit1, missing new reader module, before implementation.
- `02-reader-development`: exit1, 6/7 test groups passed. The remaining failure was a diagnostic-message regex assuming Node's truncated assertion diff would print the changed filename. The mutation itself refused correctly. The assertion now gives an explicit complete-tree label.
- `03-reader-green`: exit0, 7/7 groups. Subsequent `08`, `13`, `14`, `16` runs were justified by tightened SDK/standards joins, bounded listing and decoder/cap controls; each passes7/7.
- `07-rust-gate-driver`: exit101, one new test assertion borrowed a temporary optional `OsStr`. Fixed by comparing copied Option values; no runtime behavior changed.
- `09-rust-gate-driver`: guard-stopped/reaped with status-15 during link at9,660,018,688 bytes free, before test execution. This is not a test pass. Link temporary cleanup restored >10 GB; the authorized retry is below.
- `19-node-inventory`: probe-only assertion initially compared an unfiltered blank separator against the owner's deliberately blank-filtered listing. The original failed output is retained. The corrected probe follows the original owner behavior and passes as `21`; production code did not change for this correction. Original/red probe and original9GiB runner snapshots are retained separately.

### Final focused passing commands

All source commands run in `/workspace/scratch/prismpm-numeric`. Rust uses `/workspace/diagnostic-tools/rust-1.97.1/bin` first in PATH, `CARGO_HOME=/workspace/diagnostic-tools/cargo-home`, and `ELAN_HOME=/workspace/diagnostic-tools/elan`.

| Evidence prefix | Command / result |
| --- | --- |
| `05-rust-selector` | `cargo test --locked --offline -p prismpm --lib oci::publication_context::capture_tests::capture_route_is_closed_and_never_falls_back -- --exact` — exit0, 1 passed. Actual current library rebuilt. |
| `06-rust-node-boundary` | `cargo test --locked --offline -p repo-conformance --lib cases::node_suite::tests::` — exit0, all12 passed, none ignored. |
| `11-rust-gate-driver` | `cargo test --locked --offline -p xtask gate_driver::tests::` — exit0, all5 matching GateDriver tests passed; unrelated integration binaries report0 selected tests. Minimum9,611,751,424 bytes free, guard not triggered. |
| `12-boundary-probe` | Actual rebuilt original library ELF invoked twice at the original exact capture name with unknown route or missing-inventory SDK-child environment — each genuine libtest run exits101 at its expected pre-dispatch refusal; probe exits0. No helper/Docker dispatch. |
| `16-reader-lock-final` | `node --test tests/publication-context-linkage/candidate-transport.test.mjs` — exit0, 7 groups passed, 0 failed/ignored. |
| `21-node-inventory` | Actual current repo-conformance ELF `cases::node_suite::tests:: --list` matches the complete capture-owner inventory exactly: all original11 plus new boundary case, total12. Probe exit0. |
| `15-scope-audit` | Exit0. Four immutable authority files, six dependency/helper/control paths and five imported shared-golden files equal base; original capture body and graph-refusal implementation byte-identical. |

The seven JS groups cover real temporary source/capture files and an actual freshly compiled small Rust libtest ELF. That ELF's exact-name test is explicitly an empty **component fixture**, used only to exercise real ELF/listing custody. It is not the original application case or successful SDK capture. Tests exercise Python/JS byte equality, BMP/non-BMP rows/keys, scalar rejection; normalized aliases; source/union/fixture membership; all six authority record and actual-byte changes; coherent copied authority edits; actual ELF corruption and forged owner labels; ELF size/hash/listing/count; SDK distribution/config/inventory/tree/authority joins; original receipt, standards lock and retained tree changes; inspection/mount/role/retirement/EOF failures; unknown fields; added retained files; sparse overlimit source member; malformed envelope bytes; coherent post-capture config-envelope substitution against held outer tree; ambient route/SDK-child refusal; and separate bounded diagnostics.

### Affected existing suites and honest host failures

`04-affected-js` ran all four selected files: `capture-guard.test.mjs`, `compiler-artifact.test.mjs`, `compiler-owner.test.mjs`, `browser-environment-preflight.test.mjs`. Result: **37 tests,31 passed,6 failed**. Failures were one existing host timeout worker not reaped; four compiler-artifact execution controls rejected inherited `NODE_PATH`; one semantic-source guard lacked the default Cargo cache.

`10-affected-js-owned-env` reran only the affected capture-guard and compiler-artifact files with forbidden ambient Node/loader overrides removed, original pinned Cargo/Elan homes, and the already-built original semantic-source tool. Result: **15 tests,11 passed,4 failed**. Both capture-guard tests pass, including complete static owning-import closure and independent authored syntax projection. The four actual compiler-artifact execution cases now fail at the unchanged pinned runtime guard: `/usr/local/cargo/bin/rustc` is absent on this host. The host also lacks `/usr/local/elan/bin/lean`. These are retained failures, not skipped or relabelled passes. No alternate SDK path, compiler policy bypass or fabricated installation was introduced.

The15 existing compiler-owner controls passed in the original broad run. The environment preflight passed6/7; its remaining real timeout/reaper failure is the known host process-owner limitation. Those passing suites were not rerun without cause. Actual unchanged-SDK environment validation remains required.

The initial broad JS invocation had pinned Rust PATH but omitted the explicit retained Cargo home, causing the isolated semantic-source lookup failure; the corrected command fixes that caller setup without altering source policy. No dependency download occurred.

## Immutable authority hashes

| File | Bytes | SHA-256 |
| --- | ---: | --- |
| `scripts/conditional-capture-sdk.py` | 55064 | `ca09b9de3bf57c3e2dc16e11d4d1a527b9b2f1f271566bb7a87846d0a24f8e9a` |
| `scripts/conditional-capture-command.mjs` | 1554 | `ac11aadd31f0a3e40df7866cc7690be8e7c8c252120146d718471358840ed6dd` |
| `scripts/sdk-command-owner.mjs` | 8524 | `79e017eeb59107064fbd5917b09e63259dcf47fe9ecdda1ff3db759944794308` |
| `scripts/sdk-command-owner.py` | 7035 | `ca3517a446b8082856e2e952a811a81436aabfd9a71b4414e3298d202aea8854` |

The original Python control file, Task1/2 implementation/control files and the five independently imported golden files also retain exact base bytes, recorded individually in the scope audit. No source-production path is in the commit; all Rust behavioral changes are test/module infrastructure or xtask/conformance ownership boundaries. Original SDK distribution, inventory/marker/PATH policy, resource/cache/log limits and production admission are unchanged.

## Remaining qualification gates and limitations

Independent implementation review is still the controller's next step; the implementer performed staged diff/scope/framing/closure review but does not call that independent review.

Task4 must still establish actual unchanged-d6/Python3.12.3/native-architecture bootstrap and full exact original source/ELF closure; original source-free OC-10 application execution with all22 refusals and external oracles; complete actual SDK-tree closure; both real10GiB headroom checks; never-started inspection and anonymous-volume suppression; actual stage absence; read-only subpath/mountinfo/protected-ancestor and same-UID mutation resistance; actual daemon ownership/failure/EOF/retirement behavior; diagnostic retention and artifact custody; and actual final actor/volume retirement. Same-source generated replay and required full VV remain outstanding. The local current free space is above8GiB but is not presented as satisfying a future10GiB SDK-stage requirement.

The first admission of shape-correct config/mount/retirement facts depends on the actual privately owned producing lifecycle and hosted observations. The independent reader prevents byte/binding/closure substitutions; JSON alone cannot establish historical daemon state. No malicious-daemon isolation, cryptographic config attestation, production acceptance, universal arithmetic, source-free compiler runtime or multi-architecture success follows.

## Final evidence index

`index.json`: 65 entries, 141525 indexed bytes; SHA-256 `51a302c07e2f048650fdc4640047a19081440fd3dc27fb005c9ba99c569d4cb9`. Final read-only disk observation: 9611051008 bytes free (>8 GiB). Source status remains clean. `22-test-executables.json` records actual rebuilt host libtest bytes/digests; neither is an SDK success receipt.


## Task3 fix round1/5 — caller completion and isolated environment controls

Status: **FIXES COMMITTED; independent scoped re-review pending.** The original independent review required changes for the P1 completion-marker integration blocker and the controller-clarified P2 test-isolation requirement. Their exact open text is retained below, followed by the implemented fixes. Historical implementation and test evidence above remains intact; it does not claim the reviewed base was accepted.

- Fix base: `79a41668ef04c0bb566e0789589934a79c3d8019`, tree `4e9cd09fcd49795e0b3cdcca39fe109bc2925373`.
- Fix commit: `f8808ad717a1582cd39d8c01bc452519a112afdd` — `Use retained candidate evidence instead of forwarded completion markers`.
- Fix tree: `c8ea557e6cc9b6b13355831f5fef71dff2addf3e`.
- Exactly two owned paths: `tests/browser-view/compile.mjs` and `tests/publication-context-linkage/candidate-transport.test.mjs`. Commit used `git commit --only` with those two names. Source status is clean; no push.

### Open independent findings, verbatim

### P1 — Candidate selection leaves an impossible legacy completion-marker requirement

Location: `tests/browser-view/compile.mjs:277` (candidate selection at line270); affected integration: `tests/publication-context-linkage/capture-owner.mjs:183–207`.

`runPublicationCapture` now selects `candidate-source-v1`, then still requires stdout to contain `PASS complete actual conditional publication capture: ` followed by its **host** output path, normally `/tmp/prismpm-publication-capture-TOKEN/capture`. That exact host-path marker is emitted only by the unchanged legacy parent (`scripts/conditional-capture-sdk.py:971`). The candidate parent emits `PASS complete candidate-source conditional capture and measured actor/volume retirement: HOST` instead (`scripts/conditional-capture-candidate.py:1670–1671`). The genuine original Rust body does emit the old wording (`capture_tests.rs:524`), but candidate guest configuration sets its output to `/workspace/conditional-capture/capture` (`conditional-capture-candidate.py:816–830`). Forwarding that body output cannot supply the missing host-path string.

Consequently, even a candidate run that returns status0, executes the exact original test, retains the complete original application evidence and envelope, and retires its actors/volumes is rejected at line277. The enclosing prerequisite throws before `verifyTransport()` and `verifyCaptureOracle()` can establish completion, so generated replay is never reached. This is a deterministic integration mismatch, independent of the disclosed host tool/reaper limitations or future actual-SDK outcomes.

The finalized Task2 contract also makes candidate stdout/stderr forwarding best-effort. Merely changing the expected text to the candidate parent's marker is insufficient: that marker can legitimately be absent while the separately owned retained evidence is complete. Preserve actual outer process/test success and all original receipt/source-free/refusal obligations, then establish candidate completion through the independently owned envelope, original receipt and complete retained tree. Preserve inherited diagnostics as diagnostics and retain/index the sibling channels. Do not change the immutable legacy helper or Task1/2 dependencies to restore a prose marker.

Add a focused caller-boundary regression covering a valid candidate response with the guest-path original marker and candidate-path host marker, and successful retained evidence when candidate forwarding omits either marker. Negative process status, incomplete original evidence, missing/altered envelope and incomplete retirement must still refuse. This can be a clearly labelled component control; it is not an actual SDK capture.

**Named focused check — CANDIDATE_COMPLETION_BOUNDARY:** Executed the exact unmodified `runPublicationCapture` function extracted in memory, with explicit filesystem/process doubles and a transcript assembled from the actual guest/parent print sites. No helper or SDK process ran. The child double returned status0 and complete libtest summaries; the transcript contained the candidate host-path marker and the original guest-path marker. The actual function reached one launch and rejected exactly its `result.stdout.includes('PASS complete actual conditional publication capture: ' + output)` assertion. The probe reported `oldHostMarker:false`, `candidateHostMarker:true`. An initial probe attempt used a separate VM realm and failed earlier because strict array equality rejected the cross-realm empty array; that probe established nothing. The corrected same-realm probe isolates the stated defect without altering the function body.


### P2 — Ambient-route control mutates the process-global environment

Location: `tests/publication-context-linkage/candidate-transport.test.mjs:196–205`.

The new ambient route/SDK-child refusal control assigns and deletes `process.env[key]` around direct calls to `runPublicationCapture`. The controller clarified that the brief/design requirement to use explicit environment maps/options and avoid global mutation applies to **all new boundary controls**, including this JavaScript test, rather than only the Rust selector/GateDriver/Node-boundary tests. The implementation therefore violates that explicit test-isolation instruction.

The test is synchronous and restores each original value in `finally`, so this is a low-risk instruction mismatch, not evidence of an observed race or acceptance bypass. Exercise the actual ambient boundary in a child process supplied an explicit environment map for each case, preserving refusal-before-compiler/execution assertions without mutating the test process's global environment. Keep empty, explicit legacy, exact candidate and unknown values for both owned variables. No production environment allow-list expansion is needed.

This addition follows the controller's explicit global-scope ruling after the original report. No extra tests, probes, source changes or broader review were performed. Both SpecCompliance and Quality remain **CHANGES REQUIRED**; the P1 caller completion finding remains the primary blocker. Repair and independently review both findings before advancing Task3.


### P1 repair and completion boundary

The caller no longer requires any forwarded prose marker. The actual outer process error/status and one-passed, zero-failed, zero-ignored libtest summary checks remain unchanged. The exact executable/arguments, candidate route scope, empty private output guard, deadline/log bounds, process-group cleanup and inherited stdout/stderr retention remain unchanged.

Returning from `runPublicationCapture` is still only successful outer invocation. The unchanged owning factory must subsequently verify the actual candidate envelope and its descriptor/source/ELF/complete original receipt/tree/retirement joins, the independent complete source/preimage oracle, separate diagnostic ownership and repeated complete-tree custody before completion or generated replay. No marker or diagnostic string replaces those checks. The independent reader, original receipt validator, factory completion WeakSet, original application controls and generated replay code were not modified.

The new regression evaluates the exact current exported `runPublicationCapture` function body in memory with explicit process/tool-check doubles. It uses the existing real temporary source, freshly captured tiny libtest ELF, receipt, inventory/lock and capture-tree fixture; after the caller it executes the actual unchanged independent transport reader against those owned files. Only the process launch and prequalified tool checks are doubled. It is explicitly labelled component evidence, not SDK/application execution. It asserts the exact original timeout/ELF/test argv and scoped route/output environment, one launch, one group-cleanup call and exact retained inherited diagnostic strings.

Four positive cases pass: both original guest-path and candidate host-path markers; guest marker only; candidate marker only; and no forwarded markers. Every positive still contains the outer successful libtest summary and passes the actual retained-evidence reader. Eight negatives remain refusals: nonzero outer status; no outer test summary; missing original receipt; incomplete22-refusal receipt; missing envelope; altered envelope; incomplete retirement EOF observation; and an unreported retained file. The regression first failed at the exact original impossible host-path-marker assertion before implementation, then passed after removing that dependency.

### P2 repair and environment isolation

The former assign/delete/restore loop over `process.env` has been removed. Eight real isolated Node children receive explicit copied environment maps, testing empty, explicit legacy, exact candidate and unknown values for each of the two owned variables. Each child imports the actual production test helper and calls it with deliberately nonexistent executable/directory paths. It must observe the exact ambient route/SDK-child refusal before any compiler/file/process execution path; child exit status and signal are checked. The parent environment is compared to its original snapshot and never mutated by the control. No global compiler allow-list, SDK path or production environment policy changes.

### Focused red/green and covering evidence

Additive evidence directory: `/workspace/diagnostic-tools/candidate-capture-reader/fix-1/`. The original65-entry evidence index remains unchanged and was independently archived by the controller. Each new command retains stdout/stderr and argv/cwd/status/elapsed metadata.

| Prefix | Command / outcome |
| --- | --- |
| `01-caller-red` | `node --test --test-name-pattern='candidate caller completion' tests/publication-context-linkage/candidate-transport.test.mjs` — exit1; one selected test fails at the unchanged impossible legacy host-path-marker assertion. |
| `02-caller-env-green` | `node --test --test-name-pattern='candidate caller completion|ambient route and SDK child' tests/publication-context-linkage/candidate-transport.test.mjs` — exit0, both selected tests pass. |
| `03-covering-reader` | `node --test tests/publication-context-linkage/candidate-transport.test.mjs` — exit0, all8 groups pass, zero failed/skipped/ignored. |
| `04-narrow-owner-guards` | `node --test --test-name-pattern='independent capture decoder|independent syntax projection|compiler owner refuses forged handles and unregistered tool families|all five existing adapters reject forged owners' tests/publication-context-linkage/capture-guard.test.mjs tests/browser-view/compiler-owner.test.mjs` — exit0, all4 selected affected checks pass, zero failed/skipped. |

Node reader commands used pinned Rust1.97.1 first on PATH for the existing tiny component-ELF fixture. The narrow owner command additionally removed forbidden ambient Node/loader overrides and supplied the original pinned Cargo/Elan homes and the already-built semantic-source tool, exactly as in the corrected initial verification. No source Rust/Cargo rebuild, full passing-suite rerun, SDK pull or Docker execution occurred. Previously documented host SDK-path/reaper failures were not rerun or relabelled as passing; actual unchanged-SDK/full-VV qualification remains pending.

`05-scope-audit.json` compares23 protected dependency, immutable authority, original Rust/Node/GateDriver, reader/oracle/factory, normative and imported-golden paths to the exact fix base: all byte-identical. It also confirms only the two owned paths changed and no direct process-global environment assignment/deletion remains. `06-reviewed-diff.patch` is the exact two-file delta; whitespace check passes. `07-open-review-findings.md` retains the exact quoted findings; `08-final-state.json` records base/head/tree, owned byte lengths/hashes, clean status and disk space.

Fix index: 17 entries, 24846 indexed bytes; SHA-256 `22e7d032a70e765ebbdc515fc3d0b2c97956c0356dea61d90fc6beaa163df9fd`. Final observed free space: 9599000576 bytes (>8 GiB). No unrelated artifacts were removed. The finalized Task1/2 contracts and all remaining actualSDK, mount/EOF/retirement, diagnostics custody, original22-refusal, source replay and full-VV gates remain unchanged. Parent independent re-review is the next step.
