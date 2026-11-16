# Manual numeric validation orchestration

Status: implementation, local checks and independent final candidate custody review complete. APPROVED, no blockers. Files remain uncommitted for parent. No commit, push, remote dispatch, Docker pull or full-SDK acceptance run performed. Parent owns candidate/evidence updates and commit/publication decisions.

## Scoped files

- `.github/workflows/numeric-export-validation.yml`
- `scripts/validate-numeric-export.py`
- `scripts/tests/test_numeric_export_validation.py`
- `docs/research/NUMERIC-VALIDATION-WORKFLOW.md`

Other dirty files in the shared checkout belong to the parent/repair work and were not edited by this task. No package, version, gameplay production source, guest or upstream checkout changed here.

## Design

Manual dispatch only, no dispatch inputs, contents-read permission, exact event revision for game checkout, immutable manifest base for afflom/UORust, credentials not persisted. Both checkout and artifact upload use full commit pins. Upload v4 was resolved read-only with `git ls-remote` to `ea165f8d65b6e75b540449e92b4886f43607fa02`.

A fixed baseline/patched matrix uses independent ubuntu-24.04 runners, fail-fast false and the upstream 45-minute timeout. The baseline control remains available because historical upstream acceptance failed; it also gives a same-run comparison for the current candidate. Neither job changes the upstream gate or attempts a publication. Always-upload retains metadata errors, gate log, extracted run script and available receipt; forced runner loss cannot guarantee artifact retention.

The reviewed manifest binds schema/base/candidate_tree/patch SHA/bootstrap SHA/lock SHA/SDK image/exact changed paths. Mutable images, wrong origin/base, dirty or ignored stale files, bad hashes, protected paths, universal policy mutations, unexpected changed paths/tree, symlinks and submodules are refused. Full mailbox series applies through git am without three-way rebasing, producing local validation commit IDs and exactly the reviewed candidate tree. Source must be a disposable clean checkout; no automatic reset/destruction fallback.

All template.lock policy files are checked before and after patching. Inspection found VERIFICATION.md is byte-bound; the historical patch changed it. The current-port agent confirmed that it will preserve this policy and place evidence in docs/numeric-export.md instead. The runner also preserves Justfile, workflow/SDK/template/Cargo/toolchain locks and excludes known gate-implementation directories.

The actual byte-verified bootstrap run block is extracted without changing commands, checked with bash -n and executed from the upstream checkout. It invokes the exact lock-selected SDK and full original just vv, including upstream Docker/buildx/devcontainer checks. prepare is explicitly preflight-only. A completed full-gate receipt is produced only after actual execution returns, and nonzero status propagates through the workflow's pipefail logging pipeline. AMD64 validation does not claim native arm64 execution.

## Validation performed

- `PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s scripts/tests -p 'test_numeric_export_validation.py' > artifacts/numeric-validation-local-tests.log 2>&1`: **18 tests passed**, including a real synthetic two-commit Git mailbox, unchanged baseline, wrong base, dirty source, ignored stale output, wrong origin, patch/bootstrap/lock hashes, SDK image, changed-path set, candidate tree, protected gate/policy paths, path escape, mutable base/image wrong bootstrap layout, and refusal to run the additional primitive probe from a preflight-only receipt. These fixtures never run Docker or just vv.
- Python compile() syntax validation for runner/test source: passed.
- PyYAML BaseLoader syntax plus explicit trigger/no-input/read-only/runner/45-minute/fixed-matrix/fail-fast/always-upload/full-action-pin checks: passed. No actionlint/full GitHub execution claim.
- `bash -n` on every workflow shell block: passed.
- Extracted actual bootstrap from current base `b04af3550bb49c4e5bfdc0747a1e50cd58f13b81`: complete file SHA256 `4461275d96f70e6feda725f2226a35c5a96416300801bc82dc954e02386a7bdd`; extracted run SHA256 `9c5fd7a3e422d2ac6f41e7398e61b24601cd3f1c79f7499a4c967192cfc35f73`. Byte identity checked and bash syntax passed. Log: `artifacts/numeric-validation-syntax.log`.
- `git diff --check`: passed.

## Independent review and remaining gate

Reviewer `/root/final_stitch_game_review` approved the final orchestration and binding with no findings. Review: `.superpowers/sdd/stitch-modern/numeric-validation-review.md`; independent actual-candidate receipts: `numeric-validation-review-preflight.json` beside it. The reviewer prepared both real baseline and patched disposable clones, checked every policy/hash/path and exact candidate tree, and independently compared the extracted run block byte-for-byte with parsed upstream YAML. Both receipts remained preflight-only. These independent checks were not duplicated here.

Current dispatch files are `docs/research/numeric-export/numeric-export-current.patch` and `validation-manifest.json`; the historical `numeric-export-eligibility.patch` remains separate. Base `b04af3550bb49c4e5bfdc0747a1e50cd58f13b81`, reviewed candidate `46bdbc56ad99ac2bb73d6499863260a7fead9712`, exact tree `80dcc02ddd30b4e44788189ed81bac2c3d4db80f`, patch SHA `135bc1e6c6bc2f8aebf169c3c3fcff729a268862e548d368c8e0b1867eb4fa40`, SDK `ghcr.io/afflom/prismpm-sdk-patched@sha256:c1bfe8d5d3b3473a2c2ca6fdd417158a3e9f5fff3b24dcbf587fe21d6fd9b635`. Actual metadata CLI returned that exact base; actual patch SHA matches.

At parent's request, a separate post-full-gate primitive step was added and independently reviewed. It requires this candidate's successful full-gate receipt, rechecks tree/patch/policy, validates an already installed Wasm target and runs `bash scripts/probe-numeric-export.sh` in the same pinned SDK. No toolchain/target install or host fallback. Mounted TMPDIR preserves products and its own log/receipt; original full-gate receipt is untouched. Both share the 45-minute job limit. Inner shell syntax passed; the runtime itself remains unexecuted.

Parent owns staging/commit/remote dispatch and evidence publication. No successful full pinned-SDK acceptance or current-pin primitive runtime result is claimed from these local checks. No orchestration source edits followed approval.
