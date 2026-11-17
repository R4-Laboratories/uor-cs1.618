# Actual native artifact review — AMD64

Reviewed the retained actual artifacts for GitHub run `44060585070`, attempt `1`, without rerunning a suite, building, executing retained payloads, using Docker, downloading data, or modifying source. Requirements: native adapter Task1 brief/report/review, `docs/superpowers/plans/2026-11-16-native-golden-game-adapter.md`, the original source owner/writer and source `AGENTS.md`. This review writes only this report.

**AMD64 artifact verdict: PASS for reviewed native-baseline preparation. No concrete blocking finding.** This is one architecture's actual evidence. ARM64 remains pending and no six-file import, SDK acceptance, full-VV success, product readiness, or publication is established here. The original `review-required` / `complete-review-required` records remain unchanged.

## Exact identities and transport

- Actual game execution and workflow SHA: `e0355a99c8717724e0d1fd072dfac15013603d17`; repository `R4-Laboratories/uor-cs1.618`; push on `refs/heads/numeric-kernels`; workflow `.github/workflows/prismpm-backport-native-golden.yml`; run `44060585070`, attempt `1`.
- Actual native source: `881df278923ff271fc179703e55ea91c45f2394d`, tree `ee7196f70cb948fec6b9aa85ed1b61eb50c73ea4`. Original snapshot manifest/bundle/patch hashes and restoration receipt join the retained preparation and final envelope. Source identity is distinct from game identity.
- Runner evidence: Linux, GitHub-hosted X64, lane amd64, Ubuntu runner image `ubuntu24` / `20261111.127.1`. The original container observation independently reports `x64`, Linux, Ubuntu 24.04. This is runner-selection evidence, not physical-hardware attestation.
- Development-only image index `sha256:42213da87c564d859e327ab7df2459357d674fa538050f13905caa24c352588e`, environment revision `6ebbef86a300ff4490c4c37f821e50585e211481`; exact amd64 child `sha256:53889b1c2c2c17687c5d0dbfd586b93d176c39e4afd1329606fd542c6d1251a9`; classic-store config/image `sha256:7aa85f1e6860fe83211c3ef158cd8beb351120526a3bbe78335c0349e2e4b973`. Retained raw index and child-manifest stdout hash exactly to their pinned digests, and environment lock equals the fixed source Git blob.

Independently verified retained GitHub API metadata, actual ZIP bytes, every ZIP member, every extraction-index row and every extracted member:

| Artifact | ZIP bytes | ZIP SHA-256 | Members / expanded bytes |
|---|---:|---|---:|
| `14319337290`, orchestration | 44,721 | `0c3790436072fd71a1fa62de34a5698105fcb93a934ba31eda29e3544257cfba` | 26 / 268,928 |
| `14319083097`, original owner | 8,398,961 | `218e21171b401da49a53eaea154e8f794627f545ff6f2656105c99f40cc07aad` | 465 / 85,640,564 |

ZIP names are unique/confined, without traversal, backslashes, control characters, symlinks or special-file types; members satisfy the 128 MiB bound. Reading all members verifies archive CRCs as well as exact byte equality to extracted originals. The final orchestration inventory contains exactly all 490 retained files other than its own envelope, totaling 85,789,070 bytes; no missing/extra member or length/hash mismatch was found. Evidence resides at `artifacts/numeric-native/ci-44060585070/amd64/{evidence,owner}/`; durable API metadata, ZIPs and complete extraction inventories reside at `docs/research/numeric-export/recovery-2026-11-16/ci-44060585070/`.

## Actual command and product review

1. Preparation is explicitly incomplete before execution. Its source/game/runner/input identities match final collection; the restoration receipt has the recorded hash. All six source owner/workflow/lock/observer input hashes match actual source881 Git blobs, and the immutable game restorer matches its recorded bytes.
2. The original two commands are preserved: `node scripts/native-golden.mjs tests`, then `node scripts/native-golden.mjs run 881df278923ff271fc179703e55ea91c45f2394d /home/runner/work/_temp/native-golden`. Both actual statuses are zero. All three observer records, complete untruncated command logs, retained byte counts, stop/readiness markers and successful gate results satisfy the reviewed observer contract. Original helper output records 19/19 passing tests, no skips/failures.
3. The original owner transcript contains exactly 49 ordered commands and all 98 streams. Actual dependency acquisition uses the owned bridge actor with a read-only source mount; offline generation uses the distinct owned `none` network actor and source writable only for original generation. Source path, image, creation CIDs, labels, inspections, bounded original create arguments, writer/readback order and cleanup were examined against the source owner. Acquisition retirement precedes offline creation. Both original inspect/remove/absent-CID/absent-name sequences are present; the final absent-name inspection is command049 and the endpoint. Only the four authentic absence inspections have status1; all other commands succeed. Final source revision/diff/untracked checks occur in their original positions and permit only the selected native paths.
4. The actual dependency suite reports 22 passed controls; actual exporter seed TAP reports 38/38 passed, no failures/skips/cancellation. Dependency preparation's canonical hash equals the owner review's hash. All nine Cargo input hashes match fixed source Git blobs; all 28,213 seeded cache rows outside mutable registry-index rows remain exact in the 28,582-row acquired inventory. The retained unaccepted preparation receipt equals the installed preparation body and is not relabeled as acceptance.
5. Actual command040 reports writing three original native records, and command042 reports all 418 expanded golden files matching reviewed build `92ffbe4993596c1abe331e3043922153dc3d59291609f03bdf7637a7f3904c7f` (`SdkAmd64`). These are retained real command outputs, not fixture evidence.
6. Independently checked all 417 golden-manifest file descriptors against the actual retained products or source881 Git blobs: 111 authored sources and 306 listed generated products, including 59 generated Lean/source linkage rows. The generated closure has 309 files; its only three omissions from golden descriptors are the original writer's intentional `verified/generated.rs`, `verified/kernel.ir`, and `verified/validator`, each independently bound by the verification manifest's exact byte length and SHA-256. No extra generated product or missing listed member exists. The raw verified manifest and LexLean attestation exactly equal their selected generated-directory counterparts. All 73 verification process exits are zero; execution evidence records 597 cases and passed 54-control coverage. No retained executable was executed during review.
7. The selected verification directory identity is the SHA-256 of its raw manifest. The build identity is, correctly, the canonical build **inputs** hash (not the entire build-manifest hash), as specified by the original controller; that identity was recomputed, and all 298 build-manifest rows plus the manifest itself form the exact selected build tree.
8. Independently compared the 415 platform-independent file bytes against fixed source881's committed shared baseline, with no differences. Also checked the original `native_records` semantic constraints: build/model/compiler/source/declaration identity, generated Lean links, execution and export/runtime roots, portable descriptors, and ordered process argv/exit/module/tool plus exporter provenance/mode remain equal to shared baseline. Native host is exactly `x86_64`/Linux. Platform-specific raw records are preserved without normalization.

## Exact proposed AMD64 import bytes

Source prefix: `tests/golden/native/linux-amd64-ubuntu-24.04/`. Copy only these bytes from `artifacts/numeric-native/ci-44060585070/amd64/owner/records/` after both architecture reviews pass:

| Relative source/destination path | Bytes | SHA-256 |
|---|---:|---|
| `golden-manifest.json` | 108,102 | `dc66dd81db48ff91e9b45ad953583b928913ec46754dba9ce29fe5722e2798a6` |
| `verified/lexlean-attestation.json` | 2,022,137 | `8ae59081acbcd24da4e5559f1f84d5e74773a2a7f9d81061420d9dfbe3ece217` |
| `verified/manifest.json` | 2,284,137 | `c342d0e095f43b7e326acc02e44c8eb5aee2ec42d4ed1f0c0af31cadf3f09f7a` |

All three join the original owner review and wrapper inventory. Original owner review SHA-256: `4c2c60920743bba22ff16984f1bc9d50c77639614493f939dd1aead284a5b0d1`.

## Later-source continuity and limits

Read-only Git-object comparison from source881 to reviewed successor `331431bc6c2b71ca06d5e145d9e6a825f6218053` shows unchanged stdlib, both compiler packages, model, schemas, SDK, all shared/native baseline files, original manifests/locks/toolchains, six native owner inputs and golden conformance implementation. The exact golden writer/comparison functions in xtask are unchanged. The only production-tree-path change is a `cfg(test)` capture-test selector; remaining changes concern source test dispatch, custody/Node helpers, registration and SPEC. This supports baseline generator continuity to331, not a claim that this run executed331. The active Task4a2 working copy was not used as authority. Any later source/import commit still needs its own continuity and byte-only import review.

The genuine AMD64 evidence resolves this lane's native-generation prerequisite only. ARM64 review, exact six-file import and independent import review remain open; original d6 SDK qualification, constructive proof repair, complete final-source VV and measured game promotion remain separate gates. No artifact was rewritten, no baseline was imported, and no source or Git index was modified during this review.
