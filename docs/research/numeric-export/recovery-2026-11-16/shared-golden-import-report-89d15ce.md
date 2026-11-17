# Shared-golden byte import report

Status: PASS for the reviewed five-file byte import prerequisite only. Committed on `numeric-export-backport` as `89d15ce4c2604033689acb097bf0f5279751640f`. No push or PR.

## Repository identities

- Immutable source: `324955b6923c1d194d7bc870a2d2a05eb687048c`; tree `7cf463121cf5dd15b681ce1dfafd5694617cc474`.
- Import base: `bc049680103bbaf285a5582a346a73f4d2f790e4`; tree `1f3f4b6d244414c422115a842949d39e4a46ac3c`.
- Import head: `89d15ce4c2604033689acb097bf0f5279751640f`; tree `8492f7f410ac20226e90f5bfebd585657f326371`.
- Head parent equals supplied base; worktree and index are clean.

## Exact byte identities

Before bytes matched immutable source324 for all 424 files. Every retained generated file matched its original result.json SHA-256 entry. The five retained after identities also matched the exact approved hashes and byte counts in the brief.

| Path | Before/source324 SHA-256 | Before bytes | Retained/imported SHA-256 | After bytes |
| --- | --- | ---: | --- | ---: |
| `tests/golden/stdlib/build/manifest.json` | `c182315fb34d0c1c281e85dca15af779e0657e4aab51f4b8e740598ae545f201` | 57438 | `1388ec84c3fa97e9cbac0c4f4f7c0ddf7469f3f46e27fbf90cc70195f8d5c7c8` | 57438 |
| `tests/golden/stdlib/build/model.prism.json` | `81edf7c4d1add3b175f62e30d1145ebbbd6d7ee0b6e60bac06fb10e43284c68e` | 4723 | `47c8038d51cbf230c73a2bf565c10b729dab1d27e2bbad0d69c77619d304f97e` | 4723 |
| `tests/golden/stdlib/golden-manifest.json` | `6f1321710c3d6aefb9129c993387fb06433d8f702ff91f393439f3f6a769e810` | 108084 | `d25bd858d005b1f4e2bcde5f606229657f240c92505fa84271c7228bd4377504` | 108056 |
| `tests/golden/stdlib/verified/lexlean-attestation.json` | `aee729eb686e115324a545421a5d34abdbbbe0f67d063488370cb0f301eb675a` | 2022137 | `8a009108372a5b0ffcb2243233282313348b7c2be8f22c06301de13ca2b2ec94` | 2022137 |
| `tests/golden/stdlib/verified/manifest.json` | `22ba1ca2e7576e03b7273f208eea2ab2d65b5b9dc84e4e67f94f2990af847fcd` | 2284137 | `f6fbaf3c36f235539aa4a9cb26d8df435f1bf28a74a3f5c33fe490ae1e69bf75` | 2284137 |

## Checks and continuity

- Before copy: exact path-set equality across retained generated, live golden, and immutable source324 trees; 424 files each. All 424 live files equal source324 bytes. Exactly 419 generated files equal those bytes and exactly the five approved files differ. No symlinks in the retained generated tree.
- Copy: only five original retained byte strings copied with shutil.copyfile; no JSON serialization, normalization, reason edit, handwritten hash update, patch rewrite, or regeneration.
- After copy: exact fulltree path and byte equality for all 424 retained files; exactly five changed tracked paths, no staged or untracked paths before staging. Explicit staging check confirmed exactly the same five paths.
- After commit: fresh equality verification covers all 424 live files and all 424 committed HEAD blobs against retained bytes. The commit diff has exactly five paths; HEAD parent equals base; clean worktree and index.
- Source324-to-base name inventory contains only the following five candidate-capture test-plumbing additions:

- `A scripts/conditional-capture-bootstrap.py`
- `A scripts/conditional-capture-candidate-command.mjs`
- `A scripts/conditional-capture-candidate-command.test.mjs`
- `A scripts/conditional-capture-candidate.py`
- `A scripts/conditional-capture-candidate.test.py`

That complete name inventory has no application generator, emitter, compiler, model, LexLean authority, SDK, compiler/policy/sourcepin, legacy authority, or capture-control change. Baseline continuity is limited to this reviewed source324 byte proposal and the observed later test-plumbing additions; it makes no broader semantic admission. Lifecycle code was not touched.

The complete fresh review was read at `/workspace/scratch/cs-numeric-kernels/docs/research/numeric-export/recovery-2026-11-16/shared-golden-complete-review-44039536685.md`. It independently records the original source324 writer and readback checker passing, complete collection and retained output continuity, five-file patch eligibility, and prior semantic review continuity. This import did not rerun those diagnostics.

No new test was needed for this pure byte import. No writer, golden regeneration, Docker, SDK, Lake/Cargo build, or passing suite was run. Disk remained above 8 GiB at recorded pre-copy, post-copy, and final checks.

## Evidence

Bounded evidence directory: `/workspace/diagnostic-tools/shared-golden-import/`.

- `INDEX.md`: bounded evidence inventory.
- `pre-copy-results.json`: original baseline/path/hash preconditions and disk check.
- `before-and-retained-identities.json`: 424-file source324/before/retained SHA-256 and byte identities.
- `source-continuity-name-status.txt`: complete source324-to-base name-status inventory.
- `post-copy-results.json`: fulltree equality and owned-path checks before staging.
- `final-results.json`: committed identities, exact commit paths, fulltree committed/live byte equality, cleanliness, and disk.
- `import.py`: exact import/check procedure.
- `verify-and-report.py`: final verification and report procedure.

Native goldens, full applicable source VV, unchanged-d6 SDK numeric verification and original-owner/proof/audit/regeneration/std/no_std evidence, retained-artifact controls, source capture, and exact native/import-free Wasm 44,648/None/status replay remain separate mandatory gates. This report makes no acceptance, product, or production admission claim.
