# Scoped backport harness retention re-review

Reviewed `backport-harness-fix-review.diff` for implementation `6b5edda..78b1ecc`, with `backport-harness-fix-report.md` (report commit `263830a`). Scope is the prior sole P1 finding and new breakage introduced by this fix only. No source edits, test reruns or subagents.

**Prior P1: ADDRESSED.** The UID1000 EXIT finalizer now archives the entire private `projects` subtree before exiting, preserving hidden evidence, JSON/stderr siblings, file bytes, symlinks and modes inside the archive. It publishes the archive only after successful tar/chmod/rename, explicitly makes it mode0644, and leaves the raw evidence unchanged. The host artifact collector selects explicit readable files, including the archive and archive log, without selecting or descending into the private raw project directory.

**Spec compliance: PASS for this scoped fix.** Archiving runs on both normal and error exits; identity-check failure does not bypass it. Archive errors fail an otherwise successful run, while an earlier nonzero exit remains authoritative. Status-write failure also preserves an earlier failure. The original SDK/environment/acquisition requirements are unchanged by this diff.

**Quality: APPROVE for this scoped fix.** No new concrete findings. The finalizer's conditional command group correctly collects tar/chmod/rename/redirection failure without allowing `errexit` to skip final status handling. The explicit upload file list avoids the uploader's implicit directory recursion.

The supplied local evidence reports seven passing focused retention tests exercising actual archive contents/modes and failure propagation, passing Bash/Python/YAML and diff checks, and the pinned uploader's actual `@actions/glob` implementation selecting all21 explicit files with zero private-directory reads. Its broad-directory negative control raises EACCES as expected. These are local retention/syntax/glob results, not SDK runtime results. The focused tests use UID1000; real host UID1001 access was inferred from mode0644 plus parent mode0755, with private traversal simulated through injected EACCES.

Actual unchanged-d6 SDK acquisition with the same rebuilt verifier and genuine retained-reader replay remains **pending CI**. This approval resolves the evidence-retention review issue only and does not claim SDK/product qualification or production admission.
