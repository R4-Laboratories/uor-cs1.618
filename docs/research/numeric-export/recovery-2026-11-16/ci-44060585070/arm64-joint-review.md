# Actual ARM64 artifact review and joint import eligibility

**ARM64 artifact verdict: PASS. Joint native-baseline import eligibility: PASS for the exact six raw files listed below. No concrete blocking finding.** This concludes independent review of both actual architecture artifacts from run `44060585070`, attempt1. It permits a separate byte-only import and import review; it does not claim that import has occurred or grant SDK, full-VV, proof, source-free, game or release acceptance.

The prior AMD64 review is `task-2-amd64-review.md`. This continuation examined actual ARM64 original command/product evidence and retained completed-run/API metadata, without rerunning suites, building, executing retained payloads, using Docker/network, copying large trees, modifying source/index, or changing any existing evidence. Only this report was written.

## Actual run and source binding

The retained `completed-run.json` identifies successful completed run `44060585070`, game SHA `e0355a99c8717724e0d1fd072dfac15013603d17`. Both jobs and every listed step completed successfully: AMD64 job `133961144709` took 23.8 minutes; ARM64 job `133961144581` took 41.55 minutes. Both are within the unchanged75-minute bound. ARM64 is the actual `ubuntu-24.04-arm` job, with envelope runner Linux/GitHub-hosted/ARM64, image `ubuntu24-arm64` / `20261111.182.1`; original container observation independently reports arm64/Linux/Ubuntu24.04. No hardware attestation is inferred.

Both architecture envelopes bind the same actual game repository/workflow/run/attempt, exact source881 snapshot, all six source inputs and immutable game restorer; their architecture/profile bindings differ correctly. Fixed executed source remains `881df278923ff271fc179703e55ea91c45f2394d`, tree `ee7196f70cb948fec6b9aa85ed1b61eb50c73ea4`. The run is not relabeled as a later revision.

ARM64 uses the exact original development-only image index `sha256:42213da87c564d859e327ab7df2459357d674fa538050f13905caa24c352588e`, environment revision `6ebbef86a300ff4490c4c37f821e50585e211481`, ARM64 child `sha256:2bbf0e55937b23b45cb62852d39f24f6c9e80b02b1c3b81a6cb3edc173d94c87` and classic-store config/image `sha256:97a66398dbb06c3cee772b292544a10b6e0ce97e31f65b0a745d3422e259dd7f`. The retained raw index/child bytes hash to those pinned digests; actual environment lock equals source881's exact ARM64 lock. This is not the original d6 SDK qualification.

## Independent transport and custody checks

Checked API sizes/digests and run/head joins from `artifacts-both-lanes.json`, then every actual ZIP member against extraction inventories and extracted bytes, with complete CRC reads, SHA-256 and byte-length comparisons:

| Artifact | ZIP bytes | ZIP SHA-256 | Members / expanded bytes |
|---|---:|---|---:|
| ARM64 orchestration `14319474912` | 52,304 | `11fee283a7113a9754057506dddbc007b2420d8af067781b68b9ae0018fb587f` | 26 / 367,068 |
| ARM64 original owner `14321141148` | 8,319,603 | `0b98536a29d13bc924421b3ef5b38b0f9293ca306dd387e2e93958ecde8263a8` | 465 / 85,391,210 |

Unique/confined archive paths contain no traversal, control characters, backslashes, symlinks or special-file types; no member exceeds128MiB. Exact extracted membership equals the complete archive/index membership. The ARM64 orchestration inventory binds all490 files other than its own envelope, totaling85,637,846 bytes, with no mismatch, extra or missing member. Its status remains `complete-review-required`, `diagnostic_only:true`, `error:null`. Preparation remains honestly incomplete before execution, with unchanged identity/input joins and authenticated restoration receipt. Durable files are under `docs/research/numeric-export/recovery-2026-11-16/ci-44060585070/`; extracted originals are under `artifacts/numeric-native/ci-44060585070/arm64/`.

## Actual execution, resources and product checks

- Exact original helper and owner commands completed with zero exits and complete untruncated observer logs. The actual helper reports19/19 passes; dependency suite22/22; exporter-seed suite38/38, all without skips/failures/cancellation. The actual game helper used to interpret the retained records was independently byte-matched to execution SHAe035 before its read-only validation routines were used.
- All49 ordered original command records and98 streams are present. Acquisition uses the correct owned bridge actor, read-only source mount, nonroot1001:1001, read-only root filesystem, dropped capabilities/no-new-privileges,256-PID/2CPU/2GiB memory+swap bounds. Offline generation uses its distinct owned none-network actor with4096-PID bound, identical source/image binding and original write scope. Both authenticated inspect/remove/absent-CID/absent-name sequences are complete; acquisition is retired before offline creation and final absent-name inspection is the exact transcript endpoint. Four authentic absent inspections return1; other commands succeed. Final source identity/diff/untracked checks remain in original order.
- Original observers stop normally with exact bounded logs:76 outer samples/115,013 bytes,1 helper sample/1,416 bytes and76 owner samples/119,818 bytes. Owner samples' minimum available workspace space is93,226,926,080 bytes and minimum MemAvailable is8,784,064KiB. Sampled resources comfortably exceed the original disk reserve; finite observations are not a claim about every instant. The original owner retains its own space checks and bounds. Local free space at review end is9,356,775,424 bytes, above8GiB.
- All nine Cargo source-input digests match fixed source Git blobs. The28,213-row seed inventory remains byte-identical in the28,582-row acquired cache inventory outside the original mutable registry-index allowance. Canonical dependency preparation hash matches the original review; the retained unaccepted preparation equals the installed preparation body without any acceptance relabeling.
- Actual writer output reports three original native files; actual readback reports418 expanded files matching build `92ffbe4993596c1abe331e3043922153dc3d59291609f03bdf7637a7f3904c7f` (`SdkArm64`). All417 golden file descriptors independently match the actual generated products or111 original source Git blobs;59 generated Lean/source rows retain shared identity. The complete309-file generated closure has only the original three intentional golden omissions (`generated.rs`, `kernel.ir`, `validator`), all exactly bound by verified artifact descriptors. All298 build-manifest rows match its complete selected tree, and canonical build-input hashing reproduces the buildID. Raw verified manifest hashes to its selected directory identity; both raw verified files equal selected generated counterparts. All73 verification-process exits are zero and execution status is passed.
- All415 portable golden files are independently byte-identical to source881's shared baseline. Checked the unchanged writer's native semantic constraints: common build/model/compiler/declaration/source identities, generated Lean/source links, execution/roots, portable artifact descriptors, ordered process argv/exit/module/tool and exporter provenance/mode remain identical. ARM64 host is exactly aarch64/Linux. Raw architecture-specific records are preserved rather than normalized.

## Joint eligibility and exact six-file import

The completed-run evidence and both independently reviewed artifact sets satisfy the native plan's actual-generation and artifact-review prerequisites. A fresh importer may copy exactly these raw bytes into the reviewed successor source, followed by independent byte-only import review. No other source path, shared baseline, schema, reason, lock, generated product or owner record may be edited as part of that import.

Each source is `artifacts/numeric-native/ci-44060585070/<architecture>/owner/records/<relative path>`. Each destination is `tests/golden/native/linux-<architecture>-ubuntu-24.04/<relative path>` in the PrismPM source worktree.

| Architecture | Relative path | Bytes | SHA-256 |
|---|---|---:|---|
| amd64 | `golden-manifest.json` | 108,102 | `dc66dd81db48ff91e9b45ad953583b928913ec46754dba9ce29fe5722e2798a6` |
| amd64 | `verified/lexlean-attestation.json` | 2,022,137 | `8ae59081acbcd24da4e5559f1f84d5e74773a2a7f9d81061420d9dfbe3ece217` |
| amd64 | `verified/manifest.json` | 2,284,137 | `c342d0e095f43b7e326acc02e44c8eb5aee2ec42d4ed1f0c0af31cadf3f09f7a` |
| arm64 | `golden-manifest.json` | 108,104 | `5ad4808f3980df59a7431dda1d45cb08b690de163144a70228633eeede0f0fa3` |
| arm64 | `verified/lexlean-attestation.json` | 2,022,139 | `0c46c09399f0e927db6f3678a41ca8a66c77eff88ccd83317e8ec092a87833e6` |
| arm64 | `verified/manifest.json` | 2,284,139 | `9f45ff62f78f8804c6bcab4d5670c09f229b90e8fe436d4462505fdaf8debe80` |

ARM64 original review SHA-256 is `9afdab921ab32b0d552488bab21ae383b8efe54bc790fe603de84fdf2d00e1d6`; AMD64 original review is `4c2c60920743bba22ff16984f1bc9d50c77639614493f939dd1aead284a5b0d1`. Both retain their original review-required scope and explicit unclaimed categories.

## Exact successor continuity and remaining gates

Source was observed clean at `f292c7100874c0e0b2d1e0e81b27caeec8391f77`, tree `d48cdfd94e6d46925e9269e364c2b7a6eb975d8a`. Read-only Git-object comparison from executed881 to this fixed successor confirms unchanged compiler packages, stdlib, shared/native baseline files, model/schemas/SDK, manifests/locks/toolchains, native owner/tests/dependency helpers/locks/observer, golden comparator and exact xtask golden writer functions. Full diff is confined to13 capture-test/Node custody/test-registration/SPEC files; the production-tree-path change is the cfg(test) capture selector. The additional Task4a2 successor files are linkage locator and capture-owner/test plumbing, not golden generators or model inputs. This extends prior881→331 continuity to the actual reviewedf292 successor; it does not claim native execution atf292.

A separate exact six-file import commit and independent unchanged-unrelated-path review remain required. Future final-source snapshot and all full-VV parts must use one accurately identified revision. SDK source-capture qualification, constructive proof compiler work and numerical/game promotion remain separate pending gates. No SDK/full-VV/product acceptance, repository publication or automatic improvement capability is inferred from native-baseline success.
