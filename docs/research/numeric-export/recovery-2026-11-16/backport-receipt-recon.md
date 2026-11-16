# Explicit exporter source-backport receipt reconnaissance (reconstructed)

**Recovery note, 2026-11-16:** reconstructed from retained conversation context
after the environment reset erased the original local files. This records
**pre-reset inspected source**, not a fresh post-reset source inspection. The
original report was written at
`.superpowers/sdd/numeric-kernels/backport-receipt-recon.md` and read by the
controller before the reset. The controller restored the game checkout from
pushed `b4676b7`; that recovery revision does not establish the source state
described below. This reconstruction only creates this report; no source edits,
builds, installs, commits or subagents.

The acquisition ruling in the pre-reset `task-2c-brief.md` authorized an additive
explicit mode while preserving the released SDK contract. This report proposes
changes; it does not claim they existed or passed acceptance. The implementer
acknowledged the integration map before reset and intended to preserve historical
`/1` and SDK-release-only validators while adding current source-only semantics.

## Pre-reset source identity

References below are relative to the pre-reset diagnostic source copy
`artifacts/numeric-task2c/prism-source/` unless prefixed `game:`. That directory
was **not a separate Git checkout**: `git rev-parse` resolved the enclosing game
commit `8a26b962f2363f4d08976146577f61fbd9474dc1` and must not identify PrismPM.
The SDK PrismPM revision was
`3666dc0f9da56fcf066d96ec01cd9e14ec9a2974`, recorded by
`game:scripts/prism-verifier-backport.mjs:12`; its existing verifier-only replay
backport came from `359d7f5bfa8e01272ba6028c30c94459420ebb6a`.
The authoritative compiler checkout was `/workspace/scratch/lean4-prod-numeric`,
base/HEAD observed `991956fe427bb646498fd0912c89b71be71e7beb`; its active implementer
could subsequently change it. I read its `AGENTS.md` and made no changes there.

Pre-reset measured diagnostic source SHA-256 values (not remeasured after reset):

| Input | SHA-256 |
| --- | --- |
| `crates/prismpm/src/exporter.rs` | `ac3f47c0368d319e8f38a040d9c2a7e8ddf99801a3853dec041cdf6ea17e0511` |
| `crates/prismpm/src/exporter/owner.rs` | `afbec0467776219c9dc62a48f81ceb2c5d183cfeb998f315b5d0eb7ea99aef1c` |
| `crates/prismpm/src/release_verification.rs` | `c92b0ae8e74c7d22556104cb93baf1923b98eb73718b5c13bcab1f6f3946541d` |
| `model/dependencies.toml` | `391a46a090cdf7b604f793463f7ab5a5a3ecd185eef5c6d72435679b71dc7062` |
| `vendor/lean4-prod/lean.tar` | `7a1a716a57040ea2307f7a34e895a75ebdca7438cf9d5d0364007acb594366bf` |
| `game:scripts/build-proof-verifier.sh` | `3c0b362d709de6a88618716cf527268c237e2bff392bbdd4ec6b581670649259` |
| `game:scripts/prism-verifier-backport.mjs` | `5b5fe89d5da1b94ae9e3e49b4f70f39a606a70a8c7d11c883614fb46d7892a0a` |

## Recommended boundary

Register `source-backport` as an explicit, closed acquisition variant. It uses
the compiled, registered changed source archive and a fresh private source-only
construction, followed by the real `lake build prod-export` and actual
`lake exe prod-export`. It cannot import the old SDK `.lake` or claim the old
SDK exporter binary identity. Require a valid current SDK lock/2 and exact
native SDK inventory even though acquisition does not consume its exporter seed.
Keep `cold` and `sdk-seed` behavior unchanged; never choose the new variant merely
because a normal seed check failed. A compile-time registered variant or exact
explicit invocation selector must fail closed if its descriptor is absent.

Use `vendor/lean4-prod/source-backport.json`, outside `lean.tar`, as a canonical
compiled-in stable descriptor, registered as another file artifact on the
existing `lean4-prod` dependency. The artifact must stay under `vendor/` because
`xtask/src/audit.rs:1070` restricts registered artifact paths. Suggested exact
descriptor fields are `schema`, `id`, `source_url`, `base_revision`,
`compiler_revision`, `compiler_tree`, `patch_sha256`, `archive_sha256`,
`toolchain`, and `base_sdk_image`. If Rust compiler source changes too, bind its
manifest/crate hashes through the existing complete dependency artifacts and
include the relevant stable manifest digest in the descriptor. Use the exact
actual source URL and commit; do not conflate the known afflom checkout with
historical auser Cargo metadata.

Minimal acquisition fields can be just `schema`, `mode`, `descriptor_sha256`,
`sdk_lock_sha256`, `inventory_sha256`, `platform`: stable compiler/archive/toolchain
identity resolves from the compiled descriptor. The SDK lock digest must have
one defined meaning (recommend the same canonical document digest used by
`execution_lock().digest()`, with explicit `sha256:` syntax). The inventory is
the exact retained native lock row, not a newly rehashed self-selected document.
If the implementation repeats archive/revision/toolchain for readability, compare
every redundant field to the descriptor and reject unknown fields.

Do **not** put the descriptor's own digest, dependency-register digest, resulting
exporter binary hash, Prism verifier binary hash or resulting Prism commit into
the compiled descriptor. Establish compiler commit/tree and patch first, then
archive bytes, descriptor and Prism build. Actual exporter bytes remain measured
in `exporter-execution/1.executable` and stable application
`exporter-identity/1`; the resulting verifier executable hash belongs in the
external game provenance receipt. This has no hash fixed point.

## Actual pre-reset consumers and required treatment

All line references identify the inspected pre-reset source. They are not
assertions about line positions or implemented behavior in a restored checkout.

| Consumer in inspected code | Existing behavior | Proposed treatment |
| --- | --- | --- |
| `exporter.rs:235-285` `validate_acquisition` | Exact cold object, otherwise exact nine-field sdk-seed; matches compiled archive, actual child, revision and toolchain. | Add closed descriptor-bound variant; retain both existing branches. Acquisition occurs before child construction, so new source receipt cannot require a prebuilt child's expected hash. |
| `exporter.rs:312-356` `validate_acquisition_authority` | Validates SDK lock/2 and exact native inventory seed-manifest/exporter rows. | New branch validates independently retained base SDK lock/inventory plus compiled descriptor; never relabel changed child as either original row. Preserve sdk-seed row checks verbatim. |
| `exporter.rs:376-429` first/after build | Only exact cold receipt uses `capture_source` and `same_source`; all others authenticate seed and require `same_compiler`. | Factor an exact validated source-only mode predicate. New mode permits only initial source-to-build growth; after first build retain full exact snapshot. Keep source snapshot and failure precedence. |
| `exporter.rs:437-598` acquisition | Always extracts compiled archive, then attempts governed seed path if inventory exists. | Explicit branch after extraction and mandatory lock/inventory binding returns original `capture_source`; never invoke seed helper for changed source. Do not alter helper admission or suppress inventory. |
| `exporter.rs:127-202` execution | Requires actual Lake argv, before/after full package custody, actual child measurement and stable file identity, including failure. | Shared acquisition validator must recognize new mode. Keep all execution/custody checks. Outer archive is already compiled archive identity. |
| `exporter/owner.rs:79`, `:215` | Two further exact-cold comparisons govern first build source-only growth, including actual library command failure paths. | Both need same validated source-only predicate. Updating exporter.rs alone breaks owner generation. |
| `exporter/owner.rs:279-287`, `:440-496`, `:710-785` | Original lock/inventory retained across phases and retirement; source/executable/acquisition identical across both phase transcripts. | Preserve all checks. New mode still carries original lock/inventory authority and exact receipt equality; no recapture/adoption after drift. |
| `release_verification.rs:1001-1039`, `:1055-1104` | Closed execution, compiled archive equality, then retained native execution platform and independent SDK authority for every original export, including owner phases. | New mode must reach structural and authority readers; require its platform matches retained preflight exactly. Keep source-free admission and semantic/artifact checks. |
| `application_build.rs:1292-1301`; `release_verification.rs:1522-1528`, `:1750-1760` | Build sidecar is only schema/archive/actual executable; regeneration must match it. | Existing shape can remain: stable across source-only acquisition/replay and contains measured resulting child. Do not put acquisition receipts into build artifacts or normalize fields during replay. |
| `schemas/library-verification-manifest-v2.schema.json:137-308`; `contracts.rs:71-74` | Current manifest contract admits only cold/sdk-seed; same process definition is used in owner evidence. | Add exact new branch to current `/2` schema. Keep historical `/1` schema/reader unchanged; new mode is not historical evidence. A standalone descriptor schema needs exact contract and coverage. |
| `model/dependencies.toml:4-33`; `xtask/src/audit.rs:992-1095`; `crates/prismpm/tests/lean4_prod_dependency.rs:115-163` | Four exact dependency IDs/order, ordinary revision/archive checks; integration test additionally pins base revision and exactly five artifacts. | Retain IDs and source mode; register changed archive/revision and descriptor artifact, update exact test expectations with new pinned values. Do not weaken tree/crate/member checks. |
| `sdk/inventory-metadata.mjs:146-175` `compilerRevision` | Deliberately closed string TOML parser; lean4-prod row must have exactly id/lean_version/revision/source. | Separate artifact avoids extra row fields and new syntax; otherwise extend exact reader deliberately. Artifact parsing is already accepted. |
| `controller/mod.rs:45-90`, `:1023-1037` | Library identity frames source/helper bytes; build input separately hashes dependency register. | Frame new descriptor/helper bytes in generator identity, and pin descriptor through dependency register. Include-file changes are not automatically included merely because exporter.rs mentions their path. |
| SPEC §12 (`:1850-1895`); `model/ids.toml:958`; `crates/conformance/src/cases/mod.rs:659` | Normative acquisition promises cold/seed; DK-29 owns exact SDK seed suite/count. | Add normative mode, descriptor and authority/refusal semantics, separately registered capability/conformance negatives. Preserve DK-29 seed semantics and tests. |

The following were **SDK release qualification**, not generic backport admission:

* `sdk/exporter-seed-admission.mjs:17-44,90-124` binds the immutable installed
  seed to original SDK inventory, source, toolchain and runtime bytes.
  `sdk/inventory-metadata.mjs:7-140` describes that exact seed; neither needs to
  accept a changed source-backport as an SDK seed.
* `scripts/library-sdk-check.mjs:255-285` historical reader and
  `:416-480` `verifyExporterProcess`/`validateVerificationOwner` reject modes
  besides cold/sdk-seed. `:488-540` verifies the fixed cold/warm SDK matrix.
  `scripts/product-sdk-check.mjs:193-206` explicitly requires sdk-seed for
  installed application qualification. Preserve these defaults. If reusing a
  shared reader for game backport evidence, add explicit separately supplied
  descriptor authority/new entrypoint; never expand released-SDK qualification
  simply by including source-backport in a modes array.
* `scripts/library-owner-reader-replay.mjs:18-24`,
  `scripts/library-sdk-check.test.mjs:136-156,281-302` and
  `scripts/product-sdk-check.test.mjs:88-115` are mutation controls, not authority
  producers. Add new-mode controls alongside them only for the new entrypoint.
  Historical goldens must not be rewritten to claim new provenance.

The pre-reset `/1` library schema at
`schemas/library-verification-manifest.schema.json:77-96` also explicitly
contained just cold/sdk-seed branches. Its historical scope should stay intact.

## Game provenance/report consumers

`game:scripts/build-proof-verifier.sh:14-37` patched exactly one file, checked its
exact digest, built locked/offline, tested the existing replay repair and compared
the resulting binary with fixed `verifierBackport.binarySha256`.
`game:scripts/prism-verifier-backport.mjs:8-24` named that existing one-file
backport. The original descriptor identified:

* `sourcePath`: `crates/prismpm/src/verification.rs`
* `sourceSha256`: `0ac12b166ac69535ebf00c0af35bd6c9cfe1ea5d0660fccd8f9d49f31ca432b4`
* `patchedSha256`: `43afc51ef5ec9d930bf039e9356caf9b3ae701248a5fab3f54efd4bb0c2bfac0`
* `binarySha256`: `33aec8246dab174f926633feab1fa3c0e8c73a911a67042599aa0dfcc1a1ab2e`

A new compiler/exporter repair needs a separate versioned descriptor and
reproducible vendoring step, not silently overwritten identities.

`game:scripts/verify-prism.sh:12-39` correctly used an absolute verifier path
while SDK child PATH/inventory checks stayed intact. Preserve that property.
`game:scripts/proof-report.mjs:17-32` checked only presence of external
`binarySha256` and described scope as the existing upstream verifier backport;
extend the **new receipt/report** with explicit compiler descriptor,
archive/source/patch and actual exporter identity, plus resulting verifier hash.
`game:scripts/proof-result.mjs:5-18` bound published artifacts to fully verified
build output, not compiler provenance; preserve those byte checks.
The old verifier receipt is historical evidence and should not be rewritten.

## Discriminating negatives required before admission claim

1. Start each test with a separately valid new-mode fixture. Reject mode typo,
   missing/unknown/duplicate fields, malformed/foreign descriptor, changed
   base/revision/tree/patch/archive/toolchain and caller-selected descriptor.
2. Reject absent lock, legacy lock, wrong base SDK image, wrong platform row,
   native preflight/platform mismatch, changed lock bytes or inventory during
   either phase/retirement. Rehashing forged inventory must not establish
   authority. Retain unchanged default missing/legacy seed behavior.
3. New mode cannot satisfy sdk-seed qualification, old SDK seed cannot authorize
   changed archive, and new-mode selection cannot occur as fallback after seed
   failure. Released SDK inventory and seed remain byte-identical.
4. Preserve source/archive exact membership, path/mode/alias/hardlink/special-file
   refusals; mutate source before first build, during failed build/export,
   between phases and before retirement. Initial build growth works once;
   replacing a built tree or recapturing drift never works.
5. Retained export child measurement, build sidecar and both owner receipts must
   match; changed executable/archive/platform in only one phase fails even after
   outer manifest hashes are resealed. Preserve full generated-set byte replay,
   extra/missing/duplicate artifact refusal and failed-command custody checks.
6. Keep compiler semantics negatives independent of acquisition: unknown calls,
   live generic/custom dictionary types, mathematical Int, escaped closures,
   mutated helper bodies/types/bounds/extra work and failing unused computation
   remain refusals/observable failures. A provenance mode adds no lowering rule.

Original validation was source inspection and digest measurement only.
Reconstruction performs neither fresh source inspection nor remeasurement.
Actual new-mode behavior, conformance, canonical small fixture admission and
complete numeric-root/application acceptance require independent evidence.
