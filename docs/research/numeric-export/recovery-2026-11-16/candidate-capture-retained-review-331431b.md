# Task4a independent spec and quality review

**SpecCompliance: PASS for the adopted Task4a source-only scope. Quality: APPROVE.** No concrete ranked correctness or scope findings were identified. This review accepts the source implementation for the next separately reviewed Task4b step; it does not establish actual SDK capture, application acceptance, generated replay, daemon qualification, artifact acceptance or full VV.

## Reviewed state and method

Requirements were read first: `task-4a-brief.md`, the Task4a and controller-adoption sections of `docs/superpowers/specs/2026-11-16-candidate-capture-qualification-design.md`, and `task-4a-design-review.md`, including its adopted listing-only exception. Then reviewed `task-4a-report.md`, the complete retained diff, source `AGENTS.md`, the normative conditional-publication-admission section of `SPEC.md`, relevant unchanged owner/reader/closure/count code, and retained verification evidence.

- Source: `/workspace/scratch/prismpm-numeric`, branch `numeric-export-backport`.
- BASE: `f8808ad717a1582cd39d8c01bc452519a112afdd`; base tree `c8ea557e6cc9b6b13355831f5fef71dff2addf3e`.
- HEAD: `331431bc6c2b71ca06d5e145d9e6a825f6218053`; tree `99915b2e2002f4c7bd2cd67d433e111af3141719`; source status clean.
- Exactly four changed paths: `tests/publication-context-linkage/capture-owner.mjs`, new `capture-retained-controls.mjs` and `capture-retained-controls.test.mjs` in that directory, and one focused source-check row in `xtask/src/main.rs`.
- `task-4a-review.diff` is exactly 34,020 bytes, SHA-256 `0830d9862c1b15c04f160607ec48cf47c68381e75e6fd68883b91857475d1eab`. Independently compared it byte-for-byte with BASE-to-HEAD `git diff` and retained `reviewed-source.diff`.

Read-only source review and evidence/hash comparisons only. No source or index edits, implementation, test reruns, builds, Docker, SDK pulls, subagents, push or artifact imports. This report is the only file written by the reviewer. Review-time available space was 9,590,292,480 bytes, above 8 GiB.

## Findings

None. No P0/P1/P2/P3 change request is supported by this review. The pending runtime gates below are validation limits, not claimed passes or newly discovered implementation defects.

## Spec compliance checks

**Actual owner and closed inventory — pass.** `capture-owner.mjs:199` supplies the unchanged transport reader with the privately held `source.records` and actual executable object. Lines 233–241 hold the original capture inventory/oracle/transport and pass the real internal verification closures into the private helper. The helper does not reconstruct a compiler brand, expose a factory callback or introduce an environment selector. Its private exported functions serve internal/component use; the actual factory signature remains unchanged. `capture-retained-controls.mjs:14` fixes the exact ordered 16 rows: seven source/authority controls, five envelope controls, and the four existing added-file cases. Those four retain their original payload, exclusive creation, held-tree refusal and removal semantics at lines 165–169; they are incorporated, not duplicated.

**Mutation execution and failure truth — pass.** `capture-retained-controls.mjs:104` copies the original transport result and positively verifies before taking original envelope/source snapshots. Lines 112–123 verify before each mutation, require the named reader/owner outcome, restore and reverify in `finally`, and append a row only after that succeeds. Original byte length, bytes, mode and regular-file identity are held; restoration checks include device/inode/ownership/link count. A swallowed rejection, unrelated reader error or failed restoration cannot reach the completed record. Lines 130–142 reserve the fixed backup exclusively outside capture, rename the missing envelope out and back while preserving its inode, and refuse an occupied backup. Original held maps/digests are never rewritten to accept changed material.

**Observation versus authority — pass.** Config rewriting at helper lines 147–149 changes the valid config digest and recomputes only the canonical descriptor digest. Retirement rewriting at lines 152–154 chooses a distinct valid actor ID, preserving the rest of the record. Both controls require successful standalone reader return at line 118 and held original owner refusal at line 119. The unchanged reader's source comparison at `candidate-transport.mjs:165` precedes its bounded unchanged-ELF listing at line 184, so private source/authority mutations refuse before execution. Envelope cases can reach only that existing listing; the new helper contains no launch/build operation. The distinction remains retained observed facts versus historical daemon attestation.

**Sidecar and factory evidence delta — pass, explicitly reviewed.** Helper lines 171–187 publish only after all controls and final positive verification, enforce the closed schema and exact rows, and hold the separate sibling's exact bytes/hash/identity/mode. The file is bounded to 64 KiB and written exclusively. `capture-owner.mjs:235` includes the returned sidecar verifier in the normal held verification closure. The sole private factory-record addition at line 246 is `retainedControls:{path,bytes,sha256}`. The replay barriers at lines 264–266 invoke that same verifier. Application receipt/envelope schemas remain unchanged; the sidecar is outside `work/capture`, with no circular capture-tree hash or completion authority.

**Early locator — pass.** `capture-owner.mjs:160` allocates work and line 163 writes discovery before the first staging/build prerequisite. Helper lines 190–228 implement the exact closed noncompletion schema, fixed ignored repository `target/conditional-publication-capture-locators` registry, actual owner-module byte hash, `/tmp` work-path/basename relationship and per-work exclusive filename. Source root, work, target and registry are checked for real unaliased owned directories; work/registry require 0700. Records are bounded owned singly linked regular files, with immutable 0400/0444 modes. Existing members are validated before admission; malformed/aliased/unexpected members and occupied filenames refuse. At most 255 prior records can be admitted before adding the next, preserving the 256-record cap; aggregate bytes include the new record and remain at most 1 MiB. Distinct legitimate calls keep separate records. Later failure retains the locator and work and does not emit a success receipt. No fabricated early source inventory or authority to execute is introduced.

**Scope, closure and counts — pass.** The new direct import enters existing recursive `localModuleInputs` collection in `tests/publication-context-linkage/compile.mjs:61`. `xtask/src/main.rs:357` adds only the focused test row beside the accepted reader tests. No new owner prerequisite or `t.test` is added: the existing six prerequisite calls remain. `crates/conformance/src/cases/mod.rs:764` retains OC10's exact 65+2 registration. Original Node-boundary code and its 12-test inventory are unchanged. Independently rehashed all 12,835 baseline members: only the owner and xtask changed among existing files; all 12,833 nonowned members match. The retained protected audit also binds Task1/2 transport/bootstrap/launcher/tests, legacy authorities, Task3 reader/selector dependencies, all five imported shared goldens, original Rust capture body/all 22 refusal controls, tool/runtime/dependency pins and oracle bytes. The implementation diff leaves the original executable mutation/source barriers and other owner controls intact.

## Quality and verification evidence

Independently verified the evidence index SHA-256 `ae25d03a835225f392fd412bdeb41a5abdf5ab681486f489fb6aab47699ca21d`, and the length/SHA-256 of every one of its 75 files (3,276,002 bytes total) under `/workspace/diagnostic-tools/candidate-capture-retained/`. Inspected recorded command metadata, output, planted-defect restoration evidence, audit logic and final state. No passing suites were rerun because inspection exposed no concrete verification gap requiring one.

The final component evidence `16-final-components` reports 9/9 passing, zero skipped, for these named groups:

- Sixteen restored observations and held written sidecar.
- Omitted, reordered, invented and unsuccessful completed-record rows.
- Swallowed checks and unexpected reader errors, with restoration before failure.
- Rewritten held hashes and failed inode restoration.
- Occupied missing-envelope backup without destroying either file.
- Independent locator invocations and retained early failure.
- Locator aliases, unexpected members, unsafe modes and foreign ownership.
- Registry 256-record bound and prior-record validation.
- Actual current factory function body recording discovery before its first failing prerequisite.

The latter uses explicit pre-capture component dependencies and never invokes source staging or an actor; it is accurately labelled component evidence. The filesystem controls test actual files, including inode replacement and sidecar replacement. `14-planted-ordering` fails the intended early-locator witness after removal of that call; `15-planted-refusal` fails the intended swallowed-reader-check witness. Both retained planted edits were restored, and the final committed bytes match the reviewed diff.

`10-reader-pinned` reports all eight unchanged reader groups passing: canonical framing/order; real-file closure and owned ELF; closed descriptor/lifecycle mutations; altered source/authority/ELF/receipt/extra-file controls; held coherent-observation replacement; caller completion; ambient route/SDK-child conflicts; and separate diagnostics indexing. `11-guards-pinned` reports four passing checks: forged compiler handles/tool families, all five forged-owner adapter refusals, complete canonical capture decoder/owning-source closure, and independent authored-fixture syntax projection. These are host component results, including tiny pre-existing ELF fixtures, not SDK execution.

Whitespace and all three affected JavaScript syntax checks are retained as passing. The broader unchanged custody run `12-custody-pinned` remains **9 passing / 10 failing**, zero skipped. Four actual-execution failures explicitly show missing pinned `/usr/local/cargo/bin/rustc`; six mutation witnesses fail because the earlier host/tool failure prevents their intended behavioral witness. The implementation report preserves these failures and earlier command/PATH setup failures honestly. No policy relaxation or SDK success inference is warranted.

## Remaining gates

Actual 16-row retained-control evidence still requires genuine Task4b OC10. Real immutable-SDK execution, mount/EOF/daemon/retirement behavior, same-source generated replay, complete diagnostic artifact custody and full VV remain pending. Task4b's exact source snapshot and game workflow/driver still require their own implementation review before hosted qualification. This review neither changes nor relabels the unrelated native workflow fixed at 881, and accepts no new artifact import.
