# Task4b fix5 scoped re-review

**R4-1: ADDRESSED. SpecCompliance: PASS. Quality: APPROVE.** No new Critical or Important finding in the owned test diff. This closes the sole finding in the host-access implementation review; production driver policy is unchanged. Actual privileged and hosted validation remain separate gates.

## Scope and identity

Reviewed the fix5 brief, previous R4-1 finding, canonical report's Fix5 section, retained command results and the exact owned-file change from reviewed `5e066e55e9d4ee2fc0090b848d00761414525aec` to `1243d59531541ab1117539d37a48a1675fe318e0`. Only `scripts/numeric/tests/test_candidate_capture_qualification.py` belongs to this review. Intervening constructive compiler, evidence and documentation changes are excluded; no assessment of those changes is implied.

The supplied review package is9,156 bytes, SHA256 `20816cfae074250866b408ccd286dfecc29f9ea6c38e6fd080577ccc182eeedd`. Its patch body equals the filtered `git diff -U10` for the reviewed test file; surrounding commit summary and scope note are explanatory package text. The committed test file equals the tested preservation-proof and reviewed working bytes, SHA256 `3d5e74caa9b7fd63304a6b82a2dd7d0f5e538f49c5d75939f25755ff2fb97e97`. Production driver and qualification workflow are byte-for-byte unchanged from5e066e55.

## Finding disposition

The five public runner-owned game leaves now receive0644. Public game directories receive explicit0755, implementing the parent's fixture-only ruling for the actual umask077 case. Source leaves remain0400, the private source directory0700 and restricted runner ancestor0750. These changes affect disposable test objects, not production filesystem permissions.

The privileged fixture and new unprivileged regression share `prepare_restricted_ancestor`. The latter records the helper's proposed chowns, measures real fixture modes and ACL state with the production path-measurement helper, then substitutes only the planned owners into those measured rows. It verifies the complete intended ownership/path inventory, exact public/private modes, no-group denial only at the restricted ancestor, conditional selection of GID1001 and `actual == null`. Each public leaf independently reverted to0400 and the ancestor reverted to0700 is refused at the expected path. This makes the original fixture contradiction visible without executing a privileged test.

The actual privileged test retains its unchanged skip condition, no-group kernel read failure, group-enabled child read and plan recheck, owner-only0700 refusal, expected private bytes and final private-leaf identity/owner/mode/size comparison. The repaired public game modes remove the deterministic pre-child denial identified in R4-1. Neither static inspection nor the planned-mode regression proves that the privileged test has run.

## Evidence and limits

Independently verified all32 fix5 indexed files, totaling394,856 bytes, and index SHA256 `1a181dcf0bc198463f40df0c5e56d6363222b6c8ec6fad8e2377a59d490019db`. All250 prior indexed files and their five indexes also verify unchanged.

The retained `02-public-leaf-red` is the genuine production planner refusal at `game/.git/HEAD` before the0644 correction. `03-fixture-plan-green` records the corrected planned check and privileged skip. Actual covering evidence is `04-covering-components.json` with command `python3 -B -m unittest discover -s scripts/numeric/tests -p test_candidate_capture_qualification.py -v`; full stderr records71 tests,69 passing and two explicitly skipped privileged witnesses. Recorded syntax, whitespace and preservation checks pass. No tests were rerun for this review.

The planned test is accurately described as planned ownership plus real modes. Actual two-identity drop/read/export, hosted access layout and full SDK qualification remain unproved. No additional out-of-scope finding was introduced; unrelated compiler work remains outside this verdict.

Review used read-only file/Git/hash inspection and wrote only this report. No implementation/source/index changes, subagents, privileged tests, builds, Docker or network. Source remains clean463177a; observed free space8,983,805,952 bytes, above8GiB.
