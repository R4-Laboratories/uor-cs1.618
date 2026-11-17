# Task2 native golden exact-byte import report

Implemented the independently reviewed six-file import only. No golden was regenerated or normalized, no tests/builds/Docker were run, and no SDK, full-VV, compiler, package, game or release acceptance is claimed. This import still requires independent byte-only review.

## Exact identities

- Import base: `f292c7100874c0e0b2d1e0e81b27caeec8391f77`, tree `d48cdfd94e6d46925e9269e364c2b7a6eb975d8a`.
- Import commit: `463177a0971d95e112e10ed5da39c8cbaf0a4c96`, tree `0990e900cf1cb5bb4a481bba781a86cc3fcf0999`.
- Actual original generation remains run `44060585070`, attempt1, game `e0355a99c8717724e0d1fd072dfac15013603d17`, executed source `881df278923ff271fc179703e55ea91c45f2394d`, tree `ee7196f70cb948fec6b9aa85ed1b61eb50c73ea4`. The run is not relabeled as the import base or successor.
- Independent prerequisites: `task-2-amd64-review.md` and `task-2-arm64-review.md`, with joint exact six-file import eligibility and source881→f292 generator/owner/baseline continuity. Both actual jobs completed successfully; their original review-required records are unchanged.

## Exact six files

Each original source is game `artifacts/numeric-native/ci-44060585070/<arch>/owner/records/<relative>`. Each destination is source `tests/golden/native/linux-<arch>-ubuntu-24.04/<relative>`. The import script independently joined every raw file to the joint review, original owner review and game orchestration file/record inventory before writing. It checked final working bytes and committed Git blobs against the same originals afterward.

| Architecture | Relative path | Bytes | SHA-256 |
|---|---|---:|---|
| amd64 | `golden-manifest.json` | 108102 | `dc66dd81db48ff91e9b45ad953583b928913ec46754dba9ce29fe5722e2798a6` |
| amd64 | `verified/lexlean-attestation.json` | 2022137 | `8ae59081acbcd24da4e5559f1f84d5e74773a2a7f9d81061420d9dfbe3ece217` |
| amd64 | `verified/manifest.json` | 2284137 | `c342d0e095f43b7e326acc02e44c8eb5aee2ec42d4ed1f0c0af31cadf3f09f7a` |
| arm64 | `golden-manifest.json` | 108104 | `5ad4808f3980df59a7431dda1d45cb08b690de163144a70228633eeede0f0fa3` |
| arm64 | `verified/lexlean-attestation.json` | 2022139 | `0c46c09399f0e927db6f3678a41ca8a66c77eff88ccd83317e8ec092a87833e6` |
| arm64 | `verified/manifest.json` | 2284139 | `9f45ff62f78f8804c6bcab4d5670c09f229b90e8fe436d4462505fdaf8debe80` |

## Audit and commit

Read source AGENTS and normative native-golden SPEC requirements, the task brief/plan and both actual artifact reviews. Initial source HEAD/tree matched the exact clean base. The bounded audit measured all12,837 tracked members before and after import and again after commit, including file type/mode, byte length and SHA256. Tracked symlinks were measured as link target bytes, without dereferencing them. Original six destination bytes are retained under evidence `before/`.

Exactly six owned members changed; all12,831 nonowned tracked members remain byte-identical with unchanged modes/types. This includes source generators, original native owner/dependency helpers, compiler packages, shared goldens, all locks, SDK/tool pins and authority files. The Git index was byte-for-byte equal in its staged-entry inventory before and after the copies, with no staged changes. Full staged/unstaged path checks admitted only the six explicit native destinations. `git diff --check` passed. The commit used `git commit --only` with all six explicit owned paths; HEAD's parent is exactly f292, the committed diff contains exactly six files, and the final source worktree is clean. No game implementation or snapshot file was edited.

The retained `import.py` records each Git command's argv/cwd/exit/stdout/stderr and performs all assertions before commit. Actual invocation exited0 with empty stderr. Final post-exit evidence index covers71 files totaling73,095,383 bytes; SHA256 `3691c86f86f169b7462d0ca37af44360e7290d3d0780cc1007e173063ad41e43`. Evidence is `/workspace/diagnostic-tools/native-golden-import/`. The exact committed patch is17,659,890 bytes, SHA256 `6f26abe17ee0e086ba102f55d466838892fcefb9babe2002e8c08e05ef04a76b`; its size reflects complete single-line JSON records, not additional scope. The final index supersedes the provisional in-process index digest printed before the script's last stdout write; `invocation.json` documents that distinction. Every final indexed file was closed before final indexing.

Initial recorded free space exceeded9.34GB; final free space9,274,753,024 bytes remains above the8GiB floor. No dependency/image/cache download or large build occurred. No source push, upstream PR, game push, hosted launch or child agent was used.

Independent import review, later accurately identified source snapshot, actual unchanged-SDK capture qualification, constructive proof repair, all final-source VV parts/assembler and numerical/game promotion remain pending. Source qualification Task4b retains its separate fixedf292 snapshot; this import does not silently change that input.
