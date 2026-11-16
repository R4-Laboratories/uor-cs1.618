# Numeric export repair evidence

This directory separates a reproduced numerical limitation, a compiler eligibility repair and release acceptance. It does **not** contain a replacement game math engine or a complete IEEE floating-point implementation.

Start with the [stable research tracker](../NUMERIC-EXPORT-TRACKER.md) and [machine-readable repair register](numeric-export-issues.json). The confirmed model uses intermediates wider than the production target's checked u64 naturals. Compiled native/Wasm multiplication reports `Overflow`; the repair conservatively refuses unsupported floating-point closures before certification.

## Current reviewed candidate

- Base `b04af3550bb49c4e5bfdc0747a1e50cd58f13b81`; repair `46bdbc56ad99ac2bb73d6499863260a7fead9712`; tree `80dcc02ddd30b4e44788189ed81bac2c3d4db80f`.
- [Validation orchestration review](numeric-validation-review.md) and [preflight receipt](numeric-validation-review-preflight.json).
- [Current report](numeric-current-repair.md), [independent review](numeric-current-review.md), [current patch](numeric-export-current.patch), [custody manifest](validation-manifest.json).
- Fixes both fresh certification and reuse of already certified float artifacts. The latter was independently reproduced before repair; safe reuse remains tested.
- 233 library, 12 CLI and 16 repository-conformance tests passed in the cached diagnostic SDK. All six universal policy-file hashes match; no locks or acceptance gates changed.
- [Manual GitHub validation](../NUMERIC-VALIDATION-WORKFLOW.md) compares baseline and candidate using upstream's full unchanged `just vv` in exact SDK `c1bfe8d5…`, then runs a separate primitive export/native/Wasm probe. [Workflow results](https://github.com/R4-Laboratories/uor-cs1.618/actions/workflows/numeric-export-validation.yml) supply the remote acceptance verdict; it was pending when this candidate was recorded.

The current report retains the scratch filenames for provenance. Its `numeric-current-repair.patch` is published here as `numeric-export-current.patch`, with identical SHA-256 `135bc1e6c6bc2f8aebf169c3c3fcff729a268862e548d368c8e0b1867eb4fa40`.

## Historical reproduction

- [Repair report](numeric-export-repair.md), [independent review](numeric-export-review.md), [patch](numeric-export-eligibility.patch).
- Historical [issue register](historical-issues.json).
- Base: UORust `9d1f379676aa1099c4b88093608a37a66ba819f6`; candidate commits `bee4de1e77f6e15e91f36a04a779ae17cf748632` and test refinement `8716a9ce29e30bea96ee451cb16483b89b028ae2`.
- [Diagnostic SDK mismatch](numeric-export-evidence/sdk-inventory-diff.json), [exact image availability](numeric-export-evidence/sdk-registry-availability.json), [upstream CI availability](numeric-export-evidence/sdk-ci-availability.json).
- 147 library, 12 CLI and 4 BDD meta-gate tests passed using the cached game SDK. This is diagnostic evidence, not exact-UORust-SDK release acceptance.

A subsequent gate-fidelity check found that this historical patch modifies byte-bound `VERIFICATION.md`. It is retained as reproduction history, **not a release-ready patch**. The current-upstream port moves that evidence into project-owned documentation and preserves universal policy files. No upstream patch has been merged or released.

## Boundaries

Observed intermediate sizes are examples, not universal maximum proofs. Full float-root export/replay, bounded wide arithmetic, IEEE edge-case coverage, CPU/GPU parity and performance remain open. The game retains its existing engine, guests and pins. The required acceptance gate is upstream's complete `just vv` in its exact SDK; neither unit tests nor a manual orchestration check substitutes for it.
