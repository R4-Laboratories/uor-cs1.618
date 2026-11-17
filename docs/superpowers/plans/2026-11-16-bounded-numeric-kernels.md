# Bounded Numeric Kernels Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Export complete bounded f32/f64 multiply/divide kernels and use their validated results in HD frame-budget sampling.

**Architecture:** Game-owned LexLean source uses fixed UInt32 limbs and bounded quotient generation. Exact generated roots compile to native and import-free Wasm with a status-preserving adapter. A persistent guest computes low-frequency frame-budget arithmetic while the existing renderer/Prism identity architecture stays intact.

**Tech Stack:** LexLean/PrismPM game SDK d6c263a7, Lean4.32.1, generated Rust, Wasm, TypeScript, Playwright, Python exact-integer oracle.

**Spec:** `docs/superpowers/specs/2026-11-16-bounded-numeric-kernels-design.md`

## Global Constraints

- Raw UInt32/UInt64 IEEE bits; round nearest/ties-even; gradual underflow and signed zero.
- First NaN operand wins and is quieted; invalid operations use positive canonical quiet NaN.
- Four UInt32 limbs, 128 bits; no arbitrary-width public format parameters.
- Preserve game SDK digest d6c263a733a6bc36e0458c3f5b9a1f5ea9c14dfbe8c257d3f650a960b5fe633c and every current guest/policy pin.
- Status0 success,1 unsupported operation,2 arithmetic failure,3 renderer-domain failure; no error-to-zero fallback.
- Preserve exact hidden production bundles and source/compiler/target/output hashes; distinguish proof, tested conformance and measured performance.
- Original UORust float guard remains unchanged; no upstream PRs in this phase.
- Do not pull the full Docker SDK locally on vfs. Isolated, hash-verified compiler components may support diagnostics within a measured disk budget (keep at least8GiB free); full acceptance still runs in the pinned SDK.

## Review Focus

- Rounding across smallest-normal/subnormal and halfway/carry boundaries: Task1/2 exact-bit oracle vectors.
- NaN payload/sign and signed-zero policy differing from host arithmetic: Task1/2 named-policy assertions.
- Checked conversion/carry/shift failure disguised as zero: Task1 explicit status and negative controls.
- JS i64 sign/precision or stale result status: Task3 BigInt and status-before-bits checks.
- Governor threshold/pin behavior on missing guest or delayed initialization: Task3 decision and diagnostic tests.

### Task 1: Fixed limbs and complete multiplication

**Files:** Create `prism/numeric/lexlean.toml`, `prism/numeric/src/Wide.lex.tex`, `prism/numeric/src/Float.lex.tex`, `prism/numeric/src/Bounds.lex.tex`, `model/numeric-kernels.json`, `scripts/numeric/build.sh`, `scripts/numeric/oracle.py`, `scripts/numeric/native.rs`, `scripts/numeric/wasm.rs`, `scripts/numeric/replay.mjs` and bounded test/evidence files beneath `prism/numeric/` and `artifacts/numeric/`.

**Interfaces:** Source roots `mul32(a: UInt32,b: UInt32)->UInt32` and `mul64(a: UInt64,b: UInt64)->UInt64`, with generated failure effects preserved. Source helpers/rounding are internal; record their final signatures for Task2. One production package per root. Wrapper `numeric_run(op:u32,a:u64,b:u64)->u32` uses op0 mul32,op1 mul64; `numeric_result()->u64` returns last successful bits only after status0. Invalid f32 high bits return status3. Task2 reserves op2 div32,op3 div64. Root argument/result signatures may use an explicit internal Option/status record if needed, but the wrapper contract is fixed and every failure propagates.

- [x] Register operation contracts and construct failing overflow/boundary vectors before implementation.
- [x] Verify a minimal fixed-record/checked-operation source and small bound theorem under the actual game SDK; document which statements are kernel-proved versus tested.
- [x] Implement four-limb exact significand multiplication and complete fixed-format IEEE special handling, normalization, rounding and packing in LexLean source.
- [x] Build actual roots through production export and full verification; discover emitted `run` signatures instead of assuming symbol names. Save all proof packages without copying SDK Cargo caches.
- [x] Compile emitted Rust to native/Wasm; run exact boundary vectors and at least10,000 seeded operand pairs per format against independent rational and native IEEE oracles. Check signed zero, payload policy, no imports and no error masking; retain the red/green receipts.
- [x] Commit the source, registered contracts, reproducible harness and compact evidence. Review before Task2.

### Task 2: Bounded division and shared rounder validation

**Files:** Modify `prism/numeric/src/Float.lex.tex`, `Bounds.lex.tex`, `model/numeric-kernels.json`, `scripts/numeric/{build.sh,oracle.py,native.rs,wasm.rs,replay.mjs}`; add operation-specific tests/evidence.

**Interfaces:** `div32(a:UInt32,b:UInt32)->UInt32`, `div64(a:UInt64,b:UInt64)->UInt64`; wrapper op2/op3. Consume Task1's canonical representation/rounder only after inspecting the actual report. Use bounded quotient/remainder recurrence, never old huge-Nat numerator construction.

- [x] Diagnose bounded exponent/comparison/iteration primitives through actual pinned LCNF and Rust codegen. Checked primitives pass; conversion dictionaries, helper specialization and higher-order iteration expose separate backend limits. Preserve these results; complete raw division with the already validated representation. Canonical repair is Task 2c.
- [x] Add failing exact-bit division vectors: zero/zero, finite/zero, infinity/infinity, tiny/huge, smallest-normal seams, signs and ties; include `1/1` that previously required160-bit intermediate in the old algorithm.
- [x] Implement fixed-format division with explicit per-step remainder/iteration bounds and sticky information carried into one rounding step.
- [x] Export/replay all four roots; run at least10,000 seeded division pairs per format and preserve multiply regression results after shared helper changes.
- [x] Record exact source/target hashes and proof/conformance scope; commit and review.

### Task 2c: Repair canonical export and adapt bounded source

Actual fixtures show primitive success but failures for generic conversion dictionaries and composed helpers; higher-order iteration and mathematical Int also need supported handling. This task precedes the bitwise comparison so it uses the final shared source.

- [x] Reproduce with exact canonical module staging; distinguish missing compiler artifacts or extraction setup from actual exporter defects.
- [ ] Repair the smallest confirmed exporter issue with a separately identified, reviewable source backport when needed. Retain the base SDK pin and all original guards; bind actual patched tool source/binary identities explicitly. Do not relabel a patched tool as the pristine SDK or weaken verification, error behavior, or time limits.
- [x] Add focused regression/negative cases for helper specialization and conversions; run the applicable upstream acceptance gates before admitting the tool change.
- [ ] Adapt internal exponent/comparison/loop representation to supported bounded source forms, preserving raw APIs, all IEEE policies, and explicit failures. Re-export/replay all four roots and the full corpus after source changes.
- [ ] Validate actual canonical extraction/code generation, retain proof/custody evidence, and independently review. Upstream PRs remain deferred; no canonical admission claim from raw-export success alone.

NEXP013 source-capture dependency is specified in `../specs/2026-11-16-candidate-source-capture-design.md` and decomposed in `2026-11-16-candidate-source-capture.md`. Execute it after the frontend identity/harness repair; its controls do not replace this task’s source/SDK/golden/corpus gates.

### Task 2b: Isolated bitwise multiplier comparison

User-requested follow-up: assess replacing word multiplication with bitwise operations. XOR/popcount alone computes different arithmetic; an exact shift/add limb product is the candidate.

- [ ] Isolate a source-owned bitwise shift/add product with explicit carry bounds; retain the reviewed production baseline and its evidence.
- [ ] Try the unchanged production export/certification gates; retain a precise refusal or timeout if export fails, without weakening limits.
- [ ] For successful exports, replay the same IEEE multiplication corpus and independent full-product controls, then measure native/Wasm cost and artifact sizes on identical inputs.
- [ ] Adopt only with exact contract parity and measured benefit; otherwise retain the baseline and publish the experiment result. No GPU/FPS claim or new unproved target primitive.

### Task 3: Measured rendering integration and Prism delivery

**Files:** Create `src/numeric-kernel.ts`, `scripts/numeric/benchmark.mjs`, `tests/numeric-kernel.test.ts`; modify `src/hd-budget.ts`, `src/world.ts`, `src/main.ts` diagnostics, their tests, package/artifact/Prism manifest generators as required by the actual generated package; publish the verified guest under `public/wasm/` with provenance.

**Interfaces:** `NumericKernel.meanMicros(totalSeconds:number,frames:number)` returns a tagged success with numeric value or explicit diagnostic; it calls div64 then mul64 with raw BigInt bits and 1e6 constant bits `0x412e848000000000`. `status()` exposes loading/ready/failed and last failure. Domain as spec; no caller reads stale bits after nonzero status. Benchmark reports initialization/warm/full-boundary timings for the same operations.

- [ ] Add failing exact-bit BigInt/unsigned-i64, invalid-domain, unavailable guest, error-status and threshold/pin tests.
- [ ] Implement persistent import-free guest loading with hash/provenance custody and a status-preserving host adapter; preserve required existing guests and identity/Holo behavior.
- [ ] Integrate at the existing three-second HD sampling boundary, preserving existing deadband and Verdant governor. Expose fallback in existing read-only diagnostics and one bounded console warning; no fetch/compilation inside render().
- [ ] Measure same-root persistent-vs-Text/1 boundary and host arithmetic; record counts, warmup, device/runtime and raw samples. Measure browser sampling cost; enforce a budget justified by the actual results, without claiming physical-GPU FPS improvement.
- [ ] Run renderer/objective/identity checks appropriate to the changed path; package through existing LexLean/PrismPM custody and commit. Review before final integration.

### Task 4: Acceptance, publication and follow-on register

**Files:** Update `docs/research/NUMERIC-EXPORT-TRACKER.md`, `numeric-export-issues.json`, numeric evidence/docs and required CI validation entrypoints.

- [ ] Run source/kernel verification, all admitted operation native/Wasm corpora, custody negative controls, game verification and changed-path browser gates on exact final content.
- [ ] Independently review the whole change; fix findings without weakening gates.
- [ ] Record completed raw-bit operations separately from unimplemented add/sub/sqrt/FMA/conversions and still-refused original UORust closures; retain upstream PR work for later.
- [ ] Publish reviewed game changes/evidence to the authorized repository, confirm Pages serves the intended build and autonomous continuation remains active. Do not create upstream PRs.
