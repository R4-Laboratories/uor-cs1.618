# Numeric export repair evidence

This directory separates a reproduced numerical limitation, a compiler eligibility repair and release acceptance. It does **not** contain a replacement game math engine or a complete IEEE floating-point implementation.

Start with the [stable research tracker](../NUMERIC-EXPORT-TRACKER.md) and [machine-readable repair register](numeric-export-issues.json). The confirmed model uses intermediates wider than the production target's checked u64 naturals. Compiled native/Wasm multiplication reports `Overflow`; the repair conservatively refuses unsupported floating-point closures before certification.

## Current reviewed candidate

- Base `b04af3550bb49c4e5bfdc0747a1e50cd58f13b81`; guard `46bdbc56ad99ac2bb73d6499863260a7fead9712` plus generated-register correction `0e3472ed1ff2f3fda1d010929c4f323a05576c09`; current tree `aa5082efb83d6fd38275d00aec404929fbe34d9c`.
- [Validation orchestration review](numeric-validation-review.md) and [preflight receipt](numeric-validation-review-preflight.json).
- [Current report](numeric-current-repair.md), [independent review](numeric-current-review.md), [current patch](numeric-export-current.patch), [custody manifest](validation-manifest.json).
- Fixes both fresh certification and reuse of already certified float artifacts. The latter was independently reproduced before repair; safe reuse remains tested.
- 233 library, 12 CLI and 16 repository-conformance tests passed in the cached diagnostic SDK. All six universal policy-file hashes match; no locks or acceptance gates changed.
- [Manual GitHub validation](../NUMERIC-VALIDATION-WORKFLOW.md) compares baseline and candidate using upstream's full unchanged `just vv` in exact SDK `c1bfe8d5…`, then runs a separate primitive export/native/Wasm probe. [Workflow results](https://github.com/R4-Laboratories/uor-cs1.618/actions/workflows/numeric-export-validation.yml) supply the remote acceptance verdict; it was pending when this candidate was recorded.

The initial report/review retain their original candidate identities. Their patch is archived as [numeric-export-before-register.patch](numeric-export-before-register.patch), SHA-256 `135bc1e6c6bc2f8aebf169c3c3fcff729a268862e548d368c8e0b1867eb4fa40`. The current two-commit patch has SHA-256 `05a866911f5c6386ccf6665cb178471e039cae6a2da1b84a27033491affa33e3`.

[First exact-SDK run](https://github.com/R4-Laboratories/uor-cs1.618/actions/runs/43919280445): unchanged baseline passed full `just vv`; candidate passed its 233 library/12 CLI tests but failed stale generated `frontier.toml`. The [generated-register repair](register-repair/register-repair.md) changes five generated lines, preserving all 1,488 classifications and 341 lifted rows. The exact failed UE-16 test passes locally; a cached-SDK self-model diagnostic still rejects that different toolchain. [Independent addendum](register-repair/numeric-current-review-addendum.md) approves the revised patch/tree for another full exact-SDK run. No gate or lock was changed; candidate release acceptance is still pending.

## Historical reproduction

- [Repair report](numeric-export-repair.md), [independent review](numeric-export-review.md), [patch](numeric-export-eligibility.patch).
- Historical [issue register](historical-issues.json).
- Base: UORust `9d1f379676aa1099c4b88093608a37a66ba819f6`; candidate commits `bee4de1e77f6e15e91f36a04a779ae17cf748632` and test refinement `8716a9ce29e30bea96ee451cb16483b89b028ae2`.
- [Diagnostic SDK mismatch](numeric-export-evidence/sdk-inventory-diff.json), [exact image availability](numeric-export-evidence/sdk-registry-availability.json), [upstream CI availability](numeric-export-evidence/sdk-ci-availability.json).
- 147 library, 12 CLI and 4 BDD meta-gate tests passed using the cached game SDK. This is diagnostic evidence, not exact-UORust-SDK release acceptance.

A subsequent gate-fidelity check found that this historical patch modifies byte-bound `VERIFICATION.md`. It is retained as reproduction history, **not a release-ready patch**. The current-upstream port moves that evidence into project-owned documentation and preserves universal policy files. No upstream patch has been merged or released.

## Boundaries

Observed intermediate sizes are examples, not universal maximum proofs. Full float-root export/replay, bounded wide arithmetic, IEEE edge-case coverage, CPU/GPU parity and performance remain open. The game retains its existing engine, guests and pins. The required acceptance gate is upstream's complete `just vv` in its exact SDK; neither unit tests nor a manual orchestration check substitutes for it.
