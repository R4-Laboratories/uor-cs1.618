# Task2c-B2B canonical packaging review

Reviewed `c0c1dc1..d7e2ac9`, the supplied 17-file diff, both canonical packaging briefs, and the checkpoint report. This is a static review of readiness to publish the diagnostic workflow. No subagents, builds, Docker pulls, or previously reported tests were run. The initial diff output was truncated; only its omitted segments were recovered. Exact PrismPM `2a31ad07fd0b3ea0ef63f22f165d98e310eb89ec` interfaces were inspected for the concrete build/verification identity and exporter-owner compatibility questions raised by selection.

## Verdicts

- **Spec compliance: changes requested for the initial checkpoint.** The package/staging/selection/ABI scope is consistent with the brief, but original replay failure evidence is not reliably retained when the primary archive is refused. Actual unchanged-SDK outputs, full relevant proof/custody evidence, exact actual-package corpus replay, and real reader mutation controls remain pending, honestly documented requirements; this review does not promote component evidence into those claims.
- **Code quality: changes requested.** One P2 retention issue below should be fixed before publishing/running this diagnostic workflow. No additional arithmetic, SDK-pin, selector-interface, or failure-status blocker was identified in the reviewed diff.

## Finding

**P2 — Preserve replay diagnostics in the independent fallback archive.**

`scripts/numeric/canonical/packages.py:236` excludes the entire `replay` directory when collecting `canonical-small-logs.tar.gz`. However, `replay.py` writes the actual compiler/native/Wasm/mutation command output and each command's exit-status JSON inside that directory. Its top-level redirected `replay.log` generally contains only a traceback such as `unexpected replay command status: mul32-native.log`, rather than the underlying rustc or runtime diagnostic.

If the full reader archive exceeds either retention bound, `retain` deletes/refuses it. The workflow then uploads the small-log archive and retention status, but the original failing replay command's output, argv, and recorded exit status are absent from both. Thus a replay failure combined with bounded reader retention loses the original failure evidence, contrary to the brief's retention requirement and the report's claim that independent diagnostics retain every log tail. This affects failed diagnostic runs, without implying successful arithmetic was accepted incorrectly.

Include bounded tails of replay logs and their command-status JSON in the independent diagnostic collector, while continuing to exclude replay binaries/rlibs and caches. Keep original sizes/digests and truncation labels. Add a focused retention control with a failing replay log/status and a forced primary-archive bound refusal; assert that the independent archive still contains the original failure diagnostics and status.

## Scope checks and remaining gates

The diff adds four descriptors and deterministic staging from pinned fixture inputs and the single unchanged kernel source. Exports include the actual raw operation and a zero-argument Option-matching finite acceptance root. Original d6 remains pinned; the separate verifier is invoked by absolute path with the closed `numeric-task2c` selection. Result IDs select the build/verified trees, and selected acquisition/child bindings match the inspected upstream native-library interface. The dedicated collector covers four projects and labels incomplete evidence. The direct-Option ABI returns a failure status and preserves the previous result; generated kernel bytes are not edited. No handwritten Lean/arithmetic, relaxed timeout/guard, error-to-zero workaround, native-library Holo qualification, or game/render integration was introduced by this diff.

The report correctly separates local component checks from actual CLI verification and records the original 300-second runtime failure. Full source verification/audit, actual d6 std/no_std regeneration and acceptance, newly emitted artifact replay, complete actual custody evidence, independent actual bundle-reader source/root/archive/child/output controls, and applicable upstream validation are still required later. Their absence is not misreported as success and is not an additional blocker to this explicitly diagnostic preparation checkpoint.

## Scoped re-review: retention fix 1

Reviewed the supplied packaging fix diff `d7e2ac9..1ed62ea`, including the appended implementation evidence report. The unrelated parent evidence commits listed in its summary are outside this scoped re-review. No subagents, duplicate tests, builds, or Docker pulls were used.

**P2 finding: ADDRESSED.** The independent small collector now includes direct `replay/*.log` and `replay/*.status.json` files. They pass through the existing bounded-tail collection and original digest/size/truncation accounting, before the primary archive can be refused or deleted. Replay binaries, rlibs, and nested cache trees remain excluded from the fallback archive. Therefore the original failing command output and command-status JSON survive either primary archive bound refusal.

The added focused control exercises both `MAX_RAW` and `MAX_ARCHIVE` refusal, examines the independent archive contents, compares the exact retained failing diagnostic tail and argv/exit-status JSON, verifies accounting, and excludes Wasm/rlib/cache artifacts. The implementation report records the red reproduction, green focused check, eight passing host tests, Python compilation, and whitespace checks; these were reviewed as reported evidence and were not rerun.

**Fix-diff new breakage: none identified.** The change is limited to fallback retention and its regression control; it does not change package selection, arithmetic, generated code, SDK/source pins, ABI behavior, verification gates, guards, or timeouts.

**Static spec-compliance verdict: approved for diagnostic publication/launch. Code-quality verdict: approved for diagnostic publication/launch.** The sole initial review blocker is closed. These approvals cover static workflow readiness only. Actual unchanged-SDK package verification and artifact/corpus/custody evidence, real reader mutation controls, applicable full upstream validation, and production admission remain pending requirements; no pass for them is inferred here.
