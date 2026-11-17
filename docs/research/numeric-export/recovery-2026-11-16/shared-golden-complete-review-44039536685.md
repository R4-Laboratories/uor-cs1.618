# Complete shared-golden proposal review — run 44039536685

**PASS for byte-preserving import eligibility of the five paths listed below. No new byte or collection concern found.** The fresh proposal closes the missing collection boundary from run `44030198874`; that original run remains incomplete. This is approval of the specified shared-golden bytes from the complete fresh proposal, not an import action or native-golden/full-VV/SDK/numeric admission.

Reviewed fresh artifact: `artifacts/numeric-task2c/ci-44039536685/backport-shared-golden-proposal-44039536685-1`, artifact ID `14309928474`. The original ZIP measures **5,942,051 bytes**, SHA-256 `4e37c9b7c353b885b6180fc8be7161ca14a0fd702795d8d54e5c9cd539165aef`, matching the parent's independently API-verified identity. I independently measured that ZIP and checked every extracted regular member against its ZIP bytes. The parent's reported workflow result is SUCCESS; the locally verified collector result is `complete-review-required`, with no error field.

## Fresh execution, identity and collection evidence

I independently verified all **464** entries in the result's retained SHA-256 table and the exact **85,992,618-byte** aggregate. All four original command records retain the expected argv, exit0 and completed gate result without diagnostic errors. Their complete, nontruncated logs match their retention byte counts:

| Command | Original result | Complete log bytes |
| --- | --- | ---: |
| Native helper suite | 19 passed, no failures/skips | 5,980 |
| Text-workbench suite | 26 passed, no failures/skips | 6,685 |
| Original `just golden-write` with the reviewed reason | 418 files written | 6,610 |
| Original `just golden-check` | Same 418 files matched, DevelopmentAmd64 | 290 |

Both writer/readback logs name build `92ffbe4993596c1abe331e3043922153dc3d59291609f03bdf7637a7f3904c7f`. This is fresh actual source-devcontainer execution evidence; no suite or writer was rerun during review.

The retained game identity is `8b90be514ee25a7f65cb9a4552901e91aaf37ea5`. Its workflow checks out that game revision, restores the separate source preparation capture, copies the original helper into the source target directory, runs the writer under UID1000, then independently captures container identity and collects the proposal. I matched the candidate receipt exactly to that game commit's preparation manifest: source `324955b6923c1d194d7bc870a2d2a05eb687048c`, tree `7cf463121cf5dd15b681ce1dfafd5694617cc474`, bundle `0e6e0a5fb250f6c6ca236b34d7ee953d1bf22a25145876e5b1a970658376a17e`, patch `e811bbcb73d32e47c9ef774f33bdd38a46fb6841bf5c1f6837c2b1d485af3bef`.

All four retained devcontainer input hashes match immutable source324. The fresh container record identifies the same source/tree, Linux amd64, container `16afe11aaa9902bfad3d5473ddcce2b66e215184970ef988ce0990ab55d8cc0f` and image-config digest `sha256:dc8cc1bf8893ca3d31a83dd33ea177159816418c344335c892ad2295f1f40628`. Its empty repository-digest list remains source-development image provenance, not a claim about the released d6 SDK.

I read the independent `hosted-followup-review.md` correction verdict and matched the actual game8b90 collector bytes to reviewed fix `b4caf774a9c2b8996c877d6ea83a9837c4abb937`. Its completion state is emitted only after source revision/tree verification, private-index/object collection, separate staged and unstaged `--no-renames` enumeration plus untracked-path rejection, exact patch retention, all original successful command/log checks, and independent candidate/devcontainer/container validation. Thus the fresh completion receipt establishes that the reviewed outside-golden guard was reached and passed. No separate raw outside-path listing is retained; this conclusion rests on the original completed collector and its reviewed fail-closed implementation, not on treating a path-limited patch alone as proof that the outside tree was unchanged.

## Exact proposal continuity and patch check

I independently compared the entire generated trees: **424 files in each, identical paths and byte-identical contents**, with no added, deleted or changed file relative to the previously reviewed retained proposal from `44030198874`. Accordingly, the five-file semantic/provenance and generator/attestation analysis in `shared-golden-actual-review.md` applies unchanged. I did not repeat that semantic review or regenerate output.

The new `golden.patch` is **8,954,811 bytes**, SHA-256 `a1028f2f01f45a962070882df8a54485a16596ecc4e94b3a6cdd069599a35811`. Its complete patch header inventory names exactly the five paths below, each with identical before/after path and no outside path. In a disposable temporary Git directory populated with those files from immutable source324, `git apply --check` succeeded; applying the patch there produced byte-identical retained output for all five files. No live source checkout/index/HEAD was changed. This establishes that the patch fully represents the reviewed five-file proposal against its original source baseline.

## Import-eligible exact paths

Only these five original retained files are eligible for a later byte-preserving shared-golden import:

| Repository-relative destination | SHA-256 | Bytes |
| --- | --- | ---: |
| `tests/golden/stdlib/build/manifest.json` | `1388ec84c3fa97e9cbac0c4f4f7c0ddf7469f3f46e27fbf90cc70195f8d5c7c8` | 57,438 |
| `tests/golden/stdlib/build/model.prism.json` | `47c8038d51cbf230c73a2bf565c10b729dab1d27e2bbad0d69c77619d304f97e` | 4,723 |
| `tests/golden/stdlib/golden-manifest.json` | `d25bd858d005b1f4e2bcde5f606229657f240c92505fa84271c7228bd4377504` | 108,056 |
| `tests/golden/stdlib/verified/lexlean-attestation.json` | `8a009108372a5b0ffcb2243233282313348b7c2be8f22c06301de13ca2b2ec94` | 2,022,137 |
| `tests/golden/stdlib/verified/manifest.json` | `f6fbaf3c36f235539aa4a9cb26d8df435f1bf28a74a3f5c33fe490ae1e69bf75` | 2,284,137 |

Copy from the fresh artifact's `generated/` paths without JSON reserialization, normalization, reason edits or handwritten hash changes. The other 419 golden files remain unchanged. This eligibility is tied to the exact source324-produced bytes; it does not imply that any unrelated later source change is semantically covered by the proposal.

Native golden regeneration, complete applicable source VV, unchanged-d6 SDK verification of all four numeric packages, their original-owner/proof/audit/regeneration/std/no_std evidence, retained-artifact controls and exact native/import-free Wasm 44,648/None/status replay remain pending parent-owned gates. No application/Holo/source-free product or production admission follows from this shared proposal.

Review boundaries: no implementation, source/workflow change, import, subagent, push, Docker use, or writer/test rerun. Only the disposable patch-application directory and this report were written; the temporary directory was retired. The parallel Task2 implementation and live source worktree were untouched.
