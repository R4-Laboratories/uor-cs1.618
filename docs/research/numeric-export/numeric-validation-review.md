# Scoped numeric-validation orchestration review

2026-11-16. **Spec/quality verdict: APPROVE. No blocking findings.** Scope is the new manual workflow, Python custody/runner, targeted tests, dispatch documentation and their final current-candidate binding. The previous game review and separately reviewed UORust guard are not repeated. No product code was edited, no subagents were used, and no remote workflow, Docker gate or publication was performed by this reviewer.

Reviewed source identities (SHA-256):

- `scripts/validate-numeric-export.py`: `e720c4a6f6eb77279968ea0947ed816fbdb7c85b6dfe4165970036f4e68e21a9`
- `.github/workflows/numeric-export-validation.yml`: `9df8a02bce3bd0a83c413c17aa84835e2163564ebb1f172ecaa033c6dd4cdc08`
- `scripts/tests/test_numeric_export_validation.py`: `a9c799fecd62eadb0f39eb8c4ff2d6aca90737e5e560d2ab56fe0f48861353da`

## Immutable candidate and full-gate fidelity

Final dispatch files are `docs/research/numeric-export/validation-manifest.json` and `numeric-export-current.patch`. Independent byte comparisons confirm they match the supplied current candidate, rather than the historical patch. Base is `b04af3550bb49c4e5bfdc0747a1e50cd58f13b81`; reviewed candidate commit is `46bdbc56ad99ac2bb73d6499863260a7fead9712`; tree is `80dcc02ddd30b4e44788189ed81bac2c3d4db80f`; patch SHA-256 is `135bc1e6c6bc2f8aebf169c3c3fcff729a268862e548d368c8e0b1867eb4fa40`. The manifest selects exact SDK digest `c1bfe8d5d3b3473a2c2ca6fdd417158a3e9f5fff3b24dcbf587fe21d6fd9b635`.

The manual-only workflow has no dispatch inputs, read-only contents permission, exact-event game checkout, fixed upstream repository, full-commit action pins, disabled persisted credentials and no automatic promotion. Independent baseline/patched amd64 jobs retain 45-minute limits and `fail-fast: false`. Native arm64 execution is not claimed.

The runner validates the full base and candidate tree, patch/bootstrap/SDK-lock hashes, immutable image, exact allowed changed paths, protected gates/locks and every template policy-file hash. It repeats policy custody after mailbox application. I independently ran real baseline and patched `prepare` paths in disposable local clones. Both passed, and the patched tree exactly matched the reviewed tree. Independently parsing the original bootstrap YAML confirmed the extracted script equals its literal run block byte-for-byte; its SHA-256 is `9c5fd7a3e422d2ac6f41e7398e61b24601cd3f1c79f7499a4c967192cfc35f73`. The unchanged block retains original Docker/buildx/devcontainer checks and `exec just vv`; it is not a reconstructed reduced gate. Both receipts correctly remained preflight-only. Details are in `numeric-validation-review-preflight.json` beside this review.

## Input, state and failure handling

Manifest values come from reviewed repository content, not workflow inputs. Full hexadecimal IDs/digests and fixed registry/image grammar prevent metadata-output injection. Python subprocess calls use argument arrays; workflow path variables are quoted; paths reject traversal, whitespace, Git metadata and protected gate locations. The only executed shell gate is extracted from the already byte-verified upstream workflow. Symlink/submodule additions and candidate-tree drift are refused. The manifest is a review binding, not a claim of independent cryptographic attestation.

Fresh preparation refuses wrong origin/base, tracked or untracked dirt, and ignored stale outputs. It does not silently reset or reuse a failed checkout. Hash and policy checks fail closed. Nonzero bootstrap status propagates through Python and the workflow's pipefail/tee path. Preflight cannot claim gate success; returned gate status is recorded separately, and timeout/cancellation can leave only partial evidence. Always-upload retains available logs without implying a forcibly lost runner can upload artifacts.

The added primitive step runs only after a successful matching patched full-gate receipt. It rechecks candidate tree, tracked content, patch and policy custody, requires an already installed Wasm target, and invokes the existing portable probe in the same digest-pinned SDK. It installs no substitute toolchain. Mounted scratch storage retains outputs; the primitive receipt remains separate and never rewrites a successful or failed full-gate verdict. A later probe failure remains visible. This is bounded multiplication-primitive evidence, not a full IEEE-root export or a replacement for `just vv`.

## Grounded validation and remaining limit

Inspected the implementer's 18 passing targeted custody tests and syntax/manual-workflow receipts. The fixtures cover multi-commit application, baseline preservation, wrong base/origin/tree, dirty and ignored source, stale patch/bootstrap/lock hashes, image changes, protected/policy paths, traversal, mutable identifiers, changed bootstrap shape and refusal to probe a preflight-only receipt. I did not redundantly rerun that synthetic suite; the independent real-candidate baseline/patched preparation above addresses the final artifact and extraction boundary directly. Public `metadata` execution also returned the exact expected base.

No actionable severity/file/line/reproduction finding remains. This approves the reviewed orchestration and exact candidate binding for the planned manual validation. Actual pinned-SDK full `just vv`, the end-to-end primitive wrapper, remote resource limits and release acceptance remain unproven until those runs complete. Preserve their exact statuses and compare baseline/candidate failures before attributing a regression.
