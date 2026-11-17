# Harness round3 scoped re-review

Reviewed `backport-harness-round3-review.diff` (`e322c19..c0e6a64`) against the two findings in `backport-harness-round2-review.md`, and read the round3 appendix in `backport-harness-round2-report.md`. Scope is those fixes and new breakage in their three-file diff only. No implementation edits, agents, commits, pushes or repeated test runs.

**P1 download layout: ADDRESSED.** The recovery workflow now sets `merge-multiple: true` for the already validated sole fixed artifact ID. The pinned download action therefore selects `original/` as its destination, matching both the tar-reader path and historical log-source directory. Fixed run/ID/API checks and the honest ZIP digest limitation remain unchanged. The report's direct check of the pinned action destination expression with parsed workflow inputs confirms the corrected path and the old nested-path negative control.

**P2 local hardlinks: ADDRESSED.** Both local result/lock basics and selected regular reader files now require `st_nlink == 1` before reading. The added actual `os.link` controls cover result JSON, SDK lock, build input and nested verified input aliased outside the selected trees. They require failed cleanup, no complete archive, preserved original exit42 and unchanged raw evidence/link counts. Existing streaming-tar hardlink refusal is unchanged.

**Spec compliance: PASS for this scoped fix.** Both previously reported findings are resolved, with the prior bounds, completeness labeling, private-project upload isolation and failure-status behavior preserved.

**Quality: APPROVE for this scoped fix.** No new concrete findings in the diff. The changes are narrow and their regression controls address the observed failures directly.

The supplied evidence records a failing pre-fix regression,20 passing post-fix focused tests, passing syntax/diff checks, and the actual pinned upload glob's30 selections without private-project reads. Those are local checks, not actual SDK or historical recovery execution. Hosted cross-UID sharing, fixed artifact download/recovery, historical final status/identity/authority-control results and new SDK execution remain pending. The original retained-reader marker alone does not establish final success. This approval covers diagnostic harness repairs only and grants no SDK/product qualification or production admission.
