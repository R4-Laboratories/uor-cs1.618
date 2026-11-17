# Backport baseline preparation checkpoint review

Reviewed source `2a31ad07..f6776fca` and game `28ba94e..27619a5`, using the supplied incremental review diff, brief, diagnosis and implementation report. The full preparation bundle/patch were omitted as previously reviewed-base material; their immutable restoration is reported, not independently rerun here. No upstream publication, generation, SDK operation or reported suite rerun occurred. This review writes only this file.

## Verdict

**Source specification: PASS for this bounded repair checkpoint.** The authored fixture rebinding, emitter register correction and native helper recipe are legitimate. The new review seals reflect the active Rust implementation, rather than an arbitrary owner-hash reset. Original compiler/toolchain/source-authority policies, expected fixture success, comparison rules and existing native refusal controls are unchanged.

**Game specification and quality: REQUEST CHANGES for one P2 completeness defect before publishing the preparation workflow.** The command sequence and failure capture otherwise support a diagnostic shared-writer proposal. This checkpoint cannot establish shared/native baseline acceptance, full VV, SDK admission or product completion.

## Finding

**P2 — Require retained source/container identity before declaring a complete proposal.** `scripts/numeric/golden-preparation.py:128` sets `complete-review-required` after examining only the four command results/logs, source HEAD/tree and changed-path boundary. It never requires or validates `evidence/source-container.json` (nor the preparation receipt/source-input records). In `.github/workflows/prismpm-backport-golden-preparation.yml:74-79`, container identity capture and collection are independent `always()` steps. If container lookup/inspection fails after successful writer/checker execution, collection still labels the artifact complete despite the missing actual image/rootfs identity. The job fails, but the retained artifact's own completeness claim is wrong and can be consumed independently of that job status.

A narrowly scoped synthetic probe using the existing retention fixture returned `{"status":"complete-review-required","source_container_present":false,"source_inputs_present":false,"candidate_receipt_present":false}`. This was a new missing-identity control, not a rerun of the reported suite. Require bounded regular preparation/container identity records, validate their source revision/tree and image fields, include them in the retained inventory, and leave `result.json` incomplete when identity capture fails or is absent. Add the missing-identity/failing-identity control. The existing successful retention test currently permits this omission.

## Independent recipe and source judgment

The concrete outside-diff check read active `crates/prismpm/src/controller/mod.rs:29-47`, `Controller::load` at lines 530-550, `crates/prismpm/src/exporter/source.rs`, and the default golden build path in `xtask/src/stdlib.rs:262-271`. `Controller::load` selects Released; the ordinary golden build path uses it. The application generator hashes, in order, `Source::frame`, exact exporter/source.rs bytes, application_build.rs, lean_project.rs, holo/archive.rs, dereferenced embedded compiler manifest bytes, then `prismpm/build-artifacts/2`.

`Source::frame` length-prefixes each of the domain, source ID and descriptor with big-endian u64 lengths. Released uses `released` and the exact NUL-terminated `prismpm/exporter-source/released/1\0` descriptor. The helper preserves those bytes/order and the existing compiler-alias target, ancestor, before/after identity and dereference checks. Both owner seals were independently hashed from the reviewed active files:

- Controller: `04f04bddfe071a40940345f12a9487b41f4b77dde62dab91987f5c58d2e3fe0c`.
- Framing owner: `7b8b1c021b0ab2332b5be708947f1e8a4aa0fc5da298430f191b766cce832e32`.
- Independently reconstructed Released frame length: 92 bytes; generator identity: `0eae6b594fc9edbb37ed52d038e15c48c1a2b5cea97fd49e4ec07135375d54f1`.

No candidate selector/fallback was introduced. Unknown owners still refuse; candidate/wrong Released descriptors produce refused baseline identities. Mutation/removal controls include the newly bound framing owner, alongside the existing generator inputs and alias controls. The helper still refuses the actual stale committed shared manifest; calculating a source identity does not qualify generation.

The emitter check independently extracted the exact 31 ordered input paths from active `holo/projector.rs::compute_emitter_semantics_id`, matched them to the unchanged register list, and hashed length-framed paths and actual file bytes. It reproduced `c8213cedf16ad1691f136122a58a87a33a596a95e8e5c9b361bf78109df22133`. The register change preserves the full closure and equality guard.

The retained actual structured CLI records show the original PP2101 f6274f7e/bde664ad mismatch and stable post-rebind success with model `bde664ad933ee9952eaa71f5478494fabc7d30952232a490af0f5dac7274d03c` and 105 entities. The diff changes only the two authored fixture bindings and explanatory comment, preserving expected success and all diagnostic policy. This follows the diagnosed repair rather than synthesizing a golden or blessing a failure.

## Writer and evidence assessment

The separate preparation snapshot/workflow avoids overwriting the historical accepted-candidate path and eight-part VV orchestration. The narrow trigger, pinned checkout/devcontainer action and source cache, original source devcontainer, UID1000/native amd64/Debian12 checks, bootstrap checks, inherited-environment refusal and 8GiB free-space checks are appropriate for this development operation. The source image is not promoted to SDK authority.

The exact ordered commands are native helper tests, text-workbench tests, normative `just golden-write` with explicit reason, then `just golden-check`. A nonzero command stops subsequent commands and retains its original numeric status. Collection starts incomplete, retains original generated files and full-index binary patch including new files, checks source revision/tree and confines changes to tests/golden, and refuses missing status/logs, observation failure, truncation, symlinks and retention overflow. It does not edit generated outputs or weaken their comparison. The identified source/container identity omission is the exception to otherwise truthful proposal completeness.

The reported full helper result remains **18/19**, with the actual-workflow-shell control failing on unsupported host Python 3.13.5. The owner/test was not relaxed. The reported focused 3-test pass, constructor checks, 10 synthetic retention checks, formatting/model checks and immutable restoration are useful bounded evidence; they do not turn the 19-test suite or generated baseline green. No additional full tests were run for this review.

## Pending execution scope

After repairing the completeness defect, this checkpoint may launch only the diagnostic shared-writer workflow. The pinned hosted environment must run all 19 native-helper tests and the unchanged writer/checker, retaining genuine outputs and complete logs/identities. The full generated shared tree and exact patch require independent review and byte-for-byte import in a new source commit.

Genuine X64 and ARM64 native review and all six original raw records remain required through the unchanged native owner and truthful GitHub context; any game-side native adapter still needs separate review. No native result is supplied by this checkpoint. Afterwards capture a new candidate and run all eight original partitions plus same-source assembler at that revision after the original workers finish. Historical 44002718718 failures remain failures. Installed unchanged-d6 and source-free/product integration gates remain separate outstanding requirements.

## Round 3 scoped re-review — game dee288d

**Original P2: ADDRESSED. Specification and quality: PASS for static diagnostic-launch preparation. No new fix-diff breakage identified.** Reviewed `backport-baseline-fix-round3.diff` and the appended implementation report; source `f6776fca` is unchanged. This is a scoped static re-review, with no duplicate tests, generation, publication or edits outside this review append.

Collection now requires all three bounded regular identity files before emitting `complete-review-required`, rejects duplicate JSON fields, hashes their exact retained bytes into the result inventory and counts them against the aggregate bound. The candidate receipt must match the preparation snapshot and fixed source revision/tree with an actual boolean diagnostic flag; source inputs must match the freshly measured nonempty devcontainer closure; container evidence must bind the source revision/tree, native linux/amd64, full container/config identities and nonempty SHA256 rootfs layer identities. An absent, malformed or mismatched identity keeps the collector incomplete.

Capture removes an older receipt before checking source or querying Docker, verifies inspected image/config equality, and validates the record before writing it. Consequently the original independent `always()` collection step cannot retain a successful complete label after a failed capture using stale evidence. New controls cover absent and invalid identities, changed source fields, field duplication, symlinks/size bounds, inventory inclusion and failed/mismatched capture. The report preserves the pre-fix red evidence and records 19/19 passing harness tests both normally and under Python optimization; these are synthetic harness results and do not replace the source helper's still-required hosted 19-test pass.

The static completeness blocker is cleared for the exact reviewed snapshot. Approval extends only to launching the diagnostic original shared writer/checker and retaining its genuine proposal for later review. It does not establish baseline acceptance, native qualification, all-eight VV or SDK/product admission. Parent may hold launch while diagnosing the newly reported actual canonical SDK PP5007 generated-module timeouts. That runtime diagnosis is outside this fix diff; any resulting source or snapshot changes require review of the changed identity/recipe and recaptured preparation input before launch. All earlier pending execution requirements remain in force.
