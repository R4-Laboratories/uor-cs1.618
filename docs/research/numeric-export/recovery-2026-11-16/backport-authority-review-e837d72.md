# Task2c-B1 specification and code-quality review

Reviewed base `3666dc0f9da56fcf066d96ec01cd9e14ec9a2974` through head `e837d723826e3e55c45febba2900e85e29caa578`, including the separate replay correction `b9a38652bb50bc719862d196e11d6948566e7b33`.

## Verdicts

- **Specification: Changes required; exact-SDK integration Cannot Verify.** The closed dual-authority implementation follows the requested architecture in the reviewed paths, but the archive construction gate can be disabled by Python optimization (F1). The normative receipt paragraph also needs the narrow consistency correction in F2. Actual same-new-verifier original-seed/candidate acquisition and genuine retained-file replay remain pending controller CI; this review does not promote component results to those gates.
- **Code quality: Changes requested (one medium-severity provenance-construction defect).** No additional runtime source-selection, receipt-binding, snapshot/retirement or historical-reader defect was found in the scoped inspection. F1 affects the maintenance construction script, not the integrity of the currently committed archive, which was independently checked below.

## Findings

### F1 — P2 / Medium: Required provenance checks disappear under optimized Python

Location: `scripts/construct-exporter-backport.py:19` (also lines 20–21, 31–35 and 45–48; descriptor construction at lines 49–63).

All exact-HEAD/tree, clean-tree, permitted-member and independent archive-validation gates use Python `assert`. Invoking the script with `python3 -O`, or inheriting `PYTHONOPTIMIZE=1`, removes the conditions and even the Git revision/status queries. The remaining code still enumerates and archives the supplied repository's current `HEAD`, then labels the result with the hardcoded `REVISION`, `TREE`, immutable distribution commit and bundle/patch identities. A different checkout with ordinary Lean files therefore produces a self-consistent archive hash/member list but a falsely attributed compiler-source descriptor, instead of refusing it.

This violates the requested exact restored-tree construction boundary. It does not let a running verifier select arbitrary source: the compiled registry and dependency hashes still constrain runtime admission. The defect matters when reproducing or updating the registered artifacts with the supplied construction tool.

Evidence: a read-only `compile(..., optimize=0/1)` inspection of this script found 9 assertion instructions normally and 0 with optimization; `rev-parse` and `status` constants disappear from the optimized `construct` function. The script itself was not executed and no artifacts were rewritten.

Requested correction: replace the admission assertions with explicit conditional exceptions/nonzero exits that remain active under optimization, including the independent member checks. Verify refusal of a wrong revision with optimization enabled without overwriting registered artifacts.

### F2 — P3 / Low: Universal normative receipt statement still excludes the new mode

Location: `SPEC.md:1902`–1904.

The newly added normative text specifies `prismpm/exporter-acquisition/2` for candidate construction, but the immediately following existing statement says **each** exporter invocation records `/1` cold/seed provenance. Candidate execution intentionally retains `/2`, so these universal requirements conflict. Qualify the existing sentence to Released or list both closed receipt versions. This is a documentation consistency issue; the implementation's candidate `/2` choice matches the task brief.

## Requirement assessment

- Original defaults and pins: the diff preserves the original dependency revision, original archive, Rust dependency closure and SDK files. `Controller::load` defaults to Released, and explicit `released` uses the same acquisition branch. Source parsing rejects unknown IDs/paths/URLs; the CLI rejects the selector on unsupported commands. No failure-to-fallback branch was introduced.
- Registry and distribution: the two new artifacts are ordinary file rows on the existing lean4-prod dependency. Candidate distribution is attributed to the immutable game snapshot rather than afflom publication. The descriptor contains no resulting verifier/exporter hash or self-digest. DK-39 is registered across model, SPEC, feature and conformance runner.
- Acquisition: candidate construction uses current native installed inventory and parsed execution lock, binds the exact base SDK digest and lock digest, and bypasses seed adoption. The existing Released JS seed path remains unchanged. Candidate receipt validation is closed and checks registry ID/descriptor/archive/revision/toolchain/platform plus independent inventory/lock binding.
- Custody: Source is retained on Package/owner and Snapshot; GenerationContext obtains it from the snapshot. Recapture uses retained authority, and equality/source/compiler comparisons check authority before members. Selected acquisition reaches application/library and legacy module paths; selected repository archive verification retains native identity/no-follow/link checks. Initial source growth is distinguished from later compiler custody. Existing failed-execution and conservative-retirement controls remain in place.
- Generated identity: selected archive/actual child enter the stable sidecar, selected revision enters Holo provenance, and source ID/descriptor enter generator identity. No per-run receipt was inserted into generated artifacts, and no generator-lock drift bypass appears.
- Source-free reading: the current reader derives authority from retained receipt ID/descriptor, then validates archive and child. Owner/top-level executions must agree, retained native preflight must match acquisition platform, and independent SDK lock/inventory checks apply. Sidecar/Holo are bound to the selected authority. Historical application `/1` candidate evidence is explicitly refused. Production OCI consumers still use the full semantic/artifact reader with the authority check; no new public shortcut was introduced.
- No arithmetic/proof/guest/target-policy changes are in this diff. Compiler-source stage acceptance is distinct from B1 integration. No performance conclusion follows from these changes or component timings.

## Independent read-only checks performed

Read the task brief first, implementation report second, upstream AGENTS.md, relevant SPEC text and the requested source-consumer reconnaissance. Read the supplied review diff; large one-line SDK fixture data was handled by identity checking rather than treating truncated display as a byte review. Inspected surrounding code only for concrete risks: generator source propagation, first-build/failure cleanup, historical reader dispatch, production OCI reader routing, and native SDK lock/inventory validation.

A read-only archive comparison against the pinned local Git objects confirmed:

- Candidate archive SHA-256: `6963efb98d5a67a54a5a969d520f0090218115f86da1dd573b789dc027fafb52`.
- Descriptor SHA-256: `163fd02651d0c3e5116bdf1f0549b72d43ec849e66cd7d328b83cbec4fb70dc7`.
- Candidate commit tree: `747d3c5c4ed0d7984a9ebcadc665b10417e5ea84`.
- All 63 archive members match that commit's tracked `lean/` member set, bytes and modes exactly.
- Original archive SHA-256 remains `7a1a716a57040ea2307f7a34e895a75ebdca7438cf9d5d0364007acb594366bf`.
- SDK lock fixture SHA-256: `fb18f8a88756f6f3b89efe375c6611ab317beec320f986f81af92e142ac54969`.

The source worktree was clean at inspection. No source changes, suite reruns, Docker pulls, upstream pushes/PRs or subagents were used. Only this requested report was written.

## Cannot Verify / acceptance evidence still needed

1. Actual default and explicit Released acquisition using the same newly rebuilt verifier in unchanged d6 SDK, including corrupt-seed refusal with no fallback.
2. Actual candidate CLI acquisition in that SDK, selected child execution, missing/legacy/foreign-native-lock refusals, and genuine three-project source-free retained-file replay. The optional test branch at `crates/prismpm/src/release_verification/tests.rs:815` has not run according to the report. DK-39's ten named test checks do not themselves prove that optional branch executed; controller CI must require its explicit completion marker as documented.
3. Full B1 exact-SDK validation. The reported local full `cargo xtask validate` failed (75 Node failures); it is not a passing suite and was not rerun here. Reported focused component/check/Clippy successes were considered reported evidence, not independently rerun results.
4. Complete candidate OCI/product qualification is outside this B1 review and remains separately reserved. Existing sdk-seed-only product qualification is not a candidate-admission route.

The controller's reported all-31-gate exact-SDK source result for unchanged candidate `2a13f94` is acknowledged as source-stage evidence only. It does not resolve the B1 integration items above.
