# Task4b host access implementation review

**SpecCompliance: FAIL on the required restricted-ancestor fixture support. Quality: CHANGES REQUIRED.** One Important finding below; no Critical finding or separate production-policy defect identified in this scoped review. The production permission-selection/access design otherwise follows the approved ruling. No privileged test was run, and no hosted success is inferred.

## Important finding R4-1 — the privileged positive fixture is denied before its child witness

`scripts/numeric/tests/test_candidate_capture_qualification.py:1340` expects the measured access plan to succeed after the fixture changes game ownership to1001 and source ownership to1000. However, its `filesystem()` helper creates **every** source and game leaf with mode0400 at line1150. Lines1336–1337 change owner/group only; the game `.git/HEAD`, `.git/config` and three game authorities remain1001:1001 mode0400.

The proposed UID1000 process, even with supplementary GID1001, has no read bit for those runner-owned game files. The production planner correctly selects the matching group permission class and refuses the first such required read. Therefore line1340 raises `HostAccessError(permission_denied)` before either `bridge_supervise` call at lines1351–1353. This is a deterministic fixture contradiction, not a prediction about an unmeasured hosted path or a claim that a privileged test failed here.

The new real restricted-ancestor fixture is a required part of the approved verification support. As committed, enabling it in a privileged environment cannot demonstrate the intended old-denial → conditional-group-read transition. The local skip hides this failure, while the report describes that transition as implemented fixture coverage.

**Minimal repair:** give only the fixture's public runner-owned game leaves production-appropriate readable modes, such as0644, while keeping the UID1000 private source preparation0400, its directory0700 and restricted runner ancestor0750. Preserve the no-group failure, group-enabled actual read, owner-only0700 refusal and unchanged private-leaf assertions. Check the fixture's intended owner/group/mode plan without relabelling an unprivileged check as a kernel two-identity witness. Keep actual privileged execution skipped/unproved until it is available and authorized. No production source-reader or permission-policy relaxation is needed.

## Reviewed identity and retained evidence

Reviewed commit `5e066e55e9d4ee2fc0090b848d00761414525aec`, tree `cc97d98ace3e4c6cdd62a25b04b1e80eeb3fa17d`, parent `7d746f1035abc41ad6165880cdb88ef20ce223a8`. Exactly the driver and focused tests change. The supplied review package is72,812 bytes, SHA256 `36ee2f241cbeaf42343fd67d42351f9e8c5672c0c12285b599de7dea35f6a24f`; its patch body exactly matches `git diff -U10 5e066e55^ 5e066e55`. Committed, reviewed working and preservation-proof bytes match.

Read the binding diagnosis/ruling/design contract, latest canonical report and scoped diff. Independently verified all43 new indexed files, totaling161,369 bytes, and index SHA256 `cc156bba63eb7ef56c13d2de004ae08db003aa45ab7c0ad04c01d2ba5f336894`. All207 previously indexed files and all four prior indexes also verify unchanged. An independent AST comparison confirms90 original functions unchanged; only bridge_drop, bridge_child, bridge_admission, bridge_privileged and bridge_runner change among existing functions.

Actual `08-final-components.json` records `python3 -B -m unittest discover -s scripts/numeric/tests -p test_candidate_capture_qualification.py -v`. Complete stderr reports70 tests:68 passing and two explicitly skipped privileged fixtures. The new skipped fixture is the subject of R4-1. Recorded syntax, whitespace and preservation checks pass. These recorded results were inspected, not rerun.

## Production implementation assessment

The common plan covers all six source-reading operations and preserves socket-role limits; metadata/raw guards remain control-only. Group choice uses owner/group/other precedence, includes the existing socket role in the baseline, omits unnecessary traversal authority and reevaluates every required object after considering only authenticated SUDO_GID. It correctly refuses a candidate group that removes another path's previous other-class access. Primary UID/GID1000, exact actual group checks and process-wide scope remain explicit.

Fixed-root ancestry/leaf measurement uses held no-follow identities, bounded objects, owner/mode checks and explicit ACL absence via ENODATA. Unsupported or uninspectable ACLs and owner-only/unreadable layouts refuse. The child remeasures the plan under its actual credentials, performs original source reads and fixed game Git/authority joins, then rechecks identities. Root observations do not replace child access. The runner independently reads the five fixed public build inputs before preflight admission, and later operations join the bounded readiness record.

Structured access diagnostics now survive early source-read refusal separately from the human error string. Root versus actual child identities, socket observations, permission classes, actual errno, focused denied component and explicit overflow/omission state are retained within the existing control wrappers. The recorded hosted-shaped wrapper checks and real unprivileged EACCES/readback tests are useful components; neither establishes distinct1001/1000 access. Original source current-owner/no-follow/private custody, descriptor closure, export relocation/admission, GITHUB_OUTPUT ownership and absolute phase/collection deadlines remain unchanged by this repair.

Run44092790586 still establishes only the failed early source access and readable failure artifact. Its denied ancestor and applicability of this conditional group policy remain unproved. Actual hosted preflight, source-image work, six scenarios, original OC10 and final artifacts remain separate gates after the finding is repaired and reviewed.

Review used read-only Git/files/hash/AST inspection and wrote only this report. No code/source/index edits, subagents, redundant tests, privileged operations, network, Docker or builds. Source remains clean at463177a. Observed free space8,987,643,904 bytes, above8GiB; unrelated parent/proof files were left untouched.
