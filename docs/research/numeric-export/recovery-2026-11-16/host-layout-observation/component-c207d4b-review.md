# Task4c1 implementation review

**SpecCompliance: FAIL. Quality: CHANGES REQUIRED.** Two scoped Important findings below; no Critical finding. Both corrections belong in the new observer/tests and do not require changing original validators, source policy, workflow pins or observation-only scope. Independent re-review remains required before the diagnostic run.

## R1 — Important: the fallback artifact discards a valid root refusal

`scripts/numeric/host-layout-diagnostic.py:794` replaces a successfully validated root control with report=null by the generic string `root_no_report`. Lines802–817 then create the fallback layout/status using only that generic error. The root's actual bounded `first_issue`, populated at lines684–686, is not copied into either retained file. The root control is captured by the runner and is not separately printed or uploaded.

For example, authentication can return a valid same-request/deadline control with a specific failure code or errno and no report. The uploaded two-file artifact then retains the real root exit but loses the distinguishing failure. This defeats the observation task's early-failure diagnostic requirement and can leave the next run as opaque as the preceding failures. It is not a false-success issue: exit1 and nonacceptance remain intact.

**Minimal repair:** validate the nested bounded first-issue record and retain it with explicit root-control provenance in the incomplete fallback/status route, alongside the runner's own generic outcome if useful. Keep unknown observer/source facts null, distinguish invalid/unbound control from a validated root report, and preserve all existing byte caps. Do not replace a partial/preexisting layout or weaken publication admission.

**Required coverage:** a valid no-report root response with a distinctive issue code, node/stage and errno must survive into the actual runner-readable fallback artifact exactly, with exit1, null probe witnesses and incomplete coverage. Cover malformed/oversized issue refusal and retain the existing partial-publication/hash-mismatch non-upload cases. The current fallback test supplies empty stdout and checks only generic fallback, so it does not expose this loss.

## R2 — Important: the manifest assigns runner ownership to the root ledger

`scripts/numeric/host-layout-diagnostic.py:139`–141 assigns `[uid]` to every evidence descendant, including fixed `R/evidence/.host-bridge-root`. The existing bridge creates that directory as root with mode0700, and this observer's own creation rule at line294 identifies its actor as root. Its expected owner must therefore be UID0.

A bounded pure manifest/structure inspection for runner1001 confirms that the ledger row currently has owners=[1001] and that a directory identity with UID0/mode0700 is rejected. Conversely, the runner-owned equivalent meets this incorrect owner condition. No privileged filesystem claim is involved in that inspection. Although the next freshly prepared observation job normally finds this future node absent, the declared complete layout contract misclassifies an existing legitimate root ledger and encodes the wrong custody expectation in its artifact.

**Minimal repair:** give this exact fixed role owners=[0], retaining future-optional presence, private0700, no-follow/ACL/stability rules and the runner-owner expectations for other evidence/control/export nodes. Do not widen all evidence ancestry to accept arbitrary root or runner owners.

**Required coverage:** assert the fixed manifest's ledger owner separately from runner control/export owners; verify root0700 acceptance and runner-owned rejection at the structural-policy level, with any projected identity labelled honestly. Preserve the expected-absent path and full81-node count. No privileged test is needed to test this role declaration.

## Reviewed identity and evidence

Reviewed commit `c207d4b1f8b1bf4db7699a60ae8e579465573b0f` against the approved brief/design and final implementation report. Exactly the three new paths are in scope. The supplied88,415-byte review package has SHA256 `a67ab31fb1819b0edefcfa2841c5b6961269d2f3cf4e7703c1a5ff3981bb4553`; its patch body equals the filtered `git diff -U10 ce978d8 c207d4b`, with an explanatory trailing scope note. Committed and reviewed working bytes match all three implementation hashes in the evidence index; the canonical report hash also matches.

Independently verified all15 retained evidence files, totaling100,747 bytes, under `/workspace/diagnostic-tools/host-layout-diagnostic/`. Index SHA256: `1fed615411179399e39173fa9a84fb1f036184cb0236a780e45d157f73284c22`. All8 original authority/workflow files, all288 prior runtime files and the original source index hash match baseline. Source remains clean463177a.

Recorded final command is `python3 -B scripts/numeric/tests/test_host_layout_diagnostic.py -v`; complete final stderr records44 tests,43 passing and one explicit privileged-witness skip. Earlier failed runs remain retained. Real owned-fixture ACL/default-inheritance syscalls and projected socket-alias UID checks are distinguished correctly. These tests were inspected, not rerun. The review's additional diagnostic only constructed the fixed manifest and evaluated its pure structural predicate; it created no fixture or privileged witness.

## Other reviewed boundaries

The new workflow has the exact narrow trigger, fixed pins, ten-minute ceiling, independent diagnostic job and always-nonaccepting observer. Unchanged prepare is compatible with the new context; the observer independently binds the new workflow/commit/authority bytes without calling the old workflow validator or requiring its preflight ledger. No source payload reader, credential selector, source probe or expensive workload is introduced.

The fixed81-node closure, required/future distinctions, independent safe-branch traversal, separate exact access/default ACL retention, procfd binding, identity/ctime/ACL rechecks and explicit overflow/incomplete coverage are otherwise aligned with the design. The byte-budget logic omits decoded expansion as well as raw ACL bytes. Creation rules preserve unknown actual inheritance and distinguish initial creation modes from later chmod.

Publication uses held directory descriptors, exclusive filenames, private ACL/mode checks and parent/name rejoining. Runner read/hash and exact two-file inventory gate the sole artifact_safe output; partial/preexisting reports are not overwritten by fallback. Root does not receive GITHUB_OUTPUT. Root and runner use the charged original deadline with D−3 measurement and D−1 root limits, bounded streams and remaining-time Git subprocess management. No separate policy or custody defect was identified in these paths during this scoped review.

Actual root/nonzero-runner execution, hosted ACL/layout completeness and diagnostic publication remain unproved by local components. Neither this review nor the diagnostic itself authorizes a source-access decision, preflight admission or qualification run. No unrelated compiler observations are included in this verdict.

Only this report was written. No implementation/source/index edits, subagents, redundant tests, privileged operations, network, Docker or builds. Observed free space8,974,766,080 bytes, above8GiB; unrelated work was left untouched.
