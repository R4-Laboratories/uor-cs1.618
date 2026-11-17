# Task4b host socket implementation review

**SpecCompliance: PASS. Quality: APPROVE.** No Critical or Important finding in the scoped socket repair. This approves the implementation for the separately controlled next hosted preflight; it does not establish the hosted socket layout, credential drop, cross-UID handoff, scenario/OC10 success or application acceptance.

## Identity and evidence

Reviewed commit `a37db958cbed291f215cf034069ffddfbd1fee44`, tree `e8056a0d2286c7e46ba49de158ab2ba50c2d8180`, parent `75bba7c018893bafc8bd234cb11c1f797927fe90`. Exactly the driver and focused tests change. The supplied diff is 25,965 bytes, SHA256 `781c0b9dd3b4e9ae671e00db95deea92f4ccf9d9ec319962df0cf06f39142b29`; its patch body exactly matches `git diff -U10 a37db958^ a37db958`. Committed, reviewed working and tested preservation-proof bytes match for both files.

Read the review brief first, then the full diagnosis, latest report section, exact implementation changes and focused tests. Independently verified all 34 new indexed evidence files, totaling 110,931 bytes, and index SHA256 `475581fd049dc1e89337798e4cff03ab26fcace253a04f9abfe8d3e26cd48697`. All 173 prior indexed files and their three indexes also verify unchanged. Workflow, other authorities and source are unchanged; source remains clean at `463177a0971d95e112e10ed5da39c8cbaf0a4c96`.

Also verified the diagnosis's hashes and lengths for run44089985756's completed record, failed-step log and failure artifact. The ZIP contains only the stated 264-byte `bridge-failure.json`, with runner UID/GID1001, exit1 and the compound socket error. That failure reached root authentication but not the dropped child. It establishes a readable small failure-artifact route, not successful cross-UID export. The exact failed hosted socket layout remains unmeasured.

## Spec compliance

`candidate-capture-qualification.py:2085` fixes production measurement to namespace `/`, owner UID0 and logical `/var/run/docker.sock`, with no new path/owner CLI or Docker endpoint. The fixture primitive at `:2007` admits a safe real `/var/run` or exactly the root-owned `/var/run -> /run` or `../run` link leading directly to a safe real `/run`. Parent aliases, alternate link spellings and indirect chains are refused. Directory ownership/mode checks remain distinct from the normal symlink0777 representation.

The final member is held with `O_PATH|O_NOFOLLOW`, then fstat must establish an actual root-owned socket without world-write or special bits. A final socket symlink remains forbidden, including the extra alias observed locally. Held parent records, final canonical/logical device/inode/UID/GID/mode and the permitted link identity/text are rechecked before admission. Descriptor cleanup covers success and refusal. This metadata-only inspection does not connect to a daemon or broaden any source/private-artifact reader.

Root passes the measured group and complete record into the existing child context (`:2204`). After the existing descriptor closure and credential drop, the child independently remeasures the fixed endpoint under the same deadline and joins the complete record and group before source preparation or preflight/image work (`:2090`). No privileged socket descriptor is inherited. Successful bridge-context metadata includes the held measurement.

Refusals carry a bounded typed measurement with distinct predicates and available parent/link/socket observations. The 1760-byte record limit leaves room inside the existing error/control bounds. A child failure before export now preserves its real error instead of substituting a missing-metadata error. Existing exit, admission, deadline, byte-budget and workflow semantics remain intact. No new phase, retry or budget is introduced; scenarios and full OC10 requirements are unchanged.

## Quality and limits

The retained original-predicate reproduction evaluates the old production AST predicate on a real AF_UNIX socket behind `var/run -> ../run`: socket type is true while the old predicate is false, producing the expected assertion failure. It does not connect to Docker. Revised fixtures cover the relative alias, absolute alias and real-directory layouts, plus unsafe/aliased/missing/nonsocket paths and changed identity. Actual socket replacement both between measurements and during the logical/canonical join is tested; the latter also checks descriptor closure on refusal.

Focused integration tests exercise measured group/context propagation and the complete diagnostic through the ordinary runner's bounded failure record. Their substituted credential/root-call boundaries are accurately identified and do not count as privileged success. Recorded `05-covering` runs the exact focused discovery command with 57 tests: 56 passing and the same real two-identity fixture explicitly skipped. Recorded AST, whitespace and preservation checks pass. No evidenced suite was rerun during review.

Actual hosted endpoint measurements, UID1000 drop, cross-UID handoff and subsequent workload/artifact outcomes remain required. An unsupported final alias must still fail with its measured reason rather than trigger an automatic policy expansion. Run44089985756 remains failed, with image work and qualification skipped; this review does not relabel it.

Review used read-only Git/files/hash inspection and wrote only this report. No implementation/source/index edits, subagents, privileged tests, builds, Docker or network. Observed free space: 9,028,648,960 bytes, above the 8GiB floor.
