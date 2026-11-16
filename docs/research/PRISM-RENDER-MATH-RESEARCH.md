# Prism rendering math feasibility — read-only investigation

2026-11-16. Scope: inspected source and compiled-module metadata; no product edits, dependency changes, builds, proof audits, timing benchmarks, or GPU/browser runs. This report is the only new file. References below use absolute paths and line numbers. Working trees may be under concurrent development; conclusions describe the inspected snapshot.

## Decision

**Keep Three.js as the browser renderer. Prism can own bounded integer rendering decisions now; it cannot compile the whole Three.js JavaScript library unchanged into the existing Wasm.** The best next experiment is the existing LOD recommendation policy expressed as one bounded LexLean function, checked against the current `cs_lod` implementation, then measured through both Text/1 and a generated-Rust integration. Projection/culling should follow only after explicit floating-point or fixed-point fidelity requirements are chosen.

“Prism SDK math” has three distinct meanings here: generated integer policy functions already integrated into Verdant; LexLean mathematical models and checked integer production; and UORust's newer integer-bit-pattern model of IEEE arithmetic. None is evidence that all browser rendering has become verified or faster.

## Prioritized findings

### 1. There are already two different Wasm execution boundaries

- `/workspace/cs1.618/shared/engine.ts:37` instantiates `cs_verdant.wasm` once and holds the instance. Its functions expose numeric arguments, geometry JSON and copied pose buffers (`:7`, `:15`, `:27`). Native Rust `f64` is present in `/workspace/cs1.618/crates/cs-verdant/src/lib.rs:49`, and `cs_lod` accepts `f64` frame time at `/workspace/cs1.618/crates/cs-verdant/src/scene3d.rs:93`.
- `/workspace/cs1.618/shared/round-kernel.ts:7` compiles a Prism Text/1 guest, creates a fresh instance for each uncached request (`:12`), encodes text, copies it into memory, unpacks an i64 response pointer/length, and caches a small finite decision domain. The 32-byte response guard at `:18` is a host limit, distinct from the application's declared response cap.
- Direct Node module inspection during this research found `cs_verdant.wasm` **261,647 bytes, no imports, 25 exports**, including memory and `cs_*`; `cs_round.wasm` **2,558 bytes, no imports, exactly memory/holo_alloc/holo_run**. No runtime performance was measured.

Thus “run directly in the current compiled Wasm” requires a rebuild with the new function exported, or a separate guest invoked by the host. It is not an operation that injects LexLean definitions into an existing binary. Generated Rust can be linked into the engine, as upstream already demonstrates, with provenance and adapter validation retained.

### 2. Text/1 is suitable for small decisions; it is a poor default for vertex batches

The current round model declares request maximum **112 bytes**, response maximum **64 bytes**, guest allocation maximum **224 bytes**, profile `prismpm/text-application/1`: `/workspace/cs1.618/prism/app/src/CsRound.lex.tex:252` and its generated `.prism/build/3b66383a3d163668aae5e2d60725c77af763d6194aaf978f3869cfe621713620/model.prism.json` application fields. These are application limits, not universal Wasm limits.

Upstream `/workspace/upstream/prismpm/SPEC.md:326` defines the byte-request root, bounded responses and acceptance vectors; `:343` requires valid UTF-8 responses. There is no built-in Three matrix/vector numeric ABI in Text/1: the application must define parsing, numeric representation and formatting. JS Number cannot carry every u64 exactly; large integers require exact text/bytes/BigInt handling, even though Wasm's packed i64 return is handled as BigInt.

The SDK runtime explicitly creates a new instance per request because allocation is monotonic: `/workspace/upstream/prismpm/sdk/npm/prism-code/src/core.mjs:1`, `:50`, `:56`, `:73`; it also copies request and response bytes. Compile caching avoids repeated compilation, not repeated instantiation, memory initialization, encoding, parsing, or copying. Neither their magnitude nor a speed advantage was measured here. Do not reuse a Text/1 instance forever without a legitimate allocator/reset contract.

Current upstream Text V1 defaults are 32 memory pages (2 MiB) and 65,536 stack bytes. V2 permits explicitly modeled memory/stack budgets; the allocator remains cumulative (`/workspace/upstream/prismpm/SPEC.md:448`). Upstream session worlds reuse an instance through a different contract (`/workspace/upstream/prismpm/sdk/npm/prism-code/src/index.mjs:279`); that is not an automatic Text/1 upgrade or proof that today's pinned SDK supports it.

Both application and Verdant lock files currently select SDK **0.3.0**, image digest `sha256:d6c263a733a6bc36e0458c3f5b9a1f5ea9c14dfbe8c257d3f650a960b5fe633c` (`/workspace/cs1.618/prism/prismpm.lock`, `/workspace/upstream/verdant-engine/prismpm.lock`). New upstream capabilities must be checked against this pin before adoption.

### 3. Mathematical float models exist, but are not a ready native float production library

LexLean has no floating-point type. Its documented IEEE bit decoding yields exact dyadic rationals and bounded scale-ratio computations, not general native IEEE operations: `/workspace/upstream/lexlean/SPEC.md:3610`. Prism stdlib explicitly excludes floating point (`/workspace/upstream/prismpm/SPEC.md:908`). Production maps Nat to checked u64 and Int to checked i64; overflow is explicit, and foreign functions/float operations are outside that calculus (`/workspace/upstream/lexlean/SPEC.md:4521`). A theorem about unbounded naturals or real arithmetic therefore needs bounds and rounding assumptions before application to machine graphics.

**Important positive finding:** UORust carries a richer bit-pattern model in `/workspace/upstream/UORust/crates/uorust/assets/project/src/Prelude.lex.tex:1268` and `:1308`. Its MIR float adapter documents nearest/ties-even arithmetic and NaN policy (`/workspace/upstream/UORust/crates/uorust/src/mir/float.rs:1`), maps arithmetic, comparisons, square root and FMA (`:151`, `:190`), and contains differential tests against host floats (`:234`, `:815`, `:1024`). The listed intrinsic/method tables do not include sin/cos/tan.

This is a useful specification/oracle lead, **not demonstrated deployable binary64 math in the current guest**. The test evaluator implements arbitrary-size naturals (`float.rs:242`), whereas `floatMul` multiplies significands as Nat (`Prelude.lex.tex:1311`): two 53-bit binary64 significands can require 106 bits, exceeding the production u64 representation. Export eligibility, intermediate bounds/limb arithmetic, generated package replay and actual Wasm behavior must be established. No such export or replay was run here. Comments asserting IEEE semantics and sampled host differential tests are not universal proofs of equivalence to JavaScript or GPU execution.

UORust ingests Cargo/Rust, not JavaScript (`/workspace/upstream/UORust/README.md:23`). Its certified translator tracks particular root identities and refuses changed/unbuilt roots (`/workspace/upstream/UORust/crates/uorust/src/certify.rs:5`). It is not a route to recompile Three.js unchanged.

### 4. Upstream Prism kernels are genuinely used, but their names do not prove renderer equivalence

`/workspace/upstream/verdant-engine/scripts/sync-prism-kernel.mjs:1` synchronizes generated package output into the engine; `:75` shows source adaptation, including namespace/allocator spelling and integer rewriting. This is a concrete integration precedent, not byte-identical direct reuse of every original generated file.

Examples include generated `computeHostCeilingExcess` (`/workspace/upstream/verdant-engine/crates/verdant-tensor/src/prism_kernel.rs:2562`), LOD envelopes (`:16287`) and LOD transition predicates (`:20955`). `kernel2TropicalBvhCull` at `:21221` constructs a **TensorKernelSpec record**; that particular function does not cull a scene.

Actual transforms occur in separate Rust: `/workspace/upstream/verdant-engine/crates/verdant-tensor/src/linear.rs:17`. Its native branch uses `gemm_float`, while its wasm32 branch quantizes floats into i32 (`:53`), accumulates through `dot_ref` and rescales. That entails quantization and possible saturation at casts; the function name “exact” is not evidence of equality with Three.js's sequence of binary64 operations. Actual tropical support at `/workspace/upstream/verdant-engine/crates/verdant-tensor/src/tropical.rs:93` computes max-of-sums, which cannot simply replace ordinary Euclidean plane-dot-point tests without a mapping theorem. Three's existing box test is in `/workspace/cs1.618/node_modules/three/src/math/Frustum.js:221`.

### 5. Reuse Three.js; separate CPU math, browser APIs and GPU shaders

The application pins Three **0.181.1** (`/workspace/cs1.618/package.json`) and already includes its MIT notice (`/workspace/cs1.618/docs/licenses/three-MIT.txt:5`): use, copy and modification are allowed, with notice retention for copies/substantial portions. Retaining the dependency and extracting narrowly needed CPU algorithms are both feasible; rewriting the renderer adds compatibility and maintenance work with no measured benefit here.

`/workspace/cs1.618/src/world.ts:37`, `:61`, `:206` create cameras/WebGLRenderer and render the main/weapon scenes. `/workspace/cs1.618/src/hd-layer.ts:16` uploads engine-generated geometry into Three buffers/materials. These host operations and shader execution remain outside an import-free math guest. The guest cannot independently call WebGL, acquire a canvas or submit GPU commands. It can compute data or command descriptions; JavaScript still performs authorized browser API work. Moving transforms from GPU shaders onto a CPU Wasm loop can increase transfer/work rather than help, and must be measured.

A proof of an integer policy is distinct from a proof of floating-point evaluation order, shader equivalence, driver behavior, visual fidelity or frame rate. LexLean itself distinguishes kernel verification from build/conformance evidence (`/workspace/upstream/lexlean/VERIFICATION.md:31`).

## Concrete bounded next prototype

**One LOD policy function, no renderer rewrite.** Port the decision at `/workspace/upstream/verdant-engine/crates/verdant-core/src/runtime.rs:1340` into LexLean with explicit inputs: rank 0..4, integer elapsed microseconds 0..1,000,000, pin Boolean, fixed 60 Hz budget 16,666 microseconds. Reuse/model existing generated max-rank and budget definitions (`/workspace/upstream/verdant-engine/app/src/Subsystems.lex.tex:505`, `:752`). Keep host conversion explicit: existing `cs_lod` truncates nonnegative finite f64 time to u64 (`scene3d.rs:108`).

- Output rule: pinned preserves rank; over budget decreases by one to a floor of zero; twice elapsed below budget increases by one to a ceiling of four; otherwise preserves rank. Prove range, pin preservation, step-size at most one and the budget cases on this finite bounded domain. Verify the actual generated root with the pinned SDK before any integration claim.
- Oracle: existing `cs_lod` plus an independent simple table/spec evaluator. Cover all rank/pin combinations and threshold neighborhoods 0, 8,332, 8,333, 8,334, 16,665, 16,666, 16,667, 1,000,000; include malformed text, excessive requests, invalid ranks, NaN/infinity and fractional host times. Exhaustively compare the scalar policy domain separately from expensive fresh-instance runs; do not instantiate millions of Text/1 guests to test the same branch classes.
- Compare a small Text/1 sidecar against generated Rust compiled into the persistent engine. Use existing pinned integration rules and preserve generated-source provenance. Text/1 is an experiment in overhead and correctness, not the assumed production winner.
- Measure cold compile/instantiate latency, warm policy-only execution, end-to-end encode/copy/parse/dispatch time, p50/p95/p99 over a declared request count, allocations/memory growth, binary delta and failure count. Later measure actual frame CPU/GPU timing on named target devices only if the policy changes rendering. Report memoized and uncached paths separately and retain the existing numeric Wasm policy as baseline.
- Acceptance: exact agreement on the bounded policy domain; all malformed cases refused; no unbounded memory growth in the proposed integration; no claimed speed win unless end-to-end measurements show one. This proves/validates the **policy and its adapter**, not higher FPS, perceptual quality, geometry correctness or Three shader equivalence.

A second prototype could be conservative fixed-point AABB/frustum classification, but only after defining coordinate bounds, quantization error and a no-false-negative margin against Three's float oracle. General projection, trigonometry and per-vertex geometry are premature first targets given the numeric and transport boundaries above.

## Snapshot identity and limitations

Repository HEADs observed: cs1.618 `348f20b929b0c627ef05b63088807f461dcf6434`; Verdant `9b6c14d4b756b09faecf61b9f61cf894155f52c9`; LexLean `71defb4c663aaec5b9a3aab04cbc6a03e7106227`; PrismPM `f465664167bdaccef13c37921c057e49d0883126`; UORust `9d1f379676aa1099c4b88093608a37a66ba819f6`. HEAD does not assert clean working trees. AGENTS.md read in each upstream repository; no product modifications or acceptance claims were made. No throughput, numerical accuracy or visual improvement is asserted from this source inspection.
