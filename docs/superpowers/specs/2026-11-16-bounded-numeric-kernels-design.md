# Bounded numeric kernels for cs1.618

## Intent and scope

Implement the next three authorized steps: arithmetic that avoids the observed large-Nat overflow, actual floating-point root export and native/Wasm execution, and a measured use in the game's rendering pipeline. Upstream PRs are postponed. Work in the game-owned numeric package first; the original generic UORust Prelude remains refused.

The first end-to-end operation set is complete binary32 and binary64 multiplication and division. Multiplication needs a 106-bit exact significand product; division will produce quotient bits with bounded remainder instead of materializing the old 160-bit numerator. These operations cover a real rendering use: converting the HD governor's accumulated frame seconds and frame count to mean microseconds. This does not implement all IEEE operations, all UORust float closures, decimal-literal conversion, GPU math, or a Three.js replacement. Addition/subtraction, square root, single-round FMA, conversions and the original generic closure remain explicitly tracked follow-on capabilities.

## Approaches and decisions

1. Changing all production Nat to arbitrary precision would alter the SDK/runtime and affect every existing guest. Reject for this phase.
2. A generic 384/512-bit emulation of the old Prelude preserves its shape but increases state and proof/ABI costs; decimal conversion is still unbounded. Retain as research, not the selected implementation.
3. Select game-owned fixed-format operations using four UInt32 limbs (128 bits), source-owned LexLean definitions, and the unchanged game SDK. This fits multiplication exactly and allows bounded quotient generation. This is the implementer's autonomous design choice, not a claimed user preference.

## Numeric contract

- External values are raw IEEE bit patterns: UInt32 for binary32 and UInt64 for binary64. No runtime exponent/fraction-width parameters or decimal parsing.
- Rounding is nearest, ties to even; preserve gradual underflow and signed zero. Numeric overflow produces the appropriate signed infinity. Invalid zero-times-infinity and zero/zero or infinity/infinity division produce positive canonical quiet NaN.
- First NaN operand wins, with its sign/payload preserved and quiet bit set. Oracle comparisons check that named policy separately from host NaN choices.
- Four little-endian UInt32 limbs represent exact unsigned 128-bit values. A schoolbook multiply cell is bounded by `(2^32-1)^2 + 2*(2^32-1) = 2^64-1`. Internal conversions, carries, shift counts and loops require explicit bounds; checked-operation failure must be observable, never replaced by an apparently valid zero.
- Division uses at most the precision plus guard/sticky work needed by the declared format; every remainder step has a stated bound. Do not use a huge shifted Nat numerator.
- Public wrapper statuses: 0 success, 1 unsupported operation, 2 generated arithmetic failure, 3 invalid renderer-domain input. Read result bits only after status0. No trap/unwrap/default-zero error masking.

## Export, proof and evidence

The existing game lock remains `ghcr.io/uor-foundation/prismpm-sdk@sha256:d6c263a733a6bc36e0458c3f5b9a1f5ea9c14dfbe8c257d3f650a960b5fe633c`. This is distinct from the UORust c1 SDK. Record actual compiler/target/semantic identities. Build and verify actual mul32/mul64/div32/div64 roots, preserve the complete hidden production bundles, then compile emitted Rust to native and import-free Wasm. Never substitute handwritten Rust/JS arithmetic for the source kernel.

Kernel-checked source/export preservation, universal mathematical bounds, IEEE conformance testing, host ABI validation and rendering performance are separate claim levels. Attempt small bound/equivalence proofs before claiming universal arithmetic correctness. Closed proof-language limitations must be resolved or recorded honestly; sampled differential success is not a universal IEEE proof. Keep registered capability/evidence metadata and negative controls for swapped source, target, bundle and output.

An independent integer/rational oracle generates boundary and seeded bit-pattern vectors; native Rust IEEE operations provide another comparison for non-NaN bits. Include subnormal/normal seams, halfway ties, carry into exponent, overflow/underflow, signs, zeros, infinities and NaNs. Execute the same corpus through the actual native and Wasm artifacts. Preserve failure before repair and hashes tying all results to source.

## Rendering use

Integrate into `src/hd-budget.ts` at its three-second sampling boundary. Compute mean microseconds using validated div64 and mul64, then feed the existing deadband and Verdant `cs_lod` unchanged. Domain: finite nonnegative accumulated seconds, integer frame count1..1,000,000, finite output0..250,000 microseconds. Native/performance quality pins and the rank0..4 range retain their behavior. On unavailable/refused/malformed numeric guest, use the existing host path with explicit diagnostics in the existing read-only diagnostic surface and a bounded console warning; required round/evolution/identity guests remain mandatory. Do not add compiler implementation details to the normal game flow.

Compare the same numeric root through a persistent Wasm instance and the existing Text/1-style boundary, plus the original host computation. Measure initialization, warm batches and full sampling cost; compare final rank decisions at below8000, inclusive8000..20000, and above20000 microseconds. A slower arithmetic kernel may still supply checked-source assurance at this low-frequency boundary; no FPS or Three.js superiority claim follows. Do not replace GPU math or per-object culling based on this benchmark.

The Text/1-style comparison may use a benchmark-only byte/ABI adapter calling the exact admitted generated numeric libraries. Identify its codec, limits, allocation policy and wrapper hashes separately; test its refusals and actual root execution. Label the result as transport measurement, not a Prism-generated Text/1 application or Holo qualification. Existing round-guest timings and host arithmetic cannot substitute for the same numeric roots. A genuinely generated numeric Text/1 application remains a separate follow-on; this comparison does not certify its codec or application pipeline.

## Acceptance

Each admitted operation must export and replay successfully, pass exact-bit boundary/random corpora in native and Wasm, expose failures honestly, and have its actual proof scope recorded. The renderer must preserve reference decisions and pins, expose guest status, and stay within a declared measured sampling budget. Retain LexLean/PrismPM package custody and run relevant game/proof/browser gates before publishing the integration. Unsupported generic compiler roots stay refused. Upstream PR creation is outside this phase.

## Discovered backend constraint and bitwise investigation

The raw LexLean production roots and canonical PrismPM Text/1 app have distinct export backends. Pinned PrismPM Rust codegen rejects mathematical Int, even where the raw exporter provides a checked64-bit representation. Validate a minimal bounded signed or biased-unsigned exponent/loop fixture through actual LCNF and Rust codegen before refactoring shared arithmetic; retain each backend identity and proof scope. Do not infer support or rejection of simplified helper calls from source tables alone.

The user proposed XOR/popcount to avoid multiplication. Exact ordinary significand products require positional weights and carries; carryless XOR multiplication and bipolar popcount dot products have different semantics. Investigate an isolated checked shift/add limb alternative, keeping the tested baseline unchanged until export, exact-bit replay and measured costs justify adoption. A failed export is an experimental result, not admitted arithmetic. This experiment adds no generic compiler primitive and does not imply graphics/FPS improvement.
