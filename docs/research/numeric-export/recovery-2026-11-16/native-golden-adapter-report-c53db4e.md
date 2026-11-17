# Native golden game adapter Task 1 report

Status: DONE; implementation complete, awaiting the controller's independent review before any push or native launch.

## Commits and ownership

- Task implementation: `c53db4e4b91a2c6577be6e331dc3fe1372650826`.
- Resulting game tree: `90a2c69977b37fd73db17551c310f9c705a5ea72`.
- Immediate commit parent: `eaea716dbd88da8165b6ad2a66c270ca51251df8` (controller documentation commits advanced the original task BASE `e76edc69e17f4a284afb41c116076b2c0a122be5`).
- Commit used explicit `git commit --only` with exactly the seven owned workflow/helper/test/snapshot paths. Unrelated untracked `docs/research/numeric-export/recovery-2026-11-16/working/` remains untouched. No push, PR, launch, Docker operation, SDK acquisition, native generation or publication occurred.
- Briefly paused at the controller's request while the sole source implementer repaired the separate capture reader. Resumed only after authorization. The later source HEAD was never substituted for the frozen native source.

## Exact source capture and restoration

Standalone directory: `scripts/numeric/prismpm-native-candidate`.

- Authority: `https://github.com/UOR-Foundation/prismpm`.
- Base: `3666dc0f9da56fcf066d96ec01cd9e14ec9a2974`.
- Fixed reviewed source: `881df278923ff271fc179703e55ea91c45f2394d`.
- Fixed reviewed tree: `ee7196f70cb948fec6b9aa85ed1b61eb50c73ea4`.
- Bundle SHA-256: `f9669a944942a66fb5fdb8e2b1d41f6a742882760152db2719ef0578da9fc758`.
- Exact binary patch SHA-256: `e86aa61c42e2d565d4c180ce82b47d20984897de1e5da1f7fe92240e1d4653d7`.
- Snapshot manifest SHA-256: `987e42ed33beea79badcf6d907b28359b188e1c2fc8876fd7b7c5faff377c468`.
- Unchanged restoration helper SHA-256: `90b1fe176eaa8eebb4eb6648363308b512d9ebfd649ca010d429eebc8379450d`.

The capture used a private temporary bare Git repository with a private transport ref and read-only source object alternates. Original source refs/index/HEAD were not changed. The bundle contains the authentic original commit metadata rather than a recreated commit. The retained raw commit content hashes as Git commit `881df278923ff271fc179703e55ea91c45f2394d`; see `source-original-commit.txt` in the indexed evidence.

The authenticated restoration control uses exactly one complete disposable shared-object checkout, first at the unchanged base, then the unchanged restorer and fixed native snapshot. It verifies the exact original stdout restoration receipt, clean HEAD/tree, source input objects and native change inventories. Before/during the complete checkout it guards >=8 GiB free (plus initial 400 MiB headroom); after restoring the checkout is removed. The control snapshots the actual source HEAD/status/index before and after, using optional-lock-disabled status reads, and requires equality. At final verification actual source HEAD was `f8808ad717a1582cd39d8c01bc452519a112afdd`, clean; this is an observation, not the run's source identity. Final free space was 9,598,648,320 bytes, above 8,589,934,592 bytes. The historical shared-preparation/full-VV snapshots were not edited.

## Implementation and custody

`prepare(source:Path,snapshot:Path,evidence:Path,output:Path,lane:str)->dict` and `collect(...)->dict` are the only CLI phases, with all five operands explicit. The native destination remains absent until the unchanged native owner creates it. Sibling evidence is fresh and is initialized incomplete before the native helper can run. Genuine nonroot source ownership is checked without chown/devcontainer substitution.

The closed public `cs1618/prismpm-native-golden-orchestration/1` envelope contains exactly `schema,status,diagnostic_only,game,source,runner,inputs,commands,owner,files,error`. Initially source/owner/inputs are null and commands/files are empty. Completion is only `complete-review-required`, diagnostic_only true, with error null. Failures use `incomplete` and a control-character-free error bounded to 2048 characters. Collection atomically resets the label before reading sidecars, preventing retained prior success on retry.

Game provenance binds the actual server/repository/SHA/workflow ref/workflow SHA/event/ref/run/attempt/run URL. It checks the real game checkout HEAD, remote authority and actual executing helper/workflow bytes against the execution commit; source revision remains the fixed capture rather than the game SHA. Runner provenance binds real hosted Linux X64/amd64 or ARM64/arm64 selection and preserves unavailable ImageOS/ImageVersion as JSON null.

The six exact original inputs (owner, owner tests, source workflow, observer and both environment locks) are measured before and after, compared to captured Git blobs, with the immutable game restoration helper under a separate namespace. Commands retain exact ordered original argv, observed exit code, diagnostic path and log completeness, including available failed command observations. Complete labels require both zero exits, successful original observer stop/gate records and untruncated original logs; failures never become fake successful owner statuses.

Owner review bytes and the raw three native record bytes are not reserialized. The native review schema/status/unclaimed fields, source/run/attempt/platform/native basis, exact environment lock/OCI chain and classic/containerd image IDs are checked. The review's record hashes/lengths are compared to the actual raw owner records and the source profile. Generated build/verified products are inventoried and compared against the original source `.prism` trees, including arbitrary nonmanifest products. Contiguous numbered original command records/streams are required, with the original golden writer and unchanged readback. Authentic cleanup's expected failed `docker inspect` absence results are preserved and distinguished from command failures.

Full staged and unstaged `git diff --no-renames --name-only -z` inventories, plus untracked paths, allow only the exact three selected native record paths. Read-only Git calls disable optional index locks, external diff/textconv, fsmonitor, hooks and ambient Git redirection. No source index or object writes are used by collection. The complete owner and evidence inventories are sorted `{path,bytes,sha256}` rows, excluding only the public envelope itself. Namespaces `owner/` and `evidence/` map to the two uploaded artifact roots, which must be reviewed together.

Bounds are the original 128 MiB regular file, depth 32, 20,000 entries and 1 GiB aggregate per inventory traversal; no aliases/special files are admitted. Observer checks preserve original 8 MiB telemetry/16 KiB sample/32 MiB head/1 MiB tail bounds. Missing/extra files and required-log truncation refuse completeness. On failures all available original trees are still uploaded whole; unsafe/oversized members cannot establish a complete inventory and are not silently omitted from upload.

## Workflow invariants

- Linux hosted matrix exactly `ubuntu-24.04`/amd64 and `ubuntu-24.04-arm`/arm64; fail-fast false, max-parallel 2, 75-minute timeout.
- Narrow numeric-kernels push paths for only the new workflow/helper/test/snapshot, plus workflow_dispatch, contents-read permission.
- Exact original action pins: checkout `11d5960a326750d5838078e36cf38b85af677262`; setup-node `249970729cb0ef3589644e2896645e5dc5ba9c38`; setup-buildx `8d2750c68a42422c14e847fe6c8ac0403b4cbd6f`; upload-artifact `ea165f8d65b6e75b540449e92b4886f43607fa02`.
- Node 22.23.2; buildx v0.28.0; BuildKit `sha256:de10faf919fc71ba4eb1dd7bd6449566d012b0c9436b1c61bfee21d621b009aa`.
- Original observer start/run/stop and exact `node scripts/native-golden.mjs tests`, then `node scripts/native-golden.mjs run SOURCE_REVISION OUTPUT`, with fixed source revision passed explicitly and original command exit propagated.
- No GITHUB_*/RUNNER_* assignments, no compiler/Cargo/shell overrides, no source workflow/owner changes, no QEMU or SDK rebuild/login substitution.
- Stop, collect and both raw-owner/wrapper-observer artifact uploads always run. Complete raw trees, compression 6 and 14-day retention for both (observer retention exceeds original 7-day minimum). Artifact names bind lane, source881 and actual run/attempt.
- Exact original development index `42213da87c564d859e327ab7df2459357d674fa538050f13905caa24c352588e` and environment revision `6ebbef86a300ff4490c4c37f821e50585e211481` remain bound by source locks. Original native reserve, 22 dependency controls, 38 seed controls, resource/command/cache limits and cleanup remain entirely source-owner-controlled and unchanged.

## Test evidence

Index: `/workspace/diagnostic-tools/native-golden-adapter/index.json` (bounded file lengths and SHA-256 for every retained test log and original commit metadata). All individual evidence files are <=1 MiB.

1. RED: `python3 -m unittest discover -s scripts/numeric/tests -p test_native_golden_preparation.py` initially failed with missing adapter ImportError; retained `red.log` (exit 1). Initial green attempts exposed fixture initialization gaps, then passed 11 structural controls.
2. Refinement RED: same focused command failed the two new failure-exit retention/loaded-image identity regressions; `refinement-red.log` (exit 1). Implemented observed failure records and image/lock joins; `refinement-green.log` passed 17 controls with one authenticated-source test skipped.
3. Final focused/authenticated GREEN: `PRISMPM_TEST_SOURCE=/workspace/scratch/prismpm-numeric python3 -m unittest discover -s scripts/numeric/tests -p test_native_golden_preparation.py` — 21 tests, 6.030s, OK, no skips. `final-focused-authenticated.log` retains the authentic original restoration receipt. Real Git regressions cover staged and unstaged outside-to-native-record rename endpoints, staged outside edits cancelled in the worktree, unrelated untracked paths, unchanged index bytes and real game checkout/remote/executed-byte checks. Structural controls cover both architectures, source/game separation, wrong run/attempt/repository/architecture, stale manifest/bundle/patch/input owner/workflow/locks, absent review/products/streams/records, failed helper/owner/observer, missing/extra/aliased/oversized files, changed nonmanifest products, truncated logs, duplicate/extra preparation fields and incomplete initialization.
4. Affected immutable-restoration GREEN: `PRISMPM_TEST_SOURCE=/workspace/scratch/prismpm-numeric python3 -m unittest discover -s scripts/numeric/tests -p test_golden_preparation.py` — 25 tests, 5.308s, OK. `affected-restoration.log` includes authentic existing snapshot restoration and tampered source/base/candidate/tree/bundle/patch controls. This uses a separate disposable checkout after the other complete checkout is gone.
5. Workflow parsed as YAML; all seven run blocks passed `bash -n`. Exact runners/pins/commands/always-retention controls are included in the focused suite. `workflow-shell-and-source-verification.log` records source input byte lengths/hashes, actual source clean state and final free space. Both new Python files passed py_compile. Owned source/workflow/test/README staged diff passed `git diff --cached --check`.

## Concerns and limits

No implementation/resource/permission blocker remains. Structural fixture success and authenticated restoration are not real GitHub/native qualification. Both real hosted lanes and all six raw native records still require independent execution/review before any import. `complete-review-required` never means accepted baseline/SDK/product. Later source capture-reader commits must not relabel the fixed881 source run; independently check generator/owner/baseline continuity before a later import.

Cancellation/timeout or artifact-service failure can still interrupt final collection/upload; missing artifact evidence remains incomplete and requires another reviewed run. The unchanged native owner retains its original runtime/cleanup errors and may itself refuse hosted resource admission. No local native generation/full SDK was attempted to bypass those gates.
