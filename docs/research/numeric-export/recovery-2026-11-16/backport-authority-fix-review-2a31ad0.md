# Task2c-B1 fix round 1 review

Scope: `e837d723826e3e55c45febba2900e85e29caa578` through `2a31ad07fd0b3ea0ef63f22f165d98e310eb89ec`. Read the appended fix report and complete `backport-authority-fix-review.diff`. This is a scoped static re-review of F1/F2 and new breakage in those changes, not a repeated broad B1 review.

## Verdicts

- **Static specification verdict: PASS for the scoped corrections.** F1 and F2 are addressed. Exact-SDK B1 acceptance remains **Cannot Verify**, pending controller evidence.
- **Static code-quality verdict: APPROVE the scoped fix.** No new actionable defect was found in the fix diff.

## Finding dispositions

### F1 — ADDRESSED

`scripts/construct-exporter-backport.py` replaces all nine admission assertions with calls to an ordinary `require` function that raises `ValueError`. Python optimization does not remove these calls or their condition evaluations. Exact revision/tree, clean checkout, member type/mode/path, working bytes, and independent archive membership/bytes/modes are checked before artifact publication. The added explicit `lean/` prefix requirement is consistent with the existing source closure.

The new `scripts/construct-exporter-backport.test.mjs` exercises a byte-for-byte copy of the actual constructor against a real wrong-revision Git fixture, separately using `-O` and `PYTHONOPTIMIZE=1`. It checks the precise revision refusal, excludes timeout/process-launch failures as false positives, and compares both preexisting destination files after refusal. Copying the script preserves its relative ROOT behavior inside the temporary workspace, so this tests the actual publication destination logic without rewriting registered artifacts. The test is included in the existing xtask Node audit list.

The fix report records the requested failing-before/passing-after result, direct wrong-revision refusal with the real registered destination unchanged, and three pinned reconstruction modes producing byte-identical archive/descriptor files. Those are reported execution results; they were not rerun during this review. The explicit gate implementation and focused regression coverage resolve the original optimization defect.

### F2 — ADDRESSED

`SPEC.md:1902` now keeps `prismpm/exporter-execution/1` for both authorities while explicitly assigning acquisition `/1` cold/seed provenance to Released and `/2` source-backport provenance to the candidate. This resolves the contradictory universal `/1` statement without broadening source authority, SDK qualification or handwritten Lean exceptions.

## New-breakage assessment and evidence limits

The fix changes only constructor validation, its focused test/audit registration, and normative receipt wording. No runtime source selection, custody, reader, compiler archive/descriptor pin, SDK/guest policy pin, or arithmetic behavior changes appear in this diff. No new actionable breakage was identified.

No suites were repeated, no source files were mutated, and no subagents were used; only this requested review report was written. The reported format/model/SPEC-link/xtask checks and reconstruction results remain attributed to the implementation report.

The earlier full host validation failure remains a failure. Same-new-verifier original-seed and candidate d6 SDK acquisition, genuine retained-file replay with its explicit completion marker, full exact-SDK validation, and separately reserved product qualification remain pending. Static approval of this fix does not establish any of those execution gates.
