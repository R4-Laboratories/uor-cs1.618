# Hosted acceptance metadata and collection follow-up

**DONE for scoped local implementation; independent review and fresh hosted runs pending.** Commit `5046be7ec57be35cf7ecd99d5b2b5db1bca678cd`, task base `f23011f9280776002233da2c63f8c23ce7405afb`. Four owned implementation/test paths changed. No source/compiler/snapshot/SDK/kernel/audit-policy changes, subagents, SDK pull, broad rebuild, hosted launch, push or upstream PR occurred. The active report stays git-ignored; controller owns durable evidence/report publication.

## Two concrete repairs

Actual canonical run `44030198670` correctly refused all four new acceptance declarations: none policy versus observed `[Quot.sound, propext]`. Following the completed diagnosis and final parent ruling, `metadata(d)` now adds only `axioms: [Quot.sound, propext]` to its authored acceptance declaration. Its cases, body, Option.none behavior, roots and numericLibrary declaration are unchanged. NumericLibrary remains none. Existing kernel/proof policies are untouched. The entire production `audit_bindings` function is byte-identical to task base (function text SHA-256 `041ef126d47194b7a41024c2fb92bffe7104e5285dc8dd3a0c56893563ff2ed5`).

Fresh staging/fmt/lock/freeze/check regenerates authored source and normal source/semantic/frozen identities; no old evidence or generated Lean/Rust was edited. The changed game generator is measured normally by existing staging and reader-source copy/custody logic: new `packages.py` SHA-256 `e590af55ee7ed482772ed4ec8fa9490f0132fd1e801a0463fabd909eff2dfa9b`. Source-owned reader/runtime and source generator pins remain unchanged.

Actual shared run `44030198874` passed its writer/checker commands but its host collector could not create `.git/index.lock` after source ownership moved to container UID1000; writing source `target/golden-preparation.patch` was likewise incompatible with that boundary. The collector now copies the **original existing index** into a private host-owned temporary directory, preserving its staged state. Only collector Git subprocesses receive that private `GIT_INDEX_FILE` and object directory, with original source objects available read-only as alternates. No fresh empty index/HEAD-only reconstruction replaces the original index. Source revision/tree and original command/log/container checks remain unchanged. The source checkout, its index/objects and target directory need no writes or ownership changes.

The collector checks staged, unstaged and untracked paths separately, including a staged outside-golden change canceled in the working tree. It creates a fresh exclusive temporary binary patch and transfers it to evidence only through the existing file/aggregate bounds. Each attempt clears any previous evidence patch first, so a failed attempt cannot reuse an old success patch. New binary files, tracked deletions and final worktree changes remain represented. Temporary index/object/patch files are retired. No workflow command, independent container identity capture, source devcontainer behavior, writer/checker command or success/completeness requirement changed.

## Exact red/green checks

Evidence root: `/workspace/diagnostic-tools/hosted-followup`. Command JSON files retain exact argv, relevant environment overrides and exit statuses; logs retain full output. `checkpoint.json`, `custody-checks.json` and `evidence-index.json` bind the commands, logs, tool/source identities and changed files. `metadata-{red,green}/lexlean-policy-commands.json` retain every real tool invocation and its stdout/stderr. All commands below ran from `/workspace/scratch/cs-numeric-kernels`.

```sh
python3 -m unittest discover -s scripts/numeric/tests -p test_golden_preparation.py
# RED before collector fix: exit1, 23 tests, errors1/failures1/skipped1.
# Actual git add-N failed exit128: .git/index.lock Permission denied.
# Separate regression: old collector missed staged outside change canceled in worktree.
# collector-red-command.json / collector-red.log
# GREEN after collector fix: exit0, 23 tests with 1 optional restoration skip.
# collector-green-command.json / collector-green.log

LEXLEAN_BIN=/workspace/diagnostic-tools/lexlean-target/release/lexlean \
PRISMPM_SOURCE=/workspace/scratch/hosted-followup-source324 \
PRISMPM_READER_SOURCE=/workspace/scratch/hosted-followup-source324 \
NUMERIC_FOLLOWUP_EVIDENCE=/workspace/diagnostic-tools/hosted-followup/metadata-red \
python3 -m unittest discover -s scripts/numeric/canonical -p test_packages.py
# RED before metadata fix: exit1, 16 tests, 4 operation subtest failures.
# Real lock/fmt/check completed; emitted acceptance had no exact pair.
# metadata-red-command.json / metadata-red.log

# Same canonical command, with NUMERIC_FOLLOWUP_EVIDENCE ending metadata-green:
# GREEN after one-line metadata fix: exit0, 16 tests passed, 0 skipped.
# metadata-green-command.json / metadata-green.log

PRISMPM_TEST_SOURCE=/workspace/scratch/hosted-followup-source324 \
python3 -m unittest discover -s scripts/numeric/tests -p test_golden_preparation.py
# Final source-enabled GREEN: exit0, 23 tests passed, 0 skipped.
# collector-green-source-enabled-command.json / collector-green-source-enabled.log

python3 -m py_compile scripts/numeric/canonical/packages.py scripts/numeric/canonical/test_packages.py scripts/numeric/golden-preparation.py scripts/numeric/tests/test_golden_preparation.py
git diff --check
# Both passed on final implementation.
```

The permission regression actually makes `.git/` and source `target/` read-only under UID1000, proves creation of both original output paths raises PermissionError, then runs collection against that same state. Green preserves the original index bytes plus inode/mode/UID/GID/mtime/ctime and all original object bytes/paths. It includes a new binary and a tracked binary deletion, rejects outside-golden writes, and confirms a failed retry removes the previous patch. Existing tests still refuse missing/failed/truncated command logs, wrong/missing/duplicate identity records, source changes, symlinks and bounds violations. The source-enabled final run also restores the immutable bundle into a fresh disposable base checkout and passes bootstrap source preflight and transport tamper controls. No live source checkout was reset.

The real LexLean regression runs normal lock/fmt/lock/fmt-check/lock-check/check and freeze on all four newly staged projects. Across **84 real CLI calls, 80 succeed and 4 intentionally malformed axiom policies are refused by the parser**. Exact acceptance policy changes the checked semantic identity compared with omitted/empty/wrong exact metadata. An explicit empty numericLibrary policy is semantically identical to its omitted none policy. Formatted source preserves the exact pair; original frozen kernel hashes survive. Well-formed wrong policies may parse/check, as designed: unchanged audit tests separately refuse omitted/wrong acceptance policies against the independently expected observed pair, missing/extra observed axioms, policy/source binding changes and nonempty numericLibrary observations. Those audit receipts are explicitly synthetic unit fixtures, not newly verified SDK receipts.

Local component tool: existing LexLean 0.4 binary `/workspace/diagnostic-tools/lexlean-target/release/lexlean`, SHA-256 `3765ef724d19a4d08681aaa0123ff637e65c1ffcc0b8d02ae268b521b5cf2c94`, compiler-semantics banner `07859acb5a756221018b7f65e7f725d99b00a694670eecc7cd264832ba1333fb`, pinned Lean toolchain v4.32.1. This was parser/formatter/check execution only; no Lean proof compile, arithmetic corpus rebuild or installed-SDK verification was run.

## Custody and remaining actual gates

The disposable fixture/reader checkout is clean source `324955b6923c1d194d7bc870a2d2a05eb687048c`, tree `7cf463121cf5dd15b681ce1dfafd5694617cc474`, restored from the unchanged preparation bundle. Live source protocol work at bb33 was not captured or modified. Preparation/accepted 2a31/compiler snapshots, SDK lock, source-owned reader pin file, arithmetic sources, fullVV/golden workflows and native/Wasm replay helpers have zero diff against task base; the checks are recorded in `custody-checks.json`. Approximately 11 GiB remains free, above the 8 GiB floor. Untracked recovery/working was untouched.

Both historical overall jobs remain failed. No success receipt or outside-golden check was reconstructed for old shared run 44030198874. Controller must launch a fresh writer/checker/collector after review, independently compare its genuine output with the original reviewed five-file proposal (`shared-golden-actual-review.md`), and review the complete new collection. Controller must likewise run fresh unchanged-SDK build/verify for all four regenerated packages and inspect actual exact acceptance/none audits, original full proof/runtime closure, two owners, regeneration/std/no_std and exact new-output native/import-freeWasm 44,648/None/status controls. Local component tests neither execute nor waive those gates, and no source-free product or production admission follows here.

## Scoped fix round 1 — rename source endpoints

Commit `b4caf774a9c2b8996c877d6ea83a9837c4abb937`, following implementation `5046be7ec57be35cf7ecd99d5b2b5db1bca678cd`. Read the full P1 finding and actual `rename-probe.json` / `rename-probe.patch` in `/workspace/diagnostic-tools/hosted-followup-review`. The probe correctly showed `complete-review-required` after a staged `outside.rs` → `tests/golden/stdlib/moved.rs`: name-only rename output exposed only the allowed destination, and the path-limited patch omitted the outside deletion.

Both staged and unstaged guard enumerations now explicitly use `git diff --no-renames --name-only -z`. They therefore see the deleted source path independently of its destination and Git rename configuration. Only the two collector/test files change. Private index/object handling, copied original staged state, source identity, patch generation/bounds/freshness, independent container/command/log checks and all previous retention gates are preserved. No acceptance metadata, source/audit/kernel, snapshot, SDK/compiler/policy or workflow change occurred in this fix.

Two new real repository regressions cover staged `git mv` and worktree movement with intent-to-add, both under explicit `diff.renames=true`. Each first confirms the original unsafe enumeration reports the destination and omits `outside.rs`; then it requires the actual collector's outside-path ValueError, incomplete result and absent patch. Both failed before the repair because the collector accepted the rename. The complete source-enabled collector suite passes after the repair, preserving all previous read-only index/target, unchanged original index/object metadata/bytes, binary/deletion, canceled staged outside change, stale-patch, completeness and immutable restoration/tamper controls.

Evidence: `/workspace/diagnostic-tools/hosted-followup-fix-1`, with exact command JSON, full red/green logs, `checkpoint.json` (including original review-probe hashes and unchanged snapshot identities), static custody logs and `evidence-index.json`.

```sh
# Cwd: /workspace/scratch/cs-numeric-kernels
python3 -m unittest discover -s scripts/numeric/tests -p test_golden_preparation.py -k outside_to_inside
# RED before --no-renames: exit1,2 tests,2 failures: ValueError not raised.
# rename-red-command.json / rename-red.log

PRISMPM_TEST_SOURCE=/workspace/scratch/hosted-followup-source324 \
python3 -m unittest discover -s scripts/numeric/tests -p test_golden_preparation.py
# GREEN after repair: exit0,25 tests passed,0 skipped,5.423 seconds.
# collector-green-command.json / collector-green.log

python3 -m py_compile scripts/numeric/golden-preparation.py scripts/numeric/tests/test_golden_preparation.py
git diff --check HEAD^ HEAD -- scripts/numeric/golden-preparation.py scripts/numeric/tests/test_golden_preparation.py
git diff --exit-code 5046be7ec57be35cf7ecd99d5b2b5db1bca678cd -- scripts/numeric/canonical/packages.py scripts/numeric/prismpm-preparation-candidate scripts/numeric/prismpm-candidate scripts/numeric/canonical/reader-source.json prism/prismpm.lock prism/numeric/src
# All exit0; protected-path diff has no output.
```

The four-operation parser/84-call metadata controls are unchanged and were not repeated. Source324 preparation remains exact and no source checkout was edited or refreshed. Historical failed jobs remain failed; no old outside-golden observation or success receipt was reconstructed. Approximately 11 GiB remains free, above the 8 GiB floor. Independent scoped re-review must precede controller-owned fresh hosted execution, proposal comparison and SDK/corpus gates. No push, SDK pull, broad rebuild or admission claim occurred.
