# Numeric export investigation tracker

Snapshot: 2026-11-16. **Latest bounded-kernel and canonical-export status is in the follow-up below.** **Reviewed repair validated in the exact SDK on amd64; upstream merge remains open.** This tracker records reproduced failures and explicit closure criteria. The isolated eligibility guard passed independent review and full unchanged upstream acceptance in the exact SDK. Full float-root export and wide arithmetic remain open. No repaired UORust compiler is shipped in the game. The tested 0.9.0 game keeps its current guests, Rust adapter, binaries and upstream pins. A full floating-point rewrite is not a release prerequisite.

Evidence baseline: [Prism rendering investigation](PRISM-RENDER-MATH-RESEARCH.md), UORust `9d1f379676aa1099c4b88093608a37a66ba819f6`, LexLean `71defb4c663aaec5b9a3aab04cbc6a03e7106227`, PrismPM `f465664167bdaccef13c37921c057e49d0883126`; game SDK lock selects 0.3.0/image `sha256:d6c263a733a6bc36e0458c3f5b9a1f5ea9c14dfbe8c257d3f650a960b5fe633c`. Current checkout HEADs are not evidence that the pinned compiler was used. Repair results must record actual toolchain versions, commands, statuses and retained logs.

| ID | Status | Evidence / question | Acceptance for closure |
| --- | --- | --- | --- |
| NUM-001 | Confirmed bounded-production primitive overflow; full float root pending | UORust Prelude floatMul multiplies 53-bit binary64 significands as Nat; the differential evaluator uses arbitrary-size naturals while production Nat is checked u64. A product may need 106 bits. Follow-up source analysis identifies ordinary 1.0 × 1.0 as requiring 2^104 (105 bits), division intermediate 2^159 (160 bits), and sqrt search candidates reaching 325 bits; binary32 division/sqrt reach 73/153 bits. The to-u64 conversion of 1.0 constructs a 65-bit mask intermediate. These are observed examples, not universal bounds; u128 alone is insufficient. Follow-up exported the exact Nat significand multiplication through the pinned game SDK: kernel-checked package and verify-artifact replay passed; emitted source compiled with cached Rust1.97.1 to native and import-free Wasm returns Err(Overflow) for 2^52 × 2^52 and maximal binary64 significands. Binary32 multiplication/u64-edge controls succeed. This is explicit bounded overflow, not silent wrong bits; the full float root was not exported. | Reproduce a bounded representative float root through the actual compiler/export/replay; either reject unsupported intermediates explicitly or implement bounded limbs with evidence. Cover normal/subnormal/zero/infinity/NaN and rounding boundaries; retain failure before and success after any repair. |
| NUM-002 | Guard reviewed; exact-SDK amd64 acceptance passed | Mathematical model presence and sampled interpreter agreement do not establish generated package eligibility under the game SDK pin. Independent repair is in a separate UORust checkout. Current cumulative candidate `0e3472ed` (tree `aa5082ef`) ports the guard to upstream `b04af355`, with unchanged policy files and SDK pin. Its cached diagnostic LexLean binary SHA matches the game SDK lock, with Nat64 in the target descriptor; the production primitive probe passes package/replay but demonstrates checked overflow at execution. The current repair has 233 passing library tests, including direct/transitive/batched refusals, cached-artifact refusal and Prelude width tracing; 12 CLI and 16 repository-conformance tests also pass; independent review found no blocking defect. Model/error/deferral/dependency checks pass before the exact-SDK inventory gate rejects the cached game SDK. The guard refuses every reachable Prelude float helper conservatively, including potentially safe restricted cases; it is not a general numerical range analyzer. | Identify the exact supported exporter/compiler tuple, exercise minimal roots, report unsupported roots and diagnostics, and replay generated packages without weakening checks. Any pin upgrade needs separate review. |
| NUM-003 | Confirmed coverage limit | The inspected float adapter supports arithmetic/comparison/sqrt/FMA; its tables did not include sin/cos/tan. This is not evidence of all-language transcendental coverage. | Inventory supported methods with explicit reject cases; define finite domains/error or IEEE semantics before adding any transcendental implementation and test actual exports, not only the host evaluator. |
| NUM-004 | Confirmed ABI constraint; prototype pending | Text/1 encodes/parses/copies and uses a fresh instance per uncached request; JS Number cannot exactly represent every u64. It is not a built-in vector/matrix ABI. | Exact text/BigInt/byte boundary tests, malformed/range rejection, legitimate allocation/reset contract, measured cold/warm/end-to-end latency and memory. No speed claim from policy-only time. |
| NUM-005 | Confirmed semantics distinction | Verdant Wasm matrix path quantizes f32 to i32; tropical max-of-sums differs from Euclidean dot products. Names such as exact/BVH spec do not prove Three-equivalent culling. | Define coordinate/quantization bounds and conservative error margins, then compare actual classifications/transforms against an independent float oracle with explicit no-false-negative criteria. |
| NUM-006 | Proposed bounded prototype | Existing cs_lod is a finite rank policy with explicit host conversion. It is a feasible first LexLean kernel without general float rewrite. | Rank/pin/step proofs, exhaustive scalar parity plus threshold/invalid-input guest cases, generated root validation with the selected SDK, and comparative Text/1 vs persistent-engine adapter benchmarks. |

The detailed [current repair report](numeric-export/numeric-current-repair.md), [independent review](numeric-export/numeric-current-review.md), [portable patch](numeric-export/numeric-export-current.patch) and [machine-readable register](numeric-export/numeric-export-issues.json) retain reproduction commands and evidence. The guard fixes admission of unsupported roots in the validated candidate; it does not implement their arithmetic. A later policy-hash check also found the historical patch edited byte-bound `VERIFICATION.md`; current porting removes that packaging defect rather than changing the policy lock. Primitive checked overflow is a correct bounded failure, not evidence of silent corruption.

## Stable issue mapping

The original `NUM-*` research questions remain valid. The more detailed repair register uses `NEXP-*`; these are related records, not renumbered aliases:

| Research question | Repair records |
| --- | --- |
| NUM-001: intermediate bounds and actual failure | NEXP-002 wide arithmetic; NEXP-003 full root export; NEXP-004 diagnosed primitive overflow |
| NUM-002: exporter eligibility/toolchain | NEXP-001 fresh admission guard; NEXP-007 cached-artifact bypass; NEXP-008 generated-register repair; NEXP-005 exact SDK acceptance |
| NUM-003: transcendental support | Remains a separate feature/coverage question; no implementation claimed |
| NUM-004: Text/1 ABI, exact integers and overhead | Remains a separate integration/benchmark question |
| NUM-005: coordinate/quantization and renderer semantics | NEXP-006 CPU/GPU fidelity and performance |
| NUM-006: bounded LOD prototype | Remains a separate proposed experiment |

## Acceptance and next repairs

1. **Completed on amd64:** full unchanged `just vv` passed using the candidate's exact UORust SDK, preserving its locks and gates. The cached game SDK has 17 inventory differences and cannot substitute. The current pinned image `c1bfe8d5` is available but its amd64 layers total 5.38 GiB compressed, exceeding local free space before extraction. The [manual validation workflow](NUMERIC-VALIDATION-WORKFLOW.md) runs unchanged baseline and reviewed candidate through the full upstream gate, then separately runs the primitive export probe. Its [Actions results](https://github.com/R4-Laboratories/uor-cs1.618/actions/workflows/numeric-export-validation.yml) are the acceptance record; preflight is not a passing gate.
2. **Current port completed and reviewed:** cumulative candidate `0e3472ed` on `b04af355` uses UE-21, rejects fresh exports and previously certified float artifacts, preserves eligible integer/bit-only paths, and leaves universal policy/pins unchanged. Historical base `9d1f379` and its defective packaging are preserved separately in the [evidence index](numeric-export/). No upstream merge/release is claimed.
3. Design source-owned bounded limbs or a demonstrably bounded alternative for each supported IEEE operation; establish intermediate/resource bounds and exception semantics. Preserve subnormals, signed zero, NaNs and rounding. Do not simply replace u64 with u128.
4. Only then admit individual supported roots after full compiler export, native/Wasm replay, boundary/randomized oracle comparison and required proof gates. Keep unsupported roots refused.
5. Separately measure the Text/1 ABI and conservative culling error, then benchmark a bounded LOD policy against the current persistent engine. Numeric correctness alone cannot establish Three.js/GPU parity or better frame time.

GitHub currently allows access to upstream but denies pushing and fork creation (HTTP 403). The reviewed patch and evidence are preserved in this game repository; no upstream merge or release is claimed.

## Exact-SDK follow-up

[Run 43919280445](https://github.com/R4-Laboratories/uor-cs1.618/actions/runs/43919280445) established that the unchanged upstream baseline passes full `just vv` in the exact SDK. The candidate passed 233 library and 12 CLI tests, then UE-16 correctly rejected its stale generated lift register. The [reviewed generated-only correction](numeric-export/register-repair/register-repair.md), commit `0e3472ed`, regenerates five lines without changing any classification or acceptance gate. The focused UE-16 regression and subsequent full exact-SDK revalidation both pass. This acceptance blocker is NEXP-008, distinct from the preserved NEXP-007 cached-artifact bypass.

The corrected candidate passed validation in [run 43924585630](https://github.com/R4-Laboratories/uor-cs1.618/actions/runs/43924585630), dispatched from game commit `b7232d553e038ad89dd3ea4999d16ddbfa7df7f1`. Its manifest binds candidate tree `aa5082efb83d6fd38275d00aec404929fbe34d9c` and cumulative patch SHA256 `05a866911f5c6386ccf6665cb178471e039cae6a2da1b84a27033491affa33e3`. The full gate and subsequent primitive probe remain separate outcomes.

**Final result:** both unchanged baseline and corrected candidate passed full `just vv` on amd64. The separate candidate primitive export, binding replay and native/import-free Wasm execution also passed. [Actual receipts, logs and retained-output hashes](numeric-export/exact-sdk-accepted/README.md) bind these results to the reviewed manifest. NEXP-001/007/008 are validated repairs; NEXP-005 exact-SDK acceptance is passed for amd64. Wide arithmetic, full IEEE roots, ABI work, conservative renderer parity and LOD benchmarking remain open. The upstream compiler has not been merged/released or adopted by the game.


## Bounded kernels and canonical exporter follow-up

The separate game-owned `mul32`, `mul64`, `div32` and `div64` raw production roots
are implemented and reviewed. Their [retained receipt](../../artifacts/numeric-task2/receipt.json)
binds source, generated target, proof/replay bundles and actual import-free Wasm.
All 44,648 oracle pairs passed native/Wasm replay, including 10,000 seeded random
pairs per operation/format and named IEEE boundary policies. This is tested
conformance and recorded source/export preservation; it is not a universal IEEE
correctness theorem, admission of the original generic UORust closures, or a
canonical PrismPM Text/1 result.

Canonical admission remains blocked. The reconstructed compiler candidate is
retained as a [diagnostic Git bundle](../../scripts/numeric/compiler-candidate/README.md),
with [independent source review](numeric-export/recovery-2026-11-16/source-stage-review-634c2c5.md).
That review identified a P1 defect: pruning a closed conversion dictionary can
also erase an eager checked-overflow computation, including one hidden inside
an alias. The candidate must preserve that failure or refuse the dependency
before admission. The reviewed fix now passes the actual focused Lean, generated
native and import-free Wasm checks at optimization levels 0 and 2, using isolated
components whose Lean/Rust/Cargo binaries match the SDK. The [retained report](numeric-export/recovery-2026-11-16/source-stage-fix-2a13f94.md)
and [scoped review](numeric-export/recovery-2026-11-16/source-stage-round3-review-2a13f94.md)
record the exact scope. Full pinned-SDK source-stage acceptance and [final
independent review](numeric-export/recovery-2026-11-16/source-stage-final-review-2a13f94.md)
now pass. No production tool, SDK identity, guest or Pages build was replaced.

The earlier local compiler candidate was lost in an environment reset.
[Recovery notes and actual CI artifacts](numeric-export/recovery-2026-11-16/)
separate historical observations from newly executed checks. The first new run
built the compiler but failed some fixture/source gates; the second stopped in
test-tool setup. The reviewed diagnostic repair now runs independent focused
checks before supplemental preparation and preserves output/status on failures.
[Run 43973785776](https://github.com/R4-Laboratories/uor-cs1.618/actions/runs/43973785776)
passed every nonfocused gate but failed a fixture compilation check. Later exact
CI confirmed the next fixture error; both are retained and repaired. Final
[run 43978245009](https://github.com/R4-Laboratories/uor-cs1.618/actions/runs/43978245009)
passes all31 gates, both focused replays, and original SDK/tool/lock checks for
corrected source `2a13f942b04f0828e03c5d7db7e4db6ecb626d6e`; its generated diff is empty.

The [dual-authority implementation report](numeric-export/recovery-2026-11-16/backport-authority-report-2a31ad0.md)
and [scoped static review](numeric-export/recovery-2026-11-16/backport-authority-fix-review-2a31ad0.md)
record PrismPM candidate `2a31ad07`. Its local focused controls pass, while full
local validation failed and is not accepted. The same rebuilt verifier has now passed actual original-seed/candidate acquisition and retained-file replay in the unchanged SDK; [diagnostic run 43986399997](https://github.com/R4-Laboratories/uor-cs1.618/actions/runs/43986399997)
failed during host evidence writes after the three-project retained-reader completion marker. [Recovery43999834995](numeric-export/recovery-2026-11-16/backport-recovered-evidence-review.md) now supplies runner exit0, retained-reader success, ten passing authority controls and final unchanged-identity checks. Independent inspection confirms complete retained files and receipt bindings for the historical amd64 acquisition/reader subgate. The original workflow remains failed; the repaired harness rerun and full source VV remain separate. This is not SDK release or game production admission.

[Explicit dual-source acquisition and custody](numeric-export/recovery-2026-11-16/backport-selection-recon.md) preserves the original SDK seed as default. The fresh [repaired SDK run43999834837](numeric-export/recovery-2026-11-16/ci-43999834837/README.md) passes with complete retained inputs, all statuses zero and unchanged original identities. Bounded shared-source adaptation is [independently approved](numeric-export/recovery-2026-11-16/bounded-source-review-efd0fc8.md): four raw roots, sixteen helpers, all44,648 native/Wasm pairs and mutation controls pass locally. Canonical component roots and helpers also pass. Remaining admission requires full source VV, governed canonical library packaging in the unchanged SDK, and integration review.
Persistent rendering integration, the exact shift/add experiment and Text/1
transport benchmarks remain pending. [AQM research](VERDANT-AQM-INTEGRATION.md)
does not close any of these numerical/compiler questions; its first navigation
experiment did not justify a runtime import.

### Additional canonical target failures

[The target-type investigation](numeric-export/recovery-2026-11-16/canonical-type-recon.md) records two further open defects: NEXP-010 loses local numeric destination types, and NEXP-011 emits named fields for builtin Rust tuples. All four packed bounded roots extract and generate Rust, but native compilation refuses the emitted code. A minimal actual LexLean conversion fixture also refuses with E0790; no silently wrong numeric result was demonstrated. Typed source helpers and a named counter record are the next bounded application repair, subject to actual native/Wasm replay. They would not close the generic compiler defects.

The typed source checkpoint `453dc1bd` now passes all four canonical extraction/codegen/native and import-free Wasm paths, with all44,648 oracle cases passing and native output identical to the frozen corpus. [Retained component evidence](numeric-export/recovery-2026-11-16/canonical-typed-453dc1bd.json) records its scope: expanded helper/source verification has since passed and been reviewed; governed canonical packaging remains required, and NEXP-010/011 generic compiler defects stay open.

Full upstream source validation ran as [44002718718](https://github.com/R4-Laboratories/uor-cs1.618/actions/runs/44002718718), using all eight unchanged partitions and their original assembler. All eight partition jobs have completed: four passed and four failed; complete source acceptance is blocked. A green focused SDK job or local arithmetic suite does not replace that result. The next implementation packages each actual root using PrismPM native-library contracts; no new numeric guest or Pages release is enabled yet.


### Current blocking results

Actual canonical package run[44008985569](numeric-export/recovery-2026-11-16/ci-44008985569/README.md) failed all four builds with PP5007 generated-module timeout. Arithmetic and acceptance modules compiled, but verification and new-output replay did not run. NEXP-012 tracks this separately from the open generic type/tuple defects. The exact-runtime [local diagnosis](numeric-export/recovery-2026-11-16/canonical-laws-diagnosis.md) places the local bottleneck in Laws C emission after frontend completion; hosted internal phase profiling is not claimed.

Full-source run44002718718 has confirmed failures, not a pending clean result: stale fixture/emitter/shared-golden/native-recipe records, plus a wrapper-owned inherited Cargo setting rejected by a conformance owner. [Diagnosis and supported repair sequence](numeric-export/recovery-2026-11-16/full-vv-gates-diagnosis.md) retain the distinctions. A reviewed source preparation checkpoint exists, but genuine golden regeneration, native review and new exact-source acceptance remain outstanding. Original SDK pins, proof scope and time limits remain unchanged.

The proposed native-library frontend repair at source `d8f8d8a` now compiles the complete eight-module closure twice, passes eight pinned kernel checks, and reproduces both full exports byte-for-byte in a 45.14-second local component run. The actual component reader rejects 18 mutations. [Checkpoint report](numeric-export/recovery-2026-11-16/native-frontend-report-d8f8d8a.md) and [hash-indexed evidence](numeric-export/recovery-2026-11-16/native-frontend-d8f8d8a.tar.json) preserve this limited result. Independent source review identified and then verified fixes for schema publication compatibility and raw output accounting; the original failed SDK run remains failed. No numeric production admission or universal IEEE proof follows from these component tests.

[Reviewed fix `e1c32a64`](numeric-export/recovery-2026-11-16/native-frontend-review-e1c32a6.md) addresses the two frontend review findings: the new manifest admits the genuine source-backport receipt, and the runner enforces original cumulative byte limits separately for stdout and stderr. Focused publication/authority/resource regressions pass. The later [game-harness review](numeric-export/recovery-2026-11-16/frontend-harness-review-3126661.md) found an additional source/harness SDK identity mismatch, so diagnostic launch is now held: original PATH Lean and Lake are the same Elan launcher, while actual Lean is a separately identified binary; Cargo likewise uses a Rustup launcher. Source and harness repairs must bind both identities correctly before the unchanged-SDK run. Exact-source SDK packaging and baseline qualification remain pending.

NEXP-013 records another confirmed full-source blocker. OC-10 requires candidate source to already equal the unchanged SDK source tree, but transports only measurements and the test executable. The new source therefore fails before execution. The [boundary diagnosis](numeric-export/recovery-2026-11-16/full-vv-oc10-diagnosis.md) rules out copying a missing file into the SDK or weakening its identity check; a separately bound source transport contract is needed for unchanged-SDK coverage.

The [NEXP013 implementation plan](../superpowers/plans/2026-11-16-candidate-source-capture.md) records complete source transport through a staging writer that retires before read-only execution, original capture controls and an independent evidence reader. The [design](../superpowers/specs/2026-11-16-candidate-source-capture-design.md) preserves the old route and SDK identity. Implementation and actual qualification are pending; this plan is not a passing gate.

The [c2139afa source fix review](numeric-export/recovery-2026-11-16/native-frontend-review-c2139af.md) confirms that the producer now binds actual Lean separately from its launcher. It found one remaining retained-reader caller regression: the new required inventory argument was not threaded through `checkAccepted`. That fix is in progress, including a separately identified developer-build reader so the required source conformance test remains supported. The [local process-owner diagnosis](numeric-export/recovery-2026-11-16/process-owner-host-diagnosis.md) also records this host’s missing procfs child list; cleanup tests still require actual hosted execution. Current checkpoint code is work in progress, with diagnostic launch and production admission held.

The [final source reader review](numeric-export/recovery-2026-11-16/native-frontend-review-324955b.md) and [game harness fix review](numeric-export/recovery-2026-11-16/frontend-harness-review-b49274a.md) now pass. The source checkpoint is `324955b6`, captured independently with its exact tree and generator identities. The harness distinguishes SDK launcher and underlying tool roles, binds original inventory and file measurements, and passes 14 focused tests plus 21 restoration controls. This restores readiness for a fresh four-package SDK diagnostic and genuine shared-golden preparation. Full source/VV/native-golden, actual SDK outputs and downstream corpus/admission remain pending; NEXP013 source capture is still planned rather than implemented.
