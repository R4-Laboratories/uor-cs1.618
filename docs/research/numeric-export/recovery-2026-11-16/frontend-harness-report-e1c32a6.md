# Task2c-B2D frontend preparation and canonical harness

Status: **DONE for local implementation and preparation checks; independent game review required.** Implementation commit `1907cb647d619e61a8013f5e16d31df398c32670`, original task base `1ecb5826109e24d9c00f9e50d16a0c95da277445`. Parent documentation/evidence commits advanced HEAD before this implementation commit; they are outside this implementation. No source/upstream edits, subagents, push, Docker SDK execution, golden generation/import, SDK/compiler/kernel/policy pin change or production admission occurred. Source remains clean at reviewed `e1c32a64fd2a99b438341267e9d005e559ae2506`.

## Captured identities and preserved history

Both shared golden preparation and canonical orchestration now restore the same separate `scripts/numeric/prismpm-preparation-candidate` capture:

| Item | Identity |
| --- | --- |
| Source base | `3666dc0f9da56fcf066d96ec01cd9e14ec9a2974` |
| Source candidate | `e1c32a64fd2a99b438341267e9d005e559ae2506` |
| Source tree | `429f6a4e309b9dd52aed254efea60e701f006ab3` |
| Complete Git bundle SHA-256 | `6c8e2f5459ae40b3c41cf2ed0b6544f590ca2937fec0d7597af645052eed4c8b` |
| Binary review patch SHA-256 | `5f9073b4c47a62ac5aba37ab776e75828b8be6d2a1647876335f2684ce3e9b19` |
| NumericTask2c library generator | `14c579781935bd4d27a482830eb2233d17274b10a9a29afc3a6e746a94a20f03` |
| Released library generator | `d1d8d00dfe7e69c63004c64fb993c36882e1ffc4a2e7714e0b8cacb4b56fa308` |
| Source-owned frontend reader SHA-256 | `82c24398e4d8861d4abbc2b6624957b4462fb6fdd6f32e4c09d39227b7dc213e` |
| Imported runtime registry SHA-256 | `c213f89ffe649a50d162d65c4fe010475963549b4e30701a722c20261b72c97e` |

The generator values were independently measured from the reviewed actual Rust recipe: versioned `/3` prefix, three u64-big-endian-framed source-authority fields, then all twelve ordered source-owner paths/NUL/length/bytes. They were not merely copied as approval by hash. The independent source review remains the authority for that recipe.

The refreshed preparation path previously captured source `f6776fca7c9f675b3bb762ddaf88d256aad3d77f`, tree `4bf2b2ee620c50c6d3ea13011fa4f8c0af6d24a9`. Those immutable bytes remain reachable in game commit `27619a53a37b96f67bf5bffc60942c5a2175aea5` and subsequent history. The controller explicitly confirmed that the newer sole brief authorizes refreshing this separate preparation path after source review; the earlier source report's pre-review warning does not require a duplicate historical directory.

Historical accepted `scripts/numeric/prismpm-candidate` remains source `2a31ad07fd0b3ea0ef63f22f165d98e310eb89ec`. Its bytes, fullVV workflow/helper and trigger paths are unchanged relative to the task base. No accepted snapshot refresh or queued global Cargo-jobs change was performed. Compiler `2a13f942...`, immutable source `3e58e371...`, typed arithmetic source `453dc1bd...`, original unchanged-d6 SDK digest and SDK lock remain unchanged. Only diagnostic `inputs.json.verifier_revision` changes to the new preparation source; copied fixture/kernel hashes remain fixed.

## Implemented boundary

`packages.py` selects current library verification `/3`, library owner `/2`, frontend `/1` and stable source plan `/1`. It binds the complete build file set and byte lengths, reviewed numeric generator, model/acceptance roots, full declared source audit including erased proofs, exact native artifact set including `library/frontend.json`, both original owner phases, native preflight/tool measurements, dynamic frontend/tail sequence, original top-level replay window and std/no_std result transcripts. Every original source-backport acquisition field retains its explicit compiler/archive/descriptor/inventory/SDK-lock/toolchain/platform pins; both actual child identities must agree.

The small `frontend-reader.mjs` adapter imports only source-owned `validateFrontend`, `bindFrontendSources` and `frontendSourcePlan`. It checks actual original generated source bytes/import headers, complete project/runtime closure, dependency-ready order, exact Lean argv/environment/profile/tool identities, all five nonempty companion bindings and both phase projections against canonical stable plan bytes. The complete executable reader source closure is exactly the source-owned module plus its imported runtime registry; native Node builtins add no repository source dependencies. Both files are pinned, checked before/after reading and retained as original bytes, alongside the game adapter/pins/helper. No caller-selected replacement runtime registry is admitted.

Each separate reader invocation records argv, reviewed source/tree and closure identities, adapter/Node identities, exit code and bounded diagnostics. Missing repository identity and reader timeouts fail closed. Game custody refusals, source-owned frontend-reader refusals and actual original CLI proof/verification are distinct. The fixture-specific `library-sdk-check.checkAccepted` is not called or presented as numeric qualification; its owner checker routes through a cold/sdk-seed-only exporter reader and cannot directly validate NumericTask2c acquisition/2.

The original four actual build+verify CLI flows, normal LexLean lock/format preparation and 44,648-vector exact native/import-free Wasm replay are preserved. After each future successful selection, a new `controls` phase clones that selected bundle and runs 15 reader/custody mutations: profile, environment, Lean tool, missing Bounds, missing runtime, missing companion, module order, source plan, phase order, phase role, archive, replay child identity, roots, artifact set and generated source bytes. It reseals affected verification JSON selection identities, records the refusing owner, then reselects the untouched original. It does not pretend to rerun failing proof commands. Retention requires completed bound control records and all phase statuses. Original bounded archive/log/status fallback behavior remains; source/tool/verifier/copy identities are checked again on exit, including failed runs.

The shared writer/checker command sequence, source devcontainer boundary and honest `complete-review-required` state are unchanged. Only fixed preparation revision/tree change there. Canonical trigger additions are limited to its selected preparation capture and restorer. The canonical host checks the existing 8-GiB reserve before SDK work; local checks ended with approximately 13 GiB free.

## Executed checks

Evidence root: `/workspace/diagnostic-tools/frontend-harness`; `evidence-index.json` records source/provenance and file hashes. Final logs are `canonical-tests-final.log`, `golden-preparation-tests-final.log`, `actual-component-reader-final.log`, `restoration-final.log` and `generator-identities.json`. Earlier setup failure logs remain; the first manual prepare invocation omitted the explicit snapshot argument and correctly failed at its workflow-relative default path. The corrected absolute-snapshot invocation passed; no guard was relaxed.

- `PRISMPM_READER_SOURCE=/workspace/scratch/prismpm-numeric PRISMPM_SOURCE=/workspace/scratch/prismpm-numeric python3 -m unittest discover -s scripts/numeric/canonical -p test_packages.py`: **12 passed, 0 skipped**. These are explicitly synthetic selector/retention fixtures executed through the actual pinned source-owned reader, plus real frozen fixture staging. The prepared 15-control runner is exercised with synthetic project sources and authoritative pinned runtime metadata. Coherently mutated phase copies/top-level windows reach the real source-owned reader for profile/environment/companions/order/source-plan/missing-module refusals; retained reader-registry tampering is a separate game custody refusal. No synthetic successful SDK bundle is claimed.
- `PRISMPM_TEST_SOURCE=/workspace/scratch/prismpm-numeric python3 -m unittest discover -s scripts/numeric/tests -p test_golden_preparation.py`: **21 passed, 0 skipped**. Includes a new full-history disposable restoration, exact source/tree/bootstrap source preflight and candidate/tree/source/base/bundle/patch tamper refusals; existing writer/checker order and incomplete/identity/log/bounds controls remain.
- Source-owned `node scripts/library-frontend-component-replay.mjs /workspace/diagnostic-tools/native-frontend-implementation-final /workspace/diagnostic-tools/laws-investigation/no-c`: **accepted original preserved component captures and refused all 18 mutations**. This replays earlier actual d8 component measurements, using unchanged reader/runtime bytes from reviewed e1. The five retained project module bytes were independently matched to the original receipt before replay. It reports eight modules/eight previously measured kernel checks/two byte-identical preserved exports. No new Lean compile, new exporter run or SDK verification was performed by this replay.
- Separate manual clean base-to-e1 restore and `bootstrap-verify.sh --check-source`: passed. Bootstrap source `f378fd3a8dc5711cb4b22cec9ee2f874353628c3` is available; this is source preflight only, not full bootstrap verification.
- Default no-source test invocation also passes, with **4 explicit canonical skips / 1 preparation integration skip**. These skips are not counted as source-enabled evidence.
- Python compilation, `bash -n` of SDK runner, `node --check` of adapter: passed. `git diff --check` excluding the exact stored `candidate.patch` transport: passed. The unrestricted check flags twelve literal single-space context lines inside the nested binary review patch; changing them would invalidate its independently checked transport digest, so its exact bytes are preserved.
- Diff against original task base for accepted snapshot/fullVV workflow/helper: empty. Source worktree remains clean; no unrelated recovery/working directory was staged or changed.

## Pending genuine gates and interface limits

Independent game review is next; controller alone owns push/hosted launches. Genuine shared/source/native golden writer/readback outputs and required full source VV are pending. The original failed SDK run `44008985569` remains failed evidence; these host checks do not repair or supersede it. The separately diagnosed OC10 SDK-conformance-root/current-source incompatibility is outside this task and untouched.

After review, controller must launch unchanged-d6 actual build+verify for all four packages with both genuine owners, full LexLean kernel/declaration/axiom audit, exact regeneration and std/no_std acceptance; execute the prepared reader/custody controls against those newly selected actual outputs; then run exact native/import-free Wasm corpus and mutation/None/status controls. No actual new SDK artifact, reader-control result over those artifacts, golden import or downstream admission is claimed here.

This composed reader is not a generic source-free numeric/product admission interface. It binds retained frontend structure/source bytes and the live harness's original explicit authority measurements; it cannot manufacture independent producer authenticity from arbitrary resealed success receipts. In particular, its child control changes the replay phase relative to the original controller phase. It does not establish refusal of a coherent fabricated child identity substituted everywhere, nor independently replay unavailable transient compiled companion files.

If a later task requires fuller source-owned retained numeric acceptance controls, the concrete missing interface is a source test-only composition entry point accepting the actual selected build/verified closure plus independently captured original producer/SDK authority. It must call crate-private `exporter::owner::validate_record(value, model_sha256, "library")` and `validate_binding(value, model_sha256, "library", lex_manifest, artifacts, processes, exporter_arguments)`, full source-owned generated-source/model/attestation validation and NumericTask2c `validate_acquisition_authority`, while binding the original measured exporter child/archive/descriptor/lock/inventory and transient custody at capture time. A fixture-root/cold-seed `checkAccepted` call or a successful process-shaped JSON object is not that interface. Such future work must preserve producer evidence and refusal ownership; no concurrent source patch was made here. Application/Holo/browser/render/product and universal arithmetic claims remain unclaimed.

## Game fix round 1 — original SDK launcher and actual-tool roles

Implementation checkpoint: `a334ccd8b8e6171438ea1d10d0b7eebadac56916`. Fix task base `95c9ffec9939dfbfc89fa1b2e1aced81c01b1a60`; parent documentation-only work advanced HEAD before this checkpoint and is outside its owned change. Read the authoritative fix brief and original game review P1/P2, plus the source round-two/round-three reports and independent reviews. Game P1 is addressed by this checkpoint; source P2 and complete public reader authority threading are supplied by independently reviewed source `324955b6923c1d194d7bc870a2d2a05eb687048c`. Independent scoped game review remains required before launch. No source edit, subagent, Docker SDK pull/execution, push, golden output/import, arithmetic change or acceptance claim occurred.

The previous synthetic fixture incorrectly collapsed PATH Lean and actual Lean, while package rows used its underlying Cargo hash. This allowed passing host tests to miss the real SDK's Elan/Rustup process identities. The corrected fixture uses the genuine d6 identity relationships and the game capture now preserves their producer meanings:

| Role | Original linux/amd64 identity |
| --- | --- |
| PATH Lean and PATH Lake launchers | `840179e70803ef373c2ec53342d6a45ea7d022533e4145489fc1278b4f716385` |
| Actual Lean artifact | `e8baaa71855a616dc351028f3ad2200051b0671f423a1696a100e809302d5550` |
| PATH Cargo / Rustup launcher | `4acc9acc76d5079515b46346a485974457b5a79893cfb01112423c89aeb5aa10` |
| Separately measured underlying Cargo | `828980723df339d62434390e9fb8ef8831036583343ae2316b7ab5646b5c1953` |

`native-tools.json` now uses closed schema `cs1618/numeric-native-tools/2`, with five explicit roles: Lean/Lake/Cargo launchers and actual Lean/Cargo. It records selected path, resolved path and measured SHA-256 separately. The harness retains the exact original native inventory bytes, checks their digest and byte equality against the unchanged linux/amd64 lock entry, and checks command identities/paths against its original command rows. Actual frontend Lean binds the separate unique `lean`/`binary`/`4.32.1` artifact and fixed SDK toolchain path. Underlying Cargo has no separate inventory artifact: it remains an independent original file measurement, not a substituted inventory identity or a process-row expectation. All five role measurements bind to the separately captured original file-hash list; the actual-tool paths retain the original SDK toolchain locations. Input bounds and closed-field checks apply to the tool capture/inventory/original hash list.

Original `lean-version` and `lake-version` process rows now compare to the measured launchers; their legitimate equal Elan identities are permitted. Frontend rows still compare to the distinct actual Lean artifact, while `launcher_sha256` binds the original PATH Lean. Export/build rows retain Lake launcher authority; native package rows now compare to PATH Cargo/Rustup. The SDK runner's initial/final file checks cover both launcher and actual roles, the original and retained inventory, the reader closure and the new capture. Retained negative-control clones copy all original authority inputs, rather than dropping the independent inventory/hash measurements. No PATH, inventory, SDK lock, marker, toolchain or source process semantics were changed to satisfy the harness. There is no source-bootstrap authority fallback in the actual game SDK path.

Both canonical and shared-golden preparation now restore only the newly reviewed source capture:

| Item | New measured identity |
| --- | --- |
| Source candidate | `324955b6923c1d194d7bc870a2d2a05eb687048c` |
| Source tree | `7cf463121cf5dd15b681ce1dfafd5694617cc474` |
| Bundle SHA-256 | `0e6e0a5fb250f6c6ca236b34d7ee953d1bf22a25145876e5b1a970658376a17e` |
| Binary patch SHA-256 | `e811bbcb73d32e47c9ef774f33bdd38a46fb6841bf5c1f6837c2b1d485af3bef` |
| NumericTask2c library generator | `00d95a8cc337bc296697c939302929bcefe4e3b9168e6bf577c3682027aa9975` |
| Released library generator | `8a470816a73d944270709ee8d96a95bc4f2ac442715c051c294534c29f5a3992` |
| Generic frontend reader, unchanged | `82c24398e4d8861d4abbc2b6624957b4462fb6fdd6f32e4c09d39227b7dc213e` |
| Runtime registry, unchanged | `c213f89ffe649a50d162d65c4fe010475963549b4e30701a722c20261b72c97e` |
| Source fixture SDK reader | `acfe01a9cd0cdacf0879f83e63a3f327c3751297baef0078b6142be112adc95b` |

The full binary diff and complete bundle were captured from the verified clean approved commit/tree, against unchanged base `3666dc0f9da56fcf066d96ec01cd9e14ec9a2974`. Both generator identities were independently reconstructed from the actual source `/3` framing recipe and all twelve measured source owners. The fixture SDK reader hash is recorded for source provenance; that reader remains outside the game's generic frontend reader closure and is not called as numeric source-backport qualification. Previous e1 and f677 preparation captures remain in immutable game history; accepted `2a31`, fullVV, compiler/arithmetic/SDK/policy pins and game `3e58` ancestry remain intact.

Evidence root: `/workspace/diagnostic-tools/frontend-harness-fix-1`. `commands.json` records exact argv/cwd/environment overrides, exit codes and output byte counts for all eight focused final commands. The corresponding logs, independently reconstructed `generator-identities.json`, `checkpoint.json` (including all twelve source-part lengths/hashes and reader/capture identities) and `evidence-index.json` retain provenance. All eight final commands exited **0**:

```sh
# Cwd: /workspace/scratch/cs-numeric-kernels
PRISMPM_READER_SOURCE=/workspace/scratch/prismpm-numeric PRISMPM_SOURCE=/workspace/scratch/prismpm-numeric python3 -m unittest discover -s scripts/numeric/canonical -p test_packages.py
# 14 tests passed, 0 skipped; canonical-tests.log
PRISMPM_TEST_SOURCE=/workspace/scratch/prismpm-numeric python3 -m unittest discover -s scripts/numeric/tests -p test_golden_preparation.py
# 21 tests passed, 0 skipped; preparation-tests.log
python3 -m py_compile scripts/numeric/canonical/packages.py scripts/numeric/canonical/test_packages.py scripts/numeric/golden-preparation.py
bash -n scripts/numeric/canonical/sdk-run.sh
node --check scripts/numeric/canonical/frontend-reader.mjs
git diff --check -- . ':!scripts/numeric/prismpm-preparation-candidate/candidate.patch'
git diff 1ecb5826109e24d9c00f9e50d16a0c95da277445 -- scripts/numeric/prismpm-candidate .github/workflows/prismpm-backport-full-validation.yml scripts/numeric/full-source-vv.py scripts/numeric/canonical/replay.py scripts/numeric/canonical/replay.mjs prism/prismpm.lock prism/numeric/src
# Last command emitted zero bytes: historical accepted gates/replay/lock/arithmetic unchanged.

# Cwd: /workspace/scratch/prismpm-numeric
node scripts/library-frontend-component-replay.mjs /workspace/diagnostic-tools/native-frontend-implementation-final /workspace/diagnostic-tools/laws-investigation/no-c
# Original preserved component captures accepted, 18 mutations refused;
# actual-component-reader.log; SDK qualification remains pending.
```

The new SDK-role regression has one positive and thirteen negative cases, covering exchanged preflight/frontend/package roles, swapped captures, changed launcher/actual/original-file measurements, underlying Cargo mutation, changed inventory artifact, missing tool role, old schema and foreign lock. The positive has Lean launcher == Lake launcher, actual Lean != either launcher and Cargo launcher != actual Cargo. Both original phases and their retained replay window carry those meanings. These current build/verification trees remain explicitly synthetic; source-enabled execution uses the genuine pinned generic frontend reader and preserves the separate refusal ownership.

A second new provenance regression reads actual historical evidence: application archive `artifacts/numeric-task2c/ci-43999834837/14293331679/retained-reader-inputs.tar.gz` (SHA-256 `01628c3ad261b8de86cb6bd4037cb9fd0ab39bd118d91a1de5e55b0e76a9fe23`) and its exact manifest `6e66531b8c58c603a37c94243a7b83a8358711f34f150a37b2e5be0a4f6688b6`, plus `artifacts/numeric-task2c/ci-44008985569/canonical-small-logs.tar.gz` (SHA-256 `cc23e217327abc1c1e83fea121a898f3aa33a8ea244496378dd0968f95dd0e2c`). It checks both actual application package rows' Rustup identity, original Lean/Lake process identities and independently retained actual Lean/Cargo file measurements. This establishes original SDK identity shape only, not new numeric verification. It is explicitly skipped when its historical reference artifacts are absent; none of the 14 source-enabled local tests was skipped.

The 21 preparation tests include a fresh immutable approved-source restoration, exact tree, bootstrap source-availability preflight and candidate/tree/source/base/bundle/patch tamper refusals. Existing writer/checker order, original-log, identity and incomplete-proposal controls remain. The actual-component replay reuses historical d8 native measurements with unchanged generic reader/runtime bytes from source324; it performs no new Lean compilation/export/SDK work. Full `git diff --check` still sees literal context spaces in the byte-exact stored patch, which is intentionally preserved. Scoped whitespace and syntax checks pass. Source remains clean and approximately 11 GiB remains free, above the 8-GiB floor. Untracked recovery/working was not staged or changed.

Pending: independent scoped game review; genuine source/shared/native goldens and full source VV including DK-17; original hosted process-owner controls (the earlier local procfs prerequisite failures remain failures, not passes); unchanged-d6 actual four-package build+verify with full original owners/kernel/declaration/axiom/regeneration/std/no_std evidence; reader mutations over those newly selected actual bundles; and exact 44,648 native/import-free Wasm corpus, mutation/None/status checks. The original failed SDK run and separate source/conformance-root diagnosis remain intact. Earlier producer-authenticity and transient-companion/interface limits remain explicit: neither a successful frontend reader nor coherent success-shaped receipts establish generic source-free numeric/product admission. No source-bootstrap conformance mode or synthetic SDK fixture substitutes for the game's actual SDK gate.
