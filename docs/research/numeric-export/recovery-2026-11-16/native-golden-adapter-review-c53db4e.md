# Native golden adapter independent review

Reviewed 2026-11-17. Requirements were read before implementation: `task-1-brief.md`, `docs/superpowers/plans/2026-11-16-native-golden-game-adapter.md`, and the accepted reconnaissance. Then reviewed the implementation report, supplied diff, actual seven added files, fixed source owner/output writers, and indexed evidence.

Game BASE `eaea716dbd88da8165b6ad2a66c270ca51251df8`; HEAD `c53db4e4b91a2c6577be6e331dc3fe1372650826`; tree `90a2c69977b37fd73db17551c310f9c705a5ea72`. Native source remains fixed at `881df278923ff271fc179703e55ea91c45f2394d`, tree `ee7196f70cb948fec6b9aa85ed1b61eb50c73ea4`. Observed current source HEAD `f8808ad717a1582cd39d8c01bc452519a112afdd` is a separate identity.

## Verdicts

- **SpecCompliance: CHANGES REQUIRED.** The collector rejects the unchanged owner's genuine generated-product layout and does not reject deletion of a trailing original command record plus its streams. These prevent the promised complete-original-evidence contract from being met.
- **Quality: CHANGES REQUIRED.** The code preserves the intended identity, custody, and fail-closed boundaries, but the product fixture models a layout the real owner does not emit, and command-file completeness lacks an independently expected endpoint. Fix the findings and independently review focused regressions before push/launch.

## Ranked findings

### P1 — Real owner output is rejected because manifests are sought above their content-ID directories

**Location:** `scripts/numeric/native-golden-preparation.py:320`; fixture origin `scripts/numeric/tests/test_native_golden_preparation.py:87`.

The collector unconditionally requires `generated/build/manifest.json` and `generated/verified/manifest.json`. At the fixed source revision, `xtask/src/main.rs:1370` selects `.prism/build/<build_id>` and `xtask/src/main.rs:1372` selects `.prism/verified/<attestation_id>`. The actual publishers likewise write beneath those identities (`crates/prismpm/src/controller/mod.rs:1144` and `crates/prismpm/src/verification.rs:2274`). The unchanged native owner copies every file relative to the **parent** `.prism/build` or `.prism/verified` tree at `scripts/native-golden.mjs:507`, preserving the ID directory in `generated/<kind>/<id>/...`. Thus a successful real generation fails collection before its full product inventory can be checked.

The structural fixture instead places manifests directly at both generated tree roots, hiding this incompatibility. A targeted read-only review experiment used that fixture, moved each source and retained manifest into a matching 64-hex identity directory, and called collection. Result:

```text
status: incomplete
error: [Errno 2] No such file or directory: '.../owner/generated/build/manifest.json'
```

**Required correction:** Follow the actual fixed owner's nested layout and bind selected build/attestation identities to the original raw golden record without changing or normalizing that record. Preserve whole-tree byte equality, traversal bounds, and all other original products. Add a fixture grounded in the actual writer layout and regressions for missing/wrong nested products. Do not flatten or modify the source owner to satisfy the adapter.

### P2 — Removing the final command record and both streams still qualifies as complete

**Location:** `scripts/numeric/native-golden-preparation.py:331`, `scripts/numeric/native-golden-preparation.py:351`.

The expected command sequence is derived solely from the command files that remain. Removing an interior entry exposes a gap, but removing the last `.command.json`, `.stdout`, and `.stderr` leaves a contiguous prefix and makes `expected_files == observed_files` still pass. The two golden commands are earlier than final authenticated cleanup, so their presence does not establish that the owner transcript is complete. The original owner always records final actor inspection, removal, and absence inspections (`scripts/native-golden.mjs:294` and `scripts/native-golden.mjs:503`). Missing those original results must not receive the complete label.

A targeted structural experiment appended the source owner's four-command cleanup shape to the existing fixture: authenticated `inspect`, `rm --force --volumes`, absent CID inspection, and absent actor-name inspection, with original-style results/streams. Collection returned `complete-review-required`. Deleting the final `007.command.json`, `007.stdout`, and `007.stderr` still returned:

```text
status: complete-review-required
error: null
```

This is a diagnostic-completeness defect, not a claim that a baseline has been accepted. It directly contradicts the required rejection of missing original command evidence.

**Required correction:** Establish the unchanged owner's mandatory completion/cleanup transcript and expected endpoint independently of the remaining filenames, including actor/CID joins, before granting completeness. Add suffix-deletion controls as well as the existing individual-stream/interior-gap controls. Retain original failure records and permit authentic expected absence results; do not rewrite owner records or weaken cleanup.

## Named checks and evidence

1. **Exact review target and ownership:** Confirmed HEAD/tree and exactly seven additions. The 68,788-byte supplied text diff exactly equals `git diff BASE HEAD` for the five text files it represents; SHA-256 `fff1feadb6550f8f96084bb7ff047a4d1264c5112a2d61b744bb6f43ee4a20d9`. Binary bundle and large patch checked separately.
2. **Snapshot authenticity:** Actual bundle is 461,997 bytes, SHA-256 `f9669a944942a66fb5fdb8e2b1d41f6a742882760152db2719ef0578da9fc758`; patch is 9,905,045 bytes, SHA-256 `e86aa61c42e2d565d4c180ce82b47d20984897de1e5da1f7fe92240e1d4653d7`; manifest SHA-256 `987e42ed33beea79badcf6d907b28359b188e1c2fc8876fd7b7c5faff377c468`. Patch bytes exactly equal the fixed base-to-source binary/full-index/no-renames Git diff. Read-only `git bundle verify` passed, with the exact base prerequisite and `numeric-export-backport` ref at source881. Original commit bytes equal the retained original-commit evidence and hash to source881; its tree equals the fixed tree.
3. **Original-owner continuity:** All six exact source inputs at source881 are byte-identical to current source HEAD: native owner, tests, workflow, observer, and both environment locks. The immutable game restoration helper hash is `90b1fe176eaa8eebb4eb6648363308b512d9ebfd649ca010d429eebc8379450d`. No moving-source relabeling or source edits occurred. Historical game snapshots/restorer are outside the commit delta.
4. **Workflow/runtime preservation:** Both actual hosted runner labels, architecture matrix, fail-fast false, max-parallel 2, 75-minute timeout, pinned checkout/setup-node/buildx/BuildKit/artifact identities and Node 22.23.2 match the fixed source workflow. Exact helper and owner commands are observer-supervised, source revision explicit, exits propagated. Original 12 GiB plus measured image reserve, dependency/seed controls, resource/cache/command bounds, and cleanup remain owner-controlled. Contents-read, narrow branch/path trigger, nonroot ownership, fresh owner destination, always-stop/collect/two uploads are present. No runtime GitHub/runner identity overrides or local SDK acquisition path was introduced.
5. **Identity and source-change guards:** Actual game checkout SHA/remote/helper/workflow bytes are joined separately from source transport identity; runner/profile and owner run/attempt joins are checked. Reviewed the separate staged and unstaged `--no-renames` inventories and untracked guard, plus genuine Git rename/cancelled-staging/index-preservation controls. Read-only Git environment disables optional locks and ambient redirection. Before/after six-input and immutable-restorer checks are retained.
6. **Closed envelope and failure behavior:** Fixed envelope fields, incomplete initialization, atomic public-status reset, bounded error, null optional runner-image labels, duplicate-field rejection, bounded regular-file traversal, raw-record hashes and source byte equality, observer stop/gate/log joins, failure exit retention, and whole generated-tree comparison are present. Findings above remain exceptions to the completeness claim.
7. **Existing test evidence authenticated, not rerun:** Evidence index SHA-256 `29e0034f0be3d1241b19d1eff00cd43d399b98d1bd0fb854f7a4720c74a1817c`; all 13 indexed entries verified by exact size/hash, totaling 8,699 bytes. Read final authenticated focused output (21 tests, OK, no skips), affected restoration output (25 tests, OK), and workflow/source verification output (YAML and seven shell blocks). These passing suites were not repeated. The two targeted structural experiments above address concrete newly found gaps; neither performs native generation.
8. **Workspace/resource preservation:** Source remained clean at f8808ad7. Observed free space 9,596,850,176 bytes, above 8,589,934,592. No source mutation, build, Docker operation, SDK pull, push, or sub-agent use. This review writes only its requested report; unrelated working documentation is untouched.

## Remaining hosted limits

This review authenticates source transport and assesses implementation; it does not qualify either native lane. After corrections and independent re-review, both real hosted runs still must complete, artifact sizes/hashes and extracted inventories must be independently checked, and all six original raw records/products reviewed before byte-identical import. Cancellation, runner timeout/resource refusal, owner cleanup failure, or upload-service failure can leave incomplete evidence. Later capture-reader revisions must not relabel the source881 run; generator/owner/shared-baseline continuity must be checked before any later import. No baseline, SDK, game, source-free, or publication acceptance is granted.
